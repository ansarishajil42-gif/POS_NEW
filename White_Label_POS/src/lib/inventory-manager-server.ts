import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import {
  branches,
  stockLevels,
  products,
  batches,
  stockTransfers,
  tenants,
  tenantSettings,
  purchaseOrders,
  purchaseOrderItems,
  vendors,
} from "../server/db/schema";
import * as schema from "../server/db/schema";

// Middleware
async function getInventoryManagerContext() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session) {
    throw new Error("Unauthorized");
  }
  const role = res.session.role;
  if (role !== "Inventory Manager" && role !== "Head Office Admin" && role !== "Super Admin") {
    throw new Error("Unauthorized");
  }

  const tenantId = res.session.tenantId;
  let branchScope: string[] | null = null; // null means global

  if (role === "Inventory Manager") {
    if (!res.session.branchId) {
      throw new Error("No branch is assigned to this user.");
    }
    branchScope = [res.session.branchId];
  }

  return {
    tenantId,
    role,
    branchScope,
  };
}

export const getInventoryDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId, branchScope, role } = await getInventoryManagerContext();

  // 1. Get tenant info
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  // 2. Get branches
  let branchWhere = eq(branches.tenantId, tenantId);
  if (branchScope) {
    branchWhere = and(eq(branches.tenantId, tenantId), inArray(branches.id, branchScope))!;
  }

  const allBranches = await db.query.branches.findMany({
    where: branchWhere,
  });

  // Also fetch all tenant branches unscoped for the transfer destination list
  const allTenantBranches = await db.query.branches.findMany({
    where: eq(branches.tenantId, tenantId),
  });

  // 2.5 Get vendors
  let allVendors: any[] = [];
  try {
    allVendors = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.tenantId, tenantId), eq(vendors.status, "Active")));
  } catch (e) {
    console.warn("Table vendors might not exist yet:", e);
  }

  // 2. Get stock levels across all branches with product info
  let allStockLevels: any[] = [];
  try {
    allStockLevels = await db
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
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .innerJoin(branches, eq(stockLevels.branchId, branches.id))
      .where(
        branchScope
          ? and(eq(products.tenantId, tenantId), inArray(stockLevels.branchId, branchScope))
          : eq(products.tenantId, tenantId),
      );
  } catch (e) {
    console.warn("Table stockLevels might not exist yet:", e);
  }

  // 3. Get batches (FEFO)
  let allBatches: any[] = [];
  try {
    allBatches = await db
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
      .where(
        branchScope
          ? and(eq(products.tenantId, tenantId), inArray(batches.branchId, branchScope))
          : eq(products.tenantId, tenantId),
      )
      .orderBy(batches.expiryDate);
  } catch (e) {
    console.warn("Table batches might not exist yet:", e);
  }

  // Calculate some global stats
  const totalItems = allStockLevels.length;
  const lowStockItems = allStockLevels.filter((s) => s.stock <= s.reorderLevel);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const expiredBatches = allBatches.filter(
    (b) => b.expiryDate && new Date(b.expiryDate) <= now && b.stock > 0,
  );
  const nearExpiryBatches = allBatches.filter(
    (b) =>
      b.expiryDate &&
      new Date(b.expiryDate) > now &&
      new Date(b.expiryDate) <= thirtyDaysFromNow &&
      b.stock > 0,
  );

  // 4. Get recent stock transfers
  let rawTransfers: any[] = [];
  try {
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

    rawTransfers = await db
      .select()
      .from(stockTransfers)
      .where(transfersWhere)
      .orderBy(desc(stockTransfers.createdAt))
      .limit(50);
  } catch (e) {
    console.warn("Table stock_transfers might not exist yet:", e);
  }

  // Map names manually to avoid needing drizzle relations definition
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

  const result = {
    tenant,
    role,
    branchScope,
    branches: allBranches,
    allTenantBranches,
    vendors: allVendors,
    stockLevels: allStockLevels,
    batches: allBatches,
    transfers: allTransfers,
    allowPoDraft: false, // Default to false for now until db is migrated
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
  };

  try {
    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, tenantId),
    });
    if (settings && "allowInventoryManagerPoDraft" in settings) {
      result.allowPoDraft = !!settings.allowInventoryManagerPoDraft;
    }
  } catch (e) {
    console.warn("Could not fetch tenant settings for PO draft permission:", e);
  }

  return JSON.parse(JSON.stringify(result));
});

export const stockTransferServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: { productId: string; sourceBranchId: string; targetBranchId: string; quantity: number }) =>
      d,
  )
  .handler(async ({ data }) => {
    const { tenantId, branchScope } = await getInventoryManagerContext();

    if (!data.sourceBranchId) throw new Error("Source branch is required");
    if (!data.targetBranchId) throw new Error("Destination branch is required");
    if (data.sourceBranchId === data.targetBranchId)
      throw new Error("Source and destination must be different");
    if (!data.quantity || data.quantity <= 0)
      throw new Error("Quantity must be a positive number greater than 0");

    // Scope verification
    if (branchScope) {
      const hasSourceAccess = branchScope.includes(data.sourceBranchId);
      const hasTargetAccess = branchScope.includes(data.targetBranchId);
      if (!hasSourceAccess && !hasTargetAccess) {
        throw new Error("Forbidden: You do not have permission to transfer between these branches");
      }
    }

    // Perform transactional update using db.transaction
    await db.transaction(async (tx) => {
      // Tenant Isolation check for branches
      const branchCheck = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(
            eq(branches.tenantId, tenantId),
            inArray(branches.id, [data.sourceBranchId, data.targetBranchId]),
          ),
        );
      if (branchCheck.length !== 2) throw new Error("Unauthorized or invalid branches");

      // Decrement from source
      const sourceStock = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, data.productId),
            eq(stockLevels.branchId, data.sourceBranchId),
          ),
        )
        .limit(1);

      if (sourceStock.length === 0 || sourceStock[0].stock < data.quantity) {
        throw new Error("Insufficient stock in source branch");
      }

      await tx
        .update(stockLevels)
        .set({ stock: sql`${stockLevels.stock} - ${data.quantity}` })
        .where(
          and(
            eq(stockLevels.productId, data.productId),
            eq(stockLevels.branchId, data.sourceBranchId),
          ),
        );

      // Increment target
      const targetStock = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, data.productId),
            eq(stockLevels.branchId, data.targetBranchId),
          ),
        )
        .limit(1);

      if (targetStock.length > 0) {
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} + ${data.quantity}` })
          .where(
            and(
              eq(stockLevels.productId, data.productId),
              eq(stockLevels.branchId, data.targetBranchId),
            ),
          );
      } else {
        await tx.insert(stockLevels).values({
          productId: data.productId,
          branchId: data.targetBranchId,
          stock: data.quantity,
          reorderLevel: 10,
        });
      }

      // Log the transfer
      await tx.insert(stockTransfers).values({
        tenantId: tenantId,
        productId: data.productId,
        sourceBranchId: data.sourceBranchId,
        destinationBranchId: data.targetBranchId,
        quantity: data.quantity,
        status: "Completed",
      });
    });

    return { success: true };
  });

export const draftPurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator((d: { vendorId: string; branchId: string; productId: string; qty: number }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchScope } = await getInventoryManagerContext();

    if (branchScope && !branchScope.includes(data.branchId)) {
      throw new Error("Forbidden: You do not have permission to draft PO for this branch.");
    }

    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, tenantId),
    });

    if (
      !settings ||
      !("allowInventoryManagerPoDraft" in settings) ||
      !settings.allowInventoryManagerPoDraft
    ) {
      throw new Error("Unauthorized: PO Draft creation is disabled for Inventory Managers.");
    }

    if (!data.vendorId || !data.branchId || !data.productId || !data.qty || data.qty <= 0) {
      throw new Error("Invalid PO Draft data");
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, data.productId), eq(products.tenantId, tenantId)),
    });

    if (!product) throw new Error("Product not found");

    const unitPrice = Number(product.costPrice) || 0;
    const subtotal = data.qty * unitPrice;
    const vatRate = 5; // Fixed 5% as per purchasing logic
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    let poId = "";
    await db.transaction(async (tx) => {
      const [po] = await tx
        .insert(purchaseOrders)
        .values({
          tenantId,
          branchId: data.branchId,
          vendorId: data.vendorId,
          status: "Draft",
          subtotal: subtotal.toString(),
          vatRate: vatRate.toString(),
          vatAmount: vatAmount.toString(),
          total: total.toString(),
        })
        .returning({ id: purchaseOrders.id });

      poId = po.id;

      await tx.insert(purchaseOrderItems).values({
        purchaseOrderId: po.id,
        productId: data.productId,
        qty: data.qty,
        unitPrice: unitPrice.toString(),
      });
    });

    return { success: true, poId };
  });

export const applyClearanceFn = createServerFn({ method: "POST" })
  .validator((z) => z.object({ productId: z.string(), discountPct: z.number() }))
  .handler(async ({ data }) => {
    const { tenantId } = await getInventoryManagerContext();
    await db.insert(schema.promotions).values({
      tenantId,
      name: "Clearance Sale - Near Expiry",
      discountType: "percentage",
      discountValue: data.discountPct.toString(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: "Active",
    });
    return { success: true };
  });

export const createStockAdjustmentFn = createServerFn({ method: 'POST' })
  .validator((d: { productId: string; branchId: string; batchId?: string; quantityChange: number; reason: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchScope, role } = await getInventoryManagerContext();
    const session = await getSessionServerFn();
    const userId = session.session?.id;
    if (!userId) throw new Error('Unauthorized');

    if (!data.quantityChange) throw new Error('Quantity change cannot be zero');
    if (!data.reason) throw new Error('Reason is required');
    if (branchScope && !branchScope.includes(data.branchId)) {
      throw new Error('Forbidden: Unauthorized branch scope');
    }

    await db.transaction(async (tx) => {
      // Get current stock
      let previousQty = 0;
      if (data.batchId) {
        const [batch] = await tx.select().from(batches).where(and(eq(batches.id, data.batchId), eq(batches.tenantId, tenantId), eq(batches.branchId, data.branchId)));
        if (!batch) throw new Error('Batch not found');
        previousQty = batch.stock;
        const newQty = previousQty + data.quantityChange;
        if (newQty < 0) throw new Error('Cannot adjust batch stock below 0');

        await tx.update(batches).set({ stock: newQty }).where(eq(batches.id, data.batchId));
        
        // Also update stock level
        await tx.update(stockLevels).set({ stock: sql`${stockLevels.stock} + ${data.quantityChange}` }).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)));
      } else {
        const [level] = await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)));
        if (!level) throw new Error('Stock level not found');
        previousQty = level.stock;
        const newQty = previousQty + data.quantityChange;
        if (newQty < 0) throw new Error('Cannot adjust stock below 0');

        await tx.update(stockLevels).set({ stock: newQty }).where(eq(stockLevels.id, level.id));
      }

      // Record adjustment
      const [adj] = await tx.insert(schema.stockAdjustments).values({
        tenantId,
        branchId: data.branchId,
        productId: data.productId,
        batchId: data.batchId || null,
        previousQuantity: previousQty,
        quantityChange: data.quantityChange,
        newQuantity: previousQty + data.quantityChange,
        reason: data.reason,
        adjustedBy: userId
      }).returning({ id: schema.stockAdjustments.id });

      // Record in ledger
      await tx.insert(schema.inventoryLedger).values({
        tenantId,
        branchId: data.branchId,
        productId: data.productId,
        batchId: data.batchId || null,
        transactionType: 'Adjustment',
        previousQuantity: previousQty,
        changedQuantity: data.quantityChange,
        newQuantity: previousQty + data.quantityChange,
        referenceId: adj?.id || null,
        createdBy: userId
      });
    });

    return { success: true };
  });

export const getInventoryLedgerFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { tenantId, branchScope } = await getInventoryManagerContext();
    
    let ledgerWhere = eq(schema.inventoryLedger.tenantId, tenantId);
    if (branchScope) {
      ledgerWhere = and(eq(schema.inventoryLedger.tenantId, tenantId), inArray(schema.inventoryLedger.branchId, branchScope))!;
    }

    try {
      const records = await db.select({
        id: schema.inventoryLedger.id,
        transactionType: schema.inventoryLedger.transactionType,
        previousQuantity: schema.inventoryLedger.previousQuantity,
        changedQuantity: schema.inventoryLedger.changedQuantity,
        newQuantity: schema.inventoryLedger.newQuantity,
        createdAt: schema.inventoryLedger.createdAt,
        productName: products.name,
        branchName: branches.name,
        batchNumber: batches.batchNumber
      })
      .from(schema.inventoryLedger)
      .innerJoin(products, eq(schema.inventoryLedger.productId, products.id))
      .innerJoin(branches, eq(schema.inventoryLedger.branchId, branches.id))
      .leftJoin(batches, eq(schema.inventoryLedger.batchId, batches.id))
      .where(ledgerWhere)
      .orderBy(desc(schema.inventoryLedger.createdAt))
      .limit(100);
      return { success: true, ledger: records };
    } catch (e: any) {
      console.error("Ledger fetch error:", e);
      throw new Error("Failed to fetch inventory ledger. The database might be unavailable or pending migration.");
    }
  });

