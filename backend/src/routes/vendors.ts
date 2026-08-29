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

export default router;
