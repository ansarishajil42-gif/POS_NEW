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
  customerTransactions,
  productBarcodes,
  productVariants,
  unitConversions,
} from "@/server/db/schema";
import { eq, and, sql, desc, inArray, ne, or, ilike, lte, gte } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import { logAuditAction } from "@/lib/audit-logger";
import * as argon2 from "argon2";
import { createBranchInternal } from "@/lib/branch-server-helpers";
import { z } from "zod";

// Middleware
async function getHeadOfficeSession() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session || res.session.role !== "Head Office Admin") {
    throw new Error("Unauthorized");
  }
  return { tenantId: res.session.tenantId, userId: res.session.userId };
}

async function getHeadOfficeTenant() {
  const session = await getHeadOfficeSession();
  return session.tenantId;
}

export const createBranchForTenantFn = createServerFn({ method: "POST" })
  .validator((d: { name: string; address: string }) => d)
  .handler(async ({ data }) => {
    const session = await getHeadOfficeSession();
    try {
      const branch = await createBranchInternal({
        tenantId: session.tenantId,
        name: data.name,
        address: data.address,
        userId: session.userId,
      });
      return { success: true, branchId: branch.id };
    } catch (e: any) {
      throw new Error(e.message);
    }
  });

export const updateBranchFn = createServerFn({ method: "POST" })
  .validator((d: { branchId: string; name: string; address: string }) => d)
  .handler(async ({ data }) => {
    const session = await getHeadOfficeSession();
    const branchCheck = await db.query.branches.findFirst({
      where: and(eq(branches.id, data.branchId), eq(branches.tenantId, session.tenantId)),
    });
    if (!branchCheck) throw new Error("Branch not found or unauthorized");

    await db.update(branches)
      .set({ name: data.name, address: data.address })
      .where(eq(branches.id, data.branchId));
      
    await logAuditAction({
      action: "Update Branch",
      entityType: "branch",
      entityId: data.branchId,
      tenantId: session.tenantId,
      userId: session.userId,
      afterValue: { name: data.name, address: data.address }
    });
    return { success: true };
  });

export const activateBranchFn = createServerFn({ method: "POST" })
  .validator((d: { branchId: string }) => d)
  .handler(async ({ data }) => {
    const session = await getHeadOfficeSession();
    const branchCheck = await db.query.branches.findFirst({
      where: and(eq(branches.id, data.branchId), eq(branches.tenantId, session.tenantId)),
    });
    if (!branchCheck) throw new Error("Branch not found or unauthorized");

    await db.update(branches).set({ status: "Active" }).where(eq(branches.id, data.branchId));
    await logAuditAction({ action: "Activate Branch", entityType: "branch", entityId: data.branchId, tenantId: session.tenantId, userId: session.userId, afterValue: { status: "Active" } });
    return { success: true };
  });

export const deactivateBranchFn = createServerFn({ method: "POST" })
  .validator((d: { branchId: string }) => d)
  .handler(async ({ data }) => {
    const session = await getHeadOfficeSession();
    const branchCheck = await db.query.branches.findFirst({
      where: and(eq(branches.id, data.branchId), eq(branches.tenantId, session.tenantId)),
    });
    if (!branchCheck) throw new Error("Branch not found or unauthorized");

    await db.update(branches).set({ status: "Inactive" }).where(eq(branches.id, data.branchId));
    await logAuditAction({ action: "Deactivate Branch", entityType: "branch", entityId: data.branchId, tenantId: session.tenantId, userId: session.userId, afterValue: { status: "Inactive" } });
    return { success: true };
  });

export const getBranchDetailsFn = createServerFn({ method: "GET" })
  .validator((d: { branchId: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const branch = await db.query.branches.findFirst({
      where: and(eq(branches.id, data.branchId), eq(branches.tenantId, tenantId)),
      with: {
        staffUsers: true,
      }
    });
    if (!branch) throw new Error("Branch not found");
    return { branch };
  });

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
  const [dbProducts, dbBarcodes, dbVariants, dbConversions] = await Promise.all([
    db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
    }),
    db.select().from(productBarcodes),
    db.select().from(productVariants),
    db.select().from(unitConversions),
  ]);

  const productsWithDetails = dbProducts.map((p) => {
    const alternateBarcodes = dbBarcodes
      .filter((b) => b.productId === p.id)
      .map((b) => b.barcode);
    const variants = dbVariants
      .filter((v) => v.productId === p.id)
      .map((v) => ({
        variantName: v.variantName,
        variantValue: v.variantValue,
        sku: v.sku,
        priceAdjustment: v.priceAdjustment,
      }));
    const conversions = dbConversions
      .filter((c) => c.productId === p.id)
      .map((c) => ({
        fromUnit: c.fromUnit,
        toUnit: c.toUnit,
        conversionFactor: c.conversionFactor,
      }));

    return {
      ...p,
      alternateBarcodes,
      variants,
      conversions,
    };
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
      barcodes?: string[];
      variants?: { variantName: string; variantValue: string; sku?: string | null; priceAdjustment: string | number }[];
      conversions?: { fromUnit: string; toUnit: string; conversionFactor: string | number }[];
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

        // Insert barcodes
        if (data.barcodes && data.barcodes.length > 0) {
          const barcodeInserts = data.barcodes.map((b) => ({
            productId: newProduct.id,
            barcode: b,
          }));
          await tx.insert(productBarcodes).values(barcodeInserts);
        }

        // Insert variants
        if (data.variants && data.variants.length > 0) {
          const variantInserts = data.variants.map((v) => ({
            productId: newProduct.id,
            variantName: v.variantName,
            variantValue: v.variantValue,
            sku: v.sku || null,
            priceAdjustment: Number(v.priceAdjustment).toFixed(2),
          }));
          await tx.insert(productVariants).values(variantInserts);
        }

        // Insert conversions
        if (data.conversions && data.conversions.length > 0) {
          const conversionInserts = data.conversions.map((c) => ({
            productId: newProduct.id,
            fromUnit: c.fromUnit,
            toUnit: c.toUnit,
            conversionFactor: Number(c.conversionFactor).toString(),
          }));
          await tx.insert(unitConversions).values(conversionInserts);
        }

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
      console.error(error);
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
      barcodes?: string[];
      variants?: { variantName: string; variantValue: string; sku?: string | null; priceAdjustment: string | number }[];
      conversions?: { fromUnit: string; toUnit: string; conversionFactor: string | number }[];
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
      await db.transaction(async (tx) => {
        await tx.update(products).set(updates).where(eq(products.id, data.id));

        // Update barcodes
        if (data.barcodes !== undefined) {
          await tx.delete(productBarcodes).where(eq(productBarcodes.productId, data.id));
          if (data.barcodes.length > 0) {
            const barcodeInserts = data.barcodes.map((b) => ({
              productId: data.id,
              barcode: b,
            }));
            await tx.insert(productBarcodes).values(barcodeInserts);
          }
        }

        // Update variants
        if (data.variants !== undefined) {
          await tx.delete(productVariants).where(eq(productVariants.productId, data.id));
          if (data.variants.length > 0) {
            const variantInserts = data.variants.map((v) => ({
              productId: data.id,
              variantName: v.variantName,
              variantValue: v.variantValue,
              sku: v.sku || null,
              priceAdjustment: Number(v.priceAdjustment).toFixed(2),
            }));
            await tx.insert(productVariants).values(variantInserts);
          }
        }

        // Update conversions
        if (data.conversions !== undefined) {
          await tx.delete(unitConversions).where(eq(unitConversions.productId, data.id));
          if (data.conversions.length > 0) {
            const conversionInserts = data.conversions.map((c) => ({
              productId: data.id,
              fromUnit: c.fromUnit,
              toUnit: c.toUnit,
              conversionFactor: Number(c.conversionFactor).toString(),
            }));
            await tx.insert(unitConversions).values(conversionInserts);
          }
        }
      });
      return { success: true };
    } catch (error: any) {
      console.error(error);
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
    if (product.isBatchTracked === false) throw new Error("Product must have batch tracking enabled");

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

// ==========================================
// CUSTOMER CRM & LOYALTY (HEAD OFFICE ADMIN)
// ==========================================

export const createCustomerFn = createServerFn({ method: "POST" })
  .validator((d: { name: string; phone?: string; email?: string; tier?: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const emailToUse = data.email?.toLowerCase().trim() || null;
    const phoneToUse = data.phone?.trim() || null;
    
    if (emailToUse) {
      const existingEmail = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.email, emailToUse)))
        .limit(1);
      if (existingEmail.length > 0) {
        throw new Error("Email is already in use by another customer in this tenant.");
      }
    }
    
    if (phoneToUse) {
      const existingPhone = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phoneToUse)))
        .limit(1);
      if (existingPhone.length > 0) {
        throw new Error("Phone number is already in use by another customer in this tenant.");
      }
    }
    
    const [newCustomer] = await db.insert(customers).values({
      tenantId,
      name: data.name,
      phone: phoneToUse,
      email: emailToUse,
      tier: data.tier || "Bronze",
      points: 0,
      storeCredit: "0.00",
      isActive: true,
    }).returning();
    
    await logAuditAction({ action: "Customer Profile Created", entityType: "Customer", entityId: newCustomer.id });
    
    return { success: true, customer: newCustomer };
  });

export const updateCustomerFn = createServerFn({ method: "POST" })
  .validator((d: { id: string; name: string; phone?: string; email?: string; isActive?: boolean }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const emailToUse = data.email?.toLowerCase().trim() || null;
    const phoneToUse = data.phone?.trim() || null;
    
    if (emailToUse) {
      const existingEmail = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.email, emailToUse), ne(customers.id, data.id)))
        .limit(1);
      if (existingEmail.length > 0) {
        throw new Error("Email is already in use by another customer.");
      }
    }
    if (phoneToUse) {
      const existingPhone = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phoneToUse), ne(customers.id, data.id)))
        .limit(1);
      if (existingPhone.length > 0) {
        throw new Error("Phone number is already in use by another customer.");
      }
    }
    
    const [updated] = await db.update(customers).set({
      name: data.name,
      phone: phoneToUse,
      email: emailToUse,
      isActive: data.isActive !== undefined ? data.isActive : true,
    }).where(and(eq(customers.id, data.id), eq(customers.tenantId, tenantId))).returning();
    
    if (!updated) throw new Error("Customer not found");
    
    await logAuditAction({ action: "Customer Profile Updated", entityType: "Customer", entityId: updated.id, afterValue: { isActive: updated.isActive } });
    return { success: true, customer: updated };
  });

export const getCustomerDetailsFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const [customer] = await db.select().from(customers).where(and(eq(customers.id, data.id), eq(customers.tenantId, tenantId)));
    if (!customer) throw new Error("Customer not found");
    
    return { success: true, customer };
  });

export const searchCustomersFn = createServerFn({ method: "POST" })
  .validator((d: { search: string; page?: number; limit?: number }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const page = data.page || 1;
    const limit = Math.min(data.limit || 50, 100);
    const offset = (page - 1) * limit;
    
    const searchTerm = `%${data.search.trim().toLowerCase()}%`;
    
    const results = await db.select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          or(
            ilike(customers.name, searchTerm),
            ilike(customers.email, searchTerm),
            ilike(customers.phone, searchTerm)
          )
        )
      )
      .limit(limit)
      .offset(offset);
      
    return { success: true, customers: results };
  });

export const getCustomerPurchaseHistoryFn = createServerFn({ method: "POST" })
  .validator((d: { customerId: string; page?: number; limit?: number }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const page = data.page || 1;
    const limit = Math.min(data.limit || 50, 100);
    const offset = (page - 1) * limit;
    
    const customerOrders = await db.select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, data.customerId)))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
      
    const [totalAgg] = await db.select({
      totalSpend: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
      count: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenantId), eq(orders.customerId, data.customerId)));
    
    return { 
      success: true, 
      orders: customerOrders,
      totalSpend: Number(totalAgg?.totalSpend || 0),
      orderCount: Number(totalAgg?.count || 0)
    };
  });

export const accrueLoyaltyPointsFn = createServerFn({ method: "POST" })
  .validator((d: { orderId: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    return await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(and(eq(orders.id, data.orderId), eq(orders.tenantId, tenantId)));
      if (!order) throw new Error("Order not found");
      if (order.status !== "completed") throw new Error("Order is not completed");
      if (!order.customerId) throw new Error("Order has no assigned customer");
      
      const [settings] = await tx.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId));
      if (!settings) throw new Error("Tenant settings not found");
      
      // Idempotency check
      const [existingEarn] = await tx.select().from(customerTransactions).where(and(
        eq(customerTransactions.orderId, order.id),
        eq(customerTransactions.type, "earn_points")
      ));
      
      if (existingEarn) return { success: true, message: "Points already accrued for this order" };
      
      const pointsRate = Number(settings.loyaltyPointsPerAed || 0);
      const pointsToEarn = Math.floor(Number(order.total) * pointsRate);
      
      if (pointsToEarn <= 0) return { success: true, pointsEarned: 0 };
      
      await tx.insert(customerTransactions).values({
        tenantId,
        customerId: order.customerId,
        orderId: order.id,
        type: "earn_points",
        points: pointsToEarn,
        amount: order.total,
      });
      
      await tx.execute(sql`UPDATE customers SET points = points + ${pointsToEarn} WHERE id = ${order.customerId} AND tenant_id = ${tenantId}`);
      
      return { success: true, pointsEarned: pointsToEarn };
    });
  });

export const redeemLoyaltyPointsFn = createServerFn({ method: "POST" })
  .validator((d: { customerId: string; pointsToRedeem: number; orderId?: string }) => d)
  .handler(async ({ data }) => {
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
        points: -data.pointsToRedeem,
      });
      
      await logAuditAction({ action: "Points Redeemed", entityType: "Customer", entityId: data.customerId, afterValue: { pointsRedeemed: data.pointsToRedeem } });
      return { success: true };
    });
  });

export const adjustCustomerPointsFn = createServerFn({ method: "POST" })
  .validator((d: { customerId: string; pointsDelta: number; reason: string }) => d)
  .handler(async ({ data }) => {
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
        points: data.pointsDelta,
      });
      
      await logAuditAction({ action: "Points Adjusted", entityType: "Customer", entityId: data.customerId, afterValue: { delta: data.pointsDelta, reason: data.reason } });
      return { success: true, newBalance };
    });
  });

export const adjustCustomerBalanceFn = createServerFn({ method: "POST" })
  .validator((d: { customerId: string; amountDelta: number; reason: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    if (data.amountDelta === 0) throw new Error("Adjustment must be non-zero");
    if (!data.reason?.trim()) throw new Error("Reason is required");
    
    return await db.transaction(async (tx) => {
      const [customer] = await tx.select().from(customers).where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)));
      if (!customer) throw new Error("Customer not found");
      
      const currentBalance = Number(customer.storeCredit || 0);
      const newBalance = currentBalance + data.amountDelta;
      
      if (newBalance < 0) throw new Error("Adjustment would result in negative store credit balance");
      
      await tx.execute(sql`UPDATE customers SET store_credit = ${newBalance.toFixed(2)} WHERE id = ${data.customerId} AND tenant_id = ${tenantId}`);
      
      await tx.insert(customerTransactions).values({
        tenantId,
        customerId: data.customerId,
        type: data.amountDelta > 0 ? "add_credit" : "use_credit",
        points: 0,
        amount: String(data.amountDelta),
      });
      
      await logAuditAction({ action: "Store Credit Adjusted", entityType: "Customer", entityId: data.customerId, afterValue: { delta: data.amountDelta, reason: data.reason } });
      return { success: true, newBalance };
    });
  });

// --- PROMOTIONS ENGINE ---

export const createPromotionFn = createServerFn({ method: "POST" })
  .validator((d: { 
    name: string; 
    discountType: string; 
    discountValue: string; 
    startDate: string; 
    endDate: string; 
    target: string;
    targetCategory?: string;
    targetProductIds?: string;
    minQty?: number;
    maxQty?: number;
  }) => d)
  .handler(async ({ data }) => {
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

    const existingName = await db.select({ id: promotions.id })
      .from(promotions)
      .where(and(
        eq(promotions.tenantId, tenantId),
        ilike(promotions.name, data.name.trim()),
        ne(promotions.status, "Archived")
      ))
      .limit(1);
      
    if (existingName.length > 0) {
      throw new Error("A promotion with this exact name already exists. Please choose a unique name.");
    }

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
      maxQty: data.maxQty,
    }).returning();
    
    await logAuditAction({ action: "Promotion Created", entityType: "Promotion", entityId: newPromo.id, summary: `Promotion '${newPromo.name}' created` });
    return { success: true, promotion: newPromo };
  });

export const updatePromotionFn = createServerFn({ method: "POST" })
  .validator((d: { 
    id: string;
    name: string; 
    discountType: string; 
    discountValue: string; 
    startDate: string; 
    endDate: string; 
    target: string;
    targetCategory?: string;
    targetProductIds?: string;
    minQty?: number;
    maxQty?: number;
  }) => d)
  .handler(async ({ data }) => {
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

    const existingName = await db.select({ id: promotions.id })
      .from(promotions)
      .where(and(
        eq(promotions.tenantId, tenantId),
        ilike(promotions.name, data.name.trim()),
        ne(promotions.status, "Archived"),
        ne(promotions.id, data.id)
      ))
      .limit(1);
      
    if (existingName.length > 0) {
      throw new Error("Another promotion with this exact name already exists. Please choose a unique name.");
    }

    // verify existence & tenant
    const existingList = await db.select({ id: promotions.id, status: promotions.status }).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
    if (existingList.length === 0) throw new Error("Promotion not found");
    
    const existing = existingList[0];
    if (existing.status === "Archived") throw new Error("Cannot update an archived promotion");

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
      maxQty: data.maxQty,
    }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).returning();
    
    await logAuditAction({ action: "Promotion Updated", entityType: "Promotion", entityId: updated.id });
    return { success: true, promotion: updated };
  });

export const getPromotionFn = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const list = await db.select().from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
    if (list.length === 0) throw new Error("Promotion not found");
    return { success: true, promotion: list[0] };
  });

export const listPromotionsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const tenantId = await getHeadOfficeTenant();
    const list = await db.select().from(promotions).where(and(eq(promotions.tenantId, tenantId), ne(promotions.status, "Archived"))).orderBy(desc(promotions.createdAt));
    return { success: true, promotions: list };
  });

export const activatePromotionFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    
    const list = await db.select({ id: promotions.id, status: promotions.status }).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
    if (list.length === 0) throw new Error("Promotion not found");
    if (list[0].status === "Archived") throw new Error("Cannot activate an archived promotion");
    
    await db.update(promotions).set({ status: "Active" }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId)));
    await logAuditAction({ action: "Promotion Activated", entityType: "Promotion", entityId: data.id });
    return { success: true };
  });

export const deactivatePromotionFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const list = await db.select({ id: promotions.id, status: promotions.status }).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
    if (list.length === 0) throw new Error("Promotion not found");
    if (list[0].status === "Archived") throw new Error("Cannot deactivate an archived promotion");
    
    await db.update(promotions).set({ status: "Inactive" }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId)));
    await logAuditAction({ action: "Promotion Deactivated", entityType: "Promotion", entityId: data.id });
    return { success: true };
  });

export const archivePromotionFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const list = await db.select({ id: promotions.id, name: promotions.name, status: promotions.status }).from(promotions).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId))).limit(1);
    if (list.length === 0) throw new Error("Promotion not found");
    // Indempotent if already archived, but let's just run it anyway.
    
    await db.update(promotions).set({ status: "Archived" }).where(and(eq(promotions.id, data.id), eq(promotions.tenantId, tenantId)));
    await logAuditAction({ action: "Promotion Archived", entityType: "Promotion", entityId: data.id, summary: `Promotion '${list[0].name}' archived` });
    return { success: true };
  });

export const calculateApplicablePromotionsFn = createServerFn({ method: "POST" })
  .validator((d: { 
    items: Array<{
      productId: string;
      categoryId?: string;
      originalPrice: string;
      quantity: number;
    }>
  }) => d)
  .handler(async ({ data }) => {
    const tenantId = await getHeadOfficeTenant();
    const now = new Date();
    
    const activePromos = await db.select().from(promotions)
      .where(and(
        eq(promotions.tenantId, tenantId),
        eq(promotions.status, "Active"),
        lte(promotions.startDate, now),
        gte(promotions.endDate, now)
      ));
      
    const results = data.items.map(item => {
      let bestDiscount = 0;
      let bestPromo: typeof activePromos[0] | null = null;
      
      const price = parseFloat(item.originalPrice);
      if (isNaN(price) || price < 0) return { ...item, discountAmount: "0.00", finalPrice: item.originalPrice, promotionId: null, promotionName: null, reason: "Invalid original price" };

      for (const promo of activePromos) {
        if (promo.minQty && item.quantity < promo.minQty) continue;
        if (promo.maxQty && item.quantity > promo.maxQty) continue;
        
        let matches = false;
        if (promo.target === "All") {
          matches = true;
        } else if (promo.target === "Product" && promo.targetProductIds) {
          const ids = promo.targetProductIds.split(",").map(i => i.trim());
          if (ids.includes(item.productId)) matches = true;
        } else if (promo.target === "Category" && promo.targetCategory) {
          if (item.categoryId === promo.targetCategory) matches = true;
        }
        
        if (!matches) continue;
        
        const pValue = parseFloat(promo.discountValue as string);
        let potentialDiscount = 0;
        if (promo.discountType === "Percentage") {
          potentialDiscount = price * (pValue / 100);
        } else if (promo.discountType === "Fixed") {
          potentialDiscount = pValue;
        }
        
        if (potentialDiscount > price) potentialDiscount = price;
        
        if (potentialDiscount > bestDiscount) {
          bestDiscount = potentialDiscount;
          bestPromo = promo;
        } else if (potentialDiscount === bestDiscount && potentialDiscount > 0) {
          if (bestPromo && promo.createdAt < bestPromo.createdAt) {
             bestPromo = promo;
          }
        }
      }
      
      const finalPrice = price - bestDiscount;
      
      if (bestPromo) {
        return {
          productId: item.productId,
          originalPrice: item.originalPrice,
          promotionId: bestPromo.id,
          promotionName: bestPromo.name,
          discountType: bestPromo.discountType,
          discountAmount: bestDiscount.toFixed(2),
          finalPrice: finalPrice.toFixed(2),
          reason: "Best discount applied"
        };
      }
      
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
    });
    
    return { success: true, results };
  });
