import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

export interface RosterStaff {
  id: string;
  name: string;
  role: string;
  shift: 'open' | 'closed' | 'upcoming';
  till: string;
  permissions: string;
  time: string;
}

export interface PricingRequest {
  id: string;
  productName: string;
  standardPrice: number;
  requestedPrice: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface StoreManagerContextProps {
  staff: RosterStaff[];
  pricingRequests: PricingRequest[];
  addStaff: (name: string, role: string, till: string, time: string, status: 'open' | 'closed' | 'upcoming', permissions: string) => void;
  addPricingRequest: (productName: string, standardPrice: number, requestedPrice: number) => void;
  editPricingRequest: (id: string, requestedPrice: number) => void;
  deletePricingRequest: (id: string) => void;
}

const StoreManagerContext = createContext<StoreManagerContextProps | null>(null);

const initialStaff: RosterStaff[] = [
  { id: 's1', name: 'Rahul S.', role: 'Cashier', shift: 'open', till: 'Till 01', permissions: 'Cashier', time: '08:00 - 16:00' },
  { id: 's2', name: 'Fatima A.', role: 'Cashier', shift: 'open', till: 'Till 02', permissions: 'Cashier', time: '08:00 - 16:00' },
  { id: 's3', name: 'Michael J.', role: 'Cashier', shift: 'open', till: 'Till 04', permissions: 'Cashier', time: '10:00 - 18:00' },
  { id: 's4', name: 'Ahmed Khalil', role: 'Cashier', shift: 'closed', till: '—', permissions: 'Cashier', time: 'Completed' },
  { id: 's5', name: 'Sara Mohammed', role: 'Supervisor', shift: 'open', till: 'Till 01', permissions: 'Supervisor', time: '08:00 - 16:00' },
  { id: 's6', name: 'Sarah K.', role: 'Cashier', shift: 'upcoming', till: '-', permissions: 'Cashier', time: '16:00 - 00:00' },
  { id: 's7', name: 'John D.', role: 'Cashier', shift: 'closed', till: 'Till 03', permissions: 'Cashier', time: '00:00 - 08:00' },
];

const initialPricingRequests: PricingRequest[] = [
  { id: 'pr-1', productName: 'Almarai Fresh Laban 1L', standardPrice: 5.50, requestedPrice: 4.50, status: 'Pending' },
  { id: 'pr-2', productName: 'Lipton Yellow Label 100s', standardPrice: 16.50, requestedPrice: 14.00, status: 'Approved' },
  { id: 'pr-3', productName: 'Nutella Hazelnut Spread 400g', standardPrice: 22.00, requestedPrice: 18.00, status: 'Rejected' },
];

export function StoreManagerProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<RosterStaff[]>(initialStaff);
  const [pricingRequests, setPricingRequests] = useState<PricingRequest[]>(initialPricingRequests);

  const addStaff = (name: string, role: string, till: string, time: string, status: 'open' | 'closed' | 'upcoming', permissions: string) => {
    const newStaff: RosterStaff = {
      id: `s-${Math.random().toString(36).slice(2, 6)}`,
      name,
      role,
      shift: status,
      till: till || '—',
      permissions,
      time,
    };
    setStaff((prev) => [newStaff, ...prev]);
  };

  const addPricingRequest = (productName: string, standardPrice: number, requestedPrice: number) => {
    const newRequest: PricingRequest = {
      id: `pr-${Math.random().toString(36).slice(2, 6)}`,
      productName,
      standardPrice,
      requestedPrice,
      status: 'Pending',
    };
    setPricingRequests((prev) => [newRequest, ...prev]);
  };

  const editPricingRequest = (id: string, requestedPrice: number) => {
    setPricingRequests((prev) =>
      prev.map((pr) => (pr.id === id ? { ...pr, requestedPrice } : pr))
    );
  };

  const deletePricingRequest = (id: string) => {
    setPricingRequests((prev) => prev.filter((pr) => pr.id !== id));
  };

  const contextValue = useMemo(
    () => ({
      staff,
      pricingRequests,
      addStaff,
      addPricingRequest,
      editPricingRequest,
      deletePricingRequest,
    }),
    [staff, pricingRequests]
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
