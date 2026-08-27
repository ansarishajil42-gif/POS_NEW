import { Router } from "express";
import { db } from "../db/index.js";
import { orders, orderItems, products, batches, staffUsers, stockLevels } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

// Get orders (with optional filters)
router.get("/", async (req, res) => {
  const { tenantId, branchId, status, limit } = req.query;
  try {
    let conditions = [];
    if (tenantId) {
      conditions.push(eq(orders.tenantId, tenantId as string));
    }
    if (branchId) {
      conditions.push(eq(orders.branchId, branchId as string));
    }
    if (status) {
      conditions.push(eq(orders.status, status as string));
    }

    const queryLimit = limit ? Math.min(Number(limit), 100) : 50;

    let result;
    if (conditions.length > 0) {
      result = await db.query.orders.findMany({
        where: and(...conditions),
        limit: queryLimit,
        orderBy: [desc(orders.createdAt)],
        with: {
          items: true,
        }
      });
    } else {
      result = await db.query.orders.findMany({
        limit: queryLimit,
        orderBy: [desc(orders.createdAt)],
        with: {
          items: true,
        }
      });
    }
    res.json(result);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Order (transactional checkout)
router.post("/", async (req, res) => {
  const { tenantId, branchId, cashierId, tillId, source, subtotal, vat, total, paymentMethod, status, items } = req.body;

  if (!tenantId || !branchId || !total || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "tenantId, branchId, total, and non-empty items array are required" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert order record
      const [newOrder] = await tx.insert(orders).values({
        tenantId,
        branchId,
        cashierId,
        tillId: tillId || "Till 1",
        source: source || "POS",
        subtotal: subtotal.toString(),
        vat: vat.toString(),
        total: total.toString(),
        paymentMethod: paymentMethod || "Cash",
        status: status || "completed",
      }).returning();

      // 2. Process each item (reduce stock and insert orderItems)
      for (const item of items) {
        const { productId, qty, unitPrice } = item;

        // Fetch current product to check stock tracking
        const [prod] = await tx.select().from(products).where(eq(products.id, productId));
        if (!prod) {
          throw new Error(`Product not found: ${productId}`);
        }

        // Reduce stock in stockLevels table
        await tx.update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} - ${qty}` })
          .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, branchId)));

        // If batch tracked, attempt to subtract from oldest active batch
        if (prod.isBatchTracked) {
          const productBatchesList = await tx.select()
            .from(batches)
            .where(eq(batches.productId, productId))
            .orderBy(batches.expiryDate);

          let remainingQty = qty;
          for (const batch of productBatchesList) {
            if (batch.stock >= remainingQty) {
              await tx.update(batches)
                .set({ stock: batch.stock - remainingQty })
                .where(eq(batches.id, batch.id));
              remainingQty = 0;
              break;
            } else {
              await tx.update(batches)
                .set({ stock: 0 })
                .where(eq(batches.id, batch.id));
              remainingQty -= batch.stock;
            }
          }
        }

        // Insert order item record
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId,
          qty,
          unitPrice: unitPrice.toString(),
        });
      }

      return newOrder;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Create order failed:", error);
    res.status(500).json({ error: error.message || "Failed to process order" });
  }
});

// Z-Report / Till Summary
router.get("/report/summary", async (req, res) => {
  const { tenantId, branchId, date } = req.query;
  if (!tenantId || !branchId) {
    return res.status(400).json({ error: "tenantId and branchId are required" });
  }

  try {
    // Construct SQL date filter (default to today if not provided)
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get order aggregations
    const salesSummary = await db.select({
      paymentMethod: orders.paymentMethod,
      count: sql<number>`count(*)`,
      totalSales: sql<number>`sum(${orders.total})`,
      totalVat: sql<number>`sum(${orders.vat})`,
    })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId as string),
          eq(orders.branchId, branchId as string),
          eq(orders.status, "completed"),
          sql`${orders.createdAt} >= ${startOfDay} AND ${orders.createdAt} <= ${endOfDay}`
        )
      )
      .groupBy(orders.paymentMethod);

    res.json({
      date: targetDate.toISOString().split('T')[0],
      summary: salesSummary,
    });
  } catch (error) {
    console.error("Summary report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
