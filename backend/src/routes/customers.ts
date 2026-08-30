import { Router } from "express";
import { db } from "../db/index.js";
import { customers, customerTransactions, auditLogs, orders } from "../db/schema.js";
import { eq, and, sql, desc, or, ilike, ne } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// 1. List / Search Customers
router.get("/", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;
  const searchStr = (req.query.search || "").toString().trim().toLowerCase();
  
  try {
    let conditions = eq(customers.tenantId, tenantId);
    
    if (searchStr) {
      const searchTerm = `%${searchStr}%`;
      conditions = and(
        eq(customers.tenantId, tenantId),
        or(
          ilike(customers.name, searchTerm),
          ilike(customers.email, searchTerm),
          ilike(customers.phone, searchTerm)
        )
      ) as any;
    }
    
    const results = await db.select()
      .from(customers)
      .where(conditions)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);
      
    res.json({ success: true, customers: results });
  } catch (error) {
    console.error("Search customers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Create Customer
router.post("/", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { name, email, phone, tier } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  
  const emailToUse = email?.toLowerCase().trim() || null;
  const phoneToUse = phone?.trim() || null;
  
  try {
    if (emailToUse) {
      const existingEmail = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.email, emailToUse)))
        .limit(1);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: "Email is already in use by another customer." });
      }
    }
    
    if (phoneToUse) {
      const existingPhone = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phoneToUse)))
        .limit(1);
      if (existingPhone.length > 0) {
        return res.status(400).json({ error: "Phone number is already in use by another customer." });
      }
    }
    
    const [newCustomer] = await db.insert(customers).values({
      tenantId,
      name: name.trim(),
      phone: phoneToUse,
      email: emailToUse,
      tier: tier || "Bronze",
      points: 0,
      storeCredit: "0.00",
      isActive: true,
    }).returning();
    
    // Log audit
    await db.insert(auditLogs).values({
      tenantId,
      userId: (req as any).user.id,
      action: "Customer Profile Created",
      entityType: "Customer",
      entityId: newCustomer.id,
      details: { name: newCustomer.name }
    });
    
    res.status(201).json({ success: true, customer: newCustomer });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Get Customer Details
router.get("/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;
  
  try {
    const [customer] = await db.select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
      
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ success: true, customer });
  } catch (error) {
    console.error("Get customer details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Update Customer
router.patch("/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;
  const { name, email, phone, isActive } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  
  const emailToUse = email?.toLowerCase().trim() || null;
  const phoneToUse = phone?.trim() || null;
  
  try {
    if (emailToUse) {
      const existingEmail = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.email, emailToUse), ne(customers.id, id)))
        .limit(1);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: "Email is already in use by another customer." });
      }
    }
    
    if (phoneToUse) {
      const existingPhone = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phoneToUse), ne(customers.id, id)))
        .limit(1);
      if (existingPhone.length > 0) {
        return res.status(400).json({ error: "Phone number is already in use by another customer." });
      }
    }
    
    const [updated] = await db.update(customers)
      .set({
        name: name.trim(),
        phone: phoneToUse,
        email: emailToUse,
        isActive: isActive !== undefined ? isActive : true,
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();
      
    if (!updated) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    // Log audit
    await db.insert(auditLogs).values({
      tenantId,
      userId: (req as any).user.id,
      action: "Customer Profile Updated",
      entityType: "Customer",
      entityId: updated.id,
      details: { isActive: updated.isActive }
    });
    
    res.json({ success: true, customer: updated });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Customer Purchase History
router.get("/:id/history", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;
  
  try {
    const customerOrders = await db.select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, id)))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
      
    const [totalAgg] = await db.select({
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

// 6. Adjust Points
router.post("/:id/adjust-points", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;
  const { pointsDelta, reason } = req.body;
  
  const delta = Number(pointsDelta);
  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ error: "Adjustment points delta must be a non-zero number" });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required for manual points adjustment" });
  }
  
  try {
    const result = await db.transaction(async (tx) => {
      const [customer] = await tx.select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
        
      if (!customer) {
        throw new Error("Customer not found");
      }
      
      const newBalance = customer.points + delta;
      if (newBalance < 0) {
        throw new Error("Adjustment would result in negative point balance");
      }
      
      await tx.update(customers)
        .set({ points: newBalance })
        .where(eq(customers.id, id));
        
      await tx.insert(customerTransactions).values({
        tenantId,
        customerId: id,
        type: "adjust_points",
        points: delta,
      });
      
      await tx.insert(auditLogs).values({
        tenantId,
        userId: (req as any).user.id,
        action: "Points Adjusted",
        entityType: "Customer",
        entityId: id,
        details: { delta, reason: reason.trim() }
      });
      
      return { success: true, newBalance };
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Adjust points error:", error);
    res.status(400).json({ error: error.message || "Failed to adjust points" });
  }
});

// 7. Adjust Balance
router.post("/:id/adjust-balance", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;
  const { amountDelta, reason } = req.body;
  
  const delta = Number(amountDelta);
  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ error: "Adjustment amount delta must be a non-zero number" });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required for manual store credit adjustment" });
  }
  
  try {
    const result = await db.transaction(async (tx) => {
      const [customer] = await tx.select()
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
      
      await tx.update(customers)
        .set({ storeCredit: newBalance.toFixed(2) })
        .where(eq(customers.id, id));
        
      await tx.insert(customerTransactions).values({
        tenantId,
        customerId: id,
        type: delta > 0 ? "add_credit" : "use_credit",
        points: 0,
        amount: delta.toFixed(2),
      });
      
      await tx.insert(auditLogs).values({
        tenantId,
        userId: (req as any).user.id,
        action: "Store Credit Adjusted",
        entityType: "Customer",
        entityId: id,
        details: { delta, reason: reason.trim() }
      });
      
      return { success: true, newBalance };
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("Adjust store credit error:", error);
    res.status(400).json({ error: error.message || "Failed to adjust store credit" });
  }
});

export default router;
