import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authServer from '@/lib/auth-server';
import { db } from '@/server/db';
import * as auditLogger from '@/lib/audit-logger';

vi.mock('@tanstack/react-start', () => {
  return {
    createServerFn: () => {
      let handlerFunc: any;
      let validatorFunc = (x: any) => x;
      const chain: any = {
        validator: (v: any) => { validatorFunc = v; return chain; },
        handler: (h: any) => { handlerFunc = h; Object.assign(executeFn, chain); return executeFn; }
      };
      // When called, return a function that mimics the server fn execution
      const executeFn = async (args: any) => {
        return handlerFunc({ data: validatorFunc(args?.data || args) });
      };
      // We must attach validator and handler to the function itself for the builder pattern
      Object.assign(executeFn, chain);
      return executeFn;
    }
  };
});

vi.mock('@/lib/audit-logger', () => ({
  logAuditAction: vi.fn()
}));

import { 
  updateTenantServerFn, 
  updateTenantLimitsServerFn, 
  createBranchServerFn, 
  createTenantServerFn,
  getAuditLogsServerFn,
  getAnalyticsServerFn,
  archiveTenantServerFn
} from '../super-admin-server';

// Mock dependencies
vi.mock('@/lib/auth-server', () => ({
  getSessionServerFn: vi.fn()
}));

// Provide enough mock implementation for transaction and queries
vi.mock('@/server/db', () => {
  const _mockQueryResults: any[] = [];
  
  const createMockBuilder = () => {
    const builder: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      then: (resolve: any, reject: any) => {
        const nextResult = _mockQueryResults.shift();
        if (nextResult instanceof Error) {
          return reject(nextResult);
        }
        return resolve(nextResult || []);
      }
    };
    return builder;
  };

  const mTx = createMockBuilder();
  const mDb = createMockBuilder();
  mDb.transaction = vi.fn(async (cb: any) => cb(mTx));
  mDb._mTx = mTx;
  mDb._mockQueryResults = _mockQueryResults;

  return {
    db: mDb
  };
});

describe('Super Admin Backend Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db as any)._mockQueryResults.length = 0; // Clear results queue
    vi.mocked(authServer.getSessionServerFn).mockResolvedValue({
      success: true,
      session: { id: 'u1', role: 'Super Admin' } as any
    } as any);
  });

  describe('Authorization', () => {
    it('should reject requests without Super Admin role', async () => {
      vi.mocked(authServer.getSessionServerFn).mockResolvedValue({
        success: true,
        session: { id: 'u1', role: 'branch_manager' } as any
      } as any);

      await expect(updateTenantServerFn({ data: { id: 't1', name: 'N', subdomain: 's' } } as any))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('Audit Logging Security', () => {
    it('should never log adminPassword when creating tenant', async () => {
      (db as any)._mockQueryResults.push([{ id: 't1' }]); // insert return
      
      const payload = {
        name: 'Test Tenant',
        subdomain: 'test',
        plan: 'Starter',
        trn: '123',
        adminName: 'Admin',
        adminEmail: 'admin@test.com',
        adminPhone: '123',
        adminAddress: '123',
        adminPassword: 'superSecretPassword'
      };

      await createTenantServerFn({ data: payload } as any);
      
      const logCall = vi.mocked(auditLogger.logAuditAction).mock.calls[0][0];
      expect(logCall.afterValue).not.toHaveProperty('adminPassword');
      expect(JSON.stringify(logCall)).not.toContain('superSecretPassword');
    });

    it('should redact secrets from audit logs retrieval', async () => {
      (db as any)._mockQueryResults.push([
        { id: '1', details: { secretKey: '12345', normal: 'abc', somePassword: 'abc' } }
      ]); // select logs return

      const res = await getAuditLogsServerFn({ data: {} } as any);
      expect(res.success).toBe(true);
      expect(res.logs[0].details.secretKey).toBe('[REDACTED]');
      expect(res.logs[0].details.somePassword).toBe('[REDACTED]');
      expect(res.logs[0].details.normal).toBe('abc');
    });
  });

  describe('Tenant Limits Downgrades', () => {
    it('should successfully update valid limits', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1', outletLimit: 10, tillLimit: 10, monthlyOrderLimit: 10 }], // current limit
        [{ count: 2 }], // active branches
        [{ count: 2 }], // active tills
        [{ count: 2 }]  // current month orders
      );

      const res = await updateTenantLimitsServerFn({ 
        data: { id: 't1', outletLimit: 5, tillLimit: 5, monthlyOrderLimit: 5 } 
      } as any);
      expect(res.success).toBe(true);
    });

    it('should reject outlet limit downgrade below active branch count', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1' }], // current limit
        [{ count: 5 }]  // active branches
      );

      const res = await updateTenantLimitsServerFn({ 
        data: { id: 't1', outletLimit: 4, tillLimit: 10, monthlyOrderLimit: 100 } 
      } as any);
      expect(res.success).toBe(false);
      expect(res.error).toContain('less than current usage (5)');
    });

    it('should reject till limit downgrade below active till count', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1' }], // current limit
        [{ count: 2 }], // active branches
        [{ count: 10 }] // active tills
      );

      const res = await updateTenantLimitsServerFn({ 
        data: { id: 't1', outletLimit: 5, tillLimit: 8, monthlyOrderLimit: 100 } 
      } as any);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Till limit cannot be less than current usage (10)');
    });

    it('should reject monthly order limit downgrade below current month orders', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1' }], // current limit
        [{ count: 2 }], // active branches
        [{ count: 2 }], // active tills
        [{ count: 500 }] // orders
      );

      const res = await updateTenantLimitsServerFn({ 
        data: { id: 't1', outletLimit: 5, tillLimit: 8, monthlyOrderLimit: 100 } 
      } as any);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Monthly order limit cannot be less than current month usage (500)');
    });
  });

  describe('Tenant Status Analytics', () => {
    it('should correctly count active, suspended, and trial tenants', async () => {
      (db as any)._mockQueryResults.push(
        [{ total: 100, createdAt: new Date() }], // all orders
        [ // tenant distribution
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Suspended' },
          { status: 'Trial' },
          { status: 'Trial' },
          { status: 'Trial' }
        ],
        [] // audit logs
      );

      const res = await getAnalyticsServerFn({ data: {} } as any);
      expect(res.success).toBe(true);
      expect(res.tenantStats).toBeDefined();
      expect(res.tenantStats.active).toBe(2);
      expect(res.tenantStats.suspended).toBe(1);
      expect(res.tenantStats.trial).toBe(3);
      expect(res.tenantStats.total).toBe(6);
    });
  });

  describe('Concurrency & Limits', () => {
    it('NOTE: Concurrency relies on Postgres FOR UPDATE row locks which are mocked in unit tests but valid in SQL', async () => {
      (db as any)._mockQueryResults.push(
        [{ outletLimit: 3 }], // Tenant Limit
        [{ count: 3 }] // Active branches Full
      );

      const result = await createBranchServerFn({ 
        data: { tenantId: 't1', name: 'Branch 4', address: '123 Test' } 
      } as any);
      
      const mTx = (db as any)._mTx;
      expect(mTx.for).toHaveBeenCalledWith('update'); // Ensure FOR UPDATE is invoked
      expect(result.success).toBe(false);
      expect(result.error).toBe('Outlet limit reached for this tenant.');
    });
  });

  describe('Archive Tenant (Soft Delete)', () => {
    it('should successfully archive a tenant when confirmation matches exactly', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1', name: 'Test Tenant', subdomain: 'test', status: 'Active' }]
      );

      const result = await archiveTenantServerFn({
        data: { tenantId: 't1', confirmationValue: 'test' }
      } as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Tenant successfully archived.');
      const logCall = vi.mocked(auditLogger.logAuditAction).mock.calls[0][0];
      expect(logCall.afterValue.status).toBe('Archived');
    });

    it('should reject archive request if confirmation value does not match', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1', name: 'Test Tenant', subdomain: 'test', status: 'Active' }]
      );

      await expect(archiveTenantServerFn({
        data: { tenantId: 't1', confirmationValue: 'wrong' }
      } as any)).rejects.toThrow('Confirmation value does not match tenant name or subdomain.');
    });

    it('should return safely if tenant is already archived', async () => {
      (db as any)._mockQueryResults.push(
        [{ id: 't1', name: 'Test Tenant', subdomain: 'test', status: 'Archived' }]
      );

      const result = await archiveTenantServerFn({
        data: { tenantId: 't1', confirmationValue: 'test' }
      } as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Tenant is already archived.');
    });
  });
});
