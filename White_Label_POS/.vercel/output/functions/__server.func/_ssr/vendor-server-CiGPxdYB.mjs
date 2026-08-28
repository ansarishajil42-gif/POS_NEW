import { r as createServerFn } from "./server-po8kJpue.mjs";
import { r as getSessionServerFn } from "./auth-server-Cg0hQhNk.mjs";
import { a as eq, i as and, r as desc } from "../_libs/drizzle-orm+postgres.mjs";
import { I as vendors, L as createServerRpc, P as vendorInvoices, S as purchaseOrders, j as tenants, t as db } from "./db-DMcWZUf-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vendor-server-CiGPxdYB.js
async function getVendorContext() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Vendor") throw new Error("Unauthorized");
	return {
		tenantId: res.session.tenantId,
		vendorId: res.session.id
	};
}
var getVendorPortalDataServerFn_createServerFn_handler = createServerRpc({
	id: "6610ab817629658d9f049d6b90fc6e684fa747d3853b87397c76decc8ca65aca",
	name: "getVendorPortalDataServerFn",
	filename: "src/lib/vendor-server.ts"
}, (opts) => getVendorPortalDataServerFn.__executeServer(opts));
var getVendorPortalDataServerFn = createServerFn({ method: "GET" }).handler(getVendorPortalDataServerFn_createServerFn_handler, async () => {
	const { tenantId, vendorId } = await getVendorContext();
	const vendorProfile = await db.query.vendors.findFirst({ where: and(eq(vendors.id, vendorId), eq(vendors.tenantId, tenantId)) });
	const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
	const pos = await db.query.purchaseOrders.findMany({
		where: and(eq(purchaseOrders.vendorId, vendorId), eq(purchaseOrders.tenantId, tenantId)),
		orderBy: [desc(purchaseOrders.createdAt)],
		with: { items: { with: { product: true } } }
	});
	const invoices = await db.query.vendorInvoices.findMany({
		where: and(eq(vendorInvoices.vendorId, vendorId), eq(vendorInvoices.tenantId, tenantId)),
		orderBy: [desc(vendorInvoices.createdAt)]
	});
	return JSON.parse(JSON.stringify({
		tenant,
		vendor: vendorProfile,
		purchaseOrders: pos,
		invoices
	}));
});
//#endregion
export { getVendorPortalDataServerFn_createServerFn_handler };
