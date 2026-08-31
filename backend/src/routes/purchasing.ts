import { Router } from "express";
import { db } from "../db/index.js";
import { 
  branches, purchaseOrders, purchaseOrderItems, grn, grnItems, vendorInvoices, 
  vendors, products, batches, stockLevels, tenants, tenantSettings 
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
  const { status, vendorId, branchId, total, items } = req.body;
  try {
    await db.transaction(async (tx) => {
      if (status !== undefined) {
        await tx.update(purchaseOrders)
          .set({ status })
          .where(and(eq(purchaseOrders.id, req.params.id), eq(purchaseOrders.tenantId, tenantId)));
      }

      if (vendorId || branchId || total || items) {
        await tx.update(purchaseOrders)
          .set({
            ...(vendorId && { vendorId }),
            ...(branchId && { branchId }),
            ...(total !== undefined && { total: total.toString() }),
          })
          .where(and(eq(purchaseOrders.id, req.params.id), eq(purchaseOrders.tenantId, tenantId)));

        if (items && items.length) {
          await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, req.params.id));
          const poItemsVals = items.map((i: any) => ({
            purchaseOrderId: req.params.id,
            productId: i.productId,
            qty: i.qty,
            unitPrice: i.unitPrice.toString(),
          }));
          await db.insert(purchaseOrderItems).values(poItemsVals);
        }
      }
    });

    const fullPo = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, req.params.id),
      with: { vendor: true, items: { with: { product: true } } }
    });
    res.json(fullPo);
  } catch (err) {
    console.error("Update PO error:", err);
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
  const { items, grnNumber } = req.body; // array of { productId, receivedQty, batchNumber, expiryDate }

  try {
    if (!grnNumber) {
      return res.status(400).json({ error: "Supplier GRN Number is required" });
    }
    const po = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, poId), eq(purchaseOrders.tenantId, tenantId)),
      with: { items: { with: { product: true } } }
    });
    if (!po) return res.status(404).json({ error: "PO not found" });
    if (po.status !== "Ordered" && po.status !== "Draft" && po.status !== "Sent" && po.status !== "Approved") {
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
      grnNumber: grnNumber,
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
      with: { 
        vendor: true, 
        purchaseOrder: {
          with: {
            items: {
              with: { product: true }
            },
            branch: true
          }
        } 
      },
      orderBy: [desc(vendorInvoices.createdAt)],
    });
    res.json(invoices);
  } catch (err) {
    console.error("Fetch invoices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/invoices/:id", async (req, res) => {
  const tenantId = (req as any).user.tenantId;
  const invoiceId = req.params.id;
  try {
    const invoice = await db.query.vendorInvoices.findFirst({
      where: and(eq(vendorInvoices.tenantId, tenantId), eq(vendorInvoices.id, invoiceId)),
      with: {
        vendor: true,
        purchaseOrder: {
          with: {
            branch: true,
            items: { with: { product: true } },
          },
        },
      },
    });
    
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const po = invoice.purchaseOrder;
    if (!po) return res.status(404).json({ error: "PO not found for invoice" });

    const poGrn = await db.query.grn.findFirst({
      where: and(eq(grn.purchaseOrderId, po.id), eq(grn.tenantId, tenantId)),
      with: { items: { with: { product: true } } },
    });
    
    if (!poGrn) return res.status(404).json({ error: "GRN not found for invoice" });

    const tenantInfo = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    const settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });

    const vatRate = settings ? Number(settings.vatRate) : 5.0;
    const vatInclusive = settings ? settings.vatInclusive : true;
    const currency = settings ? settings.currency : "AED";

    const poItemsMap = new Map(po.items.map((i) => [i.productId, Number(i.unitPrice)]));

    const items = poGrn.items.map((i) => {
      const unitPrice = poItemsMap.get(i.productId) || 0;
      const subtotal = i.receivedQty * unitPrice;
      return {
        productId: i.productId,
        name: i.product?.name || "Unknown Product",
        receivedQty: i.receivedQty,
        unitPrice,
        subtotal,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const total = Number(invoice.total);
    let vat = 0;
    if (vatInclusive) {
      vat = subtotal - subtotal / (1 + vatRate / 100);
    } else {
      vat = total - subtotal;
    }

    res.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status,
      total,
      subtotal,
      vat,
      vatRate,
      vatInclusive,
      currency,
      tenantName: tenantInfo ? tenantInfo.name : "Tenant",
      tenantTrn: settings ? settings.taxRegistrationNumber : null,
      vendorName: invoice.vendor?.name || "Unknown Vendor",
      vendorContact: invoice.vendor?.contact || null,
      vendorPhone: null,
      vendorEmail: invoice.vendor?.email || null,
      vendorAddress: null,
      vendorTrn: invoice.vendor?.trn || null,
      branchName: po.branch?.name || "HQ",
      poNumber: po.id.split("-")[0]?.toUpperCase() || "",
      grnNumber: poGrn.grnNumber,
      items
    });
  } catch (err) {
    console.error("Fetch invoice detail error:", err);
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
