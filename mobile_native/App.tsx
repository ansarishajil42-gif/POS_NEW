import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/lib/auth';
import { PhoneFrame, BottomNav } from './src/components/Shell';
import { LoginScreen } from './src/components/LoginScreen';
import { LandingPage } from './src/components/LandingPage';
import { ChevronLeft } from 'lucide-react-native';
import { SuperAdminProvider } from './src/lib/SuperAdminContext';
import { HeadOfficeProvider } from './src/lib/HeadOfficeContext';
import { StoreManagerProvider } from './src/lib/StoreManagerContext';
import { InventoryManagerProvider } from './src/lib/InventoryManagerContext';
import { CashierProvider } from './src/lib/CashierContext';
import { VendorProvider } from './src/lib/VendorContext';

// Role dashboard screens
import {
  SuperAdminHome,
  SuperAdminTenants,
  TenantDetail,
  SuperAdminAnalytics,
  SuperAdminSettings,
} from './src/components/roles/SuperAdmin';
import {
  HeadOfficeHome,
  HeadOfficeOutlets,
  OutletDetail,
  HeadOfficeCatalog,
  ProductDetail,
  HeadOfficePurchasing,
  HeadOfficeMore,
  RbacScreen,
  VatScreen,
  CrmScreen,
  CustomerDetail,
  PromotionsScreen,
} from './src/components/roles/HeadOffice';
import { AggregatorScreen } from './src/components/roles/Aggregator';
import {
  StoreManagerHome,
  StoreManagerStaff,
  StoreManagerStock,
  StoreManagerPricing,
  StoreManagerReports,
} from './src/components/roles/StoreManager';
import {
  InventoryHome,
  InventoryBatches,
  InventoryTransfers,
  InventoryAlerts,
} from './src/components/roles/InventoryManager';
import {
  PurchasingHome,
  PurchasingPOs,
  NewPOScreen,
  PurchasingGRNs,
  PurchasingVendors,
} from './src/components/roles/PurchasingOfficer';
import { CashierTill, CashierShift, CashierHistory } from './src/components/roles/Cashier';
import { VendorHome, VendorOrders, VendorInvoices } from './src/components/roles/Vendor';

interface Tab { key: string; label: string; icon: string; }

const roleTabs: Record<string, Tab[]> = {
  'super-admin': [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'tenants', label: 'Tenants', icon: 'building' },
    { key: 'analytics', label: 'Analytics', icon: 'chart' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ],
  'head-office': [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'outlets', label: 'Outlets', icon: 'store' },
    { key: 'catalog', label: 'Catalog', icon: 'box' },
    { key: 'purchasing', label: 'Purchasing', icon: 'cart' },
    { key: 'more', label: 'More', icon: 'menu' },
  ],
  'store-manager': [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'staff', label: 'Staff', icon: 'users' },
    { key: 'stock', label: 'Stock', icon: 'box' },
    { key: 'pricing', label: 'Pricing', icon: 'settings' },
    { key: 'reports', label: 'Reports', icon: 'report' },
  ],
  'inventory-manager': [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'batches', label: 'Batches', icon: 'layers' },
    { key: 'transfers', label: 'Transfers', icon: 'truck' },
    { key: 'alerts', label: 'Alerts', icon: 'bell' },
  ],
  'purchasing-officer': [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'pos', label: 'POs', icon: 'clipboard' },
    { key: 'grns', label: 'GRNs', icon: 'check' },
    { key: 'vendors', label: 'Vendors', icon: 'truck' },
  ],
  cashier: [
    { key: 'till', label: 'Till', icon: 'cart' },
    { key: 'shift', label: 'Shift', icon: 'wallet' },
    { key: 'history', label: 'History', icon: 'receipt' },
  ],
  vendor: [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'orders', label: 'Orders', icon: 'clipboard' },
    { key: 'invoices', label: 'Invoices', icon: 'receipt' },
  ],
};

function RoleRouter({ role }: { role: string }) {
  const tabs = roleTabs[role];
  const [active, setActive] = useState(tabs[0].key);
  const [stack, setStack] = useState<{ screen: string; param?: string }[]>([]);

  const push = (screen: string, param?: string) => setStack((s) => [...s, { screen, param }]);
  const back = () => setStack((s) => s.slice(0, -1));
  const reset = () => setStack([]);

  const renderTab = () => {
    if (role === 'super-admin') {
      switch (active) {
        case 'home': return <SuperAdminHome />;
        case 'tenants': return <SuperAdminTenants onOpen={(id) => push('tenant', id)} />;
        case 'analytics': return <SuperAdminAnalytics />;
        case 'settings': return <SuperAdminSettings />;
      }
    }
    if (role === 'head-office') {
      switch (active) {
        case 'home': return <HeadOfficeHome />;
        case 'outlets': return <HeadOfficeOutlets onOpen={(id) => push('outlet', id)} />;
        case 'catalog': return <HeadOfficeCatalog onOpenProduct={(id) => push('product', id)} />;
        case 'purchasing': return <HeadOfficePurchasing />;
        case 'more': return <HeadOfficeMore onOpen={(key) => push(key)} />;
      }
    }
    if (role === 'store-manager') {
      switch (active) {
        case 'home': return <StoreManagerHome />;
        case 'staff': return <StoreManagerStaff />;
        case 'stock': return <StoreManagerStock />;
        case 'pricing': return <StoreManagerPricing />;
        case 'reports': return <StoreManagerReports />;
      }
    }
    if (role === 'inventory-manager') {
      switch (active) {
        case 'home': return <InventoryHome />;
        case 'batches': return <InventoryBatches />;
        case 'transfers': return <InventoryTransfers />;
        case 'alerts': return <InventoryAlerts />;
      }
    }
    if (role === 'purchasing-officer') {
      switch (active) {
        case 'home': return <PurchasingHome />;
        case 'pos': return <PurchasingPOs onNew={() => push('new-po')} />;
        case 'grns': return <PurchasingGRNs />;
        case 'vendors': return <PurchasingVendors />;
      }
    }
    if (role === 'cashier') {
      switch (active) {
        case 'till': return <CashierTill />;
        case 'shift': return <CashierShift />;
        case 'history': return <CashierHistory />;
      }
    }
    if (role === 'vendor') {
      switch (active) {
        case 'home': return <VendorHome />;
        case 'orders': return <VendorOrders />;
        case 'invoices': return <VendorInvoices />;
      }
    }
    return null;
  };

  const renderStack = () => {
    if (stack.length === 0) return null;
    const top = stack[stack.length - 1];
    
    switch (top.screen) {
      case 'tenant': return <TenantDetail id={top.param!} onBack={back} />;
      case 'outlet': return <OutletDetail id={top.param!} onBack={back} />;
      case 'product': return <ProductDetail id={top.param!} onBack={back} />;
      case 'new-po': return <NewPOScreen onBack={back} />;
      case 'rbac': return <RbacScreen onBack={back} />;
      case 'vat': return <VatScreen onBack={back} />;
      case 'crm': return <CrmScreen onOpenCustomer={(id) => push('customer', id)} />;
      case 'customer': return <CustomerDetail id={top.param!} onBack={back} />;
      case 'promotions': return <PromotionsScreen onBack={back} />;
      case 'aggregator': return <AggregatorScreen onBack={back} />;
      default: return null;
    }
  };

  const stacked = renderStack();

  return (
    <View style={styles.flex1}>
      <View style={styles.flex1}>
        {renderTab()}
      </View>
      {stacked && (
        <View style={StyleSheet.absoluteFill}>
          {stacked}
        </View>
      )}
      <BottomNav
        tabs={tabs}
        active={active}
        onChange={(k) => { setActive(k); reset(); }}
      />
    </View>
  );
}

function AppInner() {
  const { role } = useAuth();
  const [view, setView] = useState<'landing' | 'login'>('landing');

  if (!role) {
    return (
      <PhoneFrame>
        {view === 'landing' ? (
          <LandingPage onSignInClick={() => setView('login')} />
        ) : (
          <LoginScreen onBack={() => setView('landing')} />
        )}
      </PhoneFrame>
    );
  }

  const content = <RoleRouter role={role} />;

  return (
    <PhoneFrame>
      {role === 'super-admin' ? (
        <SuperAdminProvider>{content}</SuperAdminProvider>
      ) : role === 'head-office' ? (
        <HeadOfficeProvider>{content}</HeadOfficeProvider>
      ) : role === 'store-manager' ? (
        <StoreManagerProvider>{content}</StoreManagerProvider>
      ) : role === 'inventory-manager' ? (
        <InventoryManagerProvider>{content}</InventoryManagerProvider>
      ) : role === 'cashier' ? (
        <CashierProvider>{content}</CashierProvider>
      ) : role === 'vendor' ? (
        <VendorProvider>{content}</VendorProvider>
      ) : (
        content
      )}
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },
});
