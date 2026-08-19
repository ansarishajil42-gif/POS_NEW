import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { db } from "../server/db/index.js";
import { staffUsers, tenants, branches, vendors } from "../server/db/schema.js";
import { eq, and } from "drizzle-orm";
import * as argon2 from "argon2";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env["JWT_SECRET"] || "pos-secret-key-at-least-32-characters-long-key-string-for-jwt"
);

export const dbRoleToFrontendRole: Record<string, string> = {
  super_admin: "Super Admin",
  head_office_admin: "Head Office Admin",
  branch_manager: "Store Manager",
  inventory_manager: "Inventory Manager",
  purchasing_officer: "Purchasing Officer",
  cashier: "Cashier",
  vendor: "Vendor",
};

export const frontendRoleToDbRole: Record<string, string> = {
  "Super Admin": "super_admin",
  "Head Office Admin": "head_office_admin",
  "Store Manager": "branch_manager",
  "Inventory Manager": "inventory_manager",
  "Purchasing Officer": "purchasing_officer",
  "Cashier": "cashier",
};

// 1. Login Server Function
export const loginServerFn = createServerFn()
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const { email, password } = data;

    try {
      const user = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.email, email),
      });

      let id: string;
      let tenantId: string | null;
      let branchId: string | null = null;
      let frontendRole: string;
      let passwordHashStr: string;

      if (user) {
        if (!user.isActive) throw new Error("User account is suspended");
        id = user.id;
        tenantId = user.tenantId;
        branchId = user.branchId;
        frontendRole = dbRoleToFrontendRole[user.role] || "Vendor";
        passwordHashStr = user.passwordHash!;
      } else {
        // Fallback to vendors
        const vendorUser = await db.query.vendors.findFirst({
          where: eq(vendors.email, email),
        });
        if (!vendorUser || !vendorUser.passwordHash) {
          throw new Error("Invalid email or password");
        }
        id = vendorUser.id;
        tenantId = vendorUser.tenantId;
        frontendRole = "Vendor";
        passwordHashStr = vendorUser.passwordHash;
      }

      const validPassword = await argon2.verify(passwordHashStr, password);
      if (!validPassword) {
        throw new Error("Invalid email or password");
      }

      // Sign JWT
      const token = await new jose.SignJWT({
        id: id,
        email: email,
        role: frontendRole,
        tenantId: tenantId,
        branchId: branchId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      // Set httpOnly cookie
      setCookie("pos_session", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      // Get tenant details if applicable
      let tenantName = "";
      if (tenantId) {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId),
        });
        if (tenant) tenantName = tenant.name;
      }

      return {
        success: true,
        user: {
          id: id,
          email: email,
          role: frontendRole,
          tenantId: tenantId,
          tenantName,
          branchId: branchId,
        },
      };
    } catch (err: any) {
      console.error("Login failed on server:", err);
      return { success: false, error: err.message || "Authentication failed" };
    }
  });

// 2. PIN Login Server Function (for Cashiers)
export const pinLoginServerFn = createServerFn()
  .validator((d: { tenantId: string; branchId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId, pin } = data;

    try {
      // Find cashiers in the branch
      const branchCashiers = await db.select().from(staffUsers).where(
        and(
          eq(staffUsers.tenantId, tenantId),
          eq(staffUsers.branchId, branchId),
          eq(staffUsers.role, "cashier"),
          eq(staffUsers.isActive, true)
        )
      );

      let authenticatedUser = null;

      for (const cashier of branchCashiers) {
        if (cashier.pinHash) {
          const isValid = await argon2.verify(cashier.pinHash, pin);
          if (isValid) {
            authenticatedUser = cashier;
            break;
          }
        }
      }

      if (!authenticatedUser) {
        throw new Error("Invalid PIN code");
      }

      const frontendRole = "Cashier";

      // Sign JWT
      const token = await new jose.SignJWT({
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: frontendRole,
        tenantId: authenticatedUser.tenantId,
        branchId: authenticatedUser.branchId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      // Set cookie
      setCookie("pos_session", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      let tenantName = "";
      if (authenticatedUser.tenantId) {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, authenticatedUser.tenantId),
        });
        if (tenant) tenantName = tenant.name;
      }

      return {
        success: true,
        user: {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          role: frontendRole,
          tenantId: authenticatedUser.tenantId,
          tenantName,
          branchId: authenticatedUser.branchId,
        },
      };
    } catch (err: any) {
      console.error("PIN login failed on server:", err);
      return { success: false, error: err.message || "Invalid PIN" };
    }
  });

// 3. Get Session Server Function
export const getSessionServerFn = createServerFn()
  .handler(async () => {
    const token = getCookie("pos_session");

    if (!token) {
      return { success: false, error: "No session found" };
    }

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);

      return {
        success: true,
        session: {
          id: payload["id"] as string,
          email: payload["email"] as string,
          role: payload["role"] as string,
          tenantId: payload["tenantId"] as string,
          branchId: payload["branchId"] as string,
        },
      };
    } catch (err) {
      return { success: false, error: "Session invalid or expired" };
    }
  });

// 4. Logout Server Function
export const logoutServerFn = createServerFn()
  .handler(async () => {
    setCookie("pos_session", "", {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Delete cookie immediately
    });
    return { success: true };
  });

// 5. Get Tenants and Branches (for Cashier dropdown)
export const getTenantsAndBranchesFn = createServerFn()
  .handler(async () => {
    try {
      const allTenants = await db.select().from(tenants);
      const allBranches = await db.select().from(branches);
      return {
        success: true,
        tenants: allTenants,
        branches: allBranches,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to load branches" };
    }
  });
