import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc, gte, gt, asc, sql, ne } from "drizzle-orm";
import * as schema from "../server/db/schema";
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
  tenants,
  customers,
  customerTransactions,
  tenantSettings,
  productBarcodes,
  productVariants,
  unitConversions,
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

export const getPosCatalogServerFn = createServerFn({ method: "GET" })
  .validator((d?: { search?: string; page?: number; pageSize?: number }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getPosContext();

    const page = Math.max(1, Number(data?.page) || 1);
    const pageSize = Math.max(1, Math.min(200, Number(data?.pageSize) || 60));
    const offset = (page - 1) * pageSize;

    let prodWhere = eq(products.tenantId, tenantId);
    if (data?.search && data.search.trim()) {
      const q = `%${data.search.trim()}%`;
      prodWhere = and(
        eq(products.tenantId, tenantId),
        or(ilike(products.name, q), ilike(products.barcode, q), ilike(products.sku, q)),
      )!;
    }

    const catalog = await db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        barcode: products.barcode,
        sku: products.sku,
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
      .where(prodWhere)
      .limit(pageSize)
      .offset(offset);

    const productIds = catalog.map((item) => item.id);

    const [dbBarcodes, dbVariants, dbConversions, dbPromotions] = await Promise.all([
      productIds.length > 0
        ? db.select().from(productBarcodes).where(inArray(productBarcodes.productId, productIds))
        : [],
      productIds.length > 0
        ? db.select().from(productVariants).where(inArray(productVariants.productId, productIds))
        : [],
      productIds.length > 0
        ? db.select().from(unitConversions).where(inArray(unitConversions.productId, productIds))
        : [],
      db.query.promotions.findMany({
        where: eq(promotions.tenantId, tenantId),
      }),
    ]);

    // O(N+M) Map Lookups
    const barcodesMap = new Map<string, string[]>();
    for (const b of dbBarcodes) {
      const arr = barcodesMap.get(b.productId) || [];
      arr.push(b.barcode);
      barcodesMap.set(b.productId, arr);
    }

    const variantsMap = new Map<string, any[]>();
    for (const v of dbVariants) {
      const arr = variantsMap.get(v.productId) || [];
      arr.push({
        variantName: v.variantName,
        variantValue: v.variantValue,
        sku: v.sku,
        priceAdjustment: v.priceAdjustment,
      });
      variantsMap.set(v.productId, arr);
    }

    const conversionsMap = new Map<string, any[]>();
    for (const c of dbConversions) {
      const arr = conversionsMap.get(c.productId) || [];
      arr.push({
        fromUnit: c.fromUnit,
        toUnit: c.toUnit,
        conversionFactor: c.conversionFactor,
      });
      conversionsMap.set(c.productId, arr);
    }

    const catalogWithDetails = catalog.map((item) => ({
      ...item,
      alternateBarcodes: barcodesMap.get(item.id) || [],
      variants: variantsMap.get(item.id) || [],
      conversions: conversionsMap.get(item.id) || [],
    }));

    return {
      catalog: catalogWithDetails,
      promotions: dbPromotions,
      page,
      pageSize,
    };
  });

export const searchPosProductByBarcodeFn = createServerFn({ method: "POST" })
  .validator((d: { query: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getPosContext();
    const q = data.query ? data.query.trim() : "";
    if (!q) return { success: false, error: "Empty query" };

    // Search by primary barcode, sku, exact alternate barcode, or partial name
    const [matchingProducts] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          category: products.category,
          barcode: products.barcode,
          sku: products.sku,
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
        .where(
          and(
            eq(products.tenantId, tenantId),
            or(
              eq(products.barcode, q),
              eq(products.sku, q),
              ilike(products.name, `%${q}%`),
              inArray(
                products.id,
                db
                  .select({ productId: productBarcodes.productId })
                  .from(productBarcodes)
                  .where(eq(productBarcodes.barcode, q)),
              ),
            ),
          ),
        )
        .limit(20),
    ]);

    if (!matchingProducts || matchingProducts.length === 0) {
      return { success: false, products: [] };
    }

    const productIds = matchingProducts.map((p) => p.id);

    const [dbBarcodes, dbVariants, dbConversions] = await Promise.all([
      db.select().from(productBarcodes).where(inArray(productBarcodes.productId, productIds)),
      db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
      db.select().from(unitConversions).where(inArray(unitConversions.productId, productIds)),
    ]);

    const barcodesMap = new Map<string, string[]>();
    for (const b of dbBarcodes) {
      const arr = barcodesMap.get(b.productId) || [];
      arr.push(b.barcode);
      barcodesMap.set(b.productId, arr);
    }

    const variantsMap = new Map<string, any[]>();
    for (const v of dbVariants) {
      const arr = variantsMap.get(v.productId) || [];
      arr.push({
        variantName: v.variantName,
        variantValue: v.variantValue,
        sku: v.sku,
        priceAdjustment: v.priceAdjustment,
      });
      variantsMap.set(v.productId, arr);
    }

    const conversionsMap = new Map<string, any[]>();
    for (const c of dbConversions) {
      const arr = conversionsMap.get(c.productId) || [];
      arr.push({
        fromUnit: c.fromUnit,
        toUnit: c.toUnit,
        conversionFactor: c.conversionFactor,
      });
      conversionsMap.set(c.productId, arr);
    }

    const result = matchingProducts.map((p) => ({
      ...p,
      alternateBarcodes: barcodesMap.get(p.id) || [],
      variants: variantsMap.get(p.id) || [],
      conversions: conversionsMap.get(p.id) || [],
    }));

    return { success: true, products: result };
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
    if (
      scheduledShift &&
      scheduledShift.tillId !== activeTillId &&
      scheduledShift.tillId !== till.name
    ) {
      throw new Error("The selected till terminal does not match your scheduled shift assignment.");
    }

    // Check if the till is in use by another cashier's active shift
    const activeTillShift = await db.query.shifts.findFirst({
      where: and(eq(shifts.tillId, activeTillId), eq(shifts.status, "Open")),
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

  let trn = null;
  if (activeShift) {
    const setting = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, activeShift.tenantId),
    });
    if (setting) trn = setting.trn;
  }

  return JSON.parse(
    JSON.stringify({ shift: activeShift ? { ...activeShift, stats: shiftStats, trn } : null }),
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

export const searchPosCustomersFn = createServerFn({ method: "POST" })
  .validator((d: { term: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await getPosContext();
    if (!data.term || data.term.length < 2) return { success: true, customers: [] };

    const searchStr = `%${data.term.toLowerCase()}%`;

    const results = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        points: customers.points,
        storeCredit: customers.storeCredit,
        tier: customers.tier
      })
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.isActive, true),
          sql`LOWER(${customers.name}) LIKE ${searchStr} OR LOWER(${customers.phone}) LIKE ${searchStr} OR LOWER(${customers.email}) LIKE ${searchStr}`
        )
      )
      .limit(10);

    return { success: true, customers: results };
  });

export const checkoutServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      subtotal: number;
      vat: number;
      total: number;
      payments: { method: string; amount: number }[];
      items: { productId: string; qty: number; unitPrice: number; unit?: string; conversionFactor?: number }[];
      cashReceived?: number;
      changeGiven?: number;
      idempotencyKey?: string;
      customerId?: string;
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
        where: and(
          eq(orders.idempotencyKey, data.idempotencyKey),
          eq(orders.tenantId, tenantId)
        ),
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
      // Enforce Monthly Order Limit with row lock to prevent race conditions
      const [tenantRec] = await tx
        .select({ monthlyOrderLimit: tenants.monthlyOrderLimit })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .for('update');
      if (!tenantRec) throw new Error("Tenant not found.");

      let activeCustomer = null;
      let pointsToRedeem = 0;
      let creditToRedeem = 0;
      let pointsAmount = 0;

      const settings = await tx.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
      const tenantSetting = settings[0];
      if (!tenantSetting) throw new Error("Tenant settings not found.");

      if (data.customerId) {
        const [customerRec] = await tx
          .select()
          .from(customers)
          .where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)))
          .for('update');
        
        if (!customerRec) throw new Error("Customer not found.");
        if (!customerRec.isActive) throw new Error("Customer is not active.");
        activeCustomer = customerRec;
      }

      for (const p of data.payments) {
        if (p.method === "Store Credit") {
          if (!activeCustomer) throw new Error("Store Credit requires an active customer.");
          if (Number(activeCustomer.storeCredit) < p.amount) throw new Error("Insufficient store credit.");
          creditToRedeem += p.amount;
        }
        if (p.method === "Loyalty Points") {
          if (!activeCustomer) throw new Error("Loyalty Points requires an active customer.");
          const pointsRequired = Math.ceil(p.amount / Number(tenantSetting.loyaltyRedemptionRate));
          if (pointsRequired > activeCustomer.points) throw new Error("Insufficient loyalty points.");
          pointsToRedeem += pointsRequired;
          pointsAmount += p.amount;
        }
      }

      if (creditToRedeem > 0) {
        await tx.execute(sql`UPDATE customers SET store_credit = store_credit - ${creditToRedeem} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
      }
      if (pointsToRedeem > 0) {
        await tx.execute(sql`UPDATE customers SET points = points - ${pointsToRedeem} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
      }

      const uaeDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" });
      const uaeDate = new Date(uaeDateStr);
      const startOfMonthUae = new Date(uaeDate.getFullYear(), uaeDate.getMonth(), 1);
      const startOfMonthUtc = new Date(startOfMonthUae.getTime() - 4 * 60 * 60 * 1000);

      const currentOrders = await tx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, tenantId),
            sql`${orders.createdAt} >= ${startOfMonthUtc.toISOString()}`,
            ne(orders.status, "voided"),
          ),
        );

      if (currentOrders[0].count >= tenantRec.monthlyOrderLimit) {
        throw new Error("Monthly order limit reached for this tenant.");
      }

      // Generate invoice number
      const seqResult = await tx
        .insert(schema.invoiceSequences)
        .values({ tenantId, currentValue: 1 })
        .onConflictDoUpdate({
          target: schema.invoiceSequences.tenantId,
          set: { currentValue: sql`${schema.invoiceSequences.currentValue} + 1` },
        })
        .returning({ val: schema.invoiceSequences.currentValue });
        
      const invNumber = `INV-${uaeDate.getFullYear()}-${seqResult[0].val.toString().padStart(5, '0')}`;

      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId,
          branchId,
          cashierId,
          tillId: activeTillId,
          customerId: data.customerId || null,
          subtotal: data.subtotal.toString(),
          vat: data.vat.toString(),
          total: data.total.toString(),
          cashReceived: data.cashReceived ? data.cashReceived.toString() : null,
          changeGiven: data.changeGiven ? data.changeGiven.toString() : null,
          idempotencyKey: data.idempotencyKey || null,
          invoiceNumber: invNumber,
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

      if (creditToRedeem > 0) {
        await tx.insert(customerTransactions).values({
          tenantId,
          customerId: data.customerId!,
          orderId: newOrder.id,
          type: "use_credit",
          points: 0,
          amount: creditToRedeem.toString()
        });
      }
      if (pointsToRedeem > 0) {
          await tx.insert(customerTransactions).values({
          tenantId,
          customerId: data.customerId!,
          orderId: newOrder.id,
          type: "redeem_points",
          points: -pointsToRedeem,
          amount: pointsAmount.toString()
        });
      }

      if (activeCustomer) {
        const pointsRate = Number(tenantSetting.loyaltyPointsPerAed || 0);
        const pointsToEarn = Math.floor(Number(data.total) * pointsRate);
        if (pointsToEarn > 0) {
          await tx.insert(customerTransactions).values({
            tenantId,
            customerId: data.customerId!,
            orderId: newOrder.id,
            type: "earn_points",
            points: pointsToEarn,
            amount: data.total.toString(),
          });
          await tx.execute(sql`UPDATE customers SET points = points + ${pointsToEarn} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
        }
      }

      // Decrement stock levels and handle FEFO for batches
      for (const item of data.items) {
        // Fetch product to check if it's batch tracked
        const [product] = await tx
          .select({ isBatchTracked: products.isBatchTracked, name: products.name })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) throw new Error("Product not found");

        const factor = item.conversionFactor ? Number(item.conversionFactor) : 1;
        const baseQtyToDeduct = item.qty * factor;

        if (product.isBatchTracked) {
          // Handle FEFO deduction from batches
          const availableBatches = await tx
            .select()
            .from(batches)
            .where(
              and(
                eq(batches.productId, item.productId),
                eq(batches.branchId, branchId),
                gt(batches.stock, 0),
              ),
            )
            .orderBy(sql`${batches.expiryDate} ASC NULLS LAST`)
            .for("update");

          let remainingQtyToDeduct = baseQtyToDeduct;
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

            await tx.insert(schema.inventoryLedger).values({
              tenantId,
              branchId,
              productId: item.productId,
              batchId: batch.id,
              transactionType: "Sale",
              previousQuantity: batch.stock,
              changedQuantity: -deduct,
              newQuantity: batch.stock - deduct,
              referenceId: orderId,
              createdBy: cashierId,
            });

            remainingQtyToDeduct -= deduct;
          }

          if (remainingQtyToDeduct > 0) {
            throw new Error(
              `Cannot fulfill ${item.qty} ${item.unit || ""} of ${product.name} because remaining stock is either expired or insufficient.`,
            );
          }
        }

        // Always decrement branch stock levels safely
        const stockUpdateResult = await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} - ${baseQtyToDeduct}` })
          .where(
            and(
              eq(stockLevels.productId, item.productId), 
              eq(stockLevels.branchId, branchId),
              gte(stockLevels.stock, baseQtyToDeduct) // Prevent negative stock
            ),
          ).returning({ id: stockLevels.id });
          
        if (stockUpdateResult.length === 0) {
          throw new Error(`Insufficient non-batch stock for ${product.name}`);
        }
      }

      // Mark the branch's active Talabat aggregator connection as having pending changes
      await tx.execute(sql`
        UPDATE aggregator_connections
        SET has_pending_changes = true, updated_at = NOW()
        WHERE branch_id = ${branchId}::uuid
          AND is_active = true;
      `);
    });

    return { success: true, orderId };
  });

export const generateShiftReportFn = createServerFn({ method: "POST" })
  .validator((d: { shiftId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId, cashierId } = await getPosContext();

    const activeShift = await db.query.shifts.findFirst({
      where: and(eq(shifts.id, data.shiftId), eq(shifts.cashierId, cashierId)),
      with: {
        branch: true,
        cashier: true,
      },
    });

    if (!activeShift) {
      throw new Error("Shift not found.");
    }

    // Resolve till terminal details manually in memory to prevent text vs uuid comparison error
    const matchedTill = await db.query.tills.findFirst({
      where: and(
        eq(tills.id, activeShift.tillId || ""),
        eq(tills.tenantId, tenantId),
        eq(tills.branchId, branchId),
      ),
    });

    const shiftOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.cashierId, cashierId),
        eq(orders.status, "completed"),
        gte(orders.createdAt, new Date(activeShift.openedAt)),
      ),
      with: {
        items: true,
        payments: true,
      },
    });

    const transactionCount = shiftOrders.length;
    const itemsSold = shiftOrders.reduce(
      (acc, o) => acc + o.items.reduce((s, i) => s + i.qty, 0),
      0,
    );
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
      },
    };
  });

export const getBranchTillsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId, branchId } = await getPosContext();
  const dbTills = await db.query.tills.findMany({
    where: and(eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)),
    orderBy: [desc(tills.createdAt)],
  });
  return { success: true, tills: dbTills };
});
