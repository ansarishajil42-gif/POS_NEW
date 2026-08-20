import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { tenants, branches, tenantSettings, orders, platformSettings, staffUsers } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import * as argon2 from "argon2";

// Middleware to ensure Super Admin access
async function ensureSuperAdmin() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Super Admin") {
        throw new Error("Unauthorized");
    }
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
            tills: sql<number>`coalesce(sum(distinct ${branches.tillCount}), 0)::int`,
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
                const passwordHash = await argon2.hash(data.adminPassword);

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
                
                return newTenant;
            });
            return { success: true, tenant };
        } catch (error: any) {
            console.error("Tenant creation error:", error);
            if (error.code === '23505') { // Postgres unique violation for email or subdomain
                return { success: false, error: "Email or Subdomain already exists" };
            }
            return { success: false, error: "Failed to create tenant and admin" };
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
            const passwordHash = await argon2.hash(data.password);

            await db.insert(staffUsers).values({
                tenantId: data.tenantId,
                branchId: null,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                passwordHash: passwordHash,
                role: "head_office_admin",
                isActive: true
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
            const updates: any = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address
            };
            if (data.password) {
                updates.passwordHash = await argon2.hash(data.password);
            }

            await db.update(staffUsers).set(updates).where(eq(staffUsers.id, data.id));
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
        await db.delete(staffUsers).where(eq(staffUsers.id, data.id));
        return { success: true };
    });

export const updateTenantStatusServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string; status: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        await db.update(tenants).set({ status: data.status }).where(eq(tenants.id, data.id));
        return { success: true };
    });

export const upgradeTenantPlanServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        // Upgrade Starter -> Growth, Growth -> Enterprise
        const [tenant] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, data.id));
        if (!tenant) return { success: false, error: "Not found" };
        
        const newPlan = tenant.plan === "Starter" ? "Growth" : "Enterprise";
        await db.update(tenants).set({ plan: newPlan }).where(eq(tenants.id, data.id));
        return { success: true, newPlan };
    });

export const downgradeTenantPlanServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        // Downgrade Enterprise -> Growth, Growth -> Starter
        const [tenant] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, data.id));
        if (!tenant) return { success: false, error: "Not found" };
        
        const newPlan = tenant.plan === "Enterprise" ? "Growth" : "Starter";
        await db.update(tenants).set({ plan: newPlan }).where(eq(tenants.id, data.id));
        return { success: true, newPlan };
    });

export const createBranchServerFn = createServerFn({ method: "POST" })
    .validator((d: { tenantId: string; name: string; address: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        const [branch] = await db.insert(branches).values({
            tenantId: data.tenantId,
            name: data.name,
            address: data.address,
        }).returning();
        return { success: true, branch };
    });

export const deleteBranchServerFn = createServerFn({ method: "POST" })
    .validator((d: { id: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        await db.delete(branches).where(eq(branches.id, data.id));
        return { success: true };
    });

export const getGlobalTaxSettingsServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureSuperAdmin();
        return { success: true, vatRate: "5.00", inclusive: true };
    });

export const getAnalyticsServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        await ensureSuperAdmin();
        
        // Calculate real platform GMV
        const result = await db.select({
            totalGmv: sql<number>`coalesce(sum(${orders.total}), 0)::float`
        }).from(orders);

        const totalGmv = result[0]?.totalGmv || 0;

        // Fetch recent system logs (last 5 orders as proxy for activity)
        const recentActivity = await db.select({
            id: orders.id,
            createdAt: orders.createdAt,
            total: orders.total,
            status: orders.status
        })
        .from(orders)
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(5);

        const systemLogs = recentActivity.map(o => [
            new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            "INFO",
            `Order ${o.id.slice(0, 8)} completed for AED ${o.total} (${o.status})`
        ]);

        // Generate real chart data from recent orders
        // For simplicity in SQLite/Postgres compatibility we just fetch all orders and group in JS
        const allOrders = await db.select({
            total: orders.total,
            createdAt: orders.createdAt,
        }).from(orders);

        const salesByDate: Record<string, number> = {};
        allOrders.forEach(o => {
            const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            salesByDate[dateStr] = (salesByDate[dateStr] || 0) + Number(o.total);
        });

        // Ensure we have at least some data points for the chart to look nice
        const platformSeries = Object.keys(salesByDate).length > 0 
            ? Object.entries(salesByDate).map(([date, sales]) => ({
                t: date,
                sales,
                tills: 0, // Hard to calculate historical tills, leaving 0 or active count
                api: Math.floor(Math.random() * 50) + 10 // Synthetic API traffic for visual demo
            }))
            : [{ t: "Today", sales: 0, tills: 0, api: 0 }];

        return { 
            success: true, 
            totalGmv,
            systemLogs,
            platformSeries
        };
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
            // Table might not exist yet
            console.error("Failed to fetch platform settings:", error);
        }
        return { success: true, data: { currency: "AED", timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY" } };
    });

export const updatePlatformSettingsServerFn = createServerFn({ method: "POST" })
    .validator((d: { currency: string; timezone: string; dateFormat: string }) => d)
    .handler(async ({ data }) => {
        try {
            await ensureSuperAdmin();
            const settings = await db.select().from(platformSettings).limit(1);
            if (settings.length > 0) {
                await db.update(platformSettings).set(data).where(eq(platformSettings.id, settings[0].id));
            } else {
                await db.insert(platformSettings).values(data);
            }
            return { success: true };
        } catch (error) {
            console.error("Failed to update platform settings:", error);
            return { success: false };
        }
    });
