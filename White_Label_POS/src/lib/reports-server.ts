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
  vendors,
  tenantSettings
} from "@/server/db/schema";
import { eq, and, sql, gte, lt, desc } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import { logAuditAction } from "@/lib/audit-logger";

async function getHeadOfficeTenant() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session || res.session.role !== "Head Office Admin") {
    throw new Error("Unauthorized");
  }
  return res.session.tenantId;
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
  
  // Return boundaries (half-open range: [startDate, endDate) )
  return { sDate, eDate };
};

const buildOrdersWhere = (tenantId: string, sDate: Date, eDate: Date, branchId?: string) => {
  const conditions = [
    eq(orders.tenantId, tenantId),
    eq(orders.status, "completed"),
    gte(orders.createdAt, sDate),
    lt(orders.createdAt, eDate) // Exclusive end date
  ];
  if (branchId) {
    conditions.push(eq(orders.branchId, branchId));
  }
  return and(...conditions);
};

export const getSalesSummaryReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);

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
        orderCount,
        netSales: netSales.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalSales: totalSales.toFixed(2),
        averageOrderValue
      }
    };
  });

export const getBranchSalesReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
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
    .where(buildOrdersWhere(tenantId, sDate, eDate))
    .groupBy(orders.branchId, branches.name)
    .orderBy(desc(sql`sum(${orders.total})`));

    await logAuditAction({ action: "Generated Branch Sales Report", entityType: "Report", entityId: "BranchSales", summary: `Generated Branch Sales Report from ${data.startDate} to ${data.endDate}` });
    return { success: true, data: results };
  });

export const getProductSalesReportFn = createServerFn({ method: "POST" })
  .validator((d: { startDate: string; endDate: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);

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
  .validator((d: { startDate: string; endDate: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);

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
  .validator((d: { startDate: string; endDate: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);

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
  .validator((d: { branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const conditions = [eq(products.tenantId, tenantId)];
    if (data.branchId) {
      conditions.push(eq(stockLevels.branchId, data.branchId));
    }

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
    .where(and(...conditions))
    .orderBy(branches.name, products.name);

    await logAuditAction({ action: "Generated Inventory Valuation Report", entityType: "Report", entityId: "InventoryValuation", summary: `Generated Inventory Valuation Report` });
    return { success: true, data: results };
  });

export const getLowStockReportFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const conditions = [
      eq(products.tenantId, tenantId),
      sql`${stockLevels.stock} < ${stockLevels.reorderLevel}`
    ];
    if (data.branchId) {
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
  .validator((d: { branchId?: string; daysThreshold: number }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    // Check batches expiring before (now + daysThreshold)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + data.daysThreshold);

    const conditions = [
      eq(batches.tenantId, tenantId),
      lt(batches.expiryDate, thresholdDate),
      gte(batches.stock, 1) // Only check batches that have stock
    ];
    if (data.branchId) {
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
  .validator((d: { startDate: string; endDate: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    
    const conditions = [
      eq(purchaseOrders.tenantId, tenantId),
      gte(purchaseOrders.createdAt, sDate),
      lt(purchaseOrders.createdAt, eDate)
    ];
    if (data.branchId) {
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
  .validator((d: { startDate: string; endDate: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    
    const conditions = [
      eq(purchaseOrders.tenantId, tenantId),
      gte(purchaseOrders.createdAt, sDate),
      lt(purchaseOrders.createdAt, eDate)
    ];

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
  .validator((d: { startDate: string; endDate: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
    const whereClause = buildOrdersWhere(tenantId, sDate, eDate);

    // Get Tenant TRN
    const settings = await db.select({ trn: tenantSettings.taxRegistrationNumber }).from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
    const trn = settings[0]?.trn || "Not Configured";

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
        periodStart: sDate.toISOString(),
        periodEnd: eDate.toISOString(),
        taxableOrdersCount,
        salesExVat,
        vatAmount,
        salesIncVat,
        standardRatedSales: salesExVat, // Assuming standard rated based on schema limitation
        notes: "Historical stored VAT values used. Mixed tax categories are not fully separated in the schema. This represents aggregate VAT as captured at checkout.",
      }
    };
  });
