import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toast, ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import {
  useSuperAdmin,
  TenantBillingItem,
  BillingOverview,
  TenantPaymentRecord,
  RecordPaymentInput,
} from '../../lib/SuperAdminContext';
import {
  Building2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  Calendar,
  CreditCard,
  History,
  Coins,
  Pencil,
  Clock,
  CheckCircle2,
  Receipt,
  FileText,
  FileSpreadsheet,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

// Helper to format dates cleanly
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not set';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Not set';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Not set';
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return `${d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'N/A';
  }
}

// Plan badge styling
const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Starter: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  Growth: { bg: 'rgba(2, 132, 199, 0.08)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.2)' },
  Enterprise: { bg: 'rgba(124, 58, 237, 0.08)', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.2)' },
};

// Punctuality badge helper
function getPunctualityBadgeProps(punctuality: string, status: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  const p = (punctuality || '').toLowerCase();
  const s = (status || '').toLowerCase();

  if (s === 'overdue' || p.includes('overdue')) {
    return {
      bg: 'rgba(239, 68, 68, 0.1)',
      text: '#dc2626',
      border: 'rgba(239, 68, 68, 0.25)',
      label: punctuality || 'Overdue',
    };
  }
  if (s === 'due_soon' || p.includes('due in')) {
    return {
      bg: 'rgba(245, 158, 11, 0.1)',
      text: '#d97706',
      border: 'rgba(245, 158, 11, 0.25)',
      label: punctuality || 'Due Soon',
    };
  }
  if (p.includes('paid late')) {
    return {
      bg: 'rgba(249, 115, 22, 0.1)',
      text: '#ea580c',
      border: 'rgba(249, 115, 22, 0.25)',
      label: punctuality,
    };
  }
  if (p.includes('up to date') || p.includes('on time') || s === 'active') {
    return {
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#16a34a',
      border: 'rgba(34, 197, 94, 0.25)',
      label: punctuality || 'Paid / Up to date',
    };
  }
  return {
    bg: '#f1f5f9',
    text: '#64748b',
    border: '#cbd5e1',
    label: punctuality || 'Never Paid',
  };
}

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly (1 mo)' },
  { id: 'quarterly', label: 'Quarterly (3 mo)' },
  { id: '6_months', label: '6 Months' },
  { id: 'yearly', label: 'Yearly (1 yr)' },
  { id: 'custom', label: 'Custom' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Up to date' },
  { id: 'due_soon', label: 'Due Soon' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'no_record', label: 'Never Paid' },
];

export function SuperAdminBillingStatus() {
  const { branch } = useAuth();
  const { getBillingStatus, recordPayment, updateDueDate, getPaymentHistory } = useSuperAdmin();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<BillingOverview>({
    totalTenants: 0,
    totalRevenueCollected: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    totalOverdueAmount: 0,
  });
  const [tenants, setTenants] = useState<TenantBillingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [recordTenant, setRecordTenant] = useState<TenantBillingItem | null>(null);
  const [recordForm, setRecordForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    billingCycle: 'monthly',
    customDays: '30',
    notes: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // History state
  const [historyTenant, setHistoryTenant] = useState<TenantBillingItem | null>(null);
  const [historyRecords, setHistoryRecords] = useState<TenantPaymentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Direct Due Date state
  const [dueDateTenant, setDueDateTenant] = useState<TenantBillingItem | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [submittingDueDate, setSubmittingDueDate] = useState(false);

  const fetchBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBillingStatus();
      if (res.success && res.overview && res.tenants) {
        setOverview(res.overview);
        setTenants(res.tenants);
      } else {
        setError(res.error || 'Failed to fetch billing status');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBilling();
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || t.tenantName.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (t.status === 'active' || t.punctuality.toLowerCase().includes('up to date'))) ||
        (statusFilter === 'due_soon' && (t.status === 'due_soon' || t.punctuality.toLowerCase().includes('due in'))) ||
        (statusFilter === 'overdue' && (t.status === 'overdue' || t.punctuality.toLowerCase().includes('overdue'))) ||
        (statusFilter === 'no_record' && (t.status === 'no_record' || t.punctuality.toLowerCase().includes('never paid')));
      return matchesSearch && matchesStatus;
    });
  }, [tenants, search, statusFilter]);

  // Open Record Payment Modal
  const handleOpenRecordPayment = (t: TenantBillingItem) => {
    setRecordTenant(t);
    setRecordForm({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      billingCycle: t.billingCycle || 'monthly',
      customDays: t.customDays ? String(t.customDays) : '30',
      notes: '',
    });
  };

  // Submit Payment
  const handleRecordPaymentSubmit = async () => {
    if (!recordTenant) return;
    const amt = parseFloat(recordForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }
    if (!recordForm.paymentDate) {
      showToast('Please select a payment date', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await recordPayment(recordTenant.tenantId, {
        amount: amt,
        paymentDate: recordForm.paymentDate,
        billingCycle: recordForm.billingCycle,
        customDays: recordForm.billingCycle === 'custom' ? Number(recordForm.customDays || 30) : undefined,
        notes: recordForm.notes || undefined,
      });

      if (res.success) {
        showToast('Payment recorded successfully! Next due date updated.', 'success');
        setRecordTenant(null);
        fetchBilling();
      } else {
        showToast(res.error || 'Failed to record payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Open History
  const handleOpenHistory = async (t: TenantBillingItem) => {
    setHistoryTenant(t);
    setLoadingHistory(true);
    try {
      const res = await getPaymentHistory(t.tenantId);
      if (res.success) {
        setHistoryRecords(res.payments || []);
      } else {
        showToast(res.error || 'Failed to load payment history', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading payment history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Due Date Editor
  const handleOpenDueDate = (t: TenantBillingItem) => {
    setDueDateTenant(t);
    let dStr = new Date().toISOString().split('T')[0];
    if (t.currentPeriodEndDate) {
      try {
        dStr = new Date(t.currentPeriodEndDate).toISOString().split('T')[0];
      } catch {}
    }
    setNewDueDate(dStr);
  };

  // Submit Due Date
  const handleDueDateSubmit = async () => {
    if (!dueDateTenant || !newDueDate) {
      showToast('Please enter a valid date (YYYY-MM-DD)', 'error');
      return;
    }

    setSubmittingDueDate(true);
    try {
      const res = await updateDueDate(dueDateTenant.tenantId, newDueDate);
      if (res.success) {
        showToast('Next due date updated successfully!', 'success');
        setDueDateTenant(null);
        fetchBilling();
      } else {
        showToast(res.error || 'Failed to update due date', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error');
    } finally {
      setSubmittingDueDate(false);
    }
  };

  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Export Business Report (CSV)
  const handleExportCsv = async () => {
    if (tenants.length === 0) {
      showToast('No billing data available to export', 'warn');
      return;
    }
    setExportingCsv(true);
    try {
      const headers = [
        'Tenant Name',
        'Subdomain',
        'Plan',
        'Billing Cycle',
        'Next Due Date',
        'Days Remaining',
        'Punctuality Status',
        'Total Paid (AED)',
        'Last Payment Date',
        'Last Payment Amount (AED)',
      ];

      const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const rows = tenants.map((t) => [
        escapeCsv(t.tenantName),
        escapeCsv(t.subdomain),
        escapeCsv(t.plan),
        escapeCsv(t.billingCycle || 'monthly'),
        escapeCsv(formatDate(t.currentPeriodEndDate)),
        escapeCsv(t.daysRemaining !== null ? t.daysRemaining : 'N/A'),
        escapeCsv(t.punctuality),
        escapeCsv(Number(t.totalPaid || 0).toFixed(2)),
        escapeCsv(t.lastPaymentDate ? formatDate(t.lastPaymentDate) : 'Never'),
        escapeCsv(t.lastPaymentAmount !== null ? Number(t.lastPaymentAmount).toFixed(2) : '0.00'),
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const filename = `billing_business_report_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Exported Business Report (CSV) successfully!', 'success');
      } else {
        const fileUri = `${documentDirectory}${filename}`;
        await writeAsStringAsync(fileUri, csvContent, { encoding: EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Business Report',
            UTI: 'public.comma-separated-values-text',
          });
        }
        showToast('Exported Business Report (CSV) successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Export CSV error:', err);
      showToast(err.message || 'Failed to export CSV', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  // Export Business Report (PDF)
  const handleExportPdf = async () => {
    if (tenants.length === 0) {
      showToast('No billing data available to export', 'warn');
      return;
    }
    setExportingPdf(true);
    try {
      const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const totalRev = Number(overview.totalRevenueCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const tableRows = tenants.map((t) => {
        const isOverdue = t.status === 'overdue';
        const isPaid = t.punctuality.toLowerCase().includes('up to date') || t.status === 'active';
        const badgeColor = isPaid ? '#166534' : isOverdue ? '#991b1b' : '#92400e';
        const badgeBg = isPaid ? '#f0fdf4' : isOverdue ? '#fef2f2' : '#fffbeb';

        return `<tr>
          <td><strong>${t.tenantName}</strong><br/><span style="font-size: 10.5px; color: #64748b;">${t.subdomain}.cloudynationpos.com</span></td>
          <td>${t.plan} (${(t.billingCycle || 'monthly').replace(/_/g, ' ')})</td>
          <td>${formatDate(t.currentPeriodEndDate)}</td>
          <td><span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor};">${t.punctuality}</span></td>
          <td style="text-align: right; font-weight: 700;">AED ${Number(t.totalPaid || 0).toFixed(2)}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Client Billing Business Report</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .logo-pills {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-right: 6px;
    }
    .pill {
      width: 6px;
      height: 20px;
      border-radius: 3px;
    }
    .pill-lime { background-color: #39ff14; }
    .pill-dark { background-color: #111827; }
    .brand-text {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .brand-text span { color: #39ff14; }
    .company-info {
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
    }
    .title-block { text-align: right; }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.5px;
    }
    .doc-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 14px 0 18px 0;
    }
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin-top: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
      font-weight: 700;
      color: #111827;
      padding: 8px 10px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11.5px;
      color: #111827;
    }
    .footer-divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0 10px 0;
    }
    .footer-text {
      text-align: center;
      font-size: 9.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-wrap">
        <div class="logo-pills">
          <div class="pill pill-lime"></div>
          <div class="pill pill-dark"></div>
        </div>
        <div class="brand-text">cloudynation<span>pos</span></div>
      </div>
      <div class="company-info">
        License No.: CWS-1V-227668 | 26th Floor, Amber Gem Tower, Ajman, UAE<br />
        Info@cloudynationpos.com | www.cloudynationpos.com
      </div>
    </div>
    <div class="title-block">
      <div class="doc-title">BUSINESS BILLING REPORT</div>
      <div class="doc-date">Generated: ${generatedDate}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-label">Clients</div>
      <div class="kpi-val">${overview.totalTenants}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Revenue Collected</div>
      <div class="kpi-val">AED ${totalRev}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Overdue Clients</div>
      <div class="kpi-val" style="color: #dc2626;">${overview.overdueCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Due Soon (≤7d)</div>
      <div class="kpi-val" style="color: #d97706;">${overview.dueSoonCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 32%;">TENANT ACCOUNT</th>
        <th style="width: 22%;">PLAN &amp; CYCLE</th>
        <th style="width: 16%;">NEXT DUE</th>
        <th style="width: 16%;">STATUS</th>
        <th style="width: 14%; text-align: right;">TOTAL PAID</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer-divider"></div>
  <div class="footer-text">
    Electronically generated Business Billing Report - Cloudynation POS SaaS Platform
  </div>
</body>
</html>`;

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.open();
            printWin.document.write(html);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => {
              try { printWin.print(); } catch (e) {}
            }, 300);
            showToast('Report opened in print window!', 'success');
            return;
          }
        }
      }

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Billing-Business-Report.pdf',
        });
      } else {
        await Print.printAsync({ html });
      }
      showToast('Exported Business Report (PDF) successfully!', 'success');
    } catch (err: any) {
      console.error('Export PDF error:', err);
      showToast(err.message || 'Failed to export PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#39ff14" />
        }
      >
          {/* Header Action Bar */}
          <View style={styles.headerBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.screenMainTitle}>Billing Status</Text>
              <Text style={styles.screenSubtitle}>Client subscriptions, offline payments & standings</Text>
            </View>
            <View style={styles.headerBtnGroup}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportCsv}
                disabled={exportingCsv || loading}
              >
                {exportingCsv ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <>
                    <FileSpreadsheet size={13} color="#0f172a" />
                    <Text style={styles.exportBtnText}>CSV</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportPdf}
                disabled={exportingPdf || loading}
              >
                {exportingPdf ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <>
                    <FileText size={13} color="#0f172a" />
                    <Text style={styles.exportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading || refreshing}>
                <RefreshCw size={15} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 4 Summary KPI Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.halfCol}>
              <StatCard
                label="Onboarded Clients"
                value={String(overview.totalTenants)}
                icon={<Building2 size={16} color="#0284c7" />}
                accent="sky"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Total Revenue"
                value={`AED ${Number(overview.totalRevenueCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                icon={<Coins size={16} color="#16a34a" />}
                accent="brand"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Overdue Clients"
                value={String(overview.overdueCount)}
                icon={<AlertTriangle size={16} color="#dc2626" />}
                accent="rose"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Due Soon (≤7d)"
                value={String(overview.dueSoonCount)}
                icon={<Calendar size={16} color="#d97706" />}
                accent="amber"
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Search & Filter Toolbar */}
          <View style={styles.toolbarContainer}>
            <View style={styles.searchRow}>
              <Search size={16} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tenant name or subdomain..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
              <View style={styles.filterPillsRow}>
                {STATUS_FILTERS.map((f) => {
                  const isSelected = statusFilter === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.filterPill, isSelected && styles.filterPillActive]}
                      onPress={() => setStatusFilter(f.id)}
                    >
                      <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Tenants Subscription List */}
          <View style={styles.listSection}>
            <View style={styles.listSectionHeader}>
              <Text style={styles.listSectionTitle}>Client Accounts ({filteredTenants.length})</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#39ff14" />
                <Text style={styles.loadingText}>Loading client subscriptions...</Text>
              </View>
            ) : filteredTenants.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Receipt size={32} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No matching clients</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
              </View>
            ) : (
              filteredTenants.map((t) => {
                const planStyle = PLAN_COLORS[t.plan] || PLAN_COLORS.Starter;
                const punctualityProps = getPunctualityBadgeProps(t.punctuality, t.status);

                return (
                  <View key={t.tenantId} style={styles.tenantCard}>
                    {/* Header: Name + Plan + Punctuality Badge */}
                    <View style={styles.tenantCardHeader}>
                      <View style={styles.tenantNameCol}>
                        <Text style={styles.tenantName} numberOfLines={1}>
                          {t.tenantName}
                        </Text>
                        <Text style={styles.tenantSubdomain}>
                          {t.subdomain ? `${t.subdomain}.cloudynationpos.com` : 'No subdomain'}
                        </Text>
                      </View>
                      <View style={styles.headerBadgesRow}>
                        <View
                          style={[
                            styles.customPlanBadge,
                            { backgroundColor: planStyle.bg, borderColor: planStyle.border },
                          ]}
                        >
                          <Text style={[styles.customPlanBadgeText, { color: planStyle.text }]}>
                            {t.plan || 'Starter'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Banner */}
                    <View
                      style={[
                        styles.punctualityBanner,
                        {
                          backgroundColor: punctualityProps.bg,
                          borderColor: punctualityProps.border,
                        },
                      ]}
                    >
                      <View style={styles.statusDotRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: punctualityProps.text },
                          ]}
                        />
                        <Text
                          style={[
                            styles.punctualityLabel,
                            { color: punctualityProps.text },
                          ]}
                        >
                          {punctualityProps.label}
                        </Text>
                      </View>
                      <Text style={styles.cycleLabel}>
                        {t.billingCycle === 'custom'
                          ? `Custom (${t.customDays || 30}d)`
                          : t.billingCycle === '6_months'
                          ? '6 Months'
                          : t.billingCycle || 'Monthly'}
                      </Text>
                    </View>

                    {/* Details Grid */}
                    <View style={styles.tenantDetailsGrid}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailTitle}>Next Due Date</Text>
                        <View style={styles.dueDateRow}>
                          <Text style={styles.detailValue}>
                            {formatDate(t.currentPeriodEndDate)}
                          </Text>
                          <TouchableOpacity
                            style={styles.editDueDateBtn}
                            onPress={() => handleOpenDueDate(t)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Pencil size={12} color="#0284c7" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.detailCol}>
                        <Text style={styles.detailTitle}>Total Paid All-Time</Text>
                        <Text style={styles.detailValueBold}>
                          AED {Number(t.totalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>

                    {/* Last Payment Info */}
                    <View style={styles.lastPaymentRow}>
                      <Clock size={12} color="#64748b" />
                      <Text style={styles.lastPaymentText}>
                        Last Payment:{' '}
                        {t.lastPaymentAmount !== null
                          ? `AED ${Number(t.lastPaymentAmount).toFixed(2)} on ${formatDate(t.lastPaymentDate)}`
                          : 'Never Paid'}
                      </Text>
                    </View>

                    {/* Action Buttons: Record Payment & History */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.recordPaymentBtn}
                        onPress={() => handleOpenRecordPayment(t)}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={14} color="#0f172a" />
                        <Text style={styles.recordPaymentBtnText}>Record Payment</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => handleOpenHistory(t)}
                        activeOpacity={0.8}
                      >
                        <History size={14} color="#334155" />
                        <Text style={styles.historyBtnText}>History</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScreenBody>

        {/* ========================================================= */}
        {/* MODAL: RECORD OFFLINE PAYMENT                             */}
        {/* ========================================================= */}
        <Modal
          visible={!!recordTenant}
          transparent
          animationType="fade"
          onRequestClose={() => setRecordTenant(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Record Offline Payment</Text>
                  <Text style={styles.modalSub}>{recordTenant?.tenantName}</Text>
                </View>
                <TouchableOpacity onPress={() => setRecordTenant(null)} style={styles.modalCloseBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Amount */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment Amount (AED) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 1500.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={recordForm.amount}
                    onChangeText={(v) => setRecordForm({ ...recordForm, amount: v })}
                  />
                </View>

                {/* Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    value={recordForm.paymentDate}
                    onChangeText={(v) => setRecordForm({ ...recordForm, paymentDate: v })}
                  />
                </View>

                {/* Billing Cycle Adjustment */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Auto-Extend Period By Cycle *</Text>
                  <View style={styles.cycleButtonsGrid}>
                    {BILLING_CYCLES.map((c) => {
                      const isSel = recordForm.billingCycle === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.cycleBtn, isSel && styles.cycleBtnActive]}
                          onPress={() => setRecordForm({ ...recordForm, billingCycle: c.id })}
                        >
                          <Text style={[styles.cycleBtnText, isSel && styles.cycleBtnTextActive]}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {recordForm.billingCycle === 'custom' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Custom Duration (Days)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="30"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={recordForm.customDays}
                      onChangeText={(v) => setRecordForm({ ...recordForm, customDays: v })}
                    />
                  </View>
                )}

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Reference / Notes (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                    placeholder="e.g. Bank transfer ref #12345, Cash collection..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    value={recordForm.notes}
                    onChangeText={(v) => setRecordForm({ ...recordForm, notes: v })}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setRecordTenant(null)}
                  disabled={submittingPayment}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRecordPaymentSubmit}
                  disabled={submittingPayment}
                >
                  {submittingPayment ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: PAYMENT HISTORY SHEET                              */}
        {/* ========================================================= */}
        <Modal
          visible={!!historyTenant}
          transparent
          animationType="fade"
          onRequestClose={() => setHistoryTenant(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Payment History</Text>
                  <Text style={styles.modalSub}>{historyTenant?.tenantName}</Text>
                </View>
                <TouchableOpacity onPress={() => setHistoryTenant(null)} style={styles.modalCloseBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {loadingHistory ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#39ff14" />
                    <Text style={styles.loadingText}>Fetching payment history...</Text>
                  </View>
                ) : historyRecords.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <FileText size={32} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No past payments</Text>
                    <Text style={styles.emptySubtitle}>No offline or online payments recorded for this tenant yet.</Text>
                  </View>
                ) : (
                  historyRecords.map((p) => (
                    <View key={p.id} style={styles.historyCard}>
                      <View style={styles.historyCardHeader}>
                        <Text style={styles.historyAmount}>
                          {p.currency || 'AED'} {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                        <Text style={styles.historyDate}>
                          {formatDateTime(p.paymentDate)}
                        </Text>
                      </View>
                      <View style={styles.historyPeriodRow}>
                        <Text style={styles.historyPeriodLabel}>Period Covered:</Text>
                        <Text style={styles.historyPeriodValue}>
                          {formatDate(p.periodCoveredStart)} → {formatDate(p.periodCoveredEnd)}
                        </Text>
                      </View>
                      {p.notes ? (
                        <Text style={styles.historyNotes}>Note: {p.notes}</Text>
                      ) : null}
                      <Text style={styles.historyRecordedBy}>
                        Recorded By: {p.recordedBy || 'Super Admin'}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.closeFullBtn} onPress={() => setHistoryTenant(null)}>
                  <Text style={styles.closeFullBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: DIRECT DUE DATE OVERRIDE                           */}
        {/* ========================================================= */}
        <Modal
          visible={!!dueDateTenant}
          transparent
          animationType="fade"
          onRequestClose={() => setDueDateTenant(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Override Next Due Date</Text>
                  <Text style={styles.modalSub}>{dueDateTenant?.tenantName}</Text>
                </View>
                <TouchableOpacity onPress={() => setDueDateTenant(null)} style={styles.modalCloseBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalNotice}>
                  Adjusting this date directly updates the client's subscription punctuality status without creating a payment entry.
                </Text>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>New Current Period End Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDueDateTenant(null)}
                  disabled={submittingDueDate}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleDueDateSubmit}
                  disabled={submittingDueDate}
                >
                  {submittingDueDate ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Due Date</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Global Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(null)}
            onDismiss={() => setToast(null)}
          />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  halfCol: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    flex: 1,
    fontWeight: '500',
  },
  toolbarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 13,
    color: '#0f172a',
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterPillsScroll: {
    marginTop: 10,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  listSection: {
    gap: 12,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tenantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  tenantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenantNameCol: {
    flex: 1,
    marginRight: 8,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  tenantSubdomain: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  customPlanBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  punctualityBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  punctualityLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  cycleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  tenantDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  detailValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  editDueDateBtn: {
    padding: 3,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderRadius: 6,
  },
  lastPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  lastPaymentText: {
    fontSize: 11,
    color: '#64748b',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  recordPaymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingVertical: 9,
    borderRadius: 10,
  },
  recordPaymentBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyBtn: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
  },
  modalNotice: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  cycleButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cycleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cycleBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cycleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cycleBtnTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#39ff14',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  // History cards
  historyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    gap: 4,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748b',
  },
  historyPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  historyPeriodLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  historyPeriodValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  historyNotes: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontStyle: 'italic',
  },
  historyRecordedBy: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeFullBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
});
