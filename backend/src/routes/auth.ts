// import { Router } from "express";
// import { db } from "../db/index.js";
// import { staffUsers, tenants, branches } from "../db/schema.js";
// import { eq, and } from "drizzle-orm";
// import { verify } from "@node-rs/argon2";

// const router = Router();

// // Login with email and password (for admins, managers, officers)
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     const user = await db.query.staffUsers.findFirst({
//       where: eq(staffUsers.email, email),
//     });

//     if (!user || !user.passwordHash) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({ error: "User account is suspended" });
//     }

//     const validPassword = await verify(user.passwordHash, password);
//     if (!validPassword) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     // Optionally get tenant details
//     let tenantInfo = null;
//     if (user.tenantId) {
//       tenantInfo = await db.query.tenants.findFirst({
//         where: eq(tenants.id, user.tenantId),
//       });
//     }

//     // Optionally get branch details
//     let branchInfo = null;
//     if (user.branchId) {
//       branchInfo = await db.query.branches.findFirst({
//         where: eq(branches.id, user.branchId),
//       });
//     }

//     res.json({
//       message: "Login successful",
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         tenantId: user.tenantId,
//         branchId: user.branchId,
//         tenant: tenantInfo,
//         branch: branchInfo,
//       },
//       token: "mock-jwt-token-for-" + user.id,
//     });
//   } catch (error) {
//     console.error("Auth error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Cashier login with PIN code
// router.post("/pin-login", async (req, res) => {
//   const { tenantId, branchId, pin } = req.body;

//   if (!tenantId || !branchId || !pin) {
//     return res.status(400).json({ error: "Tenant, branch, and PIN are required" });
//   }

//   try {
//     // Find all cashiers in this branch
//     const branchCashiers = await db.select().from(staffUsers).where(
//       and(
//         eq(staffUsers.tenantId, tenantId),
//         eq(staffUsers.branchId, branchId),
//         eq(staffUsers.role, "cashier"),
//         eq(staffUsers.isActive, true)
//       )
//     );

//     let authenticatedUser = null;

//     // Verify PIN against each cashier's pinHash
//     for (const cashier of branchCashiers) {
//       if (cashier.pinHash) {
//         const isValidPin = await verify(cashier.pinHash, pin);
//         if (isValidPin) {
//           authenticatedUser = cashier;
//           break;
//         }
//       }
//     }

//     if (!authenticatedUser) {
//       return res.status(401).json({ error: "Invalid PIN code" });
//     }

//     // Fetch tenant and branch details
//     const tenantInfo = await db.query.tenants.findFirst({
//       where: eq(tenants.id, tenantId),
//     });

//     const branchInfo = await db.query.branches.findFirst({
//       where: eq(branches.id, branchId),
//     });

//     res.json({
//       message: "PIN authentication successful",
//       user: {
//         id: authenticatedUser.id,
//         email: authenticatedUser.email,
//         role: authenticatedUser.role,
//         tenantId: authenticatedUser.tenantId,
//         branchId: authenticatedUser.branchId,
//         tenant: tenantInfo,
//         branch: branchInfo,
//       },
//       token: "mock-jwt-token-for-" + authenticatedUser.id,
//     });
//   } catch (error) {
//     console.error("PIN Auth error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;






import { Router } from "express";
import { db } from "../db/index.js";
import { staffUsers, tenants, branches } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

// Login with email and password (for admins, managers, officers)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.email, email),
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "User account is suspended" });
    }

    // bcrypt.compare use karein
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Optionally get tenant details
    let tenantInfo = null;
    if (user.tenantId) {
      tenantInfo = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
      });
    }

    // Optionally get branch details
    let branchInfo = null;
    if (user.branchId) {
      branchInfo = await db.query.branches.findFirst({
        where: eq(branches.id, user.branchId),
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        tenant: tenantInfo,
        branch: branchInfo,
      },
      token: "mock-jwt-token-for-" + user.id,
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cashier login with PIN code
router.post("/pin-login", async (req, res) => {
  const { tenantId, branchId, pin } = req.body;

  if (!tenantId || !branchId || !pin) {
    return res.status(400).json({ error: "Tenant, branch, and PIN are required" });
  }

  try {
    // Find all cashiers in this branch
    const branchCashiers = await db.select().from(staffUsers).where(
      and(
        eq(staffUsers.tenantId, tenantId),
        eq(staffUsers.branchId, branchId),
        eq(staffUsers.role, "cashier"),
        eq(staffUsers.isActive, true)
      )
    );

    let authenticatedUser = null;

    // Verify PIN against each cashier's pinHash
    for (const cashier of branchCashiers) {
      if (cashier.pinHash) {
        const isValidPin = await bcrypt.compare(pin, cashier.pinHash);
        if (isValidPin) {
          authenticatedUser = cashier;
          break;
        }
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({ error: "Invalid PIN code" });
    }

    // Fetch tenant and branch details
    const tenantInfo = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    const branchInfo = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    res.json({
      message: "PIN authentication successful",
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        tenantId: authenticatedUser.tenantId,
        branchId: authenticatedUser.branchId,
        tenant: tenantInfo,
        branch: branchInfo,
      },
      token: "mock-jwt-token-for-" + authenticatedUser.id,
    });
  } catch (error) {
    console.error("PIN Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;