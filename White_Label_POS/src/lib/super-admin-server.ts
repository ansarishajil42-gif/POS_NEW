import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { tenants, branches, tenantSettings, orders, platformSettings, staffUsers, auditLogs, inventoryLedger } from "@/server/db/schema";
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
        const rows = await db.select().from(branches).orderBy(sql`${branches.createdAt} DESC`);
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
        .where(sql`${staffUsers.tenantId} = ${data.tenantId} AND ${staffUsers.role} = 'head_office_admin'`)
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
        await db.transaction(async (tx) => {
            const [current] = await tx.select().from(staffUsers).where(eq(staffUsers.id, data.id));
            if (current) {
                await tx.delete(staffUsers).where(eq(staffUsers.id, data.id));
                await logAuditAction({
                    action: "Delete Tenant Admin",
                    entityType: "user",
                    entityId: data.id,
                    tenantId: current.tenantId!,
                    beforeValue: { email: current.email }
                }, tx);
            }
        });
        return { success: true };
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

                const [ledgerCount] = await tx
                    .select({ val: count() })
                    .from(inventoryLedger)
                    .where(eq(inventoryLedger.branchId, data.id));

                if (Number(ledgerCount?.val || 0) > 0) {
                    // Branch has immutable inventory ledger history — mark status as Inactive to preserve audit history
                    await tx.update(branches).set({ status: "Inactive" }).where(eq(branches.id, data.id));
                } else {
                    // Branch has no ledger history — clean up dependent records and remove
                    await tx.execute(sql`DELETE FROM stock_levels WHERE branch_id = ${data.id};`);
                    await tx.execute(sql`DELETE FROM orders WHERE branch_id = ${data.id};`);
                    await tx.execute(sql`DELETE FROM tills WHERE branch_id = ${data.id};`);
                    await tx.execute(sql`DELETE FROM purchase_orders WHERE branch_id = ${data.id};`);
                    await tx.execute(sql`UPDATE staff_users SET branch_id = NULL WHERE branch_id = ${data.id};`);
                    await tx.execute(sql`DELETE FROM aggregator_connections WHERE branch_id = ${data.id};`);
                    await tx.delete(branches).where(eq(branches.id, data.id));
                }

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
            
            if (tenant.name !== data.confirmationValue && tenant.subdomain !== data.confirmationValue) {
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
