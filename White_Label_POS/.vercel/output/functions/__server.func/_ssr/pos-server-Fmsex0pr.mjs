import { r as createServerFn } from "./server-BlyqvE9x.mjs";
import { r as getSessionServerFn } from "./auth-server-CSle8uu9.mjs";
import { a as eq, f as ne, i as and, o as gt, r as desc, s as gte, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { A as tenantSettings, L as createServerRpc, M as tills, N as unitConversions, O as stockLevels, T as shifts, _ as productBarcodes, a as customerTransactions, b as promotions, f as orderItems, j as tenants, l as inventoryLedger, m as orders, o as customers, p as orderPayments, r as batches, t as db, u as invoiceSequences, v as productVariants, y as products } from "./db-D6V11D2M.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pos-server-Fmsex0pr.js
async function getPosContext() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Cashier" && res.session.role !== "Branch Manager") throw new Error("Unauthorized");
	if (!res.session.branchId) throw new Error("Cashier must be assigned to a branch");
	return {
		tenantId: res.session.tenantId,
		branchId: res.session.branchId,
		cashierId: res.session.id,
		tillId: res.session.tillId || null
	};
}
var getPosCatalogServerFn_createServerFn_handler = createServerRpc({
	id: "b116881fb6043bfe519e458a2d633897c4dc063e4925ae6afdb22f3f931c17f6",
	name: "getPosCatalogServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => getPosCatalogServerFn.__executeServer(opts));
var getPosCatalogServerFn = createServerFn({ method: "GET" }).handler(getPosCatalogServerFn_createServerFn_handler, async () => {
	const { tenantId, branchId } = await getPosContext();
	const [catalog, dbBarcodes, dbVariants, dbConversions] = await Promise.all([
		db.select({
			id: products.id,
			name: products.name,
			category: products.category,
			barcode: products.barcode,
			sku: products.barcode,
			unit: products.unit,
			basePrice: products.salePrice,
			stock: stockLevels.stock,
			priceOverride: stockLevels.priceOverride
		}).from(products).innerJoin(stockLevels, and(eq(stockLevels.productId, products.id), eq(stockLevels.branchId, branchId))).where(eq(products.tenantId, tenantId)),
		db.select().from(productBarcodes),
		db.select().from(productVariants),
		db.select().from(unitConversions)
	]);
	const catalogWithDetails = catalog.map((item) => {
		const alternateBarcodes = dbBarcodes.filter((b) => b.productId === item.id).map((b) => b.barcode);
		const variants = dbVariants.filter((v) => v.productId === item.id).map((v) => ({
			variantName: v.variantName,
			variantValue: v.variantValue,
			sku: v.sku,
			priceAdjustment: v.priceAdjustment
		}));
		const conversions = dbConversions.filter((c) => c.productId === item.id).map((c) => ({
			fromUnit: c.fromUnit,
			toUnit: c.toUnit,
			conversionFactor: c.conversionFactor
		}));
		return {
			...item,
			alternateBarcodes,
			variants,
			conversions
		};
	});
	const dbPromotions = await db.query.promotions.findMany({ where: eq(promotions.tenantId, tenantId) });
	return {
		catalog: JSON.parse(JSON.stringify(catalogWithDetails)),
		promotions: JSON.parse(JSON.stringify(dbPromotions))
	};
});
var openShiftServerFn_createServerFn_handler = createServerRpc({
	id: "768e9878293484dded9c758e9b59a11433e70d1fa2edb65fc04d359e1aa6b8ae",
	name: "openShiftServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => openShiftServerFn.__executeServer(opts));
var openShiftServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(openShiftServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId, cashierId, tillId: sessionTillId } = await getPosContext();
	const activeTillId = data.tillId || sessionTillId;
	if (!activeTillId) throw new Error("Till assignment is required to open a shift.");
	const till = await db.query.tills.findFirst({ where: and(eq(tills.id, activeTillId), eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)) });
	if (!till) throw new Error("Invalid or unauthorized till terminal selection.");
	const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const scheduledShift = await db.query.shifts.findFirst({ where: and(eq(shifts.cashierId, cashierId), eq(shifts.shiftDate, today), eq(shifts.status, "Scheduled")) });
	if (scheduledShift && scheduledShift.tillId !== activeTillId && scheduledShift.tillId !== till.name) throw new Error("The selected till terminal does not match your scheduled shift assignment.");
	const activeTillShift = await db.query.shifts.findFirst({ where: and(eq(shifts.tillId, activeTillId), eq(shifts.status, "Open")) });
	if (activeTillShift && activeTillShift.cashierId !== cashierId) throw new Error("This till terminal is currently in use by another cashier.");
	if (await db.query.shifts.findFirst({ where: and(eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")) })) throw new Error("You already have an open shift.");
	const [newShift] = await db.insert(shifts).values({
		tenantId,
		branchId,
		cashierId,
		openingFloat: data.openingFloat.toString(),
		status: "Open",
		tillId: activeTillId,
		openedAt: /* @__PURE__ */ new Date()
	}).returning({ id: shifts.id });
	if (!newShift) throw new Error("Failed to open shift.");
	return {
		success: true,
		shiftId: newShift.id
	};
});
var getActiveShiftServerFn_createServerFn_handler = createServerRpc({
	id: "d833dce8ec6dc143159fa6b681e5d210d665817a0da0d6d9d4420d8f133208d0",
	name: "getActiveShiftServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => getActiveShiftServerFn.__executeServer(opts));
var getActiveShiftServerFn = createServerFn({ method: "GET" }).handler(getActiveShiftServerFn_createServerFn_handler, async () => {
	const { cashierId } = await getPosContext();
	const activeShift = await db.query.shifts.findFirst({
		where: and(eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")),
		with: {
			branch: true,
			cashier: true
		}
	});
	const shiftStats = {
		transactions: 0,
		itemsSold: 0,
		avgBasket: 0,
		voids: 0,
		refunds: 0,
		vatCollected: 0
	};
	if (activeShift) {
		const shiftOrders = await db.query.orders.findMany({
			where: and(eq(orders.cashierId, cashierId), eq(orders.status, "completed"), gte(orders.createdAt, new Date(activeShift.openedAt))),
			with: { items: true }
		});
		shiftStats.transactions = shiftOrders.length;
		shiftStats.itemsSold = shiftOrders.reduce((acc, order) => acc + order.items.reduce((s, item) => s + item.qty, 0), 0);
		const totalSales = shiftOrders.reduce((acc, order) => acc + Number(order.total), 0);
		shiftStats.avgBasket = shiftStats.transactions > 0 ? totalSales / shiftStats.transactions : 0;
		shiftStats.vatCollected = shiftOrders.reduce((acc, order) => acc + Number(order.vat), 0);
	}
	let trn = null;
	if (activeShift) {
		const setting = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, activeShift.tenantId) });
		if (setting) trn = setting.trn;
	}
	return JSON.parse(JSON.stringify({ shift: activeShift ? {
		...activeShift,
		stats: shiftStats,
		trn
	} : null }));
});
var recordCashDropServerFn_createServerFn_handler = createServerRpc({
	id: "2fcc2769efee5348114caab28acbd73be38f33b93d196b6b840569bdad5528e1",
	name: "recordCashDropServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => recordCashDropServerFn.__executeServer(opts));
var recordCashDropServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(recordCashDropServerFn_createServerFn_handler, async ({ data }) => {
	const { cashierId } = await getPosContext();
	const activeShift = await db.query.shifts.findFirst({ where: and(eq(shifts.id, data.shiftId), eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")) });
	if (!activeShift) throw new Error("Active shift not found.");
	const drops = JSON.parse(activeShift.cashDrops || "[]");
	drops.push({
		amount: data.amount,
		reason: data.reason,
		time: (/* @__PURE__ */ new Date()).toISOString()
	});
	await db.update(shifts).set({ cashDrops: JSON.stringify(drops) }).where(eq(shifts.id, data.shiftId));
	return { success: true };
});
var closeShiftServerFn_createServerFn_handler = createServerRpc({
	id: "f912af60c6d6833b47b26a5e5f7262fb18a1906ca0f045ed7e7b83c445bbddb9",
	name: "closeShiftServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => closeShiftServerFn.__executeServer(opts));
var closeShiftServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(closeShiftServerFn_createServerFn_handler, async ({ data }) => {
	const { cashierId } = await getPosContext();
	const activeShift = await db.query.shifts.findFirst({ where: and(eq(shifts.id, data.shiftId), eq(shifts.cashierId, cashierId), eq(shifts.status, "Open")) });
	if (!activeShift) throw new Error("Active shift not found.");
	const totalDrops = JSON.parse(activeShift.cashDrops || "[]").reduce((acc, d) => acc + d.amount, 0);
	const totalCashSales = (await db.query.orders.findMany({
		where: and(eq(orders.cashierId, cashierId), eq(orders.status, "completed"), gte(orders.createdAt, new Date(activeShift.openedAt))),
		with: { payments: true }
	})).reduce((acc, order) => {
		return acc + order.payments.filter((p) => p.method === "Cash").reduce((s, p) => s + Number(p.amount), 0);
	}, 0);
	const expectedCash = Number(activeShift.openingFloat) + totalCashSales - totalDrops;
	await db.update(shifts).set({
		status: "Closed",
		closedAt: /* @__PURE__ */ new Date(),
		actualCash: data.actualCash.toString(),
		expectedCash: expectedCash.toString()
	}).where(eq(shifts.id, data.shiftId));
	return {
		success: true,
		variance: data.actualCash - expectedCash
	};
});
var searchPosCustomersFn_createServerFn_handler = createServerRpc({
	id: "a565152122d5f42bb3fc3e0b88144309f151ff65b9bebf2ac0ab69ba68d9c38b",
	name: "searchPosCustomersFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => searchPosCustomersFn.__executeServer(opts));
var searchPosCustomersFn = createServerFn({ method: "POST" }).validator((d) => d).handler(searchPosCustomersFn_createServerFn_handler, async ({ data }) => {
	const { tenantId } = await getPosContext();
	if (!data.term || data.term.length < 2) return {
		success: true,
		customers: []
	};
	const searchStr = `%${data.term.toLowerCase()}%`;
	return {
		success: true,
		customers: await db.select({
			id: customers.id,
			name: customers.name,
			phone: customers.phone,
			email: customers.email,
			points: customers.points,
			storeCredit: customers.storeCredit,
			tier: customers.tier
		}).from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.isActive, true), sql`LOWER(${customers.name}) LIKE ${searchStr} OR LOWER(${customers.phone}) LIKE ${searchStr} OR LOWER(${customers.email}) LIKE ${searchStr}`)).limit(10)
	};
});
var checkoutServerFn_createServerFn_handler = createServerRpc({
	id: "d0272c20467dadca6bb9bf2864cd5967d07f4d7394c5a81060bc41392231a3f0",
	name: "checkoutServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => checkoutServerFn.__executeServer(opts));
var checkoutServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(checkoutServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId, cashierId } = await getPosContext();
	const activeShift = await db.query.shifts.findFirst({ where: and(eq(shifts.cashierId, cashierId), eq(shifts.branchId, branchId), eq(shifts.tenantId, tenantId), eq(shifts.status, "Open")) });
	if (!activeShift) throw new Error("Please open a cash shift before completing this payment.");
	const activeTillId = activeShift.tillId;
	if (!activeTillId) throw new Error("No active till session found for checkout.");
	if (!await db.query.tills.findFirst({ where: and(eq(tills.id, activeTillId), eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)) })) throw new Error("Unauthorized: Till terminal assignment is invalid.");
	if (data.idempotencyKey) {
		const existingOrder = await db.query.orders.findFirst({ where: and(eq(orders.idempotencyKey, data.idempotencyKey), eq(orders.tenantId, tenantId)) });
		if (existingOrder) return {
			success: true,
			orderId: existingOrder.id
		};
	}
	const allowedMethods = [
		"Cash",
		"Card",
		"Loyalty Points",
		"Store Credit"
	];
	if (!data.payments || data.payments.length === 0) throw new Error("Select a payment method.");
	let allocatedTotal = 0;
	for (const p of data.payments) {
		if (p.amount <= 0) throw new Error("Invalid payment amount.");
		if (!allowedMethods.includes(p.method)) throw new Error(`Invalid payment method: ${p.method}`);
		allocatedTotal += Number(p.amount);
	}
	if (Math.abs(allocatedTotal - data.total) > .01) throw new Error("Allocate the full amount before completing payment.");
	let orderId;
	await db.transaction(async (tx) => {
		const [tenantRec] = await tx.select({ monthlyOrderLimit: tenants.monthlyOrderLimit }).from(tenants).where(eq(tenants.id, tenantId)).for("update");
		if (!tenantRec) throw new Error("Tenant not found.");
		let activeCustomer = null;
		let pointsToRedeem = 0;
		let creditToRedeem = 0;
		let pointsAmount = 0;
		const tenantSetting = (await tx.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1))[0];
		if (!tenantSetting) throw new Error("Tenant settings not found.");
		if (data.customerId) {
			const [customerRec] = await tx.select().from(customers).where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId))).for("update");
			if (!customerRec) throw new Error("Customer not found.");
			if (!customerRec.isActive) throw new Error("Customer is not active.");
			activeCustomer = customerRec;
		}
		for (const p of data.payments) {
			if (p.method === "Store Credit") {
				if (!activeCustomer) throw new Error("Store Credit requires an active customer.");
				if (Number(activeCustomer.storeCredit) < p.amount) throw new Error("Insufficient store credit.");
				creditToRedeem += p.amount;
			}
			if (p.method === "Loyalty Points") {
				if (!activeCustomer) throw new Error("Loyalty Points requires an active customer.");
				const pointsRequired = Math.ceil(p.amount / Number(tenantSetting.loyaltyRedemptionRate));
				if (pointsRequired > activeCustomer.points) throw new Error("Insufficient loyalty points.");
				pointsToRedeem += pointsRequired;
				pointsAmount += p.amount;
			}
		}
		if (creditToRedeem > 0) await tx.execute(sql`UPDATE customers SET store_credit = store_credit - ${creditToRedeem} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
		if (pointsToRedeem > 0) await tx.execute(sql`UPDATE customers SET points = points - ${pointsToRedeem} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
		const uaeDateStr = (/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Asia/Dubai" });
		const uaeDate = new Date(uaeDateStr);
		const startOfMonthUae = new Date(uaeDate.getFullYear(), uaeDate.getMonth(), 1);
		const startOfMonthUtc = /* @__PURE__ */ new Date(startOfMonthUae.getTime() - 144e5);
		if ((await tx.select({ count: sql`count(*)::int` }).from(orders).where(and(eq(orders.tenantId, tenantId), sql`${orders.createdAt} >= ${startOfMonthUtc.toISOString()}`, ne(orders.status, "voided"))))[0].count >= tenantRec.monthlyOrderLimit) throw new Error("Monthly order limit reached for this tenant.");
		const seqResult = await tx.insert(invoiceSequences).values({
			tenantId,
			currentValue: 1
		}).onConflictDoUpdate({
			target: invoiceSequences.tenantId,
			set: { currentValue: sql`${invoiceSequences.currentValue} + 1` }
		}).returning({ val: invoiceSequences.currentValue });
		const invNumber = `INV-${uaeDate.getFullYear()}-${seqResult[0].val.toString().padStart(5, "0")}`;
		const [newOrder] = await tx.insert(orders).values({
			tenantId,
			branchId,
			cashierId,
			tillId: activeTillId,
			customerId: data.customerId || null,
			subtotal: data.subtotal.toString(),
			vat: data.vat.toString(),
			total: data.total.toString(),
			cashReceived: data.cashReceived ? data.cashReceived.toString() : null,
			changeGiven: data.changeGiven ? data.changeGiven.toString() : null,
			idempotencyKey: data.idempotencyKey || null,
			invoiceNumber: invNumber,
			status: "completed"
		}).returning({ id: orders.id });
		if (!newOrder) throw new Error("Failed to create order.");
		orderId = newOrder.id;
		const paymentRecords = data.payments.map((p) => ({
			orderId: newOrder.id,
			method: p.method,
			amount: p.amount.toString()
		}));
		await tx.insert(orderPayments).values(paymentRecords);
		const itemRecords = data.items.map((item) => ({
			orderId: newOrder.id,
			productId: item.productId,
			qty: item.qty,
			unitPrice: item.unitPrice.toString()
		}));
		await tx.insert(orderItems).values(itemRecords);
		if (creditToRedeem > 0) await tx.insert(customerTransactions).values({
			tenantId,
			customerId: data.customerId,
			orderId: newOrder.id,
			type: "use_credit",
			points: 0,
			amount: creditToRedeem.toString()
		});
		if (pointsToRedeem > 0) await tx.insert(customerTransactions).values({
			tenantId,
			customerId: data.customerId,
			orderId: newOrder.id,
			type: "redeem_points",
			points: -pointsToRedeem,
			amount: pointsAmount.toString()
		});
		if (activeCustomer) {
			const pointsRate = Number(tenantSetting.loyaltyPointsPerAed || 0);
			const pointsToEarn = Math.floor(Number(data.total) * pointsRate);
			if (pointsToEarn > 0) {
				await tx.insert(customerTransactions).values({
					tenantId,
					customerId: data.customerId,
					orderId: newOrder.id,
					type: "earn_points",
					points: pointsToEarn,
					amount: data.total.toString()
				});
				await tx.execute(sql`UPDATE customers SET points = points + ${pointsToEarn} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
			}
		}
		for (const item of data.items) {
			const [product] = await tx.select({
				isBatchTracked: products.isBatchTracked,
				name: products.name
			}).from(products).where(eq(products.id, item.productId)).limit(1);
			if (!product) throw new Error("Product not found");
			const factor = item.conversionFactor ? Number(item.conversionFactor) : 1;
			const baseQtyToDeduct = item.qty * factor;
			if (product.isBatchTracked) {
				const availableBatches = await tx.select().from(batches).where(and(eq(batches.productId, item.productId), eq(batches.branchId, branchId), gt(batches.stock, 0))).orderBy(sql`${batches.expiryDate} ASC NULLS LAST`).for("update");
				let remainingQtyToDeduct = baseQtyToDeduct;
				const now = /* @__PURE__ */ new Date();
				for (const batch of availableBatches) {
					if (remainingQtyToDeduct <= 0) break;
					if (new Date(batch.expiryDate) <= now) continue;
					const deduct = Math.min(batch.stock, remainingQtyToDeduct);
					await tx.update(batches).set({ stock: sql`${batches.stock} - ${deduct}` }).where(eq(batches.id, batch.id));
					await tx.insert(inventoryLedger).values({
						tenantId,
						branchId,
						productId: item.productId,
						batchId: batch.id,
						transactionType: "Sale",
						previousQuantity: batch.stock,
						changedQuantity: -deduct,
						newQuantity: batch.stock - deduct,
						referenceId: orderId,
						createdBy: cashierId
					});
					remainingQtyToDeduct -= deduct;
				}
				if (remainingQtyToDeduct > 0) throw new Error(`Cannot fulfill ${item.qty} ${item.unit || ""} of ${product.name} because remaining stock is either expired or insufficient.`);
			}
			if ((await tx.update(stockLevels).set({ stock: sql`${stockLevels.stock} - ${baseQtyToDeduct}` }).where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, branchId), gte(stockLevels.stock, baseQtyToDeduct))).returning({ id: stockLevels.id })).length === 0) throw new Error(`Insufficient non-batch stock for ${product.name}`);
		}
	});
	return {
		success: true,
		orderId
	};
});
var generateShiftReportFn_createServerFn_handler = createServerRpc({
	id: "e1a4abab4de0b5bbb6a57acfbfb74a3bb1779d8c900c493949e5e5a76f5722fa",
	name: "generateShiftReportFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => generateShiftReportFn.__executeServer(opts));
var generateShiftReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(generateShiftReportFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId, cashierId } = await getPosContext();
	const activeShift = await db.query.shifts.findFirst({
		where: and(eq(shifts.id, data.shiftId), eq(shifts.cashierId, cashierId)),
		with: {
			branch: true,
			cashier: true
		}
	});
	if (!activeShift) throw new Error("Shift not found.");
	const matchedTill = await db.query.tills.findFirst({ where: and(eq(tills.id, activeShift.tillId || ""), eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)) });
	const shiftOrders = await db.query.orders.findMany({
		where: and(eq(orders.cashierId, cashierId), eq(orders.status, "completed"), gte(orders.createdAt, new Date(activeShift.openedAt))),
		with: {
			items: true,
			payments: true
		}
	});
	const transactionCount = shiftOrders.length;
	const itemsSold = shiftOrders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.qty, 0), 0);
	const salesTotal = shiftOrders.reduce((acc, o) => acc + Number(o.total), 0);
	const avgBasket = transactionCount > 0 ? salesTotal / transactionCount : 0;
	const vatCollected = shiftOrders.reduce((acc, o) => acc + Number(o.vat), 0);
	let cashTotal = 0;
	let cardTotal = 0;
	let pointsTotal = 0;
	let creditTotal = 0;
	for (const o of shiftOrders) for (const p of o.payments) {
		const amt = Number(p.amount);
		if (p.method === "Cash") cashTotal += amt;
		else if (p.method === "Card") cardTotal += amt;
		else if (p.method === "Loyalty Points") pointsTotal += amt;
		else if (p.method === "Store Credit") creditTotal += amt;
	}
	const totalDrops = JSON.parse(activeShift.cashDrops || "[]").reduce((acc, d) => acc + d.amount, 0);
	return {
		success: true,
		report: {
			shiftId: activeShift.id,
			status: activeShift.status,
			openedAt: activeShift.openedAt,
			closedAt: activeShift.closedAt,
			branchName: activeShift.branch?.name || "Branch",
			cashierName: activeShift.cashier?.name || "Cashier",
			tillName: matchedTill?.name || activeShift.tillId || "Till Terminal",
			openingFloat: Number(activeShift.openingFloat),
			totalDrops,
			transactionCount,
			itemsSold,
			salesTotal,
			avgBasket,
			vatCollected,
			cashTotal,
			cardTotal,
			pointsTotal,
			creditTotal,
			expectedCash: Number(activeShift.openingFloat) + cashTotal - totalDrops,
			voids: 0,
			refunds: 0
		}
	};
});
var getBranchTillsServerFn_createServerFn_handler = createServerRpc({
	id: "26d6cd683c1ea2eb4119adf59cc2b8ce4d537263453c8a14908305855d9c4539",
	name: "getBranchTillsServerFn",
	filename: "src/lib/pos-server.ts"
}, (opts) => getBranchTillsServerFn.__executeServer(opts));
var getBranchTillsServerFn = createServerFn({ method: "GET" }).handler(getBranchTillsServerFn_createServerFn_handler, async () => {
	const { tenantId, branchId } = await getPosContext();
	return {
		success: true,
		tills: await db.query.tills.findMany({
			where: and(eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)),
			orderBy: [desc(tills.createdAt)]
		})
	};
});
//#endregion
export { checkoutServerFn_createServerFn_handler, closeShiftServerFn_createServerFn_handler, generateShiftReportFn_createServerFn_handler, getActiveShiftServerFn_createServerFn_handler, getBranchTillsServerFn_createServerFn_handler, getPosCatalogServerFn_createServerFn_handler, openShiftServerFn_createServerFn_handler, recordCashDropServerFn_createServerFn_handler, searchPosCustomersFn_createServerFn_handler };
