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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Field } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useHeadOffice } from '../../lib/HeadOfficeContext';
import {
  DollarSign,
  Users,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Calendar,
  Edit3,
  X,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react-native';

type PayrollTab = 'profiles' | 'attendance' | 'leaves' | 'runs';

const TABS: { key: PayrollTab; label: string }[] = [
  { key: 'profiles', label: 'Salary Profiles' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leaves', label: 'Leave Requests' },
  { key: 'runs', label: 'Payroll Runs' },
];

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  unpaid: 'Unpaid Leave',
  emergency: 'Emergency Leave',
  maternity_paternity: 'Maternity / Paternity',
};

const ATTENDANCE_STATUSES = [
  { id: 'present', label: 'Present', hours: 8, dotColor: '#10b981', bg: '#f0fdf4' },
  { id: 'absent', label: 'Absent', hours: 0, dotColor: '#f43f5e', bg: '#fff1f2' },
  { id: 'half_day', label: 'Half Day', hours: 4, dotColor: '#f59e0b', bg: '#fffbeb' },
  { id: 'on_leave', label: 'On Leave', hours: 0, dotColor: '#a855f7', bg: '#faf5ff' },
  { id: 'rest_day', label: 'Rest Day', hours: 0, dotColor: '#3b82f6', bg: '#eff6ff' },
  { id: 'public_holiday', label: 'Public Holiday', hours: 0, dotColor: '#06b6d4', bg: '#ecfeff' },
  { id: 'unmarked', label: 'Unmarked', hours: 0, dotColor: '#94a3b8', bg: '#f8fafc' },
];

export function HeadOfficePayroll({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const {
    branches,
    getSalaryProfiles,
    saveSalaryProfile,
    getAttendance,
    markAttendance,
    bulkMarkPresent,
    getPendingLeaves,
    reviewLeave,
    generateRun,
    getRuns,
    getRunDetail,
    regenerateRun,
    approveRun,
    markRunPaid,
    deleteRun,
    getPayslip,
  } = useHeadOffice();

  // Active Sub-Tab State
  const [activeTab, setActiveTab] = useState<PayrollTab>('profiles');

  // Shared Filters
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [branchFilterOpen, setBranchFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const selectedBranchName = useMemo(() => {
    if (selectedBranchId === 'all') return 'All Outlets';
    const found = branches.find((b) => b.id === selectedBranchId);
    return found ? found.name : 'All Outlets';
  }, [selectedBranchId, branches]);

  // ============================================================================
  // TAB 1: SALARY PROFILES (Phase 1)
  // ============================================================================
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesRefreshing, setProfilesRefreshing] = useState(false);

  // Edit Salary Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const [basicSalary, setBasicSalary] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');
  const [standardDeductions, setStandardDeductions] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [joinDate, setJoinDate] = useState('');

  const loadProfiles = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setProfilesRefreshing(true);
      else setProfilesLoading(true);

      try {
        const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
        const res = await getSalaryProfiles(branchParam, searchQuery);
        if (res?.success) {
          setProfiles(res.staffProfiles || []);
        } else {
          showToast(res?.error || 'Failed to load salary profiles', 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Error connecting to payroll server', 'error');
      } finally {
        setProfilesLoading(false);
        setProfilesRefreshing(false);
      }
    },
    [selectedBranchId, searchQuery, getSalaryProfiles]
  );

  const handleOpenEditProfile = (staff: any) => {
    setSelectedStaff(staff);
    setBasicSalary(staff.basicSalary ? String(staff.basicSalary) : '');
    setHousingAllowance(staff.housingAllowance ? String(staff.housingAllowance) : '');
    setTransportAllowance(staff.transportAllowance ? String(staff.transportAllowance) : '');
    setOtherAllowances(staff.otherAllowances ? String(staff.otherAllowances) : '');
    setStandardDeductions(staff.standardDeductions ? String(staff.standardDeductions) : '');
    setPaymentFrequency(staff.paymentFrequency || 'monthly');
    setBankName(staff.bankName || '');
    setIban(staff.iban || '');
    setJoinDate(staff.joinDate || '');
    setEditModalOpen(true);
  };

  const liveCalc = useMemo(() => {
    const basic = parseFloat(basicSalary) || 0;
    const housing = parseFloat(housingAllowance) || 0;
    const transport = parseFloat(transportAllowance) || 0;
    const other = parseFloat(otherAllowances) || 0;
    const deductions = parseFloat(standardDeductions) || 0;

    const totalAllowances = housing + transport + other;
    const gross = basic + totalAllowances;
    const net = Math.max(0, gross - deductions);

    return { basic, housing, transport, other, deductions, totalAllowances, gross, net };
  }, [basicSalary, housingAllowance, transportAllowance, otherAllowances, standardDeductions]);

  const handleSaveProfile = async () => {
    if (!selectedStaff) return;
    setSubmittingProfile(true);

    try {
      const payload = {
        staffUserId: selectedStaff.staffId,
        basicSalary: parseFloat(basicSalary) || 0,
        housingAllowance: parseFloat(housingAllowance) || 0,
        transportAllowance: parseFloat(transportAllowance) || 0,
        otherAllowances: parseFloat(otherAllowances) || 0,
        standardDeductions: parseFloat(standardDeductions) || 0,
        paymentFrequency,
        currency: 'AED',
        bankName: bankName.trim() || null,
        iban: iban.trim() || null,
        joinDate: joinDate.trim() || null,
      };

      const res = await saveSalaryProfile(payload);
      if (res?.success) {
        showToast('Salary profile updated successfully!', 'success');
        setEditModalOpen(false);
        loadProfiles(true);
      } else {
        showToast(res?.error || 'Failed to save salary profile', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving salary profile', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const totalMonthlyGross = useMemo(
    () => profiles.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
    [profiles]
  );
  const totalConfigured = useMemo(
    () => profiles.filter((p) => p.hasProfile).length,
    [profiles]
  );

  // ============================================================================
  // TAB 2: ATTENDANCE TRACKING (Phase 2)
  // ============================================================================
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceRoster, setAttendanceRoster] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
    restDay: 0,
    publicHoliday: 0,
    unmarked: 0,
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [bulkMarking, setBulkMarking] = useState(false);
  const [updatingAttendanceStaffId, setUpdatingAttendanceStaffId] = useState<string | null>(null);
  const [statusPickerStaff, setStatusPickerStaff] = useState<any | null>(null);

  const loadAttendance = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setAttendanceLoading(true);
      try {
        const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
        const res = await getAttendance(attendanceDate, branchParam);
        if (res?.success) {
          setAttendanceRoster(res.roster || []);
          if (res.summary) setAttendanceSummary(res.summary);
        } else {
          showToast(res?.error || 'Failed to load attendance', 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Error loading attendance', 'error');
      } finally {
        setAttendanceLoading(false);
      }
    },
    [attendanceDate, selectedBranchId, getAttendance]
  );

  const handlePrevDay = () => {
    const d = new Date(attendanceDate);
    d.setDate(d.getDate() - 1);
    setAttendanceDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(attendanceDate);
    d.setDate(d.getDate() + 1);
    setAttendanceDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setAttendanceDate(new Date().toISOString().slice(0, 10));
  };

  const handleBulkMarkPresent = async () => {
    setBulkMarking(true);
    try {
      const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
      const res = await bulkMarkPresent(attendanceDate, branchParam);
      if (res?.success) {
        showToast(`Marked ${res.markedCount || 'all'} staff as present!`, 'success');
        loadAttendance(true);
      } else {
        showToast(res?.error || 'Failed to bulk mark attendance', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error marking attendance', 'error');
    } finally {
      setBulkMarking(false);
    }
  };

  const handleMarkSingleStaff = async (staffId: string, status: string, hours: number) => {
    setUpdatingAttendanceStaffId(staffId);
    try {
      const res = await markAttendance({
        staffUserId: staffId,
        date: attendanceDate,
        status,
        hoursWorked: hours,
      });
      if (res?.success) {
        // Optimistically update local state
        setAttendanceRoster((prev) =>
          prev.map((item) =>
            item.staffId === staffId
              ? { ...item, status, hoursWorked: hours, attendanceId: res.record?.id || item.attendanceId }
              : item
          )
        );
        showToast('Attendance recorded', 'success');
      } else {
        showToast(res?.error || 'Failed to record attendance', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error recording attendance', 'error');
    } finally {
      setUpdatingAttendanceStaffId(null);
    }
  };

  // Filter attendance roster by search
  const filteredAttendanceRoster = useMemo(() => {
    if (!searchQuery.trim()) return attendanceRoster;
    const q = searchQuery.toLowerCase().trim();
    return attendanceRoster.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.role && s.role.toLowerCase().includes(q))
    );
  }, [attendanceRoster, searchQuery]);

  // ============================================================================
  // TAB 3: LEAVE MANAGEMENT (Phase 3)
  // ============================================================================
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [leavesFilterStatus, setLeavesFilterStatus] = useState('all');
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leavesPage, setLeavesPage] = useState(1);
  const [leavesTotalPages, setLeavesTotalPages] = useState(1);
  const [leavesTotal, setLeavesTotal] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadLeaves = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLeavesLoading(true);
      try {
        const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
        const statusParam = leavesFilterStatus === 'all' ? undefined : leavesFilterStatus;
        const res = await getPendingLeaves(statusParam, branchParam, leavesPage, 15);
        if (res?.success) {
          setLeavesList(res.leaveRequests || []);
          setLeavesTotal(res.total || 0);
          setLeavesTotalPages(res.totalPages || 1);
        } else {
          showToast(res?.error || 'Failed to load leave requests', 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Error loading leave requests', 'error');
      } finally {
        setLeavesLoading(false);
      }
    },
    [leavesFilterStatus, selectedBranchId, leavesPage, getPendingLeaves]
  );

  const handleReviewLeave = async (id: string, status: 'approved' | 'rejected') => {
    setReviewingId(id);
    try {
      const res = await reviewLeave(id, status);
      if (res?.success) {
        showToast(
          status === 'approved'
            ? 'Leave approved! Attendance roster updated automatically.'
            : 'Leave request rejected.',
          'success'
        );
        loadLeaves(true);
      } else {
        showToast(res?.error || 'Failed to update leave request', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error reviewing leave', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  // ============================================================================
  // TAB 4: PAYROLL RUNS (Phase 4)
  // ============================================================================
  const [runMonth, setRunMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [runsList, setRunsList] = useState<any[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [generatingRun, setGeneratingRun] = useState(false);

  // Detail Modal State
  const [selectedRunDetail, setSelectedRunDetail] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [runActionLoading, setRunActionLoading] = useState(false);

  // Payslip Modal State (Phase 5)
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const handleOpenPayslip = async (staffUserId: string) => {
    if (!selectedRunDetail?.run?.id) return;
    setPayslipLoading(true);
    setPayslipModalOpen(true);
    try {
      const res = await getPayslip(selectedRunDetail.run.id, staffUserId);
      if (res?.success && res.payslip) {
        setSelectedPayslip(res.payslip);
      } else {
        showToast(res?.error || 'Failed to load payslip data', 'error');
        setPayslipModalOpen(false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error loading payslip', 'error');
      setPayslipModalOpen(false);
    } finally {
      setPayslipLoading(false);
    }
  };

  const loadRuns = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setRunsLoading(true);
      try {
        const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
        const res = await getRuns(branchParam);
        if (res?.success) {
          setRunsList(res.runs || []);
        } else {
          showToast(res?.error || 'Failed to load payroll runs', 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Error loading payroll runs', 'error');
      } finally {
        setRunsLoading(false);
      }
    },
    [selectedBranchId, getRuns]
  );

  const handlePrevMonth = () => {
    const [year, month] = runMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setRunMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = runMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setRunMonth(d.toISOString().slice(0, 7));
  };

  const handleGenerateRun = async () => {
    setGeneratingRun(true);
    try {
      const branchParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
      const res = await generateRun(runMonth, branchParam);
      if (res?.success) {
        showToast(`Generated payroll run for ${runMonth} (${res.itemsCount || 0} staff)!`, 'success');
        loadRuns(true);
        // Open the generated run's detail
        if (res.run?.id) {
          handleOpenRunDetail(res.run.id);
        }
      } else {
        showToast(res?.error || 'Failed to generate payroll run', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error generating payroll run', 'error');
    } finally {
      setGeneratingRun(false);
    }
  };

  const handleOpenRunDetail = async (runId: string) => {
    setRunActionLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await getRunDetail(runId);
      if (res?.success) {
        setSelectedRunDetail(res);
      } else {
        showToast(res?.error || 'Failed to load run details', 'error');
        setDetailModalOpen(false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error loading run detail', 'error');
      setDetailModalOpen(false);
    } finally {
      setRunActionLoading(false);
    }
  };

  const handleRegenerateRun = async (runId: string) => {
    setRunActionLoading(true);
    try {
      const res = await regenerateRun(runId);
      if (res?.success) {
        showToast('Payroll run recalculated successfully!', 'success');
        handleOpenRunDetail(runId);
        loadRuns(true);
      } else {
        showToast(res?.error || 'Failed to recalculate run', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error recalculating run', 'error');
    } finally {
      setRunActionLoading(false);
    }
  };

  const handleApproveRun = async (runId: string) => {
    setRunActionLoading(true);
    try {
      const res = await approveRun(runId);
      if (res?.success) {
        showToast('Payroll run Approved and locked!', 'success');
        handleOpenRunDetail(runId);
        loadRuns(true);
      } else {
        showToast(res?.error || 'Failed to approve run', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving run', 'error');
    } finally {
      setRunActionLoading(false);
    }
  };

  const handleMarkRunPaid = async (runId: string) => {
    setRunActionLoading(true);
    try {
      const res = await markRunPaid(runId);
      if (res?.success) {
        showToast('Payroll run marked as Paid!', 'success');
        handleOpenRunDetail(runId);
        loadRuns(true);
      } else {
        showToast(res?.error || 'Failed to mark as paid', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error marking run as paid', 'error');
    } finally {
      setRunActionLoading(false);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    setRunActionLoading(true);
    try {
      const res = await deleteRun(runId);
      if (res?.success) {
        showToast('Draft payroll run deleted successfully.', 'success');
        setDetailModalOpen(false);
        setSelectedRunDetail(null);
        loadRuns(true);
      } else {
        showToast(res?.error || 'Failed to delete run', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting run', 'error');
    } finally {
      setRunActionLoading(false);
    }
  };

  // ============================================================================
  // TAB CHANGE EFFECT
  // ============================================================================
  useEffect(() => {
    if (activeTab === 'profiles') {
      loadProfiles();
    } else if (activeTab === 'attendance') {
      loadAttendance();
    } else if (activeTab === 'leaves') {
      loadLeaves();
    } else if (activeTab === 'runs') {
      loadRuns();
    }
  }, [activeTab, loadProfiles, loadAttendance, loadLeaves, loadRuns]);

  const getSubTitle = () => {
    switch (activeTab) {
      case 'profiles':
        return 'Salary profiles & compensation';
      case 'attendance':
        return 'Daily attendance tracking & roster';
      case 'leaves':
        return 'Staff leave management & approvals';
      case 'runs':
        return 'Payroll calculation engine & runs';
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader
        title="Payroll & HR"
        subtitle={getSubTitle()}
        onBack={onBack}
      />

      {/* Segmented Sub-Tab Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map((t) => {
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

      {/* Filter / Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'runs'
                ? 'Select outlet & month...'
                : 'Search staff by name or email...'
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        <TouchableOpacity
          style={[styles.branchFilterButton, selectedBranchId !== 'all' && styles.branchFilterButtonActive]}
          onPress={() => setBranchFilterOpen(true)}
        >
          <Building2 size={13} color={selectedBranchId !== 'all' ? '#0f172a' : '#475569'} />
          <Text style={[styles.branchFilterText, selectedBranchId !== 'all' && styles.branchFilterTextActive]} numberOfLines={1}>
            {selectedBranchName}
          </Text>
          <ChevronDown size={13} color={selectedBranchId !== 'all' ? '#0f172a' : '#475569'} />
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* TAB 1: SALARY PROFILES CONTENT */}
      {/* ==================================================================== */}
      {activeTab === 'profiles' && (
        <ScreenBody
          refreshControl={
            <RefreshControl refreshing={profilesRefreshing} onRefresh={() => loadProfiles(true)} colors={['#39ff14']} />
          }
        >
          {/* KPI StatCards Grid */}
          <View style={styles.statGrid}>
            <View style={styles.halfCol}>
              <StatCard
                label="Staff Profiles"
                value={`${totalConfigured} / ${profiles.length}`}
                sub={totalConfigured === profiles.length ? 'All configured' : `${profiles.length - totalConfigured} pending`}
                icon={<Users size={16} color="#0284c7" />}
                accent="sky"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Monthly Payroll"
                value={formatCurrency(totalMonthlyGross)}
                sub="Total gross commitment"
                icon={<DollarSign size={16} color="#39ff14" />}
                accent="brand"
              />
            </View>
          </View>

          {/* Staff Salary Profiles List */}
          <Text style={styles.sectionTitle}>Employee Compensation Roster</Text>

          {profilesLoading && !profilesRefreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={styles.loadingText}>Loading staff compensation records...</Text>
            </View>
          ) : profiles.length === 0 ? (
            <Card>
              <View style={styles.emptyContainer}>
                <Users size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Staff Members Found</Text>
                <Text style={styles.emptySub}>
                  No active staff found matching your search or outlet filter.
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.listWrapper}>
              {profiles.map((staff) => (
                <Card key={staff.staffId}>
                  <View style={styles.staffCard}>
                    <View style={styles.staffHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.staffName}>{staff.name}</Text>
                        <Text style={styles.staffMeta}>
                          {staff.role?.replace(/_/g, ' ')} · {staff.branchName}
                        </Text>
                      </View>
                      <Badge
                        variant={staff.hasProfile ? 'success' : 'warn'}
                        label={staff.hasProfile ? 'Configured' : 'Unset'}
                      />
                    </View>

                    {/* Salary Breakdown Row */}
                    <View style={styles.compRow}>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Basic</Text>
                        <Text style={styles.compValue}>{formatCurrency(staff.basicSalary || 0)}</Text>
                      </View>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Allowances</Text>
                        <Text style={styles.compValue}>+{formatCurrency(staff.totalAllowances || 0)}</Text>
                      </View>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Gross Salary</Text>
                        <Text style={[styles.compValue, { color: '#0284c7', fontWeight: '700' }]}>
                          {formatCurrency(staff.grossSalary || 0)}
                        </Text>
                      </View>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Est. Net</Text>
                        <Text style={[styles.compValue, { color: '#16a34a', fontWeight: '700' }]}>
                          {formatCurrency(staff.netEstimated || 0)}
                        </Text>
                      </View>
                    </View>

                    {/* Bank / IBAN Info if set */}
                    {staff.bankName || staff.iban ? (
                      <View style={styles.bankInfoRow}>
                        <CreditCard size={12} color="#64748b" />
                        <Text style={styles.bankInfoText} numberOfLines={1}>
                          {staff.bankName || 'Bank'} · {staff.iban ? `IBAN: ${staff.iban}` : 'No IBAN'}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Button */}
                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenEditProfile(staff)}
                      >
                        <Edit3 size={14} color="#0f172a" />
                        <Text style={styles.editBtnText}>
                          {staff.hasProfile ? 'Edit Salary' : 'Configure'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScreenBody>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ATTENDANCE CONTENT */}
      {/* ==================================================================== */}
      {activeTab === 'attendance' && (
        <ScreenBody
          refreshControl={
            <RefreshControl refreshing={attendanceLoading} onRefresh={() => loadAttendance(true)} colors={['#39ff14']} />
          }
        >
          {/* Date Selector & Bulk Present Bar */}
          <View style={styles.attendanceControlBar}>
            <View style={styles.datePickerGroup}>
              <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevDay}>
                <ChevronLeft size={16} color="#0f172a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateCenterBtn} onPress={handleToday}>
                <Calendar size={14} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.dateCenterText}>{attendanceDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateNavBtn} onPress={handleNextDay}>
                <ChevronRight size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.bulkPresentBtn, bulkMarking && styles.btnDisabled]}
              onPress={handleBulkMarkPresent}
              disabled={bulkMarking}
            >
              {bulkMarking ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <>
                  <CheckCircle2 size={14} color="#0f172a" />
                  <Text style={styles.bulkPresentText}>Mark All Present</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Attendance KPI Cards */}
          <View style={styles.statGrid}>
            <View style={styles.quarterCol}>
              <StatCard
                label="Present"
                value={String(attendanceSummary.present + attendanceSummary.halfDay)}
                icon={<CheckCircle size={15} color="#16a34a Both" />}
                accent="brand"
              />
            </View>
            <View style={styles.quarterCol}>
              <StatCard
                label="Absent"
                value={String(attendanceSummary.absent)}
                icon={<XCircle size={15} color="#e11d48" />}
                accent="rose"
              />
            </View>
            <View style={styles.quarterCol}>
              <StatCard
                label="On Leave"
                value={String(attendanceSummary.onLeave)}
                icon={<Calendar size={15} color="#0284c7" />}
                accent="sky"
              />
            </View>
            <View style={styles.quarterCol}>
              <StatCard
                label="Unmarked"
                value={String(attendanceSummary.unmarked)}
                icon={<AlertCircle size={15} color="#d97706" />}
                accent="amber"
              />
            </View>
          </View>

          {/* Daily Staff Roster */}
          <Text style={styles.sectionTitle}>
            Daily Roster ({filteredAttendanceRoster.length} Staff)
          </Text>

          {attendanceLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={styles.loadingText}>Fetching attendance records...</Text>
            </View>
          ) : filteredAttendanceRoster.length === 0 ? (
            <Card>
              <View style={styles.emptyContainer}>
                <Clock size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Staff In Roster</Text>
                <Text style={styles.emptySub}>No active staff members found for this outlet.</Text>
              </View>
            </Card>
          ) : (
            <View style={styles.listWrapper}>
              {filteredAttendanceRoster.map((item) => {
                const currentStatusObj =
                  ATTENDANCE_STATUSES.find((s) => s.id === item.status) || {
                    id: 'unmarked',
                    label: 'Unmarked',
                    color: '#64748b',
                    bg: '#f8fafc',
                  };

                const isUpdating = updatingAttendanceStaffId === item.staffId;

                return (
                  <Card key={item.staffId}>
                    <View style={styles.attendanceCard}>
                      <View style={styles.attendanceStaffHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.staffName}>{item.name}</Text>
                          <Text style={styles.staffMeta}>
                            {item.role?.replace(/_/g, ' ')} · {item.branchName}
                          </Text>
                        </View>

                        {/* Status Dropdown Trigger Pill matching user screenshot */}
                        <TouchableOpacity
                          style={styles.statusDropdownTrigger}
                          onPress={() => setStatusPickerStaff(item)}
                          activeOpacity={0.7}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <ActivityIndicator size="small" color="#0f172a" />
                          ) : (
                            <>
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: (currentStatusObj as any).dotColor || (currentStatusObj as any).color || '#22c55e' },
                                ]}
                              />
                              <Text style={styles.statusDropdownTriggerText}>
                                {currentStatusObj.label}
                              </Text>
                              <ChevronDown size={14} color="#64748b" />
                            </>
                          )}
                        </TouchableOpacity>
                      </View>

                      {item.hoursWorked !== null && item.hoursWorked !== undefined && item.hoursWorked > 0 ? (
                        <View style={styles.attendanceHoursRow}>
                          <Clock size={11} color="#64748b" />
                          <Text style={styles.attendanceHoursText}>
                            {item.hoursWorked} hours logged
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScreenBody>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: LEAVE REQUESTS CONTENT */}
      {/* ==================================================================== */}
      {activeTab === 'leaves' && (
        <ScreenBody
          refreshControl={
            <RefreshControl refreshing={leavesLoading} onRefresh={() => loadLeaves(true)} colors={['#39ff14']} />
          }
        >
          {/* Status Filter Bar */}
          <View style={styles.filterPillsRow}>
            {['all', 'pending', 'approved', 'rejected'].map((st) => {
              const isSel = leavesFilterStatus === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterPill, isSel && styles.filterPillActive]}
                  onPress={() => {
                    setLeavesFilterStatus(st);
                    setLeavesPage(1);
                  }}
                >
                  <Text style={[styles.filterPillText, isSel && styles.filterPillTextActive]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* KPI StatCards */}
          <View style={styles.statGrid}>
            <View style={styles.halfCol}>
              <StatCard
                label="Total Requests"
                value={String(leavesTotal)}
                icon={<FileText size={16} color="#0f172a" />}
                accent="ink"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Action Required"
                value={String(leavesList.filter((l) => l.status === 'pending').length)}
                sub="Pending review"
                icon={<AlertCircle size={16} color="#d97706" />}
                accent="amber"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Leave Applications ({leavesTotal})</Text>

          {leavesLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={styles.loadingText}>Loading leave requests...</Text>
            </View>
          ) : leavesList.length === 0 ? (
            <Card>
              <View style={styles.emptyContainer}>
                <Calendar size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Leave Requests</Text>
                <Text style={styles.emptySub}>No requests match the selected status filter.</Text>
              </View>
            </Card>
          ) : (
            <View style={styles.listWrapper}>
              {leavesList.map((req) => {
                const statusVariant =
                  req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warn';
                const typeLabel = LEAVE_TYPE_LABELS[req.leaveType] || req.leaveType;
                const isReviewing = reviewingId === req.id;

                return (
                  <Card key={req.id}>
                    <View style={styles.leaveAdminCard}>
                      <View style={styles.leaveAdminHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffName}>{req.staffName || 'Staff Member'}</Text>
                          <Text style={styles.staffMeta}>
                            {req.staffRole?.replace(/_/g, ' ')} · {req.branchName || 'All Outlets'}
                          </Text>
                        </View>
                        <Badge variant={statusVariant} label={req.status.toUpperCase()} />
                      </View>

                      {/* Type & Pay */}
                      <View style={styles.leaveInfoRow}>
                        <Text style={styles.leaveTypeLabel}>{typeLabel}</Text>
                        <Badge
                          variant={req.isPaid ? 'brand' : 'neutral'}
                          label={req.isPaid ? 'Paid' : 'Unpaid'}
                        />
                      </View>

                      {/* Dates & Range */}
                      <View style={styles.datesRow}>
                        <Calendar size={13} color="#64748b" />
                        <Text style={styles.datesText}>
                          {req.startDate} → {req.endDate}
                        </Text>
                        <Text style={styles.daysPill}>
                          {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                        </Text>
                      </View>

                      {/* Reason */}
                      {req.reason ? (
                        <Text style={styles.reasonText} numberOfLines={2}>
                          "{req.reason}"
                        </Text>
                      ) : null}

                      {/* Approve / Reject Actions (Only if Pending) */}
                      {req.status === 'pending' && (
                        <View style={styles.leaveActionBtnRow}>
                          <TouchableOpacity
                            style={[styles.rejectBtn, isReviewing && styles.btnDisabled]}
                            onPress={() => handleReviewLeave(req.id, 'rejected')}
                            disabled={isReviewing}
                          >
                            <XCircle size={14} color="#e11d48" />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.approveBtn, isReviewing && styles.btnDisabled]}
                            onPress={() => handleReviewLeave(req.id, 'approved')}
                            disabled={isReviewing}
                          >
                            <CheckCircle size={14} color="#0f172a" />
                            <Text style={styles.approveBtnText}>Approve & Update Roster</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Pagination */}
          {leavesTotalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, leavesPage <= 1 && styles.btnDisabled]}
                onPress={() => setLeavesPage((p) => Math.max(1, p - 1))}
                disabled={leavesPage <= 1}
              >
                <Text style={styles.pageBtnText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                Page {leavesPage} of {leavesTotalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, leavesPage >= leavesTotalPages && styles.btnDisabled]}
                onPress={() => setLeavesPage((p) => Math.min(leavesTotalPages, p + 1))}
                disabled={leavesPage >= leavesTotalPages}
              >
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScreenBody>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: PAYROLL RUNS CONTENT */}
      {/* ==================================================================== */}
      {activeTab === 'runs' && (
        <ScreenBody
          refreshControl={
            <RefreshControl refreshing={runsLoading} onRefresh={() => loadRuns(true)} colors={['#39ff14']} />
          }
        >
          {/* Month Navigator & Generate Run Bar */}
          <View style={styles.attendanceControlBar}>
            <View style={styles.datePickerGroup}>
              <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevMonth}>
                <ChevronLeft size={16} color="#0f172a" />
              </TouchableOpacity>
              <View style={styles.dateCenterBtn}>
                <Calendar size={14} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.dateCenterText}>{runMonth}</Text>
              </View>
              <TouchableOpacity style={styles.dateNavBtn} onPress={handleNextMonth}>
                <ChevronRight size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.generateRunBtn, generatingRun && styles.btnDisabled]}
              onPress={handleGenerateRun}
              disabled={generatingRun}
            >
              {generatingRun ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <>
                  <Plus size={14} color="#0f172a" />
                  <Text style={styles.generateRunBtnText}>Generate Run</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Runs KPI Cards */}
          <View style={styles.statGrid}>
            <View style={styles.halfCol}>
              <StatCard
                label="Draft Runs"
                value={String(runsList.filter((r) => r.status === 'Draft').length)}
                icon={<Clock size={16} color="#d97706" />}
                accent="amber"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Paid / Finalized"
                value={String(runsList.filter((r) => r.status === 'Paid').length)}
                icon={<CheckCircle2 size={16} color="#39ff14" />}
                accent="brand"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Payroll Runs History</Text>

          {runsLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={styles.loadingText}>Loading payroll runs...</Text>
            </View>
          ) : runsList.length === 0 ? (
            <Card>
              <View style={styles.emptyContainer}>
                <DollarSign size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Payroll Runs</Text>
                <Text style={styles.emptySub}>
                  No payroll runs have been generated yet. Choose a month above and tap "Generate Run" to calculate compensations.
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.listWrapper}>
              {runsList.map((run) => {
                const statusVariant =
                  run.status === 'Paid' ? 'success' : run.status === 'Approved' ? 'info' : 'warn';

                return (
                  <TouchableOpacity
                    key={run.id}
                    onPress={() => handleOpenRunDetail(run.id)}
                    activeOpacity={0.85}
                  >
                    <Card>
                      <View style={styles.runCard}>
                        <View style={styles.runCardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.runMonthTitle}>{run.month}</Text>
                            <Text style={styles.staffMeta}>
                              {run.branchName || 'All Outlets (Consolidated)'}
                            </Text>
                          </View>
                          <Badge variant={statusVariant} label={run.status.toUpperCase()} />
                        </View>

                        {/* Totals Row */}
                        <View style={styles.runTotalsRow}>
                          <View style={styles.compCol}>
                            <Text style={styles.compLabel}>Gross</Text>
                            <Text style={styles.compValue}>{formatCurrency(run.totalGross || 0)}</Text>
                          </View>
                          <View style={styles.compCol}>
                            <Text style={styles.compLabel}>Deductions</Text>
                            <Text style={[styles.compValue, { color: '#e11d48' }]}>
                              -{formatCurrency(run.totalDeductions || 0)}
                            </Text>
                          </View>
                          <View style={styles.compCol}>
                            <Text style={styles.compLabel}>Net Payable</Text>
                            <Text style={[styles.compValue, { color: '#16a34a', fontWeight: '700' }]}>
                              {formatCurrency(run.totalNet || 0)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.runTapFooter}>
                          <Text style={styles.runTapText}>Tap to view itemized breakdown & actions</Text>
                          <ChevronRight size={14} color="#64748b" />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScreenBody>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT SALARY PROFILE */}
      {/* ==================================================================== */}
      <Modal visible={editModalOpen} transparent animationType="slide" onRequestClose={() => setEditModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Configure Salary Profile</Text>
                <Text style={styles.modalSub}>
                  {selectedStaff?.name} ({selectedStaff?.role?.replace(/_/g, ' ')})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* LIVE CALCULATION PREVIEW CARD */}
              <View style={styles.liveCalcBanner}>
                <Text style={styles.liveCalcHeader}>Live Compensation Preview</Text>
                <View style={styles.liveCalcGrid}>
                  <View style={styles.liveCalcCol}>
                    <Text style={styles.liveCalcLabel}>Gross Salary</Text>
                    <Text style={styles.liveCalcValSky}>{formatCurrency(liveCalc.gross)}</Text>
                  </View>
                  <View style={styles.liveCalcCol}>
                    <Text style={styles.liveCalcLabel}>Deductions</Text>
                    <Text style={styles.liveCalcValRose}>-{formatCurrency(liveCalc.deductions)}</Text>
                  </View>
                  <View style={styles.liveCalcCol}>
                    <Text style={styles.liveCalcLabel}>Net Take-Home</Text>
                    <Text style={styles.liveCalcValBrand}>{formatCurrency(liveCalc.net)}</Text>
                  </View>
                </View>
              </View>

              {/* Salary Breakdown Inputs */}
              <Text style={styles.formSectionHeader}>Base & Allowances</Text>

              <Field label="Basic Monthly Salary (AED)">
                <TextInput
                  style={styles.formInput}
                  value={basicSalary}
                  onChangeText={setBasicSalary}
                  placeholder="e.g. 5000"
                  keyboardType="numeric"
                />
              </Field>

              <View style={styles.formTwoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Field label="Housing Allowance">
                    <TextInput
                      style={styles.formInput}
                      value={housingAllowance}
                      onChangeText={setHousingAllowance}
                      placeholder="e.g. 1500"
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Field label="Transport Allowance">
                    <TextInput
                      style={styles.formInput}
                      value={transportAllowance}
                      onChangeText={setTransportAllowance}
                      placeholder="e.g. 500"
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
              </View>

              <View style={styles.formTwoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Field label="Other Allowances">
                    <TextInput
                      style={styles.formInput}
                      value={otherAllowances}
                      onChangeText={setOtherAllowances}
                      placeholder="e.g. 250"
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Field label="Standard Deductions">
                    <TextInput
                      style={styles.formInput}
                      value={standardDeductions}
                      onChangeText={setStandardDeductions}
                      placeholder="e.g. 100"
                      keyboardType="numeric"
                    />
                  </Field>
                </View>
              </View>

              <Text style={styles.formSectionHeader}>Disbursement Details</Text>

              <Field label="Bank Name">
                <TextInput
                  style={styles.formInput}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. Emirates NBD, ADCB"
                />
              </Field>

              <Field label="IBAN / Account Number">
                <TextInput
                  style={styles.formInput}
                  value={iban}
                  onChangeText={setIban}
                  placeholder="AE..."
                  autoCapitalize="characters"
                />
              </Field>

              <Field label="Joining Date (YYYY-MM-DD)">
                <TextInput
                  style={styles.formInput}
                  value={joinDate}
                  onChangeText={setJoinDate}
                  placeholder="YYYY-MM-DD"
                />
              </Field>

              <TouchableOpacity
                style={[styles.saveBtn, submittingProfile && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={submittingProfile}
              >
                {submittingProfile ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Salary Profile</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: RUN ITEMIZED BREAKDOWN & ACTIONS */}
      {/* ==================================================================== */}
      <Modal
        visible={detailModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>
                  Payroll Run: {selectedRunDetail?.run?.month}
                </Text>
                <Text style={styles.modalSub}>
                  {selectedRunDetail?.run?.branchName || 'All Outlets'} ·{' '}
                  {selectedRunDetail?.items?.length || 0} Employees
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {runActionLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#39ff14" />
                <Text style={styles.loadingText}>Processing payroll calculation...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Status & Totals Card */}
                <View style={styles.runDetailBanner}>
                  <View style={styles.runDetailStatusRow}>
                    <Text style={styles.runDetailStatusLabel}>Run Status:</Text>
                    <Badge
                      variant={
                        selectedRunDetail?.run?.status === 'Paid'
                          ? 'success'
                          : selectedRunDetail?.run?.status === 'Approved'
                          ? 'info'
                          : 'warn'
                      }
                      label={selectedRunDetail?.run?.status?.toUpperCase() || 'DRAFT'}
                    />
                  </View>

                  <View style={styles.runDetailTotalsGrid}>
                    <View style={styles.liveCalcCol}>
                      <Text style={styles.liveCalcLabel}>Total Gross</Text>
                      <Text style={styles.liveCalcValSky}>
                        {formatCurrency(selectedRunDetail?.run?.totalGross || 0)}
                      </Text>
                    </View>
                    <View style={styles.liveCalcCol}>
                      <Text style={styles.liveCalcLabel}>Total Deductions</Text>
                      <Text style={styles.liveCalcValRose}>
                        -{formatCurrency(selectedRunDetail?.run?.totalDeductions || 0)}
                      </Text>
                    </View>
                    <View style={styles.liveCalcCol}>
                      <Text style={styles.liveCalcLabel}>Total Net</Text>
                      <Text style={styles.liveCalcValBrand}>
                        {formatCurrency(selectedRunDetail?.run?.totalNet || 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Lock Rules Action Bar */}
                <View style={styles.runActionBtnBar}>
                  {selectedRunDetail?.run?.status === 'Draft' && (
                    <>
                      <TouchableOpacity
                        style={styles.regenBtn}
                        onPress={() => handleRegenerateRun(selectedRunDetail.run.id)}
                      >
                        <RefreshCw size={13} color="#0284c7" />
                        <Text style={styles.regenBtnText}>Recalculate</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveRunBtn}
                        onPress={() => handleApproveRun(selectedRunDetail.run.id)}
                      >
                        <ShieldCheck size={13} color="#0f172a" />
                        <Text style={styles.approveRunBtnText}>Approve & Lock</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteRunBtn}
                        onPress={() => handleDeleteRun(selectedRunDetail.run.id)}
                      >
                        <Trash2 size={13} color="#e11d48" />
                        <Text style={styles.deleteRunBtnText}>Delete Draft</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedRunDetail?.run?.status === 'Approved' && (
                    <TouchableOpacity
                      style={styles.markPaidBtn}
                      onPress={() => handleMarkRunPaid(selectedRunDetail.run.id)}
                    >
                      <CheckCircle2 size={14} color="#0f172a" />
                      <Text style={styles.markPaidBtnText}>Mark as Paid & Disbursed</Text>
                    </TouchableOpacity>
                  )}

                  {selectedRunDetail?.run?.status === 'Paid' && (
                    <View style={styles.paidFinalBadge}>
                      <CheckCircle2 size={14} color="#16a34a" />
                      <Text style={styles.paidFinalText}>
                        Disbursement Completed · Payroll Run Locked
                      </Text>
                    </View>
                  )}
                </View>

                {/* Itemized Staff Roster */}
                <Text style={styles.formSectionHeader}>Employee Breakdown</Text>
                <View style={styles.itemizedListWrapper}>
                  {(selectedRunDetail?.items || []).map((item: any) => (
                    <View key={item.id} style={styles.itemizedRowCard}>
                      <View style={styles.itemizedHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffName}>{item.staffName || 'Staff Member'}</Text>
                          <Text style={styles.staffMeta}>{item.staffRole?.replace(/_/g, ' ')}</Text>
                        </View>
                        <Text style={styles.itemizedNetText}>
                          {formatCurrency(item.netSalary || 0)}
                        </Text>
                      </View>

                      <View style={styles.itemizedDetailsGrid}>
                        <Text style={styles.itemizedDetailText}>
                          Basic: {formatCurrency(item.basicSalary || 0)}
                        </Text>
                        <Text style={styles.itemizedDetailText}>
                          Allowances: +{formatCurrency(item.totalAllowances || 0)}
                        </Text>
                        <Text style={styles.itemizedDetailText}>
                          Gross: {formatCurrency(item.grossSalary || 0)}
                        </Text>
                        {Number(item.unpaidDays || 0) > 0 && (
                          <Text style={[styles.itemizedDetailText, { color: '#e11d48' }]}>
                            Unpaid ({item.unpaidDays}d): -{formatCurrency(item.unpaidDeduction || 0)}
                          </Text>
                        )}
                        {Number(item.standardDeductions || 0) > 0 && (
                          <Text style={[styles.itemizedDetailText, { color: '#e11d48' }]}>
                            Std Ded: -{formatCurrency(item.standardDeductions || 0)}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.viewPayslipBtn}
                        onPress={() => handleOpenPayslip(item.staffUserId)}
                        activeOpacity={0.7}
                      >
                        <FileText size={12} color="#0284c7" />
                        <Text style={styles.viewPayslipBtnText}>View Payslip</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: OFFICIAL PAYSLIP DETAIL VIEW (Phase 5) */}
      {/* ==================================================================== */}
      <Modal
        visible={payslipModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPayslipModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.payslipModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Official Payslip</Text>
                <Text style={styles.modalSub}>
                  {selectedPayslip?.payslipNumber || 'Loading statement...'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPayslipModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {payslipLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#39ff14" />
                <Text style={styles.loadingText}>Loading payslip statement...</Text>
              </View>
            ) : selectedPayslip ? (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Period & Status Banner */}
                <View style={styles.payslipBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payslipPeriodLabel}>Pay Period</Text>
                    <Text style={styles.payslipPeriodVal}>{selectedPayslip.periodMonth}</Text>
                    <Text style={styles.payslipSubMeta}>
                      Issued: {selectedPayslip.paidAt ? new Date(selectedPayslip.paidAt).toLocaleDateString() : selectedPayslip.approvedAt ? new Date(selectedPayslip.approvedAt).toLocaleDateString() : 'Draft'}
                    </Text>
                  </View>
                  <Badge
                    variant={selectedPayslip.status === 'Paid' ? 'success' : selectedPayslip.status === 'Approved' ? 'info' : 'warn'}
                    label={selectedPayslip.status?.toUpperCase() || 'DRAFT'}
                  />
                </View>

                {/* Employee Profile Box */}
                <View style={styles.payslipEmployeeBox}>
                  <View style={styles.payslipInfoRow}>
                    <Text style={styles.payslipInfoLabel}>Employee:</Text>
                    <Text style={styles.payslipInfoVal}>{selectedPayslip.employee?.name}</Text>
                  </View>
                  <View style={styles.payslipInfoRow}>
                    <Text style={styles.payslipInfoLabel}>Role / Designation:</Text>
                    <Text style={styles.payslipInfoVal}>{selectedPayslip.employee?.role?.replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={styles.payslipInfoRow}>
                    <Text style={styles.payslipInfoLabel}>Outlet / Branch:</Text>
                    <Text style={styles.payslipInfoVal}>{selectedPayslip.employee?.branchName}</Text>
                  </View>
                  {selectedPayslip.employee?.joinDate && (
                    <View style={styles.payslipInfoRow}>
                      <Text style={styles.payslipInfoLabel}>Join Date:</Text>
                      <Text style={styles.payslipInfoVal}>{selectedPayslip.employee.joinDate}</Text>
                    </View>
                  )}
                  {selectedPayslip.employee?.bankName && (
                    <View style={styles.payslipInfoRow}>
                      <Text style={styles.payslipInfoLabel}>Disbursement:</Text>
                      <Text style={styles.payslipInfoVal}>
                        {selectedPayslip.employee.bankName}
                        {selectedPayslip.employee.maskedIban ? ` (${selectedPayslip.employee.maskedIban})` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Gross Earnings Breakdown */}
                <Text style={styles.payslipSectionHeader}>Gross Earnings</Text>
                <View style={styles.payslipBreakdownTable}>
                  <View style={styles.payslipTableRow}>
                    <Text style={styles.payslipTableDesc}>Basic Monthly Salary</Text>
                    <Text style={styles.payslipTableAmt}>{formatCurrency(selectedPayslip.earnings?.basicSalary || 0)}</Text>
                  </View>
                  {Number(selectedPayslip.earnings?.housingAllowance || 0) > 0 && (
                    <View style={styles.payslipTableRow}>
                      <Text style={styles.payslipTableDesc}>Housing Allowance</Text>
                      <Text style={styles.payslipTableAmt}>+{formatCurrency(selectedPayslip.earnings.housingAllowance)}</Text>
                    </View>
                  )}
                  {Number(selectedPayslip.earnings?.transportAllowance || 0) > 0 && (
                    <View style={styles.payslipTableRow}>
                      <Text style={styles.payslipTableDesc}>Transport Allowance</Text>
                      <Text style={styles.payslipTableAmt}>+{formatCurrency(selectedPayslip.earnings.transportAllowance)}</Text>
                    </View>
                  )}
                  {Number(selectedPayslip.earnings?.otherAllowances || 0) > 0 && (
                    <View style={styles.payslipTableRow}>
                      <Text style={styles.payslipTableDesc}>Other Allowances</Text>
                      <Text style={styles.payslipTableAmt}>+{formatCurrency(selectedPayslip.earnings.otherAllowances)}</Text>
                    </View>
                  )}
                  <View style={[styles.payslipTableRow, styles.payslipTableSubtotalRow]}>
                    <Text style={styles.payslipSubtotalLabel}>Total Gross Salary</Text>
                    <Text style={styles.payslipSubtotalAmt}>{formatCurrency(selectedPayslip.earnings?.grossSalary || 0)}</Text>
                  </View>
                </View>

                {/* Deductions Breakdown */}
                <Text style={styles.payslipSectionHeader}>Deductions & Adjustments</Text>
                <View style={styles.payslipBreakdownTable}>
                  {Number(selectedPayslip.deductions?.unpaidDays || 0) > 0 ? (
                    <View style={styles.payslipTableRow}>
                      <Text style={styles.payslipTableDesc}>
                        Unpaid Days ({selectedPayslip.deductions.unpaidDays} days)
                      </Text>
                      <Text style={[styles.payslipTableAmt, { color: '#e11d48' }]}>
                        -{formatCurrency(selectedPayslip.deductions.unpaidDeduction || 0)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.payslipTableRow}>
                      <Text style={styles.payslipTableDesc}>Absence Deductions (0 days)</Text>
                      <Text style={styles.payslipTableAmt}>0.00</Text>
                    </View>
                  )}
                  {Number(selectedPayslip.deductions?.standardDeductions || 0) > 0 && (
                    <View style={styles.payslipTableRow}>
                      <Text style={styles.payslipTableDesc}>Standard Deductions</Text>
                      <Text style={[styles.payslipTableAmt, { color: '#e11d48' }]}>
                        -{formatCurrency(selectedPayslip.deductions.standardDeductions)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.payslipTableRow, styles.payslipTableSubtotalRow]}>
                    <Text style={styles.payslipSubtotalLabel}>Total Deductions</Text>
                    <Text style={[styles.payslipSubtotalAmt, { color: '#e11d48' }]}>
                      -{formatCurrency(selectedPayslip.deductions?.totalDeductions || 0)}
                    </Text>
                  </View>
                </View>

                {/* Net Pay Highlight Banner */}
                <View style={styles.netPayCard}>
                  <Text style={styles.netPayLabel}>Net Payable Disbursement</Text>
                  <Text style={styles.netPayVal}>
                    {formatCurrency(selectedPayslip.netSalary || 0)}
                  </Text>
                  <Text style={styles.netPayNote}>
                    Currency: {selectedPayslip.currency || 'AED'} · Official Salary Statement
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: BRANCH FILTER SELECTOR */}
      {/* ==================================================================== */}
      <Modal visible={branchFilterOpen} transparent animationType="fade" onRequestClose={() => setBranchFilterOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBranchFilterOpen(false)}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Filter by Outlet</Text>
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
                  All Outlets (Consolidated)
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

      {/* ==================================================================== */}
      {/* MODAL: ATTENDANCE STATUS DROPDOWN POPOVER (MATCHING USER SCREENSHOT) */}
      {/* ==================================================================== */}
      <Modal
        visible={!!statusPickerStaff}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerStaff(null)}
      >
        <TouchableOpacity
          style={styles.statusDropdownOverlay}
          activeOpacity={1}
          onPress={() => setStatusPickerStaff(null)}
        >
          <View style={styles.statusDropdownCard}>
            <View style={styles.statusDropdownHeader}>
              <Text style={styles.statusDropdownStaffName}>{statusPickerStaff?.name}</Text>
              <Text style={styles.statusDropdownSub}>
                Mark attendance for {attendanceDate}
              </Text>
            </View>

            <View style={styles.statusDropdownList}>
              {ATTENDANCE_STATUSES.map((statusOpt) => {
                const isSelected = (statusPickerStaff?.status || 'unmarked') === statusOpt.id;
                return (
                  <TouchableOpacity
                    key={statusOpt.id}
                    style={[
                      styles.statusDropdownItem,
                      isSelected && styles.statusDropdownItemSelected,
                    ]}
                    onPress={() => {
                      if (statusPickerStaff) {
                        handleMarkSingleStaff(
                          statusPickerStaff.staffId,
                          statusOpt.id,
                          statusOpt.hours
                        );
                        setStatusPickerStaff(null);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statusDropdownItemLeft}>
                      <View
                        style={[
                          styles.statusDotLg,
                          { backgroundColor: statusOpt.dotColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusDropdownItemText,
                          isSelected && styles.statusDropdownItemTextSelected,
                        ]}
                      >
                        {statusOpt.label}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color="#0f172a" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  branchFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    maxWidth: 130,
  },
  branchFilterButtonActive: {
    borderColor: '#0f172a',
    backgroundColor: '#f1f5f9',
  },
  branchFilterText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  branchFilterTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  halfCol: {
    flex: 1,
    minWidth: '47%',
  },
  quarterCol: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  listWrapper: {
    gap: 10,
    marginBottom: 24,
  },
  staffCard: {
    padding: 12,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  staffMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  compCol: {
    alignItems: 'center',
  },
  compLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  compValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  bankInfoText: {
    fontSize: 11,
    color: '#64748b',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Attendance Styles
  attendanceControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    marginBottom: 14,
  },
  datePickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dateNavBtn: {
    padding: 8,
  },
  dateCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateCenterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  bulkPresentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkPresentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  attendanceCard: {
    padding: 12,
  },
  attendanceStaffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDropdownTriggerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
  },
  attendanceHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingTop: 4,
  },
  attendanceHoursText: {
    fontSize: 11,
    color: '#64748b',
  },
  statusDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusDropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 290,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDropdownHeader: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusDropdownStaffName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusDropdownSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusDropdownList: {
    paddingVertical: 4,
  },
  statusDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusDropdownItemSelected: {
    backgroundColor: '#f8fafc',
  },
  statusDropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDotLg: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  statusDropdownItemTextSelected: {
    fontWeight: '700',
    color: '#0f172a',
  },
  // Leave Requests Styles
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  leaveAdminCard: {
    padding: 12,
  },
  leaveAdminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leaveInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  leaveTypeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  datesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  daysPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  reasonText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  leaveActionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 6,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#39ff14',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#64748b',
  },
  // Runs Styles
  generateRunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateRunBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  runCard: {
    padding: 14,
  },
  runCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  runMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  runTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  runTapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  runTapText: {
    fontSize: 11,
    color: '#64748b',
  },
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  editModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
    padding: 20,
  },
  detailModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  modalScrollBody: {
    maxHeight: 520,
  },
  liveCalcBanner: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 14,
  },
  liveCalcHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  liveCalcGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveCalcCol: {
    alignItems: 'center',
  },
  liveCalcLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  liveCalcValSky: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
  },
  liveCalcValRose: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e11d48',
  },
  liveCalcValBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  formSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 8,
  },
  formTwoCol: {
    flexDirection: 'row',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    backgroundColor: '#39ff14',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  // Run Detail Modal specific
  runDetailBanner: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 14,
  },
  runDetailStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingBottom: 8,
  },
  runDetailStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  runDetailTotalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runActionBtnBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  regenBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    borderRadius: 8,
  },
  regenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  approveRunBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveRunBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteRunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteRunBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  markPaidBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingVertical: 12,
    borderRadius: 8,
  },
  markPaidBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  paidFinalBadge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 10,
    borderRadius: 8,
  },
  paidFinalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  itemizedListWrapper: {
    gap: 8,
    marginBottom: 16,
  },
  itemizedRowCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
  },
  itemizedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemizedNetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  itemizedDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemizedDetailText: {
    fontSize: 11,
    color: '#64748b',
  },
  // Outlet Picker Modal
  pickerModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#f8fafc',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#475569',
  },
  pickerItemTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  // View Payslip Button & Payslip Modal Styles (Phase 5)
  viewPayslipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  viewPayslipBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  payslipModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  payslipBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  payslipPeriodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payslipPeriodVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  payslipSubMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  payslipEmployeeBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  payslipInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payslipInfoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  payslipInfoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  payslipSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
  },
  payslipBreakdownTable: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  payslipTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  payslipTableDesc: {
    fontSize: 12,
    color: '#334155',
  },
  payslipTableAmt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  payslipTableSubtotalRow: {
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingBottom: 6,
  },
  payslipSubtotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  payslipSubtotalAmt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  netPayCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  netPayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netPayVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#39ff14',
    marginVertical: 4,
  },
  netPayNote: {
    fontSize: 10,
    color: '#64748b',
  },
});
