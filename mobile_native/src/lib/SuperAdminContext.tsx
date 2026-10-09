import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiClient, API_BASE_URL, storage } from './apiClient';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: 'Starter' | 'Growth' | 'Enterprise' | string;
  status: 'Active' | 'Suspended' | 'active' | 'suspended' | string;
  outletLimit: number;
  branchCount: number;
  currentPeriodEndDate?: string | null;
  createdAt?: string;
  outlets?: number;
  tills?: number;
  mrr?: number;
  country?: string;
  trn?: string;
}

export interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName?: string | null;
  tenantSubdomain?: string | null;
  planName: string;
  billingCycle: string;
  durationMonths: number;
  subtotal: string;
  vatAmount: string;
  totalAmount: string;
  currency: string;
  paymentStatus: 'paid' | 'pending_gateway_integration' | 'overdue' | 'manual_paid' | string;
  paymentMethod: string;
  mamoPaymentLinkId?: string | null;
  mamoPaymentUrl?: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface TenantQueryParams {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceQueryParams {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceInput {
  tenantId: string;
  planName: string;
  billingCycle?: string;
  customDays?: number;
  customAmount?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface UpdateInvoiceInput {
  planName?: string;
  billingCycle?: string;
  customDays?: number;
  customAmount?: number;
  periodStart?: string;
  periodEnd?: string;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address?: string | null;
  tillCount?: number;
  status: string;
  createdAt?: string;
}

export interface CreateTenantInput {
  name: string;
  subdomain: string;
  plan: string;
  billingCycle?: string;
  customDays?: number;
  outlets?: number;
  tills?: number;
  trn?: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminAddress?: string;
  adminPassword: string;
}

export interface UpdateTenantInput {
  name?: string;
  plan?: string;
  outletLimit?: number;
  tillLimit?: number;
  trn?: string;
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface TenantBillingItem {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  plan: string;
  status: 'active' | 'due_soon' | 'overdue' | 'no_record' | string;
  punctuality: string;
  billingCycle: string | null;
  customDays?: number | null;
  subscriptionStartDate?: string | null;
  currentPeriodEndDate?: string | null;
  lastPaymentAmount?: number | null;
  lastPaymentDate?: string | null;
  totalPaid: number;
  paymentCount: number;
}

export interface BillingOverview {
  totalTenants: number;
  totalRevenueCollected: number;
  overdueCount: number;
  dueSoonCount: number;
  totalOverdueAmount: number;
}

export interface TenantPaymentRecord {
  id: string;
  tenantId: string;
  amount: string | number;
  currency: string;
  paymentDate: string;
  periodCoveredStart: string;
  periodCoveredEnd: string;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

export interface RecordPaymentInput {
  amount: number | string;
  paymentDate: string;
  billingCycle: string;
  customDays?: number;
  notes?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  shortDescription: string;
  content: string;
  status: 'Draft' | 'Published' | string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  shortDescription: string;
  content: string;
  status?: string;
  authorName?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  coverImageUrl?: string | null;
  shortDescription?: string;
  content?: string;
  status?: string;
  authorName?: string;
}

export interface SalesVolumeSeriesItem {
  t: string;
  sales: number;
  tills?: number;
  api?: number;
}

export interface PlanDistributionItem {
  plan: string;
  count: number;
  percentage: number;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  createdAt: string;
  tenantId?: string;
  tenantName?: string;
  userName?: string;
}

export interface PlatformSettings {
  id?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  vatRate: string;
  vatInclusive: boolean;
  updatedAt?: string;
}

export interface UpdatePlatformSettingsInput {
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  vatRate?: string;
  vatInclusive?: boolean;
}

interface SuperAdminContextProps {
  tenants: Tenant[];
  tenantsTotal: number;
  tenantsPage: number;
  tenantsLimit: number;
  invoices: TenantInvoice[];
  invoicesTotal: number;
  invoicesPage: number;
  invoicesLimit: number;
  loading: boolean;
  error: string | null;
  fetchTenants: (params?: TenantQueryParams) => Promise<void>;
  fetchInvoices: (params?: InvoiceQueryParams) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshTenants: () => void;
  createTenant: (input: CreateTenantInput) => Promise<{ success: boolean; error?: string; tenant?: any }>;
  updateTenant: (id: string, input: UpdateTenantInput) => Promise<{ success: boolean; error?: string; tenant?: any }>;
  toggleTenantStatus: (id: string, status?: string) => Promise<{ success: boolean; error?: string; status?: string }>;
  archiveTenant: (id: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  getTenantBranches: (tenantId: string) => Promise<{ success: boolean; error?: string; branches: Branch[] }>;
  addBranch: (tenantId: string, data: { name: string; address?: string }) => Promise<{ success: boolean; error?: string; branch?: any }>;
  updateTenantAdmin: (tenantId: string, data: UpdateAdminInput) => Promise<{ success: boolean; error?: string; admin?: any }>;
  getBillingStatus: () => Promise<{ success: boolean; overview?: BillingOverview; tenants?: TenantBillingItem[]; error?: string }>;
  recordPayment: (tenantId: string, data: RecordPaymentInput) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateDueDate: (tenantId: string, newDueDate: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  getPaymentHistory: (tenantId: string) => Promise<{ success: boolean; payments: TenantPaymentRecord[]; error?: string }>;
  createInvoice: (input: CreateInvoiceInput) => Promise<{ success: boolean; invoice?: TenantInvoice; error?: string }>;
  updateInvoice: (id: string, input: UpdateInvoiceInput) => Promise<{ success: boolean; invoice?: TenantInvoice; error?: string }>;
  deleteInvoice: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  generatePaymentLink: (id: string) => Promise<{ success: boolean; paymentUrl?: string; paymentLinkId?: string; error?: string }>;
  downloadInvoicePdf: (id: string) => Promise<{ success: boolean; uri?: string; error?: string }>;
  getBlogPosts: () => Promise<{ success: boolean; posts?: BlogPost[]; error?: string }>;
  createBlogPost: (input: CreateBlogPostInput) => Promise<{ success: boolean; post?: BlogPost; error?: string }>;
  updateBlogPost: (id: string, input: UpdateBlogPostInput) => Promise<{ success: boolean; post?: BlogPost; error?: string }>;
  deleteBlogPost: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  uploadBlogCover: (file: any, fileName?: string, mimeType?: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  getSalesVolume: (params?: { startDate?: string; endDate?: string; tenantId?: string }) => Promise<{ success: boolean; totalGmv?: number; platformSeries?: SalesVolumeSeriesItem[]; orderCount?: number; error?: string }>;
  getPlanDistribution: () => Promise<{ success: boolean; total?: number; plans?: Record<string, number>; breakdown?: PlanDistributionItem[]; error?: string }>;
  getActivityLog: (params?: { page?: number; limit?: number }) => Promise<{ success: boolean; logs?: ActivityLogItem[]; error?: string }>;
  getPlatformSettings: () => Promise<{ success: boolean; settings?: PlatformSettings; error?: string }>;
  updatePlatformSettings: (data: UpdatePlatformSettingsInput) => Promise<{ success: boolean; settings?: any; message?: string; error?: string }>;
}

const SuperAdminContext = createContext<SuperAdminContextProps | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [tenantsPage, setTenantsPage] = useState(1);
  const [tenantsLimit, setTenantsLimit] = useState(20);

  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [invoicesTotal, setInvoicesTotal] = useState(0);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesLimit, setInvoicesLimit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async (params: TenantQueryParams = {}) => {
    try {
      const queryParts: string[] = [];
      if (params.search?.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
      if (params.plan && params.plan !== 'all') queryParts.push(`plan=${encodeURIComponent(params.plan)}`);
      if (params.status && params.status !== 'all') queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);

      const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const res = await apiClient.get<any>(`/super-admin/tenants${queryStr}`);

      if (res && res.success && Array.isArray(res.tenants)) {
        setTenants(res.tenants);
        setTenantsTotal(res.total ?? res.tenants.length);
        setTenantsPage(res.page ?? (params.page || 1));
        setTenantsLimit(res.limit ?? (params.limit || 20));
      } else if (Array.isArray(res)) {
        setTenants(res);
        setTenantsTotal(res.length);
      }
    } catch (err: any) {
      console.error('SuperAdminContext fetchTenants error:', err);
      throw err;
    }
  };

  const fetchInvoices = async (params: InvoiceQueryParams = {}) => {
    try {
      const queryParts: string[] = [];
      if (params.search?.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
      if (params.status && params.status !== 'all') queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.plan && params.plan !== 'all') queryParts.push(`plan=${encodeURIComponent(params.plan)}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);

      const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const res = await apiClient.get<any>(`/super-admin/invoices${queryStr}`);

      if (res && res.success && Array.isArray(res.invoices)) {
        setInvoices(res.invoices);
        setInvoicesTotal(res.total ?? res.invoices.length);
        setInvoicesPage(res.page ?? (params.page || 1));
        setInvoicesLimit(res.limit ?? (params.limit || 20));
      } else if (Array.isArray(res)) {
        setInvoices(res);
        setInvoicesTotal(res.length);
      }
    } catch (err: any) {
      console.error('SuperAdminContext fetchInvoices error:', err);
      throw err;
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.allSettled([fetchTenants(), fetchInvoices()]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch super admin data');
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async (input: CreateTenantInput) => {
    try {
      const res = await apiClient.post<any>('/super-admin/tenants', input);
      if (res && res.success) {
        await fetchTenants();
        return { success: true, tenant: res.tenant };
      }
      return { success: false, error: res?.error || 'Failed to create tenant' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create tenant' };
    }
  };

  const updateTenant = async (id: string, input: UpdateTenantInput) => {
    try {
      const res = await apiClient.patch<any>(`/super-admin/tenants/${id}`, input);
      if (res && res.success) {
        await fetchTenants();
        return { success: true, tenant: res.tenant };
      }
      return { success: false, error: res?.error || 'Failed to update tenant' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update tenant' };
    }
  };

  const toggleTenantStatus = async (id: string, status?: string) => {
    try {
      const res = await apiClient.patch<any>(`/super-admin/tenants/${id}/status`, { status });
      if (res && res.success) {
        await fetchTenants();
        return { success: true, status: res.status };
      }
      return { success: false, error: res?.error || 'Failed to update status' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update status' };
    }
  };

  const archiveTenant = async (id: string) => {
    try {
      const res = await apiClient.patch<any>(`/super-admin/tenants/${id}/archive`, {});
      if (res && res.success) {
        await fetchTenants();
        return { success: true, message: res.message };
      }
      return { success: false, error: res?.error || 'Failed to archive tenant' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to archive tenant' };
    }
  };

  const getTenantBranches = async (tenantId: string) => {
    try {
      const res = await apiClient.get<any>(`/super-admin/tenants/${tenantId}/branches`);
      if (res && res.success) {
        return { success: true, branches: res.branches || [] };
      }
      return { success: false, error: res?.error || 'Failed to fetch branches', branches: [] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch branches', branches: [] };
    }
  };

  const addBranch = async (tenantId: string, data: { name: string; address?: string }) => {
    try {
      const res = await apiClient.post<any>(`/super-admin/tenants/${tenantId}/branches`, data);
      if (res && res.success) {
        await fetchTenants();
        return { success: true, branch: res.branch };
      }
      return { success: false, error: res?.error || 'Failed to add branch' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add branch' };
    }
  };

  const updateTenantAdmin = async (tenantId: string, data: UpdateAdminInput) => {
    try {
      const res = await apiClient.patch<any>(`/super-admin/tenants/${tenantId}/admin`, data);
      if (res && res.success) {
        return { success: true, admin: res.admin };
      }
      return { success: false, error: res?.error || 'Failed to update admin' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update admin' };
    }
  };

  const getBillingStatus = async () => {
    try {
      const res = await apiClient.get<any>('/super-admin/billing-status');
      if (res && res.success) {
        return {
          success: true,
          overview: res.overview as BillingOverview,
          tenants: res.tenants as TenantBillingItem[],
        };
      }
      return { success: false, error: res?.error || 'Failed to fetch billing status' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch billing status' };
    }
  };

  const recordPayment = async (tenantId: string, data: RecordPaymentInput) => {
    try {
      const res = await apiClient.post<any>(`/super-admin/tenants/${tenantId}/payments`, data);
      if (res && res.success) {
        return { success: true, message: res.message || 'Payment recorded successfully' };
      }
      return { success: false, error: res?.error || 'Failed to record payment' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to record payment' };
    }
  };

  const updateDueDate = async (tenantId: string, newDueDate: string) => {
    try {
      const res = await apiClient.patch<any>(`/super-admin/tenants/${tenantId}/due-date`, { newDueDate });
      if (res && res.success) {
        return { success: true, message: res.message || 'Due date updated successfully' };
      }
      return { success: false, error: res?.error || 'Failed to update due date' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update due date' };
    }
  };

  const getPaymentHistory = async (tenantId: string) => {
    try {
      const res = await apiClient.get<any>(`/super-admin/tenants/${tenantId}/payment-history`);
      if (res && res.success) {
        return { success: true, payments: (res.payments || []) as TenantPaymentRecord[] };
      }
      return { success: false, error: res?.error || 'Failed to fetch payment history', payments: [] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch payment history', payments: [] };
    }
  };

  const createInvoice = async (input: CreateInvoiceInput) => {
    try {
      const res = await apiClient.post<any>('/super-admin/invoices', input);
      if (res && res.success) {
        await fetchInvoices();
        return { success: true, invoice: res.invoice };
      }
      return { success: false, error: res?.error || 'Failed to create invoice' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create invoice' };
    }
  };

  const updateInvoice = async (id: string, input: UpdateInvoiceInput) => {
    try {
      const res = await apiClient.patch<any>(`/super-admin/invoices/${id}`, input);
      if (res && res.success) {
        await fetchInvoices();
        return { success: true, invoice: res.invoice };
      }
      return { success: false, error: res?.error || 'Failed to update invoice' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update invoice' };
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const res = await apiClient.delete<any>(`/super-admin/invoices/${id}`);
      if (res && res.success) {
        await fetchInvoices();
        return { success: true, message: res.message };
      }
      return { success: false, error: res?.error || 'Failed to delete invoice' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete invoice' };
    }
  };

  const generatePaymentLink = async (id: string) => {
    try {
      const res = await apiClient.post<any>(`/super-admin/invoices/${id}/generate-link`, {});
      if (res && res.success) {
        await fetchInvoices();
        return { success: true, paymentUrl: res.paymentUrl, paymentLinkId: res.paymentLinkId };
      }
      return { success: false, error: res?.error || 'Failed to generate payment link' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to generate payment link' };
    }
  };

  const downloadInvoicePdf = async (id: string) => {
    try {
      const res = await apiClient.get<any>(`/super-admin/invoices/${id}/pdf`);
      if (res && res.success && res.html) {
        if (Platform.OS === 'web') {
          // Web environment (browser): open printable document in new window
          if (typeof window !== 'undefined') {
            const printWin = window.open('', '_blank');
            if (printWin) {
              printWin.document.open();
              printWin.document.write(res.html);
              printWin.document.close();
              printWin.focus();
              setTimeout(() => {
                try {
                  printWin.print();
                } catch (e) {}
              }, 400);
              return { success: true };
            }
          }
        }

        // Native environment (Android / iOS):
        try {
          const { uri } = await Print.printToFileAsync({ html: res.html });
          const canShare = await Sharing.isAvailableAsync().catch(() => false);
          if (canShare) {
            await Sharing.shareAsync(uri, {
              UTI: '.pdf',
              mimeType: 'application/pdf',
              dialogTitle: `Tax-Invoice-${res.invoice?.invoiceNumber || id}.pdf`,
            });
            return { success: true, uri };
          } else {
            await Print.printAsync({ html: res.html });
            return { success: true, uri };
          }
        } catch (printErr: any) {
          // Fallback to native printAsync if printToFileAsync is not supported
          await Print.printAsync({ html: res.html });
          return { success: true };
        }
      }
      return { success: false, error: res?.error || 'Failed to generate invoice PDF' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to download invoice PDF' };
    }
  };

  const getBlogPosts = async (): Promise<{ success: boolean; posts?: BlogPost[]; error?: string }> => {
    try {
      const res = await apiClient.get<any>('/blog-admin/posts');
      if (Array.isArray(res)) {
        return { success: true, posts: res };
      }
      if (res && Array.isArray(res.posts)) {
        return { success: true, posts: res.posts };
      }
      return { success: false, error: res?.error || 'Failed to fetch blog posts', posts: [] };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch blog posts', posts: [] };
    }
  };

  const createBlogPost = async (input: CreateBlogPostInput): Promise<{ success: boolean; post?: BlogPost; error?: string }> => {
    try {
      const res = await apiClient.post<any>('/blog-admin/posts', input);
      if (res && res.id) {
        return { success: true, post: res };
      }
      return { success: false, error: res?.error || 'Failed to create blog post' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create blog post' };
    }
  };

  const updateBlogPost = async (id: string, input: UpdateBlogPostInput): Promise<{ success: boolean; post?: BlogPost; error?: string }> => {
    try {
      const res = await apiClient.patch<any>(`/blog-admin/posts/${id}`, input);
      if (res && res.id) {
        return { success: true, post: res };
      }
      return { success: false, error: res?.error || 'Failed to update blog post' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update blog post' };
    }
  };

  const deleteBlogPost = async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await apiClient.delete<any>(`/blog-admin/posts/${id}`);
      if (res && (res.message || res.success)) {
        return { success: true, message: res.message || 'Blog post deleted' };
      }
      return { success: false, error: res?.error || 'Failed to delete blog post' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete blog post' };
    }
  };

  const uploadBlogCover = async (file: any, fileName?: string, mimeType?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const token = await storage.getToken();
      const uploadUrl = `${API_BASE_URL}/blog-admin/upload`;
      const formData = new FormData();

      if (Platform.OS === 'web') {
        if (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File)) {
          formData.append('file', file, fileName || (file as any).name || 'cover.jpg');
        } else if (typeof file === 'object' && file.uri) {
          formData.append('file', file);
        } else {
          formData.append('file', file);
        }

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok && (data.url || data.success)) {
          return { success: true, url: data.url };
        }
        return { success: false, error: data?.error || 'Failed to upload cover image' };
      } else {
        // Native (Android & iOS): Use XMLHttpRequest because Expo's fetch does not support React Native's local file URI in FormData
        const uri = typeof file === 'string' ? file : (file?.uri || file);
        const name = fileName || file?.name || `cover-${Date.now()}.jpg`;
        const type = mimeType || file?.type || 'image/jpeg';

        formData.append('file', {
          uri,
          name,
          type,
        } as any);

        return new Promise<{ success: boolean; url?: string; error?: string }>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl);
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && (data.url || data.success)) {
                resolve({ success: true, url: data.url });
              } else {
                resolve({ success: false, error: data?.error || `Upload failed with status ${xhr.status}` });
              }
            } catch (e: any) {
              resolve({ success: false, error: 'Failed to parse upload response from server' });
            }
          };
          xhr.onerror = () => {
            resolve({ success: false, error: 'Network request failed during image upload' });
          };
          xhr.ontimeout = () => {
            resolve({ success: false, error: 'Image upload timed out' });
          };
          xhr.send(formData);
        });
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to upload cover image' };
    }
  };

  const getSalesVolume = async (params?: { startDate?: string; endDate?: string; tenantId?: string }) => {
    try {
      const queryParts: string[] = [];
      if (params?.startDate) queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
      if (params?.endDate) queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
      if (params?.tenantId) queryParts.push(`tenantId=${encodeURIComponent(params.tenantId)}`);
      const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      const res = await apiClient.get<any>(`/super-admin/analytics/sales-volume${qs}`);
      if (res && res.success) {
        return {
          success: true,
          totalGmv: res.totalGmv || 0,
          platformSeries: res.platformSeries || [],
          orderCount: res.orderCount || 0,
        };
      }
      return { success: false, error: res?.error || 'Failed to fetch sales volume' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch sales volume' };
    }
  };

  const getPlanDistribution = async () => {
    try {
      const res = await apiClient.get<any>('/super-admin/analytics/plan-distribution');
      if (res && res.success) {
        return {
          success: true,
          total: res.total || 0,
          plans: res.plans || {},
          breakdown: res.breakdown || [],
        };
      }
      return { success: false, error: res?.error || 'Failed to fetch plan distribution' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch plan distribution' };
    }
  };

  const getActivityLog = async (params?: { page?: number; limit?: number }) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 25;
      const res = await apiClient.get<any>(`/super-admin/analytics/activity-log?page=${page}&limit=${limit}`);
      if (res && res.success) {
        return {
          success: true,
          logs: res.logs || [],
        };
      }
      return { success: false, error: res?.error || 'Failed to fetch activity log' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch activity log' };
    }
  };

  const getPlatformSettings = async () => {
    try {
      const res = await apiClient.get<any>('/super-admin/platform-settings');
      if (res && res.success && res.settings) {
        return {
          success: true,
          settings: res.settings,
        };
      }
      return { success: false, error: res?.error || 'Failed to fetch platform settings' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch platform settings' };
    }
  };

  const updatePlatformSettings = async (data: UpdatePlatformSettingsInput) => {
    try {
      const res = await apiClient.patch<any>('/super-admin/platform-settings', data);
      if (res && res.success) {
        return {
          success: true,
          settings: res.settings,
          message: res.message || 'Platform settings updated',
        };
      }
      return { success: false, error: res?.error || 'Failed to update platform settings' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update platform settings' };
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const value = useMemo(
    () => ({
      tenants,
      tenantsTotal,
      tenantsPage,
      tenantsLimit,
      invoices,
      invoicesTotal,
      invoicesPage,
      invoicesLimit,
      loading,
      error,
      fetchTenants,
      fetchInvoices,
      refreshAll,
      refreshTenants: refreshAll,
      createTenant,
      updateTenant,
      toggleTenantStatus,
      archiveTenant,
      getTenantBranches,
      addBranch,
      updateTenantAdmin,
      getBillingStatus,
      recordPayment,
      updateDueDate,
      getPaymentHistory,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      generatePaymentLink,
      downloadInvoicePdf,
      getBlogPosts,
      createBlogPost,
      updateBlogPost,
      deleteBlogPost,
      uploadBlogCover,
      getSalesVolume,
      getPlanDistribution,
      getActivityLog,
      getPlatformSettings,
      updatePlatformSettings,
    }),
    [
      tenants,
      tenantsTotal,
      tenantsPage,
      tenantsLimit,
      invoices,
      invoicesTotal,
      invoicesPage,
      invoicesLimit,
      loading,
      error,
    ]
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
