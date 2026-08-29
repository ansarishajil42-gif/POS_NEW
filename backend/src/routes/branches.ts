import { Router } from "express";
import { db } from "../db/index.js";
import { branches, staffUsers, orders, shifts, stockLevels } from "../db/schema.js";
import { eq, sql, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get branches (optionally filtered by tenantId)
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const queryTenantId = req.query.tenantId as string;
  const user = req.user!;

  try {
    let result;
    if (user.role === "super_admin") {
      if (queryTenantId) {
        result = await db.select().from(branches).where(eq(branches.tenantId, queryTenantId));
      } else {
        result = await db.select().from(branches);
      }
    } else {
      if (!user.tenantId) {
        return res.status(403).json({ error: "Forbidden: No tenant associated with this user" });
      }
      result = await db.select().from(branches).where(eq(branches.tenantId, user.tenantId));
    }

    const branchIds = result.map((b: any) => b.id);
    let finalResult = result as any[];

    if (branchIds.length > 0) {
      // 1. Staff Count
      const staffCounts = await db
        .select({ branchId: staffUsers.branchId, count: sql<number>`count(${staffUsers.id})` })
        .from(staffUsers)
        .where(inArray(staffUsers.branchId, branchIds))
        .groupBy(staffUsers.branchId);

      // 2. Stock Alerts Count
      const alerts = await db
        .select({ branchId: stockLevels.branchId, count: sql<number>`count(${stockLevels.id})` })
        .from(stockLevels)
        .where(sql`${stockLevels.branchId} IN ${branchIds} AND ${stockLevels.stock} <= ${stockLevels.reorderLevel}`)
        .groupBy(stockLevels.branchId);

      // 3. Sales Today
      const sales = await db
        .select({ branchId: orders.branchId, total: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(sql`${orders.branchId} IN ${branchIds} AND date(${orders.createdAt}) = current_date`)
        .groupBy(orders.branchId);

      finalResult = result.map((b: any) => {
        const staff = staffCounts.find((s) => s.branchId === b.id)?.count || 0;
        const stockAlerts = alerts.find((a) => a.branchId === b.id)?.count || 0;
        const salesToday = sales.find((s) => s.branchId === b.id)?.total || 0;
        return { 
          ...b, 
          staffCount: Number(staff), 
          stockAlerts: Number(stockAlerts), 
          salesToday: Number(salesToday) 
        };
      });
    }

    res.json(finalResult);
  } catch (error) {
    console.error("Fetch branches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create branch
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  let { tenantId, name, address, tillCount } = req.body;
  const user = req.user!;

  if (user.role !== "super_admin") {
    if (!user.tenantId) return res.status(403).json({ error: "Forbidden" });
    tenantId = user.tenantId; // force current user's tenant
  }

  if (!tenantId || !name) {
    return res.status(400).json({ error: "Tenant ID and name are required" });
  }
  try {
    const newBranch = await db.insert(branches).values({
      tenantId,
      name,
      address,
      tillCount: tillCount || 1,
      status: "Active",
    }).returning();
    res.status(201).json(newBranch[0]);
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Edit branch
router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, address, tillCount, status } = req.body;
  const user = req.user!;
  
  try {
    // Verify ownership
    if (user.role !== "super_admin") {
      const existing = await db.select().from(branches).where(eq(branches.id, id));
      if (!existing.length || existing[0].tenantId !== user.tenantId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const updated = await db.update(branches)
      .set({
        ...(name && { name }),
        ...(address && { address }),
        ...(tillCount !== undefined && { tillCount }),
        ...(status && { status }),
      })
      .where(eq(branches.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete branch
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  
  try {
    // Verify ownership
    if (user.role !== "super_admin") {
      const existing = await db.select().from(branches).where(eq(branches.id, id));
      if (!existing.length || existing[0].tenantId !== user.tenantId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // Safety checks
    const branchStaff = await db.select({ count: sql<number>`count(*)::int` }).from(staffUsers).where(eq(staffUsers.branchId, id));
    if (branchStaff[0].count > 0) {
      return res.status(400).json({ error: "Branch cannot be deleted because it has assigned staff members." });
    }
    
    const branchOrders = await db.select({ count: sql<number>`count(*)::int` }).from(orders).where(eq(orders.branchId, id));
    if (branchOrders[0].count > 0) {
      return res.status(400).json({ error: "Branch cannot be deleted because it has orders." });
    }

    const branchShifts = await db.select({ count: sql<number>`count(*)::int` }).from(shifts).where(eq(shifts.branchId, id));
    if (branchShifts[0].count > 0) {
      return res.status(400).json({ error: "Branch cannot be deleted because it has shift records." });
    }

    const deleted = await db.delete(branches).where(eq(branches.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get branch stock levels
router.get("/:id/stock", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  try {
    // Verify ownership
    if (user.role !== "super_admin") {
      const existing = await db.select().from(branches).where(eq(branches.id, id));
      if (!existing.length || existing[0].tenantId !== user.tenantId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // Join stock_levels with products to get product names and categories
    const { products } = await import("../db/schema.js");
    const stock = await db
      .select({
        id: stockLevels.id,
        productId: stockLevels.productId,
        productName: products.name,
        category: products.category,
        stock: stockLevels.stock,
        reorderLevel: stockLevels.reorderLevel
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(eq(stockLevels.branchId, id));

    res.json(stock);
  } catch (error) {
    console.error("Fetch branch stock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get branch staff
router.get("/:id/staff", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  try {
    // Verify ownership
    if (user.role !== "super_admin") {
      const existing = await db.select().from(branches).where(eq(branches.id, id));
      if (!existing.length || existing[0].tenantId !== user.tenantId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const staff = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.name,
        role: staffUsers.role,
        isActive: staffUsers.isActive
      })
      .from(staffUsers)
      .where(eq(staffUsers.branchId, id));

    res.json(staff);
  } catch (error) {
    console.error("Fetch branch staff error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
