import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  User,
  Shield,
  KeyRound,
  X,
  Save,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Building2,
  Lock,
} from 'lucide-react-native';
import { Badge } from './ui/Badge';
import { Toast, ToastType } from './ui/Toast';
import { useAuth } from '../lib/auth';
import { getMyProfile, updateMyProfile, changeMyPassword, UserProfile } from '../lib/profileApi';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  roleLabel?: string;
  branch?: string;
}

export function ProfileModal({ visible, onClose, roleLabel = 'User', branch }: ProfileModalProps) {
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  const [loading, setLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'error') => setToast({ message, type });

  // Pre-populate immediately from active session user when modal opens
  useEffect(() => {
    if (visible && user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.address) setAddress(user.address);
      setProfile({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || roleLabel,
        branchName: user.branch?.name || branch || null,
        tenantId: user.tenantId,
        branchId: user.branchId,
      });
    }
    if (visible) {
      loadProfile();
    }
  }, [visible, user]);

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      if (res?.success && res.data) {
        setProfile(res.data);
        if (res.data.name) setName(res.data.name);
        if (res.data.phone) setPhone(res.data.phone);
        if (res.data.address) setAddress(res.data.address);
      }
    } catch (_) {
      // Graceful fallback to session user
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await updateMyProfile({ name, phone, address });
      if (res?.success) {
        showToast(res.message || 'Profile updated successfully!', 'success');
        if (profile) {
          setProfile({ ...profile, name, phone, address });
        }
      } else {
        showToast(res?.error || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required', 'warn');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match', 'warn');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warn');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (res?.success) {
        showToast(res.message || 'Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res?.error || 'Failed to change password', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarCircleText}>{roleLabel.charAt(0)}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.headerName}>{profile?.name || user?.name || roleLabel}</Text>
                <View style={styles.roleBadgeRow}>
                  <Badge variant="brand">{profile?.role || user?.role || roleLabel}</Badge>
                  {(profile?.branchName || user?.branch?.name || branch) && (
                    <Text style={styles.branchSubText}>· {profile?.branchName || user?.branch?.name || branch}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Read-Only Email Header Badge */}
            <View style={styles.emailContainer}>
              <Mail size={13} color="#64748b" />
              <Text style={styles.emailText}>{profile?.email || user?.email || 'Authenticated User'}</Text>
              <Lock size={12} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'info' && styles.tabBtnActive]}
                onPress={() => setActiveTab('info')}
              >
                <User size={15} color={activeTab === 'info' ? '#0f172a' : '#64748b'} />
                <Text style={[styles.tabBtnText, activeTab === 'info' && styles.tabBtnTextActive]}>
                  Profile Info
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'security' && styles.tabBtnActive]}
                onPress={() => setActiveTab('security')}
              >
                <KeyRound size={15} color={activeTab === 'security' ? '#0f172a' : '#64748b'} />
                <Text style={[styles.tabBtnText, activeTab === 'security' && styles.tabBtnTextActive]}>
                  Security &amp; Password
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={styles.loadingText}>Loading profile details...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
              {activeTab === 'info' ? (
                <View style={styles.formSection}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="e.g. +971 50 123 4567"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Physical Address</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="e.g. Amber Gem Tower, Ajman, UAE"
                      placeholderTextColor="#94a3b8"
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn]}
                    onPress={handleSaveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? (
                      <ActivityIndicator size="small" color="#0f172a" />
                    ) : (
                      <>
                        <Save size={16} color="#0f172a" />
                        <Text style={styles.saveBtnText}>Save Profile</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Current Password</Text>
                    <TextInput
                      style={styles.input}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>New Password (min. 6 chars)</Text>
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Confirm New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn]}
                    onPress={handleChangePassword}
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? (
                      <ActivityIndicator size="small" color="#0f172a" />
                    ) : (
                      <>
                        <Shield size={16} color="#0f172a" />
                        <Text style={styles.saveBtnText}>Update Password</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Sign Out Section */}
              <View style={styles.signOutSection}>
                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                  <LogOut size={16} color="#dc2626" />
                  <Text style={styles.signOutBtnText}>Sign Out (Logout)</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    minHeight: 480,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleText: {
    color: '#39ff14',
    fontSize: 18,
    fontWeight: '800',
  },
  flex1: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  branchSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 14,
    gap: 8,
  },
  emailText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  formSection: {
    gap: 14,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13.5,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  textArea: {
    height: 64,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    marginTop: 6,
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#39ff14',
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  signOutSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
});
