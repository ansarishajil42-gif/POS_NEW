import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
    vendors, 
    purchaseOrders, 
    purchaseOrderItems,
    grn,
    grnItems,
    vendorInvoices,
    products,
    branches,
    stockLevels,
    tenants
} from "../server/db/schema";

// Middleware
async function getPurchasingContext() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Purchasing Officer") {
        throw new Error("Unauthorized");
    }
    return {
        tenantId: res.session.tenantId,
    };
}

export const getPurchasingDataServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { tenantId } = await getPurchasingContext();

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        const allVendors = await db.query.vendors.findMany({
            where: eq(vendors.tenantId, tenantId)
        });
        
        const allBranches = await db.query.branches.findMany({
            where: eq(branches.tenantId, tenantId)
        });

        const allProducts = await db.query.products.findMany({
            where: eq(products.tenantId, tenantId)
        });

        const allPOs = await db.query.purchaseOrders.findMany({
            where: eq(purchaseOrders.tenantId, tenantId),
            orderBy: [desc(purchaseOrders.createdAt)],
            with: {
                vendor: true,
                branch: true,
                items: {
                    with: {
                        product: true
                    }
                }
            }
        });

        const allGRNs = await db.query.grn.findMany({
            where: eq(grn.tenantId, tenantId),
            orderBy: [desc(grn.receivedAt)],
            with: {
                vendor: true,
                branch: true,
                purchaseOrder: true,
                items: {
                    with: {
                        product: true
                    }
                }
            }
        });

        const allInvoices = await db.query.vendorInvoices.findMany({
            where: eq(vendorInvoices.tenantId, tenantId),
            orderBy: [desc(vendorInvoices.createdAt)],
            with: {
                vendor: true,
                purchaseOrder: true
            }
        });

        return JSON.parse(JSON.stringify({
            tenant,
            vendors: allVendors,
            products: allProducts,
            branches: allBranches,
            purchaseOrders: allPOs,
            grns: allGRNs,
            invoices: allInvoices
        }));
    });

export const createPurchaseOrderServerFn = createServerFn({ method: "POST" })
    .validator((d: { vendorId: string; branchId: string; items: { productId: string; qty: number; unitPrice: number }[] }) => d)
    .handler(async ({ data }) => {
        const { tenantId } = await getPurchasingContext();

        const total = data.items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);

        await db.transaction(async (tx) => {
            const [newPO] = await tx.insert(purchaseOrders)
                .values({
                    tenantId,
                    vendorId: data.vendorId,
                    branchId: data.branchId,
                    status: "Ordered",
                    total: total.toString()
                })
                .returning({ id: purchaseOrders.id });

            const poItems = data.items.map(item => ({
                purchaseOrderId: newPO.id,
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice.toString()
            }));

            await tx.insert(purchaseOrderItems).values(poItems);
        });

        return { success: true };
    });

export const recordGRNServerFn = createServerFn({ method: "POST" })
    .validator((d: { purchaseOrderId: string; vendorId: string; branchId: string; grnNumber: string; items: { productId: string; orderedQty: number; receivedQty: number; }[] }) => d)
    .handler(async ({ data }) => {
        const { tenantId } = await getPurchasingContext();

        await db.transaction(async (tx) => {
            const [newGRN] = await tx.insert(grn)
                .values({
                    tenantId,
                    vendorId: data.vendorId,
                    branchId: data.branchId,
                    purchaseOrderId: data.purchaseOrderId,
                    grnNumber: data.grnNumber,
                    status: "received"
                })
                .returning({ id: grn.id });

            const gItems = data.items.map(item => ({
                grnId: newGRN.id,
                productId: item.productId,
                orderedQty: item.orderedQty,
                receivedQty: item.receivedQty,
                variance: item.orderedQty - item.receivedQty
            }));

            await tx.insert(grnItems).values(gItems);

            // Update PO Status
            await tx.update(purchaseOrders)
                .set({ status: "GRN" })
                .where(eq(purchaseOrders.id, data.purchaseOrderId));

            // Increment stockLevels for the branch
            for (const item of data.items) {
                if (item.receivedQty > 0) {
                    const existingStock = await tx.select().from(stockLevels)
                        .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, data.branchId)))
                        .limit(1);

                    if (existingStock.length > 0) {
                        await tx.update(stockLevels)
                            .set({ stock: sql`${stockLevels.stock} + ${item.receivedQty}` })
                            .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, data.branchId)));
                    } else {
                        await tx.insert(stockLevels)
                            .values({
                                productId: item.productId,
                                branchId: data.branchId,
                                stock: item.receivedQty,
                                reorderLevel: 10, // default
                            });
                    }
                }
            }
        });

        return { success: true };
    });
