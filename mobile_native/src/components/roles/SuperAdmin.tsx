import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import { useSuperAdmin, Tenant, Branch } from '../../lib/SuperAdminContext';
import { apiClient as api } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/utils';
import { apiTraffic } from '../../lib/mockData';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import {
  Building2,
  Trello,
  DollarSign,
  Activity,
  AlertTriangle,
  Info,
  AlertCircle,
  Plus,
  Coins,
  Trash2,
  ArrowUpCircle,
  Ban,
  Store,
  ShoppingCart
} from 'lucide-react-native';

// Rotating avatar accent colors for the tenant showcase cards
const TENANT_AVATAR_COLORS = ['#39ff14', '#0284c7', '#f97316', '#8b5cf6'];

// Per-plan badge styling for the tenant showcase cards
const TENANT_PLAN_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  Starter: { bg: '#f1f5f9', text: '#64748b' },
  Growth: { bg: 'rgba(2, 132, 199, 0.12)', text: '#0284c7' },
  Enterprise: { bg: 'rgba(234, 179, 8, 0.16)', text: '#a16207' },
};

export function SuperAdminHome() {
  const { branch } = useAuth();
  const { platformStats, tenants, branches } = useSuperAdmin();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const activeTenantsCount = platformStats?.activeTenants ?? 0;
  const outletsCount = platformStats?.outlets ?? 0;
  const monthlyOrders = platformStats?.monthlyOrders ?? 0;
  const activeTillsCount = platformStats?.activeTills ?? 0;

  const activeTenantsList = tenants.filter((t) => t.status === 'active' || t.status === 'Active');
  const totalPages = Math.ceil(activeTenantsList.length / itemsPerPage);
  const currentTenants = activeTenantsList.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  console.log("SuperAdminHome rendering with platformStats:", platformStats);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Active Tenants" value={String(activeTenantsCount)} icon={<Building2 size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Outlets on Platform" value={String(outletsCount)} icon={<Store size={16} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Monthly Orders" value={String(monthlyOrders)} icon={<ShoppingCart size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Active Tills" value={String(activeTillsCount)} icon={<Trello size={16} color="#0284c7" />} accent="sky" />
          </View>
        </View>

        {/* Active Tenants Showcase */}
        <View style={styles.showcaseSection}>
          <View style={styles.showcaseHeader}>
            <Text style={styles.showcaseTitle}>Active tenants</Text>
            <Text style={styles.showcaseSubtitle}>
              {activeTenantsList.length} {activeTenantsList.length === 1 ? 'business' : 'businesses'} growing with you
            </Text>
          </View>

          {activeTenantsList.length === 0 ? (
            <View style={styles.showcaseEmptyState}>
              <View style={styles.showcaseEmptyIconWrap}>
                <Store size={22} color="#94a3b8" />
              </View>
              <Text style={styles.showcaseEmptyTitle}>No active tenants yet</Text>
              <Text style={styles.showcaseEmptyText}>Create your first one to see it showcased here.</Text>
            </View>
          ) : (
            <View>
              <View style={styles.showcaseGrid}>
                {currentTenants.map((t, idx) => {
                  const initial = (t.name?.trim()?.charAt(0) || '?').toUpperCase();
                  // Consistent colors based on tenant ID to avoid jumping on pagination
                  const colorIdx = t.id ? t.id.charCodeAt(0) % TENANT_AVATAR_COLORS.length : idx % TENANT_AVATAR_COLORS.length;
                  const avatarColor = TENANT_AVATAR_COLORS[colorIdx];
                  const planStyle = TENANT_PLAN_BADGE_STYLES[t.plan] ?? TENANT_PLAN_BADGE_STYLES.Starter;
                  const branchCount = branches.filter((b) => b.tenantId === t.id).length;
                  const isPremiumPlan = t.plan === 'Enterprise';

                  return (
                    <View
                      key={t.id}
                      style={[styles.tenantShowcaseCard, isPremiumPlan && styles.tenantShowcaseCardPremium, styles.showcaseCardGridItem]}
                    >
                      <View style={styles.tenantShowcaseTop}>
                        <View style={[styles.tenantAvatar, { backgroundColor: avatarColor }]}>
                          <Text style={styles.tenantAvatarText}>{initial}</Text>
                        </View>
                        <View style={styles.tenantStatusDotWrap}>
                          <View style={styles.tenantStatusDot} />
                        </View>
                      </View>

                      <Text style={styles.tenantShowcaseName} numberOfLines={1}>{t.name}</Text>

                      <View style={[styles.planBadge, { backgroundColor: planStyle.bg }]}>
                        <Text style={[styles.planBadgeText, { color: planStyle.text }]}>{t.plan}</Text>
                      </View>

                      <View style={styles.tenantShowcaseFooter}>
                        <Building2 size={11} color="#94a3b8" />
                        <Text style={styles.tenantShowcaseFooterText}>
                          {branchCount} {branchCount === 1 ? 'branch' : 'branches'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationBtn, currentPage === 0 && styles.paginationBtnDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    <Text style={[styles.paginationBtnText, currentPage === 0 && styles.paginationBtnTextDisabled]}>Prev</Text>
                  </TouchableOpacity>

                  <View style={styles.paginationDots}>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <View key={idx} style={[styles.paginationDot, currentPage === idx && styles.paginationDotActive]} />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.paginationBtn, currentPage === totalPages - 1 && styles.paginationBtnDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    <Text style={[styles.paginationBtnText, currentPage === totalPages - 1 && styles.paginationBtnTextDisabled]}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScreenBody>
    </View>
  );
}

export function SuperAdminTenants({ onOpen }: { onOpen: (id: string) => void }) {
  const { branch } = useAuth();
  const { tenants, branches, createTenant, addBranch, vatRate, inclusive } = useSuperAdmin();

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Dialog/Sheet states
  const [createOpen, setCreateOpen] = useState(false);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [manageBranchesTenantId, setManageBranchesTenantId] = useState<string | null>(null);

  // Form states - Create Tenant
  const [tenantName, setTenantName] = useState('');
  const [outletLimit, setOutletLimit] = useState('2');
  const [tillLimit, setTillLimit] = useState('6');
  const [trn, setTrn] = useState('');

  // Form states - Global Add Branch
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [branchStatus, setBranchStatus] = useState<'Active' | 'Suspended'>('Active');

  const handleCreateTenant = () => {
    if (!tenantName.trim()) {
      showToast('Please enter a chain name', 'error');
      return;
    }
    createTenant(
      tenantName,
      parseInt(outletLimit) || 2,
      parseInt(tillLimit) || 6,
      trn || '100000000000003'
    );
    showToast(`Tenant "${tenantName}" provisioned successfully`, 'success');
    setTenantName('');
    setOutletLimit('2');
    setTillLimit('6');
    setTrn('');
    setCreateOpen(false);
  };

  const handleAddBranchGlobal = () => {
    if (!selectedTenantId) {
      showToast('Please select a tenant', 'error');
      return;
    }
    if (!branchName.trim() || !branchLocation.trim()) {
      showToast('Please enter branch name and location', 'error');
      return;
    }
    try {
      addBranch(selectedTenantId, branchName, branchLocation, branchStatus);
      showToast(`Branch "${branchName}" added successfully`, 'success');
      setBranchName('');
      setBranchLocation('');
      setBranchStatus('Active');
      setSelectedTenantId('');
      setAddBranchOpen(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Tenants</Text>
          <Badge variant="neutral">{tenants.length} accounts</Badge>
        </View>

        {/* Global Action Buttons */}
        <View style={styles.globalActionRow}>
          <Button
            variant="secondary"
            style={styles.globalActionBtn}
            onClick={() => {
              if (tenants.length > 0) {
                setSelectedTenantId(tenants[0].id);
              }
              setAddBranchOpen(true);
            }}
          >
            <Building2 size={14} color="#475569" style={{ marginRight: 6 }} />
            Add Branch
          </Button>
          <Button
            variant="primary"
            style={styles.globalActionBtn}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} color="#0f172a" style={{ marginRight: 6 }} />
            Create Tenant
          </Button>
        </View>

        <View style={styles.tenantsList}>
          {tenants.map((t) => (
            <Card key={t.id} style={styles.tenantCard}>
              <View style={styles.tenantCardTop}>
                <View style={styles.tenantMeta}>
                  <Text style={styles.tenantName}>{t.name}</Text>
                  <Text style={styles.tenantCountry}>{t.country} · {t.plan} plan</Text>
                </View>
                <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
              </View>
              <View style={styles.metricGrid}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricValue}>
                    {branches.filter((b) => b.tenantId === t.id).length} / {t.outlets}
                  </Text>
                  <Text style={styles.metricLabel}>Branches</Text>
                </View>
                <View style={styles.metricColumn}><Text style={styles.metricValue}>{t.tills}</Text><Text style={styles.metricLabel}>Tills</Text></View>
                <View style={styles.metricColumn}><Text style={styles.metricValue}>N/A</Text><Text style={styles.metricLabel}>MRR</Text></View>
              </View>

              <View style={styles.cardActionsRow}>
                <Button
                  variant="secondary"
                  style={styles.cardActionBtn}
                  onClick={() => setManageBranchesTenantId(t.id)}
                >
                  Branches
                </Button>
                <Button
                  variant="ghost"
                  style={styles.cardActionBtn}
                  onClick={() => onOpen(t.id)}
                >
                  Configure
                </Button>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>

      {/* CREATE TENANT SHEET */}
      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create tenant account"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreateTenant}>Create tenant</Button>
          </View>
        }
      >
        <View style={styles.sheetForm}>
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>Chain name</Text>
            <TextInput
              placeholder="e.g. Marina Grocers LLC"
              value={tenantName}
              onChangeText={setTenantName}
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>
          <View style={styles.formRow}>
            <View style={[styles.inputItem, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Outlet limit</Text>
              <TextInput
                keyboardType="numeric"
                value={outletLimit}
                onChangeText={setOutletLimit}
                style={styles.textInput}
              />
            </View>
            <View style={[styles.inputItem, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Till limit</Text>
              <TextInput
                keyboardType="numeric"
                value={tillLimit}
                onChangeText={setTillLimit}
                style={styles.textInput}
              />
            </View>
          </View>
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>TRN (Tax Registration Number)</Text>
            <TextInput
              placeholder="100000000000003"
              value={trn}
              onChangeText={setTrn}
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>
          <View style={styles.templatePreviewBox}>
            <Text style={styles.templatePreviewText}>
              Tax template applied on creation: UAE VAT {vatRate}% · {inclusive ? 'inclusive' : 'exclusive'} pricing · AED
            </Text>
          </View>
        </View>
      </Sheet>

      {/* GLOBAL ADD BRANCH SHEET */}
      <Sheet
        open={addBranchOpen}
        onClose={() => setAddBranchOpen(false)}
        title="Add Branch"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAddBranchOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAddBranchGlobal}>Save Branch</Button>
          </View>
        }
      >
        <View style={styles.sheetForm}>
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>Select Tenant</Text>
            <View style={styles.tenantPickerScrollContainer}>
              <ScrollView style={styles.tenantPickerScroll} nestedScrollEnabled>
                {tenants.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerItem, selectedTenantId === t.id && styles.pickerItemActive]}
                    onPress={() => setSelectedTenantId(t.id)}
                  >
                    <Text style={[styles.pickerItemText, selectedTenantId === t.id && styles.pickerItemTextActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputItem, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Branch Name</Text>
              <TextInput
                placeholder="e.g. Marina Branch"
                value={branchName}
                onChangeText={setBranchName}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>
            <View style={[styles.inputItem, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                placeholder="e.g. Dubai"
                value={branchLocation}
                onChangeText={setBranchLocation}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segBtn, branchStatus === 'Active' && styles.segBtnActive]}
                onPress={() => setBranchStatus('Active')}
              >
                <Text style={[styles.segTxt, branchStatus === 'Active' && styles.segTxtActive]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segBtn, branchStatus === 'Suspended' && styles.segBtnActive]}
                onPress={() => setBranchStatus('Suspended')}
              >
                <Text style={[styles.segTxt, branchStatus === 'Suspended' && styles.segTxtActive]}>Suspended</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Sheet>

      {/* MANAGE BRANCHES SHEET (TENANT SPECIFIC) */}
      {manageBranchesTenantId && (
        <ManageBranchesSheet
          tenantId={manageBranchesTenantId}
          onClose={() => setManageBranchesTenantId(null)}
          showToast={showToast}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

function ManageBranchesSheet({ tenantId, onClose, showToast }: { tenantId: string; onClose: () => void; showToast: (msg: string, type: ToastType) => void }) {
  const { tenants, branches, addBranch, deleteBranch } = useSuperAdmin();
  const t = tenants.find((x) => x.id === tenantId);

  const [bName, setBName] = useState('');
  const [bLoc, setBLoc] = useState('');

  if (!t) return null;

  const tenantBranches = branches.filter((b) => b.tenantId === tenantId);

  const handleAdd = () => {
    if (!bName.trim() || !bLoc.trim()) {
      showToast('Please enter branch name and location', 'error');
      return;
    }
    try {
      addBranch(tenantId, bName, bLoc, 'Active');
      showToast(`Branch "${bName}" added successfully.`, 'success');
      setBName('');
      setBLoc('');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = (branch: Branch) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${branch.name}? This action cannot be undone and will decrement the tenant's outlet limit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBranch(branch.id);
              showToast(`Branch ${branch.name} has been removed.`, 'success');
            } catch (err: any) {
              const msg = err.response?.data?.error || err.message || 'Failed to delete branch';
              showToast(msg, 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <Sheet
      open={true}
      onClose={onClose}
      title={`Manage Branches — ${t.name}`}
      footer={<Button full onClick={onClose}>Close</Button>}
    >
      <View style={styles.manageBranchesContainer}>
        {/* Inline Add Form */}
        <Card style={styles.inlineAddFormCard}>
          <Text style={styles.subCardTitle}>Quick Add Branch</Text>
          <View style={styles.formRow}>
            <TextInput
              placeholder="Branch Name"
              value={bName}
              onChangeText={setBName}
              placeholderTextColor="#94a3b8"
              style={[styles.textInput, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Location"
              value={bLoc}
              onChangeText={setBLoc}
              placeholderTextColor="#94a3b8"
              style={[styles.textInput, { flex: 1 }]}
            />
          </View>
          <Button variant="primary" style={{ marginTop: 8 }} onClick={handleAdd}>
            Add Branch
          </Button>
        </Card>

        {/* Branches Table List */}
        <View style={styles.branchesListWrapper}>
          <Text style={styles.subCardTitle}>Active Branches ({tenantBranches.length})</Text>
          {tenantBranches.length === 0 ? (
            <Text style={styles.noBranchesText}>No branches registered for this tenant.</Text>
          ) : (
            tenantBranches.map((b) => (
              <View key={b.id} style={styles.branchTableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.branchTableName}>{b.name}</Text>
                  <Text style={styles.branchTableLoc}>{b.location}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Badge variant={b.status === 'Active' ? 'success' : 'warn'}>
                    {b.status}
                  </Badge>
                </View>
                <TouchableOpacity
                  style={styles.branchTableDeleteBtn}
                  onPress={() => handleDelete(b)}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </Sheet>
  );
}

export function TenantDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { tenants, branches, upgradeTenant, downgradeTenant, deleteTenant, toggleTenantStatus } = useSuperAdmin();
  const t = tenants.find((x) => x.id === id);
  const [action, setAction] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Admin Profile States
  const [adminData, setAdminData] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });

  React.useEffect(() => {
    if (action === 'admin_profile') {
      setAdminLoading(true);
      api.get(`/tenants/${id}/admin`)
        .then((res: any) => {
          if (res && res.id) {
            setAdminData(res);
            setAdminForm({ name: res.name || '', email: res.email || '', phone: res.phone || '', address: res.address || '', password: '' });
          } else {
            setAdminData(null);
            setAdminForm({ name: '', email: '', phone: '', address: '', password: '' });
          }
        })
        .catch(() => {
          setAdminData(null);
          setAdminForm({ name: '', email: '', phone: '', address: '', password: '' });
        })
        .finally(() => setAdminLoading(false));
    }
  }, [action, id]);

  const handleAdminSave = async () => {
    try {
      if (adminData) {
        await api.patch(`/tenants/${id}/admin`, {
          name: adminForm.name,
          email: adminForm.email,
          phone: adminForm.phone,
          address: adminForm.address
        });
        showToast('Admin updated successfully', 'success');
      } else {
        await api.post(`/tenants/${id}/admin`, adminForm);
        showToast('Admin created successfully', 'success');
      }
      setAction(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save admin', 'error');
    }
  };

  if (!t) return null;

  const handleActionConfirm = async () => {
    if (action === 'suspend') {
      toggleTenantStatus(t.id);
      showToast(`${t.name} status changed to ${t.status === 'suspended' ? 'active' : 'suspended'}`, 'success');
    } else if (action === 'upgrade') {
      if (t.plan === 'Enterprise') {
        showToast('Tenant is already on the highest plan', 'info');
      } else {
        upgradeTenant(t.id);
        showToast(`${t.name} upgraded successfully`, 'success');
      }
    } else if (action === 'downgrade') {
      if (t.plan === 'Starter') {
        showToast('Tenant is already on the lowest plan', 'info');
      } else {
        downgradeTenant(t.id);
        showToast(`${t.name} downgraded successfully`, 'success');
      }
    } else if (action === 'delete') {
      try {
        await deleteTenant(t.id);
        showToast(`${t.name} deleted successfully`, 'success');
        onBack();
        return;
      } catch (err: any) {
        showToast(err.message || 'Error deleting tenant', 'error');
      }
    } else if (action === 'admin_profile') {
      // Handled by custom modal layout below
    } else if (action === 'impersonate') {
      showToast(`Signing in as admin of ${t.name}...`, 'info');
    }
    setAction(null);
  };

  const tenantBranchesCount = branches.filter((b) => b.tenantId === t.id).length;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenHeader title={t.name} subtitle={`${t.plan} · ${t.country}`} onBack={onBack} />
      <ScreenBody>
        <Card style={styles.statusCard}>
          <View>
            <Text style={styles.statusSub}>Current status</Text>
            <Text style={styles.statusVal}>{t.status}</Text>
          </View>
          <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
        </Card>

        <View style={styles.statsGrid}>
          <View style={styles.thirdCol}>
            <StatCard label="Branches" value={`${tenantBranchesCount} / ${t.outlets}`} icon={<Building2 size={14} color="#475569" />} accent="ink" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Tills" value={String(t.tills)} icon={<Trello size={14} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="MRR" value="Coming Soon" icon={<Info size={14} color="#475569" />} accent="ink" />
          </View>
        </View>

        <Card style={styles.configCard}>
          <Text style={styles.configCardTitle}>Configuration</Text>
          <View style={styles.configList}>
            <DetailRow label="Plan tier" value={t.plan} />
            <DetailRow label="Country" value={t.country || 'N/A'} />
            <DetailRow label="TRN" value={t.trn || 'N/A'} />
            <DetailRow label="Billing cycle" value="Monthly" />
            <DetailRow label="Branch limit" value={`${tenantBranchesCount} / ${t.outlets}`} />
          </View>
        </Card>

        <View style={styles.actionsGrid}>
          <Button variant="secondary" onClick={() => setAction('upgrade')} style={styles.actionBtn} disabled={t.plan === 'Enterprise'}>Upgrade Plan</Button>
          <Button variant="secondary" onClick={() => setAction('downgrade')} style={styles.actionBtn} disabled={t.plan === 'Starter'}>Downgrade Plan</Button>
          <Button variant="ghost" onClick={() => setAction('admin_profile')} style={styles.actionBtn}>Admin Profile</Button>
          <Button variant="ghost" onClick={() => setAction('impersonate')} style={styles.actionBtn}>Impersonate</Button>
          <Button variant="danger" onClick={() => setAction('suspend')} style={styles.actionBtn}>{t.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>
          <Button variant="danger" onClick={() => setAction('delete')} style={styles.actionBtn}>Delete Tenant</Button>
        </View>
      </ScreenBody>

      <Sheet
        open={!!action}
        onClose={() => setAction(null)}
        title={action === 'admin_profile' ? "Admin Profile" : "Confirm action"}
        footer={
          action === 'admin_profile' ? (
            <View style={styles.sheetFooterBtnRow}>
              <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAction(null)}>Cancel</Button>
              <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAdminSave}>
                {adminData ? 'Save Changes' : 'Set Up Admin'}
              </Button>
            </View>
          ) : (
            <View style={styles.sheetFooterBtnRow}>
              <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAction(null)}>Cancel</Button>
              <Button variant={action === 'suspend' || action === 'delete' ? 'danger' : 'primary'} style={styles.sheetFooterBtn} onClick={handleActionConfirm}>Confirm</Button>
            </View>
          )
        }
      >
        {action === 'admin_profile' ? (
          <View style={{ paddingTop: 10 }}>
            {adminLoading ? (
              <Text style={{ textAlign: 'center', padding: 20 }}>Loading...</Text>
            ) : (
              <>
                {!adminData && (
                  <Text style={{ marginBottom: 16, color: '#475569', fontSize: 14 }}>
                    This tenant does not have a primary admin configured. Set one up below.
                  </Text>
                )}
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '500' }}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. John Doe"
                      value={adminForm.name}
                      onChangeText={t => setAdminForm({ ...adminForm, name: t })}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '500' }}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="admin@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={adminForm.email}
                      onChangeText={t => setAdminForm({ ...adminForm, email: t })}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '500' }}>Phone</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+1 234 567 8900"
                      keyboardType="phone-pad"
                      value={adminForm.phone}
                      onChangeText={t => setAdminForm({ ...adminForm, phone: t })}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '500' }}>Office Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123 Business Blvd"
                      value={adminForm.address}
                      onChangeText={t => setAdminForm({ ...adminForm, address: t })}
                    />
                  </View>
                  {!adminData && (
                    <View>
                      <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '500' }}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Secure password"
                        secureTextEntry
                        value={adminForm.password}
                        onChangeText={t => setAdminForm({ ...adminForm, password: t })}
                      />
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        ) : (
          <Text style={styles.confirmMsg}>
            {action === 'suspend' && `This will toggle suspension of ${t.name}. All tills and branches will reflect this status.`}
            {action === 'upgrade' && `This will upgrade ${t.name} to the next pricing tier.`}
            {action === 'downgrade' && `This will downgrade ${t.name} to the lower pricing tier.`}
            {action === 'delete' && `Are you sure you want to permanently delete ${t.name}? This action cannot be undone.`}
            {action === 'configure' && `Adjust tax templates, currency, and feature flags for ${t.name}. (Settings tab modifies these values platform-wide)`}
            {action === 'impersonate' && `You will sign in as ${t.name}'s admin to view their workspace.`}
          </Text>
        )}
      </Sheet>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function SuperAdminAnalytics() {
  const { branch } = useAuth();
  const { platformAnalytics } = useSuperAdmin();

  const series = platformAnalytics?.platformSeries || [{ t: 'Today', sales: 0 }];
  const logs = platformAnalytics?.systemLogs || [];

  const maxSales = Math.max(...series.map((s) => Number(s.sales)), 1);
  const width = 340;
  const height = 120;
  const padY = 20;

  const points = series.map((s, i) => {
    const x = series.length > 1 ? (i / (series.length - 1)) * width : width / 2;
    const y = height - padY - (Number(s.sales) / maxSales) * (height - padY * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1]?.x || width},${height} L${points[0]?.x || 0},${height} Z`;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <Text style={styles.analyticsTitle}>Platform Analytics</Text>

        <Card style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Network Sales Volume (AED 000s)</Text>
          <View style={styles.svgWrapper}>
            <Svg width="100%" height={120} viewBox="0 0 340 120" preserveAspectRatio="none">
              <Path d="M0,30 L340,30 M0,60 L340,60 M0,90 L340,90" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              {series.length > 0 && (
                <>
                  <Path d={areaPath} fill="rgba(57, 255, 20, 0.1)" stroke="none" />
                  <Path d={linePath} fill="none" stroke="#39ff14" strokeWidth="2.5" />
                  {points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#39ff14" />
                  ))}
                </>
              )}
            </Svg>
          </View>
          <View style={styles.chartLabels}>
            {series.map((s, i) => (
              <Text key={i} style={styles.chartLabelText}>{s.t}</Text>
            ))}
          </View>
        </Card>

        <Card style={styles.logsCard}>
          <Text style={styles.chartCardTitle}>System Log</Text>
          <View style={styles.logsList}>
            {logs.length === 0 ? (
              <Text style={styles.logMsg}>No recent activity</Text>
            ) : logs.map((l, idx) => (
              <View key={idx} style={styles.logRow}>
                <View style={[styles.logMetaBox, { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }]}>
                  <Text style={styles.logTime}>{l[0]}</Text>
                  <Text style={[styles.logMsg, l[1] === 'WARN' ? {color: '#f59e0b', fontWeight: 'bold'} : {color: '#39ff14', fontWeight: 'bold'}]}>{l[1]}</Text>
                  <Text style={styles.logMsg}>{l[2]}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

export function SuperAdminSettings() {
  const { branch } = useAuth();
  const { vatRate, inclusive, platformConfig, updateVatRate, updateInclusive, updatePlatformConfig } = useSuperAdmin();

  // Local state for vat input to allow editing before save
  const [localVat, setLocalVat] = useState(vatRate);

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const handleSaveTaxTemplate = () => {
    updateVatRate(localVat);
    showToast('Global tax template saved successfully.', 'success');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <Text style={styles.analyticsTitle}>Platform Settings</Text>

        {/* Global Tax Templates */}
        <Card style={styles.paddedCard}>
          <Text style={styles.chartCardTitle}>Global Tax Templates</Text>
          <View style={styles.settingsForm}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Standard VAT rate (%)</Text>
              <TextInput
                value={localVat}
                onChangeText={setLocalVat}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleText}>Tax-inclusive shelf pricing</Text>
                <Text style={styles.toggleSubtext}>Default display mode for new tenants.</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateInclusive(!inclusive)}
                style={[
                  styles.switchTrack,
                  inclusive ? styles.trackOn : styles.trackOff
                ]}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.switchThumb,
                  inclusive ? styles.thumbOn : styles.thumbOff
                ]} />
              </TouchableOpacity>
            </View>

            {/* Templates List */}
            <View style={styles.settingsListCard}>
              <Text style={styles.settingsListCardTitle}>Templates Preview</Text>
              <View style={styles.settingsListRow}>
                <Text style={styles.settingsListRowText}>· UAE VAT Standard</Text>
                <Badge variant="neutral">{localVat}%</Badge>
              </View>
              <View style={styles.settingsListRow}>
                <Text style={styles.settingsListRowText}>· UAE Zero-rated</Text>
                <Badge variant="neutral">0% (basic food)</Badge>
              </View>
              <View style={styles.settingsListRow}>
                <Text style={styles.settingsListRowText}>· Out of scope</Text>
                <Badge variant="neutral">Exempt</Badge>
              </View>
            </View>

            <Button full style={styles.saveBtn} onClick={handleSaveTaxTemplate}>Save Template</Button>
          </View>
        </Card>

        {/* Regional & Currency Settings */}
        <Card style={styles.paddedCard}>
          <Text style={styles.chartCardTitle}>Regional & Currency Settings</Text>
          <View style={styles.settingsForm}>
            <DetailRow label="Base currency" value="AED — UAE Dirham" />
            <DetailRow label="Rounding" value="Nearest 0.25 AED (cash)" />
            <DetailRow label="Fiscal calendar" value="January – December" />
            <DetailRow label="Timezone" value="Asia/Dubai (GMT+4)" />
            <DetailRow label="Data residency" value="UAE region" />

            <View style={styles.gmvContainer}>
              <Coins size={16} color="#16a34a" style={{ marginRight: 8 }} />
              <Text style={styles.gmvText}>Platform-wide GMV this month: 48.6M AED</Text>
            </View>
          </View>
        </Card>


      </ScreenBody>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (val: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleText}>{label}</Text>
      <TouchableOpacity
        onPress={() => onChange(!on)}
        style={[
          styles.switchTrack,
          on ? styles.trackOn : styles.trackOff
        ]}
        activeOpacity={0.8}
      >
        <View style={[
          styles.switchThumb,
          on ? styles.thumbOn : styles.thumbOff
        ]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: 4,
  },
  halfCol: {
    width: '50%',
    padding: 4,
  },
  thirdCol: {
    width: '33.33%',
    padding: 4,
  },
  chartCard: {
    padding: 16,
    marginVertical: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
  },
  svgWrapper: {
    height: 120,
    marginTop: 8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  chartLabelText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  subCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  planMixList: {
    gap: 10,
  },
  planMixRow: {
    gap: 4,
  },
  planMixInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planNameText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  planCountText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#39ff14',
  },
  regionsList: {
    gap: 8,
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  // Active Tenants Showcase (Home)
  showcaseSection: {
    marginTop: 6,
    marginBottom: 6,
  },
  showcaseHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  showcaseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  showcaseSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  showcaseScrollContent: {
    paddingRight: 4,
    paddingLeft: 2,
    gap: 12,
  },
  tenantShowcaseCard: {
    width: 168,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  showcaseCardGridItem: {
    width: '48%',
    marginBottom: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  paginationBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#0f172a',
  },
  paginationBtnDisabled: {
    backgroundColor: '#f1f5f9',
  },
  paginationBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paginationBtnTextDisabled: {
    color: '#94a3b8',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#39ff14',
  },
  tenantShowcaseCardPremium: {
    borderColor: 'rgba(234, 179, 8, 0.35)',
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
  },
  tenantShowcaseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tenantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tenantStatusDotWrap: {
    paddingTop: 2,
  },
  tenantStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  tenantShowcaseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 10,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tenantShowcaseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  tenantShowcaseFooterText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  showcaseEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  showcaseEmptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  showcaseEmptyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  showcaseEmptyText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  // Tenants Listing
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tenantsList: {
    gap: 12,
  },
  tenantCard: {
    padding: 16,
  },
  tenantCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenantMeta: {
    flex: 1,
    marginRight: 12,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tenantCountry: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricColumn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  metricLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  // Tenant details
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 6,
  },
  statusSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statusVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  configCard: {
    padding: 16,
    marginVertical: 8,
  },
  configCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  configList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: 12,
  },
  actionBtn: {
    width: '50%',
    padding: 4,
  },
  sheetText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  confirmMsg: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    paddingVertical: 8,
  },
  // Analytics
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  logsCard: {
    padding: 16,
    marginVertical: 6,
  },
  logsList: {
    gap: 12,
    marginTop: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  logMetaBox: {
    flex: 1,
  },
  logMsg: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  logTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  // Settings
  paddedCard: {
    padding: 16,
    marginVertical: 6,
  },
  settingsForm: {
    gap: 12,
    marginTop: 8,
  },
  inputItem: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  togglesList: {
    gap: 12,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#39ff14',
  },
  trackOff: {
    backgroundColor: '#cbd5e1',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
  saveBtn: {
    marginTop: 12,
  },

  // Global actions for Tenants list
  globalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  globalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card action buttons
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  cardActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  // Form layout in sheets
  sheetForm: {
    gap: 12,
    paddingVertical: 8,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetFooterBtn: {
    flex: 1,
  },
  templatePreviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  templatePreviewText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  // Segmented control status picker
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    marginTop: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  segTxt: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  segTxtActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  // Custom scrollable tenant picker
  tenantPickerScrollContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    marginTop: 4,
  },
  tenantPickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#39ff14',
  },
  pickerItemText: {
    fontSize: 13,
    color: '#334155',
  },
  pickerItemTextActive: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // Manage Branches design
  manageBranchesContainer: {
    gap: 16,
  },
  inlineAddFormCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  branchesListWrapper: {
    gap: 8,
    marginVertical: 8,
  },
  noBranchesText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  branchTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  branchTableName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  branchTableLoc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  branchTableDeleteBtn: {
    padding: 8,
  },
  // Settings view
  toggleSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingsListCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 8,
  },
  settingsListCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  settingsListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingsListRowText: {
    fontSize: 12,
    color: '#475569',
  },
  gmvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    padding: 10,
    marginTop: 12,
  },
  gmvText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
});