import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc } from "drizzle-orm";
import { 
    branches, 
    stockLevels, 
    products, 
    orders,
    shifts, 
    rolePermissions,
} from "../server/db/schema";

// Middleware
async function getStoreManagerContext() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Branch Manager") {
        throw new Error("Unauthorized");
    }
    if (!res.session.branchId) {
        throw new Error("No branch assigned to this manager");
    }
    return {
        tenantId: res.session.tenantId,
        branchId: res.session.branchId
    };
}

export const getStoreManagerDataFn = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const { tenantId, branchId } = await getStoreManagerContext();

            // 1. Get branch info
            const branchInfo = await db.query.branches.findFirst({
                where: eq(branches.id, branchId)
            });

            // 2. Get local stock & products
            const localStock = await db
                .select({
                    id: stockLevels.id,
                    stock: stockLevels.stock,
                    priceOverride: stockLevels.priceOverride,
                    productId: products.id,
                    productName: products.name,
                    sku: products.barcode, // Fallback sku to barcode
                    barcode: products.barcode,
                    category: products.category,
                    unit: products.unit,
                    basePrice: products.salePrice, // salePrice instead of basePrice
                })
                .from(stockLevels)
                .innerJoin(products, eq(stockLevels.productId, products.id))
                .where(eq(stockLevels.branchId, branchId));

            // 3. Get recent shifts (today's shifts)
            const recentShifts = await db.query.shifts.findMany({
                where: eq(shifts.branchId, branchId),
                with: {
                    cashier: true
                },
                orderBy: [desc(shifts.openedAt)],
                limit: 20
            });

            // 4. Get recent orders (to compute sales/trends)
            const recentOrders = await db.query.orders.findMany({
                where: eq(orders.branchId, branchId),
                orderBy: [desc(orders.createdAt)],
                limit: 100, // Just a sample for the dashboard
                with: {
                    items: {
                        with: {
                            product: true
                        }
                    }
                }
            });

            // 5. Get permissions
            const dbPerms = await db.query.rolePermissions.findMany({
                where: and(
                    eq(rolePermissions.tenantId, tenantId),
                    eq(rolePermissions.role, "branch_manager")
                )
            });

            const result = {
                branch: branchInfo,
                stock: localStock,
                shifts: recentShifts,
                orders: recentOrders,
                permissions: dbPerms
            };

            return JSON.parse(JSON.stringify(result));
        } catch (e: any) {
            console.error("BACKEND CRASH IN STORE MANAGER:", e);
            return { error: e.stack || e.message || String(e) };
        }
    });

export const requestPriceOverrideFn = createServerFn({ method: "POST" })
    .validator((d: { stockLevelId: string; requestedPrice: string }) => d)
    .handler(async ({ data }) => {
        const { tenantId, branchId } = await getStoreManagerContext();

        // Enforce branch_override permission
        const permRecord = await db.query.rolePermissions.findFirst({
            where: and(
                eq(rolePermissions.tenantId, tenantId),
                eq(rolePermissions.role, "branch_manager"),
                eq(rolePermissions.permission, "branch_override")
            )
        });
        if (permRecord && !permRecord.enabled) {
            throw new Error("Forbidden: Branch override permission is disabled.");
        }

        await db.update(stockLevels)
            .set({ priceOverride: data.requestedPrice })
            .where(and(eq(stockLevels.id, data.stockLevelId), eq(stockLevels.branchId, branchId)));
        return { success: true };
    });
