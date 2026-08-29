import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from './auth';
import { apiClient } from './apiClient';

export interface Branch {
  id: string;
  name: string;
  salesToday: number;
  stockAlerts: number;
  tills: number;
  staff: number;
}

export interface PurchaseItem {
  id: string;
  stage: 'PO' | 'GRN' | 'Invoice';
  vendor: string;
  value: number;
  variance?: string;
  date: string;
  po?: any;
  grn?: any;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  trn: string;
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
  status: 'Scheduled' | 'Active' | 'Ended';
}

export interface ProductVariant {
  variantName: string;
  variantValue: string;
  sku?: string;
  priceAdjustment?: number | string;
}

export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  conversionFactor: number | string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  costPriceRaw: string;
  salePriceRaw: string;
  stock: number;
  isBatchTracked: boolean;
  barcodes: string[];
  variants: ProductVariant[];
  unitConversions: UnitConversion[];
}

interface HeadOfficeContextProps {
  branches: Branch[];
  fetchBranches: () => Promise<void>;
  addBranch: (name: string, address: string, tillCount: number) => Promise<void>;
  updateBranch: (id: string, name: string, address: string, tillCount: number) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  fetchBranchStock: (id: string) => Promise<any[]>;
  fetchBranchStaff: (id: string) => Promise<any[]>;
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: string, product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  batches: any[];
  fetchBatches: () => Promise<void>;
  purchases: PurchaseItem[];
  fetchPurchasing: () => Promise<void>;
  createPurchaseOrder: (vendorId: string, branchId: string, items: any[], total: number) => Promise<void>;
  recordGRN: (poId: string, items: any[]) => Promise<void>;
  convertToInvoice: (grnId: string) => Promise<void>;
  vendors: Vendor[];
  fetchVendors: () => Promise<void>;
  addVendor: (v: any) => Promise<void>;
  updateVendor: (id: string, v: any) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  roles: RoleConfig[];
  loyaltyPolicies: LoyaltyPolicies;
  customers: Customer[];
  promotions: Promotion[];
  togglePermission: (roleName: string, permissionName: string) => void;
  updateLoyaltyPolicies: (policies: LoyaltyPolicies) => void;
  issueVoucher: (customerId: string) => void;
  createCampaign: (name: string, type: string, target: string, value: string, startDate: string, endDate: string) => void;
}

const HeadOfficeContext = createContext<HeadOfficeContextProps | null>(null);

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
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles);
  const [loyaltyPolicies, setLoyaltyPolicies] = useState<LoyaltyPolicies>({
    pointsPerAed: 10,
    minPoints: 5000,
    redemptionValue: 10,
  });
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);

  const fetchBranches = async () => {
    if (!user?.tenantId) return;
    try {
      const data = await apiClient.get(`/branches?tenantId=${user.tenantId}`) as any[];
      const formatted = data.map((b: any) => ({
        id: b.id,
        name: b.name,
        salesToday: b.salesToday || 0,
        stockAlerts: b.stockAlerts || 0,
        tills: b.tillCount || 1,
        staff: b.staffCount || 0,
      }));
      setBranches(formatted);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const addBranch = async (name: string, address: string, tillCount: number) => {
    await apiClient.post('/branches', { tenantId: user?.tenantId, name, address, tillCount });
    await fetchBranches();
  };

  const updateBranch = async (id: string, name: string, address: string, tillCount: number) => {
    await apiClient.patch(`/branches/${id}`, { name, address, tillCount });
    await fetchBranches();
  };

  const deleteBranch = async (id: string) => {
    await apiClient.delete(`/branches/${id}`);
    await fetchBranches();
  };

  const fetchBranchStock = async (id: string) => {
    return await apiClient.get(`/branches/${id}/stock`) as any[];
  };

  const fetchBranchStaff = async (id: string) => {
    return await apiClient.get(`/branches/${id}/staff`) as any[];
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const fetchProducts = async () => {
    try {
      const data = await apiClient.get(`/products`) as any[];
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.barcode || '',
        barcode: p.barcode || '',
        category: p.category,
        unit: p.unit,
        price: parseFloat(p.salePrice),
        cost: parseFloat(p.costPrice),
        costPriceRaw: p.costPrice,
        salePriceRaw: p.salePrice,
        stock: p.stock || 0,
        isBatchTracked: p.isBatchTracked || false,
        barcodes: p.barcodes || [],
        variants: p.variants || [],
        unitConversions: p.unitConversions || [],
      }));
      setProducts(formatted);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await apiClient.get(`/products/batches/all?tenantId=${user?.tenantId}`) as any[];
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  const addProduct = async (product: any) => {
    await apiClient.post('/products', product);
    await fetchProducts();
  };

  const updateProduct = async (id: string, product: any) => {
    await apiClient.patch(`/products/${id}`, product);
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await apiClient.delete(`/products/${id}`);
    await fetchProducts();
  };

  const fetchVendors = async () => {
    try {
      const data = await apiClient.get('/vendors') as any[];
      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const addVendor = async (v: any) => {
    await apiClient.post('/vendors', v);
    await fetchVendors();
  };

  const updateVendor = async (id: string, v: any) => {
    await apiClient.patch(`/vendors/${id}`, v);
    await fetchVendors();
  };

  const deleteVendor = async (id: string) => {
    await apiClient.delete(`/vendors/${id}`);
    await fetchVendors();
  };

  const fetchPurchasing = async () => {
    try {
      const [pos, grns, invs] = await Promise.all([
        apiClient.get('/purchasing/pos') as Promise<any[]>,
        apiClient.get('/purchasing/grns') as Promise<any[]>,
        apiClient.get('/purchasing/invoices') as Promise<any[]>
      ]);

      const items: PurchaseItem[] = [];
      pos.forEach(p => items.push({
        id: p.id, stage: 'PO', vendor: p.vendor?.name || 'Unknown', value: parseFloat(p.total),
        date: p.createdAt.split('T')[0], po: p
      }));
      grns.forEach(g => items.push({
        id: g.id, stage: 'GRN', vendor: g.vendor?.name || 'Unknown', value: parseFloat(g.purchaseOrder?.total || 0),
        date: g.receivedAt.split('T')[0], variance: g.status === 'variance' ? 'Variance detected' : undefined, grn: g
      }));
      invs.forEach(i => items.push({
        id: i.id, stage: 'Invoice', vendor: i.vendor?.name || 'Unknown', value: parseFloat(i.total),
        date: i.createdAt.split('T')[0]
      }));

      setPurchases(items);
    } catch (err) {
      console.error('Failed to fetch purchasing data:', err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchProducts();
    fetchBatches();
    fetchVendors();
    fetchPurchasing();
  }, [user?.tenantId]);

  const createPurchaseOrder = async (vendorId: string, branchId: string, items: any[], total: number) => {
    await apiClient.post('/purchasing/pos', { vendorId, branchId, items, total });
    await fetchPurchasing();
  };

  const recordGRN = async (poId: string, items: any[]) => {
    await apiClient.post(`/purchasing/pos/${poId}/grn`, { items });
    await fetchPurchasing();
  };

  const convertToInvoice = async (grnId: string) => {
    await apiClient.post(`/purchasing/grns/${grnId}/invoice`, {});
    await fetchPurchasing();
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
      branches,
      fetchBranches,
      addBranch,
      updateBranch,
      deleteBranch,
      fetchBranchStock,
      fetchBranchStaff,
      products,
      fetchProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      batches,
      fetchBatches,
      purchases,
      fetchPurchasing,
      createPurchaseOrder,
      recordGRN,
      convertToInvoice,
      vendors,
      fetchVendors,
      addVendor,
      updateVendor,
      deleteVendor,
      roles,
      loyaltyPolicies,
      customers,
      promotions,
      togglePermission,
      updateLoyaltyPolicies,
      issueVoucher,
      createCampaign,
    }),
    [branches, products, batches, purchases, vendors, roles, loyaltyPolicies, customers, promotions]
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
