import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useAuth } from './auth';
import { apiClient } from './apiClient';

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  contact?: string;
  trn?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  branchId: string;
  vendorId: string;
  status: string;
  total: string;
  createdAt: string;
}

interface PurchasingOfficerContextProps {
  vendors: Vendor[];
  isVendorsLoading: boolean;
  vendorsError: string | null;
  fetchVendors: () => Promise<void>;

  purchaseOrders: PurchaseOrder[];
  isPurchaseOrdersLoading: boolean;
  purchaseOrdersError: string | null;
  fetchPurchaseOrders: () => Promise<void>;
  
  isUpdatingPO: boolean;
  updatePurchaseOrderStatus: (id: string, status: string) => Promise<void>;
}

const PurchasingOfficerContext = createContext<PurchasingOfficerContextProps | null>(null);

export function PurchasingOfficerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isPurchaseOrdersLoading, setIsPurchaseOrdersLoading] = useState(false);
  const [purchaseOrdersError, setPurchaseOrdersError] = useState<string | null>(null);

  const [isUpdatingPO, setIsUpdatingPO] = useState(false);

  const fetchVendors = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      setIsVendorsLoading(true);
      setVendorsError(null);
      const data = await apiClient.get<Vendor[]>(`/vendors?tenantId=${user.tenantId}`);
      setVendors(data);
    } catch (err: any) {
      setVendorsError(err.message || 'Failed to fetch vendors');
    } finally {
      setIsVendorsLoading(false);
    }
  }, [user?.tenantId]);

  const fetchPurchaseOrders = useCallback(async () => {
    if (!user?.tenantId || !user?.branchId) return;
    try {
      setIsPurchaseOrdersLoading(true);
      setPurchaseOrdersError(null);
      const data = await apiClient.get<PurchaseOrder[]>(`/vendors/purchase-orders?tenantId=${user.tenantId}&branchId=${user.branchId}`);
      setPurchaseOrders(data);
    } catch (err: any) {
      setPurchaseOrdersError(err.message || 'Failed to fetch purchase orders');
    } finally {
      setIsPurchaseOrdersLoading(false);
    }
  }, [user?.tenantId, user?.branchId]);

  const updatePurchaseOrderStatus = async (id: string, status: string) => {
    if (isUpdatingPO) return;
    try {
      setIsUpdatingPO(true);
      await apiClient.patch(`/vendors/purchase-orders/${id}`, { status });
      await fetchPurchaseOrders();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update PO status');
    } finally {
      setIsUpdatingPO(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchPurchaseOrders();
  }, [fetchVendors, fetchPurchaseOrders]);

  const value = useMemo(() => ({
    vendors,
    isVendorsLoading,
    vendorsError,
    fetchVendors,
    purchaseOrders,
    isPurchaseOrdersLoading,
    purchaseOrdersError,
    fetchPurchaseOrders,
    isUpdatingPO,
    updatePurchaseOrderStatus
  }), [
    vendors, isVendorsLoading, vendorsError, fetchVendors,
    purchaseOrders, isPurchaseOrdersLoading, purchaseOrdersError, fetchPurchaseOrders,
    isUpdatingPO
  ]);

  return (
    <PurchasingOfficerContext.Provider value={value}>
      {children}
    </PurchasingOfficerContext.Provider>
  );
}

export function usePurchasingOfficer() {
  const context = useContext(PurchasingOfficerContext);
  if (!context) {
    throw new Error('usePurchasingOfficer must be used within a PurchasingOfficerProvider');
  }
  return context;
}
