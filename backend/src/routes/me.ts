import { Router, Response } from "express";
import { db } from "../db/index.js";
import { staffUsers, vendors, branches } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Ensure all /me endpoints require authenticated session
router.use(requireAuth);

/**
 * GET current authenticated user profile
 * Session-only: Derives userId strictly from req.user.id
 * Never exposes passwordHash or pinHash.
 */
export async function getMeHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: No authenticated session" });
    }

    // 1. Check staff_users first
    const staff = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.name,
        email: staffUsers.email,
        phone: staffUsers.phone,
        address: staffUsers.address,
        role: staffUsers.role,
        tenantId: staffUsers.tenantId,
        branchId: staffUsers.branchId,
        branchName: branches.name,
      })
      .from(staffUsers)
      .leftJoin(branches, eq(staffUsers.branchId, branches.id))
      .where(eq(staffUsers.id, userId))
      .limit(1);

    if (staff.length > 0) {
      const u = staff[0];
      return res.json({
        success: true,
        data: {
          id: u.id,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          role: u.role,
          tenantId: u.tenantId,
          branchId: u.branchId,
          branchName: u.branchName || null,
        },
      });
    }

    // 2. Fallback: check vendors table if user is a vendor
    const vendor = await db
      .select({
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        phone: vendors.phone,
        address: vendors.address,
        status: vendors.status,
        tenantId: vendors.tenantId,
      })
      .from(vendors)
      .where(eq(vendors.id, userId))
      .limit(1);

    if (vendor.length > 0) {
      const v = vendor[0];
      return res.json({
        success: true,
        data: {
          id: v.id,
          name: v.name || "",
          email: v.email || "",
          phone: v.phone || "",
          address: v.address || "",
          role: "vendor",
          tenantId: v.tenantId,
          branchId: null,
          branchName: null,
        },
      });
    }

    return res.status(404).json({ success: false, error: "User profile not found" });
  } catch (error: any) {
    console.error("Error fetching self profile:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch profile" });
  }
}

/**
 * PATCH current authenticated user profile
 * Accepts { name, phone, address } only. Email is read-only.
 * Updates record matching req.user.id only.
 */
export async function updateMeHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: No authenticated session" });
    }

    const { name, phone, address } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = typeof name === "string" ? name.trim() : name;
    if (phone !== undefined) updates.phone = typeof phone === "string" ? phone.trim() : phone;
    if (address !== undefined) updates.address = typeof address === "string" ? address.trim() : address;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "No profile fields to update" });
    }

    // 1. Try updating staff_users
    const updatedStaff = await db
      .update(staffUsers)
      .set(updates)
      .where(eq(staffUsers.id, userId))
      .returning({
        id: staffUsers.id,
        name: staffUsers.name,
        email: staffUsers.email,
        phone: staffUsers.phone,
        address: staffUsers.address,
        role: staffUsers.role,
        tenantId: staffUsers.tenantId,
        branchId: staffUsers.branchId,
      });

    if (updatedStaff.length > 0) {
      const u = updatedStaff[0];
      return res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: u.id,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          role: u.role,
          tenantId: u.tenantId,
          branchId: u.branchId,
        },
      });
    }

    // 2. Fallback: try updating vendors table
    const updatedVendor = await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, userId))
      .returning({
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        phone: vendors.phone,
        address: vendors.address,
      });

    if (updatedVendor.length > 0) {
      const v = updatedVendor[0];
      return res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: v.id,
          name: v.name || "",
          email: v.email || "",
          phone: v.phone || "",
          address: v.address || "",
          role: "vendor",
        },
      });
    }

    return res.status(404).json({ success: false, error: "User profile not found" });
  } catch (error: any) {
    console.error("Error updating self profile:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update profile" });
  }
}

/**
 * POST /change-password
 * Accepts { currentPassword, newPassword, confirmPassword }
 * Verifies current password against stored bcrypt hash, then updates hash.
 */
export async function changePasswordHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: No authenticated session" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password, new password, and confirmation password are all required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: "New password and confirmation do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters long" });
    }

    // 1. Check staff_users
    const staff = await db
      .select({
        id: staffUsers.id,
        passwordHash: staffUsers.passwordHash,
      })
      .from(staffUsers)
      .where(eq(staffUsers.id, userId))
      .limit(1);

    if (staff.length > 0) {
      const u = staff[0];
      if (!u.passwordHash) {
        return res.status(400).json({
          success: false,
          error: "Account uses PIN authentication. Password change is not supported for PIN accounts.",
        });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, u.passwordHash);
      if (!isCurrentValid) {
        return res.status(400).json({ success: false, error: "Current password is incorrect" });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await db.update(staffUsers).set({ passwordHash: newHash }).where(eq(staffUsers.id, userId));

      return res.json({ success: true, message: "Password changed successfully" });
    }

    // 2. Check vendors
    const vendor = await db
      .select({
        id: vendors.id,
        passwordHash: vendors.passwordHash,
      })
      .from(vendors)
      .where(eq(vendors.id, userId))
      .limit(1);

    if (vendor.length > 0) {
      const v = vendor[0];
      if (!v.passwordHash) {
        return res.status(400).json({ success: false, error: "No password hash configured on this account" });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, v.passwordHash);
      if (!isCurrentValid) {
        return res.status(400).json({ success: false, error: "Current password is incorrect" });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await db.update(vendors).set({ passwordHash: newHash }).where(eq(vendors.id, userId));

      return res.json({ success: true, message: "Password changed successfully" });
    }

    return res.status(404).json({ success: false, error: "User record not found" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to change password" });
  }
}

// Route definitions on meRouter
router.get("/", getMeHandler);
router.patch("/", updateMeHandler);
router.post("/change-password", changePasswordHandler);

// Convenience aliases if sub-routing /me on a router
router.get("/me", getMeHandler);
router.patch("/me", updateMeHandler);

export default router;
