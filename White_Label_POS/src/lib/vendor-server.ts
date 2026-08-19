import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc } from "drizzle-orm";
import { 
    vendors,
    purchaseOrders,
    purchaseOrderItems,
    vendorInvoices,
    products,
    tenants
} from "../server/db/schema";

async function getVendorContext() {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || res.session.role !== "Vendor") {
        throw new Error("Unauthorized");
    }
    return {
        tenantId: res.session.tenantId,
        vendorId: res.session.id, // The vendor's auth record ID maps to vendors.id
    };
}

export const getVendorPortalDataServerFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { tenantId, vendorId } = await getVendorContext();

        // Fetch the vendor's profile
        const vendorProfile = await db.query.vendors.findFirst({
            where: and(
                eq(vendors.id, vendorId),
                eq(vendors.tenantId, tenantId)
            )
        });

        // Fetch tenant
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        // Fetch Purchase Orders
        const pos = await db.query.purchaseOrders.findMany({
            where: and(
                eq(purchaseOrders.vendorId, vendorId),
                eq(purchaseOrders.tenantId, tenantId)
            ),
            orderBy: [desc(purchaseOrders.createdAt)],
            with: {
                items: {
                    with: {
                        product: true
                    }
                }
            }
        });

        // Fetch Invoices
        const invoices = await db.query.vendorInvoices.findMany({
            where: and(
                eq(vendorInvoices.vendorId, vendorId),
                eq(vendorInvoices.tenantId, tenantId)
            ),
            orderBy: [desc(vendorInvoices.createdAt)]
        });

        return JSON.parse(JSON.stringify({ 
            tenant,
            vendor: vendorProfile,
            purchaseOrders: pos, 
            invoices 
        }));
    });
