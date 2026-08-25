
import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";
import * as argon2 from "argon2";
import { db } from "../server/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  branches,
  stockLevels,
  products,
  orders,
  shifts,
  rolePermissions,
  priceOverrideRequests,
  staffUsers,
  tills,
  tenants,
} from "../server/db/schema";

// Middleware
async function getStoreManagerContext() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session || res.session.role !== "Branch Manager") {
    throw new Error("Unauthorized");
  }
  if (!res.session.branchId) {
    throw new Error("No branch assigned to this manager");
  }
  return {
    tenantId: res.session.tenantId,
    branchId: res.session.branchId,
    userId: res.session.id,
  };
}

export const getStoreManagerDataFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { tenantId, branchId } = await getStoreManagerContext();

    // 1. Get branch info
    const branchInfo = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    // 2. Get local stock & products
    const localStock = await db
      .select({
        id: stockLevels.id,
        stock: stockLevels.stock,
        priceOverride: stockLevels.priceOverride,
        productId: products.id,
        productName: products.name,
        sku: products.barcode, // Fallback sku to barcode
        barcode: products.barcode,
        category: products.category,
        unit: products.unit,
        basePrice: products.salePrice, // salePrice instead of basePrice
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(eq(stockLevels.branchId, branchId));

    // 3. Get recent shifts (today's shifts)
    const recentShifts = await db.query.shifts.findMany({
      where: eq(shifts.branchId, branchId),
      with: {
        cashier: true,
      },
      orderBy: [desc(shifts.openedAt)],
      limit: 20,
    });

    // 4. Get recent orders (to compute sales/trends)
    const recentOrders = await db.query.orders.findMany({
      where: eq(orders.branchId, branchId),
      orderBy: [desc(orders.createdAt)],
      limit: 100, // Just a sample for the dashboard
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    // 4.1. Get override requests
    const dbRequests = await db.query.priceOverrideRequests.findMany({
      where: eq(priceOverrideRequests.branchId, branchId),
      orderBy: [desc(priceOverrideRequests.createdAt)],
      with: {
        product: true,
      },
    });

    // 4.2. Get branch staff
    const dbStaff = await db.query.staffUsers.findMany({
      where: and(eq(staffUsers.tenantId, tenantId), eq(staffUsers.branchId, branchId)),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // 4.3. Get branch tills
    const dbTills = await db.query.tills.findMany({
      where: and(eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)),
      orderBy: [desc(tills.createdAt)],
    });

    // 5. Get permissions
    const dbPerms = await db.query.rolePermissions.findMany({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
      ),
    });

    const result = {
      branch: branchInfo,
      stock: localStock,
      shifts: recentShifts.map((s) => {
        const matchedTill = dbTills.find((t) => t.id === s.tillId);
        return {
          ...s,
          till: matchedTill ? { name: matchedTill.name } : s.tillId ? { name: s.tillId } : null,
        };
      }),
      orders: recentOrders,
      requests: dbRequests,
      staff: dbStaff,
      tills: dbTills,
      permissions: dbPerms,
    };

    return JSON.parse(JSON.stringify(result));
  } catch (e: any) {
    console.error("BACKEND CRASH IN STORE MANAGER:", e);
    return { error: e.stack || e.message || String(e) };
  }
});

export const requestPriceOverrideFn = createServerFn({ method: "POST" })
  .validator((d: { stockLevelId: string; requestedPrice: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getStoreManagerContext();

    // Enforce branch_override permission
    const permRecord = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
        eq(rolePermissions.permission, "branch_override"),
      ),
    });
    if (permRecord && !permRecord.enabled) {
      throw new Error("Forbidden: Branch override permission is disabled.");
    }

    await db
      .update(stockLevels)
      .set({ priceOverride: data.requestedPrice })
      .where(and(eq(stockLevels.id, data.stockLevelId), eq(stockLevels.branchId, branchId)));
    return { success: true };
  });

export const createOverrideRequestFn = createServerFn({ method: "POST" })
  .validator((d: { productId: string; requestedPrice: string; reason: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getStoreManagerContext();

    // Enforce branch_override permission
    const permRecord = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
        eq(rolePermissions.permission, "branch_override"),
      ),
    });
    if (permRecord && !permRecord.enabled) {
      throw new Error("Forbidden: Branch override permission is disabled.");
    }

    // Validate the product and branch scope
    const [stockItem] = await db
      .select({
        id: stockLevels.id,
        productId: products.id,
        standardPrice: products.salePrice,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(
        and(
          eq(stockLevels.productId, data.productId),
          eq(stockLevels.branchId, branchId),
          eq(products.tenantId, tenantId),
        ),
      );

    if (!stockItem) {
      throw new Error("Invalid product selection or unauthorized scope.");
    }

    const requested = Number(data.requestedPrice);
    if (isNaN(requested) || requested < 0) {
      throw new Error("Requested price must be a non-negative number.");
    }

    if (!data.reason.trim()) {
      throw new Error("Reason is required.");
    }

    // Insert override request
    await db.insert(priceOverrideRequests).values({
      tenantId,
      branchId,
      productId: data.productId,
      stockLevelId: stockItem.id,
      standardPrice: stockItem.standardPrice || "0.00",
      requestedPrice: data.requestedPrice,
      reason: data.reason.trim(),
      status: "Pending",
    });

    return { success: true };
  });

export const createRosterShiftFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      cashierId: string;
      tillId: string;
      shiftDate: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getStoreManagerContext();

    // Enforce shift_staff permission
    const permRecord = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
        eq(rolePermissions.permission, "shift_staff"),
      ),
    });
    if (permRecord && !permRecord.enabled) {
      throw new Error("Forbidden: Shift and staff permission is disabled.");
    }

    // Validate the selected staff user belongs to the same tenant and branch and has an eligible role
    const [staff] = await db
      .select({ id: staffUsers.id, role: staffUsers.role, isActive: staffUsers.isActive })
      .from(staffUsers)
      .where(
        and(
          eq(staffUsers.id, data.cashierId),
          eq(staffUsers.branchId, branchId),
          eq(staffUsers.tenantId, tenantId),
        ),
      );
    if (!staff) {
      throw new Error("Invalid staff user selection or unauthorized scope.");
    }
    if (!staff.isActive) {
      throw new Error("Cannot assign a roster shift to an inactive staff member.");
    }
    if (staff.role !== "cashier") {
      throw new Error("Selected staff member's role is not eligible to operate a till.");
    }

    // Validate times
    const start = data.startTime.trim();
    const end = data.endTime.trim();
    if (!start || !end) {
      throw new Error("Start and end times are required.");
    }
    if (end < start) {
      throw new Error("End time cannot be earlier than start time.");
    }

    // Enforce no overlapping shifts for the same staff member on the same date
    const overlapStaff = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.cashierId, data.cashierId),
        eq(shifts.shiftDate, data.shiftDate),
        eq(shifts.branchId, branchId),
        sql`${shifts.startTime} < ${end}`,
        sql`${shifts.endTime} > ${start}`,
      ),
    });
    if (overlapStaff) {
      throw new Error(
        "This staff member already has an overlapping shift scheduled for this date.",
      );
    }

    // Enforce no overlapping assignments for the same till on the same date
    const overlapTill = await db.query.shifts.findFirst({
      where: and(
        eq(shifts.tillId, data.tillId),
        eq(shifts.shiftDate, data.shiftDate),
        eq(shifts.branchId, branchId),
        sql`${shifts.startTime} < ${end}`,
        sql`${shifts.endTime} > ${start}`,
      ),
    });
    if (overlapTill) {
      throw new Error("This till is already assigned to another cashier during this time.");
    }

    // Save scheduled shift
    await db.insert(shifts).values({
      tenantId,
      branchId,
      cashierId: data.cashierId,
      tillId: data.tillId,
      shiftDate: data.shiftDate,
      startTime: start,
      endTime: end,
      notes: data.notes || "",
      status: "Scheduled",
      openingFloat: "0.00",
    });

    return { success: true };
  });

export const deleteRosterShiftFn = createServerFn({ method: "POST" })
  .validator((d: { shiftId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getStoreManagerContext();

    // Enforce shift_staff permission
    const permRecord = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
        eq(rolePermissions.permission, "shift_staff"),
      ),
    });
    if (permRecord && !permRecord.enabled) {
      throw new Error("Forbidden: Shift and staff permission is disabled.");
    }

    await db
      .delete(shifts)
      .where(
        and(
          eq(shifts.id, data.shiftId),
          eq(shifts.branchId, branchId),
          eq(shifts.tenantId, tenantId),
        ),
      );

    return { success: true };
  });

export const createTillFn = createServerFn({ method: "POST" })
  .validator((d: { name: string; description?: string; openingFloat?: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId, userId } = await getStoreManagerContext();

    // Verify till_management permission
    const permRecord = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
        eq(rolePermissions.permission, "till_management"),
      ),
    });
    if (permRecord && !permRecord.enabled) {
      throw new Error("Forbidden: Till management permission is disabled.");
    }

    const name = data.name.trim();
    if (!name) {
      throw new Error("Till name or number is required.");
    }

    // Enforce uniqueness within the assigned branch
    const existing = await db.query.tills.findFirst({
      where: and(eq(tills.branchId, branchId), eq(tills.name, name)),
    });
    if (existing) {
      throw new Error(`A till with the name "${name}" already exists in this branch.`);
    }

    const floatVal = Number(data.openingFloat || "0.00");
    if (isNaN(floatVal) || floatVal < 0) {
      throw new Error("Opening float must be a non-negative number.");
    }

    // Check till limit inside transaction to prevent race conditions
    await db.transaction(async (tx) => {
      const [tenantRec] = await tx
        .select({ tillLimit: tenants.tillLimit })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .for('update');
      if (!tenantRec) throw new Error("Tenant not found.");

      const activeTills = await tx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(tills)
        .where(eq(tills.tenantId, tenantId));

      if (activeTills[0].count >= tenantRec.tillLimit) {
        throw new Error("Till limit reached for this tenant.");
      }

      // Insert new till
      await tx.insert(tills).values({
        tenantId,
        branchId,
        name,
        description: data.description || "",
        status: "Closed",
        openingFloat: floatVal.toString(),
        createdBy: userId,
      });

      // Also update tillCount in branches table to keep it aligned!
      const [branch] = await tx
        .select({ tillCount: branches.tillCount })
        .from(branches)
        .where(eq(branches.id, branchId));
      if (branch) {
        await tx
          .update(branches)
          .set({ tillCount: (branch.tillCount || 0) + 1 })
          .where(eq(branches.id, branchId));
      }
    });

    return { success: true };
  });

export const resetCashierPinByManagerFn = createServerFn({ method: "POST" })
  .validator((d: { cashierId: string; newPin: string; confirmPin: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = await getStoreManagerContext();

    // Verify shift_staff permission
    const permRecord = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.tenantId, tenantId),
        eq(rolePermissions.role, "branch_manager"),
        eq(rolePermissions.permission, "shift_staff"),
      ),
    });
    if (permRecord && !permRecord.enabled) {
      throw new Error("Forbidden: Resetting cashier credentials requires permission.");
    }

    if (data.newPin !== data.confirmPin) {
      throw new Error("PIN and confirmation PIN do not match.");
    }

    if (!/^\d{4}$/.test(data.newPin)) {
      throw new Error("PIN must be exactly 4 digits.");
    }

    const [cashier] = await db
      .select()
      .from(staffUsers)
      .where(
        and(
          eq(staffUsers.id, data.cashierId),
          eq(staffUsers.branchId, branchId),
          eq(staffUsers.tenantId, tenantId),
          eq(staffUsers.role, "cashier"),
        ),
      );

    if (!cashier) {
      throw new Error("Cashier user not found in this branch.");
    }

    const hashed = await argon2.hash(data.newPin);
    await db.update(staffUsers).set({ pinHash: hashed }).where(eq(staffUsers.id, data.cashierId));

    return { success: true };
  });
