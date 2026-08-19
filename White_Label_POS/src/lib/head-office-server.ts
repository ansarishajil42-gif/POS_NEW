import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { 
    tenants, branches, products, stockLevels, batches, 
    purchaseOrders, grn, vendorInvoices, staffUsers, 
    customers, promotions, tenantSettings, vendors, orders 
} from "@/server/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";

// Middleware
async function getHeadOfficeTenant() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Head Office Admin") {
        throw new Error("Unauthorized");
    }
    return res.session.tenantId;
}

export const getHeadOfficeDataFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const tenantId = await getHeadOfficeTenant();
        
        // Settings
        let settings = await db.query.tenantSettings.findFirst({
            where: eq(tenantSettings.tenantId, tenantId)
        });
        if (!settings) {
            const [newSet] = await db.insert(tenantSettings).values({ tenantId }).returning();
            settings = newSet;
        }

        // Branches
        const dbBranches = await db.query.branches.findMany({
            where: eq(branches.tenantId, tenantId)
        });

        // Products
        const dbProducts = await db.query.products.findMany({
            where: eq(products.tenantId, tenantId)
        });

        // Stock Levels
        const dbStock = await db.query.stockLevels.findMany({
            where: inArray(stockLevels.branchId, dbBranches.map(b => b.id).concat(['00000000-0000-0000-0000-000000000000']))
        });

        // Batches
        const dbBatches = await db.query.batches.findMany({
            where: inArray(batches.branchId, dbBranches.map(b => b.id).concat(['00000000-0000-0000-0000-000000000000'])),
            orderBy: [batches.expiryDate]
        });

        // POs
        const dbPos = await db.query.purchaseOrders.findMany({
            where: eq(purchaseOrders.tenantId, tenantId),
            with: { vendor: true },
            orderBy: [desc(purchaseOrders.createdAt)]
        });

        // Staff
        const dbStaff = await db.query.staffUsers.findMany({
            where: eq(staffUsers.tenantId, tenantId)
        });

        // Customers
        const dbCustomers = await db.query.customers.findMany({
            where: eq(customers.tenantId, tenantId)
        });

        // Promotions
        const dbPromotions = await db.query.promotions.findMany({
            where: eq(promotions.tenantId, tenantId)
        });

        // Vendors
        const dbVendors = await db.query.vendors.findMany({
            where: eq(vendors.tenantId, tenantId)
        });

        // Orders for branch trend
        const dbOrders = await db.query.orders.findMany({
            where: eq(orders.tenantId, tenantId),
            columns: { branchId: true, total: true, createdAt: true }
        });

        // Generate dynamic 7-day trend
        const branchTrend: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayData: any = { d: dayName };
            dbBranches.forEach(b => {
                dayData[b.name] = 0; // default 0 sales
            });
            
            dbOrders.forEach(o => {
                const oDate = new Date(o.createdAt);
                if (oDate.toDateString() === date.toDateString()) {
                    const branch = dbBranches.find(b => b.id === o.branchId);
                    if (branch) {
                        dayData[branch.name] += Number(o.total);
                    }
                }
            });
            branchTrend.push(dayData);
        }

        return {
            success: true,
            settings,
            branches: dbBranches,
            products: dbProducts,
            stock: dbStock,
            batches: dbBatches,
            purchases: dbPos,
            staff: dbStaff,
            customers: dbCustomers,
            promotions: dbPromotions,
            vendors: dbVendors,
            branchTrend
        };
    });

export const updateStockFn = createServerFn({ method: "POST" })
    .validator((d: { productId: string; branchId: string; qty: number }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        const existing = await db.query.stockLevels.findFirst({
            where: and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId))
        });
        if (existing) {
            await db.update(stockLevels)
                .set({ stock: data.qty })
                .where(eq(stockLevels.id, existing.id));
        } else {
            await db.insert(stockLevels).values({
                productId: data.productId,
                branchId: data.branchId,
                stock: data.qty,
                reorderLevel: 10
            });
        }
        return { success: true };
    });

export const updatePriceOverrideFn = createServerFn({ method: "POST" })
    .validator((d: { productId: string; branchId: string; priceOverride: string | null }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        const existing = await db.query.stockLevels.findFirst({
            where: and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId))
        });
        
        if (existing) {
            await db.update(stockLevels)
                .set({ priceOverride: data.priceOverride })
                .where(eq(stockLevels.id, existing.id));
        } else {
            await db.insert(stockLevels).values({
                productId: data.productId,
                branchId: data.branchId,
                stock: 0,
                reorderLevel: 10,
                priceOverride: data.priceOverride
            });
        }
        return { success: true };
    });

export const applyClearanceFn = createServerFn({ method: "POST" })
    .validator((d: { productId: string; discountPct: number }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        // create a promotion
        await db.insert(promotions).values({
            tenantId,
            name: "Clearance Sale",
            discountType: "percentage",
            discountValue: data.discountPct.toString(),
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            status: "Active"
        });
        return { success: true };
    });

export const updateVatSettingsFn = createServerFn({ method: "POST" })
    .validator((d: { vatRate: string; vatInclusive: boolean }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        await db.update(tenantSettings)
            .set({ vatRate: data.vatRate, vatInclusive: data.vatInclusive })
            .where(eq(tenantSettings.tenantId, tenantId));
        return { success: true };
    });

export const createPoFn = createServerFn({ method: "POST" })
    .validator((d: { vendorId: string; branchId: string; totalAmount: string }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        await db.insert(purchaseOrders).values({
            tenantId,
            branchId: data.branchId,
            vendorId: data.vendorId,
            status: "Pending",
            total: data.totalAmount
        });
        return { success: true };
    });

export const updateLoyaltySettingsFn = createServerFn({ method: "POST" })
    .validator((d: { loyaltyRedemptionRate: string }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        await db.update(tenantSettings)
            .set({ loyaltyRedemptionRate: data.loyaltyRedemptionRate })
            .where(eq(tenantSettings.tenantId, tenantId));
        return { success: true };
    });
