import { Router } from "express";
import { db } from "../db/index.js";
import { promotions } from "../db/schema.js";
import { eq, and, desc, ne } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { logAuditAction } from "./audit-helper.js";

const router = Router();
router.use(requireAuth);

// 1. List promotions
router.get("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const status = req.query.status ? String(req.query.status) : null; // Active, Inactive, Archived

  try {
    let whereClause;
    if (status) {
      whereClause = and(eq(promotions.tenantId, tenantId), eq(promotions.status, status));
    } else {
      // By default show all except Archived if status filter is empty (align with Web app)
      whereClause = and(eq(promotions.tenantId, tenantId), ne(promotions.status, "Archived"));
    }

    const results = await db
      .select()
      .from(promotions)
      .where(whereClause)
      .orderBy(desc(promotions.createdAt));

    res.json(results);
  } catch (error) {
    console.error("List promotions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Create promotion
router.post("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const {
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    status,
    type,
    target,
    value,
    targetCategory,
    targetProductIds,
    bundleProducts,
    pricingBasis,
    minQty,
    maxQty,
    startTime,
    endTime,
  } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
  if (!discountType) return res.status(400).json({ error: "Discount type is required" });
  if (discountValue === undefined || isNaN(Number(discountValue))) return res.status(400).json({ error: "Valid discount value is required" });
  if (!startDate || !endDate) return res.status(400).json({ error: "Start and end dates are required" });

  try {
    const normalizedType = String(discountType).toLowerCase() === "fixed" ? "Fixed" : "Percentage";

    const newPromo = await db
      .insert(promotions)
      .values({
        tenantId,
        name: name.trim(),
        discountType: normalizedType,
        discountValue: Number(discountValue).toFixed(2),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || "Active",
        type: type || null,
        target: target || null,
        value: value || null,
        targetCategory: targetCategory || null,
        targetProductIds: targetProductIds || null,
        bundleProducts: bundleProducts ? JSON.stringify(bundleProducts) : null,
        pricingBasis: pricingBasis || null,
        minQty: minQty ? parseInt(minQty) : null,
        maxQty: maxQty ? parseInt(maxQty) : null,
        startTime: startTime || null,
        endTime: endTime || null,
      })
      .returning();

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Promotion Created",
      "Promotion",
      newPromo[0].id,
      { name: newPromo[0].name }
    );

    res.status(201).json(newPromo[0]);
  } catch (error) {
    console.error("Create promotion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Edit promotion
router.patch("/:id", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const {
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    status,
    type,
    target,
    value,
    targetCategory,
    targetProductIds,
    bundleProducts,
    pricingBasis,
    minQty,
    maxQty,
    startTime,
    endTime,
  } = req.body;

  try {
    const updated = await db
      .update(promotions)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: Number(discountValue).toFixed(2) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(status !== undefined && { status }),
        ...(type !== undefined && { type }),
        ...(target !== undefined && { target }),
        ...(value !== undefined && { value }),
        ...(targetCategory !== undefined && { targetCategory }),
        ...(targetProductIds !== undefined && { targetProductIds }),
        ...(bundleProducts !== undefined && { bundleProducts: bundleProducts ? JSON.stringify(bundleProducts) : null }),
        ...(pricingBasis !== undefined && { pricingBasis }),
        ...(minQty !== undefined && { minQty: minQty ? parseInt(minQty) : null }),
        ...(maxQty !== undefined && { maxQty: maxQty ? parseInt(maxQty) : null }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
      })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, tenantId)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Promotion Updated",
      "Promotion",
      id,
      { name: updated[0].name, status: updated[0].status }
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Update promotion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Activate promotion
router.post("/:id/activate", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const updated = await db
      .update(promotions)
      .set({ status: "Active" })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, tenantId)))
      .returning();

    if (updated.length === 0) return res.status(404).json({ error: "Promotion not found" });

    await logAuditAction(tenantId, userId, branchId, "Promotion Activated", "Promotion", id, { name: updated[0].name });
    res.json({ success: true, promotion: updated[0] });
  } catch (error) {
    console.error("Activate promotion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Deactivate promotion
router.post("/:id/deactivate", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const updated = await db
      .update(promotions)
      .set({ status: "Inactive" })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, tenantId)))
      .returning();

    if (updated.length === 0) return res.status(404).json({ error: "Promotion not found" });

    await logAuditAction(tenantId, userId, branchId, "Promotion Deactivated", "Promotion", id, { name: updated[0].name });
    res.json({ success: true, promotion: updated[0] });
  } catch (error) {
    console.error("Deactivate promotion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Archive promotion
router.post("/:id/archive", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const updated = await db
      .update(promotions)
      .set({ status: "Archived" })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, tenantId)))
      .returning();

    if (updated.length === 0) return res.status(404).json({ error: "Promotion not found" });

    await logAuditAction(tenantId, userId, branchId, "Promotion Archived", "Promotion", id, { name: updated[0].name });
    res.json({ success: true, promotion: updated[0] });
  } catch (error) {
    console.error("Archive promotion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
