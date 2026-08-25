import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkoutServerFn } from "../pos-server";

// Mock tanstack createServerFn
vi.mock('@tanstack/react-start', () => {
  return {
    createServerFn: () => {
      let handlerFunc: any;
      let validatorFunc = (x: any) => x;
      const chain: any = {
        validator: (v: any) => { validatorFunc = v; return chain; },
        handler: (h: any) => { handlerFunc = h; Object.assign(executeFn, chain); return executeFn; }
      };
      const executeFn = async (args: any) => {
        return handlerFunc({ data: validatorFunc(args?.data || args) });
      };
      Object.assign(executeFn, chain);
      return chain;
    }
  };
});

// Mock auth-server instead of pos-server internals
vi.mock("../auth-server", () => ({
  getSessionServerFn: vi.fn().mockResolvedValue({
    success: true,
    session: {
      tenantId: "tenant-1",
      branchId: "branch-1",
      cashierId: "cashier-1",
      role: "Cashier"
    }
  })
}));

const { mockDb } = vi.hoisted(() => {
  const mockDbObj: any = {
    query: {
      shifts: { findFirst: vi.fn() },
      tills: { findFirst: vi.fn() },
      orders: { findFirst: vi.fn() }
    },
    select: vi.fn(() => mockDbObj),
    from: vi.fn(() => mockDbObj),
    where: vi.fn(() => mockDbObj),
    for: vi.fn(() => mockDbObj),
    limit: vi.fn(() => mockDbObj),
    execute: vi.fn(),
    insert: vi.fn(() => mockDbObj),
    update: vi.fn(() => mockDbObj),
    set: vi.fn(() => mockDbObj),
    values: vi.fn(() => mockDbObj),
    returning: vi.fn(() => mockDbObj),
    transaction: vi.fn(async (cb) => {
      return cb(mockDbObj);
    })
  };
  return { mockDb: mockDbObj };
});

vi.mock("@/server/db", () => ({
  db: mockDb
}));

vi.mock("@/server/db/schema", () => ({
  shifts: { cashierId: "cashierId", branchId: "branchId", tenantId: "tenantId", status: "status" },
  tills: { id: "id", tenantId: "tenantId", branchId: "branchId" },
  orders: { idempotencyKey: "idempotencyKey", tenantId: "tenantId", createdAt: "createdAt", status: "status" },
  tenants: { id: "id" },
  tenantSettings: { tenantId: "tenantId" },
  customers: { id: "id", tenantId: "tenantId", isActive: "isActive" },
  products: { id: "id", isBatchTracked: "isBatchTracked", name: "name" },
  batches: { id: "id", productId: "productId", branchId: "branchId", stock: "stock", expiryDate: "expiryDate" },
  stockLevels: { productId: "productId", branchId: "branchId", stock: "stock" },
  orderPayments: {},
  orderItems: {},
  customerTransactions: {}
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  ne: vi.fn(),
  sql: vi.fn(),
  desc: vi.fn(),
  gte: vi.fn(),
  gt: vi.fn(),
  asc: vi.fn(),
}));

describe("checkoutServerFn - POS Loyalty and Credit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.query.shifts.findFirst.mockResolvedValue({ tillId: "till-1" });
    mockDb.query.tills.findFirst.mockResolvedValue({ id: "till-1" });
    mockDb.query.orders.findFirst.mockResolvedValue(null);

    mockDb.limit.mockImplementation(function (this: any) {
      if (mockDb.from.mock.calls.length > 0) {
        return [{ loyaltyRedemptionRate: "0.01", loyaltyPointsPerAed: "2", loyaltyMinPointsToRedeem: 100 }];
      }
      return this;
    });

    mockDb.for.mockImplementation(function (this: any) {
      const calls = mockDb.from.mock.calls;
      const lastCall = calls[calls.length - 1];
      if (lastCall && lastCall[0]?.id === "id" && lastCall[0]?.isActive === "isActive") {
        // customers table
        return [{ id: "cust-1", isActive: true, points: 5000, storeCredit: "100.00" }];
      }
      // tenants table
      return [{ monthlyOrderLimit: 1000 }];
    });

    mockDb.where.mockImplementation(function (this: any) {
      if (mockDb.from.mock.calls.length > 0) {
        const calls = mockDb.from.mock.calls;
        const lastCall = calls[calls.length - 1];
        if (lastCall[0]?.createdAt === "createdAt") {
           return [{ count: 10 }]; // orders count
        }
      }
      return this;
    });
    
    mockDb.returning.mockResolvedValue([{ id: "order-123" }]);
  });

  it("should complete a basic cash order without customer attached", async () => {
    const res = await checkoutServerFn({
      data: {
        subtotal: 100,
        vat: 5,
        total: 105,
        payments: [{ method: "Cash", amount: 105 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 100 }]
      }
    });
    expect(res).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should fail if loyalty points are used but no customer is attached", async () => {
    await expect(checkoutServerFn({
      data: {
        subtotal: 100,
        vat: 5,
        total: 105,
        payments: [{ method: "Loyalty Points", amount: 105 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 100 }]
      }
    })).rejects.toThrow("Loyalty Points requires an active customer.");
  });

  it("should fail if store credit is used but no customer is attached", async () => {
    await expect(checkoutServerFn({
      data: {
        subtotal: 100,
        vat: 5,
        total: 105,
        payments: [{ method: "Store Credit", amount: 105 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 100 }]
      }
    })).rejects.toThrow("Store Credit requires an active customer.");
  });

  it("should successfully redeem loyalty points with customer attached", async () => {
    const res = await checkoutServerFn({
      data: {
        customerId: "cust-1",
        subtotal: 10,
        vat: 0.5,
        total: 10.5,
        payments: [{ method: "Loyalty Points", amount: 10.5 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 10 }]
      }
    });
    // Points required = 10.5 / 0.01 = 1050 points. Customer has 5000.
    expect(mockDb.execute).toHaveBeenCalled();
  });

  it("should fail when loyalty points are insufficient", async () => {
    mockDb.for.mockImplementation(function (this: any) {
      const calls = mockDb.from.mock.calls;
      const lastCall = calls[calls.length - 1];
      if (lastCall && lastCall[0]?.id === "id") {
        return [{ id: "cust-1", isActive: true, points: 100, storeCredit: "100.00" }]; // Only 100 points
      }
      return [{ monthlyOrderLimit: 1000 }];
    });

    await expect(checkoutServerFn({
      data: {
        customerId: "cust-1",
        subtotal: 50,
        vat: 2.5,
        total: 52.5,
        payments: [{ method: "Loyalty Points", amount: 52.5 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 50 }]
      }
    })).rejects.toThrow("Insufficient loyalty points.");
  });
  
  it("should fail when customer is inactive", async () => {
    mockDb.for.mockImplementation(function (this: any) {
      const calls = mockDb.from.mock.calls;
      const lastCall = calls[calls.length - 1];
      if (lastCall && lastCall[0]?.id === "id") {
        return [{ id: "cust-1", isActive: false, points: 5000, storeCredit: "100.00" }];
      }
      return [{ monthlyOrderLimit: 1000 }];
    });

    await expect(checkoutServerFn({
      data: {
        customerId: "cust-1",
        subtotal: 10,
        vat: 0.5,
        total: 10.5,
        payments: [{ method: "Cash", amount: 10.5 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 10 }]
      }
    })).rejects.toThrow("Customer is not active.");
  });

  it("should accrue points on successful purchase with customer attached", async () => {
    await checkoutServerFn({
      data: {
        customerId: "cust-1",
        subtotal: 50,
        vat: 2.5,
        total: 52.5,
        payments: [{ method: "Cash", amount: 52.5 }],
        items: [{ productId: "prod-1", qty: 1, unitPrice: 50 }]
      }
    });
    // Should earn 52.5 * 2 = 105 points
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
