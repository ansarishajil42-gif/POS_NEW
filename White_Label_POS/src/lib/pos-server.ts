import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import {
    products,
    stockLevels,
    shifts,
    orders,
    orderItems,
    orderPayments
} from "../server/db/schema";

// Middleware
async function getPosContext() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || (res.session.role !== "Cashier" && res.session.role !== "Branch Manager")) {
        throw new Error("Unauthorized");
    }
    if (!res.session.branchId) {
        throw new Error("Cashier must be assigned to a branch");
    }
    return {
        tenantId: res.session.tenantId,
        branchId: res.session.branchId,
        cashierId: res.session.id,
    };
}

export const getPosCatalogServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { tenantId, branchId } = await getPosContext();

        const catalog = await db
            .select({
                id: products.id,
                name: products.name,
                category: products.category,
                barcode: products.barcode,
                sku: products.barcode,
                unit: products.unit,
                basePrice: products.salePrice, // using salePrice as basePrice
                stock: stockLevels.stock,
                priceOverride: stockLevels.priceOverride,
            })
            .from(products)
            .innerJoin(stockLevels, and(eq(stockLevels.productId, products.id), eq(stockLevels.branchId, branchId)))
            .where(eq(products.tenantId, tenantId));

        return JSON.parse(JSON.stringify(catalog));
    });

export const openShiftServerFn = createServerFn({ method: "POST" })
    .validator((d: { openingFloat: number }) => d)
    .handler(async ({ data }) => {
        const { tenantId, branchId, cashierId } = await getPosContext();

        // Check if there is already an open shift for this cashier
        const existingShift = await db.query.shifts.findFirst({
            where: and(
                eq(shifts.cashierId, cashierId),
                eq(shifts.status, "Open")
            )
        });

        if (existingShift) {
            throw new Error("You already have an open shift.");
        }

        const [newShift] = await db.insert(shifts)
            .values({
                tenantId,
                branchId,
                cashierId,
                openingFloat: data.openingFloat.toString(),
                status: "Open"
            })
            .returning({ id: shifts.id });

        return { success: true, shiftId: newShift.id };
    });

export const getActiveShiftServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { cashierId } = await getPosContext();

        const activeShift = await db.query.shifts.findFirst({
            where: and(
                eq(shifts.cashierId, cashierId),
                eq(shifts.status, "Open")
            ),
            with: {
                branch: true,
                cashier: true
            }
        });

        let shiftStats = { transactions: 0, itemsSold: 0, avgBasket: 0, voids: 0, refunds: 0, vatCollected: 0 };
        if (activeShift) {
            const shiftOrders = await db.query.orders.findMany({
                where: and(
                    eq(orders.cashierId, cashierId),
                    eq(orders.status, "completed"),
                    gte(orders.createdAt, new Date(activeShift.openedAt))
                ),
                with: { items: true }
            });

            shiftStats.transactions = shiftOrders.length;
            shiftStats.itemsSold = shiftOrders.reduce((acc, order) => acc + order.items.reduce((s, item) => s + item.qty, 0), 0);
            const totalSales = shiftOrders.reduce((acc, order) => acc + Number(order.total), 0);
            shiftStats.avgBasket = shiftStats.transactions > 0 ? totalSales / shiftStats.transactions : 0;
            shiftStats.vatCollected = shiftOrders.reduce((acc, order) => acc + Number(order.vat), 0);
        }

        return JSON.parse(JSON.stringify({ shift: activeShift ? { ...activeShift, stats: shiftStats } : null }));
    });

export const recordCashDropServerFn = createServerFn({ method: "POST" })
    .validator((d: { shiftId: string, amount: number, reason: string }) => d)
    .handler(async ({ data }) => {
        const { cashierId } = await getPosContext();

        const activeShift = await db.query.shifts.findFirst({
            where: and(
                eq(shifts.id, data.shiftId),
                eq(shifts.cashierId, cashierId),
                eq(shifts.status, "Open")
            )
        });

        if (!activeShift) {
            throw new Error("Active shift not found.");
        }

        const drops = JSON.parse(activeShift.cashDrops || "[]");
        drops.push({ amount: data.amount, reason: data.reason, time: new Date().toISOString() });

        await db.update(shifts)
            .set({ cashDrops: JSON.stringify(drops) })
            .where(eq(shifts.id, data.shiftId));

        return { success: true };
    });

export const closeShiftServerFn = createServerFn({ method: "POST" })
    .validator((d: { shiftId: string, actualCash: number }) => d)
    .handler(async ({ data }) => {
        const { cashierId } = await getPosContext();

        const activeShift = await db.query.shifts.findFirst({
            where: and(
                eq(shifts.id, data.shiftId),
                eq(shifts.cashierId, cashierId),
                eq(shifts.status, "Open")
            )
        });

        if (!activeShift) {
            throw new Error("Active shift not found.");
        }

        // In a real system, expectedCash is openingFloat - cashDrops + CashSales - CashRefunds
        const drops = JSON.parse(activeShift.cashDrops || "[]");
        const totalDrops = drops.reduce((acc: number, d: any) => acc + d.amount, 0);

        // Fetch total cash sales for this shift's duration
        const shiftOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.cashierId, cashierId),
                eq(orders.status, "completed"),
                gte(orders.createdAt, new Date(activeShift.openedAt))
            ),
            with: {
                payments: true
            }
        });

        const totalCashSales = shiftOrders.reduce((acc, order) => {
            const cashPayments = order.payments.filter(p => p.method === "Cash").reduce((s, p) => s + Number(p.amount), 0);
            return acc + cashPayments;
        }, 0);

        const expectedCash = Number(activeShift.openingFloat) + totalCashSales - totalDrops;

        await db.update(shifts)
            .set({
                status: "Closed",
                closedAt: new Date(),
                actualCash: data.actualCash.toString(),
                expectedCash: expectedCash.toString()
            })
            .where(eq(shifts.id, data.shiftId));

        return { success: true, variance: data.actualCash - expectedCash };
    });

export const checkoutServerFn = createServerFn({ method: "POST" })
    .validator((d: {
        subtotal: number,
        vat: number,
        total: number,
        payments: { method: string, amount: number }[],
        items: { productId: string, qty: number, unitPrice: number }[]
    }) => d)
    .handler(async ({ data }) => {
        const { tenantId, branchId, cashierId } = await getPosContext();

        await db.transaction(async (tx) => {
            const [newOrder] = await tx.insert(orders)
                .values({
                    tenantId,
                    branchId,
                    cashierId,
                    subtotal: data.subtotal.toString(),
                    vat: data.vat.toString(),
                    total: data.total.toString(),
                    status: "completed"
                })
                .returning({ id: orders.id });

            const paymentRecords = data.payments.map(p => ({
                orderId: newOrder.id,
                method: p.method,
                amount: p.amount.toString()
            }));

            await tx.insert(orderPayments).values(paymentRecords);

            const itemRecords = data.items.map(item => ({
                orderId: newOrder.id,
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice.toString()
            }));

            await tx.insert(orderItems).values(itemRecords);

            // Decrement stock levels
            for (const item of data.items) {
                await tx.update(stockLevels)
                    .set({ stock: sql`${stockLevels.stock} - ${item.qty}` })
                    .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, branchId)));
            }
        });

        return { success: true };
    });
