import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { vendorOrders as mockOrders, vendorInvoices as mockInvoices } from './mockData';

export interface VendorOrder {
  id: string;
  number: string;
  from: string;
  date: string;
  total: number;
  status: string;
}

export interface VendorInvoice {
  id: string;
  number: string;
  to: string;
  date: string;
  total: number;
  status: string;
}

interface VendorContextType {
  orders: VendorOrder[];
  invoices: VendorInvoice[];
  acknowledgeOrder: (id: string) => void;
  declineOrder: (id: string) => void;
  submitInvoice: (invoiceNo: string, poRef: string, amount: number) => void;
}

const VendorContext = createContext<VendorContextType | null>(null);

export function VendorProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<VendorOrder[]>(mockOrders);
  const [invoices, setInvoices] = useState<VendorInvoice[]>(mockInvoices);

  const acknowledgeOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'acknowledged' } : o))
    );
  };

  const declineOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'declined' } : o))
    );
  };

  const submitInvoice = (invoiceNo: string, poRef: string, amount: number) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newInvoice: VendorInvoice = {
      id: Math.random().toString(),
      number: invoiceNo,
      to: 'FreshMart Supermarkets',
      date: dateStr,
      total: amount,
      status: 'pending',
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const value = useMemo(() => ({
    orders,
    invoices,
    acknowledgeOrder,
    declineOrder,
    submitInvoice,
  }), [orders, invoices]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendor must be used within VendorProvider');
  return ctx;
}
