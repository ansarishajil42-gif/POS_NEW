import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorder: number;
  branch: string;
  unit: string;
}

export interface StockTransfer {
  id: string;
  item: string;
  qty: number;
  from: string;
  to: string;
  date: string;
  status: 'In Transit' | 'Received' | 'Pending';
}

export interface FEFOBatch {
  id: string;
  product: string;
  qty: number;
  expiry: string;
  status: 'urgent' | 'near' | 'fresh';
  clearancePrice?: number;
}

interface InventoryManagerContextProps {
  products: InventoryProduct[];
  transfers: StockTransfer[];
  batches: FEFOBatch[];
  startStockCount: () => void;
  addTransfer: (item: string, qty: number, from: string, to: string) => void;
  updateClearancePrice: (batchId: string, price: number) => void;
  raisePoDraft: (productName: string) => void;
}

const InventoryManagerContext = createContext<InventoryManagerContextProps | null>(null);

const initialProducts: InventoryProduct[] = [
  { id: '1', name: 'Almarai Fresh Milk Full Fat 2L', sku: '100244', category: 'Dairy', stock: 12, reorder: 50, branch: 'Al Barsha', unit: 'pcs' },
  { id: '2', name: 'Oman Chips 50g x 24', sku: '100246', category: 'Dry Goods', stock: 140, reorder: 50, branch: 'Al Barsha', unit: 'pcs' },
  { id: '3', name: 'Lipton Yellow Label 100s', sku: '100248', category: 'Beverages', stock: 8, reorder: 10, branch: 'Deira', unit: 'pcs' },
  { id: '4', name: 'Almarai Fresh Laban 1L', sku: '100250', category: 'Dairy', stock: 450, reorder: 100, branch: 'Al Barsha', unit: 'pcs' },
  { id: '5', name: 'Nutella Hazelnut Spread 400g', sku: '100252', category: 'Pantry', stock: 110, reorder: 50, branch: 'Corniche', unit: 'pcs' },
  { id: '6', name: 'Local Bananas Class A (Kg)', sku: '100254', category: 'Produce', stock: 50, reorder: 60, branch: 'Al Barsha', unit: 'kg' },
];

const initialTransfers: StockTransfer[] = [
  { id: 'TRN-8802', item: 'Almarai Fresh Milk Full Fat 2L', qty: 240, from: 'Central Warehouse', to: 'Al Barsha', date: '2026-08-18', status: 'In Transit' },
  { id: 'TRN-8801', item: 'Oman Chips 50g x 24', qty: 2, from: 'Deira', to: 'Corniche', date: '2026-08-17', status: 'Received' },
];

const initialBatches: FEFOBatch[] = [
  { id: 'BAT-9041', product: 'Almarai Fresh Milk Full Fat 2L', qty: 45, expiry: '2026-08-25', status: 'urgent' },
  { id: 'BAT-9042', product: 'Almarai Fresh Laban 1L', qty: 90, expiry: '2026-09-02', status: 'near' },
  { id: 'BAT-9043', product: 'Oman Chips 50g x 24', qty: 320, expiry: '2026-12-15', status: 'fresh' },
];

export function InventoryManagerProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
  const [transfers, setTransfers] = useState<StockTransfer[]>(initialTransfers);
  const [batches, setBatches] = useState<FEFOBatch[]>(initialBatches);

  const startStockCount = () => {
    // Simply return success log triggers
  };

  const addTransfer = (item: string, qty: number, from: string, to: string) => {
    const newTrn: StockTransfer = {
      id: `TRN-${Math.floor(8000 + Math.random() * 2000)}`,
      item,
      qty,
      from,
      to,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setTransfers((prev) => [newTrn, ...prev]);
  };

  const updateClearancePrice = (batchId: string, price: number) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, clearancePrice: price } : b))
    );
  };

  const raisePoDraft = (productName: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.name === productName ? { ...p, stock: p.stock + 50 } : p))
    );
  };

  const contextValue = useMemo(
    () => ({
      products,
      transfers,
      batches,
      startStockCount,
      addTransfer,
      updateClearancePrice,
      raisePoDraft,
    }),
    [products, transfers, batches]
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
