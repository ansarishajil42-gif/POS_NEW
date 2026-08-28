import { r as createServerFn } from "./server-BlyqvE9x.mjs";
import { r as getSessionServerFn } from "./auth-server-CSle8uu9.mjs";
import { a as eq, i as and, l as inArray, r as desc, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { A as tenantSettings, F as vendorPayments, I as vendors, L as createServerRpc, O as stockLevels, P as vendorInvoices, S as purchaseOrders, c as grnItems, i as branches, j as tenants, n as auditLogs, r as batches, s as grn, t as db, x as purchaseOrderItems, y as products } from "./db-D6V11D2M.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/purchasing-server-CY1vGdtu.js
async function getPurchasingContext() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Purchasing Officer" && res.session.role !== "Head Office Admin") throw new Error("Unauthorized");
	return {
		tenantId: res.session.tenantId,
		user: res.session
	};
}
async function getFinanceContext() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Head Office Admin") throw new Error("Only authorized finance personnel (Head Office Admin) can record payments.");
	return {
		tenantId: res.session.tenantId,
		user: res.session
	};
}
var getPurchasingDataServerFn_createServerFn_handler = createServerRpc({
	id: "e120523c02615bc4f341f67ba9e18dec26dd92687884ed3ae320da9ee1941f8f",
	name: "getPurchasingDataServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => getPurchasingDataServerFn.__executeServer(opts));
var getPurchasingDataServerFn = createServerFn({ method: "GET" }).handler(getPurchasingDataServerFn_createServerFn_handler, async () => {
	const { tenantId, user } = await getPurchasingContext();
	const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
	const allVendors = await db.query.vendors.findMany({ where: eq(vendors.tenantId, tenantId) });
	const allBranches = await db.query.branches.findMany({ where: eq(branches.tenantId, tenantId) });
	const allProducts = await db.query.products.findMany({ where: eq(products.tenantId, tenantId) });
	const allPOs = await db.query.purchaseOrders.findMany({
		where: eq(purchaseOrders.tenantId, tenantId),
		orderBy: [desc(purchaseOrders.createdAt)],
		with: {
			vendor: true,
			branch: true,
			items: { with: { product: true } }
		}
	});
	const allGRNs = await db.query.grn.findMany({
		where: eq(grn.tenantId, tenantId),
		orderBy: [desc(grn.receivedAt)],
		with: {
			vendor: true,
			branch: true,
			purchaseOrder: true,
			items: { with: { product: true } }
		}
	});
	const allInvoices = await db.query.vendorInvoices.findMany({
		where: eq(vendorInvoices.tenantId, tenantId),
		orderBy: [desc(vendorInvoices.createdAt)],
		with: {
			vendor: true,
			purchaseOrder: true
		}
	});
	const allPayments = await db.query.vendorPayments.findMany({
		where: eq(vendorPayments.tenantId, tenantId),
		orderBy: [desc(vendorPayments.paymentDate)]
	});
	return JSON.parse(JSON.stringify({
		tenant,
		userRole: user.role,
		vendors: allVendors,
		products: allProducts,
		branches: allBranches,
		purchaseOrders: allPOs,
		grns: allGRNs,
		invoices: allInvoices,
		payments: allPayments
	}));
});
var createVendorServerFn_createServerFn_handler = createServerRpc({
	id: "5b4d5a14987c0106e76b2bdd4f8b245acb8f304e86ea09c8f3c140a7f83c9c7b",
	name: "createVendorServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => createVendorServerFn.__executeServer(opts));
var createVendorServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createVendorServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	if (!data.name || data.name.trim() === "") throw new Error("Vendor name is required");
	if (data.email) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error("Invalid email format");
		if (await db.query.vendors.findFirst({ where: eq(vendors.email, data.email) })) throw new Error("A vendor with this email already exists");
	}
	const [newVendor] = await db.insert(vendors).values({
		tenantId,
		name: data.name.trim(),
		contact: data.contact?.trim() || null,
		phone: data.phone?.trim() || null,
		email: data.email?.trim() || null,
		trn: data.trn?.trim() || null,
		address: data.address?.trim() || null,
		status: data.status || "Active"
	}).returning({ id: vendors.id });
	if (user && newVendor) await db.insert(auditLogs).values({
		tenantId,
		userId: user.id,
		action: "CREATED",
		entityType: "VENDOR",
		entityId: newVendor.id,
		details: {
			name: data.name,
			status: data.status || "Active"
		}
	});
	if (!newVendor) throw new Error("Failed to insert vendor.");
	return {
		success: true,
		vendorId: newVendor.id
	};
});
var updateVendorServerFn_createServerFn_handler = createServerRpc({
	id: "b2d816eebf0d34a3ac413eb5fa41d94f384d0a8ee482d3e9accd6b60d89c46a8",
	name: "updateVendorServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => updateVendorServerFn.__executeServer(opts));
var updateVendorServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateVendorServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	if (!data.id) throw new Error("Vendor ID is required");
	if (!data.name || data.name.trim() === "") throw new Error("Vendor name is required");
	if (data.email) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error("Invalid email format");
		const existingVendor = await db.query.vendors.findFirst({ where: and(eq(vendors.email, data.email), eq(vendors.tenantId, tenantId)) });
		if (existingVendor && existingVendor.id !== data.id) throw new Error("A vendor with this email already exists");
	}
	const [updatedVendor] = await db.update(vendors).set({
		name: data.name.trim(),
		contact: data.contact?.trim() || null,
		phone: data.phone?.trim() || null,
		email: data.email?.trim() || null,
		trn: data.trn?.trim() || null,
		address: data.address?.trim() || null,
		status: data.status || "Active"
	}).where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId))).returning({ id: vendors.id });
	if (!updatedVendor) throw new Error("Vendor not found or access denied");
	if (user) await db.insert(auditLogs).values({
		tenantId,
		userId: user.id,
		action: "EDITED",
		entityType: "VENDOR",
		entityId: data.id,
		details: {
			name: data.name,
			status: data.status || "Active"
		}
	});
	return { success: true };
});
var deleteVendorServerFn_createServerFn_handler = createServerRpc({
	id: "62ed1df55aafe4a8f518aa3b2f4e8930018985684abb3b7c439b34f1524a28e1",
	name: "deleteVendorServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => deleteVendorServerFn.__executeServer(opts));
var deleteVendorServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteVendorServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	if (!data.id) throw new Error("Vendor ID is required");
	if (await db.query.purchaseOrders.findFirst({ where: and(eq(purchaseOrders.vendorId, data.id), eq(purchaseOrders.tenantId, tenantId)) })) throw new Error("Cannot delete vendor. There are purchase orders linked to this vendor.");
	const [deletedVendor] = await db.delete(vendors).where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId))).returning({ id: vendors.id });
	if (!deletedVendor) throw new Error("Vendor not found or access denied");
	if (user) await db.insert(auditLogs).values({
		tenantId,
		userId: user.id,
		action: "DELETED",
		entityType: "VENDOR",
		entityId: data.id,
		details: { deleted: true }
	});
	return { success: true };
});
var getPODetailsServerFn_createServerFn_handler = createServerRpc({
	id: "6a39cf59f744b150d1d658cb6b77b0cc3650f886dfb79dc03183f85cc5e8fe16",
	name: "getPODetailsServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => getPODetailsServerFn.__executeServer(opts));
var getPODetailsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getPODetailsServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId } = await getPurchasingContext();
	const po = await db.query.purchaseOrders.findFirst({
		where: and(eq(purchaseOrders.id, data.poId), eq(purchaseOrders.tenantId, tenantId)),
		with: {
			vendor: true,
			branch: true,
			items: { with: { product: true } }
		}
	});
	if (!po) throw new Error("Purchase Order not found or unauthorized.");
	const settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });
	const mappedPo = {
		...po,
		tenantTRN: settings?.taxRegistrationNumber || null,
		items: po.items.map((item) => {
			const quantity = item.qty != null ? Number(item.qty) : 0;
			const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : 0;
			return {
				...item,
				quantity,
				unitPrice,
				total: quantity * unitPrice,
				productName: item.product?.name || "Unknown Product"
			};
		})
	};
	return JSON.parse(JSON.stringify(mappedPo));
});
var createPurchaseOrderServerFn_createServerFn_handler = createServerRpc({
	id: "95303c8038f5610552eea41be398535c5dc8febc260bd8a8377decf47b8d1923",
	name: "createPurchaseOrderServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => createPurchaseOrderServerFn.__executeServer(opts));
var createPurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createPurchaseOrderServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	if (!data.vendorId) throw new Error("Vendor must be selected");
	if (!data.branchId) throw new Error("Delivery Branch must be selected");
	if (data.items.length === 0) throw new Error("PO must contain at least one item");
	if (data.items.some((i) => !i.qty || i.qty <= 0 || !i.unitPrice || i.unitPrice <= 0)) throw new Error("Quantity and unit price must be positive numbers");
	const productIds = data.items.map((i) => i.productId);
	if (productIds.length !== new Set(productIds).size) throw new Error("Duplicate products in PO are not allowed");
	const subtotal = data.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
	const vatRate = data.vatRate !== void 0 ? data.vatRate : 5;
	const vatAmount = subtotal * (vatRate / 100);
	const total = subtotal + vatAmount;
	await db.transaction(async (tx) => {
		const [vendor] = await tx.select({
			id: vendors.id,
			status: vendors.status
		}).from(vendors).where(and(eq(vendors.id, data.vendorId), eq(vendors.tenantId, tenantId))).limit(1);
		const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId))).limit(1);
		if (!vendor || !branch) throw new Error("Unauthorized or invalid vendor/branch");
		if (vendor.status !== "Active") throw new Error("Selected vendor is inactive");
		if ((await tx.select({ id: products.id }).from(products).where(and(inArray(products.id, productIds), eq(products.tenantId, tenantId)))).length !== productIds.length) throw new Error("One or more products are invalid or belong to another tenant");
		const [newPO] = await tx.insert(purchaseOrders).values({
			tenantId,
			vendorId: data.vendorId,
			branchId: data.branchId,
			status: "Draft",
			subtotal: subtotal.toString(),
			vatRate: vatRate.toString(),
			vatAmount: vatAmount.toString(),
			total: total.toString()
		}).returning({ id: purchaseOrders.id });
		const poItems = data.items.map((item) => ({
			purchaseOrderId: newPO.id,
			productId: item.productId,
			qty: item.qty,
			unitPrice: item.unitPrice.toString()
		}));
		await tx.insert(purchaseOrderItems).values(poItems);
		if (user) await tx.insert(auditLogs).values({
			tenantId,
			branchId: data.branchId,
			userId: user.id,
			action: "CREATED",
			entityType: "PURCHASE_ORDER",
			entityId: newPO.id,
			details: `PO created — Subtotal AED ${subtotal}, VAT AED ${vatAmount}, Total AED ${total} (Draft)`
		});
	});
	return { success: true };
});
var updatePurchaseOrderServerFn_createServerFn_handler = createServerRpc({
	id: "93cf371881cc56207bbe0c0275546ca3ef8953f6f9ae840aa42b17fd56536c01",
	name: "updatePurchaseOrderServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => updatePurchaseOrderServerFn.__executeServer(opts));
var updatePurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updatePurchaseOrderServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	if (!data.vendorId || !data.branchId) throw new Error("Vendor and Branch must be selected");
	if (data.items.length === 0) throw new Error("PO must contain at least one item");
	if (data.items.some((i) => !i.qty || i.qty <= 0 || !i.unitPrice || i.unitPrice <= 0)) throw new Error("Quantity and unit price must be positive numbers");
	const productIds = data.items.map((i) => i.productId);
	if (productIds.length !== new Set(productIds).size) throw new Error("Duplicate products in PO are not allowed");
	const subtotal = data.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
	const vatRate = data.vatRate !== void 0 ? data.vatRate : 5;
	const vatAmount = subtotal * (vatRate / 100);
	const total = subtotal + vatAmount;
	await db.transaction(async (tx) => {
		const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId))).limit(1);
		if (!po) throw new Error("PO not found or access denied");
		const [vendor] = await tx.select({
			id: vendors.id,
			status: vendors.status
		}).from(vendors).where(and(eq(vendors.id, data.vendorId), eq(vendors.tenantId, tenantId))).limit(1);
		const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId))).limit(1);
		if (!vendor || !branch) throw new Error("Unauthorized or invalid vendor/branch");
		if (vendor.status !== "Active") throw new Error("Selected vendor is inactive");
		if ((await tx.select({ id: products.id }).from(products).where(and(inArray(products.id, productIds), eq(products.tenantId, tenantId)))).length !== productIds.length) throw new Error("One or more products are invalid or belong to another tenant");
		await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, data.id));
		await tx.update(purchaseOrders).set({
			vendorId: data.vendorId,
			branchId: data.branchId,
			subtotal: subtotal.toString(),
			vatRate: vatRate.toString(),
			vatAmount: vatAmount.toString(),
			total: total.toString()
		}).where(eq(purchaseOrders.id, data.id));
		const poItems = data.items.map((item) => ({
			purchaseOrderId: data.id,
			productId: item.productId,
			qty: item.qty,
			unitPrice: item.unitPrice.toString()
		}));
		await tx.insert(purchaseOrderItems).values(poItems);
		if (user) await tx.insert(auditLogs).values({
			tenantId,
			branchId: data.branchId,
			userId: user.id,
			action: "EDITED",
			entityType: "PURCHASE_ORDER",
			entityId: data.id,
			details: {
				total,
				subtotal,
				vatAmount,
				status: po.status
			}
		});
	});
	return { success: true };
});
var submitPurchaseOrderServerFn_createServerFn_handler = createServerRpc({
	id: "d615411c3d5a9ef74666848e73d205a7cb04b91d64afb3070031881bcfc00f88",
	name: "submitPurchaseOrderServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => submitPurchaseOrderServerFn.__executeServer(opts));
var submitPurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(submitPurchaseOrderServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	await db.transaction(async (tx) => {
		const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId))).limit(1);
		if (!po) throw new Error("PO not found or access denied");
		if (po.status !== "Draft") throw new Error("Only Draft POs can be submitted");
		await tx.update(purchaseOrders).set({ status: "Ordered" }).where(eq(purchaseOrders.id, data.id));
		if (user) await tx.insert(auditLogs).values({
			tenantId,
			userId: user.id,
			action: "SUBMITTED",
			entityType: "PURCHASE_ORDER",
			entityId: data.id,
			details: { status: "Ordered" }
		});
	});
	return { success: true };
});
var updateGrnServerFn_createServerFn_handler = createServerRpc({
	id: "fc889586ff6cf0e2d6080203a6f2eaa7b45cd79150c680013a03d13307180c69",
	name: "updateGrnServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => updateGrnServerFn.__executeServer(opts));
var updateGrnServerFn = createServerFn({ method: "POST" }).validator((z) => z.object({
	id: z.string(),
	items: z.array(z.object({
		productId: z.string(),
		orderedQty: z.number(),
		receivedQty: z.number(),
		batchNumber: z.string().optional(),
		expiryDate: z.string().optional()
	}))
})).handler(updateGrnServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	await db.transaction(async (tx) => {
		const existingGrn = await tx.query.grn.findFirst({
			where: and(eq(grn.id, data.id), eq(grn.tenantId, tenantId)),
			with: {
				items: true,
				purchaseOrder: true
			}
		});
		if (!existingGrn) throw new Error("GRN not found");
		if (await tx.query.vendorInvoices.findFirst({ where: and(eq(vendorInvoices.purchaseOrderId, existingGrn.purchaseOrderId), eq(vendorInvoices.tenantId, tenantId)) })) throw new Error("Cannot edit GRN because a vendor invoice already exists for this PO");
		for (const item of existingGrn.items) if (item.receivedQty > 0) {
			const existingStock = await tx.select().from(stockLevels).where(and(eq(stockLevels.tenantId, tenantId), eq(stockLevels.branchId, existingGrn.branchId), eq(stockLevels.productId, item.productId))).limit(1);
			if (existingStock.length > 0) await tx.update(stockLevels).set({ quantity: sql`${stockLevels.quantity} - ${item.receivedQty}` }).where(eq(stockLevels.id, existingStock[0].id));
		}
		await tx.delete(batches).where(eq(batches.grnId, existingGrn.id));
		await tx.delete(grnItems).where(eq(grnItems.grnId, existingGrn.id));
		const hasVariance = data.items.some((item) => item.orderedQty !== item.receivedQty);
		await tx.update(grn).set({
			status: hasVariance ? "Variance" : "Completed",
			updatedAt: sql`NOW()`
		}).where(eq(grn.id, existingGrn.id));
		const gItems = data.items.map((item) => ({
			grnId: existingGrn.id,
			tenantId,
			productId: item.productId,
			orderedQty: item.orderedQty,
			receivedQty: item.receivedQty,
			variance: item.receivedQty - item.orderedQty,
			batchNumber: item.batchNumber || null,
			expiryDate: item.expiryDate || null
		}));
		await tx.insert(grnItems).values(gItems);
		for (const item of data.items) if (item.receivedQty > 0) {
			const existingStock = await tx.select().from(stockLevels).where(and(eq(stockLevels.tenantId, tenantId), eq(stockLevels.branchId, existingGrn.branchId), eq(stockLevels.productId, item.productId))).limit(1);
			if (existingStock.length > 0) await tx.update(stockLevels).set({
				quantity: sql`${stockLevels.quantity} + ${item.receivedQty}`,
				updatedAt: sql`NOW()`
			}).where(eq(stockLevels.id, existingStock[0].id));
			else await tx.insert(stockLevels).values({
				tenantId,
				branchId: existingGrn.branchId,
				productId: item.productId,
				quantity: item.receivedQty
			});
			if (item.batchNumber) await tx.insert(batches).values({
				tenantId,
				branchId: existingGrn.branchId,
				productId: item.productId,
				batchNumber: item.batchNumber,
				expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
				quantity: item.receivedQty,
				grnId: existingGrn.id
			});
		}
		await tx.insert(auditLogs).values({
			tenantId,
			userId: user.id,
			action: "UPDATE",
			entityType: "GRN",
			entityId: existingGrn.id,
			details: { message: `GRN ${existingGrn.grnNumber} updated` }
		});
	});
	return { success: true };
});
var updateVendorInvoiceServerFn_createServerFn_handler = createServerRpc({
	id: "5308bb7b6fb36b20456b2c65f935548518a244127fe0ea669e5b61b049e98eac",
	name: "updateVendorInvoiceServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => updateVendorInvoiceServerFn.__executeServer(opts));
var updateVendorInvoiceServerFn = createServerFn({ method: "POST" }).validator((z) => z.object({
	id: z.string(),
	invoiceNumber: z.string(),
	dueDate: z.string()
})).handler(updateVendorInvoiceServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	await db.transaction(async (tx) => {
		const existingInvoice = await tx.query.vendorInvoices.findFirst({ where: and(eq(vendorInvoices.id, data.id), eq(vendorInvoices.tenantId, tenantId)) });
		if (!existingInvoice) throw new Error("Vendor Invoice not found");
		if (Number(existingInvoice.paidAmount) > 0) throw new Error("Cannot edit an invoice that has payments");
		if ((await tx.select().from(vendorInvoices).where(and(eq(vendorInvoices.tenantId, tenantId), eq(vendorInvoices.invoiceNumber, data.invoiceNumber), not(eq(vendorInvoices.id, data.id)))).limit(1)).length > 0) throw new Error("Invoice number already exists");
		await tx.update(vendorInvoices).set({
			invoiceNumber: data.invoiceNumber,
			dueDate: new Date(data.dueDate),
			updatedAt: sql`NOW()`
		}).where(eq(vendorInvoices.id, data.id));
		await tx.insert(auditLogs).values({
			tenantId,
			userId: user.id,
			action: "UPDATE",
			entityType: "VENDOR_INVOICE",
			entityId: data.id,
			details: { message: `Vendor Invoice updated` }
		});
	});
	return { success: true };
});
var deletePurchaseOrderServerFn_createServerFn_handler = createServerRpc({
	id: "2a58828528113bce82b47c6da6108ec4296e0e13ce79a5ee5b8ba0bb4f30549e",
	name: "deletePurchaseOrderServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => deletePurchaseOrderServerFn.__executeServer(opts));
var deletePurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deletePurchaseOrderServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	await db.transaction(async (tx) => {
		const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId))).limit(1);
		if (!po) throw new Error("PO not found or access denied");
		await tx.update(grn).set({ purchaseOrderId: null }).where(eq(grn.purchaseOrderId, data.id));
		await tx.update(vendorInvoices).set({ purchaseOrderId: null }).where(eq(vendorInvoices.purchaseOrderId, data.id));
		await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, data.id));
		if (user) await tx.insert(auditLogs).values({
			tenantId,
			userId: user.id,
			action: "DELETED",
			entityType: "PURCHASE_ORDER",
			entityId: data.id,
			details: `${po.status} PO deleted`
		});
	});
	return { success: true };
});
var recordGRNServerFn_createServerFn_handler = createServerRpc({
	id: "2dba67889cc55906e80d66373d61f5cbd1becf7ab79a1d03c8e4ca40e68f6aef",
	name: "recordGRNServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => recordGRNServerFn.__executeServer(opts));
var recordGRNServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(recordGRNServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getPurchasingContext();
	if (data.items.length === 0) throw new Error("GRN must contain at least one item");
	if (data.items.some((i) => i.receivedQty < 0)) throw new Error("Received quantity cannot be negative");
	await db.transaction(async (tx) => {
		const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.purchaseOrderId), eq(purchaseOrders.tenantId, tenantId))).limit(1);
		if (!po) throw new Error("Unauthorized or invalid purchase order");
		if (![
			"Draft",
			"Ordered",
			"Sent",
			"Approved"
		].includes(po.status)) throw new Error("GRN can only be recorded for open purchase orders (Draft, Ordered, Sent, Approved).");
		if ((await tx.select({ id: grn.id }).from(grn).where(and(eq(grn.grnNumber, data.grnNumber), eq(grn.tenantId, tenantId))).limit(1)).length > 0) throw new Error("Duplicate GRN number");
		if (!po.branchId) throw new Error("PO has no branch association");
		const actualPoItems = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, po.id));
		if (actualPoItems.length !== data.items.length) throw new Error("All items from the original PO must be included in the GRN. Partial item sets are not allowed.");
		const actualItemMap = new Map(actualPoItems.map((i) => [i.productId, i]));
		for (const item of data.items) {
			if (!item.batchNumber || item.batchNumber.trim() === "") throw new Error(`Batch number is required for product ${item.productId}`);
			if (!item.expiryDate) throw new Error(`Expiry date is required for batch ${item.batchNumber}`);
			if (item.manufacturingDate && new Date(item.expiryDate) <= new Date(item.manufacturingDate)) throw new Error(`Expiry date must be after manufacturing date for batch ${item.batchNumber}`);
			if (new Date(item.expiryDate) <= /* @__PURE__ */ new Date()) throw new Error(`Expiry date must be in the future for batch ${item.batchNumber}`);
			if ((await tx.select().from(batches).where(and(eq(batches.tenantId, tenantId), eq(batches.branchId, po.branchId), eq(batches.productId, item.productId), eq(batches.batchNumber, item.batchNumber))).limit(1)).length > 0) throw new Error(`Duplicate batch number ${item.batchNumber} found for this product.`);
			const poItem = actualItemMap.get(item.productId);
			if (!poItem) throw new Error(`Product ${item.productId} was not part of the original PO`);
			if (item.receivedQty > poItem.qty) throw new Error(`Cannot receive more than ordered. Ordered: ${poItem.qty}, Received: ${item.receivedQty}`);
			if (item.orderedQty !== poItem.qty) throw new Error("Ordered quantity mismatch in payload");
		}
		const hasVariance = data.items.some((item) => item.orderedQty !== item.receivedQty);
		const [newGRN] = await tx.insert(grn).values({
			tenantId,
			vendorId: po.vendorId,
			branchId: po.branchId,
			purchaseOrderId: po.id,
			grnNumber: data.grnNumber,
			status: hasVariance ? "variance" : "received"
		}).returning({ id: grn.id });
		const gItems = data.items.map((item) => ({
			grnId: newGRN.id,
			productId: item.productId,
			orderedQty: item.orderedQty,
			receivedQty: item.receivedQty,
			variance: item.orderedQty - item.receivedQty,
			batchNumber: item.batchNumber || null,
			manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate) : null,
			expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
		}));
		await tx.insert(grnItems).values(gItems);
		await tx.update(purchaseOrders).set({ status: "GRN" }).where(eq(purchaseOrders.id, po.id));
		for (const item of data.items) if (item.receivedQty > 0) {
			const existingStock = await tx.select().from(stockLevels).where(and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, po.branchId))).limit(1);
			if (existingStock.length > 0) await tx.update(stockLevels).set({ stock: sql`${stockLevels.stock} + ${item.receivedQty}` }).where(eq(stockLevels.id, existingStock[0].id));
			else await tx.insert(stockLevels).values({
				productId: item.productId,
				branchId: po.branchId,
				stock: item.receivedQty
			});
			if (item.batchNumber && item.expiryDate) {
				const poItem = actualItemMap.get(item.productId);
				await tx.insert(batches).values({
					tenantId,
					productId: item.productId,
					branchId: po.branchId,
					grnId: newGRN.id,
					batchNumber: item.batchNumber,
					manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate) : null,
					expiryDate: new Date(item.expiryDate),
					stock: item.receivedQty,
					receivedQty: item.receivedQty,
					unitCost: poItem.unitPrice,
					createdBy: user?.id || null
				});
			}
		}
		if (user) await tx.insert(auditLogs).values({
			tenantId,
			branchId: po.branchId,
			userId: user.id,
			action: "RECORDED_GRN",
			entityType: "PURCHASE_ORDER",
			entityId: po.id,
			details: `GRN ${data.grnNumber} recorded`
		});
	});
	return { success: true };
});
var getGrnDetailsServerFn_createServerFn_handler = createServerRpc({
	id: "1b9181e1a481dd46084adccac897170de72f3ffd263bfdd278c543f3e94f02c4",
	name: "getGrnDetailsServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => getGrnDetailsServerFn.__executeServer(opts));
var getGrnDetailsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getGrnDetailsServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId } = await getPurchasingContext();
	const po = await db.query.purchaseOrders.findFirst({
		where: and(eq(purchaseOrders.id, data.purchaseOrderId), eq(purchaseOrders.tenantId, tenantId)),
		with: {
			vendor: true,
			branch: true,
			items: { with: { product: true } }
		}
	});
	if (!po) throw new Error("Purchase order not found");
	const poGrn = await db.query.grn.findFirst({
		where: and(eq(grn.purchaseOrderId, po.id), eq(grn.tenantId, tenantId)),
		with: { items: { with: { product: true } } }
	});
	if (!poGrn) throw new Error("GRN record not found for this Purchase Order");
	const settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });
	const vatRate = settings ? Number(settings.vatRate) : 5;
	const vatInclusive = settings ? settings.vatInclusive : true;
	const poItemsMap = new Map(po.items.map((i) => [i.productId, Number(i.unitPrice)]));
	const items = poGrn.items.map((i) => {
		const unitPrice = poItemsMap.get(i.productId) || 0;
		const subtotal = i.receivedQty * unitPrice;
		return {
			productId: i.productId,
			name: i.product?.name || "Unknown Product",
			receivedQty: i.receivedQty,
			unitPrice,
			subtotal
		};
	});
	const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
	let vat = 0;
	let total = subtotal;
	if (vatInclusive) vat = subtotal - subtotal / (1 + vatRate / 100);
	else {
		vat = subtotal * (vatRate / 100);
		total = subtotal + vat;
	}
	return {
		purchaseOrderId: po.id,
		poNumber: po.id.split("-")[0]?.toUpperCase() || "",
		grnNumber: poGrn.grnNumber,
		vendorName: po.vendor?.name || "Unknown",
		branchName: po.branch?.name || "HQ",
		items,
		subtotal,
		vat,
		total,
		vatRate,
		vatInclusive
	};
});
var createVendorInvoiceServerFn_createServerFn_handler = createServerRpc({
	id: "8ee79462c1f3e4f7807c3d919a93addecb5b4cf2b7b1c59de2e40030a86db93c",
	name: "createVendorInvoiceServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => createVendorInvoiceServerFn.__executeServer(opts));
var createVendorInvoiceServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createVendorInvoiceServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId } = await getPurchasingContext();
	await db.transaction(async (tx) => {
		const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.purchaseOrderId), eq(purchaseOrders.tenantId, tenantId))).limit(1);
		if (!po) throw new Error("Purchase Order not found");
		if (po.status !== "GRN" && po.status !== "Received") throw new Error("Cannot convert to invoice unless status is GRN/Received");
		const [relatedGrn] = await tx.select({ id: grn.id }).from(grn).where(and(eq(grn.purchaseOrderId, po.id), eq(grn.tenantId, tenantId), eq(grn.vendorId, po.vendorId))).limit(1);
		if (!relatedGrn) throw new Error("A completed GRN is required before creating a vendor invoice.");
		const calculatedSubtotal = (await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, po.id))).reduce((acc, item) => acc + item.qty * Number(item.unitPrice), 0);
		const calculatedVatRate = Number(data.vatRate) || 5;
		const calculatedVatAmount = calculatedSubtotal * (calculatedVatRate / 100);
		const calculatedTotal = calculatedSubtotal + calculatedVatAmount;
		if ((await tx.select().from(vendorInvoices).where(and(eq(vendorInvoices.vendorId, po.vendorId), eq(vendorInvoices.invoiceNumber, data.invoiceNumber), eq(vendorInvoices.tenantId, tenantId))).limit(1)).length > 0) throw new Error("Duplicate supplier invoice number for this vendor");
		const [newInvoice] = await tx.insert(vendorInvoices).values({
			tenantId,
			vendorId: po.vendorId,
			invoiceNumber: data.invoiceNumber,
			purchaseOrderId: po.id,
			grnId: relatedGrn.id,
			subtotal: calculatedSubtotal.toString(),
			vatRate: calculatedVatRate.toString(),
			vatAmount: calculatedVatAmount.toString(),
			total: calculatedTotal.toString(),
			status: "pending",
			dueDate: new Date(data.dueDate)
		}).returning({ id: vendorInvoices.id });
		await tx.update(purchaseOrders).set({ status: "Invoiced" }).where(eq(purchaseOrders.id, po.id));
		const { user } = await getPurchasingContext();
		if (user) await tx.insert(auditLogs).values({
			tenantId,
			userId: user.id,
			action: "CREATED",
			entityType: "VENDOR_INVOICE",
			entityId: newInvoice.id,
			details: `Invoice ${data.invoiceNumber} created for AED ${data.total}`
		});
	});
	return { success: true };
});
var getInvoiceDetailsServerFn_createServerFn_handler = createServerRpc({
	id: "c0f19bd559164d2f1d870de125d03268019e202b8c5fee7f1f770c47f0a7e6b5",
	name: "getInvoiceDetailsServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => getInvoiceDetailsServerFn.__executeServer(opts));
var getInvoiceDetailsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getInvoiceDetailsServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId } = await getPurchasingContext();
	const conditions = [eq(vendorInvoices.tenantId, tenantId)];
	if (data.invoiceId) conditions.push(eq(vendorInvoices.id, data.invoiceId));
	else if (data.purchaseOrderId) conditions.push(eq(vendorInvoices.purchaseOrderId, data.purchaseOrderId));
	else throw new Error("Either invoiceId or purchaseOrderId must be provided");
	const invoice = await db.query.vendorInvoices.findFirst({
		where: and(...conditions),
		with: {
			vendor: true,
			purchaseOrder: { with: {
				branch: true,
				items: { with: { product: true } }
			} }
		}
	});
	if (!invoice) throw new Error("Invoice not found or unauthorized");
	const po = invoice.purchaseOrder;
	if (!po) throw new Error("Purchase Order not found for this invoice");
	const poGrn = await db.query.grn.findFirst({
		where: and(eq(grn.purchaseOrderId, po.id), eq(grn.tenantId, tenantId)),
		with: { items: { with: { product: true } } }
	});
	if (!poGrn) throw new Error("GRN record not found for this Purchase Order");
	const tenantInfo = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
	const settings = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.tenantId, tenantId) });
	const vatRate = settings ? Number(settings.vatRate) : 5;
	const vatInclusive = settings ? settings.vatInclusive : true;
	const currency = settings ? settings.currency : "AED";
	const poItemsMap = new Map(po.items.map((i) => [i.productId, Number(i.unitPrice)]));
	const subtotal = poGrn.items.map((i) => {
		const unitPrice = poItemsMap.get(i.productId) || 0;
		const subtotal = i.receivedQty * unitPrice;
		return {
			productId: i.productId,
			name: i.product?.name || "Unknown Product",
			receivedQty: i.receivedQty,
			unitPrice,
			subtotal
		};
	}).reduce((sum, i) => sum + i.subtotal, 0);
	const total = Number(invoice.total);
	let vat = 0;
	if (vatInclusive) vat = subtotal - subtotal / (1 + vatRate / 100);
	else vat = total - subtotal;
	return {
		id: invoice.id,
		invoiceNumber: invoice.invoiceNumber,
		createdAt: invoice.createdAt.toISOString(),
		dueDate: invoice.dueDate.toISOString(),
		status: invoice.status,
		total,
		subtotal,
		vat,
		vatRate,
		vatInclusive,
		currency,
		tenantName: tenantInfo ? tenantInfo.name : "Tenant",
		tenantTrn: settings ? settings.taxRegistrationNumber : null,
		vendorName: invoice.vendor?.name || "Unknown Vendor",
		vendorContact: invoice.vendor?.contact || null,
		vendorPhone: invoice.vendor?.phone || null,
		vendorEmail: invoice.vendor?.email || null,
		vendorAddress: invoice.vendor?.address || null,
		vendorTrn: invoice.vendor?.trn || null,
		branchName: po.branch?.name || "HQ",
		poNumber: po.id.split("-")[0]?.toUpperCase() || ""
	};
});
var recordVendorPaymentServerFn_createServerFn_handler = createServerRpc({
	id: "ede17655b6f97502ed1aa9c1a6e38a58c35b5bdf54d1bade37de2f17b1ff7484",
	name: "recordVendorPaymentServerFn",
	filename: "src/lib/purchasing-server.ts"
}, (opts) => recordVendorPaymentServerFn.__executeServer(opts));
var recordVendorPaymentServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(recordVendorPaymentServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, user } = await getFinanceContext();
	if (data.amount <= 0) throw new Error("Payment amount must be greater than zero");
	await db.transaction(async (tx) => {
		const [invoice] = await tx.select().from(vendorInvoices).where(and(eq(vendorInvoices.id, data.invoiceId), eq(vendorInvoices.tenantId, tenantId))).limit(1);
		if (!invoice) throw new Error("Vendor Invoice not found");
		if (invoice.status === "Paid") throw new Error("This invoice is already fully paid");
		const total = Number(invoice.total);
		const paid = Number(invoice.paidAmount);
		const balance = total - paid;
		if (data.amount > balance) throw new Error(`Payment amount (${data.amount}) cannot exceed remaining balance (${balance})`);
		const [newPayment] = await tx.insert(vendorPayments).values({
			tenantId,
			vendorId: invoice.vendorId,
			invoiceId: invoice.id,
			amount: data.amount.toString(),
			method: data.method,
			referenceNo: data.referenceNo || null,
			notes: data.notes || null,
			paymentDate: new Date(data.paymentDate),
			recordedBy: user.id
		}).returning({ id: vendorPayments.id });
		const newPaidAmount = paid + data.amount;
		const newStatus = newPaidAmount >= total ? "Paid" : "Partially Paid";
		await tx.update(vendorInvoices).set({
			paidAmount: newPaidAmount.toString(),
			status: newStatus
		}).where(eq(vendorInvoices.id, invoice.id));
		await tx.insert(auditLogs).values({
			tenantId,
			userId: user.id,
			action: "CREATED",
			entityType: "VENDOR_PAYMENT",
			entityId: newPayment.id,
			details: {
				invoiceId: invoice.id,
				amount: data.amount,
				method: data.method
			}
		});
	});
	return { success: true };
});
//#endregion
export { createPurchaseOrderServerFn_createServerFn_handler, createVendorInvoiceServerFn_createServerFn_handler, createVendorServerFn_createServerFn_handler, deletePurchaseOrderServerFn_createServerFn_handler, deleteVendorServerFn_createServerFn_handler, getGrnDetailsServerFn_createServerFn_handler, getInvoiceDetailsServerFn_createServerFn_handler, getPODetailsServerFn_createServerFn_handler, getPurchasingDataServerFn_createServerFn_handler, recordGRNServerFn_createServerFn_handler, recordVendorPaymentServerFn_createServerFn_handler, submitPurchaseOrderServerFn_createServerFn_handler, updateGrnServerFn_createServerFn_handler, updatePurchaseOrderServerFn_createServerFn_handler, updateVendorInvoiceServerFn_createServerFn_handler, updateVendorServerFn_createServerFn_handler };
