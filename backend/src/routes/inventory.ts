import { Router } from "express";
import { db } from "../db/index.js";
import {
  branches,
  stockLevels,
  products,
  batches,
  stockTransfers,
  tenants,
  purchaseOrders,
  purchaseOrderItems,
  vendors,
  inventoryLedger,
  promotions,
  stockAdjustments
} from "../db/schema.js";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Helper Context
async function getInventoryContext(req: AuthRequest) {
  const tenantId = req.user?.tenantId;
  const branchId = req.user?.branchId;
  const role = req.user?.role;
  const userId = req.user?.id;

  if (!tenantId || !userId) {
    throw new Error("Unauthorized");
  }

  // Multi-branch visibility scope: Inventory Manager is scoped to their branch
  const branchScope = role === "inventory_manager" && branchId ? [branchId] : null;

  return { tenantId, branchId, role, userId, branchScope };
}

// 1. Unified Inventory Dashboard Data Fetch
router.get("/data", async (req, res) => {
  try {
    const { tenantId, branchScope, role } = await getInventoryContext(req as AuthRequest);

    // 1. Tenant info
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

    // 2. Branches list within scope
    let branchWhere = eq(branches.tenantId, tenantId);
    if (branchScope) {
      branchWhere = and(eq(branches.tenantId, tenantId), inArray(branches.id, branchScope))!;
    }
    const allBranches = await db.select().from(branches).where(branchWhere);

    // All tenant branches for transfers list target
    const allTenantBranches = await db.select().from(branches).where(eq(branches.tenantId, tenantId));

    // 3. Active vendors (vendors table has no status column)
    const allVendors = await db
      .select()
      .from(vendors)
      .where(eq(vendors.tenantId, tenantId));

    // 4. Stock Levels
    let stockWhere = eq(products.tenantId, tenantId);
    if (branchScope) {
      stockWhere = and(eq(products.tenantId, tenantId), inArray(stockLevels.branchId, branchScope))!;
    }

    const allStockLevels = await db
      .select({
        id: stockLevels.id,
        stock: stockLevels.stock,
        reorderLevel: stockLevels.reorderLevel,
        branchId: stockLevels.branchId,
        branchName: branches.name,
        productId: products.id,
        productName: products.name,
        sku: products.barcode, // use barcode as sku
        barcode: products.barcode,
        category: products.category,
        unit: products.unit,
        costPrice: products.costPrice,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .innerJoin(branches, eq(stockLevels.branchId, branches.id))
      .where(stockWhere);

    // 5. FEFO Batches
    let batchWhere = eq(products.tenantId, tenantId);
    if (branchScope) {
      batchWhere = and(eq(products.tenantId, tenantId), inArray(batches.branchId, branchScope))!;
    }

    const allBatches = await db
      .select({
        id: batches.id,
        batchNumber: batches.batchNumber,
        expiryDate: batches.expiryDate,
        stock: batches.stock,
        productId: products.id,
        productName: products.name,
        sku: products.barcode,
        branchId: batches.branchId,
        branchName: branches.name,
      })
      .from(batches)
      .innerJoin(products, eq(batches.productId, products.id))
      .leftJoin(branches, eq(batches.branchId, branches.id))
      .where(batchWhere)
      .orderBy(batches.expiryDate);

    // 6. Recent Stock Transfers
    let transfersWhere = eq(stockTransfers.tenantId, tenantId);
    if (branchScope) {
      transfersWhere = and(
        eq(stockTransfers.tenantId, tenantId),
        or(
          inArray(stockTransfers.sourceBranchId, branchScope),
          inArray(stockTransfers.destinationBranchId, branchScope),
        ),
      )!;
    }

    const rawTransfers = await db
      .select()
      .from(stockTransfers)
      .where(transfersWhere)
      .orderBy(desc(stockTransfers.createdAt))
      .limit(50);

    const allTransfers = rawTransfers.map((t) => {
      const product = allStockLevels.find((s) => s.productId === t.productId) || {
        productName: "Unknown",
        sku: "",
      };
      const source = allTenantBranches.find((b) => b.id === t.sourceBranchId);
      const target = allTenantBranches.find((b) => b.id === t.destinationBranchId);
      return {
        ...t,
        productName: product.productName,
        sku: product.sku,
        sourceBranchName: source?.name || "Unknown",
        destinationBranchName: target?.name || "Unknown",
      };
    });

    // Compute stats
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const lowStockItems = allStockLevels.filter((s) => s.stock <= s.reorderLevel);
    const expiredBatches = allBatches.filter(
      (b) => b.expiryDate && new Date(b.expiryDate) <= now && b.stock > 0
    );
    const nearExpiryBatches = allBatches.filter(
      (b) =>
        b.expiryDate &&
        new Date(b.expiryDate) > now &&
        new Date(b.expiryDate) <= thirtyDaysFromNow &&
        b.stock > 0
    );

    res.json({
      tenant,
      role,
      branchScope,
      branches: allBranches,
      allTenantBranches,
      vendors: allVendors,
      stockLevels: allStockLevels,
      batches: allBatches,
      transfers: allTransfers,
      stats: {
        totalSkus: Array.from(new Set(allStockLevels.map((s) => s.productId))).length,
        lowStockCount: lowStockItems.length,
        expiredCount: expiredBatches.length,
        nearExpiryCount: nearExpiryBatches.length,
      },
      alerts: {
        lowStock: lowStockItems,
        expired: expiredBatches,
        nearExpiry: nearExpiryBatches,
      },
    });
  } catch (error: any) {
    console.error("Get inventory data error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 2. Inter-Branch Stock Transfer
router.post("/transfer", async (req, res) => {
  const { productId, sourceBranchId, targetBranchId, quantity } = req.body;

  if (!productId || !sourceBranchId || !targetBranchId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid transfer input parameters" });
  }

  try {
    const { tenantId, branchScope, userId } = await getInventoryContext(req as AuthRequest);

    if (branchScope) {
      const hasSourceAccess = branchScope.includes(sourceBranchId);
      const hasTargetAccess = branchScope.includes(targetBranchId);
      if (!hasSourceAccess && !hasTargetAccess) {
        return res.status(403).json({ error: "Forbidden: Unauthorized branch scope" });
      }
    }

    await db.transaction(async (tx) => {
      // Branch validation
      const branchCheck = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(
            eq(branches.tenantId, tenantId),
            inArray(branches.id, [sourceBranchId, targetBranchId]),
          ),
        );
      if (branchCheck.length !== 2) throw new Error("Unauthorized or invalid branches");

      // Decrement source stock
      const sourceStock = await tx
        .select()
        .from(stockLevels)
        .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, sourceBranchId)))
        .limit(1);

      if (sourceStock.length === 0 || sourceStock[0].stock < quantity) {
        throw new Error("Insufficient stock in source branch");
      }

      await tx
        .update(stockLevels)
        .set({ stock: sql`${stockLevels.stock} - ${quantity}` })
        .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, sourceBranchId)));

      // Increment destination stock
      const targetStock = await tx
        .select()
        .from(stockLevels)
        .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, targetBranchId)))
        .limit(1);

      if (targetStock.length > 0) {
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} + ${quantity}` })
          .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, targetBranchId)));
      } else {
        await tx.insert(stockLevels).values({
          productId,
          branchId: targetBranchId,
          stock: quantity,
          reorderLevel: 10,
        });
      }

      // Log stock transfer
      await tx.insert(stockTransfers).values({
        tenantId,
        productId,
        sourceBranchId,
        destinationBranchId: targetBranchId,
        quantity,
        transferredBy: userId,
        status: "Completed",
      });

      // Log source branch movement in ledger
      await tx.insert(inventoryLedger).values({
        tenantId,
        branchId: sourceBranchId,
        productId,
        transactionType: "Transfer Out",
        previousQuantity: sourceStock[0].stock,
        changedQuantity: -Number(quantity),
        newQuantity: sourceStock[0].stock - Number(quantity),
        createdBy: userId,
      });

      // Log destination branch movement in ledger
      const prevTargetQty = targetStock.length > 0 ? targetStock[0].stock : 0;
      await tx.insert(inventoryLedger).values({
        tenantId,
        branchId: targetBranchId,
        productId,
        transactionType: "Transfer In",
        previousQuantity: prevTargetQty,
        changedQuantity: Number(quantity),
        newQuantity: prevTargetQty + Number(quantity),
        createdBy: userId,
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Stock transfer error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3. Draft Purchase Order (PO)
router.post("/draft-po", async (req, res) => {
  const { vendorId, branchId, productId, qty } = req.body;

  if (!vendorId || !branchId || !productId || !qty || qty <= 0) {
    return res.status(400).json({ error: "Invalid PO Draft parameters" });
  }

  try {
    const { tenantId, branchScope } = await getInventoryContext(req as AuthRequest);

    if (branchScope && !branchScope.includes(branchId)) {
      return res.status(403).json({ error: "Forbidden: Unauthorized branch scope" });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const unitPrice = parseFloat(product.costPrice || "0.00");
    const subtotal = qty * unitPrice;
    const vatRate = 5.0; // standard 5% VAT rate
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    let poId = "";
    await db.transaction(async (tx) => {
      const [po] = await tx
        .insert(purchaseOrders)
        .values({
          tenantId,
          branchId,
          vendorId,
          status: "Draft",
          total: total.toFixed(2),
        })
        .returning({ id: purchaseOrders.id });

      poId = po.id;

      await tx.insert(purchaseOrderItems).values({
        purchaseOrderId: po.id,
        productId,
        qty,
        unitPrice: unitPrice.toFixed(2),
      });
    });

    res.json({ success: true, poId });
  } catch (error: any) {
    console.error("Draft PO error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 4. Apply Clearance pricing trigger promotion
router.post("/clearance", async (req, res) => {
  const { productId, discountPct } = req.body;

  if (!productId || discountPct === undefined || isNaN(Number(discountPct))) {
    return res.status(400).json({ error: "productId and discountPct are required" });
  }

  try {
    const { tenantId } = await getInventoryContext(req as AuthRequest);

    // Create a promotion in database
    await db.insert(promotions).values({
      tenantId,
      name: "Clearance Sale - Near Expiry",
      discountType: "percentage",
      discountValue: String(discountPct),
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days promo
      status: "Active",
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Clearance promo error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 5. Inventory Stock Adjust with Ledger logging
router.post("/adjust", async (req, res) => {
  const { productId, branchId, batchId, quantityChange, reason } = req.body;

  if (!productId || !branchId || quantityChange === undefined || isNaN(Number(quantityChange)) || !reason) {
    return res.status(400).json({ error: "productId, branchId, quantityChange, and reason are required" });
  }

  try {
    const { tenantId, branchScope, userId } = await getInventoryContext(req as AuthRequest);

    if (branchScope && !branchScope.includes(branchId)) {
      return res.status(403).json({ error: "Forbidden: Unauthorized branch scope" });
    }

    await db.transaction(async (tx) => {
      let previousQty = 0;

      if (batchId) {
        // batches has no tenant_id column
        const [batch] = await tx
          .select()
          .from(batches)
          .where(and(eq(batches.id, batchId), eq(batches.branchId, branchId)));

        if (!batch) throw new Error("Batch record not found");
        previousQty = batch.stock;
        const newQty = previousQty + Number(quantityChange);
        if (newQty < 0) throw new Error("Adjustment violates stock constraints (stock cannot go below 0)");

        await tx.update(batches).set({ stock: newQty }).where(eq(batches.id, batchId));

        // Also sync generic branch stock levels
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} + ${quantityChange}` })
          .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, branchId)));
      } else {
        const [level] = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, branchId)));

        if (!level) throw new Error("Stock level not found for this product branch scope");
        previousQty = level.stock;
        const newQty = previousQty + Number(quantityChange);
        if (newQty < 0) throw new Error("Adjustment violates stock constraints (stock cannot go below 0)");

        await tx.update(stockLevels).set({ stock: newQty }).where(eq(stockLevels.id, level.id));
      }

      // 1. Record stock adjustments audit log
      const [adj] = await tx
        .insert(stockAdjustments)
        .values({
          tenantId,
          branchId,
          productId,
          batchId: batchId || null,
          previousQuantity: previousQty,
          quantityChange: Number(quantityChange),
          newQuantity: previousQty + Number(quantityChange),
          reason,
          adjustedBy: userId,
        })
        .returning({ id: stockAdjustments.id });

      // 2. Record movement in inventory ledger
      await tx.insert(inventoryLedger).values({
        tenantId,
        branchId,
        productId,
        batchId: batchId || null,
        transactionType: "Adjustment",
        previousQuantity: previousQty,
        changedQuantity: Number(quantityChange),
        newQuantity: previousQty + Number(quantityChange),
        referenceId: adj?.id || null,
        createdBy: userId,
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Adjust stock error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 6. Get Inventory Ledger history log
router.get("/ledger", async (req, res) => {
  try {
    const { tenantId, branchScope } = await getInventoryContext(req as AuthRequest);

    let ledgerWhere = eq(inventoryLedger.tenantId, tenantId);
    if (branchScope) {
      ledgerWhere = and(eq(inventoryLedger.tenantId, tenantId), inArray(inventoryLedger.branchId, branchScope))!;
    }

    const records = await db
      .select({
        id: inventoryLedger.id,
        transactionType: inventoryLedger.transactionType,
        previousQuantity: inventoryLedger.previousQuantity,
        changedQuantity: inventoryLedger.changedQuantity,
        newQuantity: inventoryLedger.newQuantity,
        createdAt: inventoryLedger.createdAt,
        productName: products.name,
        branchName: branches.name,
        batchNumber: batches.batchNumber,
      })
      .from(inventoryLedger)
      .innerJoin(products, eq(inventoryLedger.productId, products.id))
      .innerJoin(branches, eq(inventoryLedger.branchId, branches.id))
      .leftJoin(batches, eq(inventoryLedger.batchId, batches.id))
      .where(ledgerWhere)
      .orderBy(desc(inventoryLedger.createdAt))
      .limit(100);

    res.json({ success: true, ledger: records });
  } catch (error: any) {
    console.error("Ledger fetch error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
