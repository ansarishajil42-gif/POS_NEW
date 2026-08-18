import { Router } from "express";
import { db } from "../db/index.js";
import { branches } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// Get branches (optionally filtered by tenantId)
router.get("/", async (req, res) => {
  const { tenantId } = req.query;
  try {
    let result;
    if (tenantId) {
      result = await db.select().from(branches).where(eq(branches.tenantId, tenantId as string));
    } else {
      result = await db.select().from(branches);
    }
    res.json(result);
  } catch (error) {
    console.error("Fetch branches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create branch
router.post("/", async (req, res) => {
  const { tenantId, name, address, tillCount } = req.body;
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
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, tillCount, status } = req.body;
  try {
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

export default router;
