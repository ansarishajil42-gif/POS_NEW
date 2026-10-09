import { apiClient, storage } from './apiClient';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  tenantId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
}

export const getMyProfile = async (): Promise<{ success: boolean; data?: UserProfile; error?: string }> => {
  // 1. Try /me first (silent on 404 to avoid warning banners)
  try {
    const res = await apiClient.get<any>('/me', { silent404: true });
    if (res && (res.data || res.name || res.email)) {
      return { success: true, data: res.data || res };
    }
  } catch (err: any) {
    // Expected fallback if /me endpoint not yet deployed on backend
  }

  // 2. Fallback to stored user and /users list
  try {
    const storedUser = await storage.getUser();
    if (storedUser?.id) {
      try {
        const users = await apiClient.get<any[]>('/users');
        if (Array.isArray(users)) {
          const found = users.find(
            (u: any) => u.id === storedUser.id || (u.email && u.email.toLowerCase() === storedUser.email?.toLowerCase())
          );
          if (found) {
            const profileData: UserProfile = {
              id: found.id,
              name: found.name || storedUser.name || '',
              email: found.email || storedUser.email || '',
              phone: found.phone || storedUser.phone || '',
              address: found.address || storedUser.address || '',
              role: found.role || storedUser.role || '',
              tenantId: found.tenantId || storedUser.tenantId,
              branchId: found.branchId || storedUser.branchId,
              branchName: storedUser.branch?.name || null,
            };
            // Update cache
            await storage.setUser({ ...storedUser, ...profileData });
            return { success: true, data: profileData };
          }
        }
      } catch (_) {}

      // Fallback directly to stored session user
      return {
        success: true,
        data: {
          id: storedUser.id,
          name: storedUser.name || '',
          email: storedUser.email || '',
          phone: storedUser.phone || '',
          address: storedUser.address || '',
          role: storedUser.role || '',
          tenantId: storedUser.tenantId,
          branchId: storedUser.branchId,
          branchName: storedUser.branch?.name || null,
        },
      };
    }
  } catch (_) {}

  return { success: false, error: 'Could not load profile' };
};

export const updateMyProfile = async (data: {
  name?: string;
  phone?: string;
  address?: string;
}): Promise<{ success: boolean; data?: UserProfile; error?: string; message?: string }> => {
  // 1. Try /me first
  try {
    const res = await apiClient.patch<any>('/me', data);
    if (res?.success) return res;
  } catch (err: any) {
    // Fallback if /me is 404
  }

  // 2. Fallback to /users/:id
  try {
    const storedUser = await storage.getUser();
    if (storedUser?.id) {
      const updated = await apiClient.patch<any>(`/users/${storedUser.id}`, data);
      const newUser = { ...storedUser, ...data, ...(updated || {}) };
      await storage.setUser(newUser);
      return {
        success: true,
        message: 'Profile updated successfully!',
        data: {
          id: newUser.id,
          name: newUser.name || '',
          email: newUser.email || '',
          phone: newUser.phone || '',
          address: newUser.address || '',
          role: newUser.role || '',
        },
      };
    }
  } catch (fallbackErr: any) {
    return { success: false, error: fallbackErr.message || 'Failed to update profile' };
  }

  return { success: false, error: 'Failed to update profile' };
};

export const changeMyPassword = async (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; error?: string; message?: string }> => {
  // 1. Try /me/change-password first
  try {
    const res = await apiClient.post<any>('/me/change-password', data);
    if (res?.success) return res;
  } catch (err: any) {
    // Fallback if endpoint is 404
  }

  // 2. Fallback to /users/:id
  try {
    const storedUser = await storage.getUser();
    if (storedUser?.id) {
      await apiClient.patch<any>(`/users/${storedUser.id}`, { password: data.newPassword });
      return { success: true, message: 'Password changed successfully!' };
    }
  } catch (fallbackErr: any) {
    return { success: false, error: fallbackErr.message || 'Failed to change password' };
  }

  return { success: false, error: 'Failed to change password' };
};
