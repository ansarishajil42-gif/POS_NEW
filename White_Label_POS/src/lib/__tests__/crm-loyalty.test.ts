import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authServer from '@/lib/auth-server';
import { db } from '@/server/db';
import * as auditLogger from '@/lib/audit-logger';

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

const { 
  mockSelect, mockFrom, mockWhere, mockLimit, mockOffset, 
  mockInsert, mockValues, mockReturning, mockUpdate, mockSet, mockExecute 
} = vi.hoisted(() => {
  const mSelect = vi.fn().mockReturnThis();
  const mFrom = vi.fn().mockReturnThis();
  const mWhere = vi.fn().mockResolvedValue([]);
  const mLimit = vi.fn().mockReturnThis();
  const mOffset = vi.fn().mockResolvedValue([]);
  const mInsert = vi.fn().mockReturnThis();
  const mValues = vi.fn().mockReturnThis();
  const mReturning = vi.fn().mockResolvedValue([{ id: 'mocked-id' }]);
  const mUpdate = vi.fn().mockReturnThis();
  const mSet = vi.fn().mockReturnThis();
  const mExecute = vi.fn().mockResolvedValue(true);
  
  return {
    mockSelect: mSelect, mockFrom: mFrom, mockWhere: mWhere, mockLimit: mLimit, mockOffset: mOffset,
    mockInsert: mInsert, mockValues: mValues, mockReturning: mReturning, mockUpdate: mUpdate, mockSet: mSet, mockExecute: mExecute
  };
});

vi.mock('@/server/db', () => {
  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      transaction: vi.fn(async (cb) => {
        return cb({
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
          execute: mockExecute
        });
      })
    }
  };
});

mockSelect.mockImplementation(() => ({ from: mockFrom, limit: mockLimit }));
mockInsert.mockImplementation(() => ({ values: mockValues }));
mockUpdate.mockImplementation(() => ({ set: mockSet }));
mockFrom.mockImplementation(() => ({ where: mockWhere, limit: mockLimit }));
mockWhere.mockImplementation(() => ({ limit: mockLimit, returning: mockReturning }));
mockLimit.mockImplementation(() => ({ offset: mockOffset }));
mockValues.mockImplementation(() => ({ returning: mockReturning }));
mockSet.mockImplementation(() => ({ where: mockWhere }));

vi.mock('@/lib/auth-server', () => ({
  getSessionServerFn: vi.fn()
}));

vi.mock('@/lib/audit-logger', () => ({
  logAuditAction: vi.fn()
}));

// Now import the functions AFTER mocks
import { 
  createCustomerFn, 
  accrueLoyaltyPointsFn, 
  adjustCustomerBalanceFn 
} from '@/lib/head-office-server';

describe('CRM & Loyalty Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should reject non-head office admin', async () => {
      (authServer.getSessionServerFn as any).mockResolvedValue({
        success: true,
        session: { role: 'Branch Manager', tenantId: 'tenant-1' }
      });
      await expect(createCustomerFn({ data: { name: 'Test' } })).rejects.toThrow('Unauthorized');
    });
  });

  describe('Customer Creation', () => {
    it('should create customer if email is unique within tenant', async () => {
      (authServer.getSessionServerFn as any).mockResolvedValue({
        success: true,
        session: { role: 'Head Office Admin', tenantId: 'tenant-1' }
      });
      mockLimit.mockResolvedValueOnce([]); // no existing customer
      
      const result = await createCustomerFn({ data: { name: 'Test', email: 'test@test.com' } });
      
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should reject duplicate email within same tenant', async () => {
      (authServer.getSessionServerFn as any).mockResolvedValue({
        success: true,
        session: { role: 'Head Office Admin', tenantId: 'tenant-1' }
      });
      mockLimit.mockResolvedValueOnce([{ id: 'existing' }]); // existing customer
      
      await expect(createCustomerFn({ data: { name: 'Test', email: 'test@test.com' } }))
        .rejects.toThrow('Email is already in use');
    });
  });
  
  describe('Loyalty', () => {
    it('should reject uncompleted orders for points', async () => {
      (authServer.getSessionServerFn as any).mockResolvedValue({
        success: true,
        session: { role: 'Head Office Admin', tenantId: 'tenant-1' }
      });
      mockWhere.mockResolvedValueOnce([{ status: 'pending' }]); // order
      
      await expect(accrueLoyaltyPointsFn({ data: { orderId: 'ord-1' } }))
        .rejects.toThrow('Order is not completed');
    });
  });
});
