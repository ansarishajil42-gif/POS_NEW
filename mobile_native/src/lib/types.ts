export type Role =
  | 'super-admin'
  | 'head-office'
  | 'store-manager'
  | 'inventory-manager'
  | 'purchasing-officer'
  | 'cashier'
  | 'vendor';

export interface RoleOption {
  id: Role;
  label: string;
  subtitle: string;
}

export const ROLES: RoleOption[] = [
  { id: 'super-admin', label: 'Super Admin', subtitle: 'Platform Owner' },
  { id: 'head-office', label: 'Head Office Admin', subtitle: 'Tenant Admin' },
  { id: 'store-manager', label: 'Store Manager', subtitle: 'Branch operations' },
  { id: 'inventory-manager', label: 'Inventory Manager', subtitle: 'Stock & batches' },
  { id: 'purchasing-officer', label: 'Purchasing Officer', subtitle: 'POs & GRNs' },
  { id: 'cashier', label: 'Cashier', subtitle: 'POS Till' },
  { id: 'vendor', label: 'Vendor', subtitle: 'External supplier' },
];

export interface NavTab {
  key: string;
  label: string;
  icon: 'home' | 'building' | 'chart' | 'settings' | 'store' | 'box' | 'cart' | 'menu' | 'users' | 'report' | 'layers' | 'truck' | 'bell' | 'clipboard' | 'check' | 'wallet' | 'receipt' | 'shopping-bag' | 'list' | 'file';
}
