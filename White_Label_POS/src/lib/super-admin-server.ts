import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/server/db";
import { tenants, branches, tenantSettings, orders, platformSettings, staffUsers, auditLogs, inventoryLedger, blogPosts, tenantSubscriptions, tenantPayments } from "@/server/db/schema";
import { eq, and, sql, desc, gte, lte, count } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import bcrypt from "bcryptjs";
import { logAuditAction } from "@/lib/audit-logger";
import { z } from "zod";
import { createBranchInternal } from "@/lib/branch-server-helpers";

function redactSecrets(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(redactSecrets);
    }

    const redacted = { ...obj };
    const secretKeys = ['password', 'token', 'secret', 'key', 'pin', 'card'];
    
    for (const key of Object.keys(redacted)) {
        const lowerKey = key.toLowerCase();
        if (secretKeys.some(sk => lowerKey.includes(sk))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object') {
            redacted[key] = redactSecrets(redacted[key]);
        }
    }
    return redacted;
}

// Middleware to ensure Super Admin access
async function ensureSuperAdmin() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Super Admin") {
        throw new Error("Unauthorized");
    }
    return res.session;
}

export const getTenantsServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureSuperAdmin();
        
        // Fetch tenants with counts of branches, tills, and orders
        const rows = await db.select({
            id: tenants.id,
            name: tenants.name,
            subdomain: tenants.subdomain,
            plan: tenants.plan,
            status: tenants.status,
            createdAt: tenants.createdAt,
            outlets: sql<number>`count(distinct ${branches.id})::int`,
            tills: sql<number>`coalesce((SELECT sum(till_count) FROM branches WHERE tenant_id = tenants.id), 0)::int`,
            monthlyOrders: sql<number>`count(distinct ${orders.id})::int`,
        })
        .from(tenants)
        .leftJoin(branches, eq(tenants.id, branches.tenantId))
        .leftJoin(orders, eq(tenants.id, orders.tenantId))
        .groupBy(tenants.id)
        .orderBy(sql`${tenants.createdAt} DESC`);

        return { success: true, tenants: rows };
    });

export const getBranchesServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureSuperAdmin();
        const rows = await db.select().from(branches).where(eq(branches.status, "Active")).orderBy(sql`${branches.createdAt} DESC`);
        return { success: true, branches: rows };
    });

export const createTenantServerFn = createServerFn({ method: "POST" })
    .validator((d: { 
        name: string; subdomain: string; plan: string; trn: string;
        adminName: string; adminEmail: string; adminPhone: string; adminAddress: string; adminPassword: string;
    }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        
        try {
            const tenant = await db.transaction(async (tx) => {
                // Insert tenant
                const [newTenant] = await tx.insert(tenants).values({
                    name: data.name,
                    subdomain: data.subdomain,
                    plan: data.plan,
                    status: "Active",
                }).returning();

                // Insert settings
                await tx.insert(tenantSettings).values({
                    tenantId: newTenant.id,
                    taxRegistrationNumber: data.trn,
                });
                
                // Hash password
                const passwordHash = await bcrypt.hash(data.adminPassword, 10);

                // Insert Head Office Admin (branchId: null)
                await tx.insert(staffUsers).values({
                    tenantId: newTenant.id,
                    branchId: null,
                    name: data.adminName,
                    email: data.adminEmail,
                    phone: data.adminPhone,
                    address: data.adminAddress,
                    passwordHash: passwordHash,
                    role: "head_office_admin",
                    isActive: true
                });

                // Create initial tenant subscription record
                const subStartDate = new Date();
                const subEndDate = new Date(subStartDate);
                subEndDate.setMonth(subEndDate.getMonth() + 1);

                await tx.insert(tenantSubscriptions).values({
                    tenantId: newTenant.id,
                    billingCycle: "monthly",
                    subscriptionStartDate: subStartDate,
                    currentPeriodEndDate: subEndDate,
                    status: "active"
                });

                await logAuditAction({
                    action: "Create Tenant",
                    entityType: "tenant",
                    entityId: newTenant.id,
                    tenantId: newTenant.id,
                    afterValue: {
                        name: data.name,
                        subdomain: data.subdomain,
                        plan: data.plan,
                        trn: data.trn,
                        adminName: data.adminName,
                        adminEmail: data.adminEmail,
                        status: "Active"
                    }
                }, tx);
                
                return newTenant;
            });
            return { success: true, tenant };
        } catch (error: any) {
            console.error("Tenant creation error:", error);
            if (error.code === '23505') { 
                return { success: false, error: "Email or Subdomain already exists" };
            }
            if (error.code === '23502') {
                return { success: false, error: "Missing required field: " + (error.column || "Unknown") };
            }
            return { success: false, error: "Failed to create tenant and admin: " + (error.message || "Unknown database error") };
        }
    });

export const updateTenantServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string; name: string; subdomain: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        try {
            return await db.transaction(async (tx) => {
                const [current] = await tx.select().from(tenants).where(eq(tenants.id, data.id));
                if (!current) throw new Error("Tenant not found");

                const subdomainCheck = await tx.select().from(tenants).where(and(eq(tenants.subdomain, data.subdomain), sql`${tenants.id} != ${data.id}`));
                if (subdomainCheck.length > 0) {
                    throw new Error("Subdomain already exists");
                }

                await tx.update(tenants).set({ name: data.name, subdomain: data.subdomain }).where(eq(tenants.id, data.id));
                
                await logAuditAction({
                    action: "Update Tenant Profile",
                    entityType: "tenant",
                    entityId: data.id,
                    tenantId: data.id,
                    beforeValue: { name: current.name, subdomain: current.subdomain },
                    afterValue: { name: data.name, subdomain: data.subdomain }
                }, tx);

                return { success: true };
            });
        } catch (error: any) {
            return { success: false, error: error.message || "Failed to update tenant" };
        }
    });

export const updateTenantLimitsServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string; outletLimit: number; tillLimit: number; monthlyOrderLimit: number }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        if (data.outletLimit < 0 || data.tillLimit < 0 || data.monthlyOrderLimit < 0) {
            return { success: false, error: "Limits cannot be negative" };
        }
        try {
            return await db.transaction(async (tx) => {
                const [current] = await tx.select().from(tenants).where(eq(tenants.id, data.id)).for('update');
                if (!current) throw new Error("Tenant not found");

                // Check outlet limit against active branches
                const activeBranches = await tx.select({ count: sql<number>`count(*)::int` }).from(branches).where(eq(branches.tenantId, data.id));
                if (activeBranches[0].count > data.outletLimit) {
                    throw new Error(`Outlet limit cannot be less than current usage (${activeBranches[0].count})`);
                }

                // Check till limit against active tills across this tenant
                const { tills } = await import("@/server/db/schema");
                const activeTills = await tx.select({ count: sql<number>`count(*)::int` }).from(tills).where(eq(tills.tenantId, data.id));
                if (activeTills[0].count > data.tillLimit) {
                    throw new Error(`Till limit cannot be less than current usage (${activeTills[0].count})`);
                }

                // Check monthly order limit
                const uaeDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" });
                const uaeDate = new Date(uaeDateStr);
                const startOfMonthUae = new Date(uaeDate.getFullYear(), uaeDate.getMonth(), 1);
                const startOfMonthUtc = new Date(startOfMonthUae.getTime() - 4 * 60 * 60 * 1000);
                
                const currentMonthOrders = await tx.select({ count: sql<number>`count(*)::int` }).from(orders).where(
                    and(
                        eq(orders.tenantId, data.id),
                        sql`${orders.createdAt} >= ${startOfMonthUtc.toISOString()}`
                    )
                );
                
                if (currentMonthOrders[0].count > data.monthlyOrderLimit) {
                    throw new Error(`Monthly order limit cannot be less than current month usage (${currentMonthOrders[0].count})`);
                }

                await tx.update(tenants).set({
                    outletLimit: data.outletLimit,
                    tillLimit: data.tillLimit,
                    monthlyOrderLimit: data.monthlyOrderLimit
                }).where(eq(tenants.id, data.id));

                await logAuditAction({
                    action: "Update Tenant Limits",
                    entityType: "tenant",
                    entityId: data.id,
                    tenantId: data.id,
                    beforeValue: { outletLimit: current.outletLimit, tillLimit: current.tillLimit, monthlyOrderLimit: current.monthlyOrderLimit },
                    afterValue: { outletLimit: data.outletLimit, tillLimit: data.tillLimit, monthlyOrderLimit: data.monthlyOrderLimit }
                }, tx);

                return { success: true };
            });
        } catch (error: any) {
            return { success: false, error: error.message || "Failed to update tenant limits" };
        }
    });

export const getTenantAdminServerFn = createServerFn({ method: "GET" })
    .validator((d: { tenantId: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        
        const [admin] = await db.select({
            id: staffUsers.id,
            name: staffUsers.name,
            email: staffUsers.email,
            phone: staffUsers.phone,
            address: staffUsers.address,
            role: staffUsers.role,
            isActive: staffUsers.isActive,
            createdAt: staffUsers.createdAt
        })
        .from(staffUsers)
        .where(and(eq(staffUsers.tenantId, data.tenantId), eq(staffUsers.role, 'head_office_admin'), eq(staffUsers.isActive, true)))
        .limit(1);
        
        if (!admin) return { success: true, admin: null };
        return { success: true, admin };
    });

export const createExistingTenantAdminServerFn = createServerFn({ method: "POST" })
    .validator((d: { 
        tenantId: string;
        name: string; email: string; phone: string; address: string; password: string;
    }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        
        try {
            const passwordHash = await bcrypt.hash(data.password, 10);

            await db.transaction(async (tx) => {
                const [newUser] = await tx.insert(staffUsers).values({
                    tenantId: data.tenantId,
                    branchId: null,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    passwordHash: passwordHash,
                    role: "head_office_admin",
                    isActive: true
                }).returning();

                await logAuditAction({
                    action: "Create Tenant Admin",
                    entityType: "user",
                    entityId: newUser.id,
                    tenantId: data.tenantId,
                    afterValue: { email: data.email, name: data.name }
                }, tx);
            });
            
            return { success: true };
        } catch (error: any) {
            console.error("Existing tenant admin creation error:", error);
            if (error.code === '23505') { // Postgres unique violation for email
                return { success: false, error: "Email already exists" };
            }
            return { success: false, error: "Failed to create admin" };
        }
    });

export const updateTenantAdminServerFn = createServerFn({ method: "POST" })
    .validator((d: { 
        id: string;
        name: string; email: string; phone: string; address: string; password?: string;
    }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        
        try {
            await db.transaction(async (tx) => {
                const [current] = await tx.select().from(staffUsers).where(eq(staffUsers.id, data.id));
                if (!current) throw new Error("Admin not found");

                const updates: any = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address
                };
                if (data.password) {
                    updates.passwordHash = await bcrypt.hash(data.password, 10);
                }

                await tx.update(staffUsers).set(updates).where(eq(staffUsers.id, data.id));

                await logAuditAction({
                    action: "Update Tenant Admin",
                    entityType: "user",
                    entityId: data.id,
                    tenantId: current.tenantId!,
                    beforeValue: { name: current.name, email: current.email },
                    afterValue: { name: data.name, email: data.email }
                }, tx);
            });
            return { success: true };
        } catch (error: any) {
            console.error("Existing tenant admin update error:", error);
            if (error.code === '23505') {
                return { success: false, error: "Email already exists" };
            }
            return { success: false, error: "Failed to update admin" };
        }
    });

export const deleteTenantAdminServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        try {
            const [current] = await db.select().from(staffUsers).where(eq(staffUsers.id, data.id));
            if (!current) return { success: true };

            try {
                await db.delete(staffUsers).where(eq(staffUsers.id, data.id));
            } catch (err: any) {
                await db.update(staffUsers).set({ isActive: false }).where(eq(staffUsers.id, data.id));
            }

            if (current.tenantId) {
                await logAuditAction({
                    action: "Delete Tenant Admin",
                    entityType: "user",
                    entityId: data.id,
                    tenantId: current.tenantId,
                    beforeValue: { email: current.email }
                });
            }

            return { success: true };
        } catch (e: any) {
            console.error("Error deleting tenant admin:", e);
            return { success: false, error: e.message };
        }
    });

export const updateTenantStatusServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string; status: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        await db.transaction(async (tx) => {
            const [current] = await tx.select().from(tenants).where(eq(tenants.id, data.id));
            await tx.update(tenants).set({ status: data.status }).where(eq(tenants.id, data.id));
            await logAuditAction({
                action: "Update Tenant Status",
                entityType: "tenant",
                entityId: data.id,
                tenantId: data.id,
                beforeValue: { status: current?.status },
                afterValue: { status: data.status }
            }, tx);
        });
        return { success: true };
    });

export const upgradeTenantPlanServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        let newPlan = "";
        await db.transaction(async (tx) => {
            const [tenant] = await tx.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, data.id));
            if (!tenant) throw new Error("Not found");
            
            newPlan = tenant.plan === "Starter" ? "Growth" : "Enterprise";
            await tx.update(tenants).set({ plan: newPlan }).where(eq(tenants.id, data.id));

            await logAuditAction({
                action: "Upgrade Tenant Plan",
                entityType: "tenant",
                entityId: data.id,
                tenantId: data.id,
                beforeValue: { plan: tenant.plan },
                afterValue: { plan: newPlan }
            }, tx);
        });
        return { success: true, newPlan };
    });

export const downgradeTenantPlanServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        let newPlan = "";
        await db.transaction(async (tx) => {
            const [tenant] = await tx.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, data.id));
            if (!tenant) throw new Error("Not found");
            
            newPlan = tenant.plan === "Enterprise" ? "Growth" : "Starter";
            await tx.update(tenants).set({ plan: newPlan }).where(eq(tenants.id, data.id));

            await logAuditAction({
                action: "Downgrade Tenant Plan",
                entityType: "tenant",
                entityId: data.id,
                tenantId: data.id,
                beforeValue: { plan: tenant.plan },
                afterValue: { plan: newPlan }
            }, tx);
        });
        return { success: true, newPlan };
    });

export const createBranchServerFn = createServerFn({ method: "POST" })
    .validator((d: { tenantId: string; name: string; address: string }) => d)
    .handler(async ({ data }) => {
        const session = await ensureSuperAdmin();
        try {
            const branch = await createBranchInternal({
                tenantId: data.tenantId,
                name: data.name,
                address: data.address,
                userId: session.userId,
            });
            return { success: true, branchId: branch.id };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

export const deleteBranchServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        try {
            await db.transaction(async (tx) => {
                const [current] = await tx.select().from(branches).where(eq(branches.id, data.id));
                if (!current) return;

                // Deactivate branch cleanly in DB (immediately hides branch without hitting foreign-key constraints on POs, inventory, or orders)
                await tx.update(branches).set({ status: "Inactive" }).where(eq(branches.id, data.id));

                await logAuditAction({
                    action: "Delete Branch",
                    entityType: "branch",
                    entityId: data.id,
                    tenantId: current.tenantId,
                    beforeValue: { name: current.name }
                }, tx);
            });
            return { success: true };
        } catch (e: any) {
            console.error("Error deleting branch:", e);
            return { success: false, error: e.message };
        }
    });

export const getGlobalTaxSettingsServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureSuperAdmin();
        const [settings] = await db.select().from(platformSettings).limit(1);
        if (settings) {
            return { success: true, vatRate: settings.vatRate, inclusive: settings.vatInclusive };
        }
        return { success: true, vatRate: "5.00", inclusive: true };
    });

export const updateGlobalTaxSettingsServerFn = createServerFn({ method: "POST" })
    .validator((d: { vatRate: string; inclusive: boolean }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        try {
            await db.transaction(async (tx) => {
                const settings = await tx.select().from(platformSettings).limit(1);
                if (settings.length > 0) {
                    await tx.update(platformSettings).set({ vatRate: data.vatRate, vatInclusive: data.inclusive }).where(eq(platformSettings.id, settings[0].id));
                } else {
                    await tx.insert(platformSettings).values({ vatRate: data.vatRate, vatInclusive: data.inclusive });
                }

                await logAuditAction({
                    action: "Update Global Tax Settings",
                    entityType: "platformSettings",
                    entityId: "global",
                    afterValue: { vatRate: data.vatRate, vatInclusive: data.inclusive }
                }, tx);
            });
            return { success: true };
        } catch (error) {
            console.error("Failed to update global tax settings:", error);
            return { success: false, error: "Failed to update tax settings" };
        }
    });

export const getPlatformSettingsServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            await ensureSuperAdmin();
            const settings = await db.select().from(platformSettings).limit(1);
            if (settings.length > 0) {
                return { success: true, data: settings[0] };
            }
        } catch (error) {
            console.error("Failed to fetch platform settings:", error);
        }
        return { success: true, data: { currency: "AED", timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY" } };
    });

export const updatePlatformSettingsServerFn = createServerFn({ method: "POST" })
    .validator((d: { currency: string; timezone: string; dateFormat: string }) => d)
    .handler(async ({ data }) => {
        try {
            await ensureSuperAdmin();
            await db.transaction(async (tx) => {
                const settings = await tx.select().from(platformSettings).limit(1);
                if (settings.length > 0) {
                    await tx.update(platformSettings).set(data).where(eq(platformSettings.id, settings[0].id));
                } else {
                    await tx.insert(platformSettings).values(data);
                }

                await logAuditAction({
                    action: "Update Platform Settings",
                    entityType: "platformSettings",
                    entityId: "global",
                    afterValue: data
                }, tx);
            });
            return { success: true };
        } catch (error) {
            console.error("Failed to update platform settings:", error);
            return { success: false };
        }
    });

export const getAuditLogsServerFn = createServerFn({ method: "GET" })
    .validator((d: { page?: number; limit?: number; tenantId?: string; actorId?: string; action?: string; entityType?: string; startDate?: string; endDate?: string }) => d)
    .handler(async ({ data }) => {
        const sessionRes = await getSessionServerFn();
        if (!sessionRes.success || !sessionRes.session) {
            throw new Error("Unauthorized");
        }

        let forcedTenantId = data.tenantId;

        if (sessionRes.session.role !== "Super Admin") {
            if (sessionRes.session.role !== "Head Office Admin") {
                throw new Error("Unauthorized");
            }
            forcedTenantId = sessionRes.session.tenantId;
        }

        const page = data.page || 1;
        const pageSize = data.limit ? Math.min(data.limit, 100) : 50;
        const offset = (page - 1) * pageSize;

        let query = db.select().from(auditLogs);
        const conditions = [];

        if (forcedTenantId) conditions.push(eq(auditLogs.tenantId, forcedTenantId));
        if (data.actorId) conditions.push(eq(auditLogs.userId, data.actorId));
        if (data.action) conditions.push(eq(auditLogs.action, data.action));
        if (data.entityType) conditions.push(eq(auditLogs.entityType, data.entityType));
        if (data.startDate) conditions.push(gte(auditLogs.createdAt, new Date(data.startDate)));
        if (data.endDate) conditions.push(lte(auditLogs.createdAt, new Date(data.endDate)));

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const rows = await query.orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset(offset);

        // Safely redact any secrets dynamically
        const safeLogs = rows.map(r => ({
            ...r,
            details: redactSecrets(r.details)
        }));

        return { success: true as const, logs: safeLogs as any[] };
    });

export const getAnalyticsServerFn = createServerFn({ method: "GET" })
    .validator((d: { startDate?: string; endDate?: string; tenantId?: string } | undefined) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        
        let orderQuery = db.select({
            id: orders.id,
            total: orders.total,
            createdAt: orders.createdAt,
            status: orders.status
        }).from(orders);

        const conditions = [];
        if (data?.tenantId) conditions.push(eq(orders.tenantId, data.tenantId));
        if (data?.startDate) conditions.push(gte(orders.createdAt, new Date(data.startDate)));
        if (data?.endDate) conditions.push(lte(orders.createdAt, new Date(data.endDate)));

        if (conditions.length > 0) {
            orderQuery = orderQuery.where(and(...conditions)) as any;
        }

        const allOrders = await orderQuery;

        let totalGmv = 0;
        const salesByDate: Record<string, number> = {};

        allOrders.forEach(o => {
            totalGmv += Number(o.total);
            const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            salesByDate[dateStr] = (salesByDate[dateStr] || 0) + Number(o.total);
        });

        const platformSeries = Object.keys(salesByDate).length > 0 
            ? Object.entries(salesByDate).map(([date, sales]) => ({
                t: date,
                sales,
                tills: 0, 
                api: 0 // Removed Math.random() as requested
            }))
            : [{ t: "Today", sales: 0, tills: 0, api: 0 }];

        // Tenant Distribution logic
        const allTenants = await db.select({
            status: tenants.status
        }).from(tenants);
        
        let activeTenantsCount = 0;
        let suspendedTenantsCount = 0;
        let trialTenantsCount = 0;
        let totalTenantsCount = allTenants.length;

        for (const t of allTenants) {
            if (t.status === 'Active') activeTenantsCount++;
            else if (t.status === 'Suspended') suspendedTenantsCount++;
            else if (t.status === 'Trial') trialTenantsCount++;
        }

        // Fetch real system events instead of recent orders
        let auditQuery = db.select({
            createdAt: auditLogs.createdAt,
            action: auditLogs.action,
            entityType: auditLogs.entityType,
            details: auditLogs.details
        }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);

        if (data?.tenantId) {
            auditQuery = auditQuery.where(eq(auditLogs.tenantId, data.tenantId)) as any;
        }

        const recentAudits = await auditQuery;

        const systemLogs = recentAudits.map(a => {
            const time = new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return [time, "INFO", `${a.action} on ${a.entityType}`];
        });

        return { 
            success: true, 
            totalGmv,
            systemLogs,
            platformSeries,
            tenantStats: {
                total: totalTenantsCount,
                active: activeTenantsCount,
                suspended: suspendedTenantsCount,
                trial: trialTenantsCount
            }
        };
    });

export const archiveTenantServerFn = createServerFn({ method: "POST" })
    .validator((d: { tenantId: string; confirmationValue: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        const res = await getSessionServerFn();
        
        let result: any = null;

        await db.transaction(async (tx) => {
            const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, data.tenantId)).for('update');
            if (!tenant) throw new Error("Tenant not found.");
            
            const normalizedConfirm = (data.confirmationValue || "").trim().toLowerCase();
            const normalizedName = (tenant.name || "").trim().toLowerCase();
            const normalizedSubdomain = (tenant.subdomain || "").trim().toLowerCase();

            if (normalizedName !== normalizedConfirm && normalizedSubdomain !== normalizedConfirm) {
                throw new Error("Confirmation value does not match tenant name or subdomain.");
            }

            if (tenant.status === "Archived") {
                result = { success: true, message: "Tenant is already archived." };
                return;
            }

            await tx.update(tenants).set({ status: "Archived" }).where(eq(tenants.id, data.tenantId));

            await logAuditAction({
                action: "Archive Tenant",
                entityType: "tenant",
                entityId: data.tenantId,
                tenantId: data.tenantId,
                beforeValue: { status: tenant.status },
                afterValue: { status: "Archived" }
            }, tx);
            
            result = { success: true, message: "Tenant successfully archived." };
        });

        return result;
    });

export const getBlogPostsFn = createServerFn()
  .handler(async () => {
    await ensureSuperAdmin();
    try {
      const posts = await db.query.blogPosts.findMany({
        orderBy: desc(blogPosts.createdAt),
      });
      return { success: true, posts };
    } catch (e: any) {
      throw new Error(e.message);
    }
  });

export const createBlogPostFn = createServerFn({ method: "POST" })
  .validator((d: {
    title: string;
    slug: string;
    coverImageUrl?: string;
    shortDescription: string;
    content: string;
    status: string;
    authorName?: string;
  }) => d)
  .handler(async ({ data }) => {
    const session = await ensureSuperAdmin();
    try {
      const existing = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, data.slug),
      });
      if (existing) {
        throw new Error("Slug must be unique");
      }

      const [newPost] = await db.insert(blogPosts).values({
        title: data.title,
        slug: data.slug,
        coverImageUrl: data.coverImageUrl || null,
        shortDescription: data.shortDescription,
        content: data.content,
        status: data.status || "Draft",
        authorName: data.authorName || "Admin",
        publishedAt: data.status === "Published" ? new Date() : null,
      }).returning();

      await logAuditAction({
        action: "Create Blog Post",
        entityType: "blog_post",
        entityId: newPost.id,
        tenantId: session.tenantId,
        userId: session.userId,
        afterValue: newPost,
      });

      return { success: true, post: newPost };
    } catch (e: any) {
      throw new Error(e.message);
    }
  });

export const updateBlogPostFn = createServerFn({ method: "POST" })
  .validator((d: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string;
    shortDescription: string;
    content: string;
    status: string;
    authorName?: string;
  }) => d)
  .handler(async ({ data }) => {
    const session = await ensureSuperAdmin();
    try {
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.id, data.id),
      });
      if (!post) {
        throw new Error("Blog post not found");
      }

      if (data.slug && data.slug !== post.slug) {
        const existing = await db.query.blogPosts.findFirst({
          where: eq(blogPosts.slug, data.slug),
        });
        if (existing) {
          throw new Error("Slug must be unique");
        }
      }

      const updates: any = {
        title: data.title,
        slug: data.slug,
        coverImageUrl: data.coverImageUrl || null,
        shortDescription: data.shortDescription,
        content: data.content,
        status: data.status,
        authorName: data.authorName || "Admin",
        updatedAt: new Date(),
      };

      if (data.status === "Published" && post.status !== "Published") {
        updates.publishedAt = new Date();
      } else if (data.status === "Draft" && post.status === "Published") {
        updates.publishedAt = null;
      }

      const [updatedPost] = await db.update(blogPosts)
        .set(updates)
        .where(eq(blogPosts.id, data.id))
        .returning();

      await logAuditAction({
        action: "Update Blog Post",
        entityType: "blog_post",
        entityId: data.id,
        tenantId: session.tenantId,
        userId: session.userId,
        afterValue: updatedPost,
      });

      return { success: true, post: updatedPost };
    } catch (e: any) {
      throw new Error(e.message);
    }
  });

export const deleteBlogPostFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const session = await ensureSuperAdmin();
    try {
      const deleted = await db.delete(blogPosts)
        .where(eq(blogPosts.id, data.id))
        .returning();
      if (deleted.length === 0) {
        throw new Error("Blog post not found");
      }

      await logAuditAction({
        action: "Delete Blog Post",
        entityType: "blog_post",
        entityId: data.id,
        tenantId: session.tenantId,
        userId: session.userId,
        beforeValue: deleted[0],
      });

      return { success: true };
    } catch (e: any) {
      throw new Error(e.message);
    }
  });

function getSupabaseClient() {
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYXV1enVka3ZieGVjcHVrc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMyNTAsImV4cCI6MjEwMjYxOTI1MH0.6byNsZMv_zZnUQX75dUzaEANWhfXx7XExUE-ZQ-RO2w";
  const supabaseUrl = process.env.SUPABASE_URL || "https://agauuzudkvbxecpukshq.supabase.co";
  return createClient(supabaseUrl, supabaseKey);
}

export const uploadBlogCoverFn = createServerFn({ method: "POST" })
  .validator((d: { base64Data: string; fileName: string; mimeType: string }) => d)
  .handler(async ({ data }) => {
    await ensureSuperAdmin();
    try {
      const supabaseClient = getSupabaseClient();
      const buffer = Buffer.from(data.base64Data, "base64");
      const fileExt = data.fileName.split(".").pop();
      const newFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `covers/${newFileName}`;

      const { data: uploadData, error } = await supabaseClient.storage
        .from("blog-covers")
        .upload(filePath, buffer, {
          contentType: data.mimeType,
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from("blog-covers")
        .getPublicUrl(filePath);

      return { success: true, publicUrl: publicUrlData.publicUrl };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

export function calculateNextDueDate(startDate: Date, billingCycle: string, customDays?: number): Date {
    const nextDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (billingCycle === "quarterly") {
        nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (billingCycle === "6_months") {
        nextDate.setMonth(nextDate.getMonth() + 6);
    } else if (billingCycle === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else if (billingCycle === "custom") {
        const days = customDays && customDays > 0 ? customDays : 30;
        nextDate.setDate(nextDate.getDate() + days);
    } else {
        // default 'monthly'
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
}

export function computeSubscriptionStatus(currentPeriodEndDate: Date | string | null): "active" | "due_soon" | "overdue" | "no_record" {
    if (!currentPeriodEndDate) return "no_record";
    const now = new Date();
    const endDate = new Date(currentPeriodEndDate);
    if (isNaN(endDate.getTime())) return "no_record";

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dueStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    if (todayStr > dueStr) {
        return "overdue";
    }

    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

    const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
        return "due_soon";
    }

    return "active";
}

export const getBillingOverviewServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureSuperAdmin();

        try {
            const tenantRows = await db.select().from(tenants).where(sql`${tenants.status} != 'Archived'`).orderBy(sql`${tenants.createdAt} DESC`);
            const subRows = await db.select().from(tenantSubscriptions);
            const paymentRows = await db.select().from(tenantPayments).orderBy(sql`${tenantPayments.paymentDate} DESC`);

            let totalRevenue = 0;
            paymentRows.forEach(p => {
                totalRevenue += Number(p.amount || 0);
            });

            const tenantBillingList = await Promise.all(tenantRows.map(async t => {
                const sub = subRows.find(s => s.tenantId === t.id);
                const tPayments = paymentRows.filter(p => p.tenantId === t.id);
                
                const computedStatus = sub ? computeSubscriptionStatus(sub.currentPeriodEndDate) : "no_record";
                
                if (sub && sub.status !== computedStatus) {
                    await db.update(tenantSubscriptions)
                        .set({ status: computedStatus, updatedAt: new Date() })
                        .where(eq(tenantSubscriptions.id, sub.id));
                }

                const lastPayment = tPayments.length > 0 ? tPayments[0] : null;
                const totalPaid = tPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                let punctuality = "Never Paid / No Billing Record";
                if (computedStatus === "overdue" && sub?.currentPeriodEndDate) {
                    const nowTime = new Date().setHours(0, 0, 0, 0);
                    const dueTime = new Date(sub.currentPeriodEndDate).setHours(0, 0, 0, 0);
                    const overdueDays = Math.max(1, Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24)));
                    punctuality = `Payment Overdue (${overdueDays} day${overdueDays > 1 ? 's' : ''})`;
                } else if (lastPayment) {
                    const pTime = new Date(lastPayment.paymentDate).setHours(0, 0, 0, 0);
                    const sTime = new Date(lastPayment.periodCoveredStart).setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((pTime - sTime) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0) {
                        punctuality = `Paid Late (by ${diffDays} day${diffDays > 1 ? 's' : ''})`;
                    } else {
                        punctuality = "Paid On Time";
                    }
                }

                return {
                    tenantId: t.id,
                    tenantName: t.name,
                    subdomain: t.subdomain,
                    plan: t.plan,
                    status: computedStatus,
                    punctuality,
                    billingCycle: sub ? sub.billingCycle : null,
                    customDays: sub ? sub.customDays : null,
                    subscriptionStartDate: sub ? sub.subscriptionStartDate : null,
                    currentPeriodEndDate: sub ? sub.currentPeriodEndDate : null,
                    lastPaymentAmount: lastPayment ? Number(lastPayment.amount) : null,
                    lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
                    totalPaid,
                    paymentCount: tPayments.length
                };
            }));

            const overdueTenants = tenantBillingList.filter(t => t.status === "overdue");
            const dueSoonTenants = tenantBillingList.filter(t => t.status === "due_soon");

            return {
                success: true,
                overview: {
                    totalTenants: tenantRows.length,
                    totalRevenueCollected: totalRevenue,
                    overdueCount: overdueTenants.length,
                    dueSoonCount: dueSoonTenants.length,
                    totalOverdueAmount: overdueTenants.length
                },
                tenants: tenantBillingList
            };
        } catch (error: any) {
            console.error("Fetch billing overview error:", error);
            return { success: false, error: error.message };
        }
    });

export const recordTenantPaymentServerFn = createServerFn({ method: "POST" })
    .validator((d: {
        tenantId: string;
        amount: number;
        paymentDate: string;
        billingCycle: string;
        customDays?: number;
        notes?: string;
    }) => d)
    .handler(async ({ data }) => {
        const session = await ensureSuperAdmin();

        try {
            const pDate = new Date(data.paymentDate); // preserves full timestamp with time

            // Date-only math for subscription period coverage & due date calculation
            const startDateForDueMath = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
            const periodCoveredStart = startDateForDueMath;
            const periodCoveredEnd = calculateNextDueDate(startDateForDueMath, data.billingCycle, data.customDays);

            const recordedBy = session.email || session.name || "Super Admin";

            await db.transaction(async (tx) => {
                await tx.insert(tenantPayments).values({
                    tenantId: data.tenantId,
                    amount: data.amount.toFixed(2),
                    currency: "AED",
                    paymentDate: pDate,
                    periodCoveredStart,
                    periodCoveredEnd,
                    notes: data.notes || null,
                    recordedBy,
                });

                const existingSub = await tx.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, data.tenantId)).limit(1);

                const newStatus = computeSubscriptionStatus(periodCoveredEnd);

                if (existingSub.length > 0) {
                    await tx.update(tenantSubscriptions)
                        .set({
                            billingCycle: data.billingCycle,
                            customDays: data.customDays || null,
                            currentPeriodEndDate: periodCoveredEnd,
                            status: newStatus,
                            updatedAt: new Date()
                        })
                        .where(eq(tenantSubscriptions.id, existingSub[0].id));
                } else {
                    await tx.insert(tenantSubscriptions).values({
                        tenantId: data.tenantId,
                        billingCycle: data.billingCycle,
                        customDays: data.customDays || null,
                        subscriptionStartDate: pDate,
                        currentPeriodEndDate: periodCoveredEnd,
                        status: newStatus
                    });
                }

                await logAuditAction({
                    action: "Record Tenant Payment",
                    entityType: "tenant_payment",
                    entityId: data.tenantId,
                    tenantId: data.tenantId,
                    afterValue: {
                        amount: data.amount,
                        billingCycle: data.billingCycle,
                        paymentDate: data.paymentDate,
                        periodCoveredEnd: periodCoveredEnd.toISOString(),
                        recordedBy
                    }
                }, tx);
            });

            return { success: true, message: "Payment recorded successfully" };
        } catch (error: any) {
            console.error("Record tenant payment error:", error);
            return { success: false, error: error.message };
        }
    });

export const getTenantPaymentHistoryServerFn = createServerFn({ method: "POST" })
    .validator((d: { tenantId: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();

        try {
            const rows = await db.select()
                .from(tenantPayments)
                .where(eq(tenantPayments.tenantId, data.tenantId))
                .orderBy(sql`${tenantPayments.paymentDate} DESC`, sql`${tenantPayments.createdAt} DESC`);

            return { success: true, payments: rows };
        } catch (error: any) {
            console.error("Fetch payment history error:", error);
            return { success: false, error: error.message };
        }
    });

export const updateTenantPaymentServerFn = createServerFn({ method: "POST" })
    .validator((d: {
        paymentId: string;
        tenantId: string;
        amount: number;
        paymentDate: string;
        billingCycle: string;
        customDays?: number;
        notes?: string;
    }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();

        try {
            const pDate = new Date(data.paymentDate);

            // Date-only math for subscription period coverage & due date calculation
            const startDateForDueMath = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
            const periodCoveredStart = startDateForDueMath;
            const periodCoveredEnd = calculateNextDueDate(startDateForDueMath, data.billingCycle, data.customDays);

            await db.transaction(async (tx) => {
                // 1. Update target tenant_payments row
                await tx.update(tenantPayments)
                    .set({
                        amount: data.amount.toFixed(2),
                        paymentDate: pDate,
                        periodCoveredStart,
                        periodCoveredEnd,
                        notes: data.notes || null,
                    })
                    .where(eq(tenantPayments.id, data.paymentId));

                // 2. Query all payments for tenant to find the latest payment date
                const allPayments = await tx.select()
                    .from(tenantPayments)
                    .where(eq(tenantPayments.tenantId, data.tenantId))
                    .orderBy(sql`${tenantPayments.paymentDate} DESC`, sql`${tenantPayments.createdAt} DESC`);

                if (allPayments.length > 0) {
                    const latestPayment = allPayments[0];
                    const newStatus = computeSubscriptionStatus(latestPayment.periodCoveredEnd);

                    const existingSub = await tx.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, data.tenantId)).limit(1);

                    if (existingSub.length > 0) {
                        await tx.update(tenantSubscriptions)
                            .set({
                                billingCycle: data.billingCycle,
                                customDays: data.customDays || null,
                                currentPeriodEndDate: latestPayment.periodCoveredEnd,
                                status: newStatus,
                                updatedAt: new Date()
                            })
                            .where(eq(tenantSubscriptions.id, existingSub[0].id));
                    } else {
                        await tx.insert(tenantSubscriptions).values({
                            tenantId: data.tenantId,
                            billingCycle: data.billingCycle,
                            customDays: data.customDays || null,
                            subscriptionStartDate: latestPayment.periodCoveredStart,
                            currentPeriodEndDate: latestPayment.periodCoveredEnd,
                            status: newStatus
                        });
                    }
                }

                await logAuditAction({
                    action: "Update Tenant Payment",
                    entityType: "tenant_payment",
                    entityId: data.paymentId,
                    tenantId: data.tenantId,
                    afterValue: {
                        amount: data.amount,
                        billingCycle: data.billingCycle,
                        paymentDate: data.paymentDate,
                        periodCoveredEnd: periodCoveredEnd.toISOString()
                    }
                }, tx);
            });

            return { success: true, message: "Payment updated successfully" };
        } catch (error: any) {
            console.error("Update tenant payment error:", error);
            return { success: false, error: error.message };
        }
    });

export const updateTenantDueDateServerFn = createServerFn({ method: "POST" })
    .validator((d: { tenantId: string; newDueDate: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();

        try {
            const dueDate = new Date(data.newDueDate);
            dueDate.setHours(0, 0, 0, 0);

            const newStatus = computeSubscriptionStatus(dueDate);

            await db.transaction(async (tx) => {
                const existingSub = await tx.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, data.tenantId)).limit(1);

                if (existingSub.length > 0) {
                    await tx.update(tenantSubscriptions)
                        .set({
                            currentPeriodEndDate: dueDate,
                            status: newStatus,
                            updatedAt: new Date()
                        })
                        .where(eq(tenantSubscriptions.id, existingSub[0].id));
                } else {
                    await tx.insert(tenantSubscriptions).values({
                        tenantId: data.tenantId,
                        billingCycle: "monthly",
                        subscriptionStartDate: new Date(),
                        currentPeriodEndDate: dueDate,
                        status: newStatus
                    });
                }

                await logAuditAction({
                    action: "Update Tenant Due Date",
                    entityType: "tenant_subscription",
                    entityId: data.tenantId,
                    tenantId: data.tenantId,
                    afterValue: {
                        newDueDate: data.newDueDate,
                        status: newStatus
                    }
                }, tx);
            });

            return { success: true, message: "Due date updated successfully" };
        } catch (error: any) {
            console.error("Update tenant due date error:", error);
            return { success: false, error: error.message };
        }
    });



