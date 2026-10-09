import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toast, ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import {
  useSuperAdmin,
  Tenant,
  Branch,
  CreateTenantInput,
  SalesVolumeSeriesItem,
  PlanDistributionItem,
  ActivityLogItem,
} from '../../lib/SuperAdminContext';
import {
  Building2,
  AlertTriangle,
  RefreshCw,
  Store,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Coins,
  Plus,
  Pencil,
  Trash2,
  Power,
  MapPin,
  Layers,
  Check,
  Activity,
  Filter,
  Clock,
  Globe,
  Calendar,
} from 'lucide-react-native';

// Helper to format dates cleanly
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

// Plan badge styling
const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Starter: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  Growth: { bg: 'rgba(2, 132, 199, 0.08)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.2)' },
  Enterprise: { bg: 'rgba(234, 179, 8, 0.1)', text: '#a16207', border: 'rgba(234, 179, 8, 0.3)' },
};

const TENANT_PLANS = ['all', 'Starter', 'Growth', 'Enterprise'];
const TENANT_STATUSES = ['all', 'Active', 'Suspended'];
const BILLING_CYCLES = ['monthly', 'quarterly', '6_months', 'yearly', 'custom'];

/**
 * SuperAdminHome Screen
 * Clean view focusing on tenant fleet management with live metrics, search, filtering, pagination, and full CRUD actions.
 */
export function SuperAdminHome() {
  const { branch } = useAuth();
  const {
    tenants,
    tenantsTotal,
    tenantsPage,
    tenantsLimit,
    loading,
    error,
    fetchTenants,
    refreshAll,
    createTenant,
    updateTenant,
    toggleTenantStatus,
    archiveTenant,
    getTenantBranches,
    addBranch,
  } = useSuperAdmin();

  const [refreshing, setRefreshing] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Tenant Filters State
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantPlan, setTenantPlan] = useState('all');
  const [tenantStatus, setTenantStatus] = useState('all');
  const [currentTenantPage, setCurrentTenantPage] = useState(1);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [branchesTenant, setBranchesTenant] = useState<Tenant | null>(null);
  const [archiveTenantItem, setArchiveTenantItem] = useState<Tenant | null>(null);
  const [planPickerTenant, setPlanPickerTenant] = useState<Tenant | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch tenants on filter/page change
  useEffect(() => {
    fetchTenants({
      search: tenantSearch,
      plan: tenantPlan,
      status: tenantStatus,
      page: currentTenantPage,
      limit: 10,
    }).catch(() => {});
  }, [tenantSearch, tenantPlan, tenantStatus, currentTenantPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (t: Tenant) => {
    setActionLoadingId(t.id);
    try {
      const res = await toggleTenantStatus(t.id);
      if (res.success) {
        showToast(`${t.name} is now ${res.status || 'updated'}.`, 'success');
      } else {
        showToast(res.error || 'Failed to update tenant status', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalTenantPages = Math.max(1, Math.ceil(tenantsTotal / (tenantsLimit || 10)));
  const activeTenantsCount = tenants.filter((t) => (t.status || '').toLowerCase() === 'active').length;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#39ff14" />
        }
      >
          {/* Header Action Bar */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.screenMainTitle}>Super Admin Dashboard</Text>
              <Text style={styles.screenSubtitle}>Platform overview & tenant fleet monitoring</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading || refreshing}>
              <RefreshCw size={16} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.halfCol}>
              <StatCard
                label="Total Tenants"
                value={String(tenantsTotal)}
                icon={<Building2 size={16} color="#39ff14" />}
                accent="brand"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Active Tenants"
                value={String(activeTenantsCount)}
                icon={<Store size={16} color="#0284c7" />}
                accent="sky"
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ========================================================= */}
          {/* TENANTS LIST WITH SEARCH, FILTERS & ROW ACTIONS */}
          {/* ========================================================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithIcon}>
                <Building2 size={18} color="#0f172a" />
                <Text style={styles.sectionTitle}>Tenants Fleet</Text>
              </View>
              <TouchableOpacity
                style={styles.createTenantBtn}
                onPress={() => setCreateModalOpen(true)}
                activeOpacity={0.8}
              >
                <Plus size={14} color="#0f172a" />
                <Text style={styles.createTenantBtnText}>Create Tenant</Text>
              </TouchableOpacity>
            </View>

            {/* Tenant Search Bar */}
            <View style={styles.searchBarContainer}>
              <Search size={15} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tenant by name or subdomain..."
                placeholderTextColor="#94a3b8"
                value={tenantSearch}
                onChangeText={(txt) => {
                  setTenantSearch(txt);
                  setCurrentTenantPage(1);
                }}
              />
              {tenantSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTenantSearch('')} style={styles.clearBtn}>
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Tenant Filter Pills: Plan */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Plan:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                {TENANT_PLANS.map((p) => {
                  const active = tenantPlan === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.filterPill, active && styles.filterPillActive]}
                      onPress={() => {
                        setTenantPlan(p);
                        setCurrentTenantPage(1);
                      }}
                    >
                      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                        {p === 'all' ? 'All Plans' : p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tenant Filter Pills: Status */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                {TENANT_STATUSES.map((s) => {
                  const active = tenantStatus === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.filterPill, active && styles.filterPillActive]}
                      onPress={() => {
                        setTenantStatus(s);
                        setCurrentTenantPage(1);
                      }}
                    >
                      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                        {s === 'all' ? 'All Statuses' : s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tenants Cards */}
            {tenants.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Building2 size={24} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No matching tenants</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search query or filter options.</Text>
              </Card>
            ) : (
              <View style={styles.cardsList}>
                {tenants.map((t) => {
                  const planStyle = PLAN_COLORS[t.plan] || PLAN_COLORS.Starter;
                  const isSuspended = (t.status || '').toLowerCase() === 'suspended';

                  return (
                    <Card key={t.id} style={styles.itemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={styles.itemTitleBlock}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{t.name}</Text>
                          <Text style={styles.itemSubdomain}>
                            {t.subdomain ? `${t.subdomain}.cloudynationpos.com` : 'No subdomain set'}
                          </Text>
                        </View>
                        <Badge variant={isSuspended ? 'error' : 'success'}>
                          {t.status || 'Active'}
                        </Badge>
                      </View>

                      {/* Plan Badge + Plan Switcher Trigger */}
                      <View style={styles.itemBadgeRow}>
                        <TouchableOpacity
                          style={[styles.customPlanBadge, { backgroundColor: planStyle.bg, borderColor: planStyle.border }]}
                          onPress={() => setPlanPickerTenant(t)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.customPlanBadgeText, { color: planStyle.text }]}>
                            {t.plan || 'Starter'} ▾
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Details Grid */}
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Outlet Usage</Text>
                          <Text style={styles.detailValue}>
                            {t.branchCount || 0} of {t.outletLimit || 2} outlets
                          </Text>
                        </View>

                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Period End Date</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(t.currentPeriodEndDate)}
                          </Text>
                        </View>
                      </View>

                      {/* Per-Tenant Action Buttons */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setEditTenant(t)}
                          activeOpacity={0.7}
                        >
                          <Pencil size={13} color="#0284c7" />
                          <Text style={[styles.actionBtnText, { color: '#0284c7' }]}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setBranchesTenant(t)}
                          activeOpacity={0.7}
                        >
                          <Store size={13} color="#475569" />
                          <Text style={styles.actionBtnText}>Branches</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, isSuspended ? styles.actionBtnGreen : styles.actionBtnAmber]}
                          onPress={() => handleToggleStatus(t)}
                          disabled={actionLoadingId === t.id}
                          activeOpacity={0.7}
                        >
                          {actionLoadingId === t.id ? (
                            <ActivityIndicator size="small" color={isSuspended ? '#16a34a' : '#d97706'} />
                          ) : (
                            <>
                              <Power size={13} color={isSuspended ? '#16a34a' : '#d97706'} />
                              <Text style={[styles.actionBtnText, { color: isSuspended ? '#16a34a' : '#d97706' }]}>
                                {isSuspended ? 'Reactivate' : 'Suspend'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnRed]}
                          onPress={() => setArchiveTenantItem(t)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={13} color="#dc2626" />
                          <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Archive</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            {/* Tenants Pagination Bar */}
            {totalTenantPages > 1 && (
              <View style={styles.paginationBar}>
                <TouchableOpacity
                  style={[styles.paginationBtn, currentTenantPage <= 1 && styles.paginationBtnDisabled]}
                  onPress={() => setCurrentTenantPage((p) => Math.max(1, p - 1))}
                  disabled={currentTenantPage <= 1}
                >
                  <ChevronLeft size={16} color={currentTenantPage <= 1 ? '#94a3b8' : '#0f172a'} />
                  <Text style={[styles.paginationBtnText, currentTenantPage <= 1 && styles.paginationBtnTextDisabled]}>
                    Prev
                  </Text>
                </TouchableOpacity>

                <Text style={styles.paginationPageIndicator}>
                  Page {currentTenantPage} of {totalTenantPages}
                </Text>

                <TouchableOpacity
                  style={[styles.paginationBtn, currentTenantPage >= totalTenantPages && styles.paginationBtnDisabled]}
                  onPress={() => setCurrentTenantPage((p) => Math.min(totalTenantPages, p + 1))}
                  disabled={currentTenantPage >= totalTenantPages}
                >
                  <Text style={[styles.paginationBtnText, currentTenantPage >= totalTenantPages && styles.paginationBtnTextDisabled]}>
                    Next
                  </Text>
                  <ChevronRight size={16} color={currentTenantPage >= totalTenantPages ? '#94a3b8' : '#0f172a'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
      </ScreenBody>

      {/* MODALS */}
      <CreateTenantModal
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createTenant}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      {editTenant && (
        <EditTenantModal
          visible={!!editTenant}
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSubmit={(data) => updateTenant(editTenant.id, data)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {branchesTenant && (
        <ManageBranchesModal
          visible={!!branchesTenant}
          tenant={branchesTenant}
          onClose={() => setBranchesTenant(null)}
          getBranches={() => getTenantBranches(branchesTenant.id)}
          onAddBranch={(data) => addBranch(branchesTenant.id, data)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {archiveTenantItem && (
        <ArchiveTenantModal
          visible={!!archiveTenantItem}
          tenant={archiveTenantItem}
          onClose={() => setArchiveTenantItem(null)}
          onConfirm={() => archiveTenant(archiveTenantItem.id)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {planPickerTenant && (
        <PlanPickerModal
          visible={!!planPickerTenant}
          tenant={planPickerTenant}
          onClose={() => setPlanPickerTenant(null)}
          onSelectPlan={(newPlan) => updateTenant(planPickerTenant.id, { plan: newPlan })}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* Screen-level Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

/**
 * SuperAdminTenants Screen
 * Dedicated view listing tenants accounts with quick search and management actions.
 */
export function SuperAdminTenants({ onOpen }: { onOpen: (id: string) => void }) {
  const { branch } = useAuth();
  const {
    tenants,
    loading,
    refreshAll,
    createTenant,
    updateTenant,
    toggleTenantStatus,
    archiveTenant,
    getTenantBranches,
    addBranch,
  } = useSuperAdmin();

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [branchesTenant, setBranchesTenant] = useState<Tenant | null>(null);
  const [archiveTenantItem, setArchiveTenantItem] = useState<Tenant | null>(null);
  const [planPickerTenant, setPlanPickerTenant] = useState<Tenant | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (t: Tenant) => {
    setActionLoadingId(t.id);
    try {
      const res = await toggleTenantStatus(t.id);
      if (res.success) {
        showToast(`${t.name} is now ${res.status || 'updated'}.`, 'success');
      } else {
        showToast(res.error || 'Failed to update tenant status', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.screenMainTitle}>Tenant Accounts</Text>
              <Text style={styles.screenSubtitle}>{tenants.length} accounts listed</Text>
            </View>
            <TouchableOpacity
              style={styles.createTenantBtn}
              onPress={() => setCreateModalOpen(true)}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#0f172a" />
              <Text style={styles.createTenantBtnText}>Create Tenant</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#39ff14" />
            </View>
          )}

          <View style={styles.cardsList}>
            {tenants.map((t) => {
              const planStyle = PLAN_COLORS[t.plan] || PLAN_COLORS.Starter;
              const isSuspended = (t.status || '').toLowerCase() === 'suspended';

              return (
                <Card key={t.id} style={styles.itemCard}>
                  <TouchableOpacity onPress={() => onOpen(t.id)} activeOpacity={0.8}>
                    <View style={styles.itemCardTop}>
                      <View style={styles.itemTitleBlock}>
                        <Text style={styles.itemTitle}>{t.name}</Text>
                        <Text style={styles.itemSubdomain}>
                          {t.subdomain ? `${t.subdomain}.cloudynationpos.com` : 'No subdomain'}
                        </Text>
                      </View>
                      <Badge variant={isSuspended ? 'error' : 'success'}>
                        {t.status || 'Active'}
                      </Badge>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.itemBadgeRow}>
                    <TouchableOpacity
                      style={[styles.customPlanBadge, { backgroundColor: planStyle.bg, borderColor: planStyle.border }]}
                      onPress={() => setPlanPickerTenant(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.customPlanBadgeText, { color: planStyle.text }]}>{t.plan || 'Starter'} ▾</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Outlet Usage</Text>
                      <Text style={styles.detailValue}>
                        {t.branchCount || 0} of {t.outletLimit || 2} outlets
                      </Text>
                    </View>

                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Subscription End</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(t.currentPeriodEndDate)}
                      </Text>
                    </View>
                  </View>

                  {/* Row actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setEditTenant(t)}>
                      <Pencil size={13} color="#0284c7" />
                      <Text style={[styles.actionBtnText, { color: '#0284c7' }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setBranchesTenant(t)}>
                      <Store size={13} color="#475569" />
                      <Text style={styles.actionBtnText}>Branches</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, isSuspended ? styles.actionBtnGreen : styles.actionBtnAmber]}
                      onPress={() => handleToggleStatus(t)}
                      disabled={actionLoadingId === t.id}
                    >
                      <Power size={13} color={isSuspended ? '#16a34a' : '#d97706'} />
                      <Text style={[styles.actionBtnText, { color: isSuspended ? '#16a34a' : '#d97706' }]}>
                        {isSuspended ? 'Reactivate' : 'Suspend'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnRed]}
                      onPress={() => setArchiveTenantItem(t)}
                    >
                      <Trash2 size={13} color="#dc2626" />
                      <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Archive</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* MODALS */}
      <CreateTenantModal
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createTenant}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      {editTenant && (
        <EditTenantModal
          visible={!!editTenant}
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSubmit={(data) => updateTenant(editTenant.id, data)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {branchesTenant && (
        <ManageBranchesModal
          visible={!!branchesTenant}
          tenant={branchesTenant}
          onClose={() => setBranchesTenant(null)}
          getBranches={() => getTenantBranches(branchesTenant.id)}
          onAddBranch={(data) => addBranch(branchesTenant.id, data)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {archiveTenantItem && (
        <ArchiveTenantModal
          visible={!!archiveTenantItem}
          tenant={archiveTenantItem}
          onClose={() => setArchiveTenantItem(null)}
          onConfirm={() => archiveTenant(archiveTenantItem.id)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {planPickerTenant && (
        <PlanPickerModal
          visible={!!planPickerTenant}
          tenant={planPickerTenant}
          onClose={() => setPlanPickerTenant(null)}
          onSelectPlan={(newPlan) => updateTenant(planPickerTenant.id, { plan: newPlan })}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* Screen-level Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

/**
 * TenantDetail Screen
 */
export function TenantDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { tenants } = useSuperAdmin();
  const t = tenants.find((x) => x.id === id);

  if (!t) {
    return (
      <View style={styles.flex1}>
        <AppHeader roleLabel="SA" branch={branch} />
        <ScreenHeader title="Tenant Not Found" onBack={onBack} />
        <ScreenBody>
          <Text style={styles.emptySubtitle}>The requested tenant could not be found.</Text>
        </ScreenBody>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenHeader title={t.name} subtitle={`${t.plan} Plan`} onBack={onBack} />
      <ScreenBody>
        <Card style={styles.itemCard}>
          <Text style={styles.itemTitle}>{t.name}</Text>
          <Text style={styles.itemSubdomain}>{t.subdomain ? `${t.subdomain}.cloudynationpos.com` : 'No subdomain'}</Text>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.detailLabel}>Status: {t.status}</Text>
            <Text style={styles.detailLabel}>Outlet Usage: {t.branchCount || 0} of {t.outletLimit} outlets</Text>
            <Text style={styles.detailLabel}>Period End: {formatDate(t.currentPeriodEndDate)}</Text>
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

/**
 * SuperAdminAnalytics Screen
 * Real-time Fleet GMV, Sales Volume Series, Tier Distribution & Audit Logs
 */
export function SuperAdminAnalytics({ onBack }: { onBack?: () => void } = {}) {
  const { branch } = useAuth();
  const { tenants, getSalesVolume, getPlanDistribution, getActivityLog } = useSuperAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [totalGmv, setTotalGmv] = useState<number>(0);
  const [platformSeries, setPlatformSeries] = useState<SalesVolumeSeriesItem[]>([]);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [planData, setPlanData] = useState<{ total: number; breakdown: PlanDistributionItem[] }>({
    total: 0,
    breakdown: [],
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadData = async (tenantId = selectedTenantId) => {
    try {
      const [salesRes, planRes, logsRes] = await Promise.all([
        getSalesVolume(tenantId !== 'all' ? { tenantId } : undefined),
        getPlanDistribution(),
        getActivityLog({ limit: 15 }),
      ]);

      if (salesRes.success) {
        setTotalGmv(salesRes.totalGmv || 0);
        setPlatformSeries(salesRes.platformSeries || []);
        setOrderCount(salesRes.orderCount || 0);
      }
      if (planRes.success) {
        setPlanData({
          total: planRes.total || 0,
          breakdown: planRes.breakdown || [],
        });
      }
      if (logsRes.success) {
        setActivityLogs(logsRes.logs || []);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load analytics', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedTenantId);
  }, [selectedTenantId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(selectedTenantId);
  };

  const selectedTenantName =
    selectedTenantId === 'all'
      ? 'All Tenants (Fleet-wide)'
      : tenants.find((t) => t.id === selectedTenantId)?.name || 'Selected Tenant';

  const maxSeriesSales = Math.max(...platformSeries.map((s) => Number(s.sales) || 0), 1);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      {onBack && (
        <ScreenHeader
          title="Platform Analytics"
          subtitle="Fleet GMV, tier distribution & audit trails"
          onBack={onBack}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <ScreenBody>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {!onBack && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.screenMainTitle}>Platform Analytics</Text>
              <Text style={styles.screenSubtitle}>Fleet GMV, tier distribution & audit trails</Text>
            </View>
          )}

          {/* Tenant Drilldown Filter */}
          <View style={analyticsStyles.section}>
            <View style={analyticsStyles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Filter size={14} color="#0f172a" />
                <Text style={analyticsStyles.sectionTitle}>Tenant Drilldown</Text>
              </View>
              <Text style={analyticsStyles.scopeSubtitle} numberOfLines={1}>
                {selectedTenantName}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={analyticsStyles.pillsContainer}
            >
              <TouchableOpacity
                style={[
                  analyticsStyles.scopePill,
                  selectedTenantId === 'all' && analyticsStyles.scopePillActive,
                ]}
                onPress={() => setSelectedTenantId('all')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    analyticsStyles.scopePillText,
                    selectedTenantId === 'all' && analyticsStyles.scopePillTextActive,
                  ]}
                >
                  All Tenants ({tenants.length})
                </Text>
              </TouchableOpacity>

              {tenants.map((t) => {
                const isActive = selectedTenantId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[analyticsStyles.scopePill, isActive && analyticsStyles.scopePillActive]}
                    onPress={() => setSelectedTenantId(t.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        analyticsStyles.scopePillText,
                        isActive && analyticsStyles.scopePillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Core Stat Cards */}
          <View style={[styles.statsGrid, { marginTop: 4 }]}>
            <View style={styles.halfCol}>
              <StatCard
                label="Sales Volume (GMV)"
                value={`${Number(totalGmv || 0).toLocaleString()} AED`}
                sub={selectedTenantId === 'all' ? 'Network-wide' : 'Tenant total'}
                accent="brand"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Completed Orders"
                value={String(orderCount || 0)}
                sub="Processed"
                accent="sky"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Registered Fleet"
                value={String(planData.total || tenants.length)}
                sub="Active accounts"
                accent="amber"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="System Health"
                value="99.98%"
                sub="Operational"
                accent="rose"
              />
            </View>
          </View>

          {/* Sales Volume Visual Chart */}
          <Card style={analyticsStyles.cardContainer}>
            <View style={analyticsStyles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[analyticsStyles.iconBadge, { backgroundColor: '#f0fdf4' }]}>
                  <TrendingUp size={16} color="#39ff14" />
                </View>
                <View>
                  <Text style={analyticsStyles.cardTitle}>Sales Volume Timeline</Text>
                  <Text style={analyticsStyles.cardSubtitle}>
                    Daily GMV aggregation for {selectedTenantName}
                  </Text>
                </View>
              </View>
            </View>

            {loading ? (
              <View style={analyticsStyles.loadingBox}>
                <ActivityIndicator size="small" color="#0f172a" />
              </View>
            ) : platformSeries.length === 0 ? (
              <View style={analyticsStyles.emptyBox}>
                <Text style={analyticsStyles.emptyText}>No sales recorded for this scope</Text>
              </View>
            ) : (
              <View style={analyticsStyles.barList}>
                {platformSeries.map((item, idx) => {
                  const val = Number(item.sales) || 0;
                  const percent = Math.max(6, Math.min(100, Math.round((val / maxSeriesSales) * 100)));
                  return (
                    <View key={idx} style={analyticsStyles.barRow}>
                      <View style={analyticsStyles.barLabelCol}>
                        <Text style={analyticsStyles.barDateText}>{item.t}</Text>
                        <Text style={analyticsStyles.barAmountText}>
                          {val.toLocaleString()} AED
                        </Text>
                      </View>
                      <View style={analyticsStyles.barTrack}>
                        <View
                          style={[
                            analyticsStyles.barFill,
                            {
                              width: `${percent}%`,
                              backgroundColor: val > 0 ? '#39ff14' : '#cbd5e1',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Tenant Plan Distribution Breakdown */}
          <Card style={analyticsStyles.cardContainer}>
            <View style={analyticsStyles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[analyticsStyles.iconBadge, { backgroundColor: '#f0f9ff' }]}>
                  <Layers size={16} color="#0284c7" />
                </View>
                <View>
                  <Text style={analyticsStyles.cardTitle}>Tenant Plan Distribution</Text>
                  <Text style={analyticsStyles.cardSubtitle}>
                    {planData.total} total active accounts across tiers
                  </Text>
                </View>
              </View>
            </View>

            <View style={analyticsStyles.planList}>
              {(planData.breakdown.length > 0
                ? planData.breakdown
                : [
                    { plan: 'Starter', count: 0, percentage: 0 },
                    { plan: 'Growth', count: 0, percentage: 0 },
                    { plan: 'Enterprise', count: 0, percentage: 0 },
                  ]
              ).map((p) => {
                const planColor =
                  p.plan === 'Enterprise'
                    ? { bar: '#a855f7', badge: 'brand' as const }
                    : p.plan === 'Growth'
                    ? { bar: '#0284c7', badge: 'info' as const }
                    : { bar: '#64748b', badge: 'neutral' as const };

                return (
                  <View key={p.plan} style={analyticsStyles.planRow}>
                    <View style={analyticsStyles.planInfoRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Badge variant={planColor.badge}>{p.plan}</Badge>
                        <Text style={analyticsStyles.planCountText}>{p.count} tenants</Text>
                      </View>
                      <Text style={analyticsStyles.planPercentText}>{p.percentage}%</Text>
                    </View>
                    <View style={analyticsStyles.planTrack}>
                      <View
                        style={[
                          analyticsStyles.planFill,
                          {
                            width: `${Math.max(3, p.percentage)}%`,
                            backgroundColor: planColor.bar,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Live System Activity Log */}
          <Card style={analyticsStyles.cardContainer}>
            <View style={analyticsStyles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[analyticsStyles.iconBadge, { backgroundColor: '#fffbeb' }]}>
                  <Activity size={16} color="#d97706" />
                </View>
                <View>
                  <Text style={analyticsStyles.cardTitle}>System Activity Log</Text>
                  <Text style={analyticsStyles.cardSubtitle}>
                    Real-time platform events & audit actions
                  </Text>
                </View>
              </View>
            </View>

            {loading ? (
              <View style={analyticsStyles.loadingBox}>
                <ActivityIndicator size="small" color="#0f172a" />
              </View>
            ) : activityLogs.length === 0 ? (
              <View style={analyticsStyles.emptyBox}>
                <Text style={analyticsStyles.emptyText}>No recent platform events recorded</Text>
              </View>
            ) : (
              <View style={analyticsStyles.logList}>
                {activityLogs.map((log) => {
                  const isSuccess =
                    log.action.toLowerCase().includes('create') ||
                    log.action.toLowerCase().includes('payment') ||
                    log.action.toLowerCase().includes('active');
                  const isWarn =
                    log.action.toLowerCase().includes('suspend') ||
                    log.action.toLowerCase().includes('delete') ||
                    log.action.toLowerCase().includes('archive');

                  const variant = isWarn ? 'warn' : isSuccess ? 'success' : 'info';

                  return (
                    <View key={log.id} style={analyticsStyles.logItem}>
                      <View style={analyticsStyles.logHeaderRow}>
                        <Text style={analyticsStyles.logActionText}>{log.action}</Text>
                        <Badge variant={variant}>{log.entityType}</Badge>
                      </View>
                      <View style={analyticsStyles.logMetaRow}>
                        {log.tenantName && (
                          <Text style={analyticsStyles.logTenantText}>
                            Tenant: {log.tenantName}
                          </Text>
                        )}
                        {log.userName && (
                          <Text style={analyticsStyles.logUserText}>By: {log.userName}</Text>
                        )}
                        <Text style={analyticsStyles.logDateText}>
                          {formatDate(log.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </ScrollView>
      </ScreenBody>
    </View>
  );
}

/**
 * SuperAdminSettings Screen
 * Tax & Currency Settings: UAE VAT, Inclusive/Exclusive mode, Base Currency, Timezone & Date Format
 */
export function SuperAdminSettings({ onBack }: { onBack?: () => void } = {}) {
  const { branch } = useAuth();
  const { getPlatformSettings, updatePlatformSettings } = useSuperAdmin();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vatRate, setVatRate] = useState('5.00');
  const [vatInclusive, setVatInclusive] = useState(true);
  const [currency, setCurrency] = useState('AED');
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getPlatformSettings();
        if (res.success && res.settings) {
          if (res.settings.vatRate !== undefined) setVatRate(String(res.settings.vatRate));
          if (res.settings.vatInclusive !== undefined) setVatInclusive(Boolean(res.settings.vatInclusive));
          if (res.settings.currency) setCurrency(res.settings.currency);
          if (res.settings.timezone) setTimezone(res.settings.timezone);
          if (res.settings.dateFormat) setDateFormat(res.settings.dateFormat);
        }
      } catch (err: any) {
        setToast({ message: err.message || 'Failed to load platform settings', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updatePlatformSettings({
        vatRate: vatRate.trim(),
        vatInclusive,
        currency,
        timezone,
        dateFormat,
      });

      if (res.success) {
        setToast({ message: res.message || 'Platform settings updated successfully', type: 'success' });
      } else {
        setToast({ message: res.error || 'Failed to update platform settings', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update platform settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const currencyOptions = ['AED', 'SAR', 'USD', 'EUR'];
  const timezoneOptions = [
    { label: 'Dubai (GST +04:00)', value: 'Asia/Dubai' },
    { label: 'Riyadh (AST +03:00)', value: 'Asia/Riyadh' },
    { label: 'UTC (GMT +00:00)', value: 'UTC' },
    { label: 'New York (EST/EDT)', value: 'America/New_York' },
    { label: 'London (GMT/BST)', value: 'Europe/London' },
  ];
  const dateFormatOptions = [
    { label: 'DD/MM/YYYY (Standard)', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY (US Format)', value: 'MM/DD/YYYY' },
    { label: 'YYYY-MM-DD (ISO Format)', value: 'YYYY-MM-DD' },
  ];

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      {onBack && (
        <ScreenHeader
          title="Tax & Currency Settings"
          subtitle="UAE VAT rates, financial currency & regional localization"
          onBack={onBack}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <ScreenBody>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
        >
          {!onBack && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.screenMainTitle}>Tax & Currency Settings</Text>
              <Text style={styles.screenSubtitle}>
                UAE VAT rates, financial currency & regional localization
              </Text>
            </View>
          )}

          {loading ? (
            <View style={settingsStyles.loadingCenter}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={settingsStyles.loadingText}>Loading platform configuration...</Text>
            </View>
          ) : (
            <>
              {/* VAT Configuration Card */}
              <Card style={settingsStyles.sectionCard}>
                <View style={settingsStyles.sectionHeader}>
                  <View style={[settingsStyles.iconBadge, { backgroundColor: '#f0fdf4' }]}>
                    <Coins size={18} color="#39ff14" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.sectionTitle}>Value-Added Tax (VAT)</Text>
                    <Text style={settingsStyles.sectionSubtitle}>
                      Regional tax applied to transactions across all tenant tills
                    </Text>
                  </View>
                </View>

                {/* VAT Rate Input */}
                <View style={settingsStyles.fieldGroup}>
                  <Text style={settingsStyles.fieldLabel}>Standard VAT Rate (%)</Text>
                  <View style={settingsStyles.inputWithSuffix}>
                    <TextInput
                      style={settingsStyles.textInput}
                      value={vatRate}
                      onChangeText={setVatRate}
                      placeholder="5.00"
                      keyboardType="numeric"
                    />
                    <Text style={settingsStyles.inputSuffix}>%</Text>
                  </View>
                  <Text style={settingsStyles.fieldHint}>
                    UAE Federal Tax Authority standard rate is 5.00%.
                  </Text>
                </View>

                {/* Tax Inclusive Toggle */}
                <View style={settingsStyles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={settingsStyles.toggleTitle}>Tax-Inclusive Pricing</Text>
                    <Text style={settingsStyles.toggleDesc}>
                      {vatInclusive
                        ? 'Active: Displayed product prices on POS and receipts already include VAT.'
                        : 'Inactive: VAT will be calculated and added on top of item prices at checkout.'}
                    </Text>
                  </View>
                  <Switch
                    value={vatInclusive}
                    onValueChange={setVatInclusive}
                    trackColor={{ false: '#cbd5e1', true: '#39ff14' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </Card>

              {/* Currency Selector Card */}
              <Card style={settingsStyles.sectionCard}>
                <View style={settingsStyles.sectionHeader}>
                  <View style={[settingsStyles.iconBadge, { backgroundColor: '#f0f9ff' }]}>
                    <Globe size={18} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.sectionTitle}>Base Platform Currency</Text>
                    <Text style={settingsStyles.sectionSubtitle}>
                      Standard billing, reporting & subscription currency
                    </Text>
                  </View>
                </View>

                <View style={settingsStyles.currencyGrid}>
                  {currencyOptions.map((curr) => {
                    const isSelected = currency === curr;
                    return (
                      <TouchableOpacity
                        key={curr}
                        style={[
                          settingsStyles.currencyPill,
                          isSelected && settingsStyles.currencyPillSelected,
                        ]}
                        onPress={() => setCurrency(curr)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            settingsStyles.currencyText,
                            isSelected && settingsStyles.currencyTextSelected,
                          ]}
                        >
                          {curr}
                        </Text>
                        {isSelected && <Check size={14} color="#ffffff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>

              {/* Timezone Card */}
              <Card style={settingsStyles.sectionCard}>
                <View style={settingsStyles.sectionHeader}>
                  <View style={[settingsStyles.iconBadge, { backgroundColor: '#fffbeb' }]}>
                    <Clock size={18} color="#d97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.sectionTitle}>Regional Timezone</Text>
                    <Text style={settingsStyles.sectionSubtitle}>
                      Used for daily sales cutoff, reporting aggregation and timestamps
                    </Text>
                  </View>
                </View>

                <View style={settingsStyles.optionsList}>
                  {timezoneOptions.map((tz) => {
                    const isSelected = timezone === tz.value;
                    return (
                      <TouchableOpacity
                        key={tz.value}
                        style={[
                          settingsStyles.radioOption,
                          isSelected && settingsStyles.radioOptionSelected,
                        ]}
                        onPress={() => setTimezone(tz.value)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            settingsStyles.radioOptionText,
                            isSelected && settingsStyles.radioOptionTextSelected,
                          ]}
                        >
                          {tz.label}
                        </Text>
                        {isSelected && <Check size={16} color="#39ff14" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>

              {/* Date Format Card */}
              <Card style={settingsStyles.sectionCard}>
                <View style={settingsStyles.sectionHeader}>
                  <View style={[settingsStyles.iconBadge, { backgroundColor: '#f1f5f9' }]}>
                    <Calendar size={18} color="#475569" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.sectionTitle}>Date Format</Text>
                    <Text style={settingsStyles.sectionSubtitle}>
                      Preferred date display format across invoices, reports and tables
                    </Text>
                  </View>
                </View>

                <View style={settingsStyles.optionsList}>
                  {dateFormatOptions.map((df) => {
                    const isSelected = dateFormat === df.value;
                    return (
                      <TouchableOpacity
                        key={df.value}
                        style={[
                          settingsStyles.radioOption,
                          isSelected && settingsStyles.radioOptionSelected,
                        ]}
                        onPress={() => setDateFormat(df.value)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            settingsStyles.radioOptionText,
                            isSelected && settingsStyles.radioOptionTextSelected,
                          ]}
                        >
                          {df.label}
                        </Text>
                        {isSelected && <Check size={16} color="#39ff14" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>

              {/* Save Button */}
              <TouchableOpacity
                style={[settingsStyles.saveButton, saving && settingsStyles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <>
                    <Check size={18} color="#0f172a" />
                    <Text style={settingsStyles.saveButtonText}>Save Platform Settings</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ScreenBody>
    </View>
  );
}

const analyticsStyles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  scopeSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    maxWidth: 180,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  scopePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scopePillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  scopePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  scopePillTextActive: {
    color: '#ffffff',
  },
  cardContainer: {
    marginTop: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  barList: {
    gap: 12,
  },
  barRow: {
    gap: 4,
  },
  barLabelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barDateText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  barAmountText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  planList: {
    gap: 12,
  },
  planRow: {
    gap: 6,
  },
  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCountText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  planPercentText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  planTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  planFill: {
    height: '100%',
    borderRadius: 4,
  },
  logList: {
    gap: 10,
  },
  logItem: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  logMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  logTenantText: {
    fontSize: 10,
    color: '#64748b',
  },
  logUserText: {
    fontSize: 10,
    color: '#64748b',
  },
  logDateText: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 'auto',
  },
});

const settingsStyles = StyleSheet.create({
  loadingCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionCard: {
    marginBottom: 14,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#0f172a',
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    paddingLeft: 8,
  },
  fieldHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  currencyPillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  currencyTextSelected: {
    color: '#ffffff',
  },
  optionsList: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  radioOptionSelected: {
    borderColor: '#39ff14',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  radioOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  radioOptionTextSelected: {
    color: '#0f172a',
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39ff14',
    height: 48,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
});

/* ========================================================================= */
/* MODAL COMPONENTS                                                         */
/* ========================================================================= */

interface CreateTenantModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTenantInput) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: (msg: string) => void;
}

function CreateTenantModal({ visible, onClose, onSubmit, onSuccess }: CreateTenantModalProps) {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [plan, setPlan] = useState('Starter');
  const [cycle, setCycle] = useState('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [outlets, setOutlets] = useState('2');
  const [tills, setTills] = useState('5');
  const [trn, setTrn] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // In-modal toast
  const [modalToast, setModalToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showModalToast = (message: string, type: ToastType = 'error') => setModalToast({ message, type });

  // Update default outlet/till limits based on plan
  useEffect(() => {
    if (plan === 'Starter') {
      setOutlets('1');
      setTills('3');
    } else if (plan === 'Growth') {
      setOutlets('10');
      setTills('10');
    } else if (plan === 'Enterprise') {
      setOutlets('999');
      setTills('999');
    }
  }, [plan]);

  const handleSubmit = async () => {
    if (!name.trim()) return showModalToast('Please enter a chain/tenant name.', 'error');
    if (!subdomain.trim()) return showModalToast('Please enter a unique subdomain.', 'error');
    if (!adminName.trim()) return showModalToast('Please enter the primary admin full name.', 'error');
    if (!adminEmail.trim()) return showModalToast('Please enter a valid admin email.', 'error');
    if (!adminPassword.trim()) return showModalToast('Please enter an initial password for the admin.', 'error');

    setSubmitting(true);
    try {
      const res = await onSubmit({
        name: name.trim(),
        subdomain: subdomain.trim(),
        plan,
        billingCycle: cycle,
        customDays: cycle === 'custom' ? parseInt(customDays) || 30 : undefined,
        outlets: parseInt(outlets) || undefined,
        tills: parseInt(tills) || undefined,
        trn: trn.trim() || undefined,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: adminPhone.trim() || undefined,
        adminAddress: adminAddress.trim() || undefined,
        adminPassword: adminPassword.trim(),
      });

      if (res.success) {
        onClose();
        onSuccess?.(`${name} provisioned successfully with main branch.`);
        // Reset form
        setName('');
        setSubdomain('');
        setAdminName('');
        setAdminEmail('');
        setAdminPhone('');
        setAdminAddress('');
        setAdminPassword('');
        setTrn('');
      } else {
        showModalToast(res.error || 'Failed to create tenant.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.modalCardLarge}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Provision New Tenant</Text>
              <Text style={styles.modalSubtitle}>Create tenant chain, primary branch & head office admin</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
            {/* Business Info */}
            <Text style={styles.formSectionHeader}>Business Profile</Text>

            <Text style={styles.fieldLabel}>Chain Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Al Madina Supermarket"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Subdomain *</Text>
            <View style={styles.subdomainInputRow}>
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="e.g. almadina"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                value={subdomain}
                onChangeText={(t) => setSubdomain(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <Text style={styles.subdomainSuffix}>.cloudynationpos.com</Text>
            </View>

            {/* Plan Selector */}
            <Text style={styles.fieldLabel}>Subscription Plan</Text>
            <View style={styles.pillsRow}>
              {['Starter', 'Growth', 'Enterprise'].map((p) => {
                const active = plan === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.modalPill, active && styles.modalPillActive]}
                    onPress={() => setPlan(p)}
                  >
                    <Text style={[styles.modalPillText, active && styles.modalPillTextActive]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Billing Cycle */}
            <Text style={styles.fieldLabel}>Billing Cycle</Text>
            <View style={styles.pillsRow}>
              {BILLING_CYCLES.map((c) => {
                const active = cycle === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.modalPill, active && styles.modalPillActive]}
                    onPress={() => setCycle(c)}
                  >
                    <Text style={[styles.modalPillText, active && styles.modalPillTextActive]}>
                      {c === '6_months' ? '6 Months' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {cycle === 'custom' && (
              <>
                <Text style={styles.fieldLabel}>Custom Days *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 45"
                  keyboardType="numeric"
                  value={customDays}
                  onChangeText={setCustomDays}
                />
              </>
            )}

            {/* Limits & Tax */}
            <View style={styles.twoColRow}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Outlet Limit</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={outlets}
                  onChangeText={setOutlets}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Till Limit</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={tills}
                  onChangeText={setTills}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Tax Registration Number (TRN)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 100234567800003"
              placeholderTextColor="#94a3b8"
              value={trn}
              onChangeText={setTrn}
            />

            {/* Primary Admin */}
            <Text style={[styles.formSectionHeader, { marginTop: 18 }]}>Primary Admin Setup</Text>

            <Text style={styles.fieldLabel}>Admin Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Tariq Al-Mansoor"
              placeholderTextColor="#94a3b8"
              value={adminName}
              onChangeText={setAdminName}
            />

            <Text style={styles.fieldLabel}>Admin Email (Login Username) *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. admin@almadina.ae"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={adminEmail}
              onChangeText={setAdminEmail}
            />

            <Text style={styles.fieldLabel}>Admin Phone</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+971 50 123 4567"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={adminPhone}
              onChangeText={setAdminPhone}
            />

            <Text style={styles.fieldLabel}>Initial Password *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
            />
          </ScrollView>

          <View style={styles.modalActionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Text style={styles.submitBtnText}>Create Tenant</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal-level Toast */}
          {modalToast && (
            <Toast
              message={modalToast.message}
              type={modalToast.type}
              onHide={() => setModalToast(null)}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface EditTenantModalProps {
  visible: boolean;
  tenant: Tenant;
  onClose: () => void;
  onSubmit: (data: { name?: string; plan?: string; outletLimit?: number; tillLimit?: number; trn?: string }) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: (msg: string) => void;
}

function EditTenantModal({ visible, tenant, onClose, onSubmit, onSuccess }: EditTenantModalProps) {
  const [name, setName] = useState(tenant.name || '');
  const [plan, setPlan] = useState(tenant.plan || 'Starter');
  const [outlets, setOutlets] = useState(String(tenant.outletLimit || 2));
  const [tills, setTills] = useState('5');
  const [trn, setTrn] = useState(tenant.trn || '');
  const [submitting, setSubmitting] = useState(false);

  // In-modal toast
  const [modalToast, setModalToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showModalToast = (message: string, type: ToastType = 'error') => setModalToast({ message, type });

  const handleSubmit = async () => {
    if (!name.trim()) return showModalToast('Name cannot be empty.', 'error');
    setSubmitting(true);
    try {
      const res = await onSubmit({
        name: name.trim(),
        plan,
        outletLimit: parseInt(outlets) || undefined,
        tillLimit: parseInt(tills) || undefined,
        trn: trn.trim() || undefined,
      });
      if (res.success) {
        onClose();
        onSuccess?.('Tenant profile updated successfully.');
      } else {
        showModalToast(res.error || 'Failed to update tenant', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Tenant Profile</Text>
              <Text style={styles.modalSubtitle}>{tenant.subdomain}.cloudynationpos.com</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Chain Name *</Text>
            <TextInput style={styles.formInput} value={name} onChangeText={setName} />

            <Text style={styles.fieldLabel}>Subscription Plan</Text>
            <View style={styles.pillsRow}>
              {['Starter', 'Growth', 'Enterprise'].map((p) => {
                const active = plan === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.modalPill, active && styles.modalPillActive]}
                    onPress={() => setPlan(p)}
                  >
                    <Text style={[styles.modalPillText, active && styles.modalPillTextActive]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Outlet Limit</Text>
                <TextInput style={styles.formInput} keyboardType="numeric" value={outlets} onChangeText={setOutlets} />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Till Limit</Text>
                <TextInput style={styles.formInput} keyboardType="numeric" value={tills} onChangeText={setTills} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Tax Registration Number (TRN)</Text>
            <TextInput style={styles.formInput} placeholder="Optional" value={trn} onChangeText={setTrn} />
          </ScrollView>

          <View style={styles.modalActionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal-level Toast */}
          {modalToast && (
            <Toast
              message={modalToast.message}
              type={modalToast.type}
              onHide={() => setModalToast(null)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface ManageBranchesModalProps {
  visible: boolean;
  tenant: Tenant;
  onClose: () => void;
  getBranches: () => Promise<{ success: boolean; branches: Branch[]; error?: string }>;
  onAddBranch: (data: { name: string; address?: string }) => Promise<{ success: boolean; error?: string; branch?: any }>;
  onSuccess?: (msg: string) => void;
}

function ManageBranchesModal({ visible, tenant, onClose, getBranches, onAddBranch, onSuccess }: ManageBranchesModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [adding, setAdding] = useState(false);

  // In-modal toast
  const [modalToast, setModalToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showModalToast = (message: string, type: ToastType = 'success') => setModalToast({ message, type });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await getBranches();
      if (res.success) {
        setBranches(res.branches);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAdd = async () => {
    if (!newBranchName.trim()) {
      return showModalToast('Please enter a branch name.', 'error');
    }
    const limit = tenant.outletLimit || 2;
    if (branches.length >= limit) {
      return showModalToast(
        `Outlet limit reached (${branches.length}/${limit}). Upgrade plan to add more branches.`,
        'error'
      );
    }

    setAdding(true);
    try {
      const res = await onAddBranch({
        name: newBranchName.trim(),
        address: newBranchAddress.trim() || undefined,
      });
      if (res.success) {
        showModalToast(`Branch "${newBranchName}" added successfully.`, 'success');
        setNewBranchName('');
        setNewBranchAddress('');
        fetchBranches();
        onSuccess?.(`Branch "${newBranchName}" added to ${tenant.name}.`);
      } else {
        showModalToast(res.error || 'Failed to add branch.', 'error');
      }
    } finally {
      setAdding(false);
    }
  };

  const limit = tenant.outletLimit || 2;
  const isAtLimit = branches.length >= limit;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCardLarge}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Manage Branches</Text>
              <Text style={styles.modalSubtitle}>
                {tenant.name} — {branches.length} of {limit} outlets used
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
            {/* Inline Add Branch Form */}
            <View style={styles.addBranchCard}>
              <Text style={styles.addBranchTitle}>Add New Branch</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Branch Name (e.g. Downtown Outlet)"
                placeholderTextColor="#94a3b8"
                value={newBranchName}
                onChangeText={setNewBranchName}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Location / Address (optional)"
                placeholderTextColor="#94a3b8"
                value={newBranchAddress}
                onChangeText={setNewBranchAddress}
              />
              <TouchableOpacity
                style={[styles.addBranchSubmitBtn, (adding || isAtLimit) && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={adding || isAtLimit}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <>
                    <Plus size={14} color="#0f172a" />
                    <Text style={styles.addBranchSubmitText}>
                      {isAtLimit ? 'Outlet Limit Reached' : 'Add Branch'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Branches List */}
            <Text style={[styles.formSectionHeader, { marginTop: 14 }]}>Existing Outlets ({branches.length})</Text>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#39ff14" />
              </View>
            ) : branches.length === 0 ? (
              <Text style={styles.emptySubtitle}>No active branches found for this tenant.</Text>
            ) : (
              branches.map((b) => (
                <View key={b.id} style={styles.branchListItem}>
                  <View style={styles.flex1}>
                    <Text style={styles.branchListName}>{b.name}</Text>
                    <View style={styles.branchListLocationRow}>
                      <MapPin size={11} color="#64748b" />
                      <Text style={styles.branchListAddress}>{b.address || 'No address set'}</Text>
                    </View>
                  </View>
                  <Badge variant="success">Active</Badge>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.modalActionsRow}>
            <TouchableOpacity style={styles.submitBtn} onPress={onClose}>
              <Text style={styles.submitBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Modal-level Toast */}
          {modalToast && (
            <Toast
              message={modalToast.message}
              type={modalToast.type}
              onHide={() => setModalToast(null)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface ArchiveTenantModalProps {
  visible: boolean;
  tenant: Tenant;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; error?: string; message?: string }>;
  onSuccess?: (msg: string) => void;
}

function ArchiveTenantModal({ visible, tenant, onClose, onConfirm, onSuccess }: ArchiveTenantModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // In-modal toast
  const [modalToast, setModalToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showModalToast = (message: string, type: ToastType = 'error') => setModalToast({ message, type });

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await onConfirm();
      if (res.success) {
        onClose();
        onSuccess?.(`${tenant.name} has been archived successfully.`);
      } else {
        showModalToast(res.error || 'Failed to archive tenant', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCardSmall}>
          <View style={styles.archiveIconCircle}>
            <Trash2 size={24} color="#dc2626" />
          </View>
          <Text style={styles.archiveTitle}>Archive Tenant?</Text>
          <Text style={styles.archiveSubtitle}>
            Are you sure you want to archive <Text style={{ fontWeight: '700', color: '#0f172a' }}>{tenant.name}</Text>?
            {'\n\n'}
            This will block tenant users from logging in and preserve all financial audit records.
          </Text>

          <View style={styles.modalActionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.archiveConfirmBtn, submitting && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.archiveConfirmBtnText}>Archive Tenant</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal-level Toast */}
          {modalToast && (
            <Toast
              message={modalToast.message}
              type={modalToast.type}
              onHide={() => setModalToast(null)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface PlanPickerModalProps {
  visible: boolean;
  tenant: Tenant;
  onClose: () => void;
  onSelectPlan: (newPlan: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: (msg: string) => void;
}

function PlanPickerModal({ visible, tenant, onClose, onSelectPlan, onSuccess }: PlanPickerModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // In-modal toast
  const [modalToast, setModalToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showModalToast = (message: string, type: ToastType = 'error') => setModalToast({ message, type });

  const handleSelect = async (newPlan: string) => {
    if (newPlan === tenant.plan) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      const res = await onSelectPlan(newPlan);
      if (res.success) {
        onClose();
        onSuccess?.(`${tenant.name} updated to ${newPlan} plan.`);
      } else {
        showModalToast(res.error || 'Failed to change plan', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCardSmall}>
          <Text style={styles.modalTitle}>Upgrade / Change Plan</Text>
          <Text style={styles.modalSubtitle}>{tenant.name} (Currently {tenant.plan})</Text>

          <View style={{ gap: 10, marginVertical: 14 }}>
            {[
              { plan: 'Starter', desc: '1 outlet • 3 tills • 10k orders/mo' },
              { plan: 'Growth', desc: '10 outlets • 10 tills • 150k orders/mo' },
              { plan: 'Enterprise', desc: 'Unlimited outlets & tills • Dedicated' },
            ].map((item) => {
              const active = tenant.plan === item.plan;
              return (
                <TouchableOpacity
                  key={item.plan}
                  style={[styles.planOptionCard, active && styles.planOptionCardActive]}
                  onPress={() => handleSelect(item.plan)}
                  disabled={submitting}
                >
                  <View style={styles.flex1}>
                    <Text style={[styles.planOptionTitle, active && styles.planOptionTitleActive]}>
                      {item.plan}
                    </Text>
                    <Text style={styles.planOptionDesc}>{item.desc}</Text>
                  </View>
                  {active && <Check size={16} color="#39ff14" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>

          {/* Modal-level Toast */}
          {modalToast && (
            <Toast
              message={modalToast.message}
              type={modalToast.type}
              onHide={() => setModalToast(null)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ========================================================================= */
/* STYLES                                                                    */
/* ========================================================================= */

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  createTenantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39ff14',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  createTenantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  halfCol: {
    width: '50%',
    padding: 4,
  },
  centerBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    flex: 1,
  },
  sectionContainer: {
    marginTop: 14,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    width: 52,
  },
  filterPillsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  cardsList: {
    gap: 10,
    marginTop: 4,
  },
  itemCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemSubdomain: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  customPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  customPlanBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnAmber: {
    borderColor: '#fef3c7',
    backgroundColor: '#fffbeb',
  },
  actionBtnGreen: {
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
  },
  actionBtnRed: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  paginationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  paginationBtnDisabled: {
    opacity: 0.4,
    borderColor: '#f1f5f9',
  },
  paginationBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  paginationBtnTextDisabled: {
    color: '#94a3b8',
  },
  paginationPageIndicator: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCardLarge: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCardSmall: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFormScroll: {
    marginTop: 10,
    marginBottom: 10,
  },
  formSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  subdomainInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subdomainSuffix: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  modalPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  modalPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  modalPillTextActive: {
    color: '#ffffff',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#39ff14',
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  addBranchCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  addBranchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  addBranchSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39ff14',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  addBranchSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  branchListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 6,
  },
  branchListName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  branchListLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  branchListAddress: {
    fontSize: 11,
    color: '#64748b',
  },
  archiveIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  archiveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  archiveSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  archiveConfirmBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  archiveConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  planOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  planOptionCardActive: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  planOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  planOptionTitleActive: {
    color: '#ffffff',
  },
  planOptionDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});

export { SuperAdminBillingStatus } from './SuperAdminBillingStatus';