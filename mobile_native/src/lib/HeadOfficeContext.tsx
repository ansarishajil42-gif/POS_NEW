import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

export interface PurchaseItem {
  id: string;
  stage: 'PO' | 'GRN' | 'Invoice';
  vendor: string;
  value: number;
  variance?: string;
  date: string;
}

export interface RoleConfig {
  role: string;
  users: number;
  perms: { name: string; enabled: boolean }[];
}

export interface LoyaltyPolicies {
  pointsPerAed: number;
  minPoints: number;
  redemptionValue: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  points: number;
  visits: number;
  spent: number;
  vouchersIssued: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: string;
  target: string;
  value: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Scheduled' | 'Ended';
}

interface HeadOfficeContextProps {
  purchases: PurchaseItem[];
  roles: RoleConfig[];
  loyaltyPolicies: LoyaltyPolicies;
  customers: Customer[];
  promotions: Promotion[];
  createPurchaseOrder: (vendor: string, value: number) => void;
  recordGRN: (poId: string) => void;
  convertToInvoice: (grnId: string) => void;
  togglePermission: (roleName: string, permissionName: string) => void;
  updateLoyaltyPolicies: (policies: LoyaltyPolicies) => void;
  issueVoucher: (customerId: string) => void;
  createCampaign: (name: string, type: string, target: string, value: string, startDate: string, endDate: string) => void;
}

const HeadOfficeContext = createContext<HeadOfficeContextProps | null>(null);

const initialPurchases: PurchaseItem[] = [
  { id: 'PO-2026-9481', stage: 'PO', vendor: 'Almarai UAE', value: 18400, date: '2026-08-15' },
  { id: 'PO-2026-9482', stage: 'PO', vendor: 'Unilever Gulf', value: 32000, date: '2026-08-16' },
  { id: 'GRN-2026-8801', stage: 'GRN', vendor: 'Gulf Food Industries', value: 14200, variance: '2 cases missing', date: '2026-08-16' },
  { id: 'INV-2026-7740', stage: 'Invoice', vendor: 'Sadia Poultry', value: 51700, date: '2026-08-17' },
];

const initialRoles: RoleConfig[] = [
  {
    role: 'Store Manager',
    users: 14,
    perms: [
      { name: 'Full outlet access', enabled: true },
      { name: 'Price overrides', enabled: true },
      { name: 'Void receipts', enabled: true },
      { name: 'Shift approvals', enabled: true },
    ],
  },
  {
    role: 'Inventory Manager',
    users: 9,
    perms: [
      { name: 'Stock adjustments', enabled: true },
      { name: 'Batch & expiry', enabled: true },
      { name: 'Transfers', enabled: true },
      { name: 'Clearance pricing', enabled: true },
    ],
  },
  {
    role: 'Purchasing Officer',
    users: 6,
    perms: [
      { name: 'Create POs', enabled: true },
      { name: 'Record GRNs', enabled: true },
      { name: 'Vendor invoices', enabled: true },
      { name: 'AP monitoring', enabled: true },
    ],
  },
  {
    role: 'Cashier',
    users: 212,
    perms: [
      { name: 'Checkout', enabled: true },
      { name: 'Shift float', enabled: true },
      { name: 'Loyalty redemption', enabled: true },
    ],
  },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Fatima Al Mansoori', phone: '+971 50 123 4567', tier: 'Platinum', points: 18490, visits: 94, spent: 32400, vouchersIssued: 0 },
  { id: 'c2', name: 'John Doe', phone: '+971 54 987 6543', tier: 'Gold', points: 8400, visits: 41, spent: 15100, vouchersIssued: 0 },
  { id: 'c3', name: 'Saeed Al Kaabi', phone: '+971 52 444 8888', tier: 'Silver', points: 3100, visits: 18, spent: 5400, vouchersIssued: 0 },
  { id: 'c4', name: 'Sarah Smith', phone: '+971 56 111 2222', tier: 'Bronze', points: 450, visits: 3, spent: 890, vouchersIssued: 0 },
];

const initialPromotions: Promotion[] = [
  { id: 'pr1', name: 'National Day Bundle', type: 'Bundle', target: 'Basic goods', value: 'Buy 2 Get 1', startDate: '2026-11-25', endDate: '2026-12-05', status: 'Scheduled' },
  { id: 'pr2', name: 'Dairy Clearance', type: 'Discount', target: 'Dairy near-expiry', value: '30% OFF', startDate: '2026-08-18', endDate: '2026-08-25', status: 'Active' },
  { id: 'pr3', name: 'Summer Refreshers', type: 'Discount', target: 'Beverages', value: '15% OFF', startDate: '2026-06-01', endDate: '2026-08-31', status: 'Active' },
];

export function HeadOfficeProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PurchaseItem[]>(initialPurchases);
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles);
  const [loyaltyPolicies, setLoyaltyPolicies] = useState<LoyaltyPolicies>({
    pointsPerAed: 10,
    minPoints: 5000,
    redemptionValue: 10,
  });
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);

  const createPurchaseOrder = (vendor: string, value: number) => {
    const newPo: PurchaseItem = {
      id: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      stage: 'PO',
      vendor,
      value,
      date: new Date().toISOString().split('T')[0],
    };
    setPurchases((prev) => [newPo, ...prev]);
  };

  const recordGRN = (poId: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              id: p.id.replace('PO', 'GRN'),
              stage: 'GRN',
              variance: Math.random() > 0.5 ? '1 carton variance' : undefined,
            }
          : p
      )
    );
  };

  const convertToInvoice = (grnId: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === grnId
          ? {
              ...p,
              id: p.id.replace('GRN', 'INV'),
              stage: 'Invoice',
            }
          : p
      )
    );
  };

  const togglePermission = (roleName: string, permissionName: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.role === roleName
          ? {
              ...r,
              perms: r.perms.map((p) => (p.name === permissionName ? { ...p, enabled: !p.enabled } : p)),
            }
          : r
      )
    );
  };

  const updateLoyaltyPolicies = (policies: LoyaltyPolicies) => {
    setLoyaltyPolicies(policies);
  };

  const issueVoucher = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, vouchersIssued: c.vouchersIssued + 1 } : c))
    );
  };

  const createCampaign = (
    name: string,
    type: string,
    target: string,
    value: string,
    startDate: string,
    endDate: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let status: Promotion['status'] = 'Scheduled';
    if (today >= startDate && today <= endDate) {
      status = 'Active';
    } else if (today > endDate) {
      status = 'Ended';
    }

    const newCampaign: Promotion = {
      id: `pr-${Math.random().toString(36).slice(2, 6)}`,
      name,
      type,
      target,
      value,
      startDate,
      endDate,
      status,
    };
    setPromotions((prev) => [newCampaign, ...prev]);
  };

  const contextValue = useMemo(
    () => ({
      purchases,
      roles,
      loyaltyPolicies,
      customers,
      promotions,
      createPurchaseOrder,
      recordGRN,
      convertToInvoice,
      togglePermission,
      updateLoyaltyPolicies,
      issueVoucher,
      createCampaign,
    }),
    [purchases, roles, loyaltyPolicies, customers, promotions]
  );

  return <HeadOfficeContext.Provider value={contextValue}>{children}</HeadOfficeContext.Provider>;
}

export function useHeadOffice() {
  const context = useContext(HeadOfficeContext);
  if (!context) {
    throw new Error('useHeadOffice must be used within a HeadOfficeProvider');
  }
  return context;
}
