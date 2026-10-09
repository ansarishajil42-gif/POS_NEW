import { Router } from "express";
import { db } from "../db/index.js";
import {
  orders,
  orderItems,
  orderPayments,
  products,
  stockLevels,
  branches,
  vendors,
  vendorInvoices,
  purchaseOrders,
  tenantSettings,
  tenants,
} from "../db/schema.js";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Middleware: All financial report endpoints require authenticated session
router.use(requireAuth);

/**
 * Helper to resolve and validate the session tenant ID.
 * Strictly derives tenantId from the JWT session to prevent cross-tenant data leakage.
 */
function resolveTenantId(req: AuthRequest): string | null {
  const user = req.user;
  if (!user) return null;

  // Super Admin can optionally view a specific tenant if supplied
  if (user.role === "super_admin") {
    if (req.query.tenantId && typeof req.query.tenantId === "string" && req.query.tenantId !== "all") {
      return req.query.tenantId;
    }
  }

  // Head Office Admin (and any non-super_admin) ALWAYS uses their session tenantId
  return user.tenantId || null;
}

/**
 * Helper to parse and normalize date boundaries into UTC full-day spans.
 */
export function parseDateRange(startDateQuery?: any, endDateQuery?: any) {
  let sDate = startDateQuery ? new Date(startDateQuery as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let eDate = endDateQuery ? new Date(endDateQuery as string) : new Date();

  if (typeof startDateQuery === "string" && startDateQuery.length === 10) {
    sDate = new Date(`${startDateQuery}T00:00:00.000Z`);
  }
  if (typeof endDateQuery === "string" && endDateQuery.length === 10) {
    eDate = new Date(`${endDateQuery}T23:59:59.999Z`);
  } else {
    eDate.setHours(23, 59, 59, 999);
  }

  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
    throw new Error("Invalid date format provided");
  }

  return { sDate, eDate };
}

/**
 * Reusable Executive Financial Summary Calculation.
 * Scoped strictly to tenantId, and optionally branchId.
 */
export async function computeExecutiveSummaryData(
  tenantId: string,
  branchId: string | undefined,
  sDate: Date,
  eDate: Date
) {
  const orderConditions = [
    eq(orders.tenantId, tenantId),
    eq(orders.status, "completed"),
    gte(orders.createdAt, sDate),
    lte(orders.createdAt, eDate),
  ];
  if (branchId && typeof branchId === "string" && branchId !== "all") {
    orderConditions.push(eq(orders.branchId, branchId));
  }
  const ordersWhere = and(...orderConditions);

  // 1. Revenue & Completed Orders
  const [revStats] = await db
    .select({
      totalRevenue: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
      totalVatCollected: sql<string>`coalesce(sum(${orders.vat}), 0)::text`,
      orderCount: sql<number>`count(${orders.id})::int`,
    })
    .from(orders)
    .where(ordersWhere);

  const totalRevenue = parseFloat(revStats?.totalRevenue || "0");
  const totalVatCollected = parseFloat(revStats?.totalVatCollected || "0");
  const orderCount = revStats?.orderCount || 0;

  // 2. Cost of Goods Sold (COGS) aggregated on order items * products
  const [cogsStats] = await db
    .select({
      totalCogs: sql<string>`coalesce(sum(${orderItems.qty} * ${products.costPrice}), 0)::text`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(ordersWhere);

  const cogs = parseFloat(cogsStats?.totalCogs || "0");
  const grossProfit = totalRevenue - cogs;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // 3. Branch Performance Breakdown
  const branchRows = await db
    .select({
      branchId: orders.branchId,
      branchName: sql<string>`coalesce(${branches.name}, 'Unknown Branch')`,
      branchRevenue: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
      branchOrders: sql<number>`count(${orders.id})::int`,
    })
    .from(orders)
    .leftJoin(branches, eq(orders.branchId, branches.id))
    .where(ordersWhere)
    .groupBy(orders.branchId, branches.name)
    .orderBy(desc(sql`sum(${orders.total})`));

  const branchPerformance = branchRows.map((b) => {
    const bRev = parseFloat(b.branchRevenue || "0");
    const contributionPercent = totalRevenue > 0 ? (bRev / totalRevenue) * 100 : 0;
    return {
      branchId: b.branchId,
      branchName: b.branchName,
      revenue: bRev,
      orderCount: b.branchOrders,
      contributionPercent: Math.round(contributionPercent * 10) / 10,
    };
  });

  return {
    totalRevenue,
    cogs,
    grossProfit,
    grossMarginPercent: Math.round(grossMarginPercent * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    orderCount,
    totalVatCollected,
    branchPerformance,
  };
}

/**
 * Reusable Sales & Margin Calculation.
 * Scoped strictly to tenantId, and optionally branchId.
 */
export async function computeSalesMarginData(
  tenantId: string,
  branchId: string | undefined,
  sDate: Date,
  eDate: Date
) {
  const orderConditions = [
    eq(orders.tenantId, tenantId),
    eq(orders.status, "completed"),
    gte(orders.createdAt, sDate),
    lte(orders.createdAt, eDate),
  ];
  if (branchId && typeof branchId === "string" && branchId !== "all") {
    orderConditions.push(eq(orders.branchId, branchId));
  }
  const ordersWhere = and(...orderConditions);

  const [tendersRows, channelsRows, topProductsRows] = await Promise.all([
    // 1. Tender Breakdown
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

    // 2. Channel Breakdown
    db
      .select({
        channel: sql<string>`coalesce(${orders.source}, 'POS')`,
        amount: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .where(ordersWhere)
      .groupBy(orders.source)
      .orderBy(desc(sql`sum(${orders.total})`)),

    // 3. Top 10 Products by Revenue & Margin
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        category: sql<string>`coalesce(${products.category}, 'General')`,
        qtySold: sql<number>`coalesce(sum(${orderItems.qty}), 0)::int`,
        revenue: sql<string>`coalesce(sum(${orderItems.qty} * ${orderItems.unitPrice}), 0)::text`,
        cogs: sql<string>`coalesce(sum(${orderItems.qty} * ${products.costPrice}), 0)::text`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(ordersWhere)
      .groupBy(products.id, products.name, products.sku, products.category)
      .orderBy(desc(sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`))
      .limit(10),
  ]);

  const totalTenderAmount = tendersRows.reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0);
  const tenders = tendersRows.map((t) => {
    const amt = parseFloat(t.amount || "0");
    return {
      method: t.method || "Cash",
      amount: amt,
      count: t.count || 0,
      percentage: totalTenderAmount > 0 ? Math.round((amt / totalTenderAmount) * 100) : 0,
    };
  });

  const totalChannelAmount = channelsRows.reduce((acc, c) => acc + parseFloat(c.amount || "0"), 0);
  const channels = channelsRows.map((c) => {
    const amt = parseFloat(c.amount || "0");
    return {
      channel: c.channel || "POS",
      amount: amt,
      orderCount: c.orderCount || 0,
      percentage: totalChannelAmount > 0 ? Math.round((amt / totalChannelAmount) * 100) : 0,
    };
  });

  const topProducts = topProductsRows.map((p) => {
    const rev = parseFloat(p.revenue || "0");
    const cost = parseFloat(p.cogs || "0");
    const grossProfit = rev - cost;
    const grossMarginPercent = rev > 0 ? (grossProfit / rev) * 100 : 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku || "N/A",
      category: p.category,
      qtySold: p.qtySold,
      revenue: rev,
      cogs: cost,
      grossProfit,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    };
  });

  return {
    tenders,
    channels,
    topProducts,
  };
}

/**
 * 1. GET /api/financial-reports/executive-summary
 * Executive Financial Summary: Revenue, COGS, Gross Profit, Gross Margin %, Average Order Value,
 * Completed Order Count, Total VAT Collected, and Branch Contribution breakdown.
 * Strictly scoped to session tenantId.
 */
router.get("/executive-summary", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { startDate, endDate, branchId } = req.query;
    const { sDate, eDate } = parseDateRange(startDate, endDate);
    const branchIdParam = branchId && typeof branchId === "string" && branchId !== "all" ? branchId : undefined;

    const summary = await computeExecutiveSummaryData(tenantId, branchIdParam, sDate, eDate);

    res.json({
      success: true,
      executiveSummary: summary,
      summary,
    });
  } catch (error: any) {
    console.error("Executive financial summary error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch executive summary" });
  }
});

/**
 * 2. GET /api/financial-reports/sales-margin
 * Sales & Margin Analysis: Tender breakdown, Sales channel breakdown, and Top 10 Products by revenue & gross margin.
 * Strictly scoped to session tenantId.
 */
router.get("/sales-margin", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { startDate, endDate, branchId } = req.query;
    const { sDate, eDate } = parseDateRange(startDate, endDate);
    const branchIdParam = branchId && typeof branchId === "string" && branchId !== "all" ? branchId : undefined;

    const salesMargin = await computeSalesMarginData(tenantId, branchIdParam, sDate, eDate);

    res.json({
      success: true,
      salesMargin,
      analysis: salesMargin,
    });
  } catch (error: any) {
    console.error("Sales & margin analysis error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch sales margin analysis" });
  }
});

/**
 * 3. GET /api/financial-reports/ap-aging
 * Accounts Payable (A/P) Aging: Aging buckets (Current, 1-30, 31-60, 60+ Days), total payables outstanding,
 * vendor breakdown, and unpaid invoice details.
 * Strictly scoped to session tenantId.
 */
router.get("/ap-aging", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { branchId } = req.query;

    const invoiceConditions = [
      eq(vendorInvoices.tenantId, tenantId),
      sql`lower(${vendorInvoices.status}) != 'paid'`,
      sql`${vendorInvoices.total} > 0`,
    ];

    let baseQuery = db
      .select({
        id: vendorInvoices.id,
        invoiceNumber: vendorInvoices.invoiceNumber,
        vendorId: vendorInvoices.vendorId,
        vendorName: sql<string>`coalesce(${vendors.name}, 'Unknown Vendor')`,
        dueDate: vendorInvoices.dueDate,
        createdAt: vendorInvoices.createdAt,
        total: sql<string>`${vendorInvoices.total}::text`,
        paidAmount: sql<string>`'0.00'::text`,
        balanceDue: sql<string>`${vendorInvoices.total}::text`,
        status: vendorInvoices.status,
        daysOverdue: sql<number>`case when ${vendorInvoices.dueDate}::date < current_date then (current_date - ${vendorInvoices.dueDate}::date)::int else 0 end`,
        bucket: sql<string>`case 
          when ${vendorInvoices.dueDate}::date >= current_date then 'Current'
          when (current_date - ${vendorInvoices.dueDate}::date) <= 30 then '1-30 Days'
          when (current_date - ${vendorInvoices.dueDate}::date) <= 60 then '31-60 Days'
          else '60+ Days'
        end`,
      })
      .from(vendorInvoices)
      .leftJoin(vendors, eq(vendorInvoices.vendorId, vendors.id));

    if (branchId && typeof branchId === "string" && branchId !== "all") {
      baseQuery = baseQuery
        .leftJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
        .where(and(...invoiceConditions, eq(purchaseOrders.branchId, branchId))) as any;
    } else {
      baseQuery = baseQuery.where(and(...invoiceConditions)) as any;
    }

    const rows = await baseQuery.orderBy(desc(vendorInvoices.dueDate));

    const buckets = {
      current: { count: 0, amount: 0 },
      overdue1To30: { count: 0, amount: 0 },
      overdue31To60: { count: 0, amount: 0 },
      overdue60Plus: { count: 0, amount: 0 },
      totalCount: 0,
      totalOutstanding: 0,
    };

    const vendorMap: Record<string, { vendorId: string; vendorName: string; totalOutstanding: number; overdueAmount: number; invoiceCount: number }> = {};

    const formattedInvoices = rows.map((r: any) => {
      const balance = parseFloat(r.balanceDue || "0");
      const total = parseFloat(r.total || "0");
      const paid = parseFloat(r.paidAmount || "0");
      const days = Number(r.daysOverdue || 0);

      buckets.totalCount++;
      buckets.totalOutstanding += balance;

      if (r.bucket === "Current") {
        buckets.current.count++;
        buckets.current.amount += balance;
      } else if (r.bucket === "1-30 Days") {
        buckets.overdue1To30.count++;
        buckets.overdue1To30.amount += balance;
      } else if (r.bucket === "31-60 Days") {
        buckets.overdue31To60.count++;
        buckets.overdue31To60.amount += balance;
      } else {
        buckets.overdue60Plus.count++;
        buckets.overdue60Plus.amount += balance;
      }

      // Vendor summary
      const vKey = r.vendorId || "unknown";
      if (!vendorMap[vKey]) {
        vendorMap[vKey] = {
          vendorId: r.vendorId,
          vendorName: r.vendorName,
          totalOutstanding: 0,
          overdueAmount: 0,
          invoiceCount: 0,
        };
      }
      vendorMap[vKey].totalOutstanding += balance;
      vendorMap[vKey].invoiceCount++;
      if (days > 0) {
        vendorMap[vKey].overdueAmount += balance;
      }

      return {
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        vendorName: r.vendorName,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
        total,
        paidAmount: paid,
        balanceDue: balance,
        daysOverdue: days,
        bucket: r.bucket,
        status: r.status,
      };
    });

    const vendorSummary = Object.values(vendorMap).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    res.json({
      success: true,
      apAging: {
        totalOutstanding: Math.round(buckets.totalOutstanding * 100) / 100,
        agingBuckets: {
          current: Math.round(buckets.current.amount * 100) / 100,
          days1To30: Math.round(buckets.overdue1To30.amount * 100) / 100,
          days31To60: Math.round(buckets.overdue31To60.amount * 100) / 100,
          days60Plus: Math.round(buckets.overdue60Plus.amount * 100) / 100,
        },
        buckets,
        vendorSummary,
        invoices: formattedInvoices,
      },
      aging: {
        buckets,
        totalOutstanding: Math.round(buckets.totalOutstanding * 100) / 100,
        invoices: formattedInvoices,
        vendorSummary,
      },
    });
  } catch (error: any) {
    console.error("Accounts payable aging error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch accounts payable aging" });
  }
});

/**
 * 4. GET /api/financial-reports/inventory-valuation
 * Inventory Valuation: Overall Cost Value, Retail Value, Potential Gross Margin, Stock Units,
 * and Category Breakdown.
 * Strictly scoped to session tenantId.
 */
router.get("/inventory-valuation", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { branchId } = req.query;

    const conditions = [
      eq(products.tenantId, tenantId),
      sql`${stockLevels.stock} > 0`,
    ];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(stockLevels.branchId, branchId));
    }
    const whereClause = and(...conditions);

    // 1. Overall Totals
    const [overallRow] = await db
      .select({
        totalCostValue: sql<string>`coalesce(sum(${stockLevels.stock} * ${products.costPrice}), 0)::text`,
        totalRetailValue: sql<string>`coalesce(sum(${stockLevels.stock} * coalesce(${stockLevels.priceOverride}, ${products.salePrice})), 0)::text`,
        totalStockUnits: sql<number>`coalesce(sum(${stockLevels.stock}), 0)::int`,
        productCount: sql<number>`count(distinct ${products.id})::int`,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(whereClause);

    const totalCostValue = parseFloat(overallRow?.totalCostValue || "0");
    const totalRetailValue = parseFloat(overallRow?.totalRetailValue || "0");
    const potentialMarginValue = totalRetailValue - totalCostValue;
    const potentialMarginPercent = totalRetailValue > 0 ? (potentialMarginValue / totalRetailValue) * 100 : 0;
    const totalStockUnits = overallRow?.totalStockUnits || 0;
    const productCount = overallRow?.productCount || 0;

    // 2. Category Breakdown
    const categoryRows = await db
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

    const categoryBreakdown = categoryRows.map((c) => {
      const cost = parseFloat(c.costValue || "0");
      const retail = parseFloat(c.retailValue || "0");
      const margin = retail - cost;
      const marginPercent = retail > 0 ? (margin / retail) * 100 : 0;
      return {
        category: c.category,
        stockUnits: c.stockUnits,
        costValue: cost,
        retailValue: retail,
        marginPercent: Math.round(marginPercent * 10) / 10,
        productCount: c.productCount,
      };
    });

    res.json({
      success: true,
      valuation: {
        overall: {
          totalCostValue,
          totalRetailValue,
          potentialMarginValue,
          potentialMarginPercent: Math.round(potentialMarginPercent * 10) / 10,
          totalStockUnits,
          productCount,
        },
        categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Inventory valuation report error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch inventory valuation" });
  }
});

/**
 * 5. GET /api/financial-reports/vat-return
 * VAT Return Summary: Box 1 (Output VAT on sales), Box 9 (Input VAT recoverable on purchases),
 * Box 12 (Net VAT due or refundable), TRN, and FTA compliance data.
 * Strictly scoped to session tenantId.
 */
router.get("/vat-return", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { startDate, endDate, branchId } = req.query;
    const { sDate, eDate } = parseDateRange(startDate, endDate);

    // Fetch tenant settings & business profile
    const [tenantRec] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);

    const trn = settings?.taxRegistrationNumber || "Not Configured";
    const vatRate = settings?.vatRate ? parseFloat(settings.vatRate) : 5.00;
    const vatInclusive = settings ? settings.vatInclusive : true;
    const tenantName = tenantRec?.name || "Tenant Business";

    // 1. Output VAT (Box 1: Completed Sales)
    const orderConditions = [
      eq(orders.tenantId, tenantId),
      eq(orders.status, "completed"),
      gte(orders.createdAt, sDate),
      lte(orders.createdAt, eDate),
    ];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      orderConditions.push(eq(orders.branchId, branchId));
    }

    const [outputRow] = await db
      .select({
        salesCount: sql<number>`count(${orders.id})::int`,
        netSalesExVat: sql<string>`coalesce(sum(${orders.subtotal}), 0)::text`,
        outputVat: sql<string>`coalesce(sum(${orders.vat}), 0)::text`,
        totalSalesIncVat: sql<string>`coalesce(sum(${orders.total}), 0)::text`,
      })
      .from(orders)
      .where(and(...orderConditions));

    const salesCount = outputRow?.salesCount || 0;
    const netSalesExVat = parseFloat(outputRow?.netSalesExVat || "0");
    const outputVat = parseFloat(outputRow?.outputVat || "0");
    const totalSalesIncVat = parseFloat(outputRow?.totalSalesIncVat || "0");

    // 2. Input VAT (Box 9: Vendor Invoices / Purchases)
    const invoiceConditions = [
      eq(vendorInvoices.tenantId, tenantId),
      gte(vendorInvoices.createdAt, sDate),
      lte(vendorInvoices.createdAt, eDate),
    ];

    let inputQuery = db
      .select({
        purchaseCount: sql<number>`count(${vendorInvoices.id})::int`,
        totalPurchasesIncVat: sql<string>`coalesce(sum(${vendorInvoices.total}), 0)::text`,
      })
      .from(vendorInvoices);

    if (branchId && typeof branchId === "string" && branchId !== "all") {
      inputQuery = inputQuery
        .innerJoin(purchaseOrders, eq(vendorInvoices.purchaseOrderId, purchaseOrders.id))
        .where(and(...invoiceConditions, eq(purchaseOrders.branchId, branchId))) as any;
    } else {
      inputQuery = inputQuery.where(and(...invoiceConditions)) as any;
    }

    const [inputRow] = await inputQuery;

    const purchaseCount = inputRow?.purchaseCount || 0;
    const totalPurchasesIncVat = parseFloat(inputRow?.totalPurchasesIncVat || "0");
    const netPurchasesExVat = vatInclusive
      ? Math.round((totalPurchasesIncVat / (1 + vatRate / 100)) * 100) / 100
      : totalPurchasesIncVat;
    const inputVat = vatInclusive
      ? Math.round((totalPurchasesIncVat - netPurchasesExVat) * 100) / 100
      : Math.round((totalPurchasesIncVat * (vatRate / 100)) * 100) / 100;

    // 3. Box 12: Net VAT Due (Output - Input)
    const netVatDue = Math.round((outputVat - inputVat) * 100) / 100;
    const isPayable = netVatDue >= 0;

    res.json({
      success: true,
      vatReturn: {
        outputVat: {
          salesCount,
          netSalesExVat,
          outputVat,
          totalSalesIncVat,
        },
        inputVat: {
          purchaseCount,
          netPurchasesExVat,
          inputVat,
          totalPurchasesIncVat,
        },
        netVatDue: Math.round(netVatDue * 100) / 100,
        isPayable,
        trn,
        vatRate,
        vatInclusive,
        tenantName,
      },
    });
  } catch (error: any) {
    console.error("VAT return summary report error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch VAT return summary" });
  }
});

export default router;
