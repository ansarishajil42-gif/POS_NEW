import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from './types';
import { ROLES } from './types';

interface AuthState {
  role: Role | null;
  roleLabel: string;
  branch: string;
  signIn: (role: Role) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const branchByRole: Record<Role, string> = {
  'super-admin': 'Platform HQ',
  'head-office': 'All Branches',
  'store-manager': 'Downtown Branch',
  'inventory-manager': 'Downtown Branch',
  'purchasing-officer': 'Head Office',
  cashier: 'Downtown · Till 02',
  vendor: 'Gulf Foods LLC',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  const value = useMemo<AuthState>(() => ({
    role,
    roleLabel: role ? ROLES.find((r) => r.id === role)?.label ?? '' : '',
    branch: role ? branchByRole[role] : '',
    signIn: (r) => setRole(r),
    signOut: () => setRole(null),
  }), [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
