import { Router } from "express";
import { db } from "../db/index.js";
import { staffUsers } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

// Get users (filtered by tenantId, branchId)
router.get("/", async (req, res) => {
  const { tenantId, branchId, role } = req.query;
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
        email: staffUsers.email,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
        createdAt: staffUsers.createdAt,
      })
        .from(staffUsers);
    }
    res.json(result);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create user (hashing password or PIN)
router.post("/", async (req, res) => {
  const { tenantId, branchId, email, password, pin, role } = req.body;

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
      email,
      passwordHash,
      pinHash,
      role,
      isActive: true,
    }).returning({
      id: staffUsers.id,
      tenantId: staffUsers.tenantId,
      branchId: staffUsers.branchId,
      email: staffUsers.email,
      role: staffUsers.role,
      isActive: staffUsers.isActive,
    });

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user details or toggle status
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password, pin, role, isActive } = req.body;

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
        ...(email && { email }),
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
        email: staffUsers.email,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
      });

    if (updated.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
