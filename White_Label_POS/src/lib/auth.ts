import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export type Role =
  | "Super Admin"
  | "Head Office Admin"
  | "Store Manager"
  | "Inventory Manager"
  | "Purchasing Officer"
  | "Cashier"
  | "Vendor";

export const roleRoutes: Record<Role, string> = {
  "Super Admin": "/super-admin",
  "Head Office Admin": "/head-office",
  "Store Manager": "/store-manager",
  "Inventory Manager": "/inventory-manager",
  "Purchasing Officer": "/purchasing",
  "Cashier": "/pos-till",
  "Vendor": "/vendor-portal",
};

export function getSessionRole(): Role | null {
  return (typeof window !== "undefined" ? localStorage.getItem("demo_role") : null) as Role | null;
}

export function useAuth() {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = getSessionRole();
    if (storedRole) {
      setRole(storedRole);
    }
    setIsLoaded(true);
  }, []);

  const login = (selectedRole: Role) => {
    localStorage.setItem("demo_role", selectedRole);
    setRole(selectedRole);
    navigate({ to: roleRoutes[selectedRole] });
  };

  const logout = () => {
    localStorage.removeItem("demo_role");
    setRole(null);
    navigate({ to: "/login" });
  };

  return { role, isLoaded, login, logout };
}
