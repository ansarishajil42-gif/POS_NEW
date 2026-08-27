import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { api } from './apiClient';

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

interface SuperAdminContextProps {
  tenants: Tenant[];
  branches: Branch[];
  vatRate: string;
  inclusive: boolean;
  platformConfig: PlatformConfig;
  createTenant: (name: string, outlets: number, tills: number, trn: string) => void;
  upgradeTenant: (id: string) => void;
  toggleTenantStatus: (id: string) => void;
  addBranch: (tenantId: string, name: string, location: string, status?: 'Active' | 'Suspended') => void;
  deleteBranch: (id: string) => void;
  updateVatRate: (rate: string) => void;
  updateInclusive: (val: boolean) => void;
  updatePlatformConfig: (key: keyof PlatformConfig, val: boolean) => void;
  refreshTenants: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextProps | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vatRate, setVatRate] = useState('5.0');
  const [inclusive, setInclusive] = useState(true);
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
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
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

  const addBranch = (tenantId: string, name: string, location: string, status: 'Active' | 'Suspended' = 'Active') => {
    const newBranch: Branch = {
      id: `b-${Date.now()}`,
      tenantId,
      name,
      location,
      status: status || 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBranches((prev) => [newBranch, ...prev]);
  };

  const deleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  const updateVatRate = (rate: string) => setVatRate(rate);
  const updateInclusive = (val: boolean) => setInclusive(val);
  const updatePlatformConfig = (key: keyof PlatformConfig, val: boolean) => {
    setPlatformConfig((prev) => ({ ...prev, [key]: val }));
  };

  const value = useMemo(
    () => ({
      tenants,
      branches,
      vatRate,
      inclusive,
      platformConfig,
      createTenant,
      upgradeTenant,
      toggleTenantStatus,
      addBranch,
      deleteBranch,
      updateVatRate,
      updateInclusive,
      updatePlatformConfig,
      refreshTenants: fetchTenants,
    }),
    [tenants, branches, vatRate, inclusive, platformConfig]
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
