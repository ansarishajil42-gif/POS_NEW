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
import * as XLSX from "xlsx";

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

export const getInventoryDataServerFn = createServerFn({ method: "GET" })
  .validator((d?: { page?: number; pageSize?: number; search?: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
  const { tenantId, branchScope, role } = await getInventoryManagerContext();

  const page = Math.max(1, Number(data?.page) || 1);
  const pageSize = Math.max(1, Math.min(200, Number(data?.pageSize) || 50));
  const offset = (page - 1) * pageSize;

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

  // 2. Get stock levels across all branches with product info (Paginated)
  let allStockLevels: any[] = [];
  let totalStockCount = 0;
  let totalLowStockCount = 0;

  try {
    let stockWhereConditions: any[] = [eq(products.tenantId, tenantId)];
    if (branchScope) {
      stockWhereConditions.push(inArray(stockLevels.branchId, branchScope));
    }
    if (data?.branchId && data.branchId.trim()) {
      stockWhereConditions.push(eq(stockLevels.branchId, data.branchId.trim()));
    }
    if (data?.search && data.search.trim()) {
      const q = `%${data.search.trim()}%`;
      stockWhereConditions.push(
        or(ilike(products.name, q), ilike(products.barcode, q), ilike(products.sku, q)),
      );
    }

    const stockWhere = and(...stockWhereConditions)!;

    const [stockRows, [statsRes]] = await Promise.all([
      db
        .select({
          id: stockLevels.id,
          stock: stockLevels.stock,
          reorderLevel: stockLevels.reorderLevel,
          branchId: stockLevels.branchId,
          branchName: branches.name,
          productId: products.id,
          productName: products.name,
          sku: products.sku,
          barcode: products.barcode,
          category: products.category,
          unit: products.unit,
        })
        .from(stockLevels)
        .innerJoin(products, eq(stockLevels.productId, products.id))
        .innerJoin(branches, eq(stockLevels.branchId, branches.id))
        .where(stockWhere)
        .limit(pageSize)
        .offset(offset),
      db
        .select({
          totalItems: sql<number>`count(*)::int`,
          lowStockCount: sql<number>`count(*) filter (where ${stockLevels.stock} <= ${stockLevels.reorderLevel})::int`,
        })
        .from(stockLevels)
        .innerJoin(products, eq(stockLevels.productId, products.id))
        .where(stockWhere),
    ]);

    allStockLevels = stockRows;
    totalStockCount = Number(statsRes?.totalItems || 0);
    totalLowStockCount = Number(statsRes?.lowStockCount || 0);
  } catch (e) {
    console.warn("Table stockLevels query error:", e);
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
        sku: products.sku,
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
      .orderBy(batches.expiryDate)
      .limit(100);
  } catch (e) {
    console.warn("Table batches might not exist yet:", e);
  }

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
      .select({
        id: stockTransfers.id,
        tenantId: stockTransfers.tenantId,
        productId: stockTransfers.productId,
        sourceBranchId: stockTransfers.sourceBranchId,
        destinationBranchId: stockTransfers.destinationBranchId,
        quantity: stockTransfers.quantity,
        status: stockTransfers.status,
        createdAt: stockTransfers.createdAt,
        productName: products.name,
        sku: products.sku,
      })
      .from(stockTransfers)
      .leftJoin(products, eq(stockTransfers.productId, products.id))
      .where(transfersWhere)
      .orderBy(desc(stockTransfers.createdAt))
      .limit(50);
  } catch (e) {
    console.warn("Table stock_transfers might not exist yet:", e);
  }

  const allTransfers = rawTransfers.map((t) => {
    const source = allTenantBranches.find((b) => b.id === t.sourceBranchId);
    const target = allTenantBranches.find((b) => b.id === t.destinationBranchId);
    return {
      ...t,
      productName: t.productName || "Unknown",
      sku: t.sku || "",
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
    page,
    pageSize,
    totalStockCount,
    stats: {
      totalSkus: totalStockCount,
      lowStockCount: totalLowStockCount,
      expiredCount: expiredBatches.length,
      nearExpiryCount: nearExpiryBatches.length,
    },
    alerts: {
      lowStock: allStockLevels.filter((s) => s.stock <= s.reorderLevel),
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

export const editStockTransferServerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string; quantity: number }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchScope } = await getInventoryManagerContext();

    const [transfer] = await db
      .select()
      .from(stockTransfers)
      .where(and(eq(stockTransfers.id, data.id), eq(stockTransfers.tenantId, tenantId)));

    if (!transfer) throw new Error("Stock transfer not found");

    if (branchScope) {
      const hasSourceAccess = branchScope.includes(transfer.sourceBranchId);
      const hasTargetAccess = branchScope.includes(transfer.destinationBranchId);
      if (!hasSourceAccess && !hasTargetAccess) {
        throw new Error("Forbidden: Unauthorized branch scope");
      }
    }

    if (transfer.status === "Completed") {
      throw new Error("Cannot edit a completed stock transfer");
    }

    await db
      .update(stockTransfers)
      .set({ quantity: data.quantity })
      .where(eq(stockTransfers.id, data.id));

    return { success: true };
  });

export const deleteStockTransferServerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchScope } = await getInventoryManagerContext();
    const session = await getSessionServerFn();
    const userId = session.session?.id;
    if (!userId) throw new Error("Unauthorized");

    const [transfer] = await db
      .select()
      .from(stockTransfers)
      .where(and(eq(stockTransfers.id, data.id), eq(stockTransfers.tenantId, tenantId)));

    if (!transfer) throw new Error("Stock transfer not found");

    if (branchScope) {
      const hasSourceAccess = branchScope.includes(transfer.sourceBranchId);
      const hasTargetAccess = branchScope.includes(transfer.destinationBranchId);
      if (!hasSourceAccess && !hasTargetAccess) {
        throw new Error("Forbidden: Unauthorized branch scope");
      }
    }

    await db.transaction(async (tx) => {
      if (transfer.status === "Completed") {
        // Rollback stock levels
        const [destStock] = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, transfer.productId), eq(stockLevels.branchId, transfer.destinationBranchId)))
          .limit(1);

        if (!destStock || destStock.stock < transfer.quantity) {
          throw new Error("Insufficient stock at destination branch to rollback transfer");
        }

        // Decrement destination
        await tx
          .update(stockLevels)
          .set({ stock: sql`${stockLevels.stock} - ${transfer.quantity}` })
          .where(eq(stockLevels.id, destStock.id));

        // Increment source
        const [sourceStock] = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, transfer.productId), eq(stockLevels.branchId, transfer.sourceBranchId)))
          .limit(1);

        if (sourceStock) {
          await tx
            .update(stockLevels)
            .set({ stock: sql`${stockLevels.stock} + ${transfer.quantity}` })
            .where(eq(stockLevels.id, sourceStock.id));
        } else {
          await tx.insert(stockLevels).values({
            productId: transfer.productId,
            branchId: transfer.sourceBranchId,
            stock: transfer.quantity,
            reorderLevel: 10,
          });
        }

        // Ledger reversal entries
        await tx.insert(schema.inventoryLedger).values({
          tenantId,
          branchId: transfer.destinationBranchId,
          productId: transfer.productId,
          transactionType: "Transfer Rollback Out",
          previousQuantity: destStock.stock,
          changedQuantity: -Number(transfer.quantity),
          newQuantity: destStock.stock - Number(transfer.quantity),
          createdBy: userId,
        });

        const prevSourceQty = sourceStock ? sourceStock.stock : 0;
        await tx.insert(schema.inventoryLedger).values({
          tenantId,
          branchId: transfer.sourceBranchId,
          productId: transfer.productId,
          transactionType: "Transfer Rollback In",
          previousQuantity: prevSourceQty,
          changedQuantity: Number(transfer.quantity),
          newQuantity: prevSourceQty + Number(transfer.quantity),
          createdBy: userId,
        });
      }

      // Delete the transfer record
      await tx.delete(stockTransfers).where(eq(stockTransfers.id, data.id));
    });

    return { success: true };
  });

export const exportOutOfStockExcelServerFn = createServerFn({ method: "POST" })
  .validator((d?: { branchId?: string; outOfStockOnly?: boolean }) => d)
  .handler(async ({ data }) => {
    try {
      const { tenantId, branchScope } = await getInventoryManagerContext();
      let branchId = data?.branchId;
      if (branchScope && branchScope.length > 0) {
        branchId = branchScope[0];
      }
      const outOfStockOnly = data?.outOfStockOnly ?? true;

      let rows: any[] = [];

      if (branchId && branchId !== "all") {
        if (outOfStockOnly) {
          const res: any = await db.execute(sql`
            SELECT 
              p.sku, 
              p.name as "Product", 
              p.barcode, 
              p.unit, 
              p.category, 
              p.cost_price as "Cost", 
              p.sale_price as "Retail", 
              COALESCE(sl.stock, 0) as "Stock"
            FROM products p
            LEFT JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
            WHERE p.tenant_id = ${tenantId}::uuid
              AND (sl.stock IS NULL OR sl.stock <= 0)
            ORDER BY p.name ASC;
          `);
          rows = Array.isArray(res) ? res : res?.rows || [];
        } else {
          const res: any = await db.execute(sql`
            SELECT 
              p.sku, 
              p.name as "Product", 
              p.barcode, 
              p.unit, 
              p.category, 
              p.cost_price as "Cost", 
              p.sale_price as "Retail", 
              COALESCE(sl.stock, 0) as "Stock"
            FROM products p
            LEFT JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
            WHERE p.tenant_id = ${tenantId}::uuid
            ORDER BY p.name ASC;
          `);
          rows = Array.isArray(res) ? res : res?.rows || [];
        }
      } else {
        if (outOfStockOnly) {
          const res: any = await db.execute(sql`
            SELECT 
              p.sku, 
              p.name as "Product", 
              p.barcode, 
              p.unit, 
              p.category, 
              p.cost_price as "Cost", 
              p.sale_price as "Retail", 
              COALESCE(SUM(sl.stock), 0) as "Stock"
            FROM products p
            LEFT JOIN stock_levels sl ON p.id = sl.product_id
            WHERE p.tenant_id = ${tenantId}::uuid
            GROUP BY p.id, p.sku, p.name, p.barcode, p.unit, p.category, p.cost_price, p.sale_price
            HAVING COALESCE(SUM(sl.stock), 0) <= 0
            ORDER BY p.name ASC;
          `);
          rows = Array.isArray(res) ? res : res?.rows || [];
        } else {
          const res: any = await db.execute(sql`
            SELECT 
              p.sku, 
              p.name as "Product", 
              p.barcode, 
              p.unit, 
              p.category, 
              p.cost_price as "Cost", 
              p.sale_price as "Retail", 
              COALESCE(SUM(sl.stock), 0) as "Stock"
            FROM products p
            LEFT JOIN stock_levels sl ON p.id = sl.product_id
            WHERE p.tenant_id = ${tenantId}::uuid
            GROUP BY p.id, p.sku, p.name, p.barcode, p.unit, p.category, p.cost_price, p.sale_price
            ORDER BY p.name ASC;
          `);
          rows = Array.isArray(res) ? res : res?.rows || [];
        }
      }

      const exportData = rows.map((r: any) => ({
        SKU: r.sku || "",
        Product: r.Product || r.name || "",
        Barcode: r.barcode || "",
        Unit: r.unit || "pcs",
        Category: r.category || "General",
        Cost: Number(r.Cost ?? r.cost_price) || 0,
        Retail: Number(r.Retail ?? r.sale_price) || 0,
        Stock: 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Update");

      const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      const branchLabel = branchId && branchId !== "all" ? "branch" : "all_branches";
      const filename = `stock_update_${branchLabel}_${new Date().toISOString().split("T")[0]}.xlsx`;

      return {
        success: true,
        base64,
        filename,
        count: exportData.length,
      };
    } catch (err: any) {
      console.error("exportOutOfStockExcelServerFn error:", err);
      return { success: false, error: err.message || "Failed to export Excel" };
    }
  });

export const bulkUpdateStockFromExcelServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      branchId: string;
      rows: Array<{
        sku?: string;
        barcode?: string;
        stock: number;
      }>;
    }) => d,
  )
  .handler(async ({ data }) => {
    try {
      const { tenantId, branchScope } = await getInventoryManagerContext();
      let { branchId, rows } = data;

      if (branchScope && branchScope.length > 0) {
        branchId = branchScope[0];
      }

      if (!branchId || branchId === "all") {
        throw new Error("Please select a specific branch for bulk stock update.");
      }

      const [branch] = await db
        .select({ id: branches.id, name: branches.name })
        .from(branches)
        .where(and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)));
      if (!branch) throw new Error("Unauthorized or invalid branch selected.");

      if (!rows || rows.length === 0) {
        return {
          success: true,
          totalProcessed: 0,
          totalUpdated: 0,
          totalSkipped: 0,
          skippedDetails: [],
        };
      }

      const tenantProducts = await db
        .select({
          id: products.id,
          sku: products.sku,
          barcode: products.barcode,
        })
        .from(products)
        .where(eq(products.tenantId, tenantId));

      const skuMap = new Map<string, string>();
      const barcodeMap = new Map<string, string>();
      for (const p of tenantProducts) {
        if (p.sku) skuMap.set(String(p.sku).trim().toLowerCase(), p.id);
        if (p.barcode) barcodeMap.set(String(p.barcode).trim().toLowerCase(), p.id);
      }

      let totalUpdated = 0;
      const skippedDetails: Array<{ sku: string; reason: string }> = [];

      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        await db.transaction(async (tx) => {
          for (const row of batch) {
            const rowSku = row.sku ? String(row.sku).trim() : "";
            const rowBarcode = row.barcode ? String(row.barcode).trim() : "";
            const newStock = Number(row.stock);

            if (isNaN(newStock)) {
              skippedDetails.push({
                sku: rowSku || rowBarcode || `Row ${i + 1}`,
                reason: "Invalid stock value (not a number)",
              });
              continue;
            }

            let productId: string | undefined = undefined;
            if (rowSku) {
              productId = skuMap.get(rowSku.toLowerCase());
            }
            if (!productId && rowBarcode) {
              productId = barcodeMap.get(rowBarcode.toLowerCase());
            }

            if (!productId) {
              skippedDetails.push({
                sku: rowSku || rowBarcode || `Row ${i + 1}`,
                reason: "Product not found in tenant catalog",
              });
              continue;
            }

            const existingRows = await tx
              .select({ id: stockLevels.id })
              .from(stockLevels)
              .where(
                and(
                  eq(stockLevels.productId, productId),
                  eq(stockLevels.branchId, branchId),
                ),
              )
              .limit(1);
            const existing = existingRows[0];

            if (existing) {
              await tx
                .update(stockLevels)
                .set({ stock: newStock })
                .where(eq(stockLevels.id, existing.id));
            } else {
              await tx.insert(stockLevels).values({
                productId: productId,
                branchId: branchId,
                stock: newStock,
                reorderLevel: 10,
              });
            }

            totalUpdated++;
          }
        });
      }

      return {
        success: true,
        totalProcessed: rows.length,
        totalUpdated,
        totalSkipped: skippedDetails.length,
        skippedDetails,
      };
    } catch (err: any) {
      console.error("bulkUpdateStockFromExcelServerFn error:", err);
      return {
        success: false,
        error: err.message || "Failed to process bulk stock update",
      };
    }
  });

