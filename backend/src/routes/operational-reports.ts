import { Router } from "express";
import { db } from "../db/index.js";
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
  tenantSettings,
} from "../db/schema.js";
import { eq, and, sql, gte, lt, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Middleware: All operational report endpoints require authenticated session
router.use(requireAuth);

/**
 * Helper to resolve and validate the session tenant ID.
 * Strictly derives tenantId from the JWT session to prevent cross-tenant data leakage.
 */
function resolveTenantId(req: AuthRequest): { tenantId: string | null; isAll: boolean } {
  const user = req.user;
  if (!user) return { tenantId: null, isAll: false };

  // Super Admin can select a specific tenantId or "all"
  if (user.role === "super_admin") {
    if (!req.query.tenantId || req.query.tenantId === "all") {
      return { tenantId: null, isAll: true };
    }
    return { tenantId: req.query.tenantId as string, isAll: false };
  }

  // Head Office Admin (and any non-super_admin) ALWAYS uses their session tenantId
  return { tenantId: user.tenantId || null, isAll: false };
}

/**
 * Helper to parse and normalize date boundaries into UTC full-day spans.
 */
function parseDateRange(startDateQuery?: any, endDateQuery?: any) {
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
 * Helper to build where clause for orders table
 */
function buildOrdersWhere(
  tenantCtx: { tenantId: string | null; isAll: boolean },
  sDate: Date,
  eDate: Date,
  branchId?: string
) {
  const conditions = [
    eq(orders.status, "completed"),
    gte(orders.createdAt, sDate),
    lt(orders.createdAt, eDate),
  ];
  if (!tenantCtx.isAll && tenantCtx.tenantId) {
    conditions.push(eq(orders.tenantId, tenantCtx.tenantId));
  }
  if (branchId && branchId !== "all") {
    conditions.push(eq(orders.branchId, branchId));
  }
  return and(...conditions);
}

// 1. GET /api/operational-reports/sales-summary
router.get("/sales-summary", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, branchId);

    const result = await db
      .select({
        orderCount: sql<number>`count(${orders.id})`,
        netSales: sql<number>`sum(${orders.subtotal})`,
        vatAmount: sql<number>`sum(${orders.vat})`,
        totalSales: sql<number>`sum(${orders.total})`,
      })
      .from(orders)
      .where(whereClause);

    const stats = result[0];
    const orderCount = Number(stats?.orderCount || 0);
    const netSales = Number(stats?.netSales || 0);
    const vatAmount = Number(stats?.vatAmount || 0);
    const totalSales = Number(stats?.totalSales || 0);
    const averageOrderValue = orderCount > 0 ? (totalSales / orderCount).toFixed(2) : "0.00";

    return res.json({
      success: true,
      data: {
        scope: tenantCtx.isAll ? "Platform-Wide (All Tenants)" : "Single Tenant",
        orderCount,
        netSales: netSales.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalSales: totalSales.toFixed(2),
        averageOrderValue,
      },
    });
  } catch (error: any) {
    console.error("Error generating sales-summary report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate sales summary report" });
  }
});

// 2. GET /api/operational-reports/branch-sales
router.get("/branch-sales", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating branch-sales report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate branch sales report" });
  }
});

// 3. GET /api/operational-reports/product-sales
router.get("/product-sales", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, branchId);

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating product-sales report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate product sales report" });
  }
});

// 4. GET /api/operational-reports/category-sales
router.get("/category-sales", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, branchId);

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating category-sales report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate category sales report" });
  }
});

// 5. GET /api/operational-reports/cashier-sales
router.get("/cashier-sales", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate, branchId);

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating cashier-sales report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate cashier sales report" });
  }
});

// 6. GET /api/operational-reports/inventory-valuation
router.get("/inventory-valuation", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const conditions = [];
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (branchId && branchId !== "all") {
      conditions.push(eq(stockLevels.branchId, branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating inventory-valuation report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate inventory valuation report" });
  }
});

// 7. GET /api/operational-reports/low-stock
router.get("/low-stock", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const conditions = [sql`${stockLevels.stock} < ${stockLevels.reorderLevel}`];

    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (branchId && branchId !== "all") {
      conditions.push(eq(stockLevels.branchId, branchId));
    }

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating low-stock report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate low stock report" });
  }
});

// 8. GET /api/operational-reports/expiry
router.get("/expiry", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const daysThreshold = parseInt((req.query.daysThreshold as string) || "30", 10);
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + (isNaN(daysThreshold) ? 30 : daysThreshold));

    const conditions = [lt(batches.expiryDate, thresholdDate), gte(batches.stock, 1)];

    // batches does not have tenantId directly; products table has tenantId
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(products.tenantId, tenantCtx.tenantId));
    }
    if (branchId && branchId !== "all") {
      conditions.push(eq(batches.branchId, branchId));
    }

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating expiry report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate expiry report" });
  }
});

// 9. GET /api/operational-reports/purchase
router.get("/purchase", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;

    const conditions = [gte(purchaseOrders.createdAt, sDate), lt(purchaseOrders.createdAt, eDate)];

    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(purchaseOrders.tenantId, tenantCtx.tenantId));
    }
    if (branchId && branchId !== "all") {
      conditions.push(eq(purchaseOrders.branchId, branchId));
    }

    const results = await db
      .select({
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

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating purchase report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate purchase report" });
  }
});

// 10. GET /api/operational-reports/vendor
router.get("/vendor", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);

    const conditions = [gte(purchaseOrders.createdAt, sDate), lt(purchaseOrders.createdAt, eDate)];

    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      conditions.push(eq(purchaseOrders.tenantId, tenantCtx.tenantId));
    }

    const results = await db
      .select({
        vendorName: vendors.name,
        purchaseCount: sql<number>`count(${purchaseOrders.id})`,
        totalPurchaseValue: sql<number>`sum(${purchaseOrders.total})`,
      })
      .from(purchaseOrders)
      .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(and(...conditions))
      .groupBy(vendors.name)
      .orderBy(desc(sql`sum(${purchaseOrders.total})`));

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error generating vendor report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate vendor report" });
  }
});

// 11. GET /api/operational-reports/vat-summary
router.get("/vat-summary", async (req: AuthRequest, res) => {
  try {
    const tenantCtx = resolveTenantId(req);
    if (!tenantCtx.isAll && !tenantCtx.tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { sDate, eDate } = parseDateRange(req.query.startDate, req.query.endDate);
    const whereClause = buildOrdersWhere(tenantCtx, sDate, eDate);

    let trn = "Platform Aggregate";
    if (!tenantCtx.isAll && tenantCtx.tenantId) {
      const settings = await db
        .select({ trn: tenantSettings.taxRegistrationNumber })
        .from(tenantSettings)
        .where(eq(tenantSettings.tenantId, tenantCtx.tenantId))
        .limit(1);
      trn = settings[0]?.trn || "Not Configured";
    }

    const result = await db
      .select({
        taxableOrdersCount: sql<number>`count(${orders.id})`,
        salesExVat: sql<number>`sum(${orders.subtotal})`,
        vatAmount: sql<number>`sum(${orders.vat})`,
        salesIncVat: sql<number>`sum(${orders.total})`,
      })
      .from(orders)
      .where(whereClause);

    const stats = result[0];
    const taxableOrdersCount = Number(stats?.taxableOrdersCount || 0);
    const salesExVat = Number(stats?.salesExVat || 0).toFixed(2);
    const vatAmount = Number(stats?.vatAmount || 0).toFixed(2);
    const salesIncVat = Number(stats?.salesIncVat || 0).toFixed(2);

    return res.json({
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
        notes:
          "Historical stored VAT values used. Mixed tax categories are not fully separated in the schema. This represents aggregate VAT as captured at checkout.",
      },
    });
  } catch (error: any) {
    console.error("Error generating vat-summary report:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate VAT summary report" });
  }
});

export default router;
