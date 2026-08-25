import { describe, it, expect, vi, beforeEach } from 'vitest';

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
      return executeFn;
    }
  };
});

import { 
  createPromotionFn, 
  updatePromotionFn, 
  getPromotionFn, 
  listPromotionsFn, 
  activatePromotionFn, 
  deactivatePromotionFn, 
  archivePromotionFn,
  calculateApplicablePromotionsFn 
} from '../head-office-server';

// Mocks
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn().mockResolvedValue([{ id: 'promo-1', name: 'Summer Sale' }]);
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();

vi.mock('@/server/db', () => ({
  db: {
    insert: (...args: any[]) => ({ values: mockValues.mockImplementation(() => ({ returning: mockReturning })) }),
    update: (...args: any[]) => ({ set: mockSet.mockImplementation(() => ({ where: mockWhere.mockImplementation(() => ({ returning: mockReturning })) })) }),
    select: (...args: any[]) => ({ from: mockFrom.mockImplementation(() => ({ where: mockWhere.mockImplementation(() => ({ limit: mockLimit, orderBy: mockOrderBy })) })) }),
  }
}));

vi.mock('@/lib/audit-logger', () => ({
  logAuditAction: vi.fn(),
}));

let currentRole = "Head Office Admin";
let currentTenant = "tenant-1";

vi.mock('@/lib/auth-server', () => ({
  getSessionServerFn: vi.fn().mockImplementation(async () => {
    if (!currentRole) return { success: false };
    return { success: true, session: { role: currentRole, tenantId: currentTenant } };
  }),
  getHeadOfficeTenant: vi.fn().mockImplementation(async () => {
    if (currentRole !== "Head Office Admin") throw new Error("Unauthorized");
    return currentTenant;
  }),
}));

// We must also mock the internal drizzle-orm operators used in the queries to avoid errors
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn(),
    and: vi.fn(),
    sql: vi.fn(),
    desc: vi.fn(),
    inArray: vi.fn(),
    ne: vi.fn(),
    or: vi.fn(),
    ilike: vi.fn(),
    lte: vi.fn(),
    gte: vi.fn(),
  };
});

describe('Promotions Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = "Head Office Admin";
    currentTenant = "tenant-1";
  });

  describe('Authorization & Tenant Isolation', () => {
    it('should reject non-Head Office Admin users', async () => {
      currentRole = "Cashier";
      await expect(createPromotionFn({ data: { name: "Test", discountType: "Percentage", discountValue: "10", startDate: "2026-01-01", endDate: "2026-02-01", target: "All" } }))
        .rejects.toThrow("Unauthorized");
    });
  });

  describe('Promotion Validation', () => {
    it('should reject invalid percentage (>100)', async () => {
      await expect(createPromotionFn({ data: { name: "Test", discountType: "Percentage", discountValue: "110", startDate: "2026-01-01", endDate: "2026-02-01", target: "All" } }))
        .rejects.toThrow("Percentage discount cannot exceed 100%");
    });

    it('should reject negative/zero fixed discounts', async () => {
      await expect(createPromotionFn({ data: { name: "Test", discountType: "Fixed", discountValue: "-10", startDate: "2026-01-01", endDate: "2026-02-01", target: "All" } }))
        .rejects.toThrow("Discount value must be positive");
    });

    it('should reject invalid date ranges', async () => {
      await expect(createPromotionFn({ data: { name: "Test", discountType: "Fixed", discountValue: "10", startDate: "2026-02-01", endDate: "2026-01-01", target: "All" } }))
        .rejects.toThrow("Start date must be before end date");
    });
    
    it('should reject invalid quantity ranges', async () => {
      await expect(createPromotionFn({ data: { name: "Test", discountType: "Fixed", discountValue: "10", startDate: "2026-01-01", endDate: "2026-02-01", target: "All", minQty: 5, maxQty: 2 } }))
        .rejects.toThrow("maxQty cannot be lower than minQty");
    });
  });

  describe('Archive Behavior', () => {
    it('should archive a promotion successfully', async () => {
      mockLimit.mockResolvedValueOnce([{ id: 'promo-1', status: 'Active' }]);
      await expect(archivePromotionFn({ data: { id: 'promo-1' } })).resolves.toEqual({ success: true });
    });
  });

  describe('Calculation Engine', () => {
    it('should calculate best discount accurately and prevent negative prices', async () => {
      // Mock active promotions for calculation
      mockWhere.mockResolvedValueOnce([
        { id: 'promo-1', name: '10% Off', discountType: 'Percentage', discountValue: '10', target: 'All', createdAt: 1 },
        { id: 'promo-2', name: 'Fixed 5', discountType: 'Fixed', discountValue: '5', target: 'All', createdAt: 2 },
        { id: 'promo-3', name: 'Crazy Sale', discountType: 'Fixed', discountValue: '200', target: 'All', createdAt: 3 }
      ]);
      
      const res = await calculateApplicablePromotionsFn({ data: { items: [{ productId: 'p-1', originalPrice: '100', quantity: 1 }] } });
      expect(res.success).toBe(true);
      
      // Best discount should be Crazy Sale (100 is max, price cannot go negative)
      expect(res.results[0].finalPrice).toBe("0.00");
      expect(res.results[0].discountAmount).toBe("100.00");
      expect(res.results[0].promotionName).toBe("Crazy Sale");
    });

    it('should ignore inactive and expired promotions (mocked via query)', async () => {
      // Drizzle where query handles the filtering of status='Active' and dates in the real DB.
      // Here we just mock what the DB would return.
      mockWhere.mockResolvedValueOnce([
        { id: 'promo-1', name: 'Valid', discountType: 'Fixed', discountValue: '10', target: 'All' }
      ]);
      
      const res = await calculateApplicablePromotionsFn({ data: { items: [{ productId: 'p-1', originalPrice: '100', quantity: 1 }] } });
      expect(res.results[0].finalPrice).toBe("90.00");
    });
  });
});
