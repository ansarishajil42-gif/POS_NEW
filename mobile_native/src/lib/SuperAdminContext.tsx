import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

export interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'trial';
  outlets: number;
  tills: number;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  mrr: number;
  country: string;
  trn: string;
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
}

const SuperAdminContext = createContext<SuperAdminContextProps | null>(null);

const initialTenants: Tenant[] = [
  { id: 't1', name: 'FreshMart Supermarkets', status: 'active', outlets: 12, tills: 48, plan: 'Enterprise', mrr: 2400, country: 'UAE', trn: '100000000000001' },
  { id: 't2', name: 'GreenGrocer Chain', status: 'active', outlets: 7, tills: 22, plan: 'Growth', mrr: 1050, country: 'KSA', trn: '100000000000002' },
  { id: 't3', name: 'AlMadina Stores', status: 'suspended', outlets: 4, tills: 14, plan: 'Starter', mrr: 280, country: 'UAE', trn: '100000000000003' },
  { id: 't4', name: 'Sunrise Grocers', status: 'active', outlets: 9, tills: 31, plan: 'Growth', mrr: 1350, country: 'Qatar', trn: '100000000000004' },
  { id: 't5', name: 'DailyFresh Co.', status: 'trial', outlets: 2, tills: 6, plan: 'Starter', mrr: 0, country: 'Bahrain', trn: '100000000000005' },
  { id: 't6', name: 'Oasis Hypermarket', status: 'active', outlets: 15, tills: 60, plan: 'Enterprise', mrr: 3000, country: 'UAE', trn: '100000000000006' },
];

const initialBranchesList: Branch[] = [
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `b-t1-${i}`,
    tenantId: 't1',
    name: `FreshMart - Branch ${i + 1}`,
    location: ['Dubai', 'Abu Dhabi', 'Sharjah'][i % 3],
    status: i % 5 === 0 ? ('Suspended' as const) : ('Active' as const),
    createdAt: new Date(2026, 7, i + 1).toISOString().split('T')[0],
  })),
  ...Array.from({ length: 7 }).map((_, i) => ({
    id: `b-t2-${i}`,
    tenantId: 't2',
    name: `GreenGrocer - Branch ${i + 1}`,
    location: ['Riyadh', 'Jeddah', 'Dammam'][i % 3],
    status: i % 4 === 0 ? ('Suspended' as const) : ('Active' as const),
    createdAt: new Date(2026, 7, i + 2).toISOString().split('T')[0],
  })),
  ...Array.from({ length: 4 }).map((_, i) => ({
    id: `b-t3-${i}`,
    tenantId: 't3',
    name: `AlMadina - Branch ${i + 1}`,
    location: ['Dubai', 'Sharjah'][i % 2],
    status: 'Suspended' as const,
    createdAt: new Date(2026, 7, i + 3).toISOString().split('T')[0],
  })),
  ...Array.from({ length: 9 }).map((_, i) => ({
    id: `b-t4-${i}`,
    tenantId: 't4',
    name: `Sunrise - Branch ${i + 1}`,
    location: ['Doha', 'Al Wakrah'][i % 2],
    status: 'Active' as const,
    createdAt: new Date(2026, 7, i + 4).toISOString().split('T')[0],
  })),
  ...Array.from({ length: 2 }).map((_, i) => ({
    id: `b-t5-${i}`,
    tenantId: 't5',
    name: `DailyFresh - Branch ${i + 1}`,
    location: ['Manama', 'Riffa'][i % 2],
    status: 'Active' as const,
    createdAt: new Date(2026, 7, i + 5).toISOString().split('T')[0],
  })),
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `b-t6-${i}`,
    tenantId: 't6',
    name: `Oasis - Branch ${i + 1}`,
    location: ['Abu Dhabi', 'Al Ain'][i % 2],
    status: 'Active' as const,
    createdAt: new Date(2026, 7, i + 6).toISOString().split('T')[0],
  })),
];

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [branches, setBranches] = useState<Branch[]>(initialBranchesList);
  const [vatRate, setVatRate] = useState<string>('5');
  const [inclusive, setInclusive] = useState<boolean>(true);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    selfSignup: true,
    enforce2FA: true,
    autoSuspend: false,
    betaFeatures: false,
  });

  const createTenant = (name: string, outlets: number, tills: number, trn: string) => {
    const id = `t-${Math.random().toString(36).slice(2, 6)}`;
    const newTenant: Tenant = {
      id,
      name,
      status: 'trial',
      outlets,
      tills,
      plan: 'Starter',
      mrr: 0,
      country: 'UAE',
      trn: trn || '100000000000003',
    };
    setTenants((prev) => [newTenant, ...prev]);

    // Provision basic branches according to specified limits/outlets
    const newBranches: Branch[] = Array.from({ length: Math.min(outlets, 3) }).map((_, i) => ({
      id: `b-${id}-${i}`,
      tenantId: id,
      name: `${name} - Branch ${i + 1}`,
      location: ['Dubai', 'Abu Dhabi', 'Sharjah'][i % 3],
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    }));
    setBranches((prev) => [...newBranches, ...prev]);
  };

  const upgradeTenant = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              plan: t.plan === 'Starter' ? 'Growth' : 'Enterprise',
              mrr: t.plan === 'Starter' ? 1050 : 2400,
            }
          : t
      )
    );
  };

  const toggleTenantStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newStatus = t.status === 'suspended' ? 'active' : 'suspended';
          // Propagate status change to its branches
          setBranches((prevBranches) =>
            prevBranches.map((b) =>
              b.tenantId === id
                ? { ...b, status: newStatus === 'suspended' ? 'Suspended' : 'Active' }
                : b
            )
          );
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const addBranch = (tenantId: string, name: string, location: string, status: 'Active' | 'Suspended' = 'Active') => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    // Check outlet limits (Starter: 4, Growth: 10, Enterprise: 999)
    const limit = tenant.plan === 'Enterprise' ? 999 : tenant.plan === 'Growth' ? 10 : 4;
    const currentBranchesCount = branches.filter((b) => b.tenantId === tenantId).length;

    if (currentBranchesCount >= limit) {
      throw new Error(`Outlet limit reached. Upgrade ${tenant.name}'s plan to add more branches.`);
    }

    const newBranch: Branch = {
      id: `b-${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      name,
      location,
      status,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBranches((prev) => [newBranch, ...prev]);
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, outlets: t.outlets + 1 } : t))
    );
  };

  const deleteBranch = (id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return;

    setBranches((prev) => prev.filter((b) => b.id !== id));
    setTenants((prev) =>
      prev.map((t) => (t.id === branch.tenantId ? { ...t, outlets: Math.max(0, t.outlets - 1) } : t))
    );
  };

  const updateVatRate = (rate: string) => {
    setVatRate(rate);
  };

  const updateInclusive = (val: boolean) => {
    setInclusive(val);
  };

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
