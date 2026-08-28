import { r as createServerFn } from "./server-DrMPL4gN.mjs";
import { r as getSessionServerFn } from "./auth-server-Cm_FskrZ.mjs";
import { a as eq, i as and, r as desc, s as gte, u as lt, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { A as tenantSettings, E as staffUsers, I as vendors, L as createServerRpc, O as stockLevels, S as purchaseOrders, f as orderItems, i as branches, m as orders, r as batches, t as db, y as products } from "./db-DPJpDhh1.mjs";
import { t as logAuditAction } from "./audit-logger-C-IaIwVw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-server-Cr56RNtE.js
async function getHeadOfficeTenant() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Head Office Admin") throw new Error("Unauthorized");
	return res.session.tenantId;
}
var parseDateRange = (startDate, endDate) => {
	const sDate = new Date(startDate);
	const eDate = new Date(endDate);
	if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) throw new Error("Invalid date format");
	if (sDate >= eDate) throw new Error("Start date must be strictly before end date");
	return {
		sDate,
		eDate
	};
};
var buildOrdersWhere = (tenantId, sDate, eDate, branchId) => {
	const conditions = [
		eq(orders.tenantId, tenantId),
		eq(orders.status, "completed"),
		gte(orders.createdAt, sDate),
		lt(orders.createdAt, eDate)
	];
	if (branchId) conditions.push(eq(orders.branchId, branchId));
	return and(...conditions);
};
var getSalesSummaryReportFn_createServerFn_handler = createServerRpc({
	id: "ed1879e870eca2e0baff3e4940ec3378c1ca34b2523408a6f44e1b8424f9adf0",
	name: "getSalesSummaryReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getSalesSummaryReportFn.__executeServer(opts));
var getSalesSummaryReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getSalesSummaryReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);
	const stats = (await db.select({
		orderCount: sql`count(${orders.id})`,
		netSales: sql`sum(${orders.subtotal})`,
		vatAmount: sql`sum(${orders.vat})`,
		totalSales: sql`sum(${orders.total})`
	}).from(orders).where(whereClause))[0];
	const orderCount = Number(stats?.orderCount || 0);
	const netSales = Number(stats?.netSales || 0);
	const vatAmount = Number(stats?.vatAmount || 0);
	const totalSales = Number(stats?.totalSales || 0);
	const averageOrderValue = orderCount > 0 ? (totalSales / orderCount).toFixed(2) : "0.00";
	await logAuditAction({
		action: "Generated Sales Summary Report",
		entityType: "Report",
		entityId: "SalesSummary",
		summary: `Generated Sales Summary Report from ${data.startDate} to ${data.endDate}`
	});
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
var getBranchSalesReportFn_createServerFn_handler = createServerRpc({
	id: "f5addc031bb269afe1ffd8c8ee7cf1273714a75bb87760cf4f6cd5d504594252",
	name: "getBranchSalesReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getBranchSalesReportFn.__executeServer(opts));
var getBranchSalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getBranchSalesReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const results = await db.select({
		branchId: orders.branchId,
		branchName: branches.name,
		orderCount: sql`count(${orders.id})`,
		netSales: sql`sum(${orders.subtotal})`,
		vatAmount: sql`sum(${orders.vat})`,
		totalSales: sql`sum(${orders.total})`
	}).from(orders).innerJoin(branches, eq(orders.branchId, branches.id)).where(buildOrdersWhere(tenantId, sDate, eDate)).groupBy(orders.branchId, branches.name).orderBy(desc(sql`sum(${orders.total})`));
	await logAuditAction({
		action: "Generated Branch Sales Report",
		entityType: "Report",
		entityId: "BranchSales",
		summary: `Generated Branch Sales Report from ${data.startDate} to ${data.endDate}`
	});
	return {
		success: true,
		data: results
	};
});
var getProductSalesReportFn_createServerFn_handler = createServerRpc({
	id: "4eb07c7716f722095f34d9359f49637e406c1b68ec4fd87a180a196e62dbd533",
	name: "getProductSalesReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getProductSalesReportFn.__executeServer(opts));
var getProductSalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getProductSalesReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);
	const results = await db.select({
		productId: orderItems.productId,
		productName: products.name,
		barcode: products.barcode,
		quantitySold: sql`sum(${orderItems.qty})`,
		grossSales: sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`
	}).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(products, eq(orderItems.productId, products.id)).where(whereClause).groupBy(orderItems.productId, products.name, products.barcode).orderBy(desc(sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`));
	await logAuditAction({
		action: "Generated Product Sales Report",
		entityType: "Report",
		entityId: "ProductSales",
		summary: `Generated Product Sales Report from ${data.startDate} to ${data.endDate}`
	});
	return {
		success: true,
		data: results
	};
});
var getCategorySalesReportFn_createServerFn_handler = createServerRpc({
	id: "9d2d54b040273b21ada15e1d168a56a953f34dfd1e3a324a4a4b9e57e5e3b6d3",
	name: "getCategorySalesReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getCategorySalesReportFn.__executeServer(opts));
var getCategorySalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getCategorySalesReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);
	const results = await db.select({
		category: products.category,
		quantitySold: sql`sum(${orderItems.qty})`,
		orderLineCount: sql`count(${orderItems.id})`,
		grossSales: sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`
	}).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(products, eq(orderItems.productId, products.id)).where(whereClause).groupBy(products.category).orderBy(desc(sql`sum(${orderItems.qty} * ${orderItems.unitPrice})`));
	await logAuditAction({
		action: "Generated Category Sales Report",
		entityType: "Report",
		entityId: "CategorySales",
		summary: `Generated Category Sales Report from ${data.startDate} to ${data.endDate}`
	});
	return {
		success: true,
		data: results
	};
});
var getCashierSalesReportFn_createServerFn_handler = createServerRpc({
	id: "0a9ed05516c2beac1016df848ec593e291a0ea14a760dfb8e35678cb8c32d353",
	name: "getCashierSalesReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getCashierSalesReportFn.__executeServer(opts));
var getCashierSalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getCashierSalesReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const whereClause = buildOrdersWhere(tenantId, sDate, eDate, data.branchId);
	const results = await db.select({
		cashierId: orders.cashierId,
		cashierName: staffUsers.name,
		orderCount: sql`count(${orders.id})`,
		netSales: sql`sum(${orders.subtotal})`,
		vatAmount: sql`sum(${orders.vat})`,
		totalSales: sql`sum(${orders.total})`
	}).from(orders).leftJoin(staffUsers, eq(orders.cashierId, staffUsers.id)).where(whereClause).groupBy(orders.cashierId, staffUsers.name).orderBy(desc(sql`sum(${orders.total})`));
	await logAuditAction({
		action: "Generated Cashier Sales Report",
		entityType: "Report",
		entityId: "CashierSales",
		summary: `Generated Cashier Sales Report from ${data.startDate} to ${data.endDate}`
	});
	return {
		success: true,
		data: results
	};
});
var getInventoryValuationReportFn_createServerFn_handler = createServerRpc({
	id: "3c17d20decc1659eeedaa41a740fc65c00fb550755956ce54fdf3b08cf8e8dac",
	name: "getInventoryValuationReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getInventoryValuationReportFn.__executeServer(opts));
var getInventoryValuationReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getInventoryValuationReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const conditions = [eq(products.tenantId, tenantId)];
	if (data.branchId) conditions.push(eq(stockLevels.branchId, data.branchId));
	const results = await db.select({
		branchName: branches.name,
		productName: products.name,
		quantity: stockLevels.stock,
		unitCost: products.costPrice,
		totalCostValue: sql`(${stockLevels.stock} * ${products.costPrice})`
	}).from(stockLevels).innerJoin(products, eq(stockLevels.productId, products.id)).innerJoin(branches, eq(stockLevels.branchId, branches.id)).where(and(...conditions)).orderBy(branches.name, products.name);
	await logAuditAction({
		action: "Generated Inventory Valuation Report",
		entityType: "Report",
		entityId: "InventoryValuation",
		summary: `Generated Inventory Valuation Report`
	});
	return {
		success: true,
		data: results
	};
});
var getLowStockReportFn_createServerFn_handler = createServerRpc({
	id: "11863964c60ea47bdb8a72de230c68b71532b93c94cd24f0cdfdb8d9f9af7344",
	name: "getLowStockReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getLowStockReportFn.__executeServer(opts));
var getLowStockReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getLowStockReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const conditions = [eq(products.tenantId, tenantId), sql`${stockLevels.stock} < ${stockLevels.reorderLevel}`];
	if (data.branchId) conditions.push(eq(stockLevels.branchId, data.branchId));
	const results = await db.select({
		branchName: branches.name,
		productName: products.name,
		currentQuantity: stockLevels.stock,
		threshold: stockLevels.reorderLevel,
		shortage: sql`(${stockLevels.reorderLevel} - ${stockLevels.stock})`
	}).from(stockLevels).innerJoin(products, eq(stockLevels.productId, products.id)).innerJoin(branches, eq(stockLevels.branchId, branches.id)).where(and(...conditions)).orderBy(sql`(${stockLevels.reorderLevel} - ${stockLevels.stock}) DESC`);
	await logAuditAction({
		action: "Generated Low Stock Report",
		entityType: "Report",
		entityId: "LowStock",
		summary: `Generated Low Stock Report`
	});
	return {
		success: true,
		data: results
	};
});
var getExpiryReportFn_createServerFn_handler = createServerRpc({
	id: "1597975d68b12a1734ea0160162e3b540e09831d31f809625ed4e855f89445d0",
	name: "getExpiryReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getExpiryReportFn.__executeServer(opts));
var getExpiryReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getExpiryReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const thresholdDate = /* @__PURE__ */ new Date();
	thresholdDate.setDate(thresholdDate.getDate() + data.daysThreshold);
	const conditions = [
		eq(batches.tenantId, tenantId),
		lt(batches.expiryDate, thresholdDate),
		gte(batches.stock, 1)
	];
	if (data.branchId) conditions.push(eq(batches.branchId, data.branchId));
	const results = await db.select({
		branchName: branches.name,
		productName: products.name,
		batchNumber: batches.batchNumber,
		quantity: batches.stock,
		expiryDate: batches.expiryDate,
		daysRemaining: sql`EXTRACT(DAY FROM (${batches.expiryDate} - NOW()))`
	}).from(batches).innerJoin(products, eq(batches.productId, products.id)).leftJoin(branches, eq(batches.branchId, branches.id)).where(and(...conditions)).orderBy(batches.expiryDate);
	await logAuditAction({
		action: "Generated Expiry Report",
		entityType: "Report",
		entityId: "ExpiryReport",
		summary: `Generated Expiry Report for next ${data.daysThreshold} days`
	});
	return {
		success: true,
		data: results
	};
});
var getPurchaseReportFn_createServerFn_handler = createServerRpc({
	id: "dbf75f03c880457a38dd40db164c224a01fdf55726119654a9a3fa3aa7d5623c",
	name: "getPurchaseReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getPurchaseReportFn.__executeServer(opts));
var getPurchaseReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getPurchaseReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const conditions = [
		eq(purchaseOrders.tenantId, tenantId),
		gte(purchaseOrders.createdAt, sDate),
		lt(purchaseOrders.createdAt, eDate)
	];
	if (data.branchId) conditions.push(eq(purchaseOrders.branchId, data.branchId));
	const results = await db.select({
		poId: purchaseOrders.id,
		vendorName: vendors.name,
		branchName: branches.name,
		poDate: purchaseOrders.createdAt,
		status: purchaseOrders.status,
		totalAmount: purchaseOrders.total
	}).from(purchaseOrders).innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id)).leftJoin(branches, eq(purchaseOrders.branchId, branches.id)).where(and(...conditions)).orderBy(desc(purchaseOrders.createdAt));
	await logAuditAction({
		action: "Generated Purchase Report",
		entityType: "Report",
		entityId: "PurchaseReport",
		summary: `Generated Purchase Report from ${data.startDate} to ${data.endDate}`
	});
	return {
		success: true,
		data: results
	};
});
var getVendorReportFn_createServerFn_handler = createServerRpc({
	id: "d5a281885a2ebf18a8bff4e3f79303b7a0a0c35fd8a3e0c4d5fb83cc2efaa00f",
	name: "getVendorReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getVendorReportFn.__executeServer(opts));
var getVendorReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getVendorReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const conditions = [
		eq(purchaseOrders.tenantId, tenantId),
		gte(purchaseOrders.createdAt, sDate),
		lt(purchaseOrders.createdAt, eDate)
	];
	const results = await db.select({
		vendorName: vendors.name,
		purchaseCount: sql`count(${purchaseOrders.id})`,
		totalPurchaseValue: sql`sum(${purchaseOrders.total})`
	}).from(purchaseOrders).innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id)).where(and(...conditions)).groupBy(vendors.name).orderBy(desc(sql`sum(${purchaseOrders.total})`));
	await logAuditAction({
		action: "Generated Vendor Report",
		entityType: "Report",
		entityId: "VendorReport",
		summary: `Generated Vendor Report from ${data.startDate} to ${data.endDate}`
	});
	return {
		success: true,
		data: results
	};
});
var getVatSummaryReportFn_createServerFn_handler = createServerRpc({
	id: "2343d3542a9aa6287410998e7c5334591d9e50a6ac5ff35a38740222cef8801b",
	name: "getVatSummaryReportFn",
	filename: "src/lib/reports-server.ts"
}, (opts) => getVatSummaryReportFn.__executeServer(opts));
var getVatSummaryReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getVatSummaryReportFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const { sDate, eDate } = parseDateRange(data.startDate, data.endDate);
	const whereClause = buildOrdersWhere(tenantId, sDate, eDate);
	const trn = (await db.select({ trn: tenantSettings.taxRegistrationNumber }).from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1))[0]?.trn || "Not Configured";
	const stats = (await db.select({
		taxableOrdersCount: sql`count(${orders.id})`,
		salesExVat: sql`sum(${orders.subtotal})`,
		vatAmount: sql`sum(${orders.vat})`,
		salesIncVat: sql`sum(${orders.total})`
	}).from(orders).where(whereClause))[0];
	const taxableOrdersCount = Number(stats?.taxableOrdersCount || 0);
	const salesExVat = Number(stats?.salesExVat || 0).toFixed(2);
	const vatAmount = Number(stats?.vatAmount || 0).toFixed(2);
	const salesIncVat = Number(stats?.salesIncVat || 0).toFixed(2);
	await logAuditAction({
		action: "Generated VAT Report",
		entityType: "Report",
		entityId: "VatSummary",
		summary: `Generated VAT Summary Report from ${data.startDate} to ${data.endDate}`
	});
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
			standardRatedSales: salesExVat,
			notes: "Historical stored VAT values used. Mixed tax categories are not fully separated in the schema. This represents aggregate VAT as captured at checkout."
		}
	};
});
//#endregion
export { getBranchSalesReportFn_createServerFn_handler, getCashierSalesReportFn_createServerFn_handler, getCategorySalesReportFn_createServerFn_handler, getExpiryReportFn_createServerFn_handler, getInventoryValuationReportFn_createServerFn_handler, getLowStockReportFn_createServerFn_handler, getProductSalesReportFn_createServerFn_handler, getPurchaseReportFn_createServerFn_handler, getSalesSummaryReportFn_createServerFn_handler, getVatSummaryReportFn_createServerFn_handler, getVendorReportFn_createServerFn_handler };
