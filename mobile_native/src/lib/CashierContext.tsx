import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { apiClient } from './apiClient';
import { useAuth } from './auth';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Transaction {
  id: string;
  receipt: string;
  time: string;
  total: number;
  method: string;
  items: number;
}

export interface Report {
  id: string;
  number: string;
  date: string;
  sales: number;
  cash: number;
  card: number;
  other: number;
  type: 'X' | 'Z';
}

interface CashierContextType {
  offline: 'synced' | 'buffering';
  bufferedCount: number;
  cart: CartItem[];
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  cashDrops: number;
  expectedDrawer: number;
  transactions: Transaction[];
  reports: Report[];
  activeShift: any | null;
  tills: any[];
  catalog: any[];
  promotions: any[];
  toggleOffline: () => void;
  addToCart: (product: { id: string; name: string; price: number }) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, delta: number) => void;
  clearCart: () => void;
  settleTransaction: (split: { cash: number; card: number; loyalty: number; credit: number }, customerId?: string) => Promise<void>;
  recordCashDrop: (amount: number, reason: string) => Promise<void>;
  adjustFloat: (amount: number) => Promise<void>;
  closeShiftAndPrintZ: (actualCash: number) => Promise<void>;
  openShift: (openingFloat: number, tillId: string) => Promise<void>;
  fetchActiveShift: () => Promise<void>;
  fetchCatalog: () => Promise<void>;
  fetchTills: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
}

const CashierContext = createContext<CashierContextType | null>(null);

export function CashierProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [offline, setOffline] = useState<'synced' | 'buffering'>('synced');
  const [bufferedCount, setBufferedCount] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [tills, setTills] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const openingFloat = activeShift ? Number(activeShift.openingFloat) : 0;
  const cashSales = activeShift ? Number(activeShift.stats?.cashTotal || 0) : 0;
  const cardSales = activeShift ? Number(activeShift.stats?.cardTotal || 0) : 0;
  
  // Calculate cash drops
  const cashDrops = useMemo(() => {
    if (!activeShift?.cashDrops) return 0;
    try {
      const drops = JSON.parse(activeShift.cashDrops);
      return drops.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    } catch {
      return 0;
    }
  }, [activeShift?.cashDrops]);

  const expectedDrawer = useMemo(() => {
    return openingFloat + cashSales - cashDrops;
  }, [openingFloat, cashSales, cashDrops]);

  const fetchActiveShift = async () => {
    try {
      const data = await apiClient.get('/pos/shift/active') as any;
      setActiveShift(data.shift);
    } catch (err) {
      console.error('Failed to fetch active shift:', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const data = await apiClient.get('/pos/catalog') as any;
      setCatalog(data.catalog || []);
      setPromotions(data.promotions || []);
    } catch (err) {
      console.error('Failed to fetch POS catalog:', err);
    }
  };

  const fetchTills = async () => {
    try {
      const data = await apiClient.get('/pos/tills') as any;
      setTills(data.tills || []);
    } catch (err) {
      console.error('Failed to fetch tills:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const ordersData = await apiClient.get(`/orders?tenantId=${user.tenantId}&branchId=${user.branchId}&limit=30`) as any[];
      const mapped: Transaction[] = ordersData.map((o) => {
        const timeStr = new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          id: o.id,
          receipt: o.invoiceNumber || o.id.split('-')[0].toUpperCase(),
          time: timeStr,
          total: parseFloat(o.total),
          method: o.paymentMethod || 'Split',
          items: o.items?.length || 0,
        };
      });
      setTransactions(mapped);
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
    }
  };

  const openShift = async (floatVal: number, tillId: string) => {
    await apiClient.post('/pos/shift/open', { openingFloat: floatVal, tillId });
    await fetchActiveShift();
    await fetchTills();
  };

  const closeShiftAndPrintZ = async (actualCash: number) => {
    if (!activeShift) return;
    const res = await apiClient.post('/pos/shift/close', { shiftId: activeShift.id, actualCash }) as any;
    
    // Add to reports list in memory
    const reportNum = `Z-${Math.floor(2400 + Math.random() * 100)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newReport: Report = {
      id: Math.random().toString(),
      number: reportNum,
      date: dateStr,
      sales: cashSales + cardSales,
      cash: cashSales,
      card: cardSales,
      other: 0,
      type: 'Z',
    };

    setReports((r) => [newReport, ...r]);
    await fetchActiveShift();
  };

  const recordCashDrop = async (amount: number, reason: string) => {
    if (!activeShift) return;
    await apiClient.post('/pos/shift/drop', { shiftId: activeShift.id, amount, reason });
    await fetchActiveShift();
  };

  const adjustFloat = async (amount: number) => {
    if (!activeShift) return;
    await apiClient.post('/pos/shift/float', { shiftId: activeShift.id, amount });
    await fetchActiveShift();
  };

  const toggleOffline = () => {
    if (offline === 'buffering') {
      setOffline('synced');
      setBufferedCount(0);
    } else {
      setOffline('buffering');
    }
  };

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((item) => {
        if (item.id === id) {
          const nextQty = item.qty + delta;
          return nextQty <= 0 ? [] : [{ ...item, qty: nextQty }];
        }
        return [item];
      })
    );
  };

  const clearCart = () => setCart([]);

  const settleTransaction = async (split: { cash: number; card: number; loyalty: number; credit: number }, customerId?: string) => {
    const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
    const vat = subtotal * 0.05;
    const total = subtotal + vat;

    const payments = [];
    if (split.cash > 0) payments.push({ method: 'Cash', amount: split.cash });
    if (split.card > 0) payments.push({ method: 'Card', amount: split.card });
    if (split.loyalty > 0) payments.push({ method: 'Loyalty Points', amount: split.loyalty });
    if (split.credit > 0) payments.push({ method: 'Store Credit', amount: split.credit });

    const items = cart.map(i => ({ productId: i.id, qty: i.qty, unitPrice: i.price }));

    await apiClient.post('/pos/checkout', {
      subtotal,
      vat,
      total,
      payments,
      items,
      cashReceived: split.cash,
      changeGiven: Math.max(0, split.cash - (total - (split.card + split.loyalty + split.credit))),
      customerId: customerId || undefined
    });

    setCart([]);
    await fetchActiveShift();
    await fetchTransactions();
  };

  useEffect(() => {
    if (user?.role === 'cashier') {
      fetchActiveShift();
      fetchCatalog();
      fetchTills();
      fetchTransactions();
    }
  }, [user]);

  const value = useMemo(() => ({
    offline,
    bufferedCount,
    cart,
    openingFloat,
    cashSales,
    cardSales,
    cashDrops,
    expectedDrawer,
    transactions,
    reports,
    activeShift,
    tills,
    catalog,
    promotions,
    toggleOffline,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    settleTransaction,
    recordCashDrop,
    adjustFloat,
    closeShiftAndPrintZ,
    openShift,
    fetchActiveShift,
    fetchCatalog,
    fetchTills,
    fetchTransactions,
  }), [
    offline,
    bufferedCount,
    cart,
    openingFloat,
    cashSales,
    cardSales,
    cashDrops,
    expectedDrawer,
    transactions,
    reports,
    activeShift,
    tills,
    catalog,
    promotions
  ]);

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
}

export function useCashier() {
  const ctx = useContext(CashierContext);
  if (!ctx) throw new Error('useCashier must be used within CashierProvider');
  return ctx;
}
