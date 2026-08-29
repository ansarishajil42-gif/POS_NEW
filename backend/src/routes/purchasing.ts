import { Router } from "express";
import { db } from "../db/index.js";
import { 
  branches, purchaseOrders, purchaseOrderItems, grn, grnItems, vendorInvoices, 
  vendors, products, batches, stockLevels 
} from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// ---------------------------------------------------------
// PURCHASE ORDERS
// ---------------------------------------------------------

router.get("/pos", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  try {
    const pos = await db.query.purchaseOrders.findMany({
      where: eq(purchaseOrders.tenantId, tenantId),
      with: {
        vendor: true,
        items: {
          with: { product: true }
        }
      },
      orderBy: [desc(purchaseOrders.createdAt)],
    });
    res.json(pos);
  } catch (err) {
    console.error("Fetch POs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pos", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { branchId, vendorId, total, items } = req.body;
  if (!vendorId || !items || !items.length) {
    return res.status(400).json({ error: "vendorId and items are required" });
  }

  try {
    const defaultBranchRes = await db.query.branches.findFirst({
      where: eq(branches.tenantId, tenantId)
    });
    const defaultBranchId = defaultBranchRes?.id || "00000000-0000-0000-0000-000000000000";

    const newPo = await db.insert(purchaseOrders).values({
      tenantId,
      branchId: branchId || defaultBranchId,
      vendorId,
      status: "Draft",
      total: total.toString(),
    }).returning();

    const poId = newPo[0].id;
    const poItemsVals = items.map((i: any) => ({
      purchaseOrderId: poId,
      productId: i.productId,
      qty: i.qty,
      unitPrice: i.unitPrice.toString(),
    }));
    await db.insert(purchaseOrderItems).values(poItemsVals);

    const fullPo = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, poId),
      with: { vendor: true, items: { with: { product: true } } }
    });
    res.status(201).json(fullPo);
  } catch (err) {
    console.error("Create PO error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/pos/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const { status } = req.body;
  try {
    const updated = await db.update(purchaseOrders)
      .set({ status })
      .where(and(eq(purchaseOrders.id, req.params.id), eq(purchaseOrders.tenantId, tenantId)))
      .returning();
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/pos/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  try {
    await db.delete(purchaseOrders)
      .where(and(eq(purchaseOrders.id, req.params.id), eq(purchaseOrders.tenantId, tenantId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// GRNs
// ---------------------------------------------------------

router.get("/grns", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  try {
    const grns = await db.query.grn.findMany({
      where: eq(grn.tenantId, tenantId),
      with: {
        vendor: true,
        purchaseOrder: true,
        items: {
          with: { product: true }
        }
      },
      orderBy: [desc(grn.receivedAt)],
    });
    res.json(grns);
  } catch (err) {
    console.error("Fetch GRNs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pos/:id/grn", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const poId = req.params.id;
  const { items } = req.body; // array of { productId, receivedQty, batchNumber, expiryDate }

  try {
    const po = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, poId), eq(purchaseOrders.tenantId, tenantId)),
      with: { items: { with: { product: true } } }
    });
    if (!po) return res.status(404).json({ error: "PO not found" });
    if (po.status !== "Ordered" && po.status !== "Draft") {
      return res.status(400).json({ error: "PO cannot be received in current state" });
    }

    let hasVariance = false;
    const grnItemsVals: any[] = [];
    const newBatches: any[] = [];

    for (const poItem of po.items) {
      const recItem = items?.find((i: any) => i.productId === poItem.productId);
      const receivedQty = recItem ? parseInt(recItem.receivedQty) || 0 : 0;
      const variance = poItem.qty - receivedQty;
      if (variance !== 0) hasVariance = true;

      grnItemsVals.push({
        productId: poItem.productId,
        orderedQty: poItem.qty,
        receivedQty,
        variance,
      });

      // Handle batch tracking
      if (poItem.product.isBatchTracked && receivedQty > 0) {
        if (!recItem?.batchNumber || !recItem?.expiryDate) {
          return res.status(400).json({ error: `Batch info missing for tracked product: ${poItem.product.name}` });
        }
        newBatches.push({
          productId: poItem.productId,
          batchNumber: recItem.batchNumber,
          expiryDate: new Date(recItem.expiryDate),
          quantity: receivedQty,
        });
      }
    }

    const defaultBranchRes = await db.query.branches.findFirst({
      where: eq(branches.tenantId, tenantId)
    });
    const defaultBranchId = defaultBranchRes?.id || "00000000-0000-0000-0000-000000000000";

    // Insert GRN
    const newGrn = await db.insert(grn).values({
      tenantId,
      branchId: po.branchId || defaultBranchId,
      purchaseOrderId: po.id,
      vendorId: po.vendorId,
      grnNumber: `GRN-${Math.floor(10000 + Math.random() * 90000)}`,
      status: hasVariance ? "variance" : "received",
    }).returning();

    if (grnItemsVals.length > 0) {
      grnItemsVals.forEach(g => g.grnId = newGrn[0].id);
      await db.insert(grnItems).values(grnItemsVals);
    }

    // Update PO status
    await db.update(purchaseOrders).set({ status: "GRN" }).where(eq(purchaseOrders.id, poId));

    res.status(201).json(newGrn[0]);
  } catch (err) {
    console.error("Create GRN error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// VENDOR INVOICES
// ---------------------------------------------------------

router.get("/invoices", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  try {
    const invoices = await db.query.vendorInvoices.findMany({
      where: eq(vendorInvoices.tenantId, tenantId),
      with: { vendor: true, purchaseOrder: true },
      orderBy: [desc(vendorInvoices.createdAt)],
    });
    res.json(invoices);
  } catch (err) {
    console.error("Fetch invoices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/grns/:id/invoice", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const grnId = req.params.id;

  try {
    const grnRec = await db.query.grn.findFirst({
      where: and(eq(grn.id, grnId), eq(grn.tenantId, tenantId)),
      with: { purchaseOrder: true }
    });
    if (!grnRec) return res.status(404).json({ error: "GRN not found" });

    if (grnRec.purchaseOrder) {
      if (grnRec.purchaseOrder.status === "Invoiced") {
        return res.status(400).json({ error: "Already invoiced" });
      }
    }

    const newInvoice = await db.insert(vendorInvoices).values({
      tenantId,
      vendorId: grnRec.vendorId,
      invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      purchaseOrderId: grnRec.purchaseOrderId,
      total: grnRec.purchaseOrder ? grnRec.purchaseOrder.total : "0",
      status: "pending",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }).returning();

    if (grnRec.purchaseOrderId) {
      await db.update(purchaseOrders).set({ status: "Invoiced" }).where(eq(purchaseOrders.id, grnRec.purchaseOrderId));
    }

    res.status(201).json(newInvoice[0]);
  } catch (err) {
    console.error("Create Invoice error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/invoices/:id/pay", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  try {
    const updated = await db.update(vendorInvoices)
      .set({ status: "paid" })
      .where(and(eq(vendorInvoices.id, req.params.id), eq(vendorInvoices.tenantId, tenantId)))
      .returning();
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
