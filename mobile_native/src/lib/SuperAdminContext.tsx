import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { apiClient as api } from './apiClient';

export interface Tenant {
  id: string;
  name: string;
  status: 'Active' | 'Suspended' | 'active' | 'suspended' | 'trial';
  outlets?: number;
  tills?: number;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  mrr?: number;
  country?: string;
  trn?: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

interface PlatformConfig {
  selfSignup: boolean;
  enforce2FA: boolean;
  autoSuspend: boolean;
  betaFeatures: boolean;
}

export interface PlatformStats {
  activeTenants: number;
  outlets: number;
  monthlyOrders: number;
  activeTills: number;
}

export interface PlatformAnalytics {
  totalGmv: number;
  platformSeries: { t: string; sales: number }[];
  systemLogs: [string, string, string][];
}

interface SuperAdminContextProps {
  tenants: Tenant[];
  branches: Branch[];
  platformStats: PlatformStats | null;
  platformAnalytics: PlatformAnalytics | null;
  vatRate: string;
  inclusive: boolean;
  currency: string;
  platformConfig: PlatformConfig;
  createTenant: (name: string, outlets: number, tills: number, trn: string) => void;
  upgradeTenant: (id: string) => void;
  downgradeTenant: (id: string) => void;
  deleteTenant: (id: string) => Promise<void>;
  toggleTenantStatus: (id: string) => void;
  addBranch: (tenantId: string, name: string, location: string, status?: 'Active' | 'Suspended') => void;
  deleteBranch: (id: string) => Promise<void>;
  updateVatRate: (rate: string) => Promise<void>;
  updateInclusive: (val: boolean) => Promise<void>;
  updatePlatformConfig: (key: keyof PlatformConfig, val: boolean) => void;
  refreshTenants: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextProps | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [vatRate, setVatRate] = useState('5.00');
  const [inclusive, setInclusive] = useState(true);
  const [currency, setCurrency] = useState('AED');
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    selfSignup: true,
    enforce2FA: false,
    autoSuspend: true,
    betaFeatures: false,
  });

  const fetchTenants = async () => {
    try {
      const data = await api.get('/tenants');
      if (Array.isArray(data)) {
        setTenants(data);
      }
      const branchesData = await api.get('/branches');
      if (Array.isArray(branchesData)) {
        const mappedBranches = branchesData.map((b: any) => ({
          ...b,
          location: b.address || 'Unknown'
        }));
        setBranches(mappedBranches);
      }
      console.log("Fetching Stats API: /tenants/stats/dashboard");
      const statsData = await api.get<PlatformStats>('/tenants/stats/dashboard');
      console.log("Stats API Response (Success):", statsData);
      if (statsData) {
        setPlatformStats(statsData);
      }

      // Fetch platform settings
      try {
        const settingsData = await api.get('/tenants/platform-settings') as any;
        if (settingsData) {
          if (settingsData.vatRate !== undefined) setVatRate(String(settingsData.vatRate));
          if (settingsData.vatInclusive !== undefined) setInclusive(settingsData.vatInclusive);
          if (settingsData.currency !== undefined) setCurrency(settingsData.currency);
        }
      } catch (settingsErr) {
        console.error('Failed to fetch platform settings:', settingsErr);
      }

      // Fetch analytics
      try {
        const analyticsData = await api.get('/tenants/analytics/platform') as any;
        if (analyticsData) {
          setPlatformAnalytics(analyticsData);
        }
      } catch (analyticsErr) {
        console.error('Failed to fetch platform analytics:', analyticsErr);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const createTenant = async (name: string, outlets: number, tills: number, trn: string) => {
    try {
      await api.post('/tenants', { name, subdomain: name.toLowerCase().replace(/\s+/g, '-'), plan: 'Starter' });
      fetchTenants();
    } catch (err) {
      console.error('Create tenant error:', err);
    }
  };

  const upgradeTenant = async (id: string) => {
    try {
      const tenant = tenants.find(t => t.id === id);
      if (!tenant) return;
      
      const plans = ['Starter', 'Growth', 'Enterprise'];
      const currentIndex = plans.indexOf(tenant.plan || 'Starter');
      const nextPlan = plans[Math.min(currentIndex + 1, plans.length - 1)];
      
      if (tenant.plan !== nextPlan) {
        await api.patch(`/tenants/${id}`, { plan: nextPlan });
        fetchTenants();
      }
    } catch (err) {
      console.error('Upgrade tenant error:', err);
    }
  };

  const downgradeTenant = async (id: string) => {
    try {
      const tenant = tenants.find(t => t.id === id);
      if (!tenant) return;
      
      const plans = ['Starter', 'Growth', 'Enterprise'];
      const currentIndex = plans.indexOf(tenant.plan || 'Starter');
      const nextPlan = plans[Math.max(currentIndex - 1, 0)];
      
      if (tenant.plan !== nextPlan) {
        await api.patch(`/tenants/${id}`, { plan: nextPlan });
        fetchTenants();
      }
    } catch (err) {
      console.error('Downgrade tenant error:', err);
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      await api.delete(`/tenants/${id}`);
      fetchTenants();
    } catch (err) {
      console.error('Delete tenant error:', err);
      throw err;
    }
  };

  const toggleTenantStatus = async (id: string) => {
    try {
      const tenant = tenants.find(t => t.id === id);
      if (!tenant) return;
      
      const currentStatus = (tenant.status || '').toLowerCase();
      const newStatus = currentStatus === 'active' ? 'Suspended' : 'Active';
      
      await api.patch(`/tenants/${id}`, { status: newStatus });
      fetchTenants();
    } catch (err) {
      console.error('Toggle tenant status error:', err);
    }
  };

  const addBranch = async (tenantId: string, name: string, location: string, status: 'Active' | 'Suspended' = 'Active') => {
    try {
      await api.post('/branches', { tenantId, name, address: location, status });
      fetchTenants();
    } catch (err) {
      console.error('Add branch error:', err);
      throw err;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      await api.delete(`/branches/${id}`);
      fetchTenants();
    } catch (err) {
      console.error('Delete branch error:', err);
      throw err;
    }
  };

  const updateVatRate = async (rate: string) => {
    try {
      await api.patch('/tenants/platform-settings', { vatRate: rate });
      setVatRate(rate);
    } catch (err) {
      console.error('Failed to update vatRate:', err);
    }
  };

  const updateInclusive = async (val: boolean) => {
    try {
      await api.patch('/tenants/platform-settings', { vatInclusive: val });
      setInclusive(val);
    } catch (err) {
      console.error('Failed to update vatInclusive:', err);
    }
  };
  const updatePlatformConfig = (key: keyof PlatformConfig, val: boolean) => {
    setPlatformConfig((prev) => ({ ...prev, [key]: val }));
  };

  const value = useMemo(
    () => ({
      tenants,
      branches,
      platformStats,
      platformAnalytics,
      vatRate,
      inclusive,
      currency,
      platformConfig,
      createTenant,
      upgradeTenant,
      downgradeTenant,
      deleteTenant,
      toggleTenantStatus,
      addBranch,
      deleteBranch,
      updateVatRate,
      updateInclusive,
      updatePlatformConfig,
      refreshTenants: fetchTenants,
    }),
    [tenants, branches, platformStats, platformAnalytics, vatRate, inclusive, currency, platformConfig]
  );

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
