import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import { db } from "../server/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  vendors,
  purchaseOrders,
  purchaseOrderItems,
  grn,
  grnItems,
  vendorInvoices,
  products,
  branches,
  stockLevels,
  tenants,
  tenantSettings,
} from "../server/db/schema";

// Middleware
async function getPurchasingContext() {
  const res = await getSessionServerFn();
  if (
    !res.success ||
    !res.session ||
    (res.session.role !== "Purchasing Officer" && res.session.role !== "Head Office Admin")
  ) {
    throw new Error("Unauthorized");
  }
  return {
    tenantId: res.session.tenantId,
  };
}

export const getPurchasingDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId } = await getPurchasingContext();

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  const allVendors = await db.query.vendors.findMany({
    where: eq(vendors.tenantId, tenantId),
  });

  const allBranches = await db.query.branches.findMany({
    where: eq(branches.tenantId, tenantId),
  });

  const allProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  const allPOs = await db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.tenantId, tenantId),
    orderBy: [desc(purchaseOrders.createdAt)],
    with: {
      vendor: true,
      branch: true,
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  const allGRNs = await db.query.grn.findMany({
    where: eq(grn.tenantId, tenantId),
    orderBy: [desc(grn.receivedAt)],
    with: {
      vendor: true,
      branch: true,
      purchaseOrder: true,
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  const allInvoices = await db.query.vendorInvoices.findMany({
    where: eq(vendorInvoices.tenantId, tenantId),
    orderBy: [desc(vendorInvoices.createdAt)],
    with: {
      vendor: true,
      purchaseOrder: true,
    },
  });

  return JSON.parse(
    JSON.stringify({
      tenant,
      vendors: allVendors,
      products: allProducts,
      branches: allBranches,
      purchaseOrders: allPOs,
      grns: allGRNs,
      invoices: allInvoices,
    }),
  );
});

export const createPurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      vendorId: string;
      branchId: string;
      items: { productId: string; qty: number; unitPrice: number }[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();

    if (data.items.length === 0) throw new Error("PO must contain at least one item");
    if (data.items.some((i) => i.qty <= 0 || i.unitPrice <= 0))
      throw new Error("Quantity and unit price must be positive");

    const productIds = data.items.map((i) => i.productId);
    if (productIds.length !== new Set(productIds).size)
      throw new Error("Duplicate products in PO are not allowed");

    const total = data.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);

    await db.transaction(async (tx) => {
      const [vendor] = await tx
        .select({ id: vendors.id, status: vendors.status })
        .from(vendors)
        .where(and(eq(vendors.id, data.vendorId), eq(vendors.tenantId, tenantId)))
        .limit(1);
      const [branch] = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)))
        .limit(1);
      if (!vendor || !branch) throw new Error("Unauthorized or invalid vendor/branch");
      if (vendor.status !== "Active") throw new Error("Selected vendor is inactive");

      const productCheck = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(inArray(products.id, productIds), eq(products.tenantId, tenantId)));
      if (productCheck.length !== productIds.length)
        throw new Error("One or more products are invalid or belong to another tenant");

      const [newPO] = await tx
        .insert(purchaseOrders)
        .values({
          tenantId,
          vendorId: data.vendorId,
          branchId: data.branchId,
          status: "Ordered",
          total: total.toString(),
        })
        .returning({ id: purchaseOrders.id });

      const poItems = data.items.map((item) => ({
        purchaseOrderId: newPO.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice.toString(),
      }));

      await tx.insert(purchaseOrderItems).values(poItems);
    });

    return { success: true };
  });

export const recordGRNServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      purchaseOrderId: string;
      vendorId: string;
      branchId: string;
      grnNumber: string;
      items: { productId: string; orderedQty: number; receivedQty: number }[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();

    if (data.items.length === 0) throw new Error("GRN must contain at least one item");
    if (data.items.some((i) => i.receivedQty < 0))
      throw new Error("Received quantity cannot be negative");

    await db.transaction(async (tx) => {
      const [po] = await tx
        .select()
        .from(purchaseOrders)
        .where(
          and(eq(purchaseOrders.id, data.purchaseOrderId), eq(purchaseOrders.tenantId, tenantId)),
        )
        .limit(1);
      if (!po) throw new Error("Unauthorized or invalid purchase order");

      if (po.status !== "Ordered")
        throw new Error("GRN can only be recorded for 'Ordered' purchase orders.");

      const existingGrn = await tx
        .select({ id: grn.id })
        .from(grn)
        .where(and(eq(grn.grnNumber, data.grnNumber), eq(grn.tenantId, tenantId)))
        .limit(1);
      if (existingGrn.length > 0) throw new Error("Duplicate GRN number");

      if (!po.branchId) throw new Error("PO has no branch association");

      const actualPoItems = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, po.id));
      if (actualPoItems.length !== data.items.length)
        throw new Error(
          "All items from the original PO must be included in the GRN. Partial item sets are not allowed.",
        );

      const actualItemMap = new Map(actualPoItems.map((i) => [i.productId, i]));

      for (const item of data.items) {
        const poItem = actualItemMap.get(item.productId);
        if (!poItem) throw new Error(`Product ${item.productId} was not part of the original PO`);
        if (item.receivedQty > poItem.qty)
          throw new Error(
            `Cannot receive more than ordered. Ordered: ${poItem.qty}, Received: ${item.receivedQty}`,
          );
        if (item.orderedQty !== poItem.qty) throw new Error("Ordered quantity mismatch in payload");
      }

      const [newGRN] = await tx
        .insert(grn)
        .values({
          tenantId,
          vendorId: po.vendorId,
          branchId: po.branchId,
          purchaseOrderId: po.id,
          grnNumber: data.grnNumber,
          status: "received",
        })
        .returning({ id: grn.id });

      const gItems = data.items.map((item) => ({
        grnId: newGRN.id,
        productId: item.productId,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        variance: item.orderedQty - item.receivedQty,
      }));

      await tx.insert(grnItems).values(gItems);

      // Update PO Status
      await tx.update(purchaseOrders).set({ status: "GRN" }).where(eq(purchaseOrders.id, po.id));

      // Increment stockLevels for the branch
      for (const item of data.items) {
        if (item.receivedQty > 0) {
          const existingStock = await tx
            .select()
            .from(stockLevels)
            .where(
              and(eq(stockLevels.productId, item.productId), eq(stockLevels.branchId, po.branchId)),
            )
            .limit(1);

          if (existingStock.length > 0) {
            await tx
              .update(stockLevels)
              .set({ stock: sql`${stockLevels.stock} + ${item.receivedQty}` })
              .where(eq(stockLevels.id, existingStock[0]!.id));
          } else {
            await tx.insert(stockLevels).values({
              productId: item.productId,
              branchId: po.branchId,
              stock: item.receivedQty,
              reorderLevel: 10, // default
            });
          }
        }
      }
    });

    return { success: true };
  });

export const deletePurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();
    await db.transaction(async (tx) => {
      const [po] = await tx
        .select({ id: purchaseOrders.id, status: purchaseOrders.status })
        .from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId)))
        .limit(1);
      if (!po) throw new Error("Purchase Order not found or unauthorized");
      if (po.status !== "Ordered" && po.status !== "Pending" && po.status !== "Draft") {
        throw new Error("Cannot delete a Purchase Order that has been received or invoiced");
      }
      await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, data.id));
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, data.id));
    });
    return { success: true };
  });

export const updatePurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id: string;
      vendorId: string;
      branchId: string;
      items: { productId: string; qty: number; unitPrice: number }[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();

    if (data.items.length === 0) throw new Error("PO must contain at least one item");
    if (data.items.some((i) => i.qty <= 0 || i.unitPrice <= 0))
      throw new Error("Quantity and unit price must be positive");

    const productIds = data.items.map((i) => i.productId);
    if (productIds.length !== new Set(productIds).size)
      throw new Error("Duplicate products in PO are not allowed");

    const total = data.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);

    await db.transaction(async (tx) => {
      const [po] = await tx
        .select({ id: purchaseOrders.id, status: purchaseOrders.status })
        .from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId)))
        .limit(1);
      if (!po) throw new Error("Purchase Order not found or unauthorized");
      if (po.status !== "Ordered" && po.status !== "Pending" && po.status !== "Draft") {
        throw new Error("Cannot edit a Purchase Order that has been received or invoiced");
      }

      const [vendor] = await tx
        .select({ id: vendors.id, status: vendors.status })
        .from(vendors)
        .where(and(eq(vendors.id, data.vendorId), eq(vendors.tenantId, tenantId)))
        .limit(1);
      const [branch] = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)))
        .limit(1);
      if (!vendor || !branch) throw new Error("Unauthorized or invalid vendor/branch");
      if (vendor.status !== "Active") throw new Error("Selected vendor is inactive");

      const productCheck = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(inArray(products.id, productIds), eq(products.tenantId, tenantId)));
      if (productCheck.length !== productIds.length)
        throw new Error("One or more products are invalid or belong to another tenant");

      await tx
        .update(purchaseOrders)
        .set({
          vendorId: data.vendorId,
          branchId: data.branchId,
          total: total.toString(),
        })
        .where(eq(purchaseOrders.id, data.id));

      await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, data.id));

      const poItems = data.items.map((item) => ({
        purchaseOrderId: data.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice.toString(),
      }));

      await tx.insert(purchaseOrderItems).values(poItems);
    });

    return { success: true };
  });

export const getGrnDetailsServerFn = createServerFn({ method: "POST" })
  .validator((d: { purchaseOrderId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();

    // Fetch purchase order
    const po = await db.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, data.purchaseOrderId),
        eq(purchaseOrders.tenantId, tenantId),
      ),
      with: {
        vendor: true,
        branch: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    if (!po) throw new Error("Purchase order not found");

    // Fetch GRN
    const poGrn = await db.query.grn.findFirst({
      where: and(eq(grn.purchaseOrderId, po.id), eq(grn.tenantId, tenantId)),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    if (!poGrn) throw new Error("GRN record not found for this Purchase Order");

    // Get tenant settings for VAT
    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, tenantId),
    });
    const vatRate = settings ? Number(settings.vatRate) : 5.0;
    const vatInclusive = settings ? settings.vatInclusive : true;

    // Map items
    const poItemsMap = new Map(po.items.map((i) => [i.productId, Number(i.unitPrice)]));

    const items = poGrn.items.map((i) => {
      const unitPrice = poItemsMap.get(i.productId) || 0;
      const subtotal = i.receivedQty * unitPrice;
      return {
        productId: i.productId,
        name: i.product?.name || "Unknown Product",
        receivedQty: i.receivedQty,
        unitPrice,
        subtotal,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    let vat = 0;
    let total = subtotal;

    if (vatInclusive) {
      // Price includes VAT, calculate VAT portion
      vat = subtotal - subtotal / (1 + vatRate / 100);
    } else {
      // Price excludes VAT, add VAT to total
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
      vatInclusive,
    };
  });

export const createVendorInvoiceServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: { purchaseOrderId: string; invoiceNumber: string; dueDate: string; total: number }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();

    await db.transaction(async (tx) => {
      // Verify PO and status
      const [po] = await tx
        .select()
        .from(purchaseOrders)
        .where(
          and(eq(purchaseOrders.id, data.purchaseOrderId), eq(purchaseOrders.tenantId, tenantId)),
        )
        .limit(1);
      if (!po) throw new Error("Purchase Order not found");
      if (po.status !== "GRN" && po.status !== "Received") {
        throw new Error("Cannot convert to invoice unless status is GRN/Received");
      }

      // Verify duplicate invoice
      const existingInv = await tx
        .select()
        .from(vendorInvoices)
        .where(
          and(eq(vendorInvoices.purchaseOrderId, po.id), eq(vendorInvoices.tenantId, tenantId)),
        )
        .limit(1);
      if (existingInv.length > 0) {
        throw new Error("An invoice has already been created for this Purchase Order/GRN");
      }

      // Insert invoice
      await tx.insert(vendorInvoices).values({
        tenantId,
        vendorId: po.vendorId,
        invoiceNumber: data.invoiceNumber,
        purchaseOrderId: po.id,
        total: data.total.toString(),
        status: "pending",
        dueDate: new Date(data.dueDate),
      });

      // Update PO Status to Invoiced
      await tx
        .update(purchaseOrders)
        .set({ status: "Invoiced" })
        .where(eq(purchaseOrders.id, po.id));
    });

    return { success: true };
  });

export const getInvoiceDetailsServerFn = createServerFn({ method: "POST" })
  .validator((d: { invoiceId?: string; purchaseOrderId?: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();

    const conditions = [eq(vendorInvoices.tenantId, tenantId)];
    if (data.invoiceId) {
      conditions.push(eq(vendorInvoices.id, data.invoiceId));
    } else if (data.purchaseOrderId) {
      conditions.push(eq(vendorInvoices.purchaseOrderId, data.purchaseOrderId));
    } else {
      throw new Error("Either invoiceId or purchaseOrderId must be provided");
    }

    // Query invoice
    const invoice = await db.query.vendorInvoices.findFirst({
      where: and(...conditions),
      with: {
        vendor: true,
        purchaseOrder: {
          with: {
            branch: true,
            items: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    });
    if (!invoice) throw new Error("Invoice not found or unauthorized");

    const po = invoice.purchaseOrder;
    if (!po) throw new Error("Purchase Order not found for this invoice");

    // Fetch GRN for items
    const poGrn = await db.query.grn.findFirst({
      where: and(eq(grn.purchaseOrderId, po.id), eq(grn.tenantId, tenantId)),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    if (!poGrn) throw new Error("GRN record not found for this Purchase Order");

    // Fetch tenant details
    const tenantInfo = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, tenantId),
    });

    const vatRate = settings ? Number(settings.vatRate) : 5.0;
    const vatInclusive = settings ? settings.vatInclusive : true;
    const currency = settings ? settings.currency : "AED";

    // Map PO unitPrice
    const poItemsMap = new Map(po.items.map((i) => [i.productId, Number(i.unitPrice)]));

    const items = poGrn.items.map((i) => {
      const unitPrice = poItemsMap.get(i.productId) || 0;
      const subtotal = i.receivedQty * unitPrice;
      return {
        productId: i.productId,
        name: i.product?.name || "Unknown Product",
        receivedQty: i.receivedQty,
        unitPrice,
        subtotal,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const total = Number(invoice.total);
    let vat = 0;
    if (vatInclusive) {
      vat = subtotal - subtotal / (1 + vatRate / 100);
    } else {
      vat = total - subtotal;
    }

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
      poNumber: po.id.split("-")[0]?.toUpperCase() || "",
      grnNumber: poGrn.grnNumber,
    };
  });
