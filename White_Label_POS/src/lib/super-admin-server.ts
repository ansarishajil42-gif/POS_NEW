import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { tenants, branches, tenantSettings, orders } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";

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
    .validator((d: { name: string; subdomain: string; plan: string; trn: string }) => d)
    .handler(async ({ data }) => {
        await ensureSuperAdmin();
        
        // Insert tenant
        const [tenant] = await db.insert(tenants).values({
            name: data.name,
            subdomain: data.subdomain,
            plan: data.plan,
            status: "Active",
        }).returning();

        if (tenant) {
            // Insert settings
            await db.insert(tenantSettings).values({
                tenantId: tenant.id,
                taxRegistrationNumber: data.trn,
            });
        }

        return { success: true, tenant };
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
