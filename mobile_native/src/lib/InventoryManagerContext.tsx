import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { apiClient } from './apiClient';

export interface InventoryProduct {
  id: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorder: number;
  branch: string;
  branchId: string;
  unit: string;
  costPrice?: string;
}

export interface StockTransfer {
  id: string;
  transferId: string;
  item: string;
  qty: number;
  from: string;
  to: string;
  date: string;
  status: string;
}

export interface FEFOBatch {
  id: string;
  productId: string;
  batchNumber: string;
  product: string;
  qty: number;
  expiry: string;
  status: 'urgent' | 'near' | 'fresh';
  branchId?: string;
  branchName?: string;
}

export interface LedgerRecord {
  id: string;
  transactionType: string;
  previousQuantity: number;
  changedQuantity: number;
  newQuantity: number;
  createdAt: string;
  productName: string;
  branchName: string;
  batchNumber?: string;
}

export interface BranchInfo {
  id: string;
  name: string;
  tenantId: string;
}

export interface VendorInfo {
  id: string;
  name: string;
}

export interface OutOfStockExportRow {
  SKU: string;
  Product: string;
  Barcode: string;
  Unit: string;
  Category: string;
  Cost: number;
  Retail: number;
  Stock: number;
}

export interface BulkUpdateResult {
  success: boolean;
  totalProcessed: number;
  totalUpdated: number;
  totalSkipped: number;
  skippedDetails: Array<{ sku: string; reason: string }>;
  error?: string;
}

interface InventoryManagerContextProps {
  products: InventoryProduct[];
  transfers: StockTransfer[];
  batches: FEFOBatch[];
  ledger: LedgerRecord[];
  branches: BranchInfo[];
  allTenantBranches: BranchInfo[];
  vendors: VendorInfo[];
  loading: boolean;
  fetchData: () => Promise<void>;
  addTransfer: (productId: string, sourceBranchId: string, targetBranchId: string, quantity: number) => Promise<void>;
  updateClearancePrice: (productId: string, discountPct: number) => Promise<void>;
  raisePoDraft: (vendorId: string, branchId: string, productId: string, qty: number) => Promise<void>;
  adjustStock: (productId: string, branchId: string, batchId: string | null, quantityChange: number, reason: string) => Promise<void>;
  editTransfer: (id: string, quantity: number) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
  exportOutOfStock: (branchId?: string, outOfStockOnly?: boolean) => Promise<{ success: boolean; rows: OutOfStockExportRow[]; count: number; filename: string }>;
  bulkUpdateStock: (branchId: string, rows: Array<{ sku?: string; barcode?: string; stock: number }>) => Promise<BulkUpdateResult>;
}

const InventoryManagerContext = createContext<InventoryManagerContextProps | null>(null);

export function InventoryManagerProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [batches, setBatches] = useState<FEFOBatch[]>([]);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [allTenantBranches, setAllTenantBranches] = useState<BranchInfo[]>([]);
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch main dashboard data
      const dataRes = await apiClient.get('/inventory/data') as any;
      
      const mappedProducts = (dataRes.stockLevels || []).map((s: any) => ({
        id: s.id,
        productId: s.productId,
        name: s.productName,
        sku: s.sku || s.barcode || '',
        category: s.category || 'General',
        stock: s.stock,
        reorder: s.reorderLevel,
        branch: s.branchName,
        branchId: s.branchId,
        unit: s.unit || 'pcs',
        costPrice: s.costPrice,
      }));

      const mappedBatches = (dataRes.batches || []).map((b: any) => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        const expDate = b.expiryDate ? new Date(b.expiryDate) : null;
        let status: 'urgent' | 'near' | 'fresh' = 'fresh';
        if (expDate) {
          if (expDate <= now) status = 'urgent';
          else if (expDate <= thirtyDaysFromNow) status = 'near';
        }
        return {
          id: b.id,
          productId: b.productId,
          batchNumber: b.batchNumber,
          product: b.productName,
          qty: b.stock,
          expiry: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A',
          status,
          branchId: b.branchId,
          branchName: b.branchName,
        };
      });

      const mappedTransfers = (dataRes.transfers || []).map((t: any) => ({
        id: t.id.slice(0, 8).toUpperCase(),
        transferId: t.id,
        item: t.productName,
        qty: t.quantity,
        from: t.sourceBranchName,
        to: t.destinationBranchName,
        date: new Date(t.createdAt).toLocaleDateString(),
        status: t.status,
      }));

      setProducts(mappedProducts);
      setBatches(mappedBatches);
      setTransfers(mappedTransfers);
      setBranches(dataRes.branches || []);
      setAllTenantBranches(dataRes.allTenantBranches || []);
      setVendors(dataRes.vendors || []);

      // 2. Fetch ledger history
      const ledgerRes = await apiClient.get('/inventory/ledger') as any;
      setLedger(ledgerRes.ledger || []);
    } catch (e) {
      console.warn('fetchData (InventoryManager): Endpoint offline or returned error', e);
    } finally {
      setLoading(false);
    }
  };

  const addTransfer = async (productId: string, sourceBranchId: string, targetBranchId: string, quantity: number) => {
    await apiClient.post('/inventory/transfer', {
      productId,
      sourceBranchId,
      targetBranchId,
      quantity,
    });
    await fetchData();
  };

  const updateClearancePrice = async (productId: string, discountPct: number) => {
    await apiClient.post('/inventory/clearance', {
      productId,
      discountPct,
    });
    await fetchData();
  };

  const raisePoDraft = async (vendorId: string, branchId: string, productId: string, qty: number) => {
    await apiClient.post('/inventory/draft-po', {
      vendorId,
      branchId,
      productId,
      qty,
    });
    await fetchData();
  };

  const adjustStock = async (productId: string, branchId: string, batchId: string | null, quantityChange: number, reason: string) => {
    await apiClient.post('/inventory/adjust', {
      productId,
      branchId,
      batchId,
      quantityChange,
      reason,
    });
    await fetchData();
  };

  const editTransfer = async (id: string, quantity: number) => {
    await apiClient.patch(`/inventory/transfer/${id}`, { quantity });
    await fetchData();
  };

  const deleteTransfer = async (id: string) => {
    await apiClient.delete(`/inventory/transfer/${id}`);
    await fetchData();
  };

  const exportOutOfStock = async (branchId?: string, outOfStockOnly = true) => {
    const params = new URLSearchParams();
    if (branchId && branchId !== 'All' && branchId !== 'all') {
      params.append('branchId', branchId);
    }
    params.append('outOfStockOnly', String(outOfStockOnly));
    const res = (await apiClient.get(`/inventory/export-out-of-stock?${params.toString()}`)) as any;
    return res;
  };

  const bulkUpdateStock = async (
    branchId: string,
    rows: Array<{ sku?: string; barcode?: string; stock: number }>
  ) => {
    const res = (await apiClient.post('/inventory/bulk-update-stock', {
      branchId,
      rows,
    })) as BulkUpdateResult;
    await fetchData();
    return res;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const contextValue = useMemo(
    () => ({
      products,
      transfers,
      batches,
      ledger,
      branches,
      allTenantBranches,
      vendors,
      loading,
      fetchData,
      addTransfer,
      updateClearancePrice,
      raisePoDraft,
      adjustStock,
      editTransfer,
      deleteTransfer,
      exportOutOfStock,
      bulkUpdateStock,
    }),
    [products, transfers, batches, ledger, branches, allTenantBranches, vendors, loading]
  );

  return <InventoryManagerContext.Provider value={contextValue}>{children}</InventoryManagerContext.Provider>;
}

export function useInventoryManager() {
  const context = useContext(InventoryManagerContext);
  if (!context) {
    throw new Error('useInventoryManager must be used within an InventoryManagerProvider');
  }
  return context;
}
