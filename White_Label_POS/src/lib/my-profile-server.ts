import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { staffUsers, vendors } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import bcrypt from "bcryptjs";

export interface MyProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  branchName: string | null;
}

/**
 * 1. getMyProfileFn
 * Session-only: derives userId exclusively from getSessionServerFn()
 * Never exposes passwordHash or pinHash.
 */
export const getMyProfileFn = createServerFn({ method: "GET" }).handler(async (): Promise<{ success: boolean; data: MyProfileData }> => {
  const res = await getSessionServerFn();
  if (!res.success || !res.session || !res.session.id) {
    throw new Error("Unauthorized: Please log in to view your profile.");
  }

  const userId = res.session.id;

  // 1. Try staff_users
  const staff = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.id, userId),
    with: {
      branch: true,
    },
  });

  if (staff) {
    return {
      success: true,
      data: {
        id: staff.id,
        name: staff.name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        address: staff.address || "",
        role: res.session.role,
        branchName: staff.branch?.name || null,
      },
    };
  }

  // 2. Fallback: try vendors
  const vendor = await db.query.vendors.findFirst({
    where: eq(vendors.id, userId),
  });

  if (vendor) {
    return {
      success: true,
      data: {
        id: vendor.id,
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        role: "Vendor",
        branchName: null,
      },
    };
  }

  throw new Error("User profile record not found.");
});

/**
 * 2. updateMyProfileFn
 * Accepts { name, phone, address } only. Email is strictly read-only.
 * Updates record strictly WHERE id = session.id
 */
export const updateMyProfileFn = createServerFn({ method: "POST" })
  .validator((d: { name?: string; phone?: string; address?: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please log in to update your profile.");
    }

    const userId = res.session.id;

    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.phone !== undefined) updates.phone = data.phone.trim();
    if (data.address !== undefined) updates.address = data.address.trim();

    if (Object.keys(updates).length === 0) {
      return { success: true, message: "No changes provided." };
    }

    // 1. Try staff_users
    const staff = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.id, userId),
    });

    if (staff) {
      await db.update(staffUsers).set(updates).where(eq(staffUsers.id, userId));
      return { success: true, message: "Profile updated successfully." };
    }

    // 2. Try vendors
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, userId),
    });

    if (vendor) {
      await db.update(vendors).set(updates).where(eq(vendors.id, userId));
      return { success: true, message: "Profile updated successfully." };
    }

    throw new Error("User profile record not found.");
  });

/**
 * 3. changeMyPasswordFn
 * Verifies currentPassword against stored bcrypt hash before updating.
 */
export const changeMyPasswordFn = createServerFn({ method: "POST" })
  .validator((d: { currentPassword: string; newPassword: string; confirmPassword: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please log in to change your password.");
    }

    const userId = res.session.id;
    const { currentPassword, newPassword, confirmPassword } = data;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("All password fields are required.");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirmation do not match.");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    // 1. Try staff_users
    const staff = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.id, userId),
    });

    if (staff) {
      if (!staff.passwordHash) {
        throw new Error("This account uses PIN authentication. Password change is not supported for PIN accounts.");
      }

      const isValid = await bcrypt.compare(currentPassword, staff.passwordHash);
      if (!isValid) {
        throw new Error("Current password is incorrect.");
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await db.update(staffUsers).set({ passwordHash: newHash }).where(eq(staffUsers.id, userId));
      return { success: true, message: "Password updated successfully." };
    }

    // 2. Try vendors
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, userId),
    });

    if (vendor) {
      if (!vendor.passwordHash) {
        throw new Error("No password hash found for this account.");
      }

      const isValid = await bcrypt.compare(currentPassword, vendor.passwordHash);
      if (!isValid) {
        throw new Error("Current password is incorrect.");
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await db.update(vendors).set({ passwordHash: newHash }).where(eq(vendors.id, userId));
      return { success: true, message: "Password updated successfully." };
    }

    throw new Error("User record not found.");
  });
