import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import {
  tenants,
  branches,
  products,
  stockLevels,
  batches,
  purchaseOrders,
  grn,
  vendorInvoices,
  staffUsers,
  customers,
  promotions,
  tenantSettings,
  vendors,
  orders,
  stockTransfers,
  purchaseOrderItems,
  grnItems,
  orderItems,
  rolePermissions,
  priceOverrideRequests,
} from "@/server/db/schema";
import { eq, and, sql, desc, inArray, ne } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import * as argon2 from "argon2";

// Middleware
async function getHeadOfficeTenant() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session || res.session.role !== "Head Office Admin") {
    throw new Error("Unauthorized");
  }
  return res.session.tenantId;
}

export const getHeadOfficeDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const tenantId = await getHeadOfficeTenant();

  const tenantInfo = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  // Settings
  let settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantId),
  });
  if (!settings) {
    const [newSet] = await db.insert(tenantSettings).values({ tenantId }).returning();
    settings = newSet;
  }

  // Branches
  const dbBranches = await db.query.branches.findMany({
    where: eq(branches.tenantId, tenantId),
  });

  // Products
  const dbProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  // Stock Levels
  const dbStock = await db.query.stockLevels.findMany({
    where: inArray(
      stockLevels.branchId,
      dbBranches.map((b) => b.id).concat(["00000000-0000-0000-0000-000000000000"]),
    ),
  });

  // Batches
  const dbBatches = await db.query.batches.findMany({
    where: inArray(
      batches.branchId,
      dbBranches.map((b) => b.id).concat(["00000000-0000-0000-0000-000000000000"]),
    ),
    orderBy: [batches.expiryDate],
  });

  // POs
  const dbPos = await db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.tenantId, tenantId),
    with: { vendor: true, branch: true, items: { with: { product: true } } },
    orderBy: [desc(purchaseOrders.createdAt)],
  });

  // Vendors
  const dbVendors = await db.query.vendors.findMany({
    where: eq(vendors.tenantId, tenantId),
  });

  // Staff
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
      createdAt: true,
    },
  });

  // Customers
  const dbCustomers = await db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
  });

  // Promotions
  const dbPromotions = await db.query.promotions.findMany({
    where: eq(promotions.tenantId, tenantId),
  });

  // Permissions
  const dbPermissions = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.tenantId, tenantId),
  });

  // Orders for branch trend
  const dbOrders = await db.query.orders.findMany({
    where: eq(orders.tenantId, tenantId),
    columns: { branchId: true, total: true, vat: true, subtotal: true, createdAt: true },
  });

  // Calculate Output VAT (VAT collected on completed orders)
  const outputVat = dbOrders.reduce((sum, o) => sum + Number(o.vat || 0), 0);
  const salesTotal = dbOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Fetch Invoices to calculate Input VAT (VAT paid on purchases)
  const dbInvoices = await db.query.vendorInvoices.findMany({
    where: eq(vendorInvoices.tenantId, tenantId),
  });

  const vatRateVal = settings ? Number(settings.vatRate) : 5.0;
  const inputVat = dbInvoices.reduce((sum, inv) => {
    const total = Number(inv.total);
    const vat = total - total / (1 + vatRateVal / 100);
    return sum + vat;
  }, 0);
  const purchasesTotal = dbInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  // Calculate Reporting Period
  let reportingPeriod = "All Time";
  const dates: Date[] = [];
  dbOrders.forEach((o) => dates.push(new Date(o.createdAt)));
  dbInvoices.forEach((i) => dates.push(new Date(i.createdAt)));
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const formatD = (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    reportingPeriod = `${formatD(minDate)} - ${formatD(maxDate)}`;
  }

  // Generate dynamic 7-day trend
  const branchTrend: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    const dayData: any = { d: dayName };
    dbBranches.forEach((b) => {
      dayData[b.name] = 0; // default 0 sales
    });

    dbOrders.forEach((o) => {
      const oDate = new Date(o.createdAt);
      if (oDate.toDateString() === date.toDateString()) {
        const branch = dbBranches.find((b) => b.id === o.branchId);
        if (branch) {
          dayData[branch.name] += Number(o.total);
        }
      }
    });
    branchTrend.push(dayData);
  }

  const dbPriceOverrideRequests = await db.query.priceOverrideRequests.findMany({
    where: eq(priceOverrideRequests.tenantId, tenantId),
    orderBy: [desc(priceOverrideRequests.createdAt)],
    with: {
      product: true,
      branch: true,
    },
  });

  return {
    success: true,
    settings,
    priceRequests: dbPriceOverrideRequests,
    branches: dbBranches,
    products: dbProducts,
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
    tenantName: tenantInfo ? tenantInfo.name : "Tenant",
  };
});

export const updateStockFn = createServerFn({ method: "POST" })
  .validator((d: { productId: string; branchId: string; qty: number }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    await db.transaction(async (tx) => {
      const [branch] = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
      if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");

      const existingRows = await tx
        .select()
        .from(stockLevels)
        .where(
          and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)),
        )
        .limit(1);
      const existing = existingRows[0];

      if (existing) {
        await tx
          .update(stockLevels)
          .set({ stock: data.qty })
          .where(eq(stockLevels.id, existing.id));
      } else {
        await tx.insert(stockLevels).values({
          productId: data.productId,
          branchId: data.branchId,
          stock: data.qty,
          reorderLevel: 10,
        });
      }
    });

    return { success: true };
  });

export const updatePriceOverrideFn = createServerFn({ method: "POST" })
  .validator((d: { productId: string; branchId: string; priceOverride: string | null }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    await db.transaction(async (tx) => {
      const [branch] = await tx
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
      if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");

      const existingRows = await tx
        .select()
        .from(stockLevels)
        .where(
          and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)),
        )
        .limit(1);
      const existing = existingRows[0];

      if (existing) {
        await tx
          .update(stockLevels)
          .set({ priceOverride: data.priceOverride })
          .where(eq(stockLevels.id, existing.id));
      } else {
        await tx.insert(stockLevels).values({
          productId: data.productId,
          branchId: data.branchId,
          stock: 0,
          reorderLevel: 10,
          priceOverride: data.priceOverride,
        });
      }
    });

    return { success: true };
  });

export const handleOverrideRequestFn = createServerFn({ method: "POST" })
  .validator((d: { requestId: string; action: "Approve" | "Reject" }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    const request = await db.query.priceOverrideRequests.findFirst({
      where: and(
        eq(priceOverrideRequests.id, data.requestId),
        eq(priceOverrideRequests.tenantId, tenantId),
      ),
    });

    if (!request) {
      throw new Error("Request not found or unauthorized.");
    }

    if (request.status !== "Pending") {
      throw new Error("Request has already been processed.");
    }

    const sessionRes = await getSessionServerFn();
    const userId = sessionRes.session?.id || null;

    if (data.action === "Approve") {
      await db
        .update(priceOverrideRequests)
        .set({
          status: "Approved",
          approvedBy: userId,
          approvedAt: new Date(),
        })
        .where(eq(priceOverrideRequests.id, data.requestId));

      await db
        .update(stockLevels)
        .set({
          priceOverride: request.requestedPrice,
        })
        .where(eq(stockLevels.id, request.stockLevelId));
    } else {
      await db
        .update(priceOverrideRequests)
        .set({
          status: "Rejected",
          approvedBy: userId,
          approvedAt: new Date(),
        })
        .where(eq(priceOverrideRequests.id, data.requestId));
    }

    return { success: true };
  });

export const applyClearanceFn = createServerFn({ method: "POST" })
  .validator((d: { productId: string; discountPct: number }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    // create a promotion
    await db.insert(promotions).values({
      tenantId,
      name: "Clearance Sale",
      discountType: "percentage",
      discountValue: data.discountPct.toString(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      status: "Active",
    });
    return { success: true };
  });

export const updateVatSettingsFn = createServerFn({ method: "POST" })
  .validator((d: { vatRate: string; vatInclusive: boolean }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    await db
      .update(tenantSettings)
      .set({ vatRate: data.vatRate, vatInclusive: data.vatInclusive })
      .where(eq(tenantSettings.tenantId, tenantId));
    return { success: true };
  });

export const createPoFn = createServerFn({ method: "POST" })
  .validator((d: { vendorId: string; branchId: string; totalAmount: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    await db.insert(purchaseOrders).values({
      tenantId,
      branchId: data.branchId,
      vendorId: data.vendorId,
      status: "Pending",
      total: data.totalAmount,
    });
    return { success: true };
  });

export const updateLoyaltySettingsFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      pointsPerAed: string | number;
      minPointsToRedeem: string | number;
      redemptionRate: string | number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    const pointsPerAed = Number(data.pointsPerAed);
    const minPointsToRedeem = Number(data.minPointsToRedeem);
    const redemptionRate = Number(data.redemptionRate);

    if (isNaN(pointsPerAed) || pointsPerAed < 0 || !Number.isInteger(pointsPerAed)) {
      throw new Error("Points per AED must be a non-negative integer.");
    }
    if (isNaN(minPointsToRedeem) || minPointsToRedeem < 0 || !Number.isInteger(minPointsToRedeem)) {
      throw new Error("Minimum points to redeem must be a non-negative integer.");
    }
    if (isNaN(redemptionRate) || redemptionRate < 0) {
      throw new Error("Redemption rate must be a non-negative number.");
    }

    await db
      .update(tenantSettings)
      .set({
        loyaltyPointsPerAed: pointsPerAed,
        loyaltyMinPointsToRedeem: minPointsToRedeem,
        loyaltyRedemptionRate: redemptionRate.toFixed(4),
        updatedAt: new Date(),
      })
      .where(eq(tenantSettings.tenantId, tenantId));
    return { success: true };
  });

export const createCampaignFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      name: string;
      type: string;
      target: string;
      value: string | number;
      startDate: string;
      endDate: string;
      status: string;
      targetCategory?: string | null;
      targetProductIds?: string | null;
      bundleProducts?: string | null;
      pricingBasis?: string | null;
      minQty?: string | number | null;
      maxQty?: string | number | null;
      startTime?: string | null;
      endTime?: string | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    if (!data.name || data.name.trim() === "") {
      throw new Error("Campaign name is required.");
    }
    if (!data.type) {
      throw new Error("Campaign type is required.");
    }
    if (!data.target) {
      throw new Error("Campaign target is required.");
    }

    const numValue = Number(data.value);
    if (isNaN(numValue) && data.type !== "Bundle discount") {
      throw new Error("Value must be a valid number.");
    }

    if (data.type === "Percentage discount") {
      if (numValue < 0 || numValue > 100) {
        throw new Error("Percentage discount must be between 0 and 100.");
      }
    } else if (data.type === "Fixed amount discount") {
      if (numValue < 0) {
        throw new Error("Fixed amount discount cannot be negative.");
      }
    }

    // Dynamic pricing validation
    if (data.type === "Dynamic pricing") {
      if (!data.pricingBasis) {
        throw new Error("Pricing basis is required for dynamic pricing rules.");
      }
      if (data.pricingBasis === "Percentage adjustment") {
        if (numValue < 0 || numValue > 100) {
          throw new Error("Percentage adjustment must be between 0 and 100.");
        }
      } else {
        if (numValue < 0) {
          throw new Error("Adjustment value / price cannot be negative.");
        }
      }

      if (data.minQty !== undefined && data.minQty !== null && data.minQty !== "") {
        const minVal = Number(data.minQty);
        if (isNaN(minVal) || minVal < 0 || !Number.isInteger(minVal)) {
          throw new Error("Minimum quantity must be a non-negative integer.");
        }
      }
      if (data.maxQty !== undefined && data.maxQty !== null && data.maxQty !== "") {
        const maxVal = Number(data.maxQty);
        if (isNaN(maxVal) || maxVal < 0 || !Number.isInteger(maxVal)) {
          throw new Error("Maximum quantity must be a non-negative integer.");
        }
        if (data.minQty !== undefined && data.minQty !== null && data.minQty !== "") {
          if (maxVal < Number(data.minQty)) {
            throw new Error("Maximum quantity cannot be less than minimum quantity.");
          }
        }
      }

      const timeRegex = /^\d{2}:\d{2}$/;
      if (data.startTime && data.startTime.trim() !== "") {
        if (!timeRegex.test(data.startTime)) {
          throw new Error("Start time must be in HH:mm format.");
        }
      }
      if (data.endTime && data.endTime.trim() !== "") {
        if (!timeRegex.test(data.endTime)) {
          throw new Error("End time must be in HH:mm format.");
        }
        if (data.startTime && data.startTime.trim() !== "" && data.endTime < data.startTime) {
          throw new Error("End time cannot be earlier than start time.");
        }
      }
    }

    // Validate Target Scope
    if (data.target === "Category") {
      if (!data.targetCategory || data.targetCategory.trim() === "") {
        throw new Error("Category selection is required.");
      }
    } else if (data.target === "Selected products") {
      if (!data.targetProductIds || data.targetProductIds.trim() === "") {
        throw new Error("At least one product must be selected.");
      }
    }

    // Validate Bundle Discount
    if (data.type === "Bundle discount") {
      if (!data.bundleProducts || data.bundleProducts.trim() === "") {
        throw new Error("Bundle configuration is required.");
      }
      try {
        const bundle = JSON.parse(data.bundleProducts);
        if (!Array.isArray(bundle) || bundle.length < 2) {
          throw new Error("Bundle must contain at least 2 products.");
        }
        for (const item of bundle) {
          if (!item.productId || !item.qty || isNaN(Number(item.qty)) || Number(item.qty) <= 0) {
            throw new Error(
              "Each bundle item must have a valid product and quantity greater than 0.",
            );
          }
        }
      } catch (e: any) {
        throw new Error(e.message || "Invalid bundle configuration.");
      }
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end date.");
    }
    if (end < start) {
      throw new Error("End date cannot be earlier than start date.");
    }

    let discountType = "percentage";
    if (data.type === "Fixed amount discount") {
      discountType = "fixed";
    } else if (data.type === "Bundle discount") {
      discountType = "bundle";
    } else if (data.type === "Dynamic pricing") {
      if (data.pricingBasis === "Percentage adjustment") {
        discountType = "percentage";
      } else {
        discountType = "fixed";
      }
    }

    let displayValue = "";
    if (data.type === "Percentage discount") {
      displayValue = `${numValue}% off`;
    } else if (data.type === "Fixed amount discount") {
      displayValue = `AED ${numValue} flat`;
    } else if (data.type === "Bundle discount") {
      displayValue = `Bundle price: AED ${numValue}`;
    } else if (data.type === "Dynamic pricing") {
      if (data.pricingBasis === "Percentage adjustment") {
        displayValue = `${numValue}% adjust`;
      } else if (data.pricingBasis === "Fixed amount adjustment") {
        displayValue = `AED ${numValue} adjust`;
      } else if (data.pricingBasis === "Fixed final price") {
        displayValue = `AED ${numValue} final`;
      }
    }

    // Format target display text
    let displayTarget = data.target;
    if (data.target === "Category") {
      displayTarget = `Category: ${data.targetCategory}`;
    } else if (data.target === "Selected products") {
      const productIds = (data.targetProductIds || "").split(",").filter(Boolean);
      displayTarget = `${productIds.length} selected products`;
    }

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
      endTime: data.endTime,
    });

    return { success: true };
  });

export const createProductFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      name: string;
      barcode?: string | null;
      category: string;
      unit: string;
      costPrice: string | number;
      salePrice: string | number;
      isBatchTracked: boolean;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      sessionRes.session.role !== "Head Office Admin"
    )
      throw new Error("Unauthorized");

    const tenantId = sessionRes.session.tenantId;

    const parsedCost = Number(data.costPrice);
    const parsedSale = Number(data.salePrice);
    if (isNaN(parsedCost) || isNaN(parsedSale)) {
      return { success: false, error: "Cost and sale prices must be valid numbers" };
    }
    if (parsedCost < 0) {
      return { success: false, error: "Cost price cannot be negative" };
    }
    if (parsedSale <= 0) {
      return { success: false, error: "Sale price must be greater than zero" };
    }

    const cleanBarcode =
      data.barcode === "" || data.barcode === undefined || data.barcode === null
        ? null
        : data.barcode;

    if (cleanBarcode) {
      const [existing] = await db
        .select()
        .from(products)
        .where(and(eq(products.tenantId, tenantId), eq(products.barcode, cleanBarcode)));
      if (existing) return { success: false, error: "Product with this barcode already exists" };
    }

    try {
      let newProduct: any;
      await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(products)
          .values({
            tenantId,
            name: data.name,
            barcode: cleanBarcode,
            category: data.category,
            unit: data.unit,
            costPrice: parsedCost.toFixed(2),
            salePrice: parsedSale.toFixed(2),
            isBatchTracked: data.isBatchTracked,
          })
          .returning();
        newProduct = inserted;

        const tenantBranches = await tx
          .select({ id: branches.id })
          .from(branches)
          .where(eq(branches.tenantId, tenantId));
        if (tenantBranches.length > 0) {
          const stockInserts = tenantBranches.map((b) => ({
            productId: newProduct.id,
            branchId: b.id,
            stock: 0,
            reorderLevel: 10,
          }));
          await tx.insert(stockLevels).values(stockInserts);
        }
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: "Failed to create product" };
    }
  });

export const updateProductFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id: string;
      name?: string;
      barcode?: string | null;
      category?: string;
      unit?: string;
      costPrice?: string | number;
      salePrice?: string | number;
      isBatchTracked?: boolean;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      sessionRes.session.role !== "Head Office Admin"
    )
      throw new Error("Unauthorized");

    const [existingProduct] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, data.id), eq(products.tenantId, sessionRes.session.tenantId)));
    if (!existingProduct) throw new Error("Unauthorized");

    const cleanBarcode =
      data.barcode === "" || data.barcode === undefined || data.barcode === null
        ? null
        : data.barcode;

    if (cleanBarcode) {
      const [duplicate] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.tenantId, sessionRes.session.tenantId),
            eq(products.barcode, cleanBarcode),
          ),
        );
      if (duplicate && duplicate.id !== data.id)
        return { success: false, error: "Product with this barcode already exists" };
    }

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.barcode !== undefined) updates.barcode = cleanBarcode;
    if (data.category !== undefined) updates.category = data.category;
    if (data.unit !== undefined) updates.unit = data.unit;

    if (data.costPrice !== undefined) {
      const parsedCost = Number(data.costPrice);
      if (isNaN(parsedCost) || parsedCost < 0) {
        return { success: false, error: "Cost price cannot be negative" };
      }
      updates.costPrice = parsedCost.toFixed(2);
    }

    if (data.salePrice !== undefined) {
      const parsedSale = Number(data.salePrice);
      if (isNaN(parsedSale) || parsedSale <= 0) {
        return { success: false, error: "Sale price must be greater than zero" };
      }
      updates.salePrice = parsedSale.toFixed(2);
    }

    if (data.isBatchTracked !== undefined) updates.isBatchTracked = data.isBatchTracked;

    try {
      await db.update(products).set(updates).where(eq(products.id, data.id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: "Failed to update product" };
    }
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      sessionRes.session.role !== "Head Office Admin"
    )
      throw new Error("Unauthorized");

    const tenantId = sessionRes.session.tenantId;

    try {
      const result = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ tenantId: products.tenantId })
          .from(products)
          .where(eq(products.id, data.id));
        if (!existing || existing.tenantId !== tenantId) {
          return { success: false, error: "Unauthorized" };
        }

        // 1. Stock Levels (block if stock != 0 in any branch)
        const activeStock = await tx
          .select()
          .from(stockLevels)
          .where(and(eq(stockLevels.productId, data.id), ne(stockLevels.stock, 0)));
        if (activeStock.length > 0) {
          if (process.env["NODE_ENV"] !== "production") {
            console.log(`[DEBUG] Delete blocked: product ${data.id} has active stock`, activeStock);
          }
          return { success: false, error: "PRODUCT_USED_IN_STOCK" };
        }

        // 2. Stock Transfers
        const transfers = await tx
          .select()
          .from(stockTransfers)
          .where(eq(stockTransfers.productId, data.id))
          .limit(1);
        if (transfers.length > 0) {
          if (process.env["NODE_ENV"] !== "production") {
            console.log(
              `[DEBUG] Delete blocked: product ${data.id} has stock transfers`,
              transfers,
            );
          }
          return { success: false, error: "PRODUCT_USED_IN_STOCK_TRANSFER" };
        }

        // 3. Batches
        const batchHistory = await tx
          .select()
          .from(batches)
          .where(eq(batches.productId, data.id))
          .limit(1);
        if (batchHistory.length > 0) {
          if (process.env["NODE_ENV"] !== "production") {
            console.log(`[DEBUG] Delete blocked: product ${data.id} has batches`, batchHistory);
          }
          return { success: false, error: "PRODUCT_USED_IN_BATCH" };
        }

        // 4. Sales / Order Items
        const sales = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.productId, data.id))
          .limit(1);
        if (sales.length > 0) {
          if (process.env["NODE_ENV"] !== "production") {
            console.log(`[DEBUG] Delete blocked: product ${data.id} is in orders`, sales);
          }
          return { success: false, error: "PRODUCT_USED_IN_SALES" };
        }

        // 5. Purchase Order Items
        const purchases = await tx
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.productId, data.id))
          .limit(1);
        if (purchases.length > 0) {
          if (process.env["NODE_ENV"] !== "production") {
            console.log(
              `[DEBUG] Delete blocked: product ${data.id} is in purchase orders`,
              purchases,
            );
          }
          return { success: false, error: "PRODUCT_USED_IN_PURCHASE" };
        }

        // 6. GRN Items
        const grns = await tx
          .select()
          .from(grnItems)
          .where(eq(grnItems.productId, data.id))
          .limit(1);
        if (grns.length > 0) {
          if (process.env["NODE_ENV"] !== "production") {
            console.log(`[DEBUG] Delete blocked: product ${data.id} is in GRNs`, grns);
          }
          return { success: false, error: "PRODUCT_USED_IN_GRN" };
        }

        // All checks passed, proceed with delete
        await tx.delete(products).where(eq(products.id, data.id));
        return { success: true };
      });
      return result;
    } catch (error: any) {
      if (process.env["NODE_ENV"] !== "production") {
        console.error(`[ERROR] Delete failed for product ${data.id}:`, error);
      }
      return { success: false, error: "Failed to delete product" };
    }
  });

export const adjustStockServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: { productId: string; branchId: string; adjustmentQty: number; type: "add" | "remove" }) =>
      d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    if (data.adjustmentQty <= 0) throw new Error("Adjustment quantity must be greater than zero");

    const [branch] = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
    if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");

    await db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(stockLevels)
        .where(
          and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)),
        )
        .limit(1);
      const existing = existingRows[0];

      const currentStock = existing ? existing.stock : 0;
      const newStock =
        data.type === "add" ? currentStock + data.adjustmentQty : currentStock - data.adjustmentQty;

      if (newStock < 0) throw new Error("Stock cannot be negative after removal");

      if (existing) {
        await tx
          .update(stockLevels)
          .set({ stock: newStock })
          .where(eq(stockLevels.id, existing.id));
      } else {
        await tx.insert(stockLevels).values({
          productId: data.productId,
          branchId: data.branchId,
          stock: newStock,
          reorderLevel: 10,
        });
      }
    });
    return { success: true };
  });

export const createBatchServerFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      productId: string;
      branchId: string;
      batchNumber: string;
      expiryDate: string;
      initialStock: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    if (data.initialStock < 0) throw new Error("Initial stock cannot be negative");
    if (new Date(data.expiryDate) <= new Date())
      throw new Error("Expiry date must be in the future");

    const [branch] = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, data.productId), eq(products.tenantId, tenantId)));
    if (!branch || !product) throw new Error("Unauthorized or invalid product/branch");
    if (!product.isBatchTracked) throw new Error("Product must have batch tracking enabled");

    await db.transaction(async (tx) => {
      const existingBatch = await tx
        .select()
        .from(batches)
        .where(
          and(
            eq(batches.productId, data.productId),
            eq(batches.branchId, data.branchId),
            eq(batches.batchNumber, data.batchNumber),
          ),
        )
        .limit(1);
      if (existingBatch.length > 0)
        throw new Error("Batch number already exists for this branch and product");

      await tx.insert(batches).values({
        productId: data.productId,
        branchId: data.branchId,
        batchNumber: data.batchNumber,
        expiryDate: new Date(data.expiryDate),
        stock: data.initialStock,
      });

      if (data.initialStock > 0) {
        const existingRows = await tx
          .select()
          .from(stockLevels)
          .where(
            and(eq(stockLevels.productId, data.productId), eq(stockLevels.branchId, data.branchId)),
          )
          .limit(1);
        const existing = existingRows[0];
        if (existing) {
          await tx
            .update(stockLevels)
            .set({ stock: existing.stock + data.initialStock })
            .where(eq(stockLevels.id, existing.id));
        } else {
          await tx.insert(stockLevels).values({
            productId: data.productId,
            branchId: data.branchId,
            stock: data.initialStock,
            reorderLevel: 10,
          });
        }
      }
    });
    return { success: true };
  });

export const createStaffFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      name: string;
      email: string;
      role: string;
      branchId: string;
      password?: string;
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    if (!data.name || !data.email) throw new Error("Name and email are required");
    if (!data.branchId) throw new Error("Branch assignment is required");

    const allowedRoles = ["branch_manager", "inventory_manager", "purchasing_officer", "cashier"];
    if (!allowedRoles.includes(data.role)) {
      throw new Error("Invalid or unauthorized role selected.");
    }

    const [branch] = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
    if (!branch) throw new Error("Invalid or unauthorized branch.");

    const [existingUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.email, data.email));
    if (existingUser) throw new Error("Email already in use");

    const payload: any = {
      tenantId,
      name: data.name,
      email: data.email,
      role: data.role as any,
      branchId: data.branchId,
    };

    if (data.role === "cashier") {
      if (!data.pin) throw new Error("PIN is required for Cashier on creation");
      payload.pinHash = await argon2.hash(data.pin);
    } else {
      if (!data.password) throw new Error("Password is required on creation");
      payload.passwordHash = await argon2.hash(data.password);
    }

    await db.insert(staffUsers).values(payload);
    return { success: true };
  });

export const updateStaffFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id: string;
      name: string;
      email: string;
      role: string;
      branchId: string;
      isActive: boolean;
      password?: string;
      pin?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    if (!data.name || !data.email) throw new Error("Name and email are required");
    if (!data.branchId) throw new Error("Branch assignment is required");

    const allowedRoles = ["branch_manager", "inventory_manager", "purchasing_officer", "cashier"];
    if (!allowedRoles.includes(data.role)) {
      throw new Error("Invalid or unauthorized role selected.");
    }

    const [existingUser] = await db
      .select()
      .from(staffUsers)
      .where(and(eq(staffUsers.id, data.id), eq(staffUsers.tenantId, tenantId)));
    if (!existingUser) throw new Error("Staff not found or unauthorized");

    if (existingUser.role === "head_office_admin" || existingUser.role === "super_admin") {
      throw new Error("Cannot modify admin users from this interface.");
    }

    const [branch] = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)));
    if (!branch) throw new Error("Invalid or unauthorized branch.");

    if (data.email !== existingUser.email) {
      const [duplicateCheck] = await db
        .select()
        .from(staffUsers)
        .where(eq(staffUsers.email, data.email));
      if (duplicateCheck) throw new Error("Email already in use");
    }

    const updates: any = {
      name: data.name,
      email: data.email,
      role: data.role as any,
      branchId: data.branchId,
      isActive: data.isActive,
    };

    // Handle role transitions and credential preservation
    if (data.role === "cashier" && existingUser.role !== "cashier") {
      if (!data.pin) throw new Error("PIN is required when changing role to Cashier");
      updates.pinHash = await argon2.hash(data.pin);
      updates.passwordHash = null;
    } else if (data.role !== "cashier" && existingUser.role === "cashier") {
      if (!data.password) throw new Error("Password is required when changing role from Cashier");
      updates.passwordHash = await argon2.hash(data.password);
      updates.pinHash = null;
    } else {
      // Same role category, just update if provided
      if (data.password && data.role !== "cashier")
        updates.passwordHash = await argon2.hash(data.password);
      if (data.pin && data.role === "cashier") updates.pinHash = await argon2.hash(data.pin);
    }

    await db.update(staffUsers).set(updates).where(eq(staffUsers.id, data.id));
    return { success: true };
  });

export const createVendorFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      name: string;
      contact?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      status?: string;
      trn?: string | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    if (!data.name) throw new Error("Vendor name is required");

    const cleanEmail =
      data.email === "" || data.email === undefined || data.email === null ? null : data.email;
    if (cleanEmail) {
      // Check for valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: "Invalid email format" };
      }
      // Check duplicate email
      const [existing] = await db.select().from(vendors).where(eq(vendors.email, cleanEmail));
      if (existing) return { success: false, error: "Email is already in use by another vendor" };
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
        status: data.status || "Active",
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create vendor" };
    }
  });

export const updateVendorFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id: string;
      name: string;
      contact?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      status?: string;
      trn?: string | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    const [existingVendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId)));
    if (!existingVendor) throw new Error("Unauthorized or vendor not found");

    if (!data.name) throw new Error("Vendor name is required");

    const cleanEmail =
      data.email === "" || data.email === undefined || data.email === null ? null : data.email;
    if (cleanEmail && cleanEmail !== existingVendor.email) {
      // Check for valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: "Invalid email format" };
      }
      // Check duplicate email
      const [existing] = await db.select().from(vendors).where(eq(vendors.email, cleanEmail));
      if (existing && existing.id !== data.id) {
        return { success: false, error: "Email is already in use by another vendor" };
      }
    }

    try {
      await db
        .update(vendors)
        .set({
          name: data.name,
          contact: data.contact || null,
          phone: data.phone || null,
          email: cleanEmail,
          address: data.address || null,
          trn: data.trn || null,
          status: data.status || "Active",
        })
        .where(eq(vendors.id, data.id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update vendor" };
    }
  });

export const deleteVendorFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    const [existingVendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, data.id), eq(vendors.tenantId, tenantId)));
    if (!existingVendor) throw new Error("Unauthorized or vendor not found");

    // Deletion must be blocked if referenced by purchase orders or invoices
    const [poReference] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.vendorId, data.id))
      .limit(1);
    if (poReference) {
      return { success: false, error: "VENDOR_USED_IN_PURCHASES" };
    }

    const [invoiceReference] = await db
      .select()
      .from(vendorInvoices)
      .where(eq(vendorInvoices.vendorId, data.id))
      .limit(1);
    if (invoiceReference) {
      return { success: false, error: "VENDOR_USED_IN_INVOICES" };
    }

    try {
      await db.delete(vendors).where(eq(vendors.id, data.id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete vendor" };
    }
  });

export const toggleRolePermissionFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      role:
        | "super_admin"
        | "head_office_admin"
        | "branch_manager"
        | "inventory_manager"
        | "purchasing_officer"
        | "cashier";
      permission: string;
      enabled: boolean;
    }) => d,
  )
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();

    // Safety check: Head Office Admin and Super Admin permissions are locked and should not be modified
    if (data.role === "head_office_admin" || data.role === "super_admin") {
      throw new Error("Permissions for admin roles are locked and cannot be modified.");
    }

    // Insert or update permission mapping
    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.tenantId, tenantId),
            eq(rolePermissions.role, data.role),
            eq(rolePermissions.permission, data.permission),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(rolePermissions)
          .set({ enabled: data.enabled })
          .where(eq(rolePermissions.id, existing[0]!.id));
      } else {
        await tx.insert(rolePermissions).values({
          tenantId,
          role: data.role,
          permission: data.permission,
          enabled: data.enabled,
        });
      }
    });

    return { success: true };
  });
