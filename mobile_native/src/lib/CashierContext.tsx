import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { transactions as mockTransactions, reports as mockReports } from './mockData';

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
  toggleOffline: () => void;
  addToCart: (product: { id: string; name: string; price: number }) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, delta: number) => void;
  clearCart: () => void;
  settleTransaction: (split: { cash: number; card: number; loyalty: number; credit: number }) => void;
  recordCashDrop: (amount: number) => void;
  adjustFloat: (amount: number) => void;
  closeShiftAndPrintZ: () => void;
}

const CashierContext = createContext<CashierContextType | null>(null);

export function CashierProvider({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState<'synced' | 'buffering'>('synced');
  const [bufferedCount, setBufferedCount] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [openingFloat, setOpeningFloat] = useState(500);
  const [cashSales, setCashSales] = useState(841);
  const [cardSales, setCardSales] = useState(1240);
  const [cashDrops, setCashDrops] = useState(0);
  
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions as Transaction[]);
  const [reports, setReports] = useState<Report[]>(mockReports as Report[]);

  const expectedDrawer = useMemo(() => {
    return openingFloat + cashSales - cashDrops;
  }, [openingFloat, cashSales, cashDrops]);

  const toggleOffline = () => {
    if (offline === 'buffering') {
      setOffline('synced');
      if (bufferedCount > 0) {
        // Sync buffered sales to transactions
        const syncedTxs: Transaction[] = [];
        let newCashSales = 0;
        let newCardSales = 0;
        for (let i = 0; i < bufferedCount; i++) {
          const receiptNum = `RCP-${Math.floor(50000 + Math.random() * 10000)}`;
          syncedTxs.push({
            id: Math.random().toString(),
            receipt: receiptNum,
            time: 'Synced',
            total: 64.50,
            method: 'Split',
            items: 3,
          });
          newCashSales += 30;
          newCardSales += 34.50;
        }
        setTransactions((t) => [...syncedTxs, ...t]);
        setCashSales((prev) => prev + newCashSales);
        setCardSales((prev) => prev + newCardSales);
        setBufferedCount(0);
      }
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

  const settleTransaction = (split: { cash: number; card: number; loyalty: number; credit: number }) => {
    const totalAmount = cart.reduce((a, i) => a + i.price * i.qty, 0) * 1.05;
    const totalItems = cart.reduce((a, i) => a + i.qty, 0);
    const receiptNum = `RCP-${Math.floor(50000 + Math.random() * 10000)}`;
    
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx: Transaction = {
      id: Math.random().toString(),
      receipt: receiptNum,
      time: timeStr,
      total: totalAmount,
      method: split.cash > 0 && split.card > 0 ? 'Split' : split.cash > 0 ? 'Cash' : split.card > 0 ? 'Card' : 'Other',
      items: totalItems,
    };

    if (offline === 'buffering') {
      setBufferedCount((b) => b + 1);
    } else {
      setTransactions((t) => [newTx, ...t]);
      setCashSales((prev) => prev + split.cash);
      setCardSales((prev) => prev + split.card);
    }

    setCart([]);
  };

  const recordCashDrop = (amount: number) => {
    setCashDrops((prev) => prev + amount);
  };

  const adjustFloat = (amount: number) => {
    setOpeningFloat(amount);
  };

  const closeShiftAndPrintZ = () => {
    const shiftTotal = cashSales + cardSales;
    const reportNum = `Z-${Math.floor(2400 + Math.random() * 100)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newReport: Report = {
      id: Math.random().toString(),
      number: reportNum,
      date: dateStr,
      sales: shiftTotal,
      cash: cashSales,
      card: cardSales,
      other: 0,
      type: 'Z',
    };

    setReports((r) => [newReport, ...r]);
    setCashSales(0);
    setCardSales(0);
    setCashDrops(0);
  };

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
    toggleOffline,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    settleTransaction,
    recordCashDrop,
    adjustFloat,
    closeShiftAndPrintZ,
  }), [offline, bufferedCount, cart, openingFloat, cashSales, cardSales, cashDrops, expectedDrawer, transactions, reports]);

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
}

export function useCashier() {
  const ctx = useContext(CashierContext);
  if (!ctx) throw new Error('useCashier must be used within CashierProvider');
  return ctx;
}
