import { r as createServerFn } from "./server-po8kJpue.mjs";
import { r as getSessionServerFn } from "./auth-server-Cg0hQhNk.mjs";
import { a as eq, i as and, l as inArray, p as or, r as desc, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { A as tenantSettings, D as stockAdjustments, I as vendors, L as createServerRpc, O as stockLevels, S as purchaseOrders, b as promotions, i as branches, j as tenants, k as stockTransfers, l as inventoryLedger, r as batches, t as db, x as purchaseOrderItems, y as products } from "./db-DMcWZUf-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventory-manager-server-By_O_KK7.js
async function getInventoryManagerContext() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session) throw new Error("Unauthorized");
	const role = res.session.role;
	if (role !== "Inventory Manager" && role !== "Head Office Admin" && role !== "Super Admin") throw new Error("Unauthorized");
	const tenantId = res.session.tenantId;
	let branchScope = null;
	if (role === "Inventory Manager") {
		if (!res.session.branchId) throw new Error("No branch is assigned to this user.");
		branchScope = [res.session.branchId];
	}
	return {
		tenantId,
		role,
		branchScope
	};
}
var getInventoryDataServerFn_createServerFn_handler = createServerRpc({
	id: "8b297686b7e2fe356e3c6110f7b1a3df8dd133899e2817930dae89e616f8f6af",
	name: "getInventoryDataServerFn",
	filename: "src/lib/inventory-manager-server.ts"
}, (opts) => getInventoryDataServerFn.__executeServer(opts));
var getInventoryDataServerFn = createServerFn({ method: "GET" }).handler(getInventoryDataServerFn_createServerFn_handler, async () => {
	const { tenantId, branchScope, role } = await getInventoryManagerContext();
	const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
	let branchWhere = eq(branches.tenantId, tenantId);
	if (branchScope) branchWhere = and(eq(branches.tenantId, tenantId), inArray(branches.id, branchScope));
	const allBranches = await db.query.branches.findMany({ where: branchWhere });
	const allTenantBranches = await db.query.branches.findMany({ where: eq(branches.tenantId, tenantId) });
	let allVendors = [];
	try {
		allVendors = await db.select().from(vendors).where(and(eq(vendors.tenantId, tenantId), eq(vendors.status, "Active")));
	} catch (e) {
		console.warn("Table vendors might not exist yet:", e);
	}
	let allStockLevels = [];
	try {
		allStockLevels = await db.select({
			id: stockLevels.id,
			stock: stockLevels.stock,
			reorderLevel: stockLevels.reorderLevel,
			branchId: stockLevels.branchId,
			branchName: branches.name,
			productId: products.id,
			productName: products.name,
			sku: products.barcode,
			barcode: products.barcode,
			category: products.category,
			unit: products.unit
		}).from(stockLevels).innerJoin(products, eq(stockLevels.productId, products.id)).innerJoin(branches, eq(stockLevels.branchId, branches.id)).where(branchScope ? and(eq(products.tenantId, tenantId), inArray(stockLevels.branchId, branchScope)) : eq(products.tenantId, tenantId));
	} catch (e) {
		console.warn("Table stockLevels might not exist yet:", e);
	}
	let allBatches = [];
	try {
		allBatches = await db.select({
			id: batches.id,
			batchNumber: batches.batchNumber,
			expiryDate: batches.expiryDate,
			stock: batches.stock,
			productId: products.id,
			productName: products.name,
			sku: products.barcode,
			branchId: batches.branchId,
			branchName: branches.name
		}).from(batches).innerJoin(products, eq(batches.productId, products.id)).leftJoin(branches, eq(batches.branchId, branches.id)).where(branchScope ? and(eq(products.tenantId, tenantId), inArray(batches.branchId, branchScope)) : eq(products.tenantId, tenantId)).orderBy(batches.expiryDate);
	} catch (e) {
		console.warn("Table batches might not exist yet:", e);
	}
	allStockLevels.length;
	const lowStockItems = allStockLevels.filter((s) => s.stock <= s.reorderLevel);
	const now = /* @__PURE__ */ new Date();
	const thirtyDaysFromNow = /* @__PURE__ */ new Date();
	thirtyDaysFromNow.setDate(now.getDate() + 30);
	const expiredBatches = allBatches.filter((b) => b.expiryDate && new Date(b.expiryDate) <= now && b.stock > 0);
	const nearExpiryBatches = allBatches.filter((b) => b.expiryDate && new Date(b.expiryDate) > now && new Date(b.expiryDate) <= thirtyDaysFromNow && b.stock > 0);
	let rawTransfers = [];
	try {
		let transfersWhere = eq(stockTransfers.tenantId, tenantId);
		if (branchScope) transfersWhere = and(eq(stockTransfers.tenantId, tenantId), or(inArray(stockTransfers.sourceBranchId, branchScope), inArray(stockTransfers.destinationBranchId, branchScope)));
		rawTransfers = await db.select().from(stockTransfers).where(transfersWhere).orderBy(desc(stockTransfers.createdAt)).limit(50);
	} catch (e) {
		console.warn("Table stock_transfers might not exist yet:", e);
	}
	const allTransfers = rawTransfers.map((t) => {
		const product = allStockLevels.find((s) => s.productId === t.productId) || {
			productName: "Unknown",
			sku: ""
		};
		const source = allTenantBranches.find((b) => b.id === t.sourceBranchId);
		const target = allTenantBranches.find((b) => b.id === t.destinationBranchId);
		return {
			...t,
			productName: product.productName,
			sku: product.sku,
			sourceBranchName: source?.name || "Unknown",
			destinationBranchName: target?.name || "Unknown"
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
		allowPoDraft: false,
		stats: {
			totalSkus: Array.from(new Set(allStockLevels.map((s) => s.productId))).length,
			lowStockCount: lowStockItems.length,
			expiredCount: expiredBatches.length,
			nearExpiryCount: nearExpiryBatches.length
		},
		alerts: {
			lowStock: lowStockItems,
			expired: expiredBatches,
			nearExpiry: nearExpiryBatches
		}
	};
	try {
		const settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });
		if (settings && "allowInventoryManagerPoDraft" in settings) result.allowPoDraft = !!settings.allowInventoryManagerPoDraft;
	} catch (e) {
		console.warn("Could not fetch tenant settings for PO draft permission:", e);
	}
	return JSON.parse(JSON.stringify(result));
});
var stockTransferServerFn_createServerFn_handler = createServerRpc({
	id: "1e07366c04d5681558e747d576297797712ae573c4a19e220e82ff629af664ef",
	name: "stockTransferServerFn",
	filename: "src/lib/inventory-manager-server.ts"
}, (opts) => stockTransferServerFn.__executeServer(opts));
var stockTransferServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(stockTransferServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchScope } = await getInventoryManagerContext();
	if (!data.sourceBranchId) throw new Error("Source branch is required");
	if (!data.targetBranchId) throw new Error("Destination branch is required");
	if (data.sourceBranchId === data.targetBranchId) throw new Error("Source and destination must be different");
	if (!data.quantity || data.quantity <= 0) throw new Error("Quantity must be a positive number greater than 0");
	if (branchScope) {
		const hasSourceAccess = branchScope.includes(data.sourceBranchId);
		const hasTargetAccess = branchScope.includes(data.targetBranchId);
		if (!hasSourceAccess && !hasTargetAccess) throw new Error("Forbidden: You do not have permission to transfer between these branches");
	}
	await db.transaction(async (tx) => {
		if ((await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.tenantId, tenantId), inArray(branches.id, [data.sourceBranchId, data.targetBranchId])))).length !== 2) throw new Error("Unauthorized or invalid branches");
		const sourceStock = await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.sourceBranchId))).limit(1);
		if (sourceStock.length === 0 || sourceStock[0].stock < data.quantity) throw new Error("Insufficient stock in source branch");
		await tx.update(stockLevels).set({ stock: sql`${stockLevels.stock} - ${data.quantity}` }).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.sourceBranchId)));
		if ((await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.targetBranchId))).limit(1)).length > 0) await tx.update(stockLevels).set({ stock: sql`${stockLevels.stock} + ${data.quantity}` }).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.targetBranchId)));
		else await tx.insert(stockLevels).values({
			productId: data.productId,
			branchId: data.targetBranchId,
			stock: data.quantity,
			reorderLevel: 10
		});
		await tx.insert(stockTransfers).values({
			tenantId,
			productId: data.productId,
			sourceBranchId: data.sourceBranchId,
			destinationBranchId: data.targetBranchId,
			quantity: data.quantity,
			status: "Completed"
		});
	});
	return { success: true };
});
var draftPurchaseOrderServerFn_createServerFn_handler = createServerRpc({
	id: "05fb876ebc68d1013b55b9ff627c81ac5c1c92a9cd28e6f79a7d8dd2e2c6e08e",
	name: "draftPurchaseOrderServerFn",
	filename: "src/lib/inventory-manager-server.ts"
}, (opts) => draftPurchaseOrderServerFn.__executeServer(opts));
var draftPurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(draftPurchaseOrderServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchScope } = await getInventoryManagerContext();
	if (branchScope && !branchScope.includes(data.branchId)) throw new Error("Forbidden: You do not have permission to draft PO for this branch.");
	const settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });
	if (!settings || !("allowInventoryManagerPoDraft" in settings) || !settings.allowInventoryManagerPoDraft) throw new Error("Unauthorized: PO Draft creation is disabled for Inventory Managers.");
	if (!data.vendorId || !data.branchId || !data.productId || !data.qty || data.qty <= 0) throw new Error("Invalid PO Draft data");
	const product = await db.query.products.findFirst({ where: and(eq(products.id, data.productId), eq(products.tenantId, tenantId)) });
	if (!product) throw new Error("Product not found");
	const unitPrice = Number(product.costPrice) || 0;
	const subtotal = data.qty * unitPrice;
	const vatRate = 5;
	const vatAmount = subtotal * (vatRate / 100);
	const total = subtotal + vatAmount;
	let poId = "";
	await db.transaction(async (tx) => {
		const [po] = await tx.insert(purchaseOrders).values({
			tenantId,
			branchId: data.branchId,
			vendorId: data.vendorId,
			status: "Draft",
			subtotal: subtotal.toString(),
			vatRate: vatRate.toString(),
			vatAmount: vatAmount.toString(),
			total: total.toString()
		}).returning({ id: purchaseOrders.id });
		poId = po.id;
		await tx.insert(purchaseOrderItems).values({
			purchaseOrderId: po.id,
			productId: data.productId,
			qty: data.qty,
			unitPrice: unitPrice.toString()
		});
	});
	return {
		success: true,
		poId
	};
});
var applyClearanceFn_createServerFn_handler = createServerRpc({
	id: "d0164f436c2117fd47da755869698b63012c2282ef673df5f175b5c3b9c69dc1",
	name: "applyClearanceFn",
	filename: "src/lib/inventory-manager-server.ts"
}, (opts) => applyClearanceFn.__executeServer(opts));
var applyClearanceFn = createServerFn({ method: "POST" }).validator((z) => z.object({
	productId: z.string(),
	discountPct: z.number()
})).handler(applyClearanceFn_createServerFn_handler, async ({ data }) => {
	const { tenantId } = await getInventoryManagerContext();
	await db.insert(promotions).values({
		tenantId,
		name: "Clearance Sale - Near Expiry",
		discountType: "percentage",
		discountValue: data.discountPct.toString(),
		startDate: /* @__PURE__ */ new Date(),
		endDate: new Date(Date.now() + 12096e5),
		status: "Active"
	});
	return { success: true };
});
var createStockAdjustmentFn_createServerFn_handler = createServerRpc({
	id: "270a84e37623743570d34749e1646581ea7cc9fb9db1af5ff7742d2708a68c2a",
	name: "createStockAdjustmentFn",
	filename: "src/lib/inventory-manager-server.ts"
}, (opts) => createStockAdjustmentFn.__executeServer(opts));
var createStockAdjustmentFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createStockAdjustmentFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchScope, role } = await getInventoryManagerContext();
	const userId = (await getSessionServerFn()).session?.id;
	if (!userId) throw new Error("Unauthorized");
	if (!data.quantityChange) throw new Error("Quantity change cannot be zero");
	if (!data.reason) throw new Error("Reason is required");
	if (branchScope && !branchScope.includes(data.branchId)) throw new Error("Forbidden: Unauthorized branch scope");
	await db.transaction(async (tx) => {
		let previousQty = 0;
		if (data.batchId) {
			const [batch] = await tx.select().from(batches).where(and(eq(batches.id, data.batchId), eq(batches.tenantId, tenantId), eq(batches.branchId, data.branchId)));
			if (!batch) throw new Error("Batch not found");
			previousQty = batch.stock;
			const newQty = previousQty + data.quantityChange;
			if (newQty < 0) throw new Error("Cannot adjust batch stock below 0");
			await tx.update(batches).set({ stock: newQty }).where(eq(batches.id, data.batchId));
			await tx.update(stockLevels).set({ stock: sql`${stockLevels.stock} + ${data.quantityChange}` }).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)));
		} else {
			const [level] = await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)));
			if (!level) throw new Error("Stock level not found");
			previousQty = level.stock;
			const newQty = previousQty + data.quantityChange;
			if (newQty < 0) throw new Error("Cannot adjust stock below 0");
			await tx.update(stockLevels).set({ stock: newQty }).where(eq(stockLevels.id, level.id));
		}
		const [adj] = await tx.insert(stockAdjustments).values({
			tenantId,
			branchId: data.branchId,
			productId: data.productId,
			batchId: data.batchId || null,
			previousQuantity: previousQty,
			quantityChange: data.quantityChange,
			newQuantity: previousQty + data.quantityChange,
			reason: data.reason,
			adjustedBy: userId
		}).returning({ id: stockAdjustments.id });
		await tx.insert(inventoryLedger).values({
			tenantId,
			branchId: data.branchId,
			productId: data.productId,
			batchId: data.batchId || null,
			transactionType: "Adjustment",
			previousQuantity: previousQty,
			changedQuantity: data.quantityChange,
			newQuantity: previousQty + data.quantityChange,
			referenceId: adj?.id || null,
			createdBy: userId
		});
	});
	return { success: true };
});
var getInventoryLedgerFn_createServerFn_handler = createServerRpc({
	id: "1d286daf14004ee63e13a358a09107f060063302bf5963754a649bc5dc12fc43",
	name: "getInventoryLedgerFn",
	filename: "src/lib/inventory-manager-server.ts"
}, (opts) => getInventoryLedgerFn.__executeServer(opts));
var getInventoryLedgerFn = createServerFn({ method: "GET" }).handler(getInventoryLedgerFn_createServerFn_handler, async () => {
	const { tenantId, branchScope } = await getInventoryManagerContext();
	let ledgerWhere = eq(inventoryLedger.tenantId, tenantId);
	if (branchScope) ledgerWhere = and(eq(inventoryLedger.tenantId, tenantId), inArray(inventoryLedger.branchId, branchScope));
	try {
		return {
			success: true,
			ledger: await db.select({
				id: inventoryLedger.id,
				transactionType: inventoryLedger.transactionType,
				previousQuantity: inventoryLedger.previousQuantity,
				changedQuantity: inventoryLedger.changedQuantity,
				newQuantity: inventoryLedger.newQuantity,
				createdAt: inventoryLedger.createdAt,
				productName: products.name,
				branchName: branches.name,
				batchNumber: batches.batchNumber
			}).from(inventoryLedger).innerJoin(products, eq(inventoryLedger.productId, products.id)).innerJoin(branches, eq(inventoryLedger.branchId, branches.id)).leftJoin(batches, eq(inventoryLedger.batchId, batches.id)).where(ledgerWhere).orderBy(desc(inventoryLedger.createdAt)).limit(100)
		};
	} catch (e) {
		console.error("Ledger fetch error:", e);
		throw new Error("Failed to fetch inventory ledger. The database might be unavailable or pending migration.");
	}
});
//#endregion
export { applyClearanceFn_createServerFn_handler, createStockAdjustmentFn_createServerFn_handler, draftPurchaseOrderServerFn_createServerFn_handler, getInventoryDataServerFn_createServerFn_handler, getInventoryLedgerFn_createServerFn_handler, stockTransferServerFn_createServerFn_handler };
