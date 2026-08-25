import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionServerFn, loginServerFn, logoutServerFn, pinLoginServerFn, getTenantsAndBranchesFn, getBranchCashiersAndTillsFn, resetCashierPinSelfFn } from "./auth-server.js";

export type Role =
  | "Super Admin"
  | "Head Office Admin"
  | "Branch Manager"
  | "Inventory Manager"
  | "Purchasing Officer"
  | "Cashier"
  | "Vendor";

export const roleRoutes: Record<Role, string> = {
  "Super Admin": "/super-admin",
  "Head Office Admin": "/head-office",
  "Branch Manager": "/store-manager",
  "Inventory Manager": "/inventory-manager",
  "Purchasing Officer": "/purchasing",
  "Cashier": "/pos-till",
  "Vendor": "/vendor-portal",
};

// Client-side quick check (useful for instant rendering, secured by server guards)
export function getSessionRole(): Role | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_role") as Role | null;
}

export function useAuth() {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await getSessionServerFn();
        if (res.success && res.session) {
          const userRole = res.session.role as Role;
          setRole(userRole);
          localStorage.setItem("user_role", userRole);
        } else {
          setRole(null);
          localStorage.removeItem("user_role");
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginServerFn({ data: { email, password } });
      if (res.success && res.user) {
        const userRole = res.user.role as Role;
        setRole(userRole);
        localStorage.setItem("user_role", userRole);
        navigate({ to: roleRoutes[userRole] });
        return { success: true };
      } else {
        return { success: false, error: res.error || "Login failed" };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "An error occurred during login" };
    }
  };

  const pinLogin = async (tenantId: string, branchId: string, cashierId: string, tillId: string, pin: string) => {
    try {
      const res = await pinLoginServerFn({ data: { tenantId, branchId, cashierId, tillId, pin } });
      if (res.success && res.user) {
        const userRole = res.user.role as Role;
        setRole(userRole);
        localStorage.setItem("user_role", userRole);
        navigate({ to: roleRoutes[userRole] });
        return { success: true };
      } else {
        return { success: false, error: res.error || "Login failed" };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "An error occurred during login" };
    }
  };

  const logout = async () => {
    try {
      await logoutServerFn();
    } catch (err) {
      console.error("Logout error on server:", err);
    }
    setRole(null);
    localStorage.removeItem("user_role");
    navigate({ to: "/login" });
  };

  return { role, isLoaded, login, pinLogin, logout };
}
export { getSessionServerFn, getTenantsAndBranchesFn, getBranchCashiersAndTillsFn, resetCashierPinSelfFn };
