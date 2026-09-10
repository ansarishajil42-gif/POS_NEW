import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import {
  branches,
  products,
  stockLevels,
  batches,
  purchaseOrders,
  staffUsers,
  orders,
  orderItems,
  orderPayments,
  vendors,
  tenantSettings,
  vendorInvoices,
  branchReportSubmissions,
} from "@/server/db/schema";
import { eq, and, sql, gte, lte, lt, desc, aliasedTable } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import { logAuditAction } from "@/lib/audit-logger";

interface TenantContextResult {
  tenantId: string | null;
  isAll: boolean;
}

async function resolveReportTenantContext(overrideTenantId?: string): Promise<TenantContextResult> {
  const res = await getSessionServerFn();
  if (!res.success || !res.session) {
    throw new Error("Unauthorized");
  }

  // Super Admin can select a specific tenantId or "all"
  if (res.session.role === "Super Admin") {
    if (!overrideTenantId || overrideTenantId === "all") {
      return { tenantId: null, isAll: true };
    }
    return { tenantId: overrideTenantId, isAll: false };
  }

  // Head Office Admin uses their session tenantId
  if (res.session.role === "Head Office Admin") {
    return { tenantId: res.session.tenantId, isAll: false };
  }

  throw new Error("Unauthorized");
}

// Helper to construct date boundaries
const parseDateRange = (startDate: string, endDate: string) => {
  const sDate = new Date(startDate);
  const eDate = new Date(endDate);
  
  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
    throw new Error("Invalid date format");
  }
  
  if (sDate >= eDate) {
    throw new Error("Start date must be strictly before end date");
  }
  
  return { sDate, eDate };
};

const buildOrdersWhere = (tenantCtx: TenantContextResult, sDate: Date, eDate: Date, branchId?: string) => {
  const conditions = [
    eq(orders.status, "completed"),
    gte(orders.createdAt, sDate),
    lt(orders.createdAt, eDate)
  ];
  if (!tenantCtx.isAll && tenantCtx.tenantId) {
    conditions.push(eq(orders.tenantId, tenantCtx.tenantId));
  }
  if (branchId && branchId !== "all") {
    conditions.push(eq(orders.branchId, branchId));
  }
  return and(...conditions);
};

export const getReportBranchesServerFn = createServerFn({ method: "POST" })
  .validator((d: { tenantId?: string } | undefined) => d || {})
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    let rows;
    if (tenantCtx.isAll) {
      rows = await db.select().from(branches).where(eq(branches.status, "Active")).orderBy(desc(branches.createdAt));
    } else {
      rows = await db.select().from(branches).where(and(eq(branches.tenantId, tenantCtx.tenantId!), eq(branches.status, "Active"))).orderBy(desc(branches.createdAt));
    }
    return { success: true, branches: rows };
  });

export const getSalesSummaryReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, data.branchId);

    const result = await db.select({
      orderCount: sql<number>`count(${orders.id})`,
      netSales: sql<number>`sum(${orders.subtotal})`,
      vatAmount: sql<number>`sum(${orders.vat})`,
      totalSales: sql<number>`sum(${orders.total})`,
    }).from(orders).where(whereClause);

    const stats = result[0];
    const orderCount = Number(stats?.orderCount || 0);
    const netSales = Number(stats?.netSales || 0);
    const vatAmount = Number(stats?.vatAmount || 0);
    const totalSales = Number(stats?.totalSales || 0);
    const averageOrderValue = orderCount > 0 ? (totalSales / orderCount).toFixed(2) : "0.00";

    await logAuditAction({ action: "Generated Sales Summary Report", entityType: "Report", entityId: "SalesSummary", summary: `Generated Sales Summary Report from ${data.startDate} to ${data.endDate}` });

    return {
      success: true,
      data: {
        scope: tenantCtx.isAll ? "Platform-Wide (All Tenants)" : "Single Tenant",
        orderCount,
        netSales: netSales.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalSales: totalSales.toFixed(2),
        averageOrderValue
      }
    };
  });

export const getBranchSalesReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);

    const results = await db.select({
      branchId: orders.branchId,
      branchName: branches.name,
      orderCount: sql<number>`count(${orders.id})`,
      netSales: sql<number>`sum(${orders.subtotal})`,
      vatAmount: sql<number>`sum(${orders.vat})`,
      totalSales: sql<number>`sum(${orders.total})`,
    })
    .from(orders)
    .innerJoin(branches, eq(orders.branchId, branches.id))
    .where(buildOrdersWhere(tenantCtx, sDate, eDate))
    .groupBy(orders.branchId, branches.name)
    .orderBy(desc(sql`sum(${orders.total})`));

    await logAuditAction({ action: "Generated Branch Sales Report", entityType: "Report", entityId: "BranchSales", summary: `Generated Branch Sales Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getProductSalesReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, data.branchId);

    const results = await db.select({
      productId: orderItems.productId,
      productName: products.name,
      barcode: products.barcode,
      quantitySold: sql<number>`sum(${orderItems.qty})`,
      grossSales: sql<number>`sum(${orderItems.qty} * ${orderItems.unitPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(whereClause)
    .groupBy(orderItems.productId, products.name, products.barcode)
    .orderBy(desc(sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`));

    await logAuditAction({ action: "Generated Product Sales Report", entityType: "Report", entityId: "ProductSales", summary: `Generated Product Sales Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getCategorySalesReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, data.branchId);

    const results = await db.select({
      category: products.category,
      quantitySold: sql<number>`sum(${orderItems.qty})`,
      orderLineCount: sql<number>`count(${orderItems.id})`,
      grossSales: sql<number>`sum(${orderItems.qty} * ${orderItems.unitPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(whereClause)
    .groupBy(products.category)
    .orderBy(desc(sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`));

    await logAuditAction({ action: "Generated Category Sales Report", entityType: "Report", entityId: "CategorySales", summary: `Generated Category Sales Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getCashierSalesReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, data.branchId);

    const results = await db.select({
      cashierId: orders.cashierId,
      cashierName: staffUsers.name,
      orderCount: sql<number>`count(${orders.id})`,
      netSales: sql<number>`sum(${orders.subtotal})`,
      vatAmount: sql<number>`sum(${orders.vat})`,
      totalSales: sql<number>`sum(${orders.total})`,
    })
    .from(orders)
    .leftJoin(staffUsers, eq(orders.cashierId, staffUsers.id))
    .where(whereClause)
    .groupBy(orders.cashierId, staffUsers.name)
    .orderBy(desc(sql`sum(${orders.total})`));

    await logAuditAction({ action: "Generated Cashier Sales Report", entityType: "Report", entityId: "CashierSales", summary: `Generated Cashier Sales Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getInventoryValuationReportFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    
    const conditions = [];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(stockLevels.branchId, data.branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.select({
      branchName: branches.name,
      productName: products.name,
      quantity: stockLevels.stock,
      unitCost: products.costPrice,
      totalCostValue: sql<number>`(${stockLevels.stock} * ${products.costPrice})`,
    })
    .from(stockLevels)
    .innerJoin(products, eq(stockLevels.productId, products.id))
    .innerJoin(branches, eq(stockLevels.branchId, branches.id))
    .where(whereClause)
    .orderBy(branches.name, products.name);

    await logAuditAction({ action: "Generated Inventory Valuation Report", entityType: "Report", entityId: "InventoryValuation", summary: `Generated Inventory Valuation Report` });
    return { success: true, data: results };
  });

export const getLowStockReportFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    
    const conditions = [
      sql`${stockLevels.stock} < ${stockLevels.reorderLevel}`
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(stockLevels.branchId, data.branchId));
    }

    const results = await db.select({
      branchName: branches.name,
      productName: products.name,
      currentQuantity: stockLevels.stock,
      threshold: stockLevels.reorderLevel,
      shortage: sql<number>`(${stockLevels.reorderLevel} - ${stockLevels.stock})`,
    })
    .from(stockLevels)
    .innerJoin(products, eq(stockLevels.productId, products.id))
    .innerJoin(branches, eq(stockLevels.branchId, branches.id))
    .where(and(...conditions))
    .orderBy(sql`(${stockLevels.reorderLevel} - ${stockLevels.stock}) DESC`);

    await logAuditAction({ action: "Generated Low Stock Report", entityType: "Report", entityId: "LowStock", summary: `Generated Low Stock Report` });
    return { success: true, data: results };
  });

export const getExpiryReportFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; daysThreshold: number; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + data.daysThreshold);

    const conditions = [
      lt(batches.expiryDate, thresholdDate),
      gte(batches.stock, 1)
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(batches.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(batches.branchId, data.branchId));
    }

    const results = await db.select({
      branchName: branches.name,
      productName: products.name,
      batchNumber: batches.batchNumber,
      quantity: batches.stock,
      expiryDate: batches.expiryDate,
      daysRemaining: sql<number>`EXTRACT(DAY FROM (${batches.expiryDate} - NOW()))`,
    })
    .from(batches)
    .innerJoin(products, eq(batches.productId, products.id))
    .leftJoin(branches, eq(batches.branchId, branches.id))
    .where(and(...conditions))
    .orderBy(batches.expiryDate);

    await logAuditAction({ action: "Generated Expiry Report", entityType: "Report", entityId: "ExpiryReport", summary: `Generated Expiry Report for next ${data.daysThreshold} days` });
    return { success: true, data: results };
  });

export const getPurchaseReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    
    const conditions = [
      gte(purchaseOrders.createdAt, sDate),
      lt(purchaseOrders.createdAt, eDate)
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(purchaseOrders.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(purchaseOrders.branchId, data.branchId));
    }

    const results = await db.select({
      poId: purchaseOrders.id,
      vendorName: vendors.name,
      branchName: branches.name,
      poDate: purchaseOrders.createdAt,
      status: purchaseOrders.status,
      totalAmount: purchaseOrders.total,
    })
    .from(purchaseOrders)
    .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .leftJoin(branches, eq(purchaseOrders.branchId, branches.id))
    .where(and(...conditions))
    .orderBy(desc(purchaseOrders.createdAt));

    await logAuditAction({ action: "Generated Purchase Report", entityType: "Report", entityId: "PurchaseReport", summary: `Generated Purchase Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getVendorReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    
    const conditions = [
      gte(purchaseOrders.createdAt, sDate),
      lt(purchaseOrders.createdAt, eDate)
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(purchaseOrders.tenantId, tenantCtx.tenantId));
    }

    const results = await db.select({
      vendorName: vendors.name,
      purchaseCount: sql<number>`count(${purchaseOrders.id})`,
      totalPurchaseValue: sql<number>`sum(${purchaseOrders.total})`,
    })
    .from(purchaseOrders)
    .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .where(and(...conditions))
    .groupBy(vendors.name)
    .orderBy(desc(sql`sum(${purchaseOrders.total})`));

    await logAuditAction({ action: "Generated Vendor Report", entityType: "Report", entityId: "VendorReport", summary: `Generated Vendor Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getVatSummaryReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate);

    let trn = "Platform Aggregate";
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      const settings = await db.select({ trn: tenantSettings.taxRegistrationNumber }).from(tenantSettings).where(eq(tenantSettings.tenantId, tenantCtx.tenantId)).limit(1);
      trn = settings[0]?.trn || "Not Configured";
    }

    const result = await db.select({
      taxableOrdersCount: sql<number>`count(${orders.id})`,
      salesExVat: sql<number>`sum(${orders.subtotal})`,
      vatAmount: sql<number>`sum(${orders.vat})`,
      salesIncVat: sql<number>`sum(${orders.total})`,
    }).from(orders).where(whereClause);

    const stats = result[0];
    const taxableOrdersCount = Number(stats?.taxableOrdersCount || 0);
    const salesExVat = Number(stats?.salesExVat || 0).toFixed(2);
    const vatAmount = Number(stats?.vatAmount || 0).toFixed(2);
    const salesIncVat = Number(stats?.salesIncVat || 0).toFixed(2);

    await logAuditAction({ action: "Generated VAT Report", entityType: "Report", entityId: "VatSummary", summary: `Generated VAT Summary Report from ${data.startDate} to ${data.endDate}` });
    return {
      success: true,
      data: {
        trn,
        scope: tenantCtx.isAll ? "Platform-Wide (All Tenants)" : "Single Tenant",
        periodStart: sDate.toISOString(),
        periodEnd: eDate.toISOString(),
        taxableOrdersCount,
        salesExVat,
        vatAmount,
        salesIncVat,
        standardRatedSales: salesExVat,
        notes: "Historical stored VAT values used. Mixed tax categories are not fully separated in the schema. This represents aggregate VAT as captured at checkout.",
      }
    };
  });

export const getExecutiveFinancialSummaryFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);

    // Normalize date boundaries to cover full days in UTC
    let sDate = new Date(data.startDate);
    let eDate = new Date(data.endDate);

    if (typeof data.startDate === "string" && data.startDate.length === 10) {
      sDate = new Date(`${data.startDate}T00:00:00.000Z`);
    }
    if (typeof data.endDate === "string" && data.endDate.length === 10) {
      eDate = new Date(`${data.endDate}T23:59:59.999Z`);
    }

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // 1. Orders filter for Revenue & COGS
    const orderConditions = [
      eq(orders.status, "completed"),
      gte(orders.createdAt, sDate),
      lte(orders.createdAt, eDate),
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      orderConditions.push(eq(orders.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      orderConditions.push(eq(orders.branchId, data.branchId));
    }
    const ordersWhere = and(...orderConditions);

    // Query 1: Total Revenue & completed orders count
    const revQuery = db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .where(ordersWhere);

    // Query 2: Cost of Goods Sold (COGS) - SQL aggregate directly on order_items * products
    const cogsQuery = db
      .select({
        cogs: sql<string>`coalesce(sum(${orderItems.qty} * ${products.costPrice}), 0)::text`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(ordersWhere);

    // Query 3: Outstanding Vendor Payables (Unpaid vendor invoices)
    const payablesConditions = [
      sql`${vendorInvoices.status} != 'Paid'`,
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      payablesConditions.push(eq(vendorInvoices.tenantId, tenantCtx.tenantId));
    }

    let payablesQuery;
    if (data.branchId && data.branchId !== "all") {
      payablesQuery = db
        .select({
          outstandingPayables: sql<string>`coalesce(sum(${vendorInvoices.total} - ${vendorInvoices.paidAmount}), 0)::text`,
          unpaidInvoiceCount: sql<number>`count(${vendorInvoices.id})::int`,
        })
        .from(vendorInvoices)
        .innerJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
        .where(and(...payablesConditions, eq(purchaseOrders.branchId, data.branchId)));
    } else {
      payablesQuery = db
        .select({
          outstandingPayables: sql<string>`coalesce(sum(${vendorInvoices.total} - ${vendorInvoices.paidAmount}), 0)::text`,
          unpaidInvoiceCount: sql<number>`count(${vendorInvoices.id})::int`,
        })
        .from(vendorInvoices)
        .where(and(...payablesConditions));
    }

    // Query 4: Current Inventory Asset Value (at cost, real-time snapshot)
    const invConditions = [
      sql`${stockLevels.stock} > 0`,
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      invConditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      invConditions.push(eq(stockLevels.branchId, data.branchId));
    }

    const invQuery = db
      .select({
        inventoryAssetValue: sql<string>`coalesce(sum(${stockLevels.stock} * ${products.costPrice}), 0)::text`,
        totalStockUnits: sql<number>`coalesce(sum(${stockLevels.stock}), 0)::int`,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(and(...invConditions));

    // Execute all 4 aggregate queries concurrently
    const [revRes, cogsRes, payablesRes, invRes] = await Promise.all([
      revQuery,
      cogsQuery,
      payablesQuery,
      invQuery,
    ]);

    const totalRevenue = parseFloat(revRes[0]?.totalRevenue || "0");
    const orderCount = revRes[0]?.orderCount || 0;
    const cogs = parseFloat(cogsRes[0]?.cogs || "0");
    const grossProfit = totalRevenue - cogs;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const outstandingPayables = parseFloat(payablesRes[0]?.outstandingPayables || "0");
    const unpaidInvoiceCount = payablesRes[0]?.unpaidInvoiceCount || 0;
    const inventoryAssetValue = parseFloat(invRes[0]?.inventoryAssetValue || "0");
    const totalStockUnits = invRes[0]?.totalStockUnits || 0;

    await logAuditAction({
      action: "Generated Executive Financial Summary",
      entityType: "Report",
      entityId: "ExecutiveFinancialSummary",
      summary: `Generated Executive Financial Summary from ${data.startDate} to ${data.endDate}`,
    });

    return {
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        outstandingPayables: Number(outstandingPayables.toFixed(2)),
        inventoryAssetValue: Number(inventoryAssetValue.toFixed(2)),
        orderCount,
        unpaidInvoiceCount,
        totalStockUnits,
        currency: "AED",
        periodStart: sDate.toISOString(),
        periodEnd: eDate.toISOString(),
      },
    };
  });

export const getSalesMarginAnalysisFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);

    let sDate = new Date(data.startDate);
    let eDate = new Date(data.endDate);

    if (typeof data.startDate === "string" && data.startDate.length === 10) {
      sDate = new Date(`${data.startDate}T00:00:00.000Z`);
    }
    if (typeof data.endDate === "string" && data.endDate.length === 10) {
      eDate = new Date(`${data.endDate}T23:59:59.999Z`);
    }

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error("Invalid date format");
    }

    const orderConditions = [
      eq(orders.status, "completed"),
      gte(orders.createdAt, sDate),
      lte(orders.createdAt, eDate),
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      orderConditions.push(eq(orders.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      orderConditions.push(eq(orders.branchId, data.branchId));
    }
    const ordersWhere = and(...orderConditions);

    // Run the 3 SQL group-by queries concurrently
    const [tenders, channels, topProducts] = await Promise.all([
      // 1. Revenue Breakdown by Tender Method
      db
        .select({
          method: orderPayments.method,
          amount: sql<string>`coalesce(sum(${orderPayments.amount}), 0)::text`,
          count: sql<number>`count(${orderPayments.id})::int`,
        })
        .from(orderPayments)
        .innerJoin(orders, eq(orderPayments.orderId, orders.id))
        .where(ordersWhere)
        .groupBy(orderPayments.method)
        .orderBy(desc(sql`sum(${orderPayments.amount})`)),

      // 2. Revenue Breakdown by Channel / Source
      db
        .select({
          channel: sql<string>`coalesce(${orders.source}, 'POS')::text`,
          amount: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
          count: sql<number>`count(${orders.id})::int`,
        })
        .from(orders)
        .where(ordersWhere)
        .groupBy(sql`coalesce(${orders.source}, 'POS')`)
        .orderBy(desc(sql`sum(${orders.total})`)),

      // 3. Top 10 Products by Gross Profit
      db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          category: products.category,
          unitsSold: sql<number>`coalesce(sum(${orderItems.qty}), 0)::int`,
          revenue: sql<string>`coalesce(sum(${orderItems.qty} * ${orderItems.unitPrice}), 0)::text`,
          cogs: sql<string>`coalesce(sum(${orderItems.qty} * ${products.costPrice}), 0)::text`,
          grossProfit: sql<string>`coalesce(sum((${orderItems.unitPrice} - ${products.costPrice}) * ${orderItems.qty}), 0)::text`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(ordersWhere)
        .groupBy(orderItems.productId, products.name, products.category)
        .orderBy(desc(sql`sum((${orderItems.unitPrice} - ${products.costPrice}) * ${orderItems.qty})`))
        .limit(10),
    ]);

    const totalTenderAmount = tenders.reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0);
    const totalChannelAmount = channels.reduce((acc, c) => acc + parseFloat(c.amount || "0"), 0);

    const formattedTenders = tenders.map((t) => {
      const amt = parseFloat(t.amount || "0");
      const pct = totalTenderAmount > 0 ? (amt / totalTenderAmount) * 100 : 0;
      return {
        method: t.method || "Other",
        amount: Number(amt.toFixed(2)),
        count: t.count,
        percentage: Number(pct.toFixed(1)),
      };
    });

    const formattedChannels = channels.map((c) => {
      const amt = parseFloat(c.amount || "0");
      const pct = totalChannelAmount > 0 ? (amt / totalChannelAmount) * 100 : 0;
      return {
        channel: c.channel || "POS",
        amount: Number(amt.toFixed(2)),
        count: c.count,
        percentage: Number(pct.toFixed(1)),
      };
    });

    const formattedTopProducts = topProducts.map((p) => {
      const rev = parseFloat(p.revenue || "0");
      const cogs = parseFloat(p.cogs || "0");
      const gp = parseFloat(p.grossProfit || "0");
      const marginPct = rev > 0 ? (gp / rev) * 100 : 0;
      return {
        productId: p.productId,
        productName: p.productName,
        category: p.category,
        unitsSold: p.unitsSold,
        revenue: Number(rev.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        grossProfit: Number(gp.toFixed(2)),
        marginPct: Number(marginPct.toFixed(1)),
      };
    });

    await logAuditAction({
      action: "Generated Sales and Margin Analysis",
      entityType: "Report",
      entityId: "SalesMarginAnalysis",
      summary: `Generated Sales & Margin Analysis from ${data.startDate} to ${data.endDate}`,
    });

    return {
      success: true,
      data: {
        tenders: formattedTenders,
        totalTenderAmount: Number(totalTenderAmount.toFixed(2)),
        channels: formattedChannels,
        totalChannelAmount: Number(totalChannelAmount.toFixed(2)),
        topProducts: formattedTopProducts,
      },
    };
  });

export const getAccountsPayableAgingFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; tenantId?: string } | undefined) => d || {})
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);

    // Conditions: Invoices not fully paid, with remaining balance
    const payablesConditions = [
      sql`${vendorInvoices.status} != 'Paid'`,
      sql`(${vendorInvoices.total} - ${vendorInvoices.paidAmount}) > 0`,
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      payablesConditions.push(eq(vendorInvoices.tenantId, tenantCtx.tenantId));
    }

    const bucketFields = {
      currentCount: sql<number>`count(case when ${vendorInvoices.dueDate}::date >= current_date then 1 end)::int`,
      currentAmount: sql<string>`coalesce(sum(case when ${vendorInvoices.dueDate}::date >= current_date then (${vendorInvoices.total} - ${vendorInvoices.paidAmount}) else 0 end), 0)::text`,

      overdue1To30Count: sql<number>`count(case when (current_date - ${vendorInvoices.dueDate}::date) between 1 and 30 then 1 end)::int`,
      overdue1To30Amount: sql<string>`coalesce(sum(case when (current_date - ${vendorInvoices.dueDate}::date) between 1 and 30 then (${vendorInvoices.total} - ${vendorInvoices.paidAmount}) else 0 end), 0)::text`,

      overdue31To60Count: sql<number>`count(case when (current_date - ${vendorInvoices.dueDate}::date) between 31 and 60 then 1 end)::int`,
      overdue31To60Amount: sql<string>`coalesce(sum(case when (current_date - ${vendorInvoices.dueDate}::date) between 31 and 60 then (${vendorInvoices.total} - ${vendorInvoices.paidAmount}) else 0 end), 0)::text`,

      overdue60PlusCount: sql<number>`count(case when (current_date - ${vendorInvoices.dueDate}::date) > 60 then 1 end)::int`,
      overdue60PlusAmount: sql<string>`coalesce(sum(case when (current_date - ${vendorInvoices.dueDate}::date) > 60 then (${vendorInvoices.total} - ${vendorInvoices.paidAmount}) else 0 end), 0)::text`,

      totalCount: sql<number>`count(${vendorInvoices.id})::int`,
      totalOutstanding: sql<string>`coalesce(sum(${vendorInvoices.total} - ${vendorInvoices.paidAmount}), 0)::text`,
    };

    const invoiceFields = {
      id: vendorInvoices.id,
      vendorId: vendorInvoices.vendorId,
      vendorName: vendors.name,
      invoiceNumber: vendorInvoices.invoiceNumber,
      invoiceDate: vendorInvoices.createdAt,
      dueDate: vendorInvoices.dueDate,
      total: sql<string>`${vendorInvoices.total}::text`,
      paidAmount: sql<string>`${vendorInvoices.paidAmount}::text`,
      balanceDue: sql<string>`(${vendorInvoices.total} - ${vendorInvoices.paidAmount})::text`,
      status: vendorInvoices.status,
      daysOverdue: sql<number>`case when ${vendorInvoices.dueDate}::date < current_date then (current_date - ${vendorInvoices.dueDate}::date)::int else 0 end`,
      bucket: sql<string>`case 
        when ${vendorInvoices.dueDate}::date >= current_date then 'Current'
        when (current_date - ${vendorInvoices.dueDate}::date) <= 30 then '1-30 Days'
        when (current_date - ${vendorInvoices.dueDate}::date) <= 60 then '31-60 Days'
        else '60+ Days'
      end`,
    };

    let bucketQuery;
    let listQuery;

    if (data.branchId && data.branchId !== "all") {
      bucketQuery = db
        .select(bucketFields)
        .from(vendorInvoices)
        .innerJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
        .where(and(...payablesConditions, eq(purchaseOrders.branchId, data.branchId)));

      listQuery = db
        .select(invoiceFields)
        .from(vendorInvoices)
        .leftJoin(vendors, eq(vendorInvoices.vendorId, vendors.id))
        .innerJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
        .where(and(...payablesConditions, eq(purchaseOrders.branchId, data.branchId)))
        .orderBy(
          desc(sql`case when ${vendorInvoices.dueDate}::date < current_date then (current_date - ${vendorInvoices.dueDate}::date) else 0 end`),
          sql`${vendorInvoices.dueDate} asc`
        );
    } else {
      bucketQuery = db
        .select(bucketFields)
        .from(vendorInvoices)
        .where(and(...payablesConditions));

      listQuery = db
        .select(invoiceFields)
        .from(vendorInvoices)
        .leftJoin(vendors, eq(vendorInvoices.vendorId, vendors.id))
        .where(and(...payablesConditions))
        .orderBy(
          desc(sql`case when ${vendorInvoices.dueDate}::date < current_date then (current_date - ${vendorInvoices.dueDate}::date) else 0 end`),
          sql`${vendorInvoices.dueDate} asc`
        );
    }

    const [bucketRes, listRes] = await Promise.all([bucketQuery, listQuery]);

    const b = bucketRes[0];
    const currentCount = b?.currentCount || 0;
    const currentAmount = parseFloat(b?.currentAmount || "0");
    const overdue1To30Count = b?.overdue1To30Count || 0;
    const overdue1To30Amount = parseFloat(b?.overdue1To30Amount || "0");
    const overdue31To60Count = b?.overdue31To60Count || 0;
    const overdue31To60Amount = parseFloat(b?.overdue31To60Amount || "0");
    const overdue60PlusCount = b?.overdue60PlusCount || 0;
    const overdue60PlusAmount = parseFloat(b?.overdue60PlusAmount || "0");
    const totalCount = b?.totalCount || 0;
    const totalOutstanding = parseFloat(b?.totalOutstanding || "0");

    const formattedInvoices = listRes.map((inv) => ({
      id: inv.id,
      vendorId: inv.vendorId,
      vendorName: inv.vendorName || "Unknown Vendor",
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split("T")[0] : "",
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "",
      daysOverdue: Number(inv.daysOverdue || 0),
      total: Number(parseFloat(inv.total || "0").toFixed(2)),
      paidAmount: Number(parseFloat(inv.paidAmount || "0").toFixed(2)),
      balanceDue: Number(parseFloat(inv.balanceDue || "0").toFixed(2)),
      bucket: inv.bucket as "Current" | "1-30 Days" | "31-60 Days" | "60+ Days",
      status: inv.status,
    }));

    await logAuditAction({
      action: "Generated Accounts Payable Aging Report",
      entityType: "Report",
      entityId: "ApAging",
      summary: `Generated Accounts Payable Aging Report as of today (Branch: ${data.branchId || "all"})`,
    });

    return {
      success: true,
      data: {
        summary: {
          totalOutstanding: Number(totalOutstanding.toFixed(2)),
          totalCount,
          current: {
            count: currentCount,
            amount: Number(currentAmount.toFixed(2)),
          },
          overdue1To30: {
            count: overdue1To30Count,
            amount: Number(overdue1To30Amount.toFixed(2)),
          },
          overdue31To60: {
            count: overdue31To60Count,
            amount: Number(overdue31To60Amount.toFixed(2)),
          },
          overdue60Plus: {
            count: overdue60PlusCount,
            amount: Number(overdue60PlusAmount.toFixed(2)),
          },
        },
        invoices: formattedInvoices,
        currency: "AED",
        asOfDate: new Date().toISOString().split("T")[0],
      },
    };
  });

export const getInventoryValuationFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; tenantId?: string } | undefined) => d || {})
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);

    const conditions = [
      sql`${stockLevels.stock} > 0`,
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(stockLevels.branchId, data.branchId));
    }
    const whereClause = and(...conditions);

    // 1. Overall Totals
    const overallQuery = db
      .select({
        totalCostValue: sql<string>`coalesce(sum(${stockLevels.stock} * ${products.costPrice}), 0)::text`,
        totalRetailValue: sql<string>`coalesce(sum(${stockLevels.stock} * coalesce(${stockLevels.priceOverride}, ${products.salePrice})), 0)::text`,
        totalStockUnits: sql<number>`coalesce(sum(${stockLevels.stock}), 0)::int`,
        productCount: sql<number>`count(distinct ${products.id})::int`,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(whereClause);

    // 2. Category Breakdown
    const categoryQuery = db
      .select({
        category: sql<string>`coalesce(${products.category}, 'Uncategorized')`,
        stockUnits: sql<number>`coalesce(sum(${stockLevels.stock}), 0)::int`,
        costValue: sql<string>`coalesce(sum(${stockLevels.stock} * ${products.costPrice}), 0)::text`,
        retailValue: sql<string>`coalesce(sum(${stockLevels.stock} * coalesce(${stockLevels.priceOverride}, ${products.salePrice})), 0)::text`,
        productCount: sql<number>`count(distinct ${products.id})::int`,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(whereClause)
      .groupBy(sql`coalesce(${products.category}, 'Uncategorized')`)
      .orderBy(desc(sql`sum(${stockLevels.stock} * ${products.costPrice})`));

    // 3. Branch Breakdown (only when All Branches is selected)
    let branchQuery = null;
    if (!data.branchId || data.branchId === "all") {
      branchQuery = db
        .select({
          branchId: stockLevels.branchId,
          branchName: branches.name,
          stockUnits: sql<number>`coalesce(sum(${stockLevels.stock}), 0)::int`,
          costValue: sql<string>`coalesce(sum(${stockLevels.stock} * ${products.costPrice}), 0)::text`,
          retailValue: sql<string>`coalesce(sum(${stockLevels.stock} * coalesce(${stockLevels.priceOverride}, ${products.salePrice})), 0)::text`,
          productCount: sql<number>`count(distinct ${products.id})::int`,
        })
        .from(stockLevels)
        .innerJoin(products, eq(stockLevels.productId, products.id))
        .innerJoin(branches, eq(stockLevels.branchId, branches.id))
        .where(whereClause)
        .groupBy(stockLevels.branchId, branches.name)
        .orderBy(desc(sql`sum(${stockLevels.stock} * ${products.costPrice})`));
    }

    const [overallRes, categoryRes, branchRes] = await Promise.all([
      overallQuery,
      categoryQuery,
      branchQuery ? branchQuery : Promise.resolve([]),
    ]);

    const totalCost = parseFloat(overallRes[0]?.totalCostValue || "0");
    const totalRetail = parseFloat(overallRes[0]?.totalRetailValue || "0");
    const unrealizedMargin = totalRetail - totalCost;
    const unrealizedMarginPct = totalRetail > 0 ? (unrealizedMargin / totalRetail) * 100 : 0;
    const totalStockUnits = overallRes[0]?.totalStockUnits || 0;
    const totalProducts = overallRes[0]?.productCount || 0;

    const categories = categoryRes.map((c) => {
      const cost = parseFloat(c.costValue || "0");
      const retail = parseFloat(c.retailValue || "0");
      const margin = retail - cost;
      const marginPct = retail > 0 ? (margin / retail) * 100 : 0;
      return {
        category: c.category,
        stockUnits: c.stockUnits,
        costValue: Number(cost.toFixed(2)),
        retailValue: Number(retail.toFixed(2)),
        margin: Number(margin.toFixed(2)),
        marginPct: Number(marginPct.toFixed(1)),
        productCount: c.productCount,
      };
    });

    const branchesList = branchRes.map((b: any) => {
      const cost = parseFloat(b.costValue || "0");
      const retail = parseFloat(b.retailValue || "0");
      const margin = retail - cost;
      const marginPct = retail > 0 ? (margin / retail) * 100 : 0;
      return {
        branchId: b.branchId,
        branchName: b.branchName,
        stockUnits: b.stockUnits,
        costValue: Number(cost.toFixed(2)),
        retailValue: Number(retail.toFixed(2)),
        margin: Number(margin.toFixed(2)),
        marginPct: Number(marginPct.toFixed(1)),
        productCount: b.productCount,
      };
    });

    await logAuditAction({
      action: "Generated Inventory Valuation Report",
      entityType: "Report",
      entityId: "InventoryValuationReport",
      summary: `Generated Inventory Valuation Report as of today (Branch: ${data.branchId || "all"})`,
    });

    return {
      success: true,
      data: {
        totals: {
          totalCostValue: Number(totalCost.toFixed(2)),
          totalRetailValue: Number(totalRetail.toFixed(2)),
          unrealizedMargin: Number(unrealizedMargin.toFixed(2)),
          unrealizedMarginPct: Number(unrealizedMarginPct.toFixed(1)),
          totalStockUnits,
          totalProducts,
        },
        categories,
        branches: branchesList,
        currency: "AED",
        asOfDate: new Date().toISOString().split("T")[0],
      },
    };
  });

export const getVatReturnSummaryFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string; tenantId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantCtx = await resolveReportTenantContext(data.tenantId);

    // Normalize date boundaries
    let sDate = new Date(data.startDate);
    let eDate = new Date(data.endDate);

    if (typeof data.startDate === "string" && data.startDate.length === 10) {
      sDate = new Date(`${data.startDate}T00:00:00.000Z`);
    }
    if (typeof data.endDate === "string" && data.endDate.length === 10) {
      eDate = new Date(`${data.endDate}T23:59:59.999Z`);
    }

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // 1. Output VAT (Box 1 equivalent: VAT collected on completed sales)
    const orderConditions = [
      eq(orders.status, "completed"),
      gte(orders.createdAt, sDate),
      lte(orders.createdAt, eDate),
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      orderConditions.push(eq(orders.tenantId, tenantCtx.tenantId));
    }
    if (data.branchId && data.branchId !== "all") {
      orderConditions.push(eq(orders.branchId, data.branchId));
    }

    const outputVatQuery = db
      .select({
        salesCount: sql<number>`count(${orders.id})::int`,
        netSalesExVat: sql<string>`coalesce(sum(${orders.subtotal}), 0)::text`,
        outputVat: sql<string>`coalesce(sum(${orders.vat}), 0)::text`,
        totalSalesIncVat: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
      })
      .from(orders)
      .where(and(...orderConditions));

    // 2. Input VAT (Box 9 equivalent: Recoverable VAT paid on vendor purchases)
    const invoiceConditions = [
      gte(vendorInvoices.createdAt, sDate),
      lte(vendorInvoices.createdAt, eDate),
    ];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      invoiceConditions.push(eq(vendorInvoices.tenantId, tenantCtx.tenantId));
    }

    let inputVatQuery;
    if (data.branchId && data.branchId !== "all") {
      inputVatQuery = db
        .select({
          purchasesCount: sql<number>`count(${vendorInvoices.id})::int`,
          netPurchasesExVat: sql<string>`coalesce(sum(${vendorInvoices.subtotal}), 0)::text`,
          inputVat: sql<string>`coalesce(sum(${vendorInvoices.vatAmount}), 0)::text`,
          totalPurchasesIncVat: sql<string>`coalesce(sum(${vendorInvoices.total}), 0)::text`,
        })
        .from(vendorInvoices)
        .innerJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
        .where(and(...invoiceConditions, eq(purchaseOrders.branchId, data.branchId)));
    } else {
      inputVatQuery = db
        .select({
          purchasesCount: sql<number>`count(${vendorInvoices.id})::int`,
          netPurchasesExVat: sql<string>`coalesce(sum(${vendorInvoices.subtotal}), 0)::text`,
          inputVat: sql<string>`coalesce(sum(${vendorInvoices.vatAmount}), 0)::text`,
          totalPurchasesIncVat: sql<string>`coalesce(sum(${vendorInvoices.total}), 0)::text`,
        })
        .from(vendorInvoices)
        .where(and(...invoiceConditions));
    }

    // 3. Tax Registration Number (TRN)
    let trn = "Platform Aggregate";
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      const settings = await db
        .select({ trn: tenantSettings.taxRegistrationNumber })
        .from(tenantSettings)
        .where(eq(tenantSettings.tenantId, tenantCtx.tenantId))
        .limit(1);
      trn = settings[0]?.trn || "Not Configured";
    }

    const [outputRes, inputRes] = await Promise.all([outputVatQuery, inputVatQuery]);

    const salesCount = outputRes[0]?.salesCount || 0;
    const netSalesExVat = parseFloat(outputRes[0]?.netSalesExVat || "0");
    const outputVat = parseFloat(outputRes[0]?.outputVat || "0");
    const totalSalesIncVat = parseFloat(outputRes[0]?.totalSalesIncVat || "0");

    const purchasesCount = inputRes[0]?.purchasesCount || 0;
    const netPurchasesExVat = parseFloat(inputRes[0]?.netPurchasesExVat || "0");
    const inputVat = parseFloat(inputRes[0]?.inputVat || "0");
    const totalPurchasesIncVat = parseFloat(inputRes[0]?.totalPurchasesIncVat || "0");

    const netVatPayable = outputVat - inputVat;
    const vatPosition: "payable" | "refundable" | "balanced" =
      netVatPayable > 0 ? "payable" : netVatPayable < 0 ? "refundable" : "balanced";

    await logAuditAction({
      action: "Generated Full UAE VAT Return",
      entityType: "Report",
      entityId: "VatReturn",
      summary: `Generated Full UAE VAT Return from ${data.startDate} to ${data.endDate} (Branch: ${data.branchId || "all"})`,
    });

    return {
      success: true,
      data: {
        trn,
        periodStart: sDate.toISOString(),
        periodEnd: eDate.toISOString(),
        currency: "AED",
        output: {
          box: "Box 1 (Standard Rated Supplies)",
          salesCount,
          netSalesExVat: Number(netSalesExVat.toFixed(2)),
          outputVat: Number(outputVat.toFixed(2)),
          totalSalesIncVat: Number(totalSalesIncVat.toFixed(2)),
        },
        input: {
          box: "Box 9 (Standard Rated Expenses & Purchases)",
          purchasesCount,
          netPurchasesExVat: Number(netPurchasesExVat.toFixed(2)),
          inputVat: Number(inputVat.toFixed(2)),
          totalPurchasesIncVat: Number(totalPurchasesIncVat.toFixed(2)),
        },
        net: {
          amount: Number(Math.abs(netVatPayable).toFixed(2)),
          rawNetVat: Number(netVatPayable.toFixed(2)),
          position: vatPosition,
        },
      },
    };
  });

// --- Branch Manager Financial Reporting & Head Office Submission ---

async function computeBranchFinancialData(tenantId: string, branchId: string, startDate: string, endDate: string) {
  let sDate = new Date(startDate);
  let eDate = new Date(endDate);

  if (typeof startDate === "string" && startDate.length === 10) {
    sDate = new Date(`${startDate}T00:00:00.000Z`);
  }
  if (typeof endDate === "string" && endDate.length === 10) {
    eDate = new Date(`${endDate}T23:59:59.999Z`);
  }

  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
    throw new Error("Invalid date format");
  }

  const branch = await db.query.branches.findFirst({
    where: eq(branches.id, branchId),
  });

  const ordersWhere = and(
    eq(orders.status, "completed"),
    gte(orders.createdAt, sDate),
    lte(orders.createdAt, eDate),
    eq(orders.tenantId, tenantId),
    eq(orders.branchId, branchId)
  );

  const [revRes, cogsRes, payablesRes, invRes, tenders, channels, topProducts] = await Promise.all([
    // Revenue & orders count
    db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .where(ordersWhere),

    // COGS
    db
      .select({
        cogs: sql<string>`coalesce(sum(${orderItems.qty} * ${products.costPrice}), 0)::text`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(ordersWhere),

    // Outstanding Payables for this branch
    db
      .select({
        outstandingPayables: sql<string>`coalesce(sum(${vendorInvoices.total} - ${vendorInvoices.paidAmount}), 0)::text`,
        unpaidInvoiceCount: sql<number>`count(${vendorInvoices.id})::int`,
      })
      .from(vendorInvoices)
      .innerJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
      .where(
        and(
          sql`${vendorInvoices.status} != 'Paid'`,
          eq(vendorInvoices.tenantId, tenantId),
          eq(purchaseOrders.branchId, branchId)
        )
      ),

    // Inventory value for this branch
    db
      .select({
        inventoryAssetValue: sql<string>`coalesce(sum(${stockLevels.stock} * ${products.costPrice}), 0)::text`,
        totalStockUnits: sql<number>`coalesce(sum(${stockLevels.stock}), 0)::int`,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(
        and(
          eq(stockLevels.branchId, branchId),
          eq(products.tenantId, tenantId)
        )
      ),

    // Tenders
    db
      .select({
        method: orderPayments.method,
        amount: sql<string>`coalesce(sum(${orderPayments.amount}), 0)::text`,
        count: sql<number>`count(${orderPayments.id})::int`,
      })
      .from(orderPayments)
      .innerJoin(orders, eq(orderPayments.orderId, orders.id))
      .where(ordersWhere)
      .groupBy(orderPayments.method)
      .orderBy(desc(sql`sum(${orderPayments.amount})`)),

    // Channels
    db
      .select({
        channel: sql<string>`coalesce(${orders.source}, 'POS')::text`,
        amount: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
        count: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .where(ordersWhere)
      .groupBy(sql`coalesce(${orders.source}, 'POS')`)
      .orderBy(desc(sql`sum(${orders.total})`)),

    // Top 10 products
    db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        category: products.category,
        unitsSold: sql<number>`coalesce(sum(${orderItems.qty}), 0)::int`,
        revenue: sql<string>`coalesce(sum(${orderItems.qty} * ${orderItems.unitPrice}), 0)::text`,
        cogs: sql<string>`coalesce(sum(${orderItems.qty} * ${products.costPrice}), 0)::text`,
        grossProfit: sql<string>`coalesce(sum((${orderItems.unitPrice} - ${products.costPrice}) * ${orderItems.qty}), 0)::text`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(ordersWhere)
      .groupBy(orderItems.productId, products.name, products.category)
      .orderBy(desc(sql`sum((${orderItems.unitPrice} - ${products.costPrice}) * ${orderItems.qty})`))
      .limit(10),
  ]);

  const totalRevenue = parseFloat(revRes[0]?.totalRevenue || "0");
  const orderCount = revRes[0]?.orderCount || 0;
  const cogs = parseFloat(cogsRes[0]?.cogs || "0");
  const grossProfit = totalRevenue - cogs;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const outstandingPayables = parseFloat(payablesRes[0]?.outstandingPayables || "0");
  const unpaidInvoiceCount = payablesRes[0]?.unpaidInvoiceCount || 0;
  const inventoryAssetValue = parseFloat(invRes[0]?.inventoryAssetValue || "0");
  const totalStockUnits = invRes[0]?.totalStockUnits || 0;

  const totalTenderAmount = tenders.reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0);
  const formattedTenders = tenders.map((t) => {
    const amt = parseFloat(t.amount || "0");
    const pct = totalTenderAmount > 0 ? (amt / totalTenderAmount) * 100 : 0;
    return {
      method: t.method || "Other",
      amount: Number(amt.toFixed(2)),
      count: t.count,
      percentage: Number(pct.toFixed(1)),
    };
  });

  const totalChannelAmount = channels.reduce((acc, c) => acc + parseFloat(c.amount || "0"), 0);
  const formattedChannels = channels.map((c) => {
    const amt = parseFloat(c.amount || "0");
    const pct = totalChannelAmount > 0 ? (amt / totalChannelAmount) * 100 : 0;
    return {
      channel: c.channel || "POS",
      amount: Number(amt.toFixed(2)),
      count: c.count,
      percentage: Number(pct.toFixed(1)),
    };
  });

  const formattedTopProducts = topProducts.map((p) => {
    const rev = parseFloat(p.revenue || "0");
    const cost = parseFloat(p.cogs || "0");
    const gp = parseFloat(p.grossProfit || "0");
    const marginPct = rev > 0 ? (gp / rev) * 100 : 0;
    return {
      productId: p.productId,
      productName: p.productName,
      category: p.category || "Uncategorized",
      unitsSold: p.unitsSold,
      revenue: Number(rev.toFixed(2)),
      cogs: Number(cost.toFixed(2)),
      grossProfit: Number(gp.toFixed(2)),
      marginPct: Number(marginPct.toFixed(1)),
    };
  });

  return {
    branch: {
      id: branchId,
      name: branch?.name || "My Branch",
      code: branch?.code || "",
    },
    executiveSummary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossMarginPct: Number(grossMarginPct.toFixed(2)),
      outstandingPayables: Number(outstandingPayables.toFixed(2)),
      inventoryAssetValue: Number(inventoryAssetValue.toFixed(2)),
      orderCount,
      unpaidInvoiceCount,
      totalStockUnits,
      currency: "AED",
      periodStart: sDate.toISOString(),
      periodEnd: eDate.toISOString(),
    },
    salesMargin: {
      tenders: formattedTenders,
      channels: formattedChannels,
      topProducts: formattedTopProducts,
      periodStart: sDate.toISOString(),
      periodEnd: eDate.toISOString(),
      currency: "AED",
    },
  };
}

// 1. Get Branch Manager's own branch financial report (IDOR-safe)
export const getMyBranchFinancialReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Branch Manager" || !res.session.branchId) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }
    const tenantId = res.session.tenantId!;
    const branchId = res.session.branchId;

    const report = await computeBranchFinancialData(tenantId, branchId, data.startDate, data.endDate);
    return {
      success: true,
      data: report,
    };
  });

// 2. Submit branch financial report with frozen snapshot data & optional notes
export const submitBranchReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; notes?: string | null }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Branch Manager" || !res.session.branchId) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }
    const tenantId = res.session.tenantId!;
    const branchId = res.session.branchId;
    const userId = res.session.id;

    // Compute frozen snapshot
    const computedReport = await computeBranchFinancialData(tenantId, branchId, data.startDate, data.endDate);

    const snapshotData = {
      branchName: computedReport.branch.name,
      branchCode: computedReport.branch.code,
      submittedByName: res.session.name || "Branch Manager",
      periodStart: data.startDate,
      periodEnd: data.endDate,
      computedAt: new Date().toISOString(),
      executiveSummary: computedReport.executiveSummary,
      salesMargin: computedReport.salesMargin,
    };

    const [submission] = await db
      .insert(branchReportSubmissions)
      .values({
        tenantId,
        branchId,
        submittedBy: userId,
        periodStart: data.startDate,
        periodEnd: data.endDate,
        snapshotData,
        notes: data.notes?.trim() || null,
        status: "submitted",
      })
      .returning();

    try {
      await logAuditAction({
        action: "Submitted Branch Financial Report",
        entityType: "branch_report_submission",
        entityId: submission.id,
        summary: `Branch report submitted for ${computedReport.branch.name} (${data.startDate} to ${data.endDate})`,
      });
    } catch {}

    return {
      success: true,
      submissionId: submission.id,
    };
  });

// 3. Get Branch Manager's own submission history
export const getMySubmittedReportsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Branch Manager" || !res.session.branchId) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }
    const tenantId = res.session.tenantId!;
    const branchId = res.session.branchId;

    const reviewerStaff = aliasedTable(staffUsers, "reviewer_staff");

    const rows = await db
      .select({
        id: branchReportSubmissions.id,
        submittedBy: branchReportSubmissions.submittedBy,
        periodStart: branchReportSubmissions.periodStart,
        periodEnd: branchReportSubmissions.periodEnd,
        snapshotData: branchReportSubmissions.snapshotData,
        notes: branchReportSubmissions.notes,
        status: branchReportSubmissions.status,
        headOfficeMessage: branchReportSubmissions.headOfficeMessage,
        reviewedAt: branchReportSubmissions.reviewedAt,
        createdAt: branchReportSubmissions.createdAt,
        reviewerName: reviewerStaff.name,
      })
      .from(branchReportSubmissions)
      .leftJoin(reviewerStaff, eq(branchReportSubmissions.reviewedBy, reviewerStaff.id))
      .where(
        and(
          eq(branchReportSubmissions.tenantId, tenantId),
          eq(branchReportSubmissions.branchId, branchId)
        )
      )
      .orderBy(desc(branchReportSubmissions.createdAt));

    return {
      success: true,
      submissions: rows,
    };
  });

// 4. Head Office Admin view — list all branch submissions
export const getBranchSubmissionsFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; status?: string } | undefined) => d || {})
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || (res.session.role !== "Head Office Admin" && res.session.role !== "Super Admin")) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin.");
    }
    const tenantId = res.session.tenantId!;

    const submitterStaff = aliasedTable(staffUsers, "submitter_staff");
    const reviewerStaff = aliasedTable(staffUsers, "reviewer_staff");

    const conditions = [eq(branchReportSubmissions.tenantId, tenantId)];
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(branchReportSubmissions.branchId, data.branchId));
    }
    if (data.status && data.status !== "all") {
      conditions.push(eq(branchReportSubmissions.status, data.status));
    }

    const rows = await db
      .select({
        id: branchReportSubmissions.id,
        branchId: branchReportSubmissions.branchId,
        branchName: branches.name,
        periodStart: branchReportSubmissions.periodStart,
        periodEnd: branchReportSubmissions.periodEnd,
        snapshotData: branchReportSubmissions.snapshotData,
        notes: branchReportSubmissions.notes,
        status: branchReportSubmissions.status,
        headOfficeMessage: branchReportSubmissions.headOfficeMessage,
        reviewedAt: branchReportSubmissions.reviewedAt,
        createdAt: branchReportSubmissions.createdAt,
        submitterName: submitterStaff.name,
        submitterEmail: submitterStaff.email,
        reviewerName: reviewerStaff.name,
      })
      .from(branchReportSubmissions)
      .innerJoin(branches, eq(branchReportSubmissions.branchId, branches.id))
      .innerJoin(submitterStaff, eq(branchReportSubmissions.submittedBy, submitterStaff.id))
      .leftJoin(reviewerStaff, eq(branchReportSubmissions.reviewedBy, reviewerStaff.id))
      .where(and(...conditions))
      .orderBy(desc(branchReportSubmissions.createdAt));

    return {
      success: true,
      submissions: rows,
    };
  });

// 5. Head Office Admin — mark a branch submission as reviewed (Approve)
export const markSubmissionReviewedFn = createServerFn({ method: "POST" })
  .validator((d: { submissionId: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || (res.session.role !== "Head Office Admin" && res.session.role !== "Super Admin")) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin.");
    }
    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    const [updated] = await db
      .update(branchReportSubmissions)
      .set({
        status: "reviewed",
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(branchReportSubmissions.id, data.submissionId),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Submission not found or unauthorized.");
    }

    try {
      await logAuditAction({
        action: "Reviewed Branch Report Submission",
        entityType: "branch_report_submission",
        entityId: data.submissionId,
        summary: `Marked branch report submission ${data.submissionId} as reviewed`,
      });
    } catch {}

    return { success: true };
  });

// 6. Head Office Admin — Return with Message (Reject / Request revisions)
export const returnBranchSubmissionFn = createServerFn({ method: "POST" })
  .validator((d: { submissionId: string; message: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || (res.session.role !== "Head Office Admin" && res.session.role !== "Super Admin")) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin.");
    }
    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    const msg = data.message?.trim();
    if (!msg) {
      throw new Error("A return message or reason is required.");
    }

    const existing = await db.query.branchReportSubmissions.findFirst({
      where: and(
        eq(branchReportSubmissions.id, data.submissionId),
        eq(branchReportSubmissions.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Submission not found.");
    }

    if (existing.status === "reviewed") {
      throw new Error("Locked: This submission has already been reviewed and approved.");
    }

    const [updated] = await db
      .update(branchReportSubmissions)
      .set({
        status: "returned",
        headOfficeMessage: msg,
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(branchReportSubmissions.id, data.submissionId),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Failed to return submission.");
    }

    try {
      await logAuditAction({
        action: "Returned Branch Report Submission",
        entityType: "branch_report_submission",
        entityId: data.submissionId,
        summary: `Returned branch report submission ${data.submissionId} with feedback: "${msg}"`,
      });
    } catch {}

    return { success: true };
  });

// 7. Branch Manager — Update / Resubmit unreviewed submission
export const updateBranchSubmissionFn = createServerFn({ method: "POST" })
  .validator((d: { submissionId: string; notes?: string | null; startDate?: string; endDate?: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Branch Manager" || !res.session.branchId) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }
    const tenantId = res.session.tenantId!;
    const branchId = res.session.branchId;
    const userId = res.session.id;

    const existing = await db.query.branchReportSubmissions.findFirst({
      where: and(
        eq(branchReportSubmissions.id, data.submissionId),
        eq(branchReportSubmissions.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Submission not found.");
    }

    if (existing.submittedBy !== userId) {
      throw new Error("Unauthorized: You can only edit your own submissions.");
    }

    if (existing.status === "reviewed") {
      throw new Error("Locked: Reviewed submissions cannot be edited.");
    }

    if (existing.status !== "submitted" && existing.status !== "returned") {
      throw new Error(`Cannot edit submission in '${existing.status}' status.`);
    }

    const periodStart = data.startDate || existing.periodStart;
    const periodEnd = data.endDate || existing.periodEnd;

    const updates: Record<string, any> = {
      notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
      status: "submitted",
    };

    // Re-snapshot financial data if date range is provided or if resubmitting
    if (data.startDate || data.endDate) {
      const computedReport = await computeBranchFinancialData(tenantId, branchId, periodStart, periodEnd);
      updates.periodStart = periodStart;
      updates.periodEnd = periodEnd;
      updates.snapshotData = {
        branchName: computedReport.branch.name,
        branchCode: computedReport.branch.code,
        submittedByName: res.session.name || "Branch Manager",
        periodStart,
        periodEnd,
        computedAt: new Date().toISOString(),
        executiveSummary: computedReport.executiveSummary,
        salesMargin: computedReport.salesMargin,
      };
    }

    await db
      .update(branchReportSubmissions)
      .set(updates)
      .where(eq(branchReportSubmissions.id, data.submissionId));

    try {
      await logAuditAction({
        action: "Updated Branch Financial Report Submission",
        entityType: "branch_report_submission",
        entityId: data.submissionId,
        summary: `Branch report submission ${data.submissionId} updated and resubmitted`,
      });
    } catch {}

    return { success: true };
  });

// 8. Delete submission (Branch Manager can delete own unreviewed; Head Office Admin can delete any in tenant)
export const deleteBranchSubmissionFn = createServerFn({ method: "POST" })
  .validator((d: { submissionId: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) {
      throw new Error("Unauthorized: Authentication required.");
    }
    const role = res.session.role;
    const isHeadOffice = role === "Head Office Admin" || role === "Super Admin";
    const isBranchManager = role === "Branch Manager";

    if (!isHeadOffice && !isBranchManager) {
      throw new Error("Unauthorized: Access restricted.");
    }

    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    const existing = await db.query.branchReportSubmissions.findFirst({
      where: and(
        eq(branchReportSubmissions.id, data.submissionId),
        eq(branchReportSubmissions.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Submission not found.");
    }

    if (!isHeadOffice) {
      if (existing.submittedBy !== userId) {
        throw new Error("Unauthorized: You can only delete your own submissions.");
      }
      if (existing.status === "reviewed") {
        throw new Error("Locked: Reviewed submissions cannot be deleted.");
      }
      if (existing.status !== "submitted" && existing.status !== "returned") {
        throw new Error(`Cannot delete submission in '${existing.status}' status.`);
      }
    }

    await db
      .delete(branchReportSubmissions)
      .where(eq(branchReportSubmissions.id, data.submissionId));

    try {
      await logAuditAction({
        action: "Deleted Branch Financial Report Submission",
        entityType: "branch_report_submission",
        entityId: data.submissionId,
        summary: `Branch report submission ${data.submissionId} deleted by ${isHeadOffice ? "Head Office Admin" : "Branch Manager"}`,
      });
    } catch {}

    return { success: true };
  });

// 9. Head Office Admin — Edit submission (notes, feedback message, status)
export const adminUpdateBranchSubmissionFn = createServerFn({ method: "POST" })
  .validator((d: { submissionId: string; notes?: string; headOfficeMessage?: string; status?: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || (res.session.role !== "Head Office Admin" && res.session.role !== "Super Admin")) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin.");
    }
    const tenantId = res.session.tenantId!;

    const existing = await db.query.branchReportSubmissions.findFirst({
      where: and(
        eq(branchReportSubmissions.id, data.submissionId),
        eq(branchReportSubmissions.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Submission not found.");
    }

    const updates: Record<string, any> = {};
    if (data.notes !== undefined) {
      updates.notes = data.notes?.trim() || null;
    }
    if (data.headOfficeMessage !== undefined) {
      updates.headOfficeMessage = data.headOfficeMessage?.trim() || null;
    }
    if (data.status && ["submitted", "reviewed", "returned"].includes(data.status)) {
      updates.status = data.status;
      if (data.status === "reviewed" && !existing.reviewedAt) {
        updates.reviewedBy = res.session.id;
        updates.reviewedAt = new Date();
      }
    }

    await db
      .update(branchReportSubmissions)
      .set(updates)
      .where(eq(branchReportSubmissions.id, data.submissionId));

    try {
      await logAuditAction({
        action: "Head Office Admin Updated Submission",
        entityType: "branch_report_submission",
        entityId: data.submissionId,
        summary: `Submission ${data.submissionId} updated by Head Office Admin (${res.session.name})`,
      });
    } catch {}

    return { success: true };
  });






