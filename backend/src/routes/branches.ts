import { Router } from "express";
import { db } from "../db/index.js";
import { branches, staffUsers, orders, shifts } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
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
    res.json(result);
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

export default router;
