import { Router } from "express";
import { db } from "../db/index.js";
import { staffUsers } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get users (filtered by tenantId, branchId)
router.get("/", async (req, res) => {
  const { tenantId, branchId, role } = req.query;
  console.log("[Backend] GET /users query params:", { tenantId, branchId, role });
  try {
    let conditions = [];
    if (tenantId) {
      conditions.push(eq(staffUsers.tenantId, tenantId as string));
    }
    if (branchId) {
      conditions.push(eq(staffUsers.branchId, branchId as string));
    }
    if (role) {
      conditions.push(eq(staffUsers.role, role as any));
    }

    let result;
    if (conditions.length > 0) {
      result = await db.select({
        id: staffUsers.id,
        tenantId: staffUsers.tenantId,
        branchId: staffUsers.branchId,
        name: staffUsers.name,
        email: staffUsers.email,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
        createdAt: staffUsers.createdAt,
      })
        .from(staffUsers)
        .where(and(...conditions));
    } else {
      result = await db.select({
        id: staffUsers.id,
        tenantId: staffUsers.tenantId,
        branchId: staffUsers.branchId,
        name: staffUsers.name,
        email: staffUsers.email,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
        createdAt: staffUsers.createdAt,
      })
        .from(staffUsers);
    }

    // Attach isCustomized flag if overrides exist
    let overrides: any[] = [];
    if (tenantId) {
      const { staffPermissionOverrides } = await import("../db/schema.js");
      overrides = await db.select().from(staffPermissionOverrides).where(eq(staffPermissionOverrides.tenantId, tenantId as string));
    }

    const formatted = result.map(u => {
      const userOverrides = overrides.filter(o => o.staffUserId === u.id);
      return {
        ...u,
        isCustomized: userOverrides.length > 0
      };
    });

    console.log("[Backend] GET /users returning users count:", formatted.length);
    res.json(formatted);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create user (hashing password or PIN)
router.post("/", async (req, res) => {
  const { tenantId, branchId, name, email, password, pin, role } = req.body;
  console.log("[Backend] POST /users payload:", { tenantId, branchId, name, email, role, passwordProvided: !!password, pinProvided: !!pin });

  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }

  try {
    let passwordHash = null;
    let pinHash = null;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    const newUser = await db.insert(staffUsers).values({
      tenantId,
      branchId,
      name,
      email,
      passwordHash,
      pinHash,
      role,
      isActive: true,
    }).returning({
      id: staffUsers.id,
      tenantId: staffUsers.tenantId,
      branchId: staffUsers.branchId,
      name: staffUsers.name,
      email: staffUsers.email,
      role: staffUsers.role,
      isActive: staffUsers.isActive,
    });

    console.log("[Backend] POST /users created user:", newUser[0]);
    res.status(201).json(newUser[0]);
  } catch (error: any) {
    console.error("Create user error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Update user details or toggle status
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password, pin, role, isActive, branchId } = req.body;

  try {
    let passwordHash = undefined;
    let pinHash = undefined;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    const updated = await db.update(staffUsers)
      .set({
        ...(name && { name }),
        ...(email && { email }),
        ...(branchId && { branchId }),
        ...(passwordHash && { passwordHash }),
        ...(pinHash && { pinHash }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(eq(staffUsers.id, id))
      .returning({
        id: staffUsers.id,
        tenantId: staffUsers.tenantId,
        branchId: staffUsers.branchId,
        name: staffUsers.name,
        email: staffUsers.email,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
      });

    if (updated.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Delete user
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const tenantId = (req as any).user?.tenantId;

  try {
    const { orders, shifts } = await import("../db/schema.js");

    // Check linked orders
    const linkedOrders = await db.select({ id: orders.id })
      .from(orders)
      .where(eq(orders.cashierId, id))
      .limit(1);

    if (linkedOrders.length > 0) {
      return res.status(400).json({ error: "linked records maujood hain" });
    }

    // Check linked shifts
    const linkedShifts = await db.select({ id: shifts.id })
      .from(shifts)
      .where(eq(shifts.cashierId, id))
      .limit(1);

    if (linkedShifts.length > 0) {
      return res.status(400).json({ error: "linked records maujood hain" });
    }

    const deleted = await db.delete(staffUsers)
      .where(and(eq(staffUsers.id, id), eq(staffUsers.tenantId, tenantId)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: "User not found or you don't have permission" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get role permissions
router.get("/permissions", requireAuth, async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  try {
    const { rolePermissions } = await import("../db/schema.js");
    const perms = await db.select().from(rolePermissions).where(eq(rolePermissions.tenantId, tenantId));
    res.json(perms);
  } catch (error) {
    console.error("Fetch permissions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Toggle role permission
router.patch("/permissions/toggle", requireAuth, async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const { role, permission, enabled } = req.body;

  if (!role || !permission || enabled === undefined) {
    return res.status(400).json({ error: "role, permission, and enabled are required" });
  }

  try {
    const { rolePermissions } = await import("../db/schema.js");
    const existing = await db.select().from(rolePermissions)
      .where(and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, role),
        eq(rolePermissions.permission, permission)
      ));

    if (existing.length > 0) {
      const updated = await db.update(rolePermissions)
        .set({ enabled })
        .where(eq(rolePermissions.id, existing[0].id))
        .returning();
      res.json(updated[0]);
    } else {
      const inserted = await db.insert(rolePermissions)
        .values({ tenantId, role, permission, enabled })
        .returning();
      res.json(inserted[0]);
    }
  } catch (error) {
    console.error("Toggle permission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get individual staff user permissions (default role + overrides merged)
router.get("/:id/permissions", requireAuth, async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const staffUserId = req.params.id;
  try {
    const { rolePermissions, staffPermissionOverrides, staffUsers } = await import("../db/schema.js");
    
    // Find the user to get their role
    const user = await db.query.staffUsers.findFirst({
      where: and(eq(staffUsers.id, staffUserId), eq(staffUsers.tenantId, tenantId)),
    });
    if (!user) {
      return res.status(404).json({ error: "Staff user not found" });
    }

    // Get all default role-level permissions
    const roleDefaultPerms = await db.select().from(rolePermissions).where(
      and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, user.role))
    );

    // Get all individual overrides for this staff user
    const overrides = await db.select().from(staffPermissionOverrides).where(
      and(eq(staffPermissionOverrides.tenantId, tenantId), eq(staffPermissionOverrides.staffUserId, staffUserId))
    );

    res.json({
      role: user.role,
      roleDefaults: roleDefaultPerms,
      overrides: overrides,
    });
  } catch (error) {
    console.error("Fetch staff permissions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Toggle individual staff user permission override
router.post("/:id/permissions/override", requireAuth, async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const staffUserId = req.params.id;
  const { permission, enabled } = req.body;

  if (!permission || enabled === undefined) {
    return res.status(400).json({ error: "permission and enabled are required" });
  }

  try {
    const { staffPermissionOverrides } = await import("../db/schema.js");
    
    const existing = await db.select().from(staffPermissionOverrides).where(
      and(
        eq(staffPermissionOverrides.tenantId, tenantId),
        eq(staffPermissionOverrides.staffUserId, staffUserId),
        eq(staffPermissionOverrides.permission, permission)
      )
    );

    if (existing.length > 0) {
      const updated = await db.update(staffPermissionOverrides)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(staffPermissionOverrides.id, existing[0].id))
        .returning();
      res.json(updated[0]);
    } else {
      const inserted = await db.insert(staffPermissionOverrides)
        .values({ tenantId, staffUserId, permission, enabled })
        .returning();
      res.json(inserted[0]);
    }
  } catch (error) {
    console.error("Upsert staff override error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset all overrides for a specific staff user
router.delete("/:id/permissions/override", requireAuth, async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const staffUserId = req.params.id;
  try {
    const { staffPermissionOverrides } = await import("../db/schema.js");
    
    await db.delete(staffPermissionOverrides).where(
      and(
        eq(staffPermissionOverrides.tenantId, tenantId),
        eq(staffPermissionOverrides.staffUserId, staffUserId)
      )
    );
    res.json({ success: true, message: "Overrides reset successfully" });
  } catch (error) {
    console.error("Reset staff overrides error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
