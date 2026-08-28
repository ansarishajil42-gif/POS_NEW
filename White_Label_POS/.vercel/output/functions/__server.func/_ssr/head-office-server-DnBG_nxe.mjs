import { r as createServerFn } from "./server-po8kJpue.mjs";
import { r as getSessionServerFn } from "./auth-server-Cg0hQhNk.mjs";
import { a as eq, c as ilike, d as lte, f as ne, i as and, l as inArray, p as or, r as desc, s as gte, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { A as tenantSettings, C as rolePermissions, E as staffUsers, I as vendors, L as createServerRpc, N as unitConversions, O as stockLevels, P as vendorInvoices, S as purchaseOrders, _ as productBarcodes, a as customerTransactions, b as promotions, c as grnItems, f as orderItems, g as priceOverrideRequests, i as branches, j as tenants, k as stockTransfers, m as orders, o as customers, r as batches, t as db, v as productVariants, x as purchaseOrderItems, y as products } from "./db-DMcWZUf-.mjs";
import { t as bcryptjs_default } from "../_libs/bcryptjs.mjs";
import { t as logAuditAction } from "./audit-logger-DbocvFYh.mjs";
import { t as createBranchInternal } from "./branch-server-helpers-BSTdo2k4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/head-office-server-DnBG_nxe.js
async function getHeadOfficeSession() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Head Office Admin") throw new Error("Unauthorized");
	return {
		tenantId: res.session.tenantId,
		userId: res.session.userId
	};
}
async function getHeadOfficeTenant() {
	return (await getHeadOfficeSession()).tenantId;
}
var createBranchForTenantFn_createServerFn_handler = createServerRpc({
	id: "c100981fd3f11b2714ebfb7af80533fbed77d4cc5dae99f38a65fe6b358f3933",
	name: "createBranchForTenantFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createBranchForTenantFn.__executeServer(opts));
var createBranchForTenantFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createBranchForTenantFn_createServerFn_handler, async ({ data }) => {
	const session = await getHeadOfficeSession();
	try {
		return {
			success: true,
			branchId: (await createBranchInternal({
				tenantId: session.tenantId,
				name: data.name,
				address: data.address,
				userId: session.userId
			})).id
		};
	} catch (e) {
		throw new Error(e.message);
	}
});
var updateBranchFn_createServerFn_handler = createServerRpc({
	id: "5102fdb437acc42f7e2c69a7cb419d5157a0dc1db9b82838c28da958be5be859",
	name: "updateBranchFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateBranchFn.__executeServer(opts));
var updateBranchFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateBranchFn_createServerFn_handler, async ({ data }) => {
	const session = await getHeadOfficeSession();
	if (!await db.query.branches.findFirst({ where: and(eq(branches.id, data.branchId), eq(branches.tenantId, session.tenantId)) })) throw new Error("Branch not found or unauthorized");
	await db.update(branches).set({
		name: data.name,
		address: data.address
	}).where(eq(branches.id, data.branchId));
	await logAuditAction({
		action: "Update Branch",
		entityType: "branch",
		entityId: data.branchId,
		tenantId: session.tenantId,
		userId: session.userId,
		afterValue: {
			name: data.name,
			address: data.address
		}
	});
	return { success: true };
});
var activateBranchFn_createServerFn_handler = createServerRpc({
	id: "9a8de0e4319294f944f96fdc3ea65a25c82fc806c6cb4f907cd6c8ee5e402eef",
	name: "activateBranchFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => activateBranchFn.__executeServer(opts));
var activateBranchFn = createServerFn({ method: "POST" }).validator((d) => d).handler(activateBranchFn_createServerFn_handler, async ({ data }) => {
	const session = await getHeadOfficeSession();
	if (!await db.query.branches.findFirst({ where: and(eq(branches.id, data.branchId), eq(branches.tenantId, session.tenantId)) })) throw new Error("Branch not found or unauthorized");
	await db.update(branches).set({ status: "Active" }).where(eq(branches.id, data.branchId));
	await logAuditAction({
		action: "Activate Branch",
		entityType: "branch",
		entityId: data.branchId,
		tenantId: session.tenantId,
		userId: session.userId,
		afterValue: { status: "Active" }
	});
	return { success: true };
});
var deactivateBranchFn_createServerFn_handler = createServerRpc({
	id: "2995f8504bbd86a1c1d7ea79c1dce8d10e7c925487976ae0bfba9bfe703f26d1",
	name: "deactivateBranchFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => deactivateBranchFn.__executeServer(opts));
var deactivateBranchFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deactivateBranchFn_createServerFn_handler, async ({ data }) => {
	const session = await getHeadOfficeSession();
	if (!await db.query.branches.findFirst({ where: and(eq(branches.id, data.branchId), eq(branches.tenantId, session.tenantId)) })) throw new Error("Branch not found or unauthorized");
	await db.update(branches).set({ status: "Inactive" }).where(eq(branches.id, data.branchId));
	await logAuditAction({
		action: "Deactivate Branch",
		entityType: "branch",
		entityId: data.branchId,
		tenantId: session.tenantId,
		userId: session.userId,
		afterValue: { status: "Inactive" }
	});
	return { success: true };
});
var getBranchDetailsFn_createServerFn_handler = createServerRpc({
	id: "433dfcf06cb21fdc9e40beb9b59e1cad4d8ebc2dcbd442f47964ba66d7ae700f",
	name: "getBranchDetailsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => getBranchDetailsFn.__executeServer(opts));
var getBranchDetailsFn = createServerFn({ method: "GET" }).validator((d) => d).handler(getBranchDetailsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const branch = await db.query.branches.findFirst({
		where: and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)),
		with: { staffUsers: true }
	});
	if (!branch) throw new Error("Branch not found");
	return { branch };
});
var getHeadOfficeDataFn_createServerFn_handler = createServerRpc({
	id: "4f65a076d746579199c79d55a95938939a440421e9d6646e89b72b45dbbe17d0",
	name: "getHeadOfficeDataFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => getHeadOfficeDataFn.__executeServer(opts));
var getHeadOfficeDataFn = createServerFn({ method: "GET" }).handler(getHeadOfficeDataFn_createServerFn_handler, async () => {
	const tenantId = await getHeadOfficeTenant();
	const tenantInfo = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
	let settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });
	if (!settings) {
		const [newSet] = await db.insert(tenantSettings).values({ tenantId }).returning();
		settings = newSet;
	}
	const dbBranches = await db.query.branches.findMany({ where: eq(branches.tenantId, tenantId) });
	const [dbProducts, dbBarcodes, dbVariants, dbConversions] = await Promise.all([
		db.query.products.findMany({ where: eq(products.tenantId, tenantId) }),
		db.select().from(productBarcodes),
		db.select().from(productVariants),
		db.select().from(unitConversions)
	]);
	const productsWithDetails = dbProducts.map((p) => {
		const alternateBarcodes = dbBarcodes.filter((b) => b.productId === p.id).map((b) => b.barcode);
		const variants = dbVariants.filter((v) => v.productId === p.id).map((v) => ({
			variantName: v.variantName,
			variantValue: v.variantValue,
			sku: v.sku,
			priceAdjustment: v.priceAdjustment
		}));
		const conversions = dbConversions.filter((c) => c.productId === p.id).map((c) => ({
			fromUnit: c.fromUnit,
			toUnit: c.toUnit,
			conversionFactor: c.conversionFactor
		}));
		return {
			...p,
			alternateBarcodes,
			variants,
			conversions
		};
	});
	const dbStock = await db.query.stockLevels.findMany({ where: inArray(stockLevels.branchId, dbBranches.map((b) => b.id).concat(["00000000-0000-0000-0000-000000000000"])) });
	const dbBatches = await db.query.batches.findMany({
		where: inArray(batches.branchId, dbBranches.map((b) => b.id).concat(["00000000-0000-0000-0000-000000000000"])),
		orderBy: [batches.expiryDate]
	});
	const dbPos = await db.query.purchaseOrders.findMany({
		where: eq(purchaseOrders.tenantId, tenantId),
		with: {
			vendor: true,
			branch: true,
			items: { with: { product: true } }
		},
		orderBy: [desc(purchaseOrders.createdAt)]
	});
	const dbVendors = await db.query.vendors.findMany({ where: eq(vendors.tenantId, tenantId) });
	const dbStaff = await db.query.staffUsers.findMany({
		where: eq(staffUsers.tenantId, tenantId),
		columns: {
			id: true,
			tenantId: true,
			branchId: true,
			name: true,
			email: true,
			role: true,
			isActive: true,
			createdAt: true
		}
	});
	const dbCustomers = await db.query.customers.findMany({ where: eq(customers.tenantId, tenantId) });
	const dbPromotions = await db.query.promotions.findMany({ where: eq(promotions.tenantId, tenantId) });
	const dbPermissions = await db.query.rolePermissions.findMany({ where: eq(rolePermissions.tenantId, tenantId) });
	const dbOrders = await db.query.orders.findMany({
		where: eq(orders.tenantId, tenantId),
		columns: {
			branchId: true,
			total: true,
			vat: true,
			subtotal: true,
			createdAt: true
		}
	});
	const outputVat = dbOrders.reduce((sum, o) => sum + Number(o.vat || 0), 0);
	const salesTotal = dbOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
	const dbInvoices = await db.query.vendorInvoices.findMany({ where: eq(vendorInvoices.tenantId, tenantId) });
	const vatRateVal = settings ? Number(settings.vatRate) : 5;
	const inputVat = dbInvoices.reduce((sum, inv) => {
		const total = Number(inv.total);
		return sum + (total - total / (1 + vatRateVal / 100));
	}, 0);
	const purchasesTotal = dbInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
	let reportingPeriod = "All Time";
	const dates = [];
	dbOrders.forEach((o) => dates.push(new Date(o.createdAt)));
	dbInvoices.forEach((i) => dates.push(new Date(i.createdAt)));
	if (dates.length > 0) {
		const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
		const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
		const formatD = (d) => d.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric"
		});
		reportingPeriod = `${formatD(minDate)} - ${formatD(maxDate)}`;
	}
	const branchTrend = [];
	for (let i = 6; i >= 0; i--) {
		const date = /* @__PURE__ */ new Date();
		date.setDate(date.getDate() - i);
		const dayData = { d: date.toLocaleDateString("en-US", { weekday: "short" }) };
		dbBranches.forEach((b) => {
			dayData[b.name] = 0;
		});
		dbOrders.forEach((o) => {
			if (new Date(o.createdAt).toDateString() === date.toDateString()) {
				const branch = dbBranches.find((b) => b.id === o.branchId);
				if (branch) dayData[branch.name] += Number(o.total);
			}
		});
		branchTrend.push(dayData);
	}
	const dbPriceOverrideRequests = await db.query.priceOverrideRequests.findMany({
		where: eq(priceOverrideRequests.tenantId, tenantId),
		orderBy: [desc(priceOverrideRequests.createdAt)],
		with: {
			product: true,
			branch: true
		}
	});
	return {
		success: true,
		settings,
		priceRequests: dbPriceOverrideRequests,
		branches: dbBranches,
		products: productsWithDetails,
		stock: dbStock,
		batches: dbBatches,
		purchases: dbPos,
		vendors: dbVendors,
		staff: dbStaff,
		customers: dbCustomers,
		promotions: dbPromotions,
		permissions: dbPermissions,
		branchTrend,
		outputVat,
		inputVat,
		salesTotal,
		purchasesTotal,
		reportingPeriod,
		tenantName: tenantInfo ? tenantInfo.name : "Tenant"
	};
});
var updateStockFn_createServerFn_handler = createServerRpc({
	id: "dbbaf1dd65b92754d21182cad8f9236fd94a75309980cd25df33f60e6774bdd3",
	name: "updateStockFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateStockFn.__executeServer(opts));
var updateStockFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateStockFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	await db.transaction(async (tx) => {
		const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
		const [product] = await tx.select({ id: products.id }).from(products).where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
		if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");
		const existing = (await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId))).limit(1))[0];
		if (existing) await tx.update(stockLevels).set({ stock: data.qty }).where(eq(stockLevels.id, existing.id));
		else await tx.insert(stockLevels).values({
			productId: data.productId,
			branchId: data.branchId,
			stock: data.qty,
			reorderLevel: 10
		});
	});
	return { success: true };
});
var updatePriceOverrideFn_createServerFn_handler = createServerRpc({
	id: "56aa1c081d06333b6d2d05cd416dece608e9bd36f56b29858b1834f66cabecbe",
	name: "updatePriceOverrideFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updatePriceOverrideFn.__executeServer(opts));
var updatePriceOverrideFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updatePriceOverrideFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	await db.transaction(async (tx) => {
		const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
		const [product] = await tx.select({ id: products.id }).from(products).where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
		if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");
		const existing = (await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId))).limit(1))[0];
		if (existing) await tx.update(stockLevels).set({ priceOverride: data.priceOverride }).where(eq(stockLevels.id, existing.id));
		else await tx.insert(stockLevels).values({
			productId: data.productId,
			branchId: data.branchId,
			stock: 0,
			reorderLevel: 10,
			priceOverride: data.priceOverride
		});
	});
	return { success: true };
});
var handleOverrideRequestFn_createServerFn_handler = createServerRpc({
	id: "308754141f310ba8eef9422559ccbbdc5013a4c6b1daf568e45f374b4f7250f0",
	name: "handleOverrideRequestFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => handleOverrideRequestFn.__executeServer(opts));
var handleOverrideRequestFn = createServerFn({ method: "POST" }).validator((d) => d).handler(handleOverrideRequestFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const request = await db.query.priceOverrideRequests.findFirst({ where: and(eq(priceOverrideRequests.id, data.requestId), eq(priceOverrideRequests.tenantId, tenantId)) });
	if (!request) throw new Error("Request not found or unauthorized.");
	if (request.status !== "Pending") throw new Error("Request has already been processed.");
	const userId = (await getSessionServerFn()).session?.id || null;
	if (data.action === "Approve") {
		await db.update(priceOverrideRequests).set({
			status: "Approved",
			approvedBy: userId,
			approvedAt: /* @__PURE__ */ new Date()
		}).where(eq(priceOverrideRequests.id, data.requestId));
		await db.update(stockLevels).set({ priceOverride: request.requestedPrice }).where(eq(stockLevels.id, request.stockLevelId));
	} else await db.update(priceOverrideRequests).set({
		status: "Rejected",
		approvedBy: userId,
		approvedAt: /* @__PURE__ */ new Date()
	}).where(eq(priceOverrideRequests.id, data.requestId));
	return { success: true };
});
var applyClearanceFn_createServerFn_handler = createServerRpc({
	id: "42914dc70ed3fcf9c5670f8173281213c1d64f2faeedabb3c81324634abefa93",
	name: "applyClearanceFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => applyClearanceFn.__executeServer(opts));
var applyClearanceFn = createServerFn({ method: "POST" }).validator((d) => d).handler(applyClearanceFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	await db.insert(promotions).values({
		tenantId,
		name: "Clearance Sale",
		discountType: "percentage",
		discountValue: data.discountPct.toString(),
		startDate: /* @__PURE__ */ new Date(),
		endDate: new Date(Date.now() + 12096e5),
		status: "Active"
	});
	return { success: true };
});
var updateVatSettingsFn_createServerFn_handler = createServerRpc({
	id: "44533c085dcf480b227e06b225cdf217ded5dd92ceb09caa4f24915c18b11f40",
	name: "updateVatSettingsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateVatSettingsFn.__executeServer(opts));
var updateVatSettingsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateVatSettingsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	await db.update(tenantSettings).set({
		vatRate: data.vatRate,
		vatInclusive: data.vatInclusive
	}).where(eq(tenantSettings.tenantId, tenantId));
	return { success: true };
});
var createPoFn_createServerFn_handler = createServerRpc({
	id: "550a22a2c30d9985a61b73a6bfac7836aa86a7bb823f13d9a1588ba2a0733b6f",
	name: "createPoFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createPoFn.__executeServer(opts));
var createPoFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createPoFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	await db.insert(purchaseOrders).values({
		tenantId,
		branchId: data.branchId,
		vendorId: data.vendorId,
		status: "Pending",
		total: data.totalAmount
	});
	return { success: true };
});
var updateLoyaltySettingsFn_createServerFn_handler = createServerRpc({
	id: "833152d6b48924f8871519016755abbfa8d4570adefa749ce2a06eceb3117ee2",
	name: "updateLoyaltySettingsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateLoyaltySettingsFn.__executeServer(opts));
var updateLoyaltySettingsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateLoyaltySettingsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const pointsPerAed = Number(data.pointsPerAed);
	const minPointsToRedeem = Number(data.minPointsToRedeem);
	const redemptionRate = Number(data.redemptionRate);
	if (isNaN(pointsPerAed) || pointsPerAed < 0 || !Number.isInteger(pointsPerAed)) throw new Error("Points per AED must be a non-negative integer.");
	if (isNaN(minPointsToRedeem) || minPointsToRedeem < 0 || !Number.isInteger(minPointsToRedeem)) throw new Error("Minimum points to redeem must be a non-negative integer.");
	if (isNaN(redemptionRate) || redemptionRate < 0) throw new Error("Redemption rate must be a non-negative number.");
	await db.update(tenantSettings).set({
		loyaltyPointsPerAed: pointsPerAed,
		loyaltyMinPointsToRedeem: minPointsToRedeem,
		loyaltyRedemptionRate: redemptionRate.toFixed(4),
		updatedAt: /* @__PURE__ */ new Date()
	}).where(eq(tenantSettings.tenantId, tenantId));
	return { success: true };
});
var createCampaignFn_createServerFn_handler = createServerRpc({
	id: "8811d87a1c6bf8b33342d0224ea930b76d0f668bdb107c011cf05ac7be034ddd",
	name: "createCampaignFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createCampaignFn.__executeServer(opts));
var createCampaignFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createCampaignFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (!data.name || data.name.trim() === "") throw new Error("Campaign name is required.");
	if (!data.type) throw new Error("Campaign type is required.");
	if (!data.target) throw new Error("Campaign target is required.");
	const numValue = Number(data.value);
	if (isNaN(numValue) && data.type !== "Bundle discount") throw new Error("Value must be a valid number.");
	if (data.type === "Percentage discount") {
		if (numValue < 0 || numValue > 100) throw new Error("Percentage discount must be between 0 and 100.");
	} else if (data.type === "Fixed amount discount") {
		if (numValue < 0) throw new Error("Fixed amount discount cannot be negative.");
	}
	if (data.type === "Dynamic pricing") {
		if (!data.pricingBasis) throw new Error("Pricing basis is required for dynamic pricing rules.");
		if (data.pricingBasis === "Percentage adjustment") {
			if (numValue < 0 || numValue > 100) throw new Error("Percentage adjustment must be between 0 and 100.");
		} else if (numValue < 0) throw new Error("Adjustment value / price cannot be negative.");
		if (data.minQty !== void 0 && data.minQty !== null && data.minQty !== "") {
			const minVal = Number(data.minQty);
			if (isNaN(minVal) || minVal < 0 || !Number.isInteger(minVal)) throw new Error("Minimum quantity must be a non-negative integer.");
		}
		if (data.maxQty !== void 0 && data.maxQty !== null && data.maxQty !== "") {
			const maxVal = Number(data.maxQty);
			if (isNaN(maxVal) || maxVal < 0 || !Number.isInteger(maxVal)) throw new Error("Maximum quantity must be a non-negative integer.");
			if (data.minQty !== void 0 && data.minQty !== null && data.minQty !== "") {
				if (maxVal < Number(data.minQty)) throw new Error("Maximum quantity cannot be less than minimum quantity.");
			}
		}
		const timeRegex = /^\d{2}:\d{2}$/;
		if (data.startTime && data.startTime.trim() !== "") {
			if (!timeRegex.test(data.startTime)) throw new Error("Start time must be in HH:mm format.");
		}
		if (data.endTime && data.endTime.trim() !== "") {
			if (!timeRegex.test(data.endTime)) throw new Error("End time must be in HH:mm format.");
			if (data.startTime && data.startTime.trim() !== "" && data.endTime < data.startTime) throw new Error("End time cannot be earlier than start time.");
		}
	}
	if (data.target === "Category") {
		if (!data.targetCategory || data.targetCategory.trim() === "") throw new Error("Category selection is required.");
	} else if (data.target === "Selected products") {
		if (!data.targetProductIds || data.targetProductIds.trim() === "") throw new Error("At least one product must be selected.");
	}
	if (data.type === "Bundle discount") {
		if (!data.bundleProducts || data.bundleProducts.trim() === "") throw new Error("Bundle configuration is required.");
		try {
			const bundle = JSON.parse(data.bundleProducts);
			if (!Array.isArray(bundle) || bundle.length < 2) throw new Error("Bundle must contain at least 2 products.");
			for (const item of bundle) if (!item.productId || !item.qty || isNaN(Number(item.qty)) || Number(item.qty) <= 0) throw new Error("Each bundle item must have a valid product and quantity greater than 0.");
		} catch (e) {
			throw new Error(e.message || "Invalid bundle configuration.");
		}
	}
	const start = new Date(data.startDate);
	const end = new Date(data.endDate);
	if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error("Invalid start or end date.");
	if (end < start) throw new Error("End date cannot be earlier than start date.");
	let discountType = "percentage";
	if (data.type === "Fixed amount discount") discountType = "fixed";
	else if (data.type === "Bundle discount") discountType = "bundle";
	else if (data.type === "Dynamic pricing") {
		if (data.pricingBasis === "Percentage adjustment") discountType = "percentage";
		else discountType = "fixed";
	}
	let displayValue = "";
	if (data.type === "Percentage discount") displayValue = `${numValue}% off`;
	else if (data.type === "Fixed amount discount") displayValue = `AED ${numValue} flat`;
	else if (data.type === "Bundle discount") displayValue = `Bundle price: AED ${numValue}`;
	else if (data.type === "Dynamic pricing") {
		if (data.pricingBasis === "Percentage adjustment") displayValue = `${numValue}% adjust`;
		else if (data.pricingBasis === "Fixed amount adjustment") displayValue = `AED ${numValue} adjust`;
		else if (data.pricingBasis === "Fixed final price") displayValue = `AED ${numValue} final`;
	}
	let displayTarget = data.target;
	if (data.target === "Category") displayTarget = `Category: ${data.targetCategory}`;
	else if (data.target === "Selected products") displayTarget = `${(data.targetProductIds || "").split(",").filter(Boolean).length} selected products`;
	await db.insert(promotions).values({
		tenantId,
		name: data.name,
		discountType,
		discountValue: numValue.toString(),
		startDate: start,
		endDate: end,
		status: data.status,
		type: data.type,
		target: displayTarget,
		value: displayValue,
		targetCategory: data.targetCategory,
		targetProductIds: data.targetProductIds,
		bundleProducts: data.bundleProducts,
		pricingBasis: data.pricingBasis,
		minQty: data.minQty ? Number(data.minQty) : null,
		maxQty: data.maxQty ? Number(data.maxQty) : null,
		startTime: data.startTime,
		endTime: data.endTime
	});
	return { success: true };
});
var createProductFn_createServerFn_handler = createServerRpc({
	id: "dbe2826a61c72c4cf10f804dff09108b3b8ab2dc337ecccdd2983b594af1b615",
	name: "createProductFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createProductFn.__executeServer(opts));
var createProductFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createProductFn_createServerFn_handler, async ({ data }) => {
	const sessionRes = await getSessionServerFn();
	if (!sessionRes.success || !sessionRes.session || sessionRes.session.role !== "Head Office Admin") throw new Error("Unauthorized");
	const tenantId = sessionRes.session.tenantId;
	const parsedCost = Number(data.costPrice);
	const parsedSale = Number(data.salePrice);
	if (isNaN(parsedCost) || isNaN(parsedSale)) return {
		success: false,
		error: "Cost and sale prices must be valid numbers"
	};
	if (parsedCost < 0) return {
		success: false,
		error: "Cost price cannot be negative"
	};
	if (parsedSale <= 0) return {
		success: false,
		error: "Sale price must be greater than zero"
	};
	const cleanBarcode = data.barcode === "" || data.barcode === void 0 || data.barcode === null ? null : data.barcode;
	if (cleanBarcode) {
		const [existing] = await db.select().from(products).where(and(eq(products.tenantId, tenantId), eq(products.barcode, cleanBarcode)));
		if (existing) return {
			success: false,
			error: "Product with this barcode already exists"
		};
	}
	try {
		let newProduct;
		await db.transaction(async (tx) => {
			const [inserted] = await tx.insert(products).values({
				tenantId,
				name: data.name,
				barcode: cleanBarcode,
				category: data.category,
				unit: data.unit,
				costPrice: parsedCost.toFixed(2),
				salePrice: parsedSale.toFixed(2),
				isBatchTracked: data.isBatchTracked
			}).returning();
			newProduct = inserted;
			if (data.barcodes && data.barcodes.length > 0) {
				const barcodeInserts = data.barcodes.map((b) => ({
					productId: newProduct.id,
					barcode: b
				}));
				await tx.insert(productBarcodes).values(barcodeInserts);
			}
			if (data.variants && data.variants.length > 0) {
				const variantInserts = data.variants.map((v) => ({
					productId: newProduct.id,
					variantName: v.variantName,
					variantValue: v.variantValue,
					sku: v.sku || null,
					priceAdjustment: Number(v.priceAdjustment).toFixed(2)
				}));
				await tx.insert(productVariants).values(variantInserts);
			}
			if (data.conversions && data.conversions.length > 0) {
				const conversionInserts = data.conversions.map((c) => ({
					productId: newProduct.id,
					fromUnit: c.fromUnit,
					toUnit: c.toUnit,
					conversionFactor: Number(c.conversionFactor).toString()
				}));
				await tx.insert(unitConversions).values(conversionInserts);
			}
			const tenantBranches = await tx.select({ id: branches.id }).from(branches).where(eq(branches.tenantId, tenantId));
			if (tenantBranches.length > 0) {
				const stockInserts = tenantBranches.map((b) => ({
					productId: newProduct.id,
					branchId: b.id,
					stock: 0,
					reorderLevel: 10
				}));
				await tx.insert(stockLevels).values(stockInserts);
			}
		});
		return { success: true };
	} catch (error) {
		console.error(error);
		return {
			success: false,
			error: "Failed to create product"
		};
	}
});
var updateProductFn_createServerFn_handler = createServerRpc({
	id: "52b1df60eeec8ed07c7f1aaa1906dd98ed61771650e3878a20e2a3a9c4433124",
	name: "updateProductFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateProductFn.__executeServer(opts));
var updateProductFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateProductFn_createServerFn_handler, async ({ data }) => {
	const sessionRes = await getSessionServerFn();
	if (!sessionRes.success || !sessionRes.session || sessionRes.session.role !== "Head Office Admin") throw new Error("Unauthorized");
	const [existingProduct] = await db.select().from(products).where(and(eq(products.id, data.id), eq(products.tenantId, sessionRes.session.tenantId)));
	if (!existingProduct) throw new Error("Unauthorized");
	const cleanBarcode = data.barcode === "" || data.barcode === void 0 || data.barcode === null ? null : data.barcode;
	if (cleanBarcode) {
		const [duplicate] = await db.select().from(products).where(and(eq(products.tenantId, sessionRes.session.tenantId), eq(products.barcode, cleanBarcode)));
		if (duplicate && duplicate.id !== data.id) return {
			success: false,
			error: "Product with this barcode already exists"
		};
	}
	const updates = {};
	if (data.name !== void 0) updates.name = data.name;
	if (data.barcode !== void 0) updates.barcode = cleanBarcode;
	if (data.category !== void 0) updates.category = data.category;
	if (data.unit !== void 0) updates.unit = data.unit;
	if (data.costPrice !== void 0) {
		const parsedCost = Number(data.costPrice);
		if (isNaN(parsedCost) || parsedCost < 0) return {
			success: false,
			error: "Cost price cannot be negative"
		};
		updates.costPrice = parsedCost.toFixed(2);
	}
	if (data.salePrice !== void 0) {
		const parsedSale = Number(data.salePrice);
		if (isNaN(parsedSale) || parsedSale <= 0) return {
			success: false,
			error: "Sale price must be greater than zero"
		};
		updates.salePrice = parsedSale.toFixed(2);
	}
	if (data.isBatchTracked !== void 0) updates.isBatchTracked = data.isBatchTracked;
	try {
		await db.transaction(async (tx) => {
			await tx.update(products).set(updates).where(eq(products.id, data.id));
			if (data.barcodes !== void 0) {
				await tx.delete(productBarcodes).where(eq(productBarcodes.productId, data.id));
				if (data.barcodes.length > 0) {
					const barcodeInserts = data.barcodes.map((b) => ({
						productId: data.id,
						barcode: b
					}));
					await tx.insert(productBarcodes).values(barcodeInserts);
				}
			}
			if (data.variants !== void 0) {
				await tx.delete(productVariants).where(eq(productVariants.productId, data.id));
				if (data.variants.length > 0) {
					const variantInserts = data.variants.map((v) => ({
						productId: data.id,
						variantName: v.variantName,
						variantValue: v.variantValue,
						sku: v.sku || null,
						priceAdjustment: Number(v.priceAdjustment).toFixed(2)
					}));
					await tx.insert(productVariants).values(variantInserts);
				}
			}
			if (data.conversions !== void 0) {
				await tx.delete(unitConversions).where(eq(unitConversions.productId, data.id));
				if (data.conversions.length > 0) {
					const conversionInserts = data.conversions.map((c) => ({
						productId: data.id,
						fromUnit: c.fromUnit,
						toUnit: c.toUnit,
						conversionFactor: Number(c.conversionFactor).toString()
					}));
					await tx.insert(unitConversions).values(conversionInserts);
				}
			}
		});
		return { success: true };
	} catch (error) {
		console.error(error);
		return {
			success: false,
			error: "Failed to update product"
		};
	}
});
var deleteProductFn_createServerFn_handler = createServerRpc({
	id: "61c6c3e8ad3879451ca63b4fc74a5054a8973715d6319777b0d260c15e1c8d69",
	name: "deleteProductFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => deleteProductFn.__executeServer(opts));
var deleteProductFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteProductFn_createServerFn_handler, async ({ data }) => {
	const sessionRes = await getSessionServerFn();
	if (!sessionRes.success || !sessionRes.session || sessionRes.session.role !== "Head Office Admin") throw new Error("Unauthorized");
	const tenantId = sessionRes.session.tenantId;
	try {
		return await db.transaction(async (tx) => {
			const [existing] = await tx.select({ tenantId: products.tenantId }).from(products).where(eq(products.id, data.id));
			if (!existing || existing.tenantId !== tenantId) return {
				success: false,
				error: "Unauthorized"
			};
			if ((await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.id), ne(stockLevels.stock, 0)))).length > 0) return {
				success: false,
				error: "PRODUCT_USED_IN_STOCK"
			};
			if ((await tx.select().from(stockTransfers).where(eq(stockTransfers.productId, data.id)).limit(1)).length > 0) return {
				success: false,
				error: "PRODUCT_USED_IN_STOCK_TRANSFER"
			};
			if ((await tx.select().from(batches).where(eq(batches.productId, data.id)).limit(1)).length > 0) return {
				success: false,
				error: "PRODUCT_USED_IN_BATCH"
			};
			if ((await tx.select().from(orderItems).where(eq(orderItems.productId, data.id)).limit(1)).length > 0) return {
				success: false,
				error: "PRODUCT_USED_IN_SALES"
			};
			if ((await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.productId, data.id)).limit(1)).length > 0) return {
				success: false,
				error: "PRODUCT_USED_IN_PURCHASE"
			};
			if ((await tx.select().from(grnItems).where(eq(grnItems.productId, data.id)).limit(1)).length > 0) return {
				success: false,
				error: "PRODUCT_USED_IN_GRN"
			};
			await tx.delete(products).where(eq(products.id, data.id));
			return { success: true };
		});
	} catch (error) {
		return {
			success: false,
			error: "Failed to delete product"
		};
	}
});
var adjustStockServerFn_createServerFn_handler = createServerRpc({
	id: "148f04b685a0de39f475633eff2061ce8efff7d719d50f8128673688f011d1c4",
	name: "adjustStockServerFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => adjustStockServerFn.__executeServer(opts));
var adjustStockServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(adjustStockServerFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (data.adjustmentQty <= 0) throw new Error("Adjustment quantity must be greater than zero");
	const [branch] = await db.select().from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
	const [product] = await db.select().from(products).where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
	if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");
	await db.transaction(async (tx) => {
		const existing = (await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId))).limit(1))[0];
		const currentStock = existing ? existing.stock : 0;
		const newStock = data.type === "add" ? currentStock + data.adjustmentQty : currentStock - data.adjustmentQty;
		if (newStock < 0) throw new Error("Stock cannot be negative after removal");
		if (existing) await tx.update(stockLevels).set({ stock: newStock }).where(eq(stockLevels.id, existing.id));
		else await tx.insert(stockLevels).values({
			productId: data.productId,
			branchId: data.branchId,
			stock: newStock,
			reorderLevel: 10
		});
	});
	return { success: true };
});
var createBatchServerFn_createServerFn_handler = createServerRpc({
	id: "69e5420b0eafa3013ceff924f8b9d9095813161598aa78747f1ae02ca3b02d41",
	name: "createBatchServerFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createBatchServerFn.__executeServer(opts));
var createBatchServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createBatchServerFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (data.initialStock < 0) throw new Error("Initial stock cannot be negative");
	if (new Date(data.expiryDate) <= /* @__PURE__ */ new Date()) throw new Error("Expiry date must be in the future");
	const [branch] = await db.select().from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
	const [product] = await db.select().from(products).where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
	if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");
	if (product.isBatchTracked === false) throw new Error("Product must have batch tracking enabled");
	await db.transaction(async (tx) => {
		if ((await tx.select().from(batches).where(and(eq(batches.productId, data.productId), eq(batches.branchId, data.branchId), eq(batches.batchNumber, data.batchNumber))).limit(1)).length > 0) throw new Error("Batch number already exists for this branch and product");
		await tx.insert(batches).values({
			productId: data.productId,
			branchId: data.branchId,
			batchNumber: data.batchNumber,
			expiryDate: new Date(data.expiryDate),
			stock: data.initialStock
		});
		if (data.initialStock > 0) {
			const existing = (await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId))).limit(1))[0];
			if (existing) await tx.update(stockLevels).set({ stock: existing.stock + data.initialStock }).where(eq(stockLevels.id, existing.id));
			else await tx.insert(stockLevels).values({
				productId: data.productId,
				branchId: data.branchId,
				stock: data.initialStock,
				reorderLevel: 10
			});
		}
	});
	return { success: true };
});
var createStaffFn_createServerFn_handler = createServerRpc({
	id: "6d82ba81e88ead89227e88652a9f4b9d3dc7718fba784eed64f909e614b30568",
	name: "createStaffFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createStaffFn.__executeServer(opts));
var createStaffFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createStaffFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (!data.name || !data.email) throw new Error("Name and email are required");
	if (!data.branchId) throw new Error("Branch assignment is required");
	if (![
		"branch_manager",
		"inventory_manager",
		"purchasing_officer",
		"cashier"
	].includes(data.role)) throw new Error("Invalid or unauthorized role selected.");
	const [branch] = await db.select().from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
	if (!branch) throw new Error("Invalid or unauthorized branch.");
	const [existingUser] = await db.select().from(staffUsers).where(eq(staffUsers.email, data.email));
	if (existingUser) throw new Error("Email already in use");
	const payload = {
		tenantId,
		name: data.name,
		email: data.email,
		role: data.role,
		branchId: data.branchId
	};
	if (data.role === "cashier") {
		if (!data.pin) throw new Error("PIN is required for Cashier on creation");
		payload.pinHash = await bcryptjs_default.hash(data.pin, 10);
	} else {
		if (!data.password) throw new Error("Password is required on creation");
		payload.passwordHash = await bcryptjs_default.hash(data.password, 10);
	}
	await db.insert(staffUsers).values(payload);
	return { success: true };
});
var deleteStaffFn_createServerFn_handler = createServerRpc({
	id: "ea56662db705471e314aaef937b941b9313921db6dcbba41a81c0f8e24923ba1",
	name: "deleteStaffFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => deleteStaffFn.__executeServer(opts));
var deleteStaffFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteStaffFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const [existing] = await db.select().from(staffUsers).where(and(eq(staffUsers.id, data.id), eq(staffUsers.tenantId, tenantId)));
	if (!existing) throw new Error("Staff not found or unauthorized");
	try {
		await db.delete(staffUsers).where(eq(staffUsers.id, data.id));
		return {
			success: true,
			message: "Staff member deleted successfully."
		};
	} catch (error) {
		if (error.code === "23503" || error.cause && error.cause.code === "23503") {
			await db.update(staffUsers).set({ isActive: false }).where(eq(staffUsers.id, data.id));
			return {
				success: true,
				message: "This staff member cannot be deleted because they have linked records (orders, adjustments, etc). They have been deactivated instead."
			};
		}
		throw error;
	}
});
var updateStaffFn_createServerFn_handler = createServerRpc({
	id: "dbd77c1b566c8ceec9d348ad1b1464558158cc1da046363dea5544a727dd5aa3",
	name: "updateStaffFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateStaffFn.__executeServer(opts));
var updateStaffFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateStaffFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (!data.name || !data.email) throw new Error("Name and email are required");
	if (!data.branchId) throw new Error("Branch assignment is required");
	if (![
		"branch_manager",
		"inventory_manager",
		"purchasing_officer",
		"cashier"
	].includes(data.role)) throw new Error("Invalid or unauthorized role selected.");
	const [existingUser] = await db.select().from(staffUsers).where(and(eq(staffUsers.id, data.id), eq(staffUsers.tenantId, tenantId)));
	if (!existingUser) throw new Error("Staff not found or unauthorized");
	if (existingUser.role === "head_office_admin" || existingUser.role === "super_admin") throw new Error("Cannot modify admin users from this interface.");
	const [branch] = await db.select().from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
	if (!branch) throw new Error("Invalid or unauthorized branch.");
	if (data.email !== existingUser.email) {
		const [duplicateCheck] = await db.select().from(staffUsers).where(eq(staffUsers.email, data.email));
		if (duplicateCheck) throw new Error("Email already in use");
	}
	const updates = {
		name: data.name,
		email: data.email,
		role: data.role,
		branchId: data.branchId,
		isActive: data.isActive
	};
	if (data.role === "cashier" && existingUser.role !== "cashier") {
		if (!data.pin) throw new Error("PIN is required when changing role to Cashier");
		updates.pinHash = await bcryptjs_default.hash(data.pin, 10);
		updates.passwordHash = null;
	} else if (data.role !== "cashier" && existingUser.role === "cashier") {
		if (!data.password) throw new Error("Password is required when changing role from Cashier");
		updates.passwordHash = await bcryptjs_default.hash(data.password, 10);
		updates.pinHash = null;
	} else {
		if (data.password && data.role !== "cashier") updates.passwordHash = await bcryptjs_default.hash(data.password, 10);
		if (data.pin && data.role === "cashier") updates.pinHash = await bcryptjs_default.hash(data.pin, 10);
	}
	await db.update(staffUsers).set(updates).where(eq(staffUsers.id, data.id));
	return { success: true };
});
var createVendorFn_createServerFn_handler = createServerRpc({
	id: "80e4f4986219a594e2deba3e2e3af18e64bebcf89c479af092bcc934b96ec917",
	name: "createVendorFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createVendorFn.__executeServer(opts));
var createVendorFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createVendorFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (!data.name) throw new Error("Vendor name is required");
	const cleanEmail = data.email === "" || data.email === void 0 || data.email === null ? null : data.email;
	if (cleanEmail) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return {
			success: false,
			error: "Invalid email format"
		};
		const [existing] = await db.select().from(vendors).where(eq(vendors.email, cleanEmail));
		if (existing) return {
			success: false,
			error: "Email is already in use by another vendor"
		};
	}
	try {
		await db.insert(vendors).values({
			tenantId,
			name: data.name,
			contact: data.contact || null,
			phone: data.phone || null,
			email: cleanEmail,
			address: data.address || null,
			trn: data.trn || null,
			status: data.status || "Active"
		});
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err.message || "Failed to create vendor"
		};
	}
});
var updateVendorFn_createServerFn_handler = createServerRpc({
	id: "6f3ba453e2be38e2b2273628f3a6ec66adf5da91e6d21a0bbfe8b4893d16d7e1",
	name: "updateVendorFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateVendorFn.__executeServer(opts));
var updateVendorFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateVendorFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const [existingVendor] = await db.select().from(vendors).where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId)));
	if (!existingVendor) throw new Error("Unauthorized or vendor not found");
	if (!data.name) throw new Error("Vendor name is required");
	const cleanEmail = data.email === "" || data.email === void 0 || data.email === null ? null : data.email;
	if (cleanEmail && cleanEmail !== existingVendor.email) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return {
			success: false,
			error: "Invalid email format"
		};
		const [existing] = await db.select().from(vendors).where(eq(vendors.email, cleanEmail));
		if (existing && existing.id !== data.id) return {
			success: false,
			error: "Email is already in use by another vendor"
		};
	}
	try {
		await db.update(vendors).set({
			name: data.name,
			contact: data.contact || null,
			phone: data.phone || null,
			email: cleanEmail,
			address: data.address || null,
			trn: data.trn || null,
			status: data.status || "Active"
		}).where(eq(vendors.id, data.id));
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err.message || "Failed to update vendor"
		};
	}
});
var deleteVendorFn_createServerFn_handler = createServerRpc({
	id: "82753d3c0f594b1ab233184fcdb9f48939fa9c7b6a6ffdffcf1397a9449e8e82",
	name: "deleteVendorFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => deleteVendorFn.__executeServer(opts));
var deleteVendorFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteVendorFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const [existingVendor] = await db.select().from(vendors).where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId)));
	if (!existingVendor) throw new Error("Unauthorized or vendor not found");
	const [poReference] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.vendorId, data.id)).limit(1);
	if (poReference) return {
		success: false,
		error: "VENDOR_USED_IN_PURCHASES"
	};
	const [invoiceReference] = await db.select().from(vendorInvoices).where(eq(vendorInvoices.vendorId, data.id)).limit(1);
	if (invoiceReference) return {
		success: false,
		error: "VENDOR_USED_IN_INVOICES"
	};
	try {
		await db.delete(vendors).where(eq(vendors.id, data.id));
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err.message || "Failed to delete vendor"
		};
	}
});
var toggleRolePermissionFn_createServerFn_handler = createServerRpc({
	id: "265af7d954b59d91ec996643477017319d9f2ca40061ed5e57c336858bdec13a",
	name: "toggleRolePermissionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => toggleRolePermissionFn.__executeServer(opts));
var toggleRolePermissionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(toggleRolePermissionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (data.role === "head_office_admin" || data.role === "super_admin") throw new Error("Permissions for admin roles are locked and cannot be modified.");
	await db.transaction(async (tx) => {
		const existing = await tx.select().from(rolePermissions).where(and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, data.role), eq(rolePermissions.permission, data.permission))).limit(1);
		if (existing.length > 0) await tx.update(rolePermissions).set({ enabled: data.enabled }).where(eq(rolePermissions.id, existing[0].id));
		else await tx.insert(rolePermissions).values({
			tenantId,
			role: data.role,
			permission: data.permission,
			enabled: data.enabled
		});
	});
	return { success: true };
});
var createCustomerFn_createServerFn_handler = createServerRpc({
	id: "b3b7397ea45e8985ea7ffb8aa045e06ef7942bdbdbc24f2a58027c26ced8046b",
	name: "createCustomerFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createCustomerFn.__executeServer(opts));
var createCustomerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createCustomerFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const emailToUse = data.email?.toLowerCase().trim() || null;
	const phoneToUse = data.phone?.trim() || null;
	if (emailToUse) {
		if ((await db.select({ id: customers.id }).from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.email, emailToUse))).limit(1)).length > 0) throw new Error("Email is already in use by another customer in this tenant.");
	}
	if (phoneToUse) {
		if ((await db.select({ id: customers.id }).from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phoneToUse))).limit(1)).length > 0) throw new Error("Phone number is already in use by another customer in this tenant.");
	}
	const [newCustomer] = await db.insert(customers).values({
		tenantId,
		name: data.name,
		phone: phoneToUse,
		email: emailToUse,
		tier: data.tier || "Bronze",
		points: 0,
		storeCredit: "0.00",
		isActive: true
	}).returning();
	await logAuditAction({
		action: "Customer Profile Created",
		entityType: "Customer",
		entityId: newCustomer.id
	});
	return {
		success: true,
		customer: newCustomer
	};
});
var updateCustomerFn_createServerFn_handler = createServerRpc({
	id: "c30e0879dc94cbb39be21780a575970f1d24d2dd2488af086813101e511a26a5",
	name: "updateCustomerFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updateCustomerFn.__executeServer(opts));
var updateCustomerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateCustomerFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const emailToUse = data.email?.toLowerCase().trim() || null;
	const phoneToUse = data.phone?.trim() || null;
	if (emailToUse) {
		if ((await db.select({ id: customers.id }).from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.email, emailToUse), ne(customers.id, data.id))).limit(1)).length > 0) throw new Error("Email is already in use by another customer.");
	}
	if (phoneToUse) {
		if ((await db.select({ id: customers.id }).from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phoneToUse), ne(customers.id, data.id))).limit(1)).length > 0) throw new Error("Phone number is already in use by another customer.");
	}
	const [updated] = await db.update(customers).set({
		name: data.name,
		phone: phoneToUse,
		email: emailToUse,
		isActive: data.isActive !== void 0 ? data.isActive : true
	}).where(and(eq(customers.id, data.id), eq(customers.tenantId, tenantId))).returning();
	if (!updated) throw new Error("Customer not found");
	await logAuditAction({
		action: "Customer Profile Updated",
		entityType: "Customer",
		entityId: updated.id,
		afterValue: { isActive: updated.isActive }
	});
	return {
		success: true,
		customer: updated
	};
});
var getCustomerDetailsFn_createServerFn_handler = createServerRpc({
	id: "520eee03467fb16a8bf28cf6f4336b5e5f6c88e860d7e5729695cac0a4c31436",
	name: "getCustomerDetailsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => getCustomerDetailsFn.__executeServer(opts));
var getCustomerDetailsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getCustomerDetailsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const [customer] = await db.select().from(customers).where(and(eq(customers.id, data.id), eq(customers.tenantId, tenantId)));
	if (!customer) throw new Error("Customer not found");
	return {
		success: true,
		customer
	};
});
var searchCustomersFn_createServerFn_handler = createServerRpc({
	id: "536effb5f3e56056d5fb91bf73a954f100f33431369012f46cc89978fca39595",
	name: "searchCustomersFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => searchCustomersFn.__executeServer(opts));
var searchCustomersFn = createServerFn({ method: "POST" }).validator((d) => d).handler(searchCustomersFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const page = data.page || 1;
	const limit = Math.min(data.limit || 50, 100);
	const offset = (page - 1) * limit;
	const searchTerm = `%${data.search.trim().toLowerCase()}%`;
	return {
		success: true,
		customers: await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), or(ilike(customers.name, searchTerm), ilike(customers.email, searchTerm), ilike(customers.phone, searchTerm)))).limit(limit).offset(offset)
	};
});
var getCustomerPurchaseHistoryFn_createServerFn_handler = createServerRpc({
	id: "dbd858d2dbf8a702dc8692a0310ce8f9be413a4c32d7cedc0b904f9d85cad51d",
	name: "getCustomerPurchaseHistoryFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => getCustomerPurchaseHistoryFn.__executeServer(opts));
var getCustomerPurchaseHistoryFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getCustomerPurchaseHistoryFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const page = data.page || 1;
	const limit = Math.min(data.limit || 50, 100);
	const offset = (page - 1) * limit;
	const customerOrders = await db.select().from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, data.customerId))).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
	const [totalAgg] = await db.select({
		totalSpend: sql`COALESCE(SUM(${orders.total}), 0)`,
		count: sql`COUNT(*)`
	}).from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, data.customerId)));
	return {
		success: true,
		orders: customerOrders,
		totalSpend: Number(totalAgg?.totalSpend || 0),
		orderCount: Number(totalAgg?.count || 0)
	};
});
var accrueLoyaltyPointsFn_createServerFn_handler = createServerRpc({
	id: "61d51b4941028cc136b336978a000bbd254c58ef4cb90845c707cc810104ac7b",
	name: "accrueLoyaltyPointsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => accrueLoyaltyPointsFn.__executeServer(opts));
var accrueLoyaltyPointsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(accrueLoyaltyPointsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	return await db.transaction(async (tx) => {
		const [order] = await tx.select().from(orders).where(and(eq(orders.id, data.orderId), eq(orders.tenantId, tenantId)));
		if (!order) throw new Error("Order not found");
		if (order.status !== "completed") throw new Error("Order is not completed");
		if (!order.customerId) throw new Error("Order has no assigned customer");
		const [settings] = await tx.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId));
		if (!settings) throw new Error("Tenant settings not found");
		const [existingEarn] = await tx.select().from(customerTransactions).where(and(eq(customerTransactions.orderId, order.id), eq(customerTransactions.type, "earn_points")));
		if (existingEarn) return {
			success: true,
			message: "Points already accrued for this order"
		};
		const pointsRate = Number(settings.loyaltyPointsPerAed || 0);
		const pointsToEarn = Math.floor(Number(order.total) * pointsRate);
		if (pointsToEarn <= 0) return {
			success: true,
			pointsEarned: 0
		};
		await tx.insert(customerTransactions).values({
			tenantId,
			customerId: order.customerId,
			orderId: order.id,
			type: "earn_points",
			points: pointsToEarn,
			amount: order.total
		});
		await tx.execute(sql`UPDATE customers SET points = points + ${pointsToEarn} WHERE id = ${order.customerId} AND tenant_id = ${tenantId}`);
		return {
			success: true,
			pointsEarned: pointsToEarn
		};
	});
});
var redeemLoyaltyPointsFn_createServerFn_handler = createServerRpc({
	id: "90fafe76535d7d78a32744dcf0c33ad1d24d3aed94f58e73ebc2ba70e0986efa",
	name: "redeemLoyaltyPointsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => redeemLoyaltyPointsFn.__executeServer(opts));
var redeemLoyaltyPointsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(redeemLoyaltyPointsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (data.pointsToRedeem <= 0) throw new Error("Must redeem a positive number of points");
	return await db.transaction(async (tx) => {
		const [customer] = await tx.select().from(customers).where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)));
		if (!customer) throw new Error("Customer not found");
		if (customer.points < data.pointsToRedeem) throw new Error("Insufficient points balance");
		await tx.execute(sql`UPDATE customers SET points = points - ${data.pointsToRedeem} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
		await tx.insert(customerTransactions).values({
			tenantId,
			customerId: data.customerId,
			orderId: data.orderId || null,
			type: "redeem_points",
			points: -data.pointsToRedeem
		});
		await logAuditAction({
			action: "Points Redeemed",
			entityType: "Customer",
			entityId: data.customerId,
			afterValue: { pointsRedeemed: data.pointsToRedeem }
		});
		return { success: true };
	});
});
var adjustCustomerPointsFn_createServerFn_handler = createServerRpc({
	id: "a9267c3ddd609da201e71d51e26fe5a9745d63fb7afaad4d36d624958109392a",
	name: "adjustCustomerPointsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => adjustCustomerPointsFn.__executeServer(opts));
var adjustCustomerPointsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(adjustCustomerPointsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (data.pointsDelta === 0) throw new Error("Adjustment must be non-zero");
	if (!data.reason?.trim()) throw new Error("Reason is required");
	return await db.transaction(async (tx) => {
		const [customer] = await tx.select().from(customers).where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)));
		if (!customer) throw new Error("Customer not found");
		const newBalance = customer.points + data.pointsDelta;
		if (newBalance < 0) throw new Error("Adjustment would result in negative point balance");
		await tx.execute(sql`UPDATE customers SET points = ${newBalance} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
		await tx.insert(customerTransactions).values({
			tenantId,
			customerId: data.customerId,
			type: "adjust_points",
			points: data.pointsDelta
		});
		await logAuditAction({
			action: "Points Adjusted",
			entityType: "Customer",
			entityId: data.customerId,
			afterValue: {
				delta: data.pointsDelta,
				reason: data.reason
			}
		});
		return {
			success: true,
			newBalance
		};
	});
});
var adjustCustomerBalanceFn_createServerFn_handler = createServerRpc({
	id: "013be2b752e9ef99156ea584262b92507a5ccac64bd84d1663d10e22d3a4e238",
	name: "adjustCustomerBalanceFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => adjustCustomerBalanceFn.__executeServer(opts));
var adjustCustomerBalanceFn = createServerFn({ method: "POST" }).validator((d) => d).handler(adjustCustomerBalanceFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (data.amountDelta === 0) throw new Error("Adjustment must be non-zero");
	if (!data.reason?.trim()) throw new Error("Reason is required");
	return await db.transaction(async (tx) => {
		const [customer] = await tx.select().from(customers).where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)));
		if (!customer) throw new Error("Customer not found");
		const newBalance = Number(customer.storeCredit || 0) + data.amountDelta;
		if (newBalance < 0) throw new Error("Adjustment would result in negative store credit balance");
		await tx.execute(sql`UPDATE customers SET store_credit = ${newBalance.toFixed(2)} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
		await tx.insert(customerTransactions).values({
			tenantId,
			customerId: data.customerId,
			type: data.amountDelta > 0 ? "add_credit" : "use_credit",
			points: 0,
			amount: String(data.amountDelta)
		});
		await logAuditAction({
			action: "Store Credit Adjusted",
			entityType: "Customer",
			entityId: data.customerId,
			afterValue: {
				delta: data.amountDelta,
				reason: data.reason
			}
		});
		return {
			success: true,
			newBalance
		};
	});
});
var createPromotionFn_createServerFn_handler = createServerRpc({
	id: "6620324ec86f59a7b0a47c8e0b6132064767a156d30f1db39f040aab72c2e023",
	name: "createPromotionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => createPromotionFn.__executeServer(opts));
var createPromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createPromotionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (!data.name.trim()) throw new Error("Promotion name is required");
	if (!["Percentage", "Fixed"].includes(data.discountType)) throw new Error("Invalid discount type");
	const value = parseFloat(data.discountValue);
	if (isNaN(value) || value <= 0) throw new Error("Discount value must be positive");
	if (data.discountType === "Percentage" && value > 100) throw new Error("Percentage discount cannot exceed 100%");
	const sDate = new Date(data.startDate);
	const eDate = new Date(data.endDate);
	if (sDate >= eDate) throw new Error("Start date must be before end date");
	if (data.minQty && data.minQty < 1) throw new Error("minQty must be positive");
	if (data.maxQty && data.maxQty < 1) throw new Error("maxQty must be positive");
	if (data.minQty && data.maxQty && data.maxQty < data.minQty) throw new Error("maxQty cannot be lower than minQty");
	if ((await db.select({ id: promotions.id }).from(promotions).where(and(eq(promotions.tenantId, tenantId), ilike(promotions.name, data.name.trim()), ne(promotions.status, "Archived"))).limit(1)).length > 0) throw new Error("A promotion with this exact name already exists. Please choose a unique name.");
	const [newPromo] = await db.insert(promotions).values({
		tenantId,
		name: data.name.trim(),
		discountType: data.discountType,
		discountValue: String(value),
		startDate: sDate,
		endDate: eDate,
		status: "Active",
		target: data.target,
		targetCategory: data.targetCategory?.trim() || null,
		targetProductIds: data.targetProductIds?.trim() || null,
		minQty: data.minQty,
		maxQty: data.maxQty
	}).returning();
	await logAuditAction({
		action: "Promotion Created",
		entityType: "Promotion",
		entityId: newPromo.id,
		summary: `Promotion '${newPromo.name}' created`
	});
	return {
		success: true,
		promotion: newPromo
	};
});
var updatePromotionFn_createServerFn_handler = createServerRpc({
	id: "70dbd634f8a670b136d7fbdf9fad0afdf6032c34ae99ea194deef833983f2622",
	name: "updatePromotionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => updatePromotionFn.__executeServer(opts));
var updatePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updatePromotionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	if (!data.name.trim()) throw new Error("Promotion name is required");
	if (!["Percentage", "Fixed"].includes(data.discountType)) throw new Error("Invalid discount type");
	const value = parseFloat(data.discountValue);
	if (isNaN(value) || value <= 0) throw new Error("Discount value must be positive");
	if (data.discountType === "Percentage" && value > 100) throw new Error("Percentage discount cannot exceed 100%");
	const sDate = new Date(data.startDate);
	const eDate = new Date(data.endDate);
	if (sDate >= eDate) throw new Error("Start date must be before end date");
	if (data.minQty && data.minQty < 1) throw new Error("minQty must be positive");
	if (data.maxQty && data.maxQty < 1) throw new Error("maxQty must be positive");
	if (data.minQty && data.maxQty && data.maxQty < data.minQty) throw new Error("maxQty cannot be lower than minQty");
	if ((await db.select({ id: promotions.id }).from(promotions).where(and(eq(promotions.tenantId, tenantId), ilike(promotions.name, data.name.trim()), ne(promotions.status, "Archived"), ne(promotions.id, data.id))).limit(1)).length > 0) throw new Error("Another promotion with this exact name already exists. Please choose a unique name.");
	const existingList = await db.select({
		id: promotions.id,
		status: promotions.status
	}).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
	if (existingList.length === 0) throw new Error("Promotion not found");
	if (existingList[0].status === "Archived") throw new Error("Cannot update an archived promotion");
	const [updated] = await db.update(promotions).set({
		name: data.name.trim(),
		discountType: data.discountType,
		discountValue: String(value),
		startDate: sDate,
		endDate: eDate,
		target: data.target,
		targetCategory: data.targetCategory?.trim() || null,
		targetProductIds: data.targetProductIds?.trim() || null,
		minQty: data.minQty,
		maxQty: data.maxQty
	}).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).returning();
	await logAuditAction({
		action: "Promotion Updated",
		entityType: "Promotion",
		entityId: updated.id
	});
	return {
		success: true,
		promotion: updated
	};
});
var getPromotionFn_createServerFn_handler = createServerRpc({
	id: "553a08fa248132828e6e93564044a5f5175e4e1431b3178ec80cd9c2bc5dbead",
	name: "getPromotionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => getPromotionFn.__executeServer(opts));
var getPromotionFn = createServerFn({ method: "GET" }).validator((d) => d).handler(getPromotionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const list = await db.select().from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
	if (list.length === 0) throw new Error("Promotion not found");
	return {
		success: true,
		promotion: list[0]
	};
});
var listPromotionsFn_createServerFn_handler = createServerRpc({
	id: "fb2a91af61f992a4cc97117d4d214b127d87e7b1bb8ff330275efd200db93be2",
	name: "listPromotionsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => listPromotionsFn.__executeServer(opts));
var listPromotionsFn = createServerFn({ method: "GET" }).handler(listPromotionsFn_createServerFn_handler, async () => {
	const tenantId = await getHeadOfficeTenant();
	return {
		success: true,
		promotions: await db.select().from(promotions).where(and(eq(promotions.tenantId, tenantId), ne(promotions.status, "Archived"))).orderBy(desc(promotions.createdAt))
	};
});
var activatePromotionFn_createServerFn_handler = createServerRpc({
	id: "4dbf1bf9ecce1e8b154c3bba73dda2398de94948488bde31a72b51ecd9b2f5bd",
	name: "activatePromotionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => activatePromotionFn.__executeServer(opts));
var activatePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(activatePromotionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const list = await db.select({
		id: promotions.id,
		status: promotions.status
	}).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
	if (list.length === 0) throw new Error("Promotion not found");
	if (list[0].status === "Archived") throw new Error("Cannot activate an archived promotion");
	await db.update(promotions).set({ status: "Active" }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId)));
	await logAuditAction({
		action: "Promotion Activated",
		entityType: "Promotion",
		entityId: data.id
	});
	return { success: true };
});
var deactivatePromotionFn_createServerFn_handler = createServerRpc({
	id: "d81218fee0f3c248bd25cba6566a46e66937a30b43e8f5c49bf6510e1a78a754",
	name: "deactivatePromotionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => deactivatePromotionFn.__executeServer(opts));
var deactivatePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deactivatePromotionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const list = await db.select({
		id: promotions.id,
		status: promotions.status
	}).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
	if (list.length === 0) throw new Error("Promotion not found");
	if (list[0].status === "Archived") throw new Error("Cannot deactivate an archived promotion");
	await db.update(promotions).set({ status: "Inactive" }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId)));
	await logAuditAction({
		action: "Promotion Deactivated",
		entityType: "Promotion",
		entityId: data.id
	});
	return { success: true };
});
var archivePromotionFn_createServerFn_handler = createServerRpc({
	id: "8a9393b718da3717be67bcbd8a4b58fd88e36bb491a9d19cf8a9cab9f28a7b6b",
	name: "archivePromotionFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => archivePromotionFn.__executeServer(opts));
var archivePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(archivePromotionFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const list = await db.select({
		id: promotions.id,
		name: promotions.name,
		status: promotions.status
	}).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
	if (list.length === 0) throw new Error("Promotion not found");
	await db.update(promotions).set({ status: "Archived" }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId)));
	await logAuditAction({
		action: "Promotion Archived",
		entityType: "Promotion",
		entityId: data.id,
		summary: `Promotion '${list[0].name}' archived`
	});
	return { success: true };
});
var calculateApplicablePromotionsFn_createServerFn_handler = createServerRpc({
	id: "6ac19b5d163ae7ee3ddcb420776481e2657534e9030d4574bc06e7fa55dad7a8",
	name: "calculateApplicablePromotionsFn",
	filename: "src/lib/head-office-server.ts"
}, (opts) => calculateApplicablePromotionsFn.__executeServer(opts));
var calculateApplicablePromotionsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(calculateApplicablePromotionsFn_createServerFn_handler, async ({ data }) => {
	const tenantId = await getHeadOfficeTenant();
	const now = /* @__PURE__ */ new Date();
	const activePromos = await db.select().from(promotions).where(and(eq(promotions.tenantId, tenantId), eq(promotions.status, "Active"), lte(promotions.startDate, now), gte(promotions.endDate, now)));
	return {
		success: true,
		results: data.items.map((item) => {
			let bestDiscount = 0;
			let bestPromo = null;
			const price = parseFloat(item.originalPrice);
			if (isNaN(price) || price < 0) return {
				...item,
				discountAmount: "0.00",
				finalPrice: item.originalPrice,
				promotionId: null,
				promotionName: null,
				reason: "Invalid original price"
			};
			for (const promo of activePromos) {
				if (promo.minQty && item.quantity < promo.minQty) continue;
				if (promo.maxQty && item.quantity > promo.maxQty) continue;
				let matches = false;
				if (promo.target === "All") matches = true;
				else if (promo.target === "Product" && promo.targetProductIds) {
					if (promo.targetProductIds.split(",").map((i) => i.trim()).includes(item.productId)) matches = true;
				} else if (promo.target === "Category" && promo.targetCategory) {
					if (item.categoryId === promo.targetCategory) matches = true;
				}
				if (!matches) continue;
				const pValue = parseFloat(promo.discountValue);
				let potentialDiscount = 0;
				if (promo.discountType === "Percentage") potentialDiscount = price * (pValue / 100);
				else if (promo.discountType === "Fixed") potentialDiscount = pValue;
				if (potentialDiscount > price) potentialDiscount = price;
				if (potentialDiscount > bestDiscount) {
					bestDiscount = potentialDiscount;
					bestPromo = promo;
				} else if (potentialDiscount === bestDiscount && potentialDiscount > 0) {
					if (bestPromo && promo.createdAt < bestPromo.createdAt) bestPromo = promo;
				}
			}
			const finalPrice = price - bestDiscount;
			if (bestPromo) return {
				productId: item.productId,
				originalPrice: item.originalPrice,
				promotionId: bestPromo.id,
				promotionName: bestPromo.name,
				discountType: bestPromo.discountType,
				discountAmount: bestDiscount.toFixed(2),
				finalPrice: finalPrice.toFixed(2),
				reason: "Best discount applied"
			};
			return {
				productId: item.productId,
				originalPrice: item.originalPrice,
				promotionId: null,
				promotionName: null,
				discountType: null,
				discountAmount: "0.00",
				finalPrice: price.toFixed(2),
				reason: "No matching active promotion"
			};
		})
	};
});
//#endregion
export { accrueLoyaltyPointsFn_createServerFn_handler, activateBranchFn_createServerFn_handler, activatePromotionFn_createServerFn_handler, adjustCustomerBalanceFn_createServerFn_handler, adjustCustomerPointsFn_createServerFn_handler, adjustStockServerFn_createServerFn_handler, applyClearanceFn_createServerFn_handler, archivePromotionFn_createServerFn_handler, calculateApplicablePromotionsFn_createServerFn_handler, createBatchServerFn_createServerFn_handler, createBranchForTenantFn_createServerFn_handler, createCampaignFn_createServerFn_handler, createCustomerFn_createServerFn_handler, createPoFn_createServerFn_handler, createProductFn_createServerFn_handler, createPromotionFn_createServerFn_handler, createStaffFn_createServerFn_handler, createVendorFn_createServerFn_handler, deactivateBranchFn_createServerFn_handler, deactivatePromotionFn_createServerFn_handler, deleteProductFn_createServerFn_handler, deleteStaffFn_createServerFn_handler, deleteVendorFn_createServerFn_handler, getBranchDetailsFn_createServerFn_handler, getCustomerDetailsFn_createServerFn_handler, getCustomerPurchaseHistoryFn_createServerFn_handler, getHeadOfficeDataFn_createServerFn_handler, getPromotionFn_createServerFn_handler, handleOverrideRequestFn_createServerFn_handler, listPromotionsFn_createServerFn_handler, redeemLoyaltyPointsFn_createServerFn_handler, searchCustomersFn_createServerFn_handler, toggleRolePermissionFn_createServerFn_handler, updateBranchFn_createServerFn_handler, updateCustomerFn_createServerFn_handler, updateLoyaltySettingsFn_createServerFn_handler, updatePriceOverrideFn_createServerFn_handler, updateProductFn_createServerFn_handler, updatePromotionFn_createServerFn_handler, updateStaffFn_createServerFn_handler, updateStockFn_createServerFn_handler, updateVatSettingsFn_createServerFn_handler, updateVendorFn_createServerFn_handler };
