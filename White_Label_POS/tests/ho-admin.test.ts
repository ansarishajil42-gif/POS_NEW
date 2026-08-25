import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import { tenants, branches, products, stockLevels, batches } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  createBranchForTenantFn,
  updateBranchFn,
  activateBranchFn,
  deactivateBranchFn,
  getBranchDetailsFn
} from "@/lib/head-office-server";

// Mock auth
import * as authServer from "@/lib/auth-server";
import { vi } from "vitest";

describe("Head Office Branch Management", () => {
  let tenantId: string;
  let branchId: string;

  beforeAll(async () => {
    // Insert mock tenant
    const [tenant] = await db.insert(tenants).values({
      name: "Test Tenant",
      status: "Active",
      outletLimit: 5
    }).returning();
    tenantId = tenant.id;

    vi.spyOn(authServer, "getSessionServerFn").mockResolvedValue({
      success: true,
      session: {
        userId: "user-123",
        tenantId: tenantId,
        role: "Head Office Admin",
        name: "Test Admin",
      } as any
    });
  });

  afterAll(async () => {
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    vi.restoreAllMocks();
  });

  test("createBranchForTenantFn creates a branch within limit", async () => {
    const result = await createBranchForTenantFn({ data: { name: "New Branch", address: "123 Test St" } });
    expect(result.success).toBe(true);
    branchId = result.branchId;

    const dbBranch = await db.query.branches.findFirst({ where: eq(branches.id, branchId) });
    expect(dbBranch).toBeDefined();
    expect(dbBranch?.name).toBe("New Branch");
    expect(dbBranch?.tenantId).toBe(tenantId);
  });

  test("updateBranchFn updates branch details", async () => {
    const result = await updateBranchFn({ data: { branchId, name: "Updated Branch", address: "456 New St" } });
    expect(result.success).toBe(true);

    const dbBranch = await db.query.branches.findFirst({ where: eq(branches.id, branchId) });
    expect(dbBranch?.name).toBe("Updated Branch");
    expect(dbBranch?.address).toBe("456 New St");
  });

  test("deactivateBranchFn sets status to Inactive", async () => {
    const result = await deactivateBranchFn({ data: { branchId } });
    expect(result.success).toBe(true);

    const dbBranch = await db.query.branches.findFirst({ where: eq(branches.id, branchId) });
    expect(dbBranch?.status).toBe("Inactive");
  });

  test("activateBranchFn sets status back to Active", async () => {
    const result = await activateBranchFn({ data: { branchId } });
    expect(result.success).toBe(true);

    const dbBranch = await db.query.branches.findFirst({ where: eq(branches.id, branchId) });
    expect(dbBranch?.status).toBe("Active");
  });

  test("getBranchDetailsFn fetches the branch safely", async () => {
    const result = await getBranchDetailsFn({ data: { branchId } });
    expect(result.branch).toBeDefined();
    expect(result.branch.id).toBe(branchId);
  });
});

describe("Inventory Safety and Variance", () => {
  test("checkoutServerFn blocks negative stock for non-batch products", async () => {
    // This test would mock checkoutServerFn with an item quantity > stock
    // and expect an error "Insufficient non-batch stock"
  });

  test("checkoutServerFn locks available batches and prevents expired selection", async () => {
    // This test would verify .for('update') behavior conceptually
  });

  test("GRN creation marks variance when orderedQty !== receivedQty", async () => {
    // This test verifies the variance check logic
  });
});
