import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { apiClient } from './apiClient';

export interface PricingRequest {
  id: string;
  productId: string;
  productName: string;
  standardPrice: number;
  requestedPrice: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface StoreManagerContextProps {
  loading: boolean;
  branch: any;
  stock: any[];
  shifts: any[]; // Shift list (shifts table)
  staff: any[]; // Staff users list (staff_users table)
  orders: any[];
  pricingRequests: PricingRequest[];
  tills: any[];
  adjustHistory: any[];
  fetchData: () => Promise<void>;
  addStaff: (cashierId: string, tillId: string, shiftDate: string, startTime: string, endTime: string, notes?: string) => Promise<void>;
  deleteRosterShift: (shiftId: string) => Promise<void>;
  addPricingRequest: (productId: string, requestedPrice: number, reason: string) => Promise<void>;
  editPricingRequest: (id: string, requestedPrice: number) => Promise<void>;
  deletePricingRequest: (id: string) => Promise<void>;
  createTill: (name: string, description: string, openingFloat: number) => Promise<void>;
  resetCashierPin: (cashierId: string, newPin: string, confirmPin: string) => Promise<void>;
  recordCashDrop: (shiftId: string, amount: number, note: string) => Promise<void>;
  closeShift: (shiftId: string, actualCash: number) => Promise<any>;
  adjustStock: (productId: string, quantityChange: number, reason: string, note?: string) => Promise<void>;
  fetchStockPaginated: (page?: number, limit?: number, search?: string, category?: string) => Promise<{ stock: any[]; total: number; page: number; limit: number; categories: string[]; lowStockCount: number }>;
  // Branch Reports & Submissions (Branch Manager)
  getMyBranchReport: (startDate?: string, endDate?: string) => Promise<any>;
  submitBranchReport: (data: { startDate: string; endDate: string; notes?: string }) => Promise<any>;
  getMyBranchSubmissions: () => Promise<any>;
  updateBranchSubmission: (id: string, data: { notes?: string; startDate?: string; endDate?: string }) => Promise<any>;
  deleteBranchSubmission: (id: string) => Promise<any>;
}

const StoreManagerContext = createContext<StoreManagerContextProps | null>(null);

export function StoreManagerProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pricingRequests, setPricingRequests] = useState<PricingRequest[]>([]);
  const [tills, setTills] = useState<any[]>([]);
  const [adjustHistory, setAdjustHistory] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/store-manager/data') as any;
      if (res) {
        setBranch(res.branch || null);
        setStock(res.stock || []);
        setShifts(res.shifts || []);
        setStaff(res.staff || []);
        setOrders(res.orders || []);
        setTills(res.tills || []);
        
        if (res.requests) {
          const formattedRequests: PricingRequest[] = res.requests.map((r: any) => ({
            id: r.id,
            productId: r.productId,
            productName: r.productName,
            standardPrice: parseFloat(r.standardPrice || 0),
            requestedPrice: parseFloat(r.requestedPrice || 0),
            status: r.status,
          }));
          setPricingRequests(formattedRequests);
        } else {
          setPricingRequests([]);
        }
      }
      
      // Load stock adjustment history
      const history = await apiClient.get('/store-manager/stock/adjust/history') as any;
      setAdjustHistory(history || []);
    } catch (error) {
      console.warn('fetchData (StoreManager): Endpoint offline or returned error');
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async (
    cashierId: string,
    tillId: string,
    shiftDate: string,
    startTime: string,
    endTime: string,
    notes?: string
  ) => {
    await apiClient.post('/store-manager/roster-shifts', {
      cashierId,
      tillId,
      shiftDate,
      startTime,
      endTime,
      notes,
    });
    await fetchData();
  };

  const deleteRosterShift = async (shiftId: string) => {
    await apiClient.delete(`/store-manager/roster-shifts/${shiftId}`);
    await fetchData();
  };

  const addPricingRequest = async (productId: string, requestedPrice: number, reason: string) => {
    await apiClient.post('/store-manager/override-request', {
      productId,
      requestedPrice,
      reason,
    });
    await fetchData();
  };

  const editPricingRequest = async (id: string, requestedPrice: number) => {
    await apiClient.put(`/store-manager/override-request/${id}`, {
      requestedPrice,
    });
    await fetchData();
  };

  const deletePricingRequest = async (id: string) => {
    await apiClient.delete(`/store-manager/override-request/${id}`);
    await fetchData();
  };

  const createTill = async (name: string, description: string, openingFloat: number) => {
    await apiClient.post('/store-manager/tills', {
      name,
      description,
      openingFloat,
    });
    await fetchData();
  };

  const resetCashierPin = async (cashierId: string, newPin: string, confirmPin: string) => {
    await apiClient.post(`/store-manager/staff/${cashierId}/reset-pin`, {
      newPin,
      confirmPin,
    });
  };

  const recordCashDrop = async (shiftId: string, amount: number, note: string) => {
    await apiClient.post(`/store-manager/shifts/${shiftId}/cash-drop`, {
      amount,
      note,
    });
    await fetchData();
  };

  const closeShift = async (shiftId: string, actualCash: number) => {
    const res = await apiClient.post(`/store-manager/shifts/${shiftId}/close`, {
      actualCash,
    });
    await fetchData();
    return res;
  };

  const adjustStock = async (productId: string, quantityChange: number, reason: string, note?: string) => {
    await apiClient.post('/store-manager/stock/adjust', {
      productId,
      quantityChange,
      reason,
      note,
    });
    await fetchData();
  };

  const fetchStockPaginated = async (page = 1, limit = 50, search = '', category = 'All') => {
    try {
      const params: string[] = [`page=${page}`, `limit=${limit}`];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (category && category !== 'All') params.push(`category=${encodeURIComponent(category)}`);

      const res = await apiClient.get<any>(`/store-manager/stock?${params.join('&')}`);
      return res || { stock: [], total: 0, page, limit, categories: ['All'], lowStockCount: 0 };
    } catch (err) {
      console.warn('fetchStockPaginated error:', err);
      return { stock: [], total: 0, page, limit, categories: ['All'], lowStockCount: 0 };
    }
  };

  const getMyBranchReport = async (startDate?: string, endDate?: string) => {
    let url = '/branch-reports/my-branch-report';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return await apiClient.get<any>(url);
  };

  const submitBranchReport = async (data: { startDate: string; endDate: string; notes?: string }) => {
    return await apiClient.post<any>('/branch-reports/submit', data);
  };

  const getMyBranchSubmissions = async () => {
    return await apiClient.get<any>('/branch-reports/mine');
  };

  const updateBranchSubmission = async (id: string, data: { notes?: string; startDate?: string; endDate?: string }) => {
    return await apiClient.patch<any>(`/branch-reports/${id}`, data);
  };

  const deleteBranchSubmission = async (id: string) => {
    return await apiClient.delete<any>(`/branch-reports/${id}`);
  };

  const contextValue = useMemo(
    () => ({
      loading,
      branch,
      stock,
      shifts,
      staff,
      orders,
      pricingRequests,
      tills,
      adjustHistory,
      fetchData,
      addStaff,
      deleteRosterShift,
      addPricingRequest,
      editPricingRequest,
      deletePricingRequest,
      createTill,
      resetCashierPin,
      recordCashDrop,
      closeShift,
      adjustStock,
      fetchStockPaginated,
      getMyBranchReport,
      submitBranchReport,
      getMyBranchSubmissions,
      updateBranchSubmission,
      deleteBranchSubmission,
    }),
    [loading, branch, stock, shifts, staff, orders, pricingRequests, tills, adjustHistory]
  );

  return <StoreManagerContext.Provider value={contextValue}>{children}</StoreManagerContext.Provider>;
}

export function useStoreManager() {
  const context = useContext(StoreManagerContext);
  if (!context) {
    throw new Error('useStoreManager must be used within a StoreManagerProvider');
  }
  return context;
}
