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

export interface StaffUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  branchId?: string;
  isActive: boolean;
  pin?: string;
  password?: string;
  isCustomized?: boolean;
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
  invoice?: any;
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
  phone?: string;
  email?: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  points: number;
  visits?: number;
  spent?: number;
  storeCredit?: string;
  isActive?: boolean;
  vouchersIssued?: number;
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
  recordGRN: (poId: string, grnNumber: string, items: any[]) => Promise<void>;
  convertToInvoice: (grnId: string, invoiceNumber: string, dueDate: string, total: number) => Promise<void>;
  vendors: Vendor[];
  fetchVendors: () => Promise<void>;
  addVendor: (v: any) => Promise<void>;
  updateVendor: (id: string, v: any) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  roles: RoleConfig[];
  loyaltyPolicies: LoyaltyPolicies;
  customers: Customer[];
  promotions: Promotion[];
  fetchCustomers: (search?: string) => Promise<void>;
  addCustomer: (name: string, email?: string, phone?: string) => Promise<void>;
  updateCustomer: (id: string, name: string, email?: string, phone?: string, isActive?: boolean) => Promise<void>;
  adjustCustomerPoints: (customerId: string, pointsDelta: number, reason: string) => Promise<void>;
  adjustCustomerBalance: (customerId: string, amountDelta: number, reason: string) => Promise<void>;
  fetchCustomerHistory: (customerId: string) => Promise<{ orders: any[]; totalSpend: number; orderCount: number }>;
  fetchLoyaltySettings: () => Promise<void>;
  updateLoyaltyPolicies: (policies: LoyaltyPolicies) => Promise<void>;
  issueVoucher: (customerId: string) => void;
  createCampaign: (name: string, type: string, target: string, value: string, startDate: string, endDate: string) => void;
  staffUsers: StaffUser[];
  fetchStaff: () => Promise<void>;
  addStaff: (data: Partial<StaffUser>) => Promise<void>;
  updateStaff: (id: string, data: Partial<StaffUser>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  fetchRoles: () => Promise<void>;
  togglePermission: (role: string, perm: string, enabled: boolean) => Promise<void>;
  fetchStaffPermissions: (userId: string) => Promise<{ role: string; roleDefaults: any[]; overrides: any[] }>;
  toggleStaffPermissionOverride: (userId: string, permission: string, enabled: boolean) => Promise<void>;
  resetStaffPermissions: (userId: string) => Promise<void>;
  fetchVatSettings: () => Promise<any>;
  updateVatSettings: (settings: { vatRate: string; vatInclusive: boolean; taxRegistrationNumber?: string | null }) => Promise<any>;
  fetchSalesSummary: (startDate: string, endDate: string, branchId?: string) => Promise<any>;
  fetchVatSummary: (startDate: string, endDate: string, branchId?: string) => Promise<any>;
}

const HeadOfficeContext = createContext<HeadOfficeContextProps | null>(null);

export const permToKeyMap: Record<string, string> = {
  "Branch override": "branch_override",
  "Local stock": "local_stock",
  "Pricing adjustments": "pricing_adjustments",
  "Till management": "till_management",
  "Shift & staff": "shift_staff",
  "Stock adjust": "stock_adjust",
  "Receive goods": "receive_goods",
  "Create PO": "create_po",
  "Receive invoices": "receive_invoices",
  "Process sales": "process_sales",
  "Refunds": "refunds",
  "End of shift": "end_of_shift",
};

const initialRoles: RoleConfig[] = [
  {
    role: 'Branch Manager',
    users: 0,
    perms: [
      { name: 'Branch override', enabled: true },
      { name: 'Local stock', enabled: true },
      { name: 'Pricing adjustments', enabled: true },
      { name: 'Till management', enabled: true },
      { name: 'Shift & staff', enabled: true },
    ],
  },
  {
    role: 'Inventory Manager',
    users: 0,
    perms: [
      { name: 'Stock adjust', enabled: true },
      { name: 'Receive goods', enabled: true },
    ],
  },
  {
    role: 'Purchasing Officer',
    users: 0,
    perms: [
      { name: 'Create PO', enabled: true },
      { name: 'Receive invoices', enabled: true },
    ],
  },
  {
    role: 'Cashier',
    users: 0,
    perms: [
      { name: 'Process sales', enabled: true },
      { name: 'Refunds', enabled: true },
      { name: 'End of shift', enabled: true },
    ],
  },
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
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

  const fetchStaff = async () => {
    if (!user?.tenantId) {
      console.log("[Mobile fetchStaff] Skip fetch - user.tenantId is missing");
      return;
    }
    try {
      console.log(`[Mobile fetchStaff] Fetching users for tenantId: ${user.tenantId}`);
      const data = await apiClient.get(`/users?tenantId=${user.tenantId}`) as StaffUser[];
      console.log(`[Mobile fetchStaff] Fetched ${data.length} users successfully.`, JSON.stringify(data, null, 2));
      setStaffUsers(data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const addStaff = async (data: Partial<StaffUser>) => {
    if (!user?.tenantId) {
      console.log("[Mobile addStaff] Skip add - user.tenantId is missing");
      return;
    }
    console.log("[Mobile addStaff] Adding staff payload:", JSON.stringify({ tenantId: user.tenantId, ...data }, null, 2));
    const response = await apiClient.post('/users', { tenantId: user.tenantId, ...data });
    console.log("[Mobile addStaff] Server response:", JSON.stringify(response, null, 2));
    await fetchStaff();
  };

  const updateStaff = async (id: string, data: Partial<StaffUser>) => {
    await apiClient.patch(`/users/${id}`, data);
    await fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    await apiClient.delete(`/users/${id}`);
    await fetchStaff();
  };

  const fetchRoles = async () => {
    if (!user?.tenantId) return;
    try {
      const perms = await apiClient.get('/users/permissions') as any[];
      const mergedRoles = initialRoles.map(r => {
        const dbRole = r.role.toLowerCase().replace(" ", "_");
        return {
          ...r,
          perms: r.perms.map(p => {
            const dbPerm = permToKeyMap[p.name] || p.name.toLowerCase().replace(" ", "_");
            const record = perms.find((x: any) => x.role === dbRole && x.permission === dbPerm);
            return {
              ...p,
              enabled: record ? record.enabled : true,
            };
          })
        };
      });
      setRoles(mergedRoles);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const togglePermission = async (roleName: string, permName: string, enabled: boolean) => {
    const dbRole = roleName.toLowerCase().replace(" ", "_");
    const dbPerm = permToKeyMap[permName] || permName.toLowerCase().replace(" ", "_");
    if (dbRole === 'super_admin' || dbRole === 'head_office_admin') return;

    try {
      setRoles(prev => prev.map(r => {
        if (r.role === roleName) {
          return {
            ...r,
            perms: r.perms.map(p => p.name === permName ? { ...p, enabled } : p)
          };
        }
        return r;
      }));
      await apiClient.patch('/users/permissions/toggle', {
        role: dbRole,
        permission: dbPerm,
        enabled,
      });
    } catch (err) {
      console.error('Failed to toggle permission API:', err);
      await fetchRoles(); // revert on fail
    }
  };

  const fetchStaffPermissions = async (userId: string) => {
    return await apiClient.get(`/users/${userId}/permissions`) as { role: string; roleDefaults: any[]; overrides: any[] };
  };

  const toggleStaffPermissionOverride = async (userId: string, permission: string, enabled: boolean) => {
    await apiClient.post(`/users/${userId}/permissions/override`, { permission, enabled });
    await fetchStaff(); // Refresh the isCustomized flag on the list
  };

  const resetStaffPermissions = async (userId: string) => {
    await apiClient.delete(`/users/${userId}/permissions/override`);
    await fetchStaff(); // Refresh the isCustomized flag on the list
  };

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
        date: i.createdAt.split('T')[0], invoice: i
      }));

      setPurchases(items);
    } catch (err) {
      console.error('Failed to fetch purchasing data:', err);
    }
  };

  useEffect(() => {
    if (user?.tenantId) {
      fetchBranches();
      fetchProducts();
      fetchBatches();
      fetchVendors();
      fetchPurchasing();
      fetchStaff();
      fetchRoles();
      fetchCustomers();
      fetchLoyaltySettings();
    }
  }, [user?.tenantId]);

  const createPurchaseOrder = async (vendorId: string, branchId: string, items: any[], total: number) => {
    await apiClient.post('/purchasing/pos', { vendorId, branchId, items, total });
    await fetchPurchasing();
  };

  const recordGRN = async (poId: string, grnNumber: string, items: any[]) => {
    await apiClient.post(`/purchasing/pos/${poId}/grn`, { items, grnNumber });
    await fetchPurchasing();
  };

  const convertToInvoice = async (grnId: string, invoiceNumber: string, dueDate: string, total: number) => {
    await apiClient.post(`/purchasing/grns/${grnId}/invoice`, { invoiceNumber, dueDate, total });
    await fetchPurchasing();
  };



  const fetchLoyaltySettings = async () => {
    try {
      const data = await apiClient.get('/tenants/settings') as any;
      if (data) {
        setLoyaltyPolicies({
          pointsPerAed: Number(data.loyaltyPointsPerAed ?? 10),
          minPoints: Number(data.loyaltyMinPointsToRedeem ?? 5000),
          redemptionValue: Number(data.loyaltyRedemptionRate ?? 0.01),
        });
      }
    } catch (err) {
      console.error('Failed to fetch loyalty settings:', err);
    }
  };

  const updateLoyaltyPolicies = async (policies: LoyaltyPolicies) => {
    try {
      await apiClient.patch('/tenants/settings', {
        loyaltyPointsPerAed: policies.pointsPerAed,
        loyaltyMinPointsToRedeem: policies.minPoints,
        loyaltyRedemptionRate: policies.redemptionValue,
      });
      setLoyaltyPolicies(policies);
    } catch (err) {
      console.error('Failed to update loyalty settings:', err);
    }
  };

  const fetchCustomers = async (search = '') => {
    try {
      const res = await apiClient.get(`/customers?search=${encodeURIComponent(search)}`) as any;
      if (res && res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const addCustomer = async (name: string, email?: string, phone?: string) => {
    await apiClient.post('/customers', { name, email, phone });
    await fetchCustomers();
  };

  const updateCustomer = async (id: string, name: string, email?: string, phone?: string, isActive?: boolean) => {
    await apiClient.patch(`/customers/${id}`, { name, email, phone, isActive });
    await fetchCustomers();
  };

  const adjustCustomerPoints = async (customerId: string, pointsDelta: number, reason: string) => {
    await apiClient.post(`/customers/${customerId}/adjust-points`, { pointsDelta, reason });
    await fetchCustomers();
  };

  const adjustCustomerBalance = async (customerId: string, amountDelta: number, reason: string) => {
    await apiClient.post(`/customers/${customerId}/adjust-balance`, { amountDelta, reason });
    await fetchCustomers();
  };

  const fetchCustomerHistory = async (customerId: string) => {
    try {
      const res = await apiClient.get(`/customers/${customerId}/history`) as any;
      return {
        orders: res.orders || [],
        totalSpend: res.totalSpend || 0,
        orderCount: res.orderCount || 0,
      };
    } catch (err) {
      console.error('Failed to fetch customer history:', err);
      return { orders: [], totalSpend: 0, orderCount: 0 };
    }
  };

  const issueVoucher = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, vouchersIssued: (c.vouchersIssued || 0) + 1 } : c))
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

  const fetchVatSettings = async () => {
    const response = await apiClient.get<any>('/tenants/settings');
    return response;
  };

  const updateVatSettings = async (settings: { vatRate: string; vatInclusive: boolean; taxRegistrationNumber?: string | null }) => {
    const response = await apiClient.patch<any>('/tenants/settings', settings);
    return response;
  };

  const fetchSalesSummary = async (startDate: string, endDate: string, branchId?: string) => {
    let url = `/tenants/reports/sales-summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    if (branchId) {
      url += `&branchId=${encodeURIComponent(branchId)}`;
    }
    const response = await apiClient.get<any>(url);
    return response;
  };

  const fetchVatSummary = async (startDate: string, endDate: string, branchId?: string) => {
    let url = `/tenants/reports/vat-summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    if (branchId) {
      url += `&branchId=${encodeURIComponent(branchId)}`;
    }
    const response = await apiClient.get<any>(url);
    return response;
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
      fetchCustomers,
      addCustomer,
      updateCustomer,
      adjustCustomerPoints,
      adjustCustomerBalance,
      fetchCustomerHistory,
      fetchLoyaltySettings,
      updateLoyaltyPolicies,
      issueVoucher,
      createCampaign,
      togglePermission,
      staffUsers,
      fetchStaff,
      addStaff,
      updateStaff,
      deleteStaff,
      fetchRoles,
      fetchStaffPermissions,
      toggleStaffPermissionOverride,
      resetStaffPermissions,
      fetchVatSettings,
      updateVatSettings,
      fetchSalesSummary,
      fetchVatSummary,
    }),
    [branches, products, batches, purchases, vendors, roles, loyaltyPolicies, customers, promotions, staffUsers]
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
