import { Router } from "express";
import { db } from "../db/index.js";
import { priceOverrideRequests, branches, products, stockLevels } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { logAuditAction } from "./audit-helper.js";

const router = Router();
router.use(requireAuth);

// 1. List override requests (join with branch name and product name)
router.get("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const results = await db
      .select({
        id: priceOverrideRequests.id,
        tenantId: priceOverrideRequests.tenantId,
        branchId: priceOverrideRequests.branchId,
        branchName: branches.name,
        productId: priceOverrideRequests.productId,
        productName: products.name,
        stockLevelId: priceOverrideRequests.stockLevelId,
        standardPrice: priceOverrideRequests.standardPrice,
        requestedPrice: priceOverrideRequests.requestedPrice,
        reason: priceOverrideRequests.reason,
        status: priceOverrideRequests.status,
        createdAt: priceOverrideRequests.createdAt,
        approvedAt: priceOverrideRequests.approvedAt,
      })
      .from(priceOverrideRequests)
      .innerJoin(branches, eq(priceOverrideRequests.branchId, branches.id))
      .innerJoin(products, eq(priceOverrideRequests.productId, products.id))
      .where(eq(priceOverrideRequests.tenantId, tenantId))
      .orderBy(desc(priceOverrideRequests.createdAt));

    res.json(results);
  } catch (error) {
    console.error("List override requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Approve request
router.post("/:id/approve", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const result = await db.transaction(async (tx) => {
      // Find the request
      const [reqObj] = await tx
        .select()
        .from(priceOverrideRequests)
        .where(and(eq(priceOverrideRequests.id, id), eq(priceOverrideRequests.tenantId, tenantId)));

      if (!reqObj) {
        throw new Error("Price override request not found");
      }
      if (reqObj.status !== "Pending") {
        throw new Error("Request has already been processed");
      }

      // Update request status
      const updated = await tx
        .update(priceOverrideRequests)
        .set({
          status: "Approved",
          approvedBy: userId,
          approvedAt: new Date(),
        })
        .where(eq(priceOverrideRequests.id, id))
        .returning();

      // Update price override in stockLevels
      await tx
        .update(stockLevels)
        .set({
          priceOverride: reqObj.requestedPrice,
        })
        .where(eq(stockLevels.id, reqObj.stockLevelId));

      return updated[0];
    });

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Price Request Approved",
      "PriceRequest",
      id,
      { productId: result.productId, requestedPrice: result.requestedPrice }
    );

    res.json({ success: true, request: result });
  } catch (error: any) {
    console.error("Approve price request error:", error);
    res.status(400).json({ error: error.message || "Failed to approve request" });
  }
});

// 3. Reject request
router.post("/:id/reject", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const userId = (req as AuthRequest).user?.id || null;
  const branchId = (req as AuthRequest).user?.branchId || null;
  const { id } = req.params;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  try {
    const result = await db.transaction(async (tx) => {
      // Find the request
      const [reqObj] = await tx
        .select()
        .from(priceOverrideRequests)
        .where(and(eq(priceOverrideRequests.id, id), eq(priceOverrideRequests.tenantId, tenantId)));

      if (!reqObj) {
        throw new Error("Price override request not found");
      }
      if (reqObj.status !== "Pending") {
        throw new Error("Request has already been processed");
      }

      // Update request status
      const updated = await tx
        .update(priceOverrideRequests)
        .set({
          status: "Rejected",
          approvedBy: userId,
          approvedAt: new Date(),
        })
        .where(eq(priceOverrideRequests.id, id))
        .returning();

      return updated[0];
    });

    await logAuditAction(
      tenantId,
      userId,
      branchId,
      "Price Request Rejected",
      "PriceRequest",
      id,
      { productId: result.productId, requestedPrice: result.requestedPrice }
    );

    res.json({ success: true, request: result });
  } catch (error: any) {
    console.error("Reject price request error:", error);
    res.status(400).json({ error: error.message || "Failed to reject request" });
  }
});

export default router;
