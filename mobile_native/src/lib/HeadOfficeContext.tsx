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
  phone: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | string;
  points: number;
  visits: number;
  spent: number;
  vouchersIssued: number;
  email?: string;
  storeCredit?: string;
  isActive?: boolean;
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
  priceRequests: any[];
  auditLogsList: any[];
  fetchCustomers: (search?: string) => Promise<void>;
  createCustomer: (name: string, email?: string, phone?: string) => Promise<void>;
  updateCustomer: (id: string, name?: string, email?: string, phone?: string, isActive?: boolean) => Promise<void>;
  adjustCustomerPoints: (customerId: string, pointsDelta: number, reason: string) => Promise<void>;
  adjustCustomerCredit: (customerId: string, amountDelta: number, reason: string) => Promise<void>;
  fetchCustomerHistory: (customerId: string) => Promise<any>;
  fetchPromotions: (status?: string) => Promise<void>;
  createCampaign: (name: string, type: string, target: string, value: string, startDate: string, endDate: string, targetCategory?: string, targetProductIds?: string) => Promise<void>;
  activatePromotion: (id: string) => Promise<void>;
  deactivatePromotion: (id: string) => Promise<void>;
  archivePromotion: (id: string) => Promise<void>;
  fetchPriceRequests: () => Promise<void>;
  approvePriceRequest: (id: string) => Promise<void>;
  rejectPriceRequest: (id: string) => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  updateLoyaltyPolicies: (policies: LoyaltyPolicies) => void;
  issueVoucher: (customerId: string) => void;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [priceRequests, setPriceRequests] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

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
      fetchPromotions();
      fetchPriceRequests();
      fetchAuditLogs();
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



  const updateLoyaltyPolicies = (policies: LoyaltyPolicies) => {
    setLoyaltyPolicies(policies);
  };

  const issueVoucher = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, vouchersIssued: (c.vouchersIssued || 0) + 1 } : c))
    );
  };

  const fetchCustomers = async (search: string = '') => {
    try {
      const data = await apiClient.get(`/customers?search=${encodeURIComponent(search)}`);
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === 'object' && Array.isArray((data as any).customers)) {
        list = (data as any).customers;
      } else {
        console.warn('fetchCustomers received a non-array response:', data);
        setCustomers([]);
        return;
      }
      const formatted = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || 'N/A',
        email: c.email || 'N/A',
        tier: c.tier || 'Bronze',
        points: c.points || 0,
        visits: 0,
        spent: 0,
        isActive: c.isActive !== undefined ? c.isActive : true,
        storeCredit: c.storeCredit || '0.00',
        vouchersIssued: 0,
      }));
      setCustomers(formatted);
    } catch (error) {
      console.error('fetchCustomers error:', error);
    }
  };

  const createCustomer = async (name: string, email?: string, phone?: string) => {
    await apiClient.post('/customers', { name, email, phone });
    await fetchCustomers();
  };

  const updateCustomer = async (id: string, name?: string, email?: string, phone?: string, isActive?: boolean) => {
    await apiClient.patch(`/customers/${id}`, { name, email, phone, isActive });
    await fetchCustomers();
  };

  const adjustCustomerPoints = async (customerId: string, pointsDelta: number, reason: string) => {
    await apiClient.post(`/customers/${customerId}/adjust-points`, { pointsDelta, reason });
    await fetchCustomers();
  };

  const adjustCustomerCredit = async (customerId: string, amountDelta: number, reason: string) => {
    await apiClient.post(`/customers/${customerId}/adjust-credit`, { amountDelta, reason });
    await fetchCustomers();
  };

  const fetchCustomerHistory = async (customerId: string) => {
    console.log(`[Customer History Call] fetchCustomerHistory called for customerId: ${customerId}`);
    const response = await apiClient.get<any>(`/customers/${customerId}/history`);
    console.log(`[Customer History Response] fetchCustomerHistory result for ${customerId}:`, response);
    return response;
  };

  const fetchPromotions = async (status?: string) => {
    let url = '/promotions';
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    try {
      const data = await apiClient.get(url);
      if (!data || !Array.isArray(data)) {
        console.warn('fetchPromotions received a non-array response:', data);
        setPromotions([]);
        return;
      }
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type || p.discountType || 'Discount',
        target: p.target || 'All',
        value: p.discountValue ? `${Number(p.discountValue)}% OFF` : (p.value || 'N/A'),
        startDate: p.startDate ? p.startDate.split('T')[0] : '',
        endDate: p.endDate ? p.endDate.split('T')[0] : '',
        status: p.status === 'Archived' ? 'Ended' : p.status,
      }));
      setPromotions(formatted);
    } catch (error) {
      console.warn('fetchPromotions: Endpoint offline or returned error');
    }
  };

  const createCampaign = async (
    name: string,
    type: string,
    target: string,
    value: string,
    startDate: string,
    endDate: string,
    targetCategory?: string,
    targetProductIds?: string
  ) => {
    const discountValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    await apiClient.post('/promotions', {
      name,
      discountType: type === 'Fixed amount discount' ? 'fixed' : 'percentage',
      discountValue,
      startDate,
      endDate,
      status: 'Active',
      type,
      target,
      value,
      targetCategory,
      targetProductIds,
    });
    await fetchPromotions();
  };

  const activatePromotion = async (id: string) => {
    await apiClient.post(`/promotions/${id}/activate`, {});
    await fetchPromotions();
  };

  const deactivatePromotion = async (id: string) => {
    await apiClient.post(`/promotions/${id}/deactivate`, {});
    await fetchPromotions();
  };

  const archivePromotion = async (id: string) => {
    await apiClient.post(`/promotions/${id}/archive`, {});
    await fetchPromotions();
  };

  const fetchPriceRequests = async () => {
    try {
      const data = await apiClient.get('/price-requests');
      if (!data || !Array.isArray(data)) {
        console.warn('fetchPriceRequests received a non-array response:', data);
        setPriceRequests([]);
        return;
      }
      setPriceRequests(data);
    } catch (error) {
      console.warn('fetchPriceRequests: Endpoint offline or returned error');
    }
  };

  const approvePriceRequest = async (id: string) => {
    await apiClient.post(`/price-requests/${id}/approve`, {});
    await fetchPriceRequests();
  };

  const rejectPriceRequest = async (id: string) => {
    await apiClient.post(`/price-requests/${id}/reject`, {});
    await fetchPriceRequests();
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await apiClient.get('/audit-logs');
      if (!data || !Array.isArray(data)) {
        console.warn('fetchAuditLogs received a non-array response:', data);
        setAuditLogsList([]);
        return;
      }
      setAuditLogsList(data);
    } catch (error) {
      console.warn('fetchAuditLogs: Endpoint offline or returned error');
    }
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
      priceRequests,
      auditLogsList,
      togglePermission,
      updateLoyaltyPolicies,
      issueVoucher,
      createCampaign,
      fetchCustomers,
      createCustomer,
      updateCustomer,
      adjustCustomerPoints,
      adjustCustomerCredit,
      fetchCustomerHistory,
      fetchPromotions,
      activatePromotion,
      deactivatePromotion,
      archivePromotion,
      fetchPriceRequests,
      approvePriceRequest,
      rejectPriceRequest,
      fetchAuditLogs,
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
    [branches, products, batches, purchases, vendors, roles, loyaltyPolicies, customers, promotions, priceRequests, auditLogsList, staffUsers]
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
