import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
    branches, 
    stockLevels, 
    products, 
    batches,
    stockTransfers,
    tenants
} from "../server/db/schema";

// Middleware
async function getInventoryManagerContext() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Inventory Manager") {
        throw new Error("Unauthorized");
    }
    return {
        tenantId: res.session.tenantId,
    };
}

export const getInventoryDataServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { tenantId } = await getInventoryManagerContext();

        // 1. Get tenant info
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        // 2. Get branches
        const allBranches = await db.query.branches.findMany({
            where: eq(branches.tenantId, tenantId)
        });

        // 2. Get stock levels across all branches with product info
        let allStockLevels: any[] = [];
        try {
            allStockLevels = await db
                .select({
                    id: stockLevels.id,
                    stock: stockLevels.stock,
                    reorderLevel: stockLevels.reorderLevel,
                    branchId: stockLevels.branchId,
                    branchName: branches.name,
                    productId: products.id,
                    productName: products.name,
                    sku: products.barcode, // use barcode as sku
                    barcode: products.barcode,
                    category: products.category,
                    unit: products.unit,
                })
                .from(stockLevels)
                .innerJoin(products, eq(stockLevels.productId, products.id))
                .innerJoin(branches, eq(stockLevels.branchId, branches.id))
                .where(eq(products.tenantId, tenantId));
        } catch (e) {
            console.warn("Table stockLevels might not exist yet:", e);
        }

        // 3. Get batches (FEFO)
        let allBatches: any[] = [];
        try {
            allBatches = await db
                .select({
                    id: batches.id,
                    batchNumber: batches.batchNumber,
                    expiryDate: batches.expiryDate,
                    stock: batches.stock,
                    productId: products.id,
                    productName: products.name,
                    sku: products.barcode,
                    branchId: batches.branchId,
                    branchName: branches.name,
                })
                .from(batches)
                .innerJoin(products, eq(batches.productId, products.id))
                .leftJoin(branches, eq(batches.branchId, branches.id))
                .where(eq(products.tenantId, tenantId))
                .orderBy(batches.expiryDate);
        } catch (e) {
            console.warn("Table batches might not exist yet:", e);
        }

        // Calculate some global stats
        const totalItems = allStockLevels.length;
        const lowStockItems = allStockLevels.filter(s => s.stock <= s.reorderLevel);

        // 4. Get recent stock transfers
        let rawTransfers: any[] = [];
        try {
            rawTransfers = await db.select().from(stockTransfers)
                .where(eq(stockTransfers.tenantId, tenantId))
                .orderBy(desc(stockTransfers.createdAt))
                .limit(50);
        } catch (e) {
            console.warn("Table stock_transfers might not exist yet:", e);
        }
            
        // Map names manually to avoid needing drizzle relations definition
        const allTransfers = rawTransfers.map(t => {
            const product = allStockLevels.find(s => s.productId === t.productId) || { productName: "Unknown", sku: "" };
            const source = allBranches.find(b => b.id === t.sourceBranchId);
            const target = allBranches.find(b => b.id === t.destinationBranchId);
            return {
                ...t,
                productName: product.productName,
                sku: product.sku,
                sourceBranchName: source?.name || "Unknown",
                destinationBranchName: target?.name || "Unknown"
            };
        });

        const result = {
            tenant,
            branches: allBranches,
            stockLevels: allStockLevels,
            batches: allBatches,
            transfers: allTransfers,
            stats: {
                totalSkus: Array.from(new Set(allStockLevels.map(s => s.productId))).length,
                lowStockCount: lowStockItems.length,
            }
        };

        return JSON.parse(JSON.stringify(result));
    });

export const stockTransferServerFn = createServerFn({ method: "POST" })
    .validator((d: { productId: string; sourceBranchId: string; targetBranchId: string; quantity: number }) => d)
    .handler(async ({ data }) => {
        const { tenantId } = await getInventoryManagerContext();

        // Perform transactional update using db.transaction
        await db.transaction(async (tx) => {
            // Decrement from source
            const sourceStock = await tx.select().from(stockLevels)
                .where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.sourceBranchId)))
                .limit(1);

            if (sourceStock.length === 0 || sourceStock[0].stock < data.quantity) {
                throw new Error("Insufficient stock in source branch");
            }

            await tx.update(stockLevels)
                .set({ stock: sql`${stockLevels.stock} - ${data.quantity}` })
                .where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.sourceBranchId)));

            // Increment target
            const targetStock = await tx.select().from(stockLevels)
                .where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.targetBranchId)))
                .limit(1);

            if (targetStock.length > 0) {
                await tx.update(stockLevels)
                    .set({ stock: sql`${stockLevels.stock} + ${data.quantity}` })
                    .where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.targetBranchId)));
            } else {
                await tx.insert(stockLevels)
                    .values({
                        productId: data.productId,
                        branchId: data.targetBranchId,
                        stock: data.quantity,
                        reorderLevel: 10,
                    });
            }

            // Log the transfer
            await tx.insert(stockTransfers)
                .values({
                    tenantId: tenantId,
                    productId: data.productId,
                    sourceBranchId: data.sourceBranchId,
                    destinationBranchId: data.targetBranchId,
                    quantity: data.quantity,
                    status: "Completed",
                });
        });

        return { success: true };
    });
