import { r as createServerFn } from "./server-BlyqvE9x.mjs";
import { r as getSessionServerFn } from "./auth-server-CSle8uu9.mjs";
import { a as eq, i as and, r as desc, s as gte, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { C as rolePermissions, D as stockAdjustments, E as staffUsers, L as createServerRpc, M as tills, O as stockLevels, T as shifts, g as priceOverrideRequests, i as branches, j as tenants, l as inventoryLedger, m as orders, n as auditLogs, t as db, y as products } from "./db-D6V11D2M.mjs";
import * as argon2 from "argon2";
//#region node_modules/.nitro/vite/services/ssr/assets/store-manager-server-C1ES8hxS.js
async function getStoreManagerContext() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Branch Manager") throw new Error("Unauthorized");
	if (!res.session.branchId) throw new Error("No branch assigned to this manager");
	return {
		tenantId: res.session.tenantId,
		branchId: res.session.branchId,
		userId: res.session.id
	};
}
var getStoreManagerDataFn_createServerFn_handler = createServerRpc({
	id: "44bc291918d8c505d6c54f68f5abe95959f849582775f630a6285be0394f4acf",
	name: "getStoreManagerDataFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => getStoreManagerDataFn.__executeServer(opts));
var getStoreManagerDataFn = createServerFn({ method: "GET" }).handler(getStoreManagerDataFn_createServerFn_handler, async () => {
	try {
		const { tenantId, branchId } = await getStoreManagerContext();
		const branchInfo = await db.query.branches.findFirst({ where: eq(branches.id, branchId) });
		const localStock = await db.select({
			id: stockLevels.id,
			stock: stockLevels.stock,
			priceOverride: stockLevels.priceOverride,
			productId: products.id,
			productName: products.name,
			sku: products.barcode,
			barcode: products.barcode,
			category: products.category,
			unit: products.unit,
			basePrice: products.salePrice
		}).from(stockLevels).innerJoin(products, eq(stockLevels.productId, products.id)).where(eq(stockLevels.branchId, branchId));
		const recentShifts = await db.query.shifts.findMany({
			where: eq(shifts.branchId, branchId),
			with: { cashier: true },
			orderBy: [desc(shifts.openedAt)],
			limit: 20
		});
		const recentOrders = await db.query.orders.findMany({
			where: eq(orders.branchId, branchId),
			orderBy: [desc(orders.createdAt)],
			limit: 100,
			with: { items: { with: { product: true } } }
		});
		const dbRequests = await db.query.priceOverrideRequests.findMany({
			where: eq(priceOverrideRequests.branchId, branchId),
			orderBy: [desc(priceOverrideRequests.createdAt)],
			with: { product: true }
		});
		const dbStaff = await db.query.staffUsers.findMany({
			where: and(eq(staffUsers.tenantId, tenantId), eq(staffUsers.branchId, branchId)),
			columns: {
				id: true,
				name: true,
				email: true,
				role: true,
				isActive: true
			}
		});
		const dbTills = await db.query.tills.findMany({
			where: and(eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)),
			orderBy: [desc(tills.createdAt)]
		});
		const dbPerms = await db.query.rolePermissions.findMany({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager")) });
		const result = {
			branch: branchInfo,
			stock: localStock,
			shifts: recentShifts.map((s) => {
				const matchedTill = dbTills.find((t) => t.id === s.tillId);
				return {
					...s,
					till: matchedTill ? { name: matchedTill.name } : s.tillId ? { name: s.tillId } : null
				};
			}),
			orders: recentOrders,
			requests: dbRequests,
			staff: dbStaff,
			tills: dbTills,
			permissions: dbPerms
		};
		return JSON.parse(JSON.stringify(result));
	} catch (e) {
		console.error("BACKEND CRASH IN STORE MANAGER:", e);
		return { error: e.stack || e.message || String(e) };
	}
});
var requestPriceOverrideFn_createServerFn_handler = createServerRpc({
	id: "5611f19dc71ad104e7edd3f9255cea4d3d872617279037693c17888e16544db2",
	name: "requestPriceOverrideFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => requestPriceOverrideFn.__executeServer(opts));
var requestPriceOverrideFn = createServerFn({ method: "POST" }).validator((d) => d).handler(requestPriceOverrideFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId } = await getStoreManagerContext();
	const permRecord = await db.query.rolePermissions.findFirst({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager"), eq(rolePermissions.permission, "branch_override")) });
	if (permRecord && !permRecord.enabled) throw new Error("Forbidden: Branch override permission is disabled.");
	await db.update(stockLevels).set({ priceOverride: data.requestedPrice }).where(and(eq(stockLevels.id, data.stockLevelId), eq(stockLevels.branchId, branchId)));
	return { success: true };
});
var createOverrideRequestFn_createServerFn_handler = createServerRpc({
	id: "1de25ec56cb83f79ef219c30c82605a91f947f7086a68380583394f79851f5c5",
	name: "createOverrideRequestFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => createOverrideRequestFn.__executeServer(opts));
var createOverrideRequestFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createOverrideRequestFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId } = await getStoreManagerContext();
	const permRecord = await db.query.rolePermissions.findFirst({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager"), eq(rolePermissions.permission, "branch_override")) });
	if (permRecord && !permRecord.enabled) throw new Error("Forbidden: Branch override permission is disabled.");
	const [stockItem] = await db.select({
		id: stockLevels.id,
		productId: products.id,
		standardPrice: products.salePrice
	}).from(stockLevels).innerJoin(products, eq(stockLevels.productId, products.id)).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, branchId), eq(products.tenantId, tenantId)));
	if (!stockItem) throw new Error("Invalid product selection or unauthorized scope.");
	const requested = Number(data.requestedPrice);
	if (isNaN(requested) || requested < 0) throw new Error("Requested price must be a non-negative number.");
	if (!data.reason.trim()) throw new Error("Reason is required.");
	await db.insert(priceOverrideRequests).values({
		tenantId,
		branchId,
		productId: data.productId,
		stockLevelId: stockItem.id,
		standardPrice: stockItem.standardPrice || "0.00",
		requestedPrice: data.requestedPrice,
		reason: data.reason.trim(),
		status: "Pending"
	});
	return { success: true };
});
var createRosterShiftFn_createServerFn_handler = createServerRpc({
	id: "87eeb263716e71498ac779db64b218494d0860b1aefd39511309d503aee47bb7",
	name: "createRosterShiftFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => createRosterShiftFn.__executeServer(opts));
var createRosterShiftFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createRosterShiftFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId } = await getStoreManagerContext();
	const permRecord = await db.query.rolePermissions.findFirst({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager"), eq(rolePermissions.permission, "shift_staff")) });
	if (permRecord && !permRecord.enabled) throw new Error("Forbidden: Shift and staff permission is disabled.");
	const [staff] = await db.select({
		id: staffUsers.id,
		role: staffUsers.role,
		isActive: staffUsers.isActive
	}).from(staffUsers).where(and(eq(staffUsers.id, data.cashierId), eq(staffUsers.branchId, branchId), eq(staffUsers.tenantId, tenantId)));
	if (!staff) throw new Error("Invalid staff user selection or unauthorized scope.");
	if (!staff.isActive) throw new Error("Cannot assign a roster shift to an inactive staff member.");
	if (staff.role !== "cashier") throw new Error("Selected staff member's role is not eligible to operate a till.");
	const start = data.startTime.trim();
	const end = data.endTime.trim();
	if (!start || !end) throw new Error("Start and end times are required.");
	if (end < start) throw new Error("End time cannot be earlier than start time.");
	if (await db.query.shifts.findFirst({ where: and(eq(shifts.cashierId, data.cashierId), eq(shifts.shiftDate, data.shiftDate), eq(shifts.branchId, branchId), sql`${shifts.startTime} < ${end}`, sql`${shifts.endTime} > ${start}`) })) throw new Error("This staff member already has an overlapping shift scheduled for this date.");
	if (await db.query.shifts.findFirst({ where: and(eq(shifts.tillId, data.tillId), eq(shifts.shiftDate, data.shiftDate), eq(shifts.branchId, branchId), sql`${shifts.startTime} < ${end}`, sql`${shifts.endTime} > ${start}`) })) throw new Error("This till is already assigned to another cashier during this time.");
	await db.insert(shifts).values({
		tenantId,
		branchId,
		cashierId: data.cashierId,
		tillId: data.tillId,
		shiftDate: data.shiftDate,
		startTime: start,
		endTime: end,
		notes: data.notes || "",
		status: "Scheduled",
		openingFloat: "0.00"
	});
	return { success: true };
});
var deleteRosterShiftFn_createServerFn_handler = createServerRpc({
	id: "1f24a7f4f6dfdfb086ebe019d915c93b1d7919702ed82c24849479d9e279e4a7",
	name: "deleteRosterShiftFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => deleteRosterShiftFn.__executeServer(opts));
var deleteRosterShiftFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteRosterShiftFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId } = await getStoreManagerContext();
	const permRecord = await db.query.rolePermissions.findFirst({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager"), eq(rolePermissions.permission, "shift_staff")) });
	if (permRecord && !permRecord.enabled) throw new Error("Forbidden: Shift and staff permission is disabled.");
	await db.delete(shifts).where(and(eq(shifts.id, data.shiftId), eq(shifts.branchId, branchId), eq(shifts.tenantId, tenantId)));
	return { success: true };
});
var createTillFn_createServerFn_handler = createServerRpc({
	id: "2cdc8a9b47ae93821e2054381344608153473e8ba76c13147200d26e3ae0842d",
	name: "createTillFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => createTillFn.__executeServer(opts));
var createTillFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createTillFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId, userId } = await getStoreManagerContext();
	const permRecord = await db.query.rolePermissions.findFirst({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager"), eq(rolePermissions.permission, "till_management")) });
	if (permRecord && !permRecord.enabled) throw new Error("Forbidden: Till management permission is disabled.");
	const name = data.name.trim();
	if (!name) throw new Error("Till name or number is required.");
	if (await db.query.tills.findFirst({ where: and(eq(tills.branchId, branchId), eq(tills.name, name)) })) throw new Error(`A till with the name "${name}" already exists in this branch.`);
	const floatVal = Number(data.openingFloat || "0.00");
	if (isNaN(floatVal) || floatVal < 0) throw new Error("Opening float must be a non-negative number.");
	await db.transaction(async (tx) => {
		const [tenantRec] = await tx.select({ tillLimit: tenants.tillLimit }).from(tenants).where(eq(tenants.id, tenantId)).for("update");
		if (!tenantRec) throw new Error("Tenant not found.");
		if ((await tx.select({ count: sql`count(*)::int` }).from(tills).where(eq(tills.tenantId, tenantId)))[0].count >= tenantRec.tillLimit) throw new Error("Till limit reached for this tenant.");
		await tx.insert(tills).values({
			tenantId,
			branchId,
			name,
			description: data.description || "",
			status: "Closed",
			openingFloat: floatVal.toString(),
			createdBy: userId
		});
		const [branch] = await tx.select({ tillCount: branches.tillCount }).from(branches).where(eq(branches.id, branchId));
		if (branch) await tx.update(branches).set({ tillCount: (branch.tillCount || 0) + 1 }).where(eq(branches.id, branchId));
	});
	return { success: true };
});
var resetCashierPinByManagerFn_createServerFn_handler = createServerRpc({
	id: "7ea2d3820ce8de71d78a527d59c81158efeff13df5499103dbd88da8f87c975c",
	name: "resetCashierPinByManagerFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => resetCashierPinByManagerFn.__executeServer(opts));
var resetCashierPinByManagerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(resetCashierPinByManagerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId } = await getStoreManagerContext();
	const permRecord = await db.query.rolePermissions.findFirst({ where: and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager"), eq(rolePermissions.permission, "shift_staff")) });
	if (permRecord && !permRecord.enabled) throw new Error("Forbidden: Resetting cashier credentials requires permission.");
	if (data.newPin !== data.confirmPin) throw new Error("PIN and confirmation PIN do not match.");
	if (!/^\d{4}$/.test(data.newPin)) throw new Error("PIN must be exactly 4 digits.");
	const [cashier] = await db.select().from(staffUsers).where(and(eq(staffUsers.id, data.cashierId), eq(staffUsers.branchId, branchId), eq(staffUsers.tenantId, tenantId), eq(staffUsers.role, "cashier")));
	if (!cashier) throw new Error("Cashier user not found in this branch.");
	const hashed = await argon2.hash(data.newPin);
	await db.update(staffUsers).set({ pinHash: hashed }).where(eq(staffUsers.id, data.cashierId));
	return { success: true };
});
var adjustStockFn_createServerFn_handler = createServerRpc({
	id: "35dd1c052f09dff6467417c24ab651efd40eb79ff4cf9de726eb5224c372c902",
	name: "adjustStockFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => adjustStockFn.__executeServer(opts));
var adjustStockFn = createServerFn({ method: "POST" }).validator((d) => d).handler(adjustStockFn_createServerFn_handler, async ({ data }) => {
	try {
		const { tenantId, branchId, userId } = await getStoreManagerContext();
		const [stock] = await db.select({
			id: stockLevels.id,
			currentStock: stockLevels.stock
		}).from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, branchId)));
		if (!stock) throw new Error("Stock record not found.");
		const newQuantity = stock.currentStock + data.quantityChange;
		await db.transaction(async (tx) => {
			await tx.update(stockLevels).set({ stock: newQuantity }).where(eq(stockLevels.id, stock.id));
			const finalReason = data.note ? `${data.reason}: ${data.note}` : data.reason;
			await tx.insert(stockAdjustments).values({
				tenantId,
				branchId,
				productId: data.productId,
				batchId: null,
				previousQuantity: stock.currentStock,
				quantityChange: data.quantityChange,
				newQuantity,
				reason: finalReason,
				adjustedBy: userId
			});
			await tx.insert(inventoryLedger).values({
				tenantId,
				branchId,
				productId: data.productId,
				batchId: null,
				transactionType: "Adjustment",
				previousQuantity: stock.currentStock,
				changedQuantity: data.quantityChange,
				newQuantity,
				createdBy: userId
			});
			await tx.insert(auditLogs).values({
				tenantId,
				branchId,
				userId,
				action: "STOCK_ADJUSTED",
				entityType: "Product",
				entityId: data.productId,
				details: {
					previousQuantity: stock.currentStock,
					quantityChange: data.quantityChange,
					newQuantity,
					reason: finalReason
				}
			});
		});
		return { success: true };
	} catch (err) {
		console.error("[adjustStockFn Error]", err);
		throw err;
	}
});
var getStockAdjustmentHistoryFn_createServerFn_handler = createServerRpc({
	id: "da5c637dfc46c3944be86943a337758583b70bccdc184bc4083472c54f9edb00",
	name: "getStockAdjustmentHistoryFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => getStockAdjustmentHistoryFn.__executeServer(opts));
var getStockAdjustmentHistoryFn = createServerFn({ method: "GET" }).validator((d) => d).handler(getStockAdjustmentHistoryFn_createServerFn_handler, async ({ data }) => {
	try {
		const { branchId } = await getStoreManagerContext();
		return await db.select({
			id: stockAdjustments.id,
			createdAt: stockAdjustments.createdAt,
			quantityChange: stockAdjustments.quantityChange,
			reason: stockAdjustments.reason,
			adjustedByName: staffUsers.name
		}).from(stockAdjustments).leftJoin(staffUsers, eq(stockAdjustments.adjustedBy, staffUsers.id)).where(and(eq(stockAdjustments.productId, data.productId), eq(stockAdjustments.branchId, branchId))).orderBy(desc(stockAdjustments.createdAt));
	} catch (err) {
		console.error("[getStockAdjustmentHistoryFn Error]", err);
		throw err;
	}
});
var exportZReportFn_createServerFn_handler = createServerRpc({
	id: "d5251edd6ea3a46509907367f81e96d6c639be63405a031114af40fc913ce61f",
	name: "exportZReportFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => exportZReportFn.__executeServer(opts));
var exportZReportFn = createServerFn({ method: "POST" }).handler(exportZReportFn_createServerFn_handler, async () => {
	try {
		const { tenantId, branchId } = await getStoreManagerContext();
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const todayOrders = await db.query.orders.findMany({ where: and(eq(orders.branchId, branchId), sql`DATE(${orders.createdAt}) = ${today}`) });
		const salesToday = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
		const vatToday = todayOrders.reduce((sum, o) => sum + (Number(o.vat) || 0), 0);
		const transactions = todayOrders.length;
		let csvContent = "Report Type,Z-Report\n";
		csvContent += `Date,${today}\n`;
		csvContent += `Branch ID,${branchId}\n`;
		csvContent += `\nMetric,Value\n`;
		csvContent += `Total Sales,${salesToday.toFixed(2)}\n`;
		csvContent += `Total VAT,${vatToday.toFixed(2)}\n`;
		csvContent += `Total Transactions,${transactions}\n`;
		return {
			success: true,
			csvContent
		};
	} catch (err) {
		console.error("[exportZReportFn Error]", err);
		throw err;
	}
});
var recordCashDropFn_createServerFn_handler = createServerRpc({
	id: "4e2433c358339345979e224ae350964943a59838f6f73822385d6c9c27e54810",
	name: "recordCashDropFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => recordCashDropFn.__executeServer(opts));
var recordCashDropFn = createServerFn({ method: "POST" }).validator((d) => d).handler(recordCashDropFn_createServerFn_handler, async ({ data }) => {
	try {
		const { tenantId, branchId } = await getStoreManagerContext();
		const [shift] = await db.select({ cashDrops: shifts.cashDrops }).from(shifts).where(and(eq(shifts.id, data.shiftId), eq(shifts.branchId, branchId)));
		if (!shift) throw new Error("Shift not found.");
		let drops = [];
		try {
			drops = JSON.parse(shift.cashDrops || "[]");
		} catch (e) {
			drops = [];
		}
		drops.push({
			amount: data.amount,
			note: data.note || "",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
		await db.update(shifts).set({ cashDrops: JSON.stringify(drops) }).where(eq(shifts.id, data.shiftId));
		return { success: true };
	} catch (err) {
		console.error("[recordCashDropFn Error]", err);
		throw err;
	}
});
var closeShiftFn_createServerFn_handler = createServerRpc({
	id: "ed7791bce8fd415c1c67818bc3f51f7012ae68120fd9ef0f865bb363274b2651",
	name: "closeShiftFn",
	filename: "src/lib/store-manager-server.ts"
}, (opts) => closeShiftFn.__executeServer(opts));
var closeShiftFn = createServerFn({ method: "POST" }).validator((d) => d).handler(closeShiftFn_createServerFn_handler, async ({ data }) => {
	try {
		const { tenantId, branchId } = await getStoreManagerContext();
		const [shift] = await db.select().from(shifts).where(and(eq(shifts.id, data.shiftId), eq(shifts.branchId, branchId)));
		if (!shift) throw new Error("Shift not found.");
		if (shift.status === "Closed") throw new Error("Shift is already closed.");
		let drops = [];
		try {
			drops = JSON.parse(shift.cashDrops || "[]");
		} catch (e) {}
		const totalDrops = drops.reduce((sum, drop) => sum + Number(drop.amount || 0), 0);
		const openingFloat = Number(shift.openingFloat || 0);
		let shiftOrders = [];
		if (shift.tillId && shift.openedAt) {
			const openedAtDate = new Date(shift.openedAt);
			shiftOrders = await db.query.orders.findMany({ where: and(eq(orders.branchId, branchId), eq(orders.tillId, shift.tillId), gte(orders.createdAt, openedAtDate)) });
		}
		const expectedCash = openingFloat + shiftOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) - totalDrops;
		await db.update(shifts).set({
			status: "Closed",
			closedAt: /* @__PURE__ */ new Date(),
			actualCash: data.actualCash.toString(),
			expectedCash: expectedCash.toString()
		}).where(eq(shifts.id, data.shiftId));
		return { success: true };
	} catch (err) {
		console.error("[closeShiftFn Error]", err);
		throw err;
	}
});
//#endregion
export { adjustStockFn_createServerFn_handler, closeShiftFn_createServerFn_handler, createOverrideRequestFn_createServerFn_handler, createRosterShiftFn_createServerFn_handler, createTillFn_createServerFn_handler, deleteRosterShiftFn_createServerFn_handler, exportZReportFn_createServerFn_handler, getStockAdjustmentHistoryFn_createServerFn_handler, getStoreManagerDataFn_createServerFn_handler, recordCashDropFn_createServerFn_handler, requestPriceOverrideFn_createServerFn_handler, resetCashierPinByManagerFn_createServerFn_handler };
