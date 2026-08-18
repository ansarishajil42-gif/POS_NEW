import { Router } from "express";
import { db } from "../db/index.js";
import { vendors, purchaseOrders } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get vendors (optionally filtered by tenantId)
router.get("/", async (req, res) => {
  const { tenantId } = req.query;
  try {
    let result;
    if (tenantId) {
      result = await db.select().from(vendors).where(eq(vendors.tenantId, tenantId as string));
    } else {
      result = await db.select().from(vendors);
    }
    res.json(result);
  } catch (error) {
    console.error("Fetch vendors error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create vendor
router.post("/", async (req, res) => {
  const { tenantId, name, contact, trn } = req.body;
  if (!tenantId || !name) {
    return res.status(400).json({ error: "tenantId and name are required" });
  }

  try {
    const newVendor = await db.insert(vendors).values({
      tenantId,
      name,
      contact,
      trn,
    }).returning();
    res.status(201).json(newVendor[0]);
  } catch (error) {
    console.error("Create vendor error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Purchase Orders
router.get("/purchase-orders", async (req, res) => {
  const { tenantId, branchId } = req.query;
  try {
    let conditions = [];
    if (tenantId) {
      conditions.push(eq(purchaseOrders.tenantId, tenantId as string));
    }
    if (branchId) {
      conditions.push(eq(purchaseOrders.branchId, branchId as string));
    }

    let result;
    if (conditions.length > 0) {
      result = await db.select().from(purchaseOrders).where(and(...conditions));
    } else {
      result = await db.select().from(purchaseOrders);
    }
    res.json(result);
  } catch (error) {
    console.error("Fetch purchase orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Purchase Order
router.post("/purchase-orders", async (req, res) => {
  const { tenantId, branchId, vendorId, status, total } = req.body;
  if (!tenantId || !vendorId || total === undefined) {
    return res.status(400).json({ error: "tenantId, vendorId, and total are required" });
  }

  try {
    const newPo = await db.insert(purchaseOrders).values({
      tenantId,
      branchId,
      vendorId,
      status: status || "Draft",
      total: total.toString(),
    }).returning();
    res.status(201).json(newPo[0]);
  } catch (error) {
    console.error("Create purchase order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Purchase Order Status
router.patch("/purchase-orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status, total } = req.body;

  try {
    const updated = await db.update(purchaseOrders)
      .set({
        ...(status && { status }),
        ...(total !== undefined && { total: total.toString() }),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Update purchase order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
