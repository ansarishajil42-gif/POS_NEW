import { Router } from "express";
import { db } from "../db/index.js";
import { eq, and, desc, gte, gt, asc, sql, ne } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
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
  inventoryLedger,
  invoiceSequences
} from "../db/schema.js";

const router = Router();
router.use(requireAuth);

// 1. Get branch tills
router.get("/tills", async (req, res) => {
  const { tenantId, branchId } = (req as any).user;
  try {
    const dbTills = await db
      .select()
      .from(tills)
      .where(and(eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)))
      .orderBy(desc(tills.createdAt));
    res.json({ success: true, tills: dbTills });
  } catch (err) {
    console.error("Fetch tills error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Open Cashier shift
router.post("/shift/open", async (req, res) => {
  const { tenantId, branchId, id: cashierId } = (req as any).user;
  const { openingFloat, tillId } = req.body;

  if (!tillId || openingFloat === undefined) {
    return res.status(400).json({ error: "tillId and openingFloat are required." });
  }

  try {
    const till = await db.query.tills.findFirst({
      where: and(
        eq(tills.id, tillId),
        eq(tills.tenantId, tenantId),
        eq(tills.branchId, branchId),
      ),
    });
    if (!till) {
      return res.status(400).json({ error: "Invalid or unauthorized till terminal selection." });
    }

    const activeTillShift = await db.query.shifts.findFirst({
      where: and(eq(shifts.tillId, tillId), eq(shifts.status, "Open")),
    });
    if (activeTillShift && activeTillShift.cashierId !== cashierId) {
      return res.status(400).json({ error: "This till terminal is currently in use by another cashier." });
    }

    const existingShift = await db.query.shifts.findFirst({
      where: and(eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")),
    });
    if (existingShift) {
      return res.status(400).json({ error: "You already have an open shift." });
    }

    const [newShift] = await db
      .insert(shifts)
      .values({
        tenantId,
        branchId,
        cashierId,
        openingFloat: openingFloat.toString(),
        status: "Open",
        tillId,
        openedAt: new Date(),
      })
      .returning({ id: shifts.id });

    res.json({ success: true, shiftId: newShift.id });
  } catch (err) {
    console.error("Open shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Get Active Cashier shift & stats
router.get("/shift/active", async (req, res) => {
  const { tenantId, branchId, id: cashierId } = (req as any).user;
  try {
    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.cashierId, cashierId),
        eq(shifts.branchId, branchId),
        eq(shifts.tenantId, tenantId),
        eq(shifts.status, "Open")
      ),
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
      cashTotal: 0,
      cardTotal: 0,
      pointsTotal: 0,
      creditTotal: 0,
    };

    if (activeShift) {
      const shiftOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.cashierId, cashierId),
          eq(orders.status, "completed"),
          gte(orders.createdAt, new Date(activeShift.openedAt)),
        ),
        with: { items: true, payments: true },
      });

      shiftStats.transactions = shiftOrders.length;
      shiftStats.itemsSold = shiftOrders.reduce(
        (acc, order) => acc + order.items.reduce((s, item) => s + item.qty, 0),
        0,
      );
      const totalSales = shiftOrders.reduce((acc, order) => acc + Number(order.total), 0);
      shiftStats.avgBasket = shiftStats.transactions > 0 ? totalSales / shiftStats.transactions : 0;
      shiftStats.vatCollected = shiftOrders.reduce((acc, order) => acc + Number(order.vat), 0);

      for (const o of shiftOrders) {
        for (const p of o.payments) {
          const amt = Number(p.amount);
          if (p.method === "Cash") shiftStats.cashTotal += amt;
          else if (p.method === "Card") shiftStats.cardTotal += amt;
          else if (p.method === "Loyalty Points") shiftStats.pointsTotal += amt;
          else if (p.method === "Store Credit") shiftStats.creditTotal += amt;
        }
      }
    }

    let trn = null;
    if (activeShift) {
      const setting = await db.query.tenantSettings.findFirst({
        where: eq(tenantSettings.tenantId, activeShift.tenantId),
      });
      if (setting) trn = setting.taxRegistrationNumber;
    }

    res.json({
      shift: activeShift ? { ...activeShift, stats: shiftStats, trn } : null,
    });
  } catch (err) {
    console.error("Get active shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Close cashier shift
router.post("/shift/close", async (req, res) => {
  const { id: cashierId } = (req as any).user;
  const { shiftId, actualCash } = req.body;

  if (!shiftId || actualCash === undefined) {
    return res.status(400).json({ error: "shiftId and actualCash are required" });
  }

  try {
    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.id, shiftId),
        eq(shifts.cashierId, cashierId),
        eq(shifts.status, "Open"),
      ),
    });

    if (!activeShift) {
      return res.status(404).json({ error: "Active shift not found." });
    }

    const drops = JSON.parse(activeShift.cashDrops || "[]");
    const totalDrops = drops.reduce((acc: number, d: any) => acc + d.amount, 0);

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
        actualCash: actualCash.toString(),
        expectedCash: expectedCash.toString(),
      })
      .where(eq(shifts.id, shiftId));

    res.json({ success: true, variance: actualCash - expectedCash });
  } catch (err) {
    console.error("Close shift error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Record cash drop
router.post("/shift/drop", async (req, res) => {
  const { id: cashierId } = (req as any).user;
  const { shiftId, amount, reason } = req.body;

  if (!shiftId || !amount || !reason) {
    return res.status(400).json({ error: "shiftId, amount, and reason are required" });
  }

  try {
    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.id, shiftId),
        eq(shifts.cashierId, cashierId),
        eq(shifts.status, "Open"),
      ),
    });

    if (!activeShift) {
      return res.status(404).json({ error: "Active shift not found." });
    }

    const drops = JSON.parse(activeShift.cashDrops || "[]");
    drops.push({ amount, reason, time: new Date().toISOString() });

    await db
      .update(shifts)
      .set({ cashDrops: JSON.stringify(drops) })
      .where(eq(shifts.id, shiftId));

    res.json({ success: true });
  } catch (err) {
    console.error("Record drop error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Adjust cash float
router.post("/shift/float", async (req, res) => {
  const { id: cashierId } = (req as any).user;
  const { shiftId, amount } = req.body;

  if (!shiftId || amount === undefined) {
    return res.status(400).json({ error: "shiftId and amount are required" });
  }

  try {
    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.id, shiftId),
        eq(shifts.cashierId, cashierId),
        eq(shifts.status, "Open"),
      ),
    });

    if (!activeShift) {
      return res.status(404).json({ error: "Active shift not found." });
    }

    await db
      .update(shifts)
      .set({ openingFloat: amount.toString() })
      .where(eq(shifts.id, shiftId));

    res.json({ success: true });
  } catch (err) {
    console.error("Adjust float error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. Get branch catalog
router.get("/catalog", async (req, res) => {
  const { tenantId, branchId } = (req as any).user;
  try {
    const [catalog, dbBarcodes, dbVariants, dbConversions] = await Promise.all([
      db
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
          and(eq(stockLevels.productId, products.id), eq(stockLevels.branchId, branchId))
        )
        .where(eq(products.tenantId, tenantId)),
      db.select().from(productBarcodes),
      db.select().from(productVariants),
      db.select().from(unitConversions),
    ]);

    const catalogWithDetails = catalog.map((item) => {
      const alternateBarcodes = dbBarcodes
        .filter((b) => b.productId === item.id)
        .map((b) => b.barcode);
      const variants = dbVariants
        .filter((v) => v.productId === item.id)
        .map((v) => ({
          variantName: v.variantName,
          variantValue: v.variantValue,
          sku: v.sku,
          priceAdjustment: v.priceAdjustment,
        }));
      const conversions = dbConversions
        .filter((c) => c.productId === item.id)
        .map((c) => ({
          fromUnit: c.fromUnit,
          toUnit: c.toUnit,
          conversionFactor: c.conversionFactor,
        }));

      return {
        ...item,
        alternateBarcodes,
        variants,
        conversions,
      };
    });

    const dbPromotions = await db.select().from(promotions).where(eq(promotions.tenantId, tenantId));

    res.json({
      catalog: catalogWithDetails,
      promotions: dbPromotions,
    });
  } catch (err) {
    console.error("Fetch POS catalog error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 8. Search customers
router.post("/customers/search", async (req, res) => {
  const { tenantId } = (req as any).user;
  const { term } = req.body;

  if (!term || term.length < 2) {
    return res.json({ success: true, customers: [] });
  }

  try {
    const searchStr = `%${term.toLowerCase()}%`;
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

    res.json({ success: true, customers: results });
  } catch (err) {
    console.error("Search customers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 9. Transactional checkout (orders creation + inventory update + customer loyalty logs)
router.post("/checkout", async (req, res) => {
  const { tenantId, branchId, id: cashierId } = (req as any).user;
  const { subtotal, vat, total, payments, items, cashReceived, changeGiven, customerId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Non-empty items array is required" });
  }

  try {
    const activeShift = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.cashierId, cashierId),
        eq(shifts.branchId, branchId),
        eq(shifts.tenantId, tenantId),
        eq(shifts.status, "Open")
      ),
    });

    if (!activeShift) {
      return res.status(400).json({ error: "Please open a cash shift before completing this payment." });
    }

    const activeTillId = activeShift.tillId;
    if (!activeTillId) {
      return res.status(400).json({ error: "No active till session found for checkout." });
    }

    const allowedMethods = ["Cash", "Card", "Loyalty Points", "Store Credit"];
    if (!payments || payments.length === 0) {
      return res.status(400).json({ error: "Select a payment method." });
    }

    let allocatedTotal = 0;
    for (const p of payments) {
      if (p.amount <= 0) {
        return res.status(400).json({ error: "Invalid payment amount." });
      }
      if (!allowedMethods.includes(p.method)) {
        return res.status(400).json({ error: `Invalid payment method: ${p.method}` });
      }
      allocatedTotal += Number(p.amount);
    }

    if (Math.abs(allocatedTotal - total) > 0.01) {
      return res.status(400).json({ error: "Allocate the full amount before completing payment." });
    }

    let orderId: string | undefined;

    // Database transaction block wraps the entire database operation.
    // If any step throws an error, Drizzle will roll back the transaction automatically.
    await db.transaction(async (tx) => {
      const [tenantRec] = await tx
        .select({ monthlyOrderLimit: tenants.monthlyOrderLimit })
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      
      if (!tenantRec) throw new Error("Tenant not found.");

      let activeCustomer = null;
      let pointsToRedeem = 0;
      let creditToRedeem = 0;
      let pointsAmount = 0;

      const settings = await tx.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
      const tenantSetting = settings[0];
      if (!tenantSetting) throw new Error("Tenant settings not found.");

      if (customerId) {
        const [customerRec] = await tx
          .select()
          .from(customers)
          .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
        
        if (!customerRec) throw new Error("Customer not found.");
        if (!customerRec.isActive) throw new Error("Customer is not active.");
        activeCustomer = customerRec;
      }

      for (const p of payments) {
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
        await tx.execute(sql`UPDATE customers SET store_credit = store_credit - ${creditToRedeem} WHERE id = ${customerId} AND tenant_id = ${tenantId}`);
      }
      if (pointsToRedeem > 0) {
        await tx.execute(sql`UPDATE customers SET points = points - ${pointsToRedeem} WHERE id = ${customerId} AND tenant_id = ${tenantId}`);
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
        .insert(invoiceSequences)
        .values({ tenantId, currentValue: 1 })
        .onConflictDoUpdate({
          target: invoiceSequences.tenantId,
          set: { currentValue: sql`${invoiceSequences.currentValue} + 1` },
        })
        .returning({ val: invoiceSequences.currentValue });
        
      const invNumber = `INV-${uaeDate.getFullYear()}-${seqResult[0].val.toString().padStart(5, '0')}`;

      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId,
          branchId,
          cashierId,
          tillId: activeTillId,
          customerId: customerId || null,
          subtotal: subtotal.toString(),
          vat: vat.toString(),
          total: total.toString(),
          cashReceived: cashReceived ? cashReceived.toString() : null,
          changeGiven: changeGiven ? changeGiven.toString() : null,
          invoiceNumber: invNumber,
          status: "completed",
        })
        .returning({ id: orders.id });

      if (!newOrder) {
        throw new Error("Failed to create order.");
      }
      orderId = newOrder.id;

      const paymentRecords = payments.map((p: any) => ({
        orderId: newOrder.id,
        method: p.method,
        amount: p.amount.toString(),
      }));

      await tx.insert(orderPayments).values(paymentRecords);

      const itemRecords = items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice.toString(),
      }));

      await tx.insert(orderItems).values(itemRecords);

      if (creditToRedeem > 0) {
        await tx.insert(customerTransactions).values({
          tenantId,
          customerId: customerId!,
          orderId: newOrder.id,
          type: "use_credit",
          points: 0,
          amount: creditToRedeem.toString()
        });
      }
      if (pointsToRedeem > 0) {
        await tx.insert(customerTransactions).values({
          tenantId,
          customerId: customerId!,
          orderId: newOrder.id,
          type: "redeem_points",
          points: -pointsToRedeem,
          amount: pointsAmount.toString()
        });
      }

      if (activeCustomer) {
        const pointsRate = Number(tenantSetting.loyaltyPointsPerAed || 0);
        const pointsToEarn = Math.floor(Number(total) * pointsRate);
        if (pointsToEarn > 0) {
          await tx.insert(customerTransactions).values({
            tenantId,
            customerId: customerId!,
            orderId: newOrder.id,
            type: "earn_points",
            points: pointsToEarn,
            amount: total.toString(),
          });
          await tx.execute(sql`UPDATE customers SET points = points + ${pointsToEarn} WHERE id = ${customerId} AND tenant_id = ${tenantId}`);
        }
      }

      // Decrement stock levels and batches
      for (const item of items) {
        const [product] = await tx
          .select({ isBatchTracked: products.isBatchTracked, name: products.name })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) throw new Error("Product not found");

        const factor = item.conversionFactor ? Number(item.conversionFactor) : 1;
        const baseQtyToDeduct = item.qty * factor;

        if (product.isBatchTracked) {
          const availableBatches = await tx
            .select()
            .from(batches)
            .where(
              and(
                eq(batches.productId, item.productId),
                eq(batches.branchId, branchId),
                gt(batches.stock, 0),
              )
            )
            .orderBy(asc(batches.expiryDate));

          let remainingQtyToDeduct = baseQtyToDeduct;
          const now = new Date();

          for (const batch of availableBatches) {
            if (remainingQtyToDeduct <= 0) break;
            if (new Date(batch.expiryDate) <= now) continue;

            const deduct = Math.min(batch.stock, remainingQtyToDeduct);
            await tx
              .update(batches)
              .set({ stock: sql`${batches.stock} - ${deduct}` })
              .where(eq(batches.id, batch.id));

            await tx.insert(inventoryLedger).values({
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
              `Cannot fulfill ${item.qty} of ${product.name} because remaining stock is either expired or insufficient.`
            );
          }
        }

        const stockUpdateResult = await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} - ${baseQtyToDeduct}` })
          .where(
            and(
              eq(stockLevels.productId, item.productId), 
              eq(stockLevels.branchId, branchId),
              gte(stockLevels.stock, baseQtyToDeduct)
            )
          ).returning({ id: stockLevels.id });
          
        if (stockUpdateResult.length === 0) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }
    });

    res.json({ success: true, orderId });
  } catch (err: any) {
    console.error("POS checkout error:", err);
    res.status(500).json({ error: err.message || "Checkout failed" });
  }
});

export default router;
