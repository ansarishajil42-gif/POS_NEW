import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { db } from "../server/db/index.js";
import { staffUsers, tenants, branches, vendors, tills, loginAttempts, shifts } from "../server/db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env["JWT_SECRET"] || "pos-secret-key-at-least-32-characters-long-key-string-for-jwt"
);

export const dbRoleToFrontendRole: Record<string, string> = {
  super_admin: "Super Admin",
  head_office_admin: "Head Office Admin",
  branch_manager: "Branch Manager",
  inventory_manager: "Inventory Manager",
  purchasing_officer: "Purchasing Officer",
  cashier: "Cashier",
  vendor: "Vendor",
};

export const frontendRoleToDbRole: Record<string, string> = {
  "Super Admin": "super_admin",
  "Head Office Admin": "head_office_admin",
  "Branch Manager": "branch_manager",
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
        if (!user.passwordHash) throw new Error("This account uses a PIN for login. Please switch to 'Cashier PIN Login' tab.");
        id = user.id;
        tenantId = user.tenantId;
        branchId = user.branchId;
        frontendRole = dbRoleToFrontendRole[user.role] || "Vendor";
        passwordHashStr = user.passwordHash;
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

      let validPassword = false;
      try {
        validPassword = await verify(passwordHashStr, password);
      } catch (e: any) {
        validPassword = false;
      }
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
        if (!tenant) throw new Error("Tenant not found");
        if (tenant.status === "Archived") {
          throw new Error("Tenant is archived and cannot be accessed");
        }
        tenantName = tenant.name;
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

// Rate limiting helpers
async function checkRateLimit(identifier: string) {
  const lockoutDuration = 30 * 1000; // 30 seconds
  const maxAttempts = 5;

  const record = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, identifier),
  });

  if (record && record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
    const remainingSec = Math.ceil((new Date(record.lockedUntil).getTime() - new Date().getTime()) / 1000);
    throw new Error(`Too many failed attempts. Try again in ${remainingSec} seconds.`);
  }
}

async function recordFailedAttempt(identifier: string) {
  const lockoutDuration = 30 * 1000; // 30 seconds
  const maxAttempts = 5;

  const record = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, identifier),
  });

  if (!record) {
    await db.insert(loginAttempts).values({
      identifier,
      attempts: 1,
    });
  } else {
    const nextAttempts = record.attempts + 1;
    if (nextAttempts >= maxAttempts) {
      const lockedUntil = new Date(new Date().getTime() + lockoutDuration);
      await db.update(loginAttempts)
        .set({ attempts: nextAttempts, lockedUntil })
        .where(eq(loginAttempts.id, record.id));
      console.warn(`SECURITY AUDIT: Account locked for identifier ${identifier} until ${lockedUntil}`);
    } else {
      await db.update(loginAttempts)
        .set({ attempts: nextAttempts })
        .where(eq(loginAttempts.id, record.id));
    }
  }
}

async function resetFailedAttempts(identifier: string) {
  const record = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.identifier, identifier),
  });
  if (record) {
    await db.update(loginAttempts)
      .set({ attempts: 0, lockedUntil: null })
      .where(eq(loginAttempts.id, record.id));
  }
}

// 2. PIN Login Server Function (for Cashiers)
export const pinLoginServerFn = createServerFn({ method: "POST" })
  .validator((d: { tenantId: string; branchId: string; cashierId: string; tillId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId, cashierId, tillId, pin } = data;

    if (!cashierId || !tillId || !pin) {
      throw new Error("Invalid cashier, till, or PIN code.");
    }

    // Rate Limit Check
    await checkRateLimit(cashierId);

    try {
      // Find cashier in the branch
      const cashier = await db.query.staffUsers.findFirst({
        where: and(
          eq(staffUsers.id, cashierId),
          eq(staffUsers.tenantId, tenantId),
          eq(staffUsers.branchId, branchId),
          eq(staffUsers.role, "cashier"),
          eq(staffUsers.isActive, true)
        )
      });

      if (!cashier) {
        await recordFailedAttempt(cashierId);
        throw new Error("Invalid cashier, till, or PIN code.");
      }

      // Verify PIN against Argon2id hash
      let isValid = false;
      if (cashier.pinHash) {
        try {
          isValid = await verify(cashier.pinHash, pin);
        } catch (e: any) {
          isValid = false;
        }
      }
      if (!isValid) {
        await recordFailedAttempt(cashierId);
        throw new Error("Invalid cashier, till, or PIN code.");
      }

      // Verify Till belongs to same branch/tenant and exists
      const till = await db.query.tills.findFirst({
        where: and(
          eq(tills.id, tillId),
          eq(tills.tenantId, tenantId),
          eq(tills.branchId, branchId)
        )
      });
      if (!till) {
        await recordFailedAttempt(cashierId);
        throw new Error("Invalid cashier, till, or PIN code.");
      }

      // Shift overlapping and scheduling validation
      const today = new Date().toISOString().split("T")[0] as string; // YYYY-MM-DD
      const scheduledShift = await db.query.shifts.findFirst({
        where: and(
          eq(shifts.cashierId, cashierId),
          eq(shifts.shiftDate, today),
          eq(shifts.status, "Scheduled")
        )
      });
      if (scheduledShift && scheduledShift.tillId !== tillId && scheduledShift.tillId !== till.name) {
        await recordFailedAttempt(cashierId);
        throw new Error("The selected till terminal does not match your scheduled shift assignment.");
      }

      // If the till is already in use by another active cashier session/shift, reject the login
      const activeTillShift = await db.query.shifts.findFirst({
        where: and(
          eq(shifts.tillId, tillId),
          eq(shifts.status, "Open")
        )
      });
      if (activeTillShift && activeTillShift.cashierId !== cashierId) {
        await recordFailedAttempt(cashierId);
        throw new Error("This till terminal is currently in use by another cashier.");
      }

      // Success: reset attempts
      await resetFailedAttempts(cashierId);

      const frontendRole = "Cashier";

      // Sign JWT
      const token = await new jose.SignJWT({
        id: cashier.id,
        email: cashier.email,
        role: frontendRole,
        tenantId: cashier.tenantId,
        branchId: cashier.branchId,
        tillId: till.id, // Save canonical tillId UUID
        tillName: till.name,
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
      if (cashier.tenantId) {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, cashier.tenantId),
        });
        if (!tenant) throw new Error("Tenant not found");
        if (tenant.status === "Archived") {
          throw new Error("Tenant is archived and cannot be accessed");
        }
        tenantName = tenant.name;
      }

      return {
        success: true,
        user: {
          id: cashier.id,
          email: cashier.email,
          role: frontendRole,
          tenantId: cashier.tenantId,
          tenantName,
          branchId: cashier.branchId,
        },
      };
    } catch (err: any) {
      console.error("PIN login failed on server:", err);
      return { success: false, error: err.message || "Authentication failed" };
    }
  });

// Cashier self-reset PIN function requiring current password re-authentication
export const resetCashierPinSelfFn = createServerFn({ method: "POST" })
  .validator((d: { email: string; currentPass: string; newPin: string; confirmPin: string }) => d)
  .handler(async ({ data }) => {
    const { email, currentPass, newPin, confirmPin } = data;

    if (!email || !currentPass || !newPin || !confirmPin) {
      throw new Error("All fields are required.");
    }

    if (newPin !== confirmPin) {
      throw new Error("PIN and confirmation PIN do not match.");
    }

    if (!/^\d{4}$/.test(newPin)) {
      throw new Error("PIN must be exactly 4 digits.");
    }

    // Rate Limit Check by email
    await checkRateLimit(email);

    try {
      const cashier = await db.query.staffUsers.findFirst({
        where: and(
          eq(staffUsers.email, email),
          eq(staffUsers.role, "cashier"),
          eq(staffUsers.isActive, true)
        )
      });

      if (!cashier || !cashier.passwordHash) {
        await recordFailedAttempt(email);
        throw new Error("Invalid credentials.");
      }

      // Re-authenticate password
      const validPass = await verify(cashier.passwordHash, currentPass);
      if (!validPass) {
        await recordFailedAttempt(email);
        throw new Error("Invalid credentials.");
      }

      // Success: hash new PIN
      const hashed = await hash(newPin);
      await db.update(staffUsers).set({ pinHash: hashed }).where(eq(staffUsers.id, cashier.id));

      // Reset attempts
      await resetFailedAttempts(email);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to reset PIN" };
    }
  });

// Get branch cashiers and tills helper
export const getBranchCashiersAndTillsFn = createServerFn({ method: "POST" })
  .validator((d: { tenantId: string; branchId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, branchId } = data;
    try {
      const cashiers = await db.query.staffUsers.findMany({
        where: and(
          eq(staffUsers.tenantId, tenantId),
          eq(staffUsers.branchId, branchId),
          eq(staffUsers.role, "cashier"),
          eq(staffUsers.isActive, true)
        ),
        columns: {
          id: true,
          name: true,
          email: true,
        }
      });

      const branchTills = await db.query.tills.findMany({
        where: and(
          eq(tills.tenantId, tenantId),
          eq(tills.branchId, branchId)
        ),
        orderBy: [desc(tills.createdAt)]
      });

      return { success: true, cashiers, tills: branchTills };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to load branch details" };
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
          tillId: payload["tillId"] as string,
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
      const allTenants = await db.select().from(tenants).where(eq(tenants.status, "Active"));
      const allBranches = await db.select().from(branches).where(eq(branches.status, "Active"));
      return {
        success: true,
        tenants: allTenants,
        branches: allBranches,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to load branches" };
    }
  });
