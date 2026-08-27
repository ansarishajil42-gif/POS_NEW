import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSalesSummaryReportFn,
  getBranchSalesReportFn,
  getProductSalesReportFn,
  getCategorySalesReportFn,
  getCashierSalesReportFn,
  getInventoryValuationReportFn,
  getLowStockReportFn,
  getExpiryReportFn,
  getPurchaseReportFn,
  getVendorReportFn,
  getVatSummaryReportFn
} from "../reports-server";

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

// 1. Mock DB and schemas
vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ trn: "TRN-123" }]),
      // Mock thenable array behavior
      then: vi.fn((resolve) => resolve([
        {
          orderCount: 10,
          netSales: 100,
          vatAmount: 5,
          totalSales: 105,
          taxableOrdersCount: 10,
          salesExVat: 100,
          salesIncVat: 105,
          branchName: "Main Branch",
          productName: "Apple",
          quantity: 50,
          unitCost: 1.5,
          totalCostValue: 75,
          currentQuantity: 5,
          threshold: 10,
          shortage: 5,
          batchNumber: "B001",
          expiryDate: new Date(),
          daysRemaining: 15,
          vendorName: "Vendor A",
          purchaseCount: 2,
          totalPurchaseValue: 500,
          poId: "p1",
          poDate: new Date(),
          status: "completed",
          totalAmount: 250
        }
      ]))
    }))
  }
}));

vi.mock("@/server/db/schema", () => ({
  orders: { id: "orders.id", tenantId: "orders.tenant_id", branchId: "orders.branch_id", cashierId: "orders.cashier_id", status: "orders.status", subtotal: "orders.subtotal", vat: "orders.vat", total: "orders.total", createdAt: "orders.created_at" },
  branches: { id: "branches.id", name: "branches.name" },
  products: { id: "products.id", name: "products.name", tenantId: "products.tenant_id", barcode: "products.barcode", category: "products.category", costPrice: "products.cost_price" },
  orderItems: { id: "order_items.id", orderId: "order_items.order_id", productId: "order_items.product_id", qty: "order_items.qty", unitPrice: "order_items.unit_price" },
  staffUsers: { id: "staff_users.id", name: "staff_users.name" },
  stockLevels: { productId: "stock_levels.product_id", branchId: "stock_levels.branch_id", stock: "stock_levels.stock", reorderLevel: "stock_levels.reorder_level" },
  batches: { tenantId: "batches.tenant_id", branchId: "batches.branch_id", productId: "batches.product_id", batchNumber: "batches.batch_number", stock: "batches.stock", expiryDate: "batches.expiry_date" },
  purchaseOrders: { id: "purchase_orders.id", tenantId: "purchase_orders.tenant_id", branchId: "purchase_orders.branch_id", vendorId: "purchase_orders.vendor_id", createdAt: "purchase_orders.created_at", status: "purchase_orders.status", total: "purchase_orders.total" },
  vendors: { id: "vendors.id", name: "vendors.name" },
  tenantSettings: { tenantId: "tenant_settings.tenant_id", trn: "tenant_settings.trn" }
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    eq: vi.fn((a, b) => `eq(${a},${b})`),
    and: vi.fn((...args) => `and(${args.join(",")})`),
    sql: vi.fn((strings, ...values) => `sql`),
    gte: vi.fn((a, b) => `gte(${a},${b})`),
    lt: vi.fn((a, b) => `lt(${a},${b})`),
    desc: vi.fn((a) => `desc(${a})`)
  };
});

// 2. Mock Auth and Audit
let mockAuthRole = "Head Office Admin";
let mockAuthTenantId = "tenant-123";
vi.mock("@/lib/auth-server", () => ({
  getHeadOfficeTenant: vi.fn(async () => {
    if (mockAuthRole !== "Head Office Admin") {
      throw new Error("Unauthorized");
    }
    return mockAuthTenantId;
  }),
  getSessionServerFn: vi.fn(async () => ({
    success: true,
    session: { role: mockAuthRole, tenantId: mockAuthTenantId }
  }))
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: vi.fn()
}));

const validDateRange = {
  startDate: "2023-01-01",
  endDate: "2023-01-31"
};

describe("Head Office Admin Reporting Module", () => {
  beforeEach(() => {
    mockAuthRole = "Head Office Admin";
    vi.clearAllMocks();
  });

  describe("Authorization & Isolation", () => {
    it("should reject non-Head Office Admin for sales report", async () => {
      mockAuthRole = "Cashier";
      await expect(getSalesSummaryReportFn({ data: validDateRange })).rejects.toThrow("Unauthorized");
    });

    it("should reject invalid date ranges", async () => {
      await expect(getSalesSummaryReportFn({ data: { startDate: "2023-01-31", endDate: "2023-01-01" } })).rejects.toThrow("Start date must be strictly before end date");
    });
  });

  describe("Sales Reports", () => {
    it("should return valid sales summary", async () => {
      const res = await getSalesSummaryReportFn({ data: validDateRange });
      expect(res.success).toBe(true);
      expect(res.data?.orderCount).toBe(10);
      expect(res.data?.netSales).toBe("100.00");
    });

    it("should return valid branch sales", async () => {
      const res = await getBranchSalesReportFn({ data: validDateRange });
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe("Inventory Reports", () => {
    it("should calculate inventory valuation using cost price", async () => {
      const res = await getInventoryValuationReportFn({ data: {} });
      expect(res.success).toBe(true);
      expect(res.data?.[0]?.totalCostValue).toBe(75);
    });

    it("should return low stock report correctly", async () => {
      const res = await getLowStockReportFn({ data: {} });
      expect(res.success).toBe(true);
      expect(res.data?.[0]?.shortage).toBe(5);
    });
  });

  describe("Purchasing Reports", () => {
    it("should return vendor summary report correctly", async () => {
      const res = await getVendorReportFn({ data: validDateRange });
      expect(res.success).toBe(true);
      expect(res.data?.[0]?.purchaseCount).toBe(2);
      expect(res.data?.[0]?.totalPurchaseValue).toBe(500);
    });
  });

  describe("VAT Reports", () => {
    it("should return UAE VAT summary with stored historical values", async () => {
      const res = await getVatSummaryReportFn({ data: validDateRange });
      expect(res.success).toBe(true);
      expect(res.data?.trn).toBe("TRN-123");
      expect(res.data?.taxableOrdersCount).toBe(10);
      expect(res.data?.vatAmount).toBe("5.00");
    });
  });
});
