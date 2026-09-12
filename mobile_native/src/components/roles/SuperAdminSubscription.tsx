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
  Alert,
} from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toast, ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import {
  useSuperAdmin,
  TenantInvoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from '../../lib/SuperAdminContext';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  FileText,
  Link2,
  Pencil,
  Trash2,
  Building2,
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

function toISODateInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Plan entitlements and standard base pricing
const PLAN_PRICING: Record<string, { monthlyPrice: number; annualPricePerMonth: number }> = {
  Starter: { monthlyPrice: 899, annualPricePerMonth: 764 },
  Growth: { monthlyPrice: 1690, annualPricePerMonth: 1437 },
  Enterprise: { monthlyPrice: 4999, annualPricePerMonth: 4249 },
  Custom: { monthlyPrice: 0, annualPricePerMonth: 0 },
};

function calculateInvoicePricing(
  planName: string,
  cycle: string,
  customDays?: number,
  customAmount?: number
) {
  if (customAmount !== undefined && customAmount !== null && !isNaN(customAmount) && customAmount >= 0) {
    const sub = Number(customAmount);
    const vat = Number((sub * 0.05).toFixed(2));
    return {
      subtotal: sub,
      vatAmount: vat,
      totalAmount: Number((sub + vat).toFixed(2)),
    };
  }

  const p = PLAN_PRICING[planName] || PLAN_PRICING.Starter;
  let sub = p.monthlyPrice;
  if (cycle === 'yearly') {
    sub = p.annualPricePerMonth * 12;
  } else if (cycle === '6_months') {
    sub = p.monthlyPrice * 6;
  } else if (cycle === 'quarterly') {
    sub = p.monthlyPrice * 3;
  } else if (cycle === 'custom') {
    const d = customDays && customDays > 0 ? customDays : 30;
    sub = (p.monthlyPrice / 30) * d;
  }

  const vat = Number((sub * 0.05).toFixed(2));
  const total = Number((sub + vat).toFixed(2));
  return {
    subtotal: Number(sub.toFixed(2)),
    vatAmount: vat,
    totalAmount: total,
  };
}

function computeDefaultEndDate(startDateStr: string, cycle: string, customDays?: number): string {
  const d = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else if (cycle === '6_months') next.setMonth(next.getMonth() + 6);
  else if (cycle === 'quarterly') next.setMonth(next.getMonth() + 3);
  else if (cycle === 'custom') {
    const days = customDays && customDays > 0 ? customDays : 30;
    next.setDate(next.getDate() + days);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return toISODateInput(next);
}

// Helper to map invoice payment status to readable text and badge variant
function getInvoiceStatusInfo(status: string): {
  label: string;
  variant: 'success' | 'warn' | 'error' | 'neutral';
} {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'manual_paid' || s === 'settled') {
    return { label: s === 'manual_paid' ? 'Manual Paid' : 'Paid & Settled', variant: 'success' };
  }
  if (s === 'overdue' || s === 'failed') {
    return { label: 'Overdue', variant: 'error' };
  }
  if (s.includes('pending') || s.includes('gateway')) {
    return { label: 'Pending Gateway', variant: 'warn' };
  }
  return { label: status || 'Pending', variant: 'neutral' };
}

const INVOICE_STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid & Settled' },
  { id: 'pending_gateway_integration', label: 'Pending Gateway' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'manual_paid', label: 'Manual Paid' },
];

const INVOICE_PLANS = ['all', 'Starter', 'Growth', 'Enterprise'];
const AVAILABLE_PLANS = ['Starter', 'Growth', 'Enterprise', 'Custom'];
const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly (3m)' },
  { id: '6_months', label: '6 Months' },
  { id: 'yearly', label: 'Annual (12m)' },
  { id: 'custom', label: 'Custom' },
];

/**
 * SuperAdminSubscription Screen
 * Standalone view for managing and browsing subscription invoices across all tenants.
 */
export function SuperAdminSubscription() {
  const { branch } = useAuth();
  const {
    invoices,
    invoicesTotal,
    invoicesPage,
    invoicesLimit,
    loading,
    error,
    fetchInvoices,
    tenants,
    fetchTenants,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generatePaymentLink,
    downloadInvoicePdf,
  } = useSuperAdmin();

  const [refreshing, setRefreshing] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Filter States
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('all');
  const [invoicePlan, setInvoicePlan] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Action Loading States per action per Invoice
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  // Create / Edit Modal State
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<TenantInvoice | null>(null);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Form Fields
  const [formTenantId, setFormTenantId] = useState('');
  const [formPlanName, setFormPlanName] = useState('Starter');
  const [formBillingCycle, setFormBillingCycle] = useState('monthly');
  const [formCustomDays, setFormCustomDays] = useState('30');
  const [formCustomAmount, setFormCustomAmount] = useState('');
  const [formPeriodStart, setFormPeriodStart] = useState('');
  const [formPeriodEnd, setFormPeriodEnd] = useState('');

  // Delete Confirmation Modal State
  const [deleteTargetInvoice, setDeleteTargetInvoice] = useState<TenantInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch invoices on filter/page change
  useEffect(() => {
    fetchInvoices({
      search: invoiceSearch,
      status: invoiceStatus,
      plan: invoicePlan,
      page: currentPage,
      limit: 10,
    }).catch(() => {});
  }, [invoiceSearch, invoiceStatus, invoicePlan, currentPage]);

  // Ensure tenants list is loaded for picker
  useEffect(() => {
    if (tenants.length === 0) {
      fetchTenants().catch(() => {});
    }
  }, [tenants.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetchInvoices({
          search: invoiceSearch,
          status: invoiceStatus,
          plan: invoicePlan,
          page: currentPage,
          limit: 10,
        }),
        fetchTenants(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Open Create Invoice Form
  const handleOpenCreate = () => {
    setEditingInvoice(null);
    const defaultTenant = tenants[0]?.id || '';
    setFormTenantId(defaultTenant);
    setFormPlanName(tenants[0]?.plan || 'Starter');
    setFormBillingCycle('monthly');
    setFormCustomDays('30');
    setFormCustomAmount('');
    const nowStr = toISODateInput(new Date());
    setFormPeriodStart(nowStr);
    setFormPeriodEnd(computeDefaultEndDate(nowStr, 'monthly'));
    setInvoiceModalVisible(true);
  };

  // Open Edit Invoice Form
  const handleOpenEdit = (inv: TenantInvoice) => {
    if (inv.paymentStatus === 'paid' || inv.paymentStatus === 'manual_paid') {
      showToast('Cannot edit a paid or settled invoice', 'warn');
      return;
    }
    setEditingInvoice(inv);
    setFormTenantId(inv.tenantId);
    setFormPlanName(inv.planName || 'Starter');
    setFormBillingCycle(inv.billingCycle || 'monthly');
    setFormCustomDays(String(inv.durationMonths ? inv.durationMonths * 30 : 30));
    setFormCustomAmount(String(inv.subtotal || ''));
    const sStr = inv.periodStart ? toISODateInput(new Date(inv.periodStart)) : toISODateInput(new Date());
    const eStr = inv.periodEnd ? toISODateInput(new Date(inv.periodEnd)) : computeDefaultEndDate(sStr, inv.billingCycle || 'monthly');
    setFormPeriodStart(sStr);
    setFormPeriodEnd(eStr);
    setInvoiceModalVisible(true);
  };

  // Recalculate end date whenever cycle or start date changes
  const handleCycleChange = (cycle: string) => {
    setFormBillingCycle(cycle);
    const customDaysNum = parseInt(formCustomDays) || 30;
    setFormPeriodEnd(computeDefaultEndDate(formPeriodStart, cycle, customDaysNum));
  };

  const handleStartDateChange = (dateText: string) => {
    setFormPeriodStart(dateText);
    const customDaysNum = parseInt(formCustomDays) || 30;
    setFormPeriodEnd(computeDefaultEndDate(dateText, formBillingCycle, customDaysNum));
  };

  // Live Pricing Calculation
  const livePricing = useMemo(() => {
    const customDaysNum = parseInt(formCustomDays) || 30;
    const customAmtNum = formCustomAmount.trim() ? parseFloat(formCustomAmount) : undefined;
    return calculateInvoicePricing(formPlanName, formBillingCycle, customDaysNum, customAmtNum);
  }, [formPlanName, formBillingCycle, formCustomDays, formCustomAmount]);

  // Submit Create or Edit Invoice
  const handleSubmitInvoice = async () => {
    if (!formTenantId) {
      showToast('Please select a tenant account', 'error');
      return;
    }
    if (!formPeriodStart.trim()) {
      showToast('Please specify a period start date', 'error');
      return;
    }

    setSubmittingInvoice(true);
    try {
      const customAmt = formCustomAmount.trim() ? parseFloat(formCustomAmount) : undefined;
      const customDays = parseInt(formCustomDays) || undefined;

      if (editingInvoice) {
        const updateInput: UpdateInvoiceInput = {
          planName: formPlanName,
          billingCycle: formBillingCycle,
          customDays,
          customAmount: customAmt,
          periodStart: formPeriodStart,
          periodEnd: formPeriodEnd,
          subtotal: livePricing.subtotal,
          vatAmount: livePricing.vatAmount,
          totalAmount: livePricing.totalAmount,
        };
        const res = await updateInvoice(editingInvoice.id, updateInput);
        if (res.success) {
          showToast(`Invoice ${editingInvoice.invoiceNumber} updated successfully!`, 'success');
          setInvoiceModalVisible(false);
        } else {
          showToast(res.error || 'Failed to update invoice', 'error');
        }
      } else {
        const createInput: CreateInvoiceInput = {
          tenantId: formTenantId,
          planName: formPlanName,
          billingCycle: formBillingCycle,
          customDays,
          customAmount: customAmt,
          periodStart: formPeriodStart,
          periodEnd: formPeriodEnd,
        };
        const res = await createInvoice(createInput);
        if (res.success) {
          showToast(`Tax Invoice created successfully!`, 'success');
          setInvoiceModalVisible(false);
        } else {
          showToast(res.error || 'Failed to create invoice', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Generate / Regenerate Payment Link Action
  const handleGenerateLink = async (inv: TenantInvoice) => {
    if (inv.paymentStatus === 'paid' || inv.paymentStatus === 'manual_paid') {
      showToast('Invoice is already settled and paid', 'warn');
      return;
    }

    setActionLoadingKey(`${inv.id}:link`);
    try {
      const res = await generatePaymentLink(inv.id);
      if (res.success && res.paymentUrl) {
        showToast(`Payment link ready for ${inv.invoiceNumber}!`, 'success');
      } else {
        showToast(res.error || 'Failed to generate payment link', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error generating link', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Download / Share Invoice PDF
  const handleDownloadPdf = async (inv: TenantInvoice) => {
    setActionLoadingKey(`${inv.id}:pdf`);
    try {
      const res = await downloadInvoicePdf(inv.id);
      if (res.success) {
        showToast(`Invoice PDF generated successfully!`, 'success');
      } else {
        showToast(res.error || 'Failed to generate invoice PDF', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error downloading PDF', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Delete Invoice Action
  const handleConfirmDelete = async () => {
    if (!deleteTargetInvoice) return;
    setDeleting(true);
    try {
      const res = await deleteInvoice(deleteTargetInvoice.id);
      if (res.success) {
        showToast(res.message || `Invoice deleted successfully`, 'success');
        setDeleteTargetInvoice(null);
      } else {
        showToast(res.error || 'Failed to delete invoice', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting invoice', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(invoicesTotal / (invoicesLimit || 10)));
  const paidCount = invoices.filter((i) => i.paymentStatus === 'paid' || i.paymentStatus === 'manual_paid').length;

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
              <Text style={styles.screenMainTitle}>Subscription Invoices</Text>
              <Text style={styles.screenSubtitle}>Tenant tax invoices & payment gateway statuses</Text>
            </View>
            <View style={styles.headerBtnGroup}>
              <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate}>
                <Plus size={14} color="#0f172a" style={{ marginRight: 4 }} />
                <Text style={styles.createBtnText}>Create Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading || refreshing}>
                <RefreshCw size={15} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.halfCol}>
              <StatCard
                label="Total Invoices"
                value={String(invoicesTotal)}
                icon={<Receipt size={16} color="#0284c7" />}
                accent="sky"
              />
            </View>
            <View style={styles.halfCol}>
              <StatCard
                label="Settled / Paid"
                value={String(paidCount)}
                icon={<CheckCircle2 size={16} color="#22c55e" />}
                accent="brand"
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Search size={15} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search invoice # or tenant name..."
              placeholderTextColor="#94a3b8"
              value={invoiceSearch}
              onChangeText={(txt) => {
                setInvoiceSearch(txt);
                setCurrentPage(1);
              }}
            />
            {invoiceSearch.length > 0 && (
              <TouchableOpacity onPress={() => setInvoiceSearch('')} style={styles.clearBtn}>
                <X size={14} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills: Payment Status */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              {INVOICE_STATUSES.map((item) => {
                const active = invoiceStatus === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => {
                      setInvoiceStatus(item.id);
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Filter Pills: Plan */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Plan:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              {INVOICE_PLANS.map((p) => {
                const active = invoicePlan === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => {
                      setInvoicePlan(p);
                      setCurrentPage(1);
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

          {/* Invoices Cards List */}
          {invoices.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Receipt size={24} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No matching invoices</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or filter options.</Text>
            </Card>
          ) : (
            <View style={styles.cardsList}>
              {invoices.map((inv) => {
                const statusInfo = getInvoiceStatusInfo(inv.paymentStatus);
                const isPaid = inv.paymentStatus === 'paid' || inv.paymentStatus === 'manual_paid';
                const isPdfLoading = actionLoadingKey === `${inv.id}:pdf`;
                const isLinkLoading = actionLoadingKey === `${inv.id}:link`;
                const totalFormatted = Number(inv.totalAmount || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                return (
                  <Card key={inv.id} style={styles.itemCard}>
                    {/* Header Row: Number + Tenant + Status Badge */}
                    <View style={styles.itemCardTop}>
                      <View style={styles.itemTitleBlock}>
                        <Text style={styles.invoiceNumberText}>{inv.invoiceNumber}</Text>
                        <Text style={styles.invoiceTenantText}>{inv.tenantName || 'Tenant Account'}</Text>
                      </View>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </View>

                    {/* Plan & Amount Row */}
                    <View style={styles.invoiceInfoRow}>
                      <View style={styles.invoicePlanPill}>
                        <Text style={styles.invoicePlanText}>
                          {inv.planName} · {(inv.billingCycle || 'monthly').replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.invoiceAmountText}>
                        {inv.currency || 'AED'} {totalFormatted}
                      </Text>
                    </View>

                    {/* Subtotal & VAT Breakdown */}
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>
                        Subtotal: {inv.currency || 'AED'} {Number(inv.subtotal || 0).toFixed(2)} + VAT (5%): {inv.currency || 'AED'} {Number(inv.vatAmount || 0).toFixed(2)}
                      </Text>
                    </View>

                    {/* Gateway Integration Status Row */}
                    <View style={styles.gatewayStatusRow}>
                      <View style={styles.gatewayBadgeGroup}>
                        {inv.mamoPaymentUrl ? (
                          <>
                            <Badge variant="brand">Link Ready</Badge>
                            <Badge variant="info">Mamo Pay (Live)</Badge>
                          </>
                        ) : (
                          <Badge variant="neutral">Mamo Pay · No Link</Badge>
                        )}
                      </View>
                      <View style={styles.datesSummary}>
                        <Calendar size={11} color="#94a3b8" />
                        <Text style={styles.invoiceDateText}>
                          Due: {formatDate(inv.periodEnd)}
                        </Text>
                      </View>
                    </View>

                    {/* Action Bar per Invoice */}
                    <View style={styles.cardActionsRow}>
                      {/* PDF Action */}
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => handleDownloadPdf(inv)}
                        disabled={isPdfLoading}
                      >
                        {isPdfLoading ? (
                          <ActivityIndicator size="small" color="#0284c7" />
                        ) : (
                          <>
                            <FileText size={13} color="#0284c7" />
                            <Text style={[styles.cardActionBtnText, { color: '#0284c7' }]}>PDF</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* Payment Link Action */}
                      {!isPaid && (
                        <TouchableOpacity
                          style={[styles.cardActionBtn, styles.cardActionBtnHighlight]}
                          onPress={() => handleGenerateLink(inv)}
                          disabled={isLinkLoading}
                        >
                          {isLinkLoading ? (
                            <ActivityIndicator size="small" color="#0f172a" />
                          ) : (
                            <>
                              <Link2 size={13} color="#0f172a" />
                              <Text style={[styles.cardActionBtnText, { color: '#0f172a' }]}>
                                {inv.mamoPaymentUrl ? 'Regen Link' : 'Generate Link'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Edit Action (if not paid) */}
                      {!isPaid && (
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={() => handleOpenEdit(inv)}
                          disabled={isPdfLoading || isLinkLoading}
                        >
                          <Pencil size={13} color="#475569" />
                          <Text style={styles.cardActionBtnText}>Edit</Text>
                        </TouchableOpacity>
                      )}

                      {/* Delete Action (if not paid) */}
                      {!isPaid && (
                        <TouchableOpacity
                          style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
                          onPress={() => setDeleteTargetInvoice(inv)}
                          disabled={isPdfLoading || isLinkLoading}
                        >
                          <Trash2 size={13} color="#dc2626" />
                          <Text style={[styles.cardActionBtnText, { color: '#dc2626' }]}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <View style={styles.paginationBar}>
              <TouchableOpacity
                style={[styles.paginationBtn, currentPage <= 1 && styles.paginationBtnDisabled]}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} color={currentPage <= 1 ? '#94a3b8' : '#0f172a'} />
                <Text style={[styles.paginationBtnText, currentPage <= 1 && styles.paginationBtnTextDisabled]}>
                  Prev
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationPageIndicator}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationBtn, currentPage >= totalPages && styles.paginationBtnDisabled]}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <Text style={[styles.paginationBtnText, currentPage >= totalPages && styles.paginationBtnTextDisabled]}>
                  Next
                </Text>
                <ChevronRight size={16} color={currentPage >= totalPages ? '#94a3b8' : '#0f172a'} />
              </TouchableOpacity>
            </View>
          )}
        </ScreenBody>

        {/* Global Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(null)}
            onDismiss={() => setToast(null)}
          />
        )}

        {/* Create / Edit Invoice Modal */}
        <Modal visible={invoiceModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingInvoice ? 'Edit Subscription Invoice' : 'Create Subscription Invoice'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {editingInvoice
                      ? `Ref: ${editingInvoice.invoiceNumber}`
                      : 'Generate official branded tax invoice with gateway link'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setInvoiceModalVisible(false)} style={styles.modalCloseBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Tenant Selection (Create Only) */}
                {!editingInvoice ? (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Target Tenant Account *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tenantPillsRow}>
                      {tenants.map((t) => {
                        const isSelected = formTenantId === t.id;
                        return (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.tenantPickerPill, isSelected && styles.tenantPickerPillActive]}
                            onPress={() => {
                              setFormTenantId(t.id);
                              if (t.plan) setFormPlanName(t.plan);
                            }}
                          >
                            <Building2 size={12} color={isSelected ? '#0f172a' : '#64748b'} />
                            <Text style={[styles.tenantPickerPillText, isSelected && styles.tenantPickerPillTextActive]}>
                              {t.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.lockedTenantBanner}>
                    <Building2 size={14} color="#475569" />
                    <Text style={styles.lockedTenantText}>
                      Tenant: <Text style={{ fontWeight: '700' }}>{editingInvoice.tenantName || 'Tenant'}</Text>
                    </Text>
                  </View>
                )}

                {/* Plan Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Subscription Plan</Text>
                  <View style={styles.pillsGrid}>
                    {AVAILABLE_PLANS.map((p) => {
                      const isSelected = formPlanName === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[styles.choicePill, isSelected && styles.choicePillActive]}
                          onPress={() => setFormPlanName(p)}
                        >
                          <Text style={[styles.choicePillText, isSelected && styles.choicePillTextActive]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Billing Cycle Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Billing Cycle</Text>
                  <View style={styles.pillsGrid}>
                    {BILLING_CYCLES.map((c) => {
                      const isSelected = formBillingCycle === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.choicePill, isSelected && styles.choicePillActive]}
                          onPress={() => handleCycleChange(c.id)}
                        >
                          <Text style={[styles.choicePillText, isSelected && styles.choicePillTextActive]}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Custom Days Input (if cycle is custom) */}
                {formBillingCycle === 'custom' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Custom Duration (Days)</Text>
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={formCustomDays}
                      onChangeText={(val) => {
                        setFormCustomDays(val);
                        const days = parseInt(val) || 30;
                        setFormPeriodEnd(computeDefaultEndDate(formPeriodStart, 'custom', days));
                      }}
                      placeholder="e.g. 45"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                )}

                {/* Custom Pricing Override */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Custom Pricing Override (AED Subtotal - Optional)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={formCustomAmount}
                    onChangeText={setFormCustomAmount}
                    placeholder="Leave empty to use plan default"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Period Dates Row */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={styles.formLabel}>Period Start (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={formPeriodStart}
                      onChangeText={handleStartDateChange}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={styles.formLabel}>Period End (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={formPeriodEnd}
                      onChangeText={setFormPeriodEnd}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                {/* Live Pricing Summary Box */}
                <View style={styles.pricingSummaryBox}>
                  <View style={styles.pricingSummaryHeader}>
                    <Text style={styles.pricingSummaryTitle}>Calculated Pricing</Text>
                    <Badge variant="brand">Live Preview</Badge>
                  </View>
                  <View style={styles.pricingLine}>
                    <Text style={styles.pricingLabel}>Subtotal</Text>
                    <Text style={styles.pricingVal}>AED {livePricing.subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.pricingLine}>
                    <Text style={styles.pricingLabel}>VAT (5.0%)</Text>
                    <Text style={styles.pricingVal}>AED {livePricing.vatAmount.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.pricingLine, styles.pricingLineTotal]}>
                    <Text style={styles.pricingTotalLabel}>Total Amount</Text>
                    <Text style={styles.pricingTotalVal}>AED {livePricing.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setInvoiceModalVisible(false)}
                  disabled={submittingInvoice}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmitInvoice}
                  disabled={submittingInvoice}
                >
                  {submittingInvoice ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {editingInvoice ? 'Save Changes' : 'Create Tax Invoice'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal visible={!!deleteTargetInvoice} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.deleteDialogCard}>
              <View style={styles.deleteIconWrap}>
                <Trash2 size={24} color="#dc2626" />
              </View>
              <Text style={styles.deleteDialogTitle}>Delete Invoice?</Text>
              <Text style={styles.deleteDialogText}>
                Are you sure you want to delete invoice{' '}
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>
                  {deleteTargetInvoice?.invoiceNumber}
                </Text>
                ? This action cannot be undone.
              </Text>
              <View style={styles.deleteDialogFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteTargetInvoice(null)}
                  disabled={deleting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteBtn}
                  onPress={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmDeleteBtnText}>Delete Invoice</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
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
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
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
  twoColRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
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
  invoiceNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  invoiceTenantText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  invoicePlanPill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  invoicePlanText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  invoiceAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownRow: {
    marginTop: 2,
    marginBottom: 6,
  },
  breakdownText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  gatewayStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  gatewayBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  datesSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invoiceDateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  cardActionBtnHighlight: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#bbf7d0',
  },
  cardActionBtnDanger: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
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
    marginTop: 14,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
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
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  tenantPillsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  tenantPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tenantPickerPillActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderColor: '#39ff14',
  },
  tenantPickerPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tenantPickerPillTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  lockedTenantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  lockedTenantText: {
    fontSize: 12,
    color: '#475569',
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  choicePillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  choicePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  choicePillTextActive: {
    color: '#ffffff',
  },
  pricingSummaryBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  pricingSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pricingSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  pricingLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  pricingLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  pricingVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pricingLineTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  pricingTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  pricingTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#39ff14',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Delete Dialog Card
  deleteDialogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    alignSelf: 'center',
    width: '88%',
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteDialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  deleteDialogText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  deleteDialogFooter: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
