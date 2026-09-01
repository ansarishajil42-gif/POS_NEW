import { Router } from "express";
import { db } from "../db/index.js";
import { orders, orderItems, products, batches, stockLevels, inventoryLedger } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { logAuditAction } from "./audit-helper.js";

const router = Router();
router.use(requireAuth);

// Get orders (with optional filters)
router.get("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId || (req.query.tenantId as string);
  const { branchId, status, limit } = req.query;
  try {
    let conditions = [];
    if (tenantId) {
      conditions.push(eq(orders.tenantId, tenantId));
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
        },
      });
    } else {
      result = await db.query.orders.findMany({
        limit: queryLimit,
        orderBy: [desc(orders.createdAt)],
        with: {
          items: true,
        },
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
  const tenantId = (req as AuthRequest).user?.tenantId || req.body.tenantId;
  const userId = (req as AuthRequest).user?.id || req.body.cashierId;
  const { branchId, cashierId, tillId, source, subtotal, vat, total, paymentMethod, status, items } = req.body;

  if (!tenantId || !branchId || !total || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "tenantId, branchId, total, and non-empty items array are required" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert order record
      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId,
          branchId,
          cashierId: cashierId || userId,
          tillId: tillId || "Till 1",
          source: source || "POS",
          subtotal: subtotal.toString(),
          vat: vat.toString(),
          total: total.toString(),
          paymentMethod: paymentMethod || "Cash",
          status: status || "completed",
        })
        .returning();

      // 2. Process each item (reduce stock and insert orderItems)
      for (const item of items) {
        const { productId, qty, unitPrice } = item;

        const [prod] = await tx.select().from(products).where(eq(products.id, productId));
        if (!prod) {
          throw new Error(`Product not found: ${productId}`);
        }

        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} - ${qty}` })
          .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, branchId)));

        if (prod.isBatchTracked) {
          const productBatchesList = await tx
            .select()
            .from(batches)
            .where(eq(batches.productId, productId))
            .orderBy(batches.expiryDate);

          let remainingQty = qty;
          for (const batch of productBatchesList) {
            if (batch.stock >= remainingQty) {
              await tx
                .update(batches)
                .set({ stock: batch.stock - remainingQty })
                .where(eq(batches.id, batch.id));
              remainingQty = 0;
              break;
            } else {
              await tx.update(batches).set({ stock: 0 }).where(eq(batches.id, batch.id));
              remainingQty -= batch.stock;
            }
          }
        }

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

// Void Receipt / Order Cancelation
router.post("/:id/void", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  const { reason } = req.body;

  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const orderRecord = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
      with: { items: true },
    });

    if (!orderRecord) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orderRecord.status === "voided") {
      return res.status(400).json({ error: "Order is already voided" });
    }

    await db.transaction(async (tx) => {
      // 1. Mark order status as voided
      await tx.update(orders).set({ status: "voided" }).where(eq(orders.id, id));

      // 2. Restore stock levels
      for (const item of orderRecord.items) {
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} + ${item.qty}` })
          .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, orderRecord.branchId)));
      }
    });

    // 3. Emit immutable audit log
    await logAuditAction(tenantId, userId, branchId || orderRecord.branchId, "Void Receipt", "Order", id, {
      originalTotal: orderRecord.total,
      subtotal: orderRecord.subtotal,
      vat: orderRecord.vat,
      itemCount: orderRecord.items.length,
      reason: reason || "POS Cashier Void",
    });

    res.json({ success: true, message: "Order voided and audit log recorded." });
  } catch (error: any) {
    console.error("Void order error:", error);
    res.status(500).json({ error: error.message || "Failed to void order" });
  }
});

// Refund Receipt / Order Refund
router.post("/:id/refund", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  const { reason, amount } = req.body;

  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const orderRecord = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
      with: { items: true },
    });

    if (!orderRecord) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orderRecord.status === "refunded") {
      return res.status(400).json({ error: "Order is already refunded" });
    }

    const refundAmount = amount ? amount.toString() : orderRecord.total;

    await db.transaction(async (tx) => {
      // 1. Mark order status as refunded
      await tx.update(orders).set({ status: "refunded" }).where(eq(orders.id, id));

      // 2. Restore stock levels
      for (const item of orderRecord.items) {
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} + ${item.qty}` })
          .where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, orderRecord.branchId)));
      }
    });

    // 3. Emit immutable audit log
    await logAuditAction(tenantId, userId, branchId || orderRecord.branchId, "Order Refunded", "Order", id, {
      refundAmount,
      originalTotal: orderRecord.total,
      reason: reason || "Customer Receipt Refund",
    });

    res.json({ success: true, message: "Order refunded and audit log recorded." });
  } catch (error: any) {
    console.error("Refund order error:", error);
    res.status(500).json({ error: error.message || "Failed to refund order" });
  }
});

// Z-Report / Till Summary
router.get("/report/summary", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId || (req.query.tenantId as string);
  const { branchId, date } = req.query;
  if (!tenantId || !branchId) {
    return res.status(400).json({ error: "tenantId and branchId are required" });
  }

  try {
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const salesSummary = await db
      .select({
        paymentMethod: orders.paymentMethod,
        count: sql<number>`count(*)`,
        totalSales: sql<number>`sum(${orders.total})`,
        totalVat: sql<number>`sum(${orders.vat})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.branchId, branchId as string),
          eq(orders.status, "completed"),
          sql`${orders.createdAt} >= ${startOfDay} AND ${orders.createdAt} <= ${endOfDay}`
        )
      )
      .groupBy(orders.paymentMethod);

    res.json({
      date: targetDate.toISOString().split("T")[0],
      summary: salesSummary,
    });
  } catch (error) {
    console.error("Summary report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
