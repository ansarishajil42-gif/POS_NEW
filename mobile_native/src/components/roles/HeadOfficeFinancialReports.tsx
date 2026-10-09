import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useHeadOffice } from '../../lib/HeadOfficeContext';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Percent,
  Package,
  Boxes,
  Tag,
  Clock,
  Calendar,
  Filter,
  Layers,
  ChevronDown,
  Building2,
  Check,
  CreditCard,
  Truck,
  AlertCircle,
  Send,
  Eye,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';

type ReportTab = 'executive' | 'sales-margin' | 'ap-aging' | 'inventory' | 'vat-return' | 'branch-submissions';
type DatePreset = 'this-month' | 'last-month' | 'last-30' | 'custom';

export function HeadOfficeFinancialReports({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const {
    branches,
    getExecutiveSummary,
    getSalesMargin,
    getApAging,
    getInventoryValuation,
    getVatReturn,
    getAllBranchReports,
    approveBranchReport,
    returnBranchReport,
  } = useHeadOffice();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ReportTab>('executive');

  // Shared Filters State
  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [branchFilterOpen, setBranchFilterOpen] = useState(false);
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [executiveData, setExecutiveData] = useState<any>(null);
  const [salesMarginData, setSalesMarginData] = useState<any>(null);
  const [apAgingData, setApAgingData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [vatData, setVatData] = useState<any>(null);

  // Branch Submissions State
  const [branchSubmissionsData, setBranchSubmissionsData] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'returned'>('all');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedSubForReturn, setSelectedSubForReturn] = useState<any>(null);
  const [returnMessageText, setReturnMessageText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  const showToast = (message: string, type: ToastType = 'error') => setToast({ message, type });

  // Calculate actual ISO Date Strings for current preset
  const { startDateStr, endDateStr } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (datePreset === 'this-month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = `${year}-${pad(month + 1)}-01`;
      const end = `${year}-${pad(month + 1)}-${pad(now.getDate())}`;
      return { startDateStr: start, endDateStr: end };
    }

    if (datePreset === 'last-month') {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
      const year = lastDayOfPrevMonth.getFullYear();
      const month = lastDayOfPrevMonth.getMonth();
      const start = `${year}-${pad(month + 1)}-01`;
      const end = `${year}-${pad(month + 1)}-${pad(lastDayOfPrevMonth.getDate())}`;
      return { startDateStr: start, endDateStr: end };
    }

    if (datePreset === 'last-30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const start = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { startDateStr: start, endDateStr: end };
    }

    return {
      startDateStr: customStart || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      endDateStr: customEnd || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    };
  }, [datePreset, customStart, customEnd]);

  // Fetch report data based on active tab
  const fetchReport = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;

        if (activeTab === 'executive') {
          const res = await getExecutiveSummary(startDateStr, endDateStr, branchParam);
          if (res?.success) setExecutiveData(res.executiveSummary);
          else showToast(res?.error || 'Failed to load executive summary');
        } else if (activeTab === 'sales-margin') {
          const res = await getSalesMargin(startDateStr, endDateStr, branchParam);
          if (res?.success) setSalesMarginData(res.salesMargin);
          else showToast(res?.error || 'Failed to load sales & margin report');
        } else if (activeTab === 'ap-aging') {
          const res = await getApAging(branchParam);
          if (res?.success) setApAgingData(res.apAging);
          else showToast(res?.error || 'Failed to load A/P aging report');
        } else if (activeTab === 'inventory') {
          const res = await getInventoryValuation(branchParam);
          if (res?.success) setInventoryData(res.inventoryValuation);
          else showToast(res?.error || 'Failed to load inventory valuation');
        } else if (activeTab === 'vat-return') {
          const res = await getVatReturn(startDateStr, endDateStr, branchParam);
          if (res?.success) setVatData(res.vatReturn);
          else showToast(res?.error || 'Failed to load VAT return report');
        } else if (activeTab === 'branch-submissions') {
          const res = await getAllBranchReports({
            branchId: branchParam,
            status: statusFilter === 'all' ? undefined : statusFilter,
          });
          if (res?.success) setBranchSubmissionsData(res.submissions || []);
          else showToast(res?.error || 'Failed to load branch submissions');
        }
      } catch (err: any) {
        showToast(err?.message || 'Error fetching report');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      activeTab,
      startDateStr,
      endDateStr,
      selectedBranchId,
      statusFilter,
      getExecutiveSummary,
      getSalesMargin,
      getApAging,
      getInventoryValuation,
      getVatReturn,
      getAllBranchReports,
    ]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Approve Submission
  const handleApproveSubmission = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await approveBranchReport(id);
      if (res?.success) {
        showToast('Branch report approved and marked reviewed', 'success');
        await fetchReport(true);
      } else {
        showToast(res?.error || 'Failed to approve report', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Return Submission
  const handleReturnSubmission = async () => {
    if (!selectedSubForReturn) return;
    if (!returnMessageText.trim()) {
      showToast('Feedback message is required when returning a report', 'error');
      return;
    }
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await returnBranchReport(selectedSubForReturn.id, returnMessageText.trim());
      if (res?.success) {
        showToast('Report returned to branch manager with feedback', 'success');
        setReturnModalOpen(false);
        setSelectedSubForReturn(null);
        setReturnMessageText('');
        await fetchReport(true);
      } else {
        showToast(res?.error || 'Failed to return report', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error returning report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedBranchName = useMemo(() => {
    if (selectedBranchId === 'all') return 'All Branches';
    const found = branches.find((b) => b.id === selectedBranchId);
    return found ? found.name : 'All Branches';
  }, [selectedBranchId, branches]);

  // Tab definitions
  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'executive', label: 'Executive' },
    { key: 'sales-margin', label: 'Sales & Margin' },
    { key: 'ap-aging', label: 'A/P Aging' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'vat-return', label: 'VAT Return' },
    { key: 'branch-submissions', label: 'Branch Submissions' },
  ];

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader
        title="Financial Reports"
        subtitle="Executive P&L, margins, aging & VAT"
        onBack={onBack}
      />

      {/* Segmented Tab Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Shared Filter Bar (Date Presets + Branch Selector) */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Date Filter Pills */}
          {activeTab !== 'ap-aging' && activeTab !== 'inventory' && activeTab !== 'branch-submissions' && (
            <>
              <TouchableOpacity
                style={[styles.filterPill, datePreset === 'this-month' && styles.filterPillActive]}
                onPress={() => setDatePreset('this-month')}
              >
                <Calendar size={13} color={datePreset === 'this-month' ? '#0f172a' : '#64748b'} />
                <Text style={[styles.filterPillText, datePreset === 'this-month' && styles.filterPillTextActive]}>
                  This Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, datePreset === 'last-month' && styles.filterPillActive]}
                onPress={() => setDatePreset('last-month')}
              >
                <Text style={[styles.filterPillText, datePreset === 'last-month' && styles.filterPillTextActive]}>
                  Last Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, datePreset === 'last-30' && styles.filterPillActive]}
                onPress={() => setDatePreset('last-30')}
              >
                <Text style={[styles.filterPillText, datePreset === 'last-30' && styles.filterPillTextActive]}>
                  Last 30 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, datePreset === 'custom' && styles.filterPillActive]}
                onPress={() => setCustomDateModalOpen(true)}
              >
                <Text style={[styles.filterPillText, datePreset === 'custom' && styles.filterPillTextActive]}>
                  {datePreset === 'custom' && customStart ? `${customStart.slice(5)} ~ ${customEnd.slice(5)}` : 'Custom...'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Branch Filter Button */}
          <TouchableOpacity
            style={[styles.filterPill, selectedBranchId !== 'all' && styles.filterPillActive]}
            onPress={() => setBranchFilterOpen(true)}
          >
            <Building2 size={13} color={selectedBranchId !== 'all' ? '#0f172a' : '#64748b'} />
            <Text style={[styles.filterPillText, selectedBranchId !== 'all' && styles.filterPillTextActive]}>
              {selectedBranchName}
            </Text>
            <ChevronDown size={13} color={selectedBranchId !== 'all' ? '#0f172a' : '#64748b'} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Body with Pull to Refresh */}
      <ScreenBody
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchReport(true)} colors={['#39ff14']} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#39ff14" />
            <Text style={styles.loadingText}>Loading report data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'executive' && <ExecutiveTabContent data={executiveData} />}
            {activeTab === 'sales-margin' && <SalesMarginTabContent data={salesMarginData} />}
            {activeTab === 'ap-aging' && <ApAgingTabContent data={apAgingData} />}
            {activeTab === 'inventory' && <InventoryTabContent data={inventoryData} />}
            {activeTab === 'vat-return' && <VatReturnTabContent data={vatData} />}
            {activeTab === 'branch-submissions' && (
              <BranchSubmissionsTabContent
                submissions={branchSubmissionsData}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                actionLoading={actionLoading}
                onApprove={handleApproveSubmission}
                onOpenReturn={(sub) => {
                  setSelectedSubForReturn(sub);
                  setReturnMessageText('');
                  setReturnModalOpen(true);
                }}
                onViewSnapshot={(sub) => {
                  setSelectedSnapshot(sub);
                  setSnapshotModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </ScreenBody>

      {/* Branch Selection Modal */}
      <Modal visible={branchFilterOpen} transparent animationType="fade" onRequestClose={() => setBranchFilterOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBranchFilterOpen(false)}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Filter by Branch</Text>
              <TouchableOpacity onPress={() => setBranchFilterOpen(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              <TouchableOpacity
                style={[styles.pickerItem, selectedBranchId === 'all' && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedBranchId('all');
                  setBranchFilterOpen(false);
                }}
              >
                <Text style={[styles.pickerItemText, selectedBranchId === 'all' && styles.pickerItemTextActive]}>
                  All Branches (Consolidated)
                </Text>
                {selectedBranchId === 'all' && <Check size={16} color="#0f172a" />}
              </TouchableOpacity>

              {branches.map((b) => {
                const isSel = selectedBranchId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.pickerItem, isSel && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedBranchId(b.id);
                      setBranchFilterOpen(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSel && styles.pickerItemTextActive]}>
                      {b.name}
                    </Text>
                    {isSel && <Check size={16} color="#0f172a" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Date Range Modal */}
      <Modal visible={customDateModalOpen} transparent animationType="fade" onRequestClose={() => setCustomDateModalOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCustomDateModalOpen(false)}>
          <View style={styles.customDateCard}>
            <Text style={styles.modalTitle}>Custom Date Range</Text>
            <Text style={styles.modalSub}>Enter dates in YYYY-MM-DD format</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="2026-09-01"
                value={customStart}
                onChangeText={setCustomStart}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="2026-09-30"
                value={customEnd}
                onChangeText={setCustomEnd}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                variant="secondary"
                onClick={() => setCustomDateModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (customStart && customEnd) {
                    setDatePreset('custom');
                  }
                  setCustomDateModalOpen(false);
                }}
                style={{ flex: 1 }}
              >
                Apply
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Return Submission with Message Modal */}
      <Modal visible={returnModalOpen} transparent animationType="fade" onRequestClose={() => setReturnModalOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setReturnModalOpen(false)}>
          <View style={styles.customDateCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Return Report with Feedback</Text>
                <Text style={styles.modalSub}>
                  {selectedSubForReturn?.branchName} ({selectedSubForReturn?.periodStart} ~ {selectedSubForReturn?.periodEnd})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReturnModalOpen(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason / Required Adjustments *</Text>
              <TextInput
                style={[styles.dateInput, { height: 90, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="Explain what needs to be verified or adjusted before approval..."
                placeholderTextColor="#94a3b8"
                value={returnMessageText}
                onChangeText={setReturnMessageText}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                variant="secondary"
                onClick={() => setReturnModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReturnSubmission}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: '#dc2626' }}
              >
                {actionLoading ? 'Returning...' : 'Return with Message'}
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Snapshot Preview Modal */}
      <Modal visible={snapshotModalOpen} transparent animationType="slide" onRequestClose={() => setSnapshotModalOpen(false)}>
        <View style={styles.snapModalOverlay}>
          <View style={styles.snapModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Snapshot: {selectedSnapshot?.branchName}</Text>
                <Text style={styles.modalSub}>
                  {selectedSnapshot?.periodStart} to {selectedSnapshot?.periodEnd}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSnapshotModalOpen(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {selectedSnapshot?.snapshotData?.executiveSummary && (
                <View style={{ gap: 8, paddingVertical: 4 }}>
                  <Text style={styles.snapshotSectionTitle}>Executive Performance</Text>
                  <View style={styles.snapDetailRow}>
                    <Text style={styles.snapDetailLabel}>Total Revenue</Text>
                    <Text style={styles.snapDetailVal}>{formatCurrency(selectedSnapshot.snapshotData.executiveSummary.totalRevenue || 0)}</Text>
                  </View>
                  <View style={styles.snapDetailRow}>
                    <Text style={styles.snapDetailLabel}>Cost of Goods (COGS)</Text>
                    <Text style={styles.snapDetailVal}>{formatCurrency(selectedSnapshot.snapshotData.executiveSummary.cogs || 0)}</Text>
                  </View>
                  <View style={styles.snapDetailRow}>
                    <Text style={styles.snapDetailLabel}>Gross Profit</Text>
                    <Text style={styles.snapDetailVal}>{formatCurrency(selectedSnapshot.snapshotData.executiveSummary.grossProfit || 0)}</Text>
                  </View>
                  <View style={styles.snapDetailRow}>
                    <Text style={styles.snapDetailLabel}>Gross Margin %</Text>
                    <Text style={styles.snapDetailVal}>{(selectedSnapshot.snapshotData.executiveSummary.grossMarginPercent || 0).toFixed(1)}%</Text>
                  </View>
                  <View style={styles.snapDetailRow}>
                    <Text style={styles.snapDetailLabel}>Orders</Text>
                    <Text style={styles.snapDetailVal}>{selectedSnapshot.snapshotData.executiveSummary.orderCount || 0}</Text>
                  </View>

                  {selectedSnapshot.snapshotData.salesMargin?.tenders?.length > 0 && (
                    <>
                      <Text style={[styles.snapshotSectionTitle, { marginTop: 12 }]}>Payment Tenders</Text>
                      {selectedSnapshot.snapshotData.salesMargin.tenders.map((t: any, idx: number) => (
                        <View key={idx} style={styles.snapDetailRow}>
                          <Text style={styles.snapDetailLabel}>{t.tender}</Text>
                          <Text style={styles.snapDetailVal}>{formatCurrency(t.total)} ({t.sharePercent}%)</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

/**
 * TAB 1: Executive Summary
 */
function ExecutiveTabContent({ data }: { data: any }) {
  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No executive summary data available for this range.</Text>
      </View>
    );
  }

  const {
    totalRevenue = 0,
    cogs = 0,
    grossProfit = 0,
    grossMarginPercent = 0,
    averageOrderValue = 0,
    orderCount = 0,
    totalVatCollected = 0,
    branchPerformance = [],
  } = data;

  return (
    <View style={styles.tabContentWrapper}>
      {/* 4 StatCards Grid */}
      <View style={styles.statGrid}>
        <View style={styles.halfCol}>
          <StatCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign size={16} color="#39ff14" />}
            accent="brand"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Cost of Goods (COGS)"
            value={formatCurrency(cogs)}
            icon={<Receipt size={16} color="#dc2626" />}
            accent="rose"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Gross Profit"
            value={formatCurrency(grossProfit)}
            icon={<TrendingUp size={16} color="#0284c7" />}
            accent="sky"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Gross Margin"
            value={`${grossMarginPercent.toFixed(1)}%`}
            icon={<Percent size={16} color="#d97706" />}
            accent="amber"
          />
        </View>
      </View>

      {/* Operational Highlights Card */}
      <Card style={styles.sectionCard}>
        <Text style={styles.cardHeaderTitle}>Operational Metrics</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricSub}>Average Order</Text>
            <Text style={styles.metricVal}>{formatCurrency(averageOrderValue)}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricSub}>Completed Orders</Text>
            <Text style={styles.metricVal}>{orderCount.toLocaleString()}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricSub}>VAT Collected</Text>
            <Text style={styles.metricVal}>{formatCurrency(totalVatCollected)}</Text>
          </View>
        </View>
      </Card>

      {/* Branch Performance Breakdown */}
      <Text style={styles.sectionTitle}>Branch Performance Breakdown</Text>
      {branchPerformance.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>No branch sales recorded in selected timeframe.</Text>
        </Card>
      ) : (
        branchPerformance.map((b: any, idx: number) => (
          <Card key={b.branchId || idx} style={styles.listItemCard}>
            <View style={styles.branchHeaderRow}>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{b.branchName}</Text>
                <Text style={styles.itemSub}>{b.orderCount} orders</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(b.revenue)}</Text>
                <Badge variant="info" style={{ marginTop: 4 }}>
                  {b.contributionPercent}% share
                </Badge>
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

/**
 * TAB 2: Sales & Margin Analysis
 */
function SalesMarginTabContent({ data }: { data: any }) {
  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sales & margin data available.</Text>
      </View>
    );
  }

  const { tenders = [], channels = [], topProducts = [] } = data;

  return (
    <View style={styles.tabContentWrapper}>
      {/* Tender Breakdown */}
      <Text style={styles.sectionTitle}>Payment Tender Breakdown</Text>
      {tenders.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>No tender data found.</Text>
        </Card>
      ) : (
        <Card style={styles.sectionCard}>
          {tenders.map((t: any, idx: number) => (
            <View
              key={t.tender || idx}
              style={[styles.breakdownRow, idx > 0 && styles.rowDivider]}
            >
              <View style={styles.iconBulletWrapper}>
                <CreditCard size={16} color="#0284c7" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{t.tender}</Text>
                <Text style={styles.itemSub}>{t.count} payments</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(t.total)}</Text>
                <Badge variant="neutral" style={{ marginTop: 2 }}>
                  {t.sharePercent}%
                </Badge>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Sales Channel Breakdown */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Sales Channels</Text>
      {channels.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>No channel data found.</Text>
        </Card>
      ) : (
        <Card style={styles.sectionCard}>
          {channels.map((c: any, idx: number) => (
            <View
              key={c.channel || idx}
              style={[styles.breakdownRow, idx > 0 && styles.rowDivider]}
            >
              <View style={styles.iconBulletWrapper}>
                <Layers size={16} color="#39ff14" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{c.channel}</Text>
                <Text style={styles.itemSub}>{c.count} sales</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(c.total)}</Text>
                <Badge variant="brand" style={{ marginTop: 2 }}>
                  {c.sharePercent}%
                </Badge>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Top 10 Products */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Top 10 Products by Revenue</Text>
      {topProducts.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>No product sales recorded.</Text>
        </Card>
      ) : (
        topProducts.map((p: any, idx: number) => (
          <Card key={p.productId || idx} style={styles.listItemCard}>
            <View style={styles.branchHeaderRow}>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{p.productName}</Text>
                <Text style={styles.itemSub}>
                  SKU: {p.sku || 'N/A'} · {p.category || 'General'}
                </Text>
                <Text style={[styles.itemSub, { marginTop: 4 }]}>
                  Sold: {p.unitsSold} units · COGS: {formatCurrency(p.cogs)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(p.revenue)}</Text>
                <Badge
                  variant={p.marginPercent >= 30 ? 'success' : 'warn'}
                  style={{ marginTop: 4 }}
                >
                  {p.marginPercent}% margin
                </Badge>
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

/**
 * TAB 3: A/P Aging (Accounts Payable)
 */
function ApAgingTabContent({ data }: { data: any }) {
  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No accounts payable aging data available.</Text>
      </View>
    );
  }

  const {
    totalOutstanding = 0,
    agingBuckets = { current: 0, days1To30: 0, days31To60: 0, days60Plus: 0 },
    vendorSummary = [],
    invoices = [],
  } = data;

  return (
    <View style={styles.tabContentWrapper}>
      {/* Outstanding Total Banner */}
      <Card style={styles.outstandingCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.outstandingLabel}>Total Accounts Payable Due</Text>
            <Text style={styles.outstandingAmount}>{formatCurrency(totalOutstanding)}</Text>
          </View>
          <Badge variant="error" dot>
            Unpaid
          </Badge>
        </View>
      </Card>

      {/* 4 Aging Bucket Cards */}
      <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Aging Buckets</Text>
      <View style={styles.statGrid}>
        <View style={styles.halfCol}>
          <StatCard
            label="Current (Not Due)"
            value={formatCurrency(agingBuckets.current || 0)}
            accent="brand"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="1 - 30 Days"
            value={formatCurrency(agingBuckets.days1To30 || 0)}
            accent="sky"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="31 - 60 Days"
            value={formatCurrency(agingBuckets.days31To60 || 0)}
            accent="amber"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="60+ Days Overdue"
            value={formatCurrency(agingBuckets.days60Plus || 0)}
            accent="rose"
          />
        </View>
      </View>

      {/* Vendor Aging Summary */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Vendor Balances</Text>
      {vendorSummary.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>No outstanding vendor balances.</Text>
        </Card>
      ) : (
        vendorSummary.map((v: any, idx: number) => (
          <Card key={v.vendorId || idx} style={styles.listItemCard}>
            <View style={styles.branchHeaderRow}>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{v.vendorName}</Text>
                <Text style={styles.itemSub}>
                  {v.invoiceCount} open {v.invoiceCount === 1 ? 'invoice' : 'invoices'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(v.totalDue)}</Text>
                {v.oldestDueDays > 0 ? (
                  <Badge variant={v.oldestDueDays > 60 ? 'error' : 'warn'} style={{ marginTop: 4 }}>
                    {v.oldestDueDays}d overdue
                  </Badge>
                ) : (
                  <Badge variant="success" style={{ marginTop: 4 }}>
                    Current
                  </Badge>
                )}
              </View>
            </View>
          </Card>
        ))
      )}

      {/* Unpaid Invoices List */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Pending Invoices</Text>
      {invoices.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>All vendor invoices are settled.</Text>
        </Card>
      ) : (
        invoices.slice(0, 15).map((inv: any) => {
          const isOverdue = (inv.daysOverdue || 0) > 0;
          return (
            <Card key={inv.id} style={styles.listItemCard}>
              <View style={styles.branchHeaderRow}>
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>{inv.invoiceNumber || 'Invoice'}</Text>
                  <Text style={styles.itemSub}>{inv.vendorName}</Text>
                  <Text style={[styles.itemSub, { marginTop: 2 }]}>
                    Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemPrice}>{formatCurrency(inv.total)}</Text>
                  <Badge
                    variant={isOverdue ? (inv.daysOverdue > 60 ? 'error' : 'warn') : 'success'}
                    style={{ marginTop: 4 }}
                  >
                    {isOverdue ? `${inv.daysOverdue}d late` : 'Due Soon'}
                  </Badge>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

/**
 * TAB 4: Inventory Valuation
 */
function InventoryTabContent({ data }: { data: any }) {
  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No inventory valuation data available.</Text>
      </View>
    );
  }

  const {
    totalCostValue = 0,
    totalRetailValue = 0,
    potentialMarginValue = 0,
    potentialMarginPercent = 0,
    totalStockUnits = 0,
    productCount = 0,
    categories = [],
  } = data;

  return (
    <View style={styles.tabContentWrapper}>
      {/* 4 Valuation KPI Cards */}
      <View style={styles.statGrid}>
        <View style={styles.halfCol}>
          <StatCard
            label="Total Cost Value"
            value={formatCurrency(totalCostValue)}
            icon={<Package size={16} color="#0284c7" />}
            accent="sky"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Total Retail Value"
            value={formatCurrency(totalRetailValue)}
            icon={<Tag size={16} color="#39ff14" />}
            accent="brand"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Potential Margin"
            value={formatCurrency(potentialMarginValue)}
            sub={`${potentialMarginPercent.toFixed(1)}% margin`}
            icon={<TrendingUp size={16} color="#d97706" />}
            accent="amber"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Total Stock Units"
            value={totalStockUnits.toLocaleString()}
            sub={`${productCount} products`}
            icon={<Boxes size={16} color="#475569" />}
            accent="ink"
          />
        </View>
      </View>

      {/* Category Breakdown */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Valuation by Category</Text>
      {categories.length === 0 ? (
        <Card>
          <Text style={styles.emptySubText}>No active inventory records found.</Text>
        </Card>
      ) : (
        categories.map((c: any, idx: number) => (
          <Card key={c.category || idx} style={styles.listItemCard}>
            <View style={styles.branchHeaderRow}>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{c.category}</Text>
                <Text style={styles.itemSub}>
                  {c.productCount} SKUs · {c.totalUnits.toLocaleString()} units
                </Text>
                <Text style={[styles.itemSub, { marginTop: 2 }]}>
                  Cost: {formatCurrency(c.costValue)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(c.retailValue)}</Text>
                <Badge variant="info" style={{ marginTop: 4 }}>
                  {c.marginPercent}% margin
                </Badge>
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

/**
 * TAB 5: VAT Return Summary
 */
function VatReturnTabContent({ data }: { data: any }) {
  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No VAT return data available for this range.</Text>
      </View>
    );
  }

  const {
    outputVat = { salesCount: 0, netSalesExVat: 0, outputVat: 0, totalSalesIncVat: 0 },
    inputVat = { purchaseCount: 0, netPurchasesExVat: 0, inputVat: 0, totalPurchasesIncVat: 0 },
    netVatDue = 0,
    isPayable = true,
    trn = 'N/A',
    vatRate = '5%',
    vatInclusive = true,
    tenantName = 'Head Office',
  } = data;

  return (
    <View style={styles.tabContentWrapper}>
      {/* FTA Header Card */}
      <Card style={styles.vatHeaderCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.vatHeaderTitle}>FTA VAT 201 Return</Text>
            <Text style={styles.vatHeaderTrn}>TRN: {trn}</Text>
          </View>
          <Badge variant="brand">Rate: {vatRate}</Badge>
        </View>
        <Text style={styles.vatHeaderSub}>
          Pricing Mode: {vatInclusive ? 'VAT-Inclusive' : 'VAT-Exclusive'} · Entity: {tenantName}
        </Text>
      </Card>

      {/* 3 Primary StatCards */}
      <View style={styles.statGrid}>
        <View style={styles.halfCol}>
          <StatCard
            label="Box 1: Output VAT"
            value={formatCurrency(outputVat.outputVat)}
            sub={`${outputVat.salesCount} sales transactions`}
            icon={<DollarSign size={16} color="#39ff14" />}
            accent="brand"
          />
        </View>
        <View style={styles.halfCol}>
          <StatCard
            label="Box 9: Input VAT"
            value={formatCurrency(inputVat.inputVat)}
            sub={`${inputVat.purchaseCount} purchase orders`}
            icon={<Receipt size={16} color="#0284c7" />}
            accent="sky"
          />
        </View>
      </View>

      {/* Box 12 Net VAT Status Banner */}
      <Card style={[styles.netVatCard, isPayable ? styles.netVatPayable : styles.netVatRefundable]}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.netVatLabel}>
              Box 12: {isPayable ? 'Net VAT Payable to FTA' : 'Net VAT Refundable'}
            </Text>
            <Text style={[styles.netVatAmount, isPayable ? styles.textRose : styles.textBrand]}>
              {formatCurrency(Math.abs(netVatDue))}
            </Text>
          </View>
          <Badge variant={isPayable ? 'error' : 'success'}>
            {isPayable ? 'Payable' : 'Refund'}
          </Badge>
        </View>
      </Card>

      {/* Full Filing Summary Box Breakdown */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Tax Return Breakdown</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.breakdownRow}>
          <View style={styles.flex1}>
            <Text style={styles.itemTitle}>Standard Rated Supplies (Sales)</Text>
            <Text style={styles.itemSub}>Gross sales subject to VAT</Text>
          </View>
          <Text style={styles.itemPrice}>{formatCurrency(outputVat.netSalesExVat)}</Text>
        </View>

        <View style={[styles.breakdownRow, styles.rowDivider]}>
          <View style={styles.flex1}>
            <Text style={styles.itemTitle}>Output Tax Collected</Text>
            <Text style={styles.itemSub}>VAT charged to customers</Text>
          </View>
          <Text style={[styles.itemPrice, { color: '#39ff14' }]}>
            +{formatCurrency(outputVat.outputVat)}
          </Text>
        </View>

        <View style={[styles.breakdownRow, styles.rowDivider]}>
          <View style={styles.flex1}>
            <Text style={styles.itemTitle}>Standard Rated Expenses (Purchases)</Text>
            <Text style={styles.itemSub}>Allowable purchase costs</Text>
          </View>
          <Text style={styles.itemPrice}>{formatCurrency(inputVat.netPurchasesExVat)}</Text>
        </View>

        <View style={[styles.breakdownRow, styles.rowDivider]}>
          <View style={styles.flex1}>
            <Text style={styles.itemTitle}>Input Tax Recoverable</Text>
            <Text style={styles.itemSub}>VAT paid on vendor supplies</Text>
          </View>
          <Text style={[styles.itemPrice, { color: '#0284c7' }]}>
            -{formatCurrency(inputVat.inputVat)}
          </Text>
        </View>
      </Card>
    </View>
  );
}

/**
 * TAB 6: Branch Submissions (Head Office Review)
 */
function BranchSubmissionsTabContent({
  submissions,
  statusFilter,
  setStatusFilter,
  actionLoading,
  onApprove,
  onOpenReturn,
  onViewSnapshot,
}: {
  submissions: any[];
  statusFilter: 'all' | 'submitted' | 'reviewed' | 'returned';
  setStatusFilter: (s: 'all' | 'submitted' | 'reviewed' | 'returned') => void;
  actionLoading: boolean;
  onApprove: (id: string) => void;
  onOpenReturn: (sub: any) => void;
  onViewSnapshot: (sub: any) => void;
}) {
  const filterOptions: { key: 'all' | 'submitted' | 'reviewed' | 'returned'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'returned', label: 'Returned' },
  ];

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  return (
    <View style={styles.tabContentWrapper}>
      {/* Status Filter Tabs */}
      <View style={styles.hoStatusFilterRow}>
        {filterOptions.map((opt) => {
          const isActive = statusFilter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.hoStatusPill, isActive && styles.hoStatusPillActive]}
              onPress={() => setStatusFilter(opt.key)}
            >
              <Text style={[styles.hoStatusPillText, isActive && styles.hoStatusPillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <Send size={32} color="#94a3b8" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No Branch Submissions</Text>
          <Text style={styles.emptySubText}>
            {statusFilter === 'all'
              ? 'No branch reports have been submitted yet.'
              : `No reports with status "${statusFilter}".`}
          </Text>
        </Card>
      ) : (
        filtered.map((sub) => {
          const isReviewed = sub.status === 'reviewed';
          const isReturned = sub.status === 'returned';
          const badgeVariant = isReviewed ? 'success' : isReturned ? 'error' : 'info';
          const badgeText = isReviewed ? 'REVIEWED' : isReturned ? 'RETURNED' : 'SUBMITTED';

          const snap = sub.snapshotData?.executiveSummary;

          return (
            <Card key={sub.id} style={styles.hoSubCard}>
              <View style={styles.hoSubHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Building2 size={15} color="#0f172a" />
                    <Text style={styles.hoSubBranchTitle}>{sub.branchName || 'Branch'}</Text>
                  </View>
                  <Text style={styles.hoSubPeriodText}>
                    Period: {sub.periodStart} ~ {sub.periodEnd}
                  </Text>
                  <Text style={styles.hoSubMeta}>
                    By {sub.submittedByName || sub.submittedByEmail || 'Branch Manager'} on{' '}
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Badge variant={badgeVariant}>{badgeText}</Badge>
              </View>

              {/* Branch Notes */}
              {sub.notes ? (
                <View style={styles.hoSubNotesBox}>
                  <Text style={styles.hoSubNotesLabel}>Branch Manager Notes:</Text>
                  <Text style={styles.hoSubNotesText}>{sub.notes}</Text>
                </View>
              ) : null}

              {/* Returned Message */}
              {isReturned && sub.headOfficeMessage ? (
                <View style={styles.hoReturnedAlertBox}>
                  <AlertTriangle size={15} color="#dc2626" style={{ marginRight: 6, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hoReturnedAlertTitle}>Return Feedback to Branch:</Text>
                    <Text style={styles.hoReturnedAlertText}>{sub.headOfficeMessage}</Text>
                  </View>
                </View>
              ) : null}

              {/* Snapshot Summary Chips */}
              {snap && (
                <View style={styles.hoSnapStatsGrid}>
                  <View style={styles.hoSnapStatItem}>
                    <Text style={styles.hoSnapStatLabel}>Total Revenue</Text>
                    <Text style={styles.hoSnapStatVal}>{formatCurrency(snap.totalRevenue || 0)}</Text>
                  </View>
                  <View style={styles.hoSnapStatItem}>
                    <Text style={styles.hoSnapStatLabel}>Gross Profit</Text>
                    <Text style={styles.hoSnapStatVal}>{formatCurrency(snap.grossProfit || 0)}</Text>
                  </View>
                  <View style={styles.hoSnapStatItem}>
                    <Text style={styles.hoSnapStatLabel}>Orders</Text>
                    <Text style={styles.hoSnapStatVal}>{snap.orderCount || 0}</Text>
                  </View>
                  <View style={styles.hoSnapStatItem}>
                    <Text style={styles.hoSnapStatLabel}>Margin</Text>
                    <Text style={styles.hoSnapStatVal}>{(snap.grossMarginPercent || 0).toFixed(1)}%</Text>
                  </View>
                </View>
              )}

              {/* Reviewed Stamp */}
              {isReviewed && (
                <View style={styles.hoReviewedStamp}>
                  <CheckCircle2 size={14} color="#16a34a" style={{ marginRight: 6 }} />
                  <Text style={styles.hoReviewedStampText}>
                    Approved & Locked officially on{' '}
                    {sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString() : 'Official'}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.hoSubActionsBar}>
                <TouchableOpacity
                  style={styles.hoActionPill}
                  onPress={() => onViewSnapshot(sub)}
                >
                  <Eye size={13} color="#0284c7" style={{ marginRight: 4 }} />
                  <Text style={[styles.hoActionPillText, { color: '#0284c7' }]}>Snapshot</Text>
                </TouchableOpacity>

                {!isReviewed && (
                  <>
                    <TouchableOpacity
                      style={[styles.hoActionPill, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}
                      onPress={() => onOpenReturn(sub)}
                      disabled={actionLoading}
                    >
                      <MessageSquare size={13} color="#dc2626" style={{ marginRight: 4 }} />
                      <Text style={[styles.hoActionPillText, { color: '#dc2626' }]}>Return with Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.hoActionPill, { borderColor: '#39ff14', backgroundColor: '#f0fdf4' }]}
                      onPress={() => onApprove(sub.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 size={13} color="#16a34a" style={{ marginRight: 4 }} />
                      <Text style={[styles.hoActionPillText, { color: '#16a34a' }]}>Approve</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabBarContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 8,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  filterBar: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  tabContentWrapper: {
    paddingBottom: 24,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  halfCol: {
    width: '50%',
    paddingHorizontal: 4,
  },
  sectionCard: {
    marginVertical: 6,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f1f5f9',
  },
  metricSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 12,
  },
  listItemCard: {
    marginVertical: 4,
  },
  branchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBulletWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  outstandingCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    marginVertical: 6,
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'uppercase',
  },
  outstandingAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#991b1b',
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vatHeaderCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  vatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  vatHeaderTrn: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  vatHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
  },
  netVatCard: {
    marginVertical: 8,
    borderWidth: 1.5,
  },
  netVatPayable: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  netVatRefundable: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  netVatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  netVatAmount: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  textRose: {
    color: '#dc2626',
  },
  textBrand: {
    color: '#39ff14',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#f8fafc',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: '#0f172a',
  },
  customDateCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  dateInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  // Branch Submissions Styles (Head Office)
  hoStatusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  hoStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  hoStatusPillActive: {
    backgroundColor: '#0f172a',
  },
  hoStatusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  hoStatusPillTextActive: {
    color: '#ffffff',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  hoSubCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  hoSubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hoSubBranchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  hoSubPeriodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  hoSubMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  hoSubNotesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  hoSubNotesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  hoSubNotesText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  hoReturnedAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  hoReturnedAlertTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  hoReturnedAlertText: {
    fontSize: 12,
    color: '#991b1b',
    marginTop: 2,
  },
  hoSnapStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  hoSnapStatItem: {
    flex: 1,
  },
  hoSnapStatLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  hoSnapStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  hoReviewedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  hoReviewedStampText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  hoSubActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  hoActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hoActionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  // Snapshot Modal (HO)
  snapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  snapModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    maxHeight: '80%',
  },
  snapshotSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  snapDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  snapDetailLabel: {
    fontSize: 13,
    color: '#475569',
  },
  snapDetailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
});
