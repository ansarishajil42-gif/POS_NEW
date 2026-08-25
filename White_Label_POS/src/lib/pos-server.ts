import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc, gte, gt, asc, sql } from "drizzle-orm";
import {
  products,
  stockLevels,
  shifts,
  orders,
  orderItems,
  orderPayments,
  promotions,
  tills,
  batches,
} from "../server/db/schema";

// Middleware
async function getPosContext() {
  const res = await getSessionServerFn();
  if (
    !res.success ||
    !res.session ||
    (res.session.role !== "Cashier" && res.session.role !== "Branch Manager")
  ) {
    throw new Error("Unauthorized");
  }
  if (!res.session.branchId) {
    throw new Error("Cashier must be assigned to a branch");
  }
  return {
    tenantId: res.session.tenantId,
    branchId: res.session.branchId,
    cashierId: res.session.id,
    tillId: (res.session as any).tillId || null,
  };
}

export const getPosCatalogServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId, branchId } = await getPosContext();

  const catalog = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      barcode: products.barcode,
      sku: products.barcode,
      unit: products.unit,
      basePrice: products.salePrice,
      stock: stockLevels.stock,
      priceOverride: stockLevels.priceOverride,
    })
    .from(products)
    .innerJoin(
      stockLevels,
      and(eq(stockLevels.productId, products.id), eq(stockLevels.branchId, branchId)),
    )
    .where(eq(products.tenantId, tenantId));

  const dbPromotions = await db.query.promotions.findMany({
    where: eq(promotions.tenantId, tenantId),
  });

  return {
    catalog: JSON.parse(JSON.stringify(catalog)),
    promotions: JSON.parse(JSON.stringify(dbPromotions)),
  };
});

export const openShiftServerFn = createServerFn({ method: "POST" })
  .validator((d: { openingFloat: number; tillId?: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId, cashierId, tillId: sessionTillId } = await getPosContext();

    const activeTillId = data.tillId || sessionTillId;
    if (!activeTillId) {
      throw new Error("Till assignment is required to open a shift.");
    }

    // Verify till belongs to this branch/tenant
    const till = await db.query.tills.findFirst({
      where: and(
        eq(tills.id, activeTillId),
        eq(tills.tenantId, tenantId),
        eq(tills.branchId, branchId),
      ),
    });
    if (!till) {
      throw new Error("Invalid or unauthorized till terminal selection.");
    }

    // Roster scheduling validation
    const today = new Date().toISOString().split("T")[0] as string;
    const scheduledShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.cashierId, cashierId),
        eq(shifts.shiftDate, today),
        eq(shifts.status, "Scheduled"),
      ),
    });
    if (scheduledShift && scheduledShift.tillId !== activeTillId && scheduledShift.tillId !== till.name) {
      throw new Error("The selected till terminal does not match your scheduled shift assignment.");
    }

    // Check if the till is in use by another cashier's active shift
    const activeTillShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.tillId, activeTillId),
        eq(shifts.status, "Open"),
      ),
    });
    if (activeTillShift && activeTillShift.cashierId !== cashierId) {
      throw new Error("This till terminal is currently in use by another cashier.");
    }

    // Check if there is already an open shift for this cashier
    const existingShift = await db.query.shifts.findFirst({
      where: and(eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")),
    });

    if (existingShift) {
      throw new Error("You already have an open shift.");
    }

    const [newShift] = await db
      .insert(shifts)
      .values({
        tenantId,
        branchId,
        cashierId,
        openingFloat: data.openingFloat.toString(),
        status: "Open",
        tillId: activeTillId,
        openedAt: new Date(),
      })
      .returning({ id: shifts.id });

    if (!newShift) {
      throw new Error("Failed to open shift.");
    }

    return { success: true, shiftId: newShift.id };
  });

export const getActiveShiftServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { cashierId } = await getPosContext();

  const activeShift = await db.query.shifts.findFirst({
    where: and(eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")),
    with: {
      branch: true,
      cashier: true,
    },
  });

  const shiftStats = {
    transactions: 0,
    itemsSold: 0,
    avgBasket: 0,
    voids: 0,
    refunds: 0,
    vatCollected: 0,
  };
  if (activeShift) {
    const shiftOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.cashierId, cashierId),
        eq(orders.status, "completed"),
        gte(orders.createdAt, new Date(activeShift.openedAt)),
      ),
      with: { items: true },
    });

    shiftStats.transactions = shiftOrders.length;
    shiftStats.itemsSold = shiftOrders.reduce(
      (acc, order) => acc + order.items.reduce((s, item) => s + item.qty, 0),
      0,
    );
    const totalSales = shiftOrders.reduce((acc, order) => acc + Number(order.total), 0);
    shiftStats.avgBasket = shiftStats.transactions > 0 ? totalSales / shiftStats.transactions : 0;
    shiftStats.vatCollected = shiftOrders.reduce((acc, order) => acc + Number(order.vat), 0);
  }

  return JSON.parse(
    JSON.stringify({ shift: activeShift ? { ...activeShift, stats: shiftStats } : null }),
  );
});

export const recordCashDropServerFn = createServerFn({ method: "POST" })
  .validator((d: { shiftId: string; amount: number; reason: string }) => d)
  .handler(async ({ data }) => {
    const { cashierId } = await getPosContext();

    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.id, data.shiftId),
        eq(shifts.cashierId, cashierId),
        eq(shifts.status, "Open"),
      ),
    });

    if (!activeShift) {
      throw new Error("Active shift not found.");
    }

    const drops = JSON.parse(activeShift.cashDrops || "[]");
    drops.push({ amount: data.amount, reason: data.reason, time: new Date().toISOString() });

    await db
      .update(shifts)
      .set({ cashDrops: JSON.stringify(drops) })
      .where(eq(shifts.id, data.shiftId));

    return { success: true };
  });

export const closeShiftServerFn = createServerFn({ method: "POST" })
  .validator((d: { shiftId: string; actualCash: number }) => d)
  .handler(async ({ data }) => {
    const { cashierId } = await getPosContext();

    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.id, data.shiftId),
        eq(shifts.cashierId, cashierId),
        eq(shifts.status, "Open"),
      ),
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
        gte(orders.createdAt, new Date(activeShift.openedAt)),
      ),
      with: {
        payments: true,
      },
    });

    const totalCashSales = shiftOrders.reduce((acc, order) => {
      const cashPayments = order.payments
        .filter((p) => p.method === "Cash")
        .reduce((s, p) => s + Number(p.amount), 0);
      return acc + cashPayments;
    }, 0);

    const expectedCash = Number(activeShift.openingFloat) + totalCashSales - totalDrops;

    await db
      .update(shifts)
      .set({
        status: "Closed",
        closedAt: new Date(),
        actualCash: data.actualCash.toString(),
        expectedCash: expectedCash.toString(),
      })
      .where(eq(shifts.id, data.shiftId));

    return { success: true, variance: data.actualCash - expectedCash };
  });

export const checkoutServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      subtotal: number;
      vat: number;
      total: number;
      payments: { method: string; amount: number }[];
      items: { productId: string; qty: number; unitPrice: number }[];
      cashReceived?: number;
      changeGiven?: number;
      idempotencyKey?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId, branchId, cashierId } = await getPosContext();

    // Verify cashier has an active shift open for the current branch and tenant
    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.cashierId, cashierId),
        eq(shifts.branchId, branchId),
        eq(shifts.tenantId, tenantId),
        eq(shifts.status, "Open"),
      ),
    });

    if (!activeShift) {
      throw new Error("Please open a cash shift before completing this payment.");
    }

    const activeTillId = activeShift.tillId;
    if (!activeTillId) {
      throw new Error("No active till session found for checkout.");
    }

    // Verify the activeTillId belongs to this branch and tenant
    const tillCheck = await db.query.tills.findFirst({
      where: and(
        eq(tills.id, activeTillId),
        eq(tills.tenantId, tenantId),
        eq(tills.branchId, branchId),
      ),
    });
    if (!tillCheck) {
      throw new Error("Unauthorized: Till terminal assignment is invalid.");
    }

    // Idempotency check to prevent duplicate postings from double click / page reload
    if (data.idempotencyKey) {
      const existingOrder = await db.query.orders.findFirst({
        where: eq(orders.idempotencyKey, data.idempotencyKey),
      });
      if (existingOrder) {
        return { success: true, orderId: existingOrder.id };
      }
    }

    // Server-side strict payment validations
    const allowedMethods = ["Cash", "Card", "Loyalty Points", "Store Credit"];
    if (!data.payments || data.payments.length === 0) {
      throw new Error("Select a payment method.");
    }

    let allocatedTotal = 0;
    for (const p of data.payments) {
      if (p.amount <= 0) {
        throw new Error("Invalid payment amount.");
      }
      if (!allowedMethods.includes(p.method)) {
        throw new Error(`Invalid payment method: ${p.method}`);
      }
      allocatedTotal += Number(p.amount);
    }

    if (Math.abs(allocatedTotal - data.total) > 0.01) {
      throw new Error("Allocate the full amount before completing payment.");
    }

    let orderId: string | undefined;
    await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId,
          branchId,
          cashierId,
          tillId: activeTillId,
          subtotal: data.subtotal.toString(),
          vat: data.vat.toString(),
          total: data.total.toString(),
          cashReceived: data.cashReceived ? data.cashReceived.toString() : null,
          changeGiven: data.changeGiven ? data.changeGiven.toString() : null,
          idempotencyKey: data.idempotencyKey || null,
          status: "completed",
        })
        .returning({ id: orders.id });

      if (!newOrder) {
        throw new Error("Failed to create order.");
      }
      orderId = newOrder.id;

      const paymentRecords = data.payments.map((p) => ({
        orderId: newOrder.id,
        method: p.method,
        amount: p.amount.toString(),
      }));

      await tx.insert(orderPayments).values(paymentRecords);

      const itemRecords = data.items.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice.toString(),
      }));

      await tx.insert(orderItems).values(itemRecords);

      // Decrement stock levels and handle FEFO for batches
      for (const item of data.items) {
        // Fetch product to check if it's batch tracked
        const [product] = await tx
          .select({ isBatchTracked: products.isBatchTracked, name: products.name })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) throw new Error("Product not found");

        if (product.isBatchTracked) {
          // Handle FEFO deduction from batches
          const availableBatches = await tx
            .select()
            .from(batches)
            .where(
              and(
                eq(batches.productId, item.productId),
                eq(batches.branchId, branchId),
                gt(batches.stock, 0)
              )
            )
            .orderBy(asc(batches.expiryDate));

          let remainingQtyToDeduct = item.qty;
          const now = new Date();

          for (const batch of availableBatches) {
            if (remainingQtyToDeduct <= 0) break;
            
            if (new Date(batch.expiryDate) <= now) {
              // Skip expired batches
              continue;
            }

            const deduct = Math.min(batch.stock, remainingQtyToDeduct);
            await tx
              .update(batches)
              .set({ stock: sql`${batches.stock} - ${deduct}` })
              .where(eq(batches.id, batch.id));
              
            remainingQtyToDeduct -= deduct;
          }

          if (remainingQtyToDeduct > 0) {
            throw new Error(`Cannot fulfill ${item.qty} of ${product.name} because remaining stock is either expired or insufficient.`);
          }
        }

        // Always decrement branch stock levels
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} - ${item.qty}` })
          .where(
            and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, branchId)),
          );
      }
    });

    return { success: true, orderId };
  });

export const generateShiftReportFn = createServerFn({ method: "POST" })
  .validator((d: { shiftId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId, cashierId } = await getPosContext();

    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.id, data.shiftId),
        eq(shifts.cashierId, cashierId),
      ),
      with: {
        branch: true,
        cashier: true,
      }
    });

    if (!activeShift) {
      throw new Error("Shift not found.");
    }

    // Resolve till terminal details manually in memory to prevent text vs uuid comparison error
    const matchedTill = await db.query.tills.findFirst({
      where: and(
        eq(tills.id, activeShift.tillId || ""),
        eq(tills.tenantId, tenantId),
        eq(tills.branchId, branchId)
      )
    });

    const shiftOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.cashierId, cashierId),
        eq(orders.status, "completed"),
        gte(orders.createdAt, new Date(activeShift.openedAt)),
      ),
      with: {
        items: true,
        payments: true
      },
    });

    const transactionCount = shiftOrders.length;
    const itemsSold = shiftOrders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.qty, 0), 0);
    const salesTotal = shiftOrders.reduce((acc, o) => acc + Number(o.total), 0);
    const avgBasket = transactionCount > 0 ? salesTotal / transactionCount : 0;
    const vatCollected = shiftOrders.reduce((acc, o) => acc + Number(o.vat), 0);

    // Payments breakdowns
    let cashTotal = 0;
    let cardTotal = 0;
    let pointsTotal = 0;
    let creditTotal = 0;

    for (const o of shiftOrders) {
      for (const p of o.payments) {
        const amt = Number(p.amount);
        if (p.method === "Cash") cashTotal += amt;
        else if (p.method === "Card") cardTotal += amt;
        else if (p.method === "Loyalty Points") pointsTotal += amt;
        else if (p.method === "Store Credit") creditTotal += amt;
      }
    }

    const drops = JSON.parse(activeShift.cashDrops || "[]");
    const totalDrops = drops.reduce((acc: number, d: any) => acc + d.amount, 0);

    return {
      success: true,
      report: {
        shiftId: activeShift.id,
        status: activeShift.status,
        openedAt: activeShift.openedAt,
        closedAt: activeShift.closedAt,
        branchName: activeShift.branch?.name || "Branch",
        cashierName: activeShift.cashier?.name || "Cashier",
        tillName: matchedTill?.name || activeShift.tillId || "Till Terminal",
        openingFloat: Number(activeShift.openingFloat),
        totalDrops,
        transactionCount,
        itemsSold,
        salesTotal,
        avgBasket,
        vatCollected,
        cashTotal,
        cardTotal,
        pointsTotal,
        creditTotal,
        expectedCash: Number(activeShift.openingFloat) + cashTotal - totalDrops,
        voids: 0,
        refunds: 0,
      }
    };
  });

export const getBranchTillsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId, branchId } = await getPosContext();
  const dbTills = await db.query.tills.findMany({
    where: and(
      eq(tills.tenantId, tenantId),
      eq(tills.branchId, branchId)
    ),
    orderBy: [desc(tills.createdAt)]
  });
  return { success: true, tills: dbTills };
});
