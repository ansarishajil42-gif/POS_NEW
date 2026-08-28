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
  auditLogs,
  vendorPayments,
  batches,
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
    user: res.session
  };
}

async function getFinanceContext() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session || res.session.role !== "Head Office Admin") {
    throw new Error("Only authorized finance personnel (Head Office Admin) can record payments.");
  }
  return {
    tenantId: res.session.tenantId,
    user: res.session
  };
}

export const getPurchasingDataServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const { tenantId, user } = await getPurchasingContext();

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

  const allPayments = await db.query.vendorPayments.findMany({
    where: eq(vendorPayments.tenantId, tenantId),
    orderBy: [desc(vendorPayments.paymentDate)],
  });

  return JSON.parse(
    JSON.stringify({
      tenant,
      userRole: user.role,
      vendors: allVendors,
      products: allProducts,
      branches: allBranches,
      purchaseOrders: allPOs,
      grns: allGRNs,
      invoices: allInvoices,
      payments: allPayments,
    }),
  );
});

export const createVendorServerFn = createServerFn({ method: "POST" })
  .validator((d: {
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    trn?: string;
    address?: string;
    status?: string;
  }) => d)
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    if (!data.name || data.name.trim() === "") {
      throw new Error("Vendor name is required");
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }
      
      const existingVendor = await db.query.vendors.findFirst({
        where: eq(vendors.email, data.email)
      });
      if (existingVendor) {
        throw new Error("A vendor with this email already exists");
      }
    }

    const [newVendor] = await db.insert(vendors).values({
      tenantId,
      name: data.name.trim(),
      contact: data.contact?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      trn: data.trn?.trim() || null,
      address: data.address?.trim() || null,
      status: data.status || "Active",
    }).returning({ id: vendors.id });

    if (user && newVendor) {
      await db.insert(auditLogs).values({
        tenantId,
        userId: user.id,
        action: "CREATED",
        entityType: "VENDOR",
        entityId: newVendor.id,
        details: { name: data.name, status: data.status || "Active" },
      });
    }

    if (!newVendor) {
      throw new Error("Failed to insert vendor.");
    }

    return { success: true, vendorId: newVendor.id };
  });

export const updateVendorServerFn = createServerFn({ method: "POST" })
  .validator((d: {
    id: string;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    trn?: string;
    address?: string;
    status?: string;
  }) => d)
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    if (!data.id) throw new Error("Vendor ID is required");
    if (!data.name || data.name.trim() === "") throw new Error("Vendor name is required");

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }
      
      const existingVendor = await db.query.vendors.findFirst({
        where: and(eq(vendors.email, data.email), eq(vendors.tenantId, tenantId))
      });
      if (existingVendor && existingVendor.id !== data.id) {
        throw new Error("A vendor with this email already exists");
      }
    }

    const [updatedVendor] = await db.update(vendors).set({
      name: data.name.trim(),
      contact: data.contact?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      trn: data.trn?.trim() || null,
      address: data.address?.trim() || null,
      status: data.status || "Active",
    }).where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId))).returning({ id: vendors.id });

    if (!updatedVendor) {
      throw new Error("Vendor not found or access denied");
    }

    if (user) {
      await db.insert(auditLogs).values({
        tenantId,
        userId: user.id,
        action: "EDITED",
        entityType: "VENDOR",
        entityId: data.id,
        details: { name: data.name, status: data.status || "Active" },
      });
    }

    return { success: true };
  });

export const deleteVendorServerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    if (!data.id) throw new Error("Vendor ID is required");

    const relatedPOs = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.vendorId, data.id), eq(purchaseOrders.tenantId, tenantId))
    });

    if (relatedPOs) {
      throw new Error("Cannot delete vendor. There are purchase orders linked to this vendor.");
    }

    const [deletedVendor] = await db.delete(vendors)
      .where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId)))
      .returning({ id: vendors.id });

    if (!deletedVendor) {
      throw new Error("Vendor not found or access denied");
    }

    if (user) {
      await db.insert(auditLogs).values({
        tenantId,
        userId: user.id,
        action: "DELETED",
        entityType: "VENDOR",
        entityId: data.id,
        details: { deleted: true },
      });
    }

    return { success: true };
  });

export const getPODetailsServerFn = createServerFn({ method: "POST" })
  .validator((d: { poId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await getPurchasingContext();
    
    const po = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, data.poId), eq(purchaseOrders.tenantId, tenantId)),
      with: {
        vendor: true,
        branch: true,
        items: {
          with: {
            product: true,
          }
        }
      }
    });

    if (!po) {
      throw new Error("Purchase Order not found or unauthorized.");
    }

    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, tenantId),
    });
    
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

export const createPurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      vendorId: string;
      branchId: string;
      items: { productId: string; qty: number; unitPrice: number }[];
      vatRate?: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    if (!data.vendorId) throw new Error("Vendor must be selected");
    if (!data.branchId) throw new Error("Delivery Branch must be selected");
    if (data.items.length === 0) throw new Error("PO must contain at least one item");
    if (data.items.some((i) => !i.qty || i.qty <= 0 || !i.unitPrice || i.unitPrice <= 0))
      throw new Error("Quantity and unit price must be positive numbers");

    const productIds = data.items.map((i) => i.productId);
    if (productIds.length !== new Set(productIds).size)
      throw new Error("Duplicate products in PO are not allowed");

    const subtotal = data.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
    const vatRate = data.vatRate !== undefined ? data.vatRate : 5;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

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
          status: "Draft",
          subtotal: subtotal.toString(),
          vatRate: vatRate.toString(),
          vatAmount: vatAmount.toString(),
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
      
      // Audit log
      if (user) {
        await tx.insert(auditLogs).values({
          tenantId,
          branchId: data.branchId,
          userId: user.id,
          action: "CREATED",
          entityType: "PURCHASE_ORDER",
          entityId: newPO.id,
          details: `PO created — Subtotal AED ${subtotal}, VAT AED ${vatAmount}, Total AED ${total} (${"Draft"})`,
        });
      }
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
      vatRate?: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    if (!data.vendorId || !data.branchId) throw new Error("Vendor and Branch must be selected");
    if (data.items.length === 0) throw new Error("PO must contain at least one item");
    if (data.items.some((i) => !i.qty || i.qty <= 0 || !i.unitPrice || i.unitPrice <= 0))
      throw new Error("Quantity and unit price must be positive numbers");

    const productIds = data.items.map((i) => i.productId);
    if (productIds.length !== new Set(productIds).size)
      throw new Error("Duplicate products in PO are not allowed");

    const subtotal = data.items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
    const vatRate = data.vatRate !== undefined ? data.vatRate : 5;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    await db.transaction(async (tx) => {
      const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId))).limit(1);
      if (!po) throw new Error("PO not found or access denied");

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

      await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, data.id));

      await tx.update(purchaseOrders).set({
        vendorId: data.vendorId,
        branchId: data.branchId,
        subtotal: subtotal.toString(),
        vatRate: vatRate.toString(),
        vatAmount: vatAmount.toString(),
        total: total.toString(),
      }).where(eq(purchaseOrders.id, data.id));

      const poItems = data.items.map((item) => ({
        purchaseOrderId: data.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice.toString(),
      }));

      await tx.insert(purchaseOrderItems).values(poItems);

      if (user) {
        await tx.insert(auditLogs).values({
          tenantId,
          branchId: data.branchId,
          userId: user.id,
          action: "EDITED",
          entityType: "PURCHASE_ORDER",
          entityId: data.id,
          details: { total, subtotal, vatAmount, status: po.status },
        });
      }
    });

    return { success: true };
  });

export const submitPurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    await db.transaction(async (tx) => {
      const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId))).limit(1);
      if (!po) throw new Error("PO not found or access denied");
      if (po.status !== "Draft") throw new Error("Only Draft POs can be submitted");

      await tx.update(purchaseOrders).set({ status: "Ordered" }).where(eq(purchaseOrders.id, data.id));

      if (user) {
        await tx.insert(auditLogs).values({
          tenantId,
          userId: user.id,
          action: "SUBMITTED",
          entityType: "PURCHASE_ORDER",
          entityId: data.id,
          details: { status: "Ordered" },
        });
      }
    });

    return { success: true };
  });


export const updateGrnServerFn = createServerFn({ method: "POST" })
  .validator((z) => z.object({
    id: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      orderedQty: z.number(),
      receivedQty: z.number(),
      batchNumber: z.string().optional(),
      expiryDate: z.string().optional()
    }))
  }))
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    await db.transaction(async (tx) => {
      const existingGrn = await tx.query.grn.findFirst({
        where: and(eq(grn.id, data.id), eq(grn.tenantId, tenantId)),
        with: { items: true, purchaseOrder: true }
      });
      if (!existingGrn) throw new Error("GRN not found");

      const invoice = await tx.query.vendorInvoices.findFirst({
        where: and(eq(vendorInvoices.purchaseOrderId, existingGrn.purchaseOrderId), eq(vendorInvoices.tenantId, tenantId))
      });
      if (invoice) throw new Error("Cannot edit GRN because a vendor invoice already exists for this PO");

      // Reverse existing stock and delete batches
      for (const item of existingGrn.items) {
        if (item.receivedQty > 0) {
          const existingStock = await tx.select().from(stockLevels).where(
            and(eq(stockLevels.tenantId, tenantId), eq(stockLevels.branchId, existingGrn.branchId), eq(stockLevels.productId, item.productId))
          ).limit(1);

          if (existingStock.length > 0) {
            await tx.update(stockLevels).set({
              quantity: sql`${stockLevels.quantity} - ${item.receivedQty}`
            }).where(eq(stockLevels.id, existingStock[0].id));
          }
        }
      }
      await tx.delete(batches).where(eq(batches.grnId, existingGrn.id));
      await tx.delete(grnItems).where(eq(grnItems.grnId, existingGrn.id));

      // Re-apply new stock, create new batches, create new GRN items
      const hasVariance = data.items.some(item => item.orderedQty !== item.receivedQty);
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
        expiryDate: item.expiryDate || null,
      }));
      await tx.insert(grnItems).values(gItems);

      for (const item of data.items) {
        if (item.receivedQty > 0) {
          const existingStock = await tx.select().from(stockLevels).where(
            and(eq(stockLevels.tenantId, tenantId), eq(stockLevels.branchId, existingGrn.branchId), eq(stockLevels.productId, item.productId))
          ).limit(1);

          if (existingStock.length > 0) {
            await tx.update(stockLevels).set({
              quantity: sql`${stockLevels.quantity} + ${item.receivedQty}`,
              updatedAt: sql`NOW()`
            }).where(eq(stockLevels.id, existingStock[0].id));
          } else {
            await tx.insert(stockLevels).values({
              tenantId,
              branchId: existingGrn.branchId,
              productId: item.productId,
              quantity: item.receivedQty
            });
          }
          
          if (item.batchNumber) {
            await tx.insert(batches).values({
              tenantId,
              branchId: existingGrn.branchId,
              productId: item.productId,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              quantity: item.receivedQty,
              grnId: existingGrn.id
            });
          }
        }
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

export const updateVendorInvoiceServerFn = createServerFn({ method: "POST" })
  .validator((z) => z.object({
    id: z.string(),
    invoiceNumber: z.string(),
    dueDate: z.string()
  }))
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();
    await db.transaction(async (tx) => {
      const existingInvoice = await tx.query.vendorInvoices.findFirst({
        where: and(eq(vendorInvoices.id, data.id), eq(vendorInvoices.tenantId, tenantId))
      });
      if (!existingInvoice) throw new Error("Vendor Invoice not found");
      if (Number(existingInvoice.paidAmount) > 0) throw new Error("Cannot edit an invoice that has payments");

      const existingInvNum = await tx.select().from(vendorInvoices).where(and(
        eq(vendorInvoices.tenantId, tenantId),
        eq(vendorInvoices.invoiceNumber, data.invoiceNumber),
        not(eq(vendorInvoices.id, data.id))
      )).limit(1);

      if (existingInvNum.length > 0) throw new Error("Invoice number already exists");

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

export const deletePurchaseOrderServerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

    await db.transaction(async (tx) => {
      const [po] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, data.id), eq(purchaseOrders.tenantId, tenantId))).limit(1);
      if (!po) throw new Error("PO not found or access denied");

      // Safely handle dependent data so it doesn't get corrupted
      // Since GRN and Vendor Invoices don't cascade, we nullify their link so they remain intact (or soft delete)
      await tx.update(grn).set({ purchaseOrderId: null }).where(eq(grn.purchaseOrderId, data.id));
      await tx.update(vendorInvoices).set({ purchaseOrderId: null }).where(eq(vendorInvoices.purchaseOrderId, data.id));

      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, data.id));

      if (user) {
        await tx.insert(auditLogs).values({
          tenantId,
          userId: user.id,
          action: "DELETED",
          entityType: "PURCHASE_ORDER",
          entityId: data.id,
          details: `${po.status} PO deleted`,
        });
      }
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
      items: { productId: string; orderedQty: number; receivedQty: number; batchNumber?: string | null; manufacturingDate?: string | null; expiryDate?: string | null }[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId, user } = await getPurchasingContext();

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

      if (!["Draft", "Ordered", "Sent", "Approved"].includes(po.status))
        throw new Error("GRN can only be recorded for open purchase orders (Draft, Ordered, Sent, Approved).");

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
        if (!item.batchNumber || item.batchNumber.trim() === "") throw new Error(`Batch number is required for product ${item.productId}`);
        if (!item.expiryDate) throw new Error(`Expiry date is required for batch ${item.batchNumber}`);

        if (item.manufacturingDate && new Date(item.expiryDate) <= new Date(item.manufacturingDate)) {
           throw new Error(`Expiry date must be after manufacturing date for batch ${item.batchNumber}`);
        }
        
        if (new Date(item.expiryDate) <= new Date()) {
           throw new Error(`Expiry date must be in the future for batch ${item.batchNumber}`);
        }

        const duplicateBatch = await tx.select().from(batches).where(and(
           eq(batches.tenantId, tenantId),
           eq(batches.branchId, po.branchId),
           eq(batches.productId, item.productId),
           eq(batches.batchNumber, item.batchNumber)
        )).limit(1);
        if (duplicateBatch.length > 0) throw new Error(`Duplicate batch number ${item.batchNumber} found for this product.`);

        const poItem = actualItemMap.get(item.productId);
        if (!poItem) throw new Error(`Product ${item.productId} was not part of the original PO`);
        if (item.receivedQty > poItem.qty)
          throw new Error(
            `Cannot receive more than ordered. Ordered: ${poItem.qty}, Received: ${item.receivedQty}`,
          );
        if (item.orderedQty !== poItem.qty) throw new Error("Ordered quantity mismatch in payload");
      }

      const hasVariance = data.items.some(item => item.orderedQty !== item.receivedQty);

      const [newGRN] = await tx
        .insert(grn)
        .values({
          tenantId,
          vendorId: po.vendorId,
          branchId: po.branchId,
          purchaseOrderId: po.id,
          grnNumber: data.grnNumber,
          status: hasVariance ? "variance" : "received",
        })
        .returning({ id: grn.id });

      const gItems = data.items.map((item) => ({
        grnId: newGRN.id,
        productId: item.productId,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        variance: item.orderedQty - item.receivedQty,
        batchNumber: item.batchNumber || null,
        manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate) : null,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
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
            });
          }

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
              unitCost: poItem!.unitPrice,
              createdBy: user?.id || null,
            });
          }
        }
      }

      if (user) {
        await tx.insert(auditLogs).values({
          tenantId,
          branchId: po.branchId,
          userId: user.id,
          action: "RECORDED_GRN",
          entityType: "PURCHASE_ORDER",
          entityId: po.id,
          details: `GRN ${data.grnNumber} recorded`,
        });
      }
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
    (d: { purchaseOrderId: string; invoiceNumber: string; dueDate: string; subtotal: number; vatRate: number; vatAmount: number; total: number; grnId?: string }) => d,
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

      // Fetch related completed GRN automatically
      const [relatedGrn] = await tx
        .select({ id: grn.id })
        .from(grn)
        .where(
          and(
            eq(grn.purchaseOrderId, po.id),
            eq(grn.tenantId, tenantId),
            eq(grn.vendorId, po.vendorId)
          )
        )
        .limit(1);

      if (!relatedGrn) {
        throw new Error("A completed GRN is required before creating a vendor invoice.");
      }

      // Backend calculation of totals, never trust frontend blindly
      const poItems = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, po.id));
      const calculatedSubtotal = poItems.reduce((acc, item) => acc + (item.qty * Number(item.unitPrice)), 0);
      const calculatedVatRate = Number(data.vatRate) || 5;
      const calculatedVatAmount = calculatedSubtotal * (calculatedVatRate / 100);
      const calculatedTotal = calculatedSubtotal + calculatedVatAmount;

      // Verify duplicate invoice number for the same vendor
      const existingInvNum = await tx
        .select()
        .from(vendorInvoices)
        .where(
          and(eq(vendorInvoices.vendorId, po.vendorId), eq(vendorInvoices.invoiceNumber, data.invoiceNumber), eq(vendorInvoices.tenantId, tenantId))
        )
        .limit(1);
      if (existingInvNum.length > 0) {
        throw new Error("Duplicate supplier invoice number for this vendor");
      }

      // Insert invoice
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
        dueDate: new Date(data.dueDate),
      }).returning({ id: vendorInvoices.id });

      // Update PO Status to Invoiced
      await tx
        .update(purchaseOrders)
        .set({ status: "Invoiced" })
        .where(eq(purchaseOrders.id, po.id));

      const { user } = await getPurchasingContext();
      if (user) {
        await tx.insert(auditLogs).values({
          tenantId,
          userId: user.id,
          action: "CREATED",
          entityType: "VENDOR_INVOICE",
          entityId: newInvoice.id,
          details: `Invoice ${data.invoiceNumber} created for AED ${data.total}`,
        });
      }
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
    };
  });

export const recordVendorPaymentServerFn = createServerFn({ method: "POST" })
  .validator((d: { invoiceId: string, amount: number, method: string, referenceNo: string, notes: string, paymentDate: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, user } = await getFinanceContext();

    if (data.amount <= 0) throw new Error("Payment amount must be greater than zero");

    await db.transaction(async (tx) => {
      // 1. Verify invoice
      const [invoice] = await tx.select().from(vendorInvoices).where(and(eq(vendorInvoices.id, data.invoiceId), eq(vendorInvoices.tenantId, tenantId))).limit(1);
      
      if (!invoice) throw new Error("Vendor Invoice not found");
      if (invoice.status === "Paid") throw new Error("This invoice is already fully paid");

      const total = Number(invoice.total);
      const paid = Number(invoice.paidAmount);
      const balance = total - paid;

      if (data.amount > balance) {
        throw new Error(`Payment amount (${data.amount}) cannot exceed remaining balance (${balance})`);
      }

      // 2. Insert payment record
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

      // 3. Update invoice status
      const newPaidAmount = paid + data.amount;
      const newStatus = newPaidAmount >= total ? "Paid" : "Partially Paid";

      await tx.update(vendorInvoices).set({
        paidAmount: newPaidAmount.toString(),
        status: newStatus
      }).where(eq(vendorInvoices.id, invoice.id));

      // 4. Audit Log
      await tx.insert(auditLogs).values({
        tenantId,
        userId: user.id,
        action: "CREATED",
        entityType: "VENDOR_PAYMENT",
        entityId: newPayment.id,
        details: { invoiceId: invoice.id, amount: data.amount, method: data.method }
      });
    });

    return { success: true };
  });
