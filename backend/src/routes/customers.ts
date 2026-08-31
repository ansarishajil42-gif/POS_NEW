import { Router } from "express";
import { db } from "../db/index.js";
import { customers, customerTransactions, orders } from "../db/schema.js";
import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { logAuditAction } from "./audit-helper.js";

const router = Router();
router.use(requireAuth);

// 1. Search/list customers (with search string, pagination)
router.get("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const search = req.query.search ? String(req.query.search).trim() : "";
  const page = parseInt(String(req.query.page || "1")) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "50")) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    let whereClause = eq(customers.tenantId, tenantId);
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      whereClause = and(
        eq(customers.tenantId, tenantId),
        or(
          ilike(customers.name, searchPattern),
          ilike(customers.email, searchPattern),
          ilike(customers.phone, searchPattern)
        )
      ) as any;
    }

    const results = await db
      .select()
      .from(customers)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(customers.createdAt));

    res.json(results);
  } catch (error) {
    console.error("List customers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Get customer details
router.get("/:id", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const result = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    if (result.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Create customer
router.post("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const { name, email, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const newCustomer = await db
      .insert(customers)
      .values({
        tenantId,
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        points: 0,
        tier: "Bronze",
        storeCredit: "0.00",
        isActive: true,
      })
      .returning();

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Customer Created",
      "Customer",
      newCustomer[0].id,
      { name: newCustomer[0].name }
    );

    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Update customer
router.patch("/:id", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const { name, email, phone, isActive } = req.body;

  try {
    const updated = await db
      .update(customers)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Customer Updated",
      "Customer",
      id,
      { name: updated[0].name, isActive: updated[0].isActive }
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Get customer purchase history
router.get("/:id/history", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const page = parseInt(String(req.query.page || "1")) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "50")) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, id)))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalAgg] = await db
      .select({
        totalSpend: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, id)));

    res.json({
      success: true,
      orders: customerOrders,
      totalSpend: Number(totalAgg?.totalSpend || 0),
      orderCount: Number(totalAgg?.count || 0)
    });
  } catch (error) {
    console.error("Get customer history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Adjust customer loyalty points
router.post("/:id/adjust-points", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  const { pointsDelta, reason } = req.body;

  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
  if (pointsDelta === undefined || isNaN(Number(pointsDelta)) || Number(pointsDelta) === 0) {
    return res.status(400).json({ error: "Valid points delta is required" });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required for manual adjustments" });
  }

  try {
    const delta = Math.floor(Number(pointsDelta));

    const result = await db.transaction(async (tx) => {
      const [customer] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

      if (!customer) {
        throw new Error("Customer not found");
      }

      const newBalance = customer.points + delta;
      if (newBalance < 0) {
        throw new Error("Adjustment would result in negative points balance");
      }

      // Determine Tier based on points
      // Bronze: < 1000, Silver: 1000-4999, Gold: 5000-14999, Platinum: >= 15000
      let tier = "Bronze";
      if (newBalance >= 15000) tier = "Platinum";
      else if (newBalance >= 5000) tier = "Gold";
      else if (newBalance >= 1000) tier = "Silver";

      const updated = await tx
        .update(customers)
        .set({
          points: newBalance,
          tier,
        })
        .where(eq(customers.id, id))
        .returning();

      await tx.insert(customerTransactions).values({
        tenantId,
        customerId: id,
        type: "adjust_points",
        points: delta,
        amount: "0.00",
      });

      return updated[0];
    });

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Points Adjusted",
      "Customer",
      id,
      { delta, reason, newPoints: result.points }
    );

    res.json({ success: true, customer: result });
  } catch (error: any) {
    console.error("Adjust points error:", error);
    res.status(400).json({ error: error.message || "Failed to adjust points" });
  }
});

// 7. Adjust customer store credit balance
router.post("/:id/adjust-credit", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  const { amountDelta, reason } = req.body;

  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
  if (amountDelta === undefined || isNaN(Number(amountDelta)) || Number(amountDelta) === 0) {
    return res.status(400).json({ error: "Valid amount delta is required" });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required for manual adjustments" });
  }

  try {
    const delta = Number(amountDelta);

    const result = await db.transaction(async (tx) => {
      const [customer] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

      if (!customer) {
        throw new Error("Customer not found");
      }

      const currentBalance = Number(customer.storeCredit || 0);
      const newBalance = currentBalance + delta;
      if (newBalance < 0) {
        throw new Error("Adjustment would result in negative store credit balance");
      }

      const updated = await tx
        .update(customers)
        .set({
          storeCredit: newBalance.toFixed(2),
        })
        .where(eq(customers.id, id))
        .returning();

      await tx.insert(customerTransactions).values({
        tenantId,
        customerId: id,
        type: delta > 0 ? "add_credit" : "use_credit",
        points: 0,
        amount: delta.toFixed(2),
      });

      return updated[0];
    });

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Store Credit Adjusted",
      "Customer",
      id,
      { delta, reason, newCredit: result.storeCredit }
    );

    res.json({ success: true, customer: result });
  } catch (error: any) {
    console.error("Adjust credit error:", error);
    res.status(400).json({ error: error.message || "Failed to adjust store credit" });
  }
});

export default router;
