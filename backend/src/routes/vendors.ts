import { Router } from "express";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Get vendors
router.get("/", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  try {
    const result = await db.select().from(vendors).where(eq(vendors.tenantId, tenantId));
    res.json(result);
  } catch (error) {
    console.error("Fetch vendors error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create vendor
router.post("/", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { name, email, trn } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const newVendor = await db.insert(vendors).values({
      tenantId,
      name,
      email: email || null,
      trn: trn || null,
    }).returning();
    res.status(201).json(newVendor[0]);
  } catch (error) {
    console.error("Create vendor error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update vendor
router.patch("/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;
  const { name, email, trn } = req.body;

  try {
    const updated = await db.update(vendors)
      .set({
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(trn !== undefined && { trn }),
      })
      .where(and(eq(vendors.id, id), eq(vendors.tenantId, tenantId)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Update vendor error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete vendor
router.delete("/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id } = req.params;

  try {
    const deleted = await db.delete(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.tenantId, tenantId)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Create Vendor User Account / Login Credentials
router.post("/:id/create-account", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { id: vendorId } = req.params;
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const bcrypt = (await import("bcryptjs")).default;
    const { staffUsers } = await import("../db/schema.js");

    const vendorRec = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, vendorId), eq(vendors.tenantId, tenantId)),
    });

    if (!vendorRec) {
      return res.status(404).json({ error: "Vendor record not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(staffUsers)
      .values({
        tenantId,
        vendorId,
        name: name || vendorRec.name,
        email,
        passwordHash,
        role: "vendor",
        isActive: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: `Vendor login account created for ${vendorRec.name}`,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        vendorId: newUser.vendorId,
      },
    });
  } catch (error: any) {
    console.error("Create vendor account error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
