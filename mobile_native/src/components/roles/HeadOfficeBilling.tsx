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
  Linking,
} from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Toast, type ToastType } from '../ui/Toast';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useHeadOffice } from '../../lib/HeadOfficeContext';
import {
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  Receipt,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Store,
  Layers,
  Sparkles,
  X,
  ChevronRight,
  ShieldCheck,
  DollarSign,
} from 'lucide-react-native';

export function HeadOfficeBillingScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { getMyBilling } = useHeadOffice();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingData, setBillingData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Invoice Filters & Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const loadBilling = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getMyBilling();
      if (res?.success && res.data) {
        setBillingData(res.data);
      } else {
        showToast(res?.error || 'Failed to load subscription & billing data', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error connecting to billing service', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getMyBilling]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const tenant = billingData?.tenant || {};
  const subscription = billingData?.subscription || {};
  const branchCount = billingData?.branchCount || 0;
  const outletLimit = tenant.outletLimit || 5;
  const tillLimit = tenant.tillLimit || 10;
  const monthlyOrderLimit = tenant.monthlyOrderLimit || 10000;
  const outletUsagePercent = Math.min(100, Math.round((branchCount / outletLimit) * 100));

  const allInvoices = billingData?.invoices || [];
  const allPayments = billingData?.payments || [];

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv: any) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = inv.invoiceNumber?.toLowerCase().includes(q);
        const planMatch = inv.planName?.toLowerCase().includes(q);
        if (!numMatch && !planMatch) return false;
      }

      if (statusFilter !== 'all') {
        const s = inv.paymentStatus?.toLowerCase() || '';
        if (statusFilter === 'paid') {
          if (s !== 'paid' && s !== 'manual_paid') return false;
        } else if (statusFilter === 'pending') {
          if (s !== 'pending' && s !== 'pending_gateway_integration') return false;
        } else if (statusFilter === 'overdue') {
          if (s !== 'overdue') return false;
        }
      }

      return true;
    });
  }, [allInvoices, searchQuery, statusFilter]);

  const formatDate = (d: any) => {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime())
      ? String(d)
      : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handlePayNow = async (payUrl: string) => {
    if (!payUrl) {
      showToast('No online payment link attached to this invoice', 'warn');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(payUrl);
      if (supported) {
        await Linking.openURL(payUrl);
      } else {
        showToast('Unable to open payment portal on this device', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error opening payment link', 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader
        title="Subscription & Billing"
        subtitle="Plan, limits, renewal & invoice history"
        onBack={onBack}
      />

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      <ScreenBody
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBilling(true)}
            colors={['#39ff14']}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#39ff14" />
            <Text style={styles.loadingText}>Loading subscription & billing details...</Text>
          </View>
        ) : (
          <>
            {/* 1. Subscription Status Banner */}
            <View style={styles.planBanner}>
              <View style={styles.planBannerTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.planBadgeRow}>
                    <Sparkles size={14} color="#39ff14" style={{ marginRight: 6 }} />
                    <Text style={styles.planTitle}>{tenant.plan || 'Starter'} Plan</Text>
                  </View>
                  <Text style={styles.tenantNameText}>{tenant.name || 'Cloudynation POS Tenant'}</Text>
                  <Text style={styles.subdomainText}>subdomain: {tenant.subdomain}.cloudynation.com</Text>
                </View>
                <Badge variant={statusVariant(tenant.status || 'Active')}>
                  {(tenant.status || 'ACTIVE').toUpperCase()}
                </Badge>
              </View>

              <View style={styles.bannerDivider} />

              <View style={styles.bannerMetaRow}>
                <View style={styles.bannerMetaCol}>
                  <Text style={styles.bannerMetaLabel}>Next Renewal</Text>
                  <Text style={styles.bannerMetaValue}>
                    {formatDate(subscription.currentPeriodEndDate)}
                  </Text>
                </View>
                <View style={styles.bannerMetaCol}>
                  <Text style={styles.bannerMetaLabel}>Billing Cycle</Text>
                  <Text style={[styles.bannerMetaValue, { textTransform: 'capitalize' }]}>
                    {subscription.billingCycle ? subscription.billingCycle.replace(/_/g, ' ') : 'Monthly'}
                  </Text>
                </View>
                <View style={styles.bannerMetaCol}>
                  <Text style={styles.bannerMetaLabel}>Currency</Text>
                  <Text style={styles.bannerMetaValue}>{tenant.currency || 'AED'}</Text>
                </View>
              </View>
            </View>

            {/* 2. Quota & Limits Card */}
            <Text style={styles.sectionTitle}>Plan Quotas & Utilization</Text>
            <Card>
              <View style={styles.quotaContainer}>
                {/* Outlets Progress Bar */}
                <View style={styles.quotaHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Store size={16} color="#0284c7" />
                    <Text style={styles.quotaLabel}>Outlets Utilization</Text>
                  </View>
                  <Text style={styles.quotaUsageValue}>
                    {branchCount} / {outletLimit} Outlets
                  </Text>
                </View>

                {/* Meter Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${outletUsagePercent}%`,
                        backgroundColor:
                          outletUsagePercent >= 100
                            ? '#e11d48'
                            : outletUsagePercent >= 80
                            ? '#d97706'
                            : '#16a34a',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.quotaSubText}>
                  {outletLimit - branchCount > 0
                    ? `${outletLimit - branchCount} outlet slots remaining on your plan`
                    : 'Outlet limit reached. Contact Super Admin to upgrade.'}
                </Text>

                <View style={styles.quotaDivider} />

                {/* Tills & TRN Grid */}
                <View style={styles.quotaStatsGrid}>
                  <View style={styles.quotaStatCol}>
                    <Text style={styles.statSubLabel}>Tills Limit</Text>
                    <Text style={styles.statBoldVal}>{tillLimit} tills</Text>
                  </View>
                  <View style={styles.quotaStatCol}>
                    <Text style={styles.statSubLabel}>TRN Number</Text>
                    <Text style={styles.statBoldVal}>{tenant.trn || 'Not Configured'}</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* 3. Invoice History */}
            <View style={styles.invoiceHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Subscription Invoices</Text>
                <Text style={styles.sectionSub}>Past invoices and settlement records</Text>
              </View>
            </View>

            {/* Search and Status Filters */}
            <View style={styles.searchBox}>
              <Search size={15} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search invoice number or plan..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color="#64748b" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.statusFilterRow}>
              {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusFilterBtn, isActive && styles.statusFilterBtnActive]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text
                      style={[
                        styles.statusFilterBtnText,
                        isActive && styles.statusFilterBtnTextActive,
                      ]}
                    >
                      {st === 'all' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <Card>
                <View style={styles.emptyContainer}>
                  <Receipt size={32} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Invoices Found</Text>
                  <Text style={styles.emptySub}>
                    {searchQuery || statusFilter !== 'all'
                      ? 'No invoices match your selected search or filter criteria.'
                      : 'No subscription invoices have been recorded yet.'}
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={styles.invoicesListWrapper}>
                {filteredInvoices.map((inv: any) => {
                  const isPaid =
                    inv.paymentStatus === 'paid' || inv.paymentStatus === 'manual_paid';
                  const isPending =
                    inv.paymentStatus === 'pending' ||
                    inv.paymentStatus === 'pending_gateway_integration';
                  const isOverdue = inv.paymentStatus === 'overdue';

                  const statusVar: any = isPaid ? 'success' : isPending ? 'warn' : 'error';
                  const statusText = isPaid
                    ? 'PAID'
                    : isPending
                    ? 'PENDING'
                    : isOverdue
                    ? 'OVERDUE'
                    : inv.paymentStatus?.toUpperCase();

                  const canPayOnline = !isPaid && Boolean(inv.mamoPaymentUrl);

                  return (
                    <TouchableOpacity
                      key={inv.id}
                      onPress={() => setSelectedInvoice(inv)}
                      activeOpacity={0.8}
                    >
                      <Card>
                        <View style={styles.invoiceCard}>
                          <View style={styles.invoiceTopRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.invoiceNumText}>{inv.invoiceNumber}</Text>
                              <Text style={styles.invoicePlanText}>
                                {inv.planName} Plan · {inv.billingCycle || 'Monthly'}
                              </Text>
                            </View>
                            <Badge variant={statusVar}>{statusText}</Badge>
                          </View>

                          <View style={styles.invoiceMetaRow}>
                            <Text style={styles.invoiceDatesText}>
                              Period: {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                            </Text>
                            <Text style={styles.invoiceTotalText}>
                              {formatCurrency(inv.totalAmount || 0)}
                            </Text>
                          </View>

                          <View style={styles.invoiceFooterRow}>
                            <Text style={styles.vatNoteText}>
                              VAT incl. ({formatCurrency(inv.vatAmount || 0)})
                            </Text>

                            {/* Pay Now Button for Unpaid Invoices with Mamo URL */}
                            {canPayOnline ? (
                              <TouchableOpacity
                                style={styles.payNowBtn}
                                onPress={() => handlePayNow(inv.mamoPaymentUrl)}
                                activeOpacity={0.7}
                              >
                                <ExternalLink size={12} color="#0f172a" />
                                <Text style={styles.payNowBtnText}>Pay Now</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.viewDetailInline}>
                                <Text style={styles.viewDetailText}>View details</Text>
                                <ChevronRight size={13} color="#64748b" />
                              </View>
                            )}
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 4. Payment Receipts History */}
            <Text style={styles.sectionTitle}>Settled Payment Receipts</Text>
            {allPayments.length === 0 ? (
              <Card>
                <View style={styles.emptyContainer}>
                  <CreditCard size={28} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Payment Receipts Recorded</Text>
                  <Text style={styles.emptySub}>
                    When invoice disbursements or online payments are confirmed, records will appear here.
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={styles.invoicesListWrapper}>
                {allPayments.map((p: any) => (
                  <Card key={p.id}>
                    <View style={styles.paymentCard}>
                      <View style={styles.paymentTopRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={15} color="#16a34a" />
                            <Text style={styles.paymentDateText}>{formatDate(p.paymentDate)}</Text>
                          </View>
                          <Text style={styles.paymentCoverageText}>
                            Coverage: {formatDate(p.periodCoveredStart)} –{' '}
                            {formatDate(p.periodCoveredEnd)}
                          </Text>
                        </View>
                        <Text style={styles.paymentAmountText}>
                          {formatCurrency(p.amount || 0)}
                        </Text>
                      </View>
                      {p.notes ? (
                        <Text style={styles.paymentNotesText}>Ref: {p.notes}</Text>
                      ) : null}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScreenBody>

      {/* ==================================================================== */}
      {/* MODAL: INVOICE BREAKDOWN STATEMENT */}
      {/* ==================================================================== */}
      <Modal
        visible={!!selectedInvoice}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Tax Invoice Statement</Text>
                <Text style={styles.modalSub}>{selectedInvoice?.invoiceNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedInvoice(null)}
                style={styles.closeBtn}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedInvoice ? (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Status & Plan Banner */}
                <View style={styles.modalBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalBannerLabel}>Invoice Number</Text>
                    <Text style={styles.modalBannerVal}>{selectedInvoice.invoiceNumber}</Text>
                    <Text style={styles.modalBannerSub}>
                      Plan: {selectedInvoice.planName} ({selectedInvoice.billingCycle})
                    </Text>
                  </View>
                  <Badge
                    variant={
                      selectedInvoice.paymentStatus === 'paid' ||
                      selectedInvoice.paymentStatus === 'manual_paid'
                        ? 'success'
                        : selectedInvoice.paymentStatus === 'overdue'
                        ? 'error'
                        : 'warn'
                    }
                  >
                    {selectedInvoice.paymentStatus?.toUpperCase()}
                  </Badge>
                </View>

                {/* Tenant & TRN Info */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Subscriber Name:</Text>
                    <Text style={styles.infoVal}>{tenant.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Subdomain:</Text>
                    <Text style={styles.infoVal}>{tenant.subdomain}.cloudynation.com</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tax Reg (TRN):</Text>
                    <Text style={styles.infoVal}>{tenant.trn || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Coverage Period:</Text>
                    <Text style={styles.infoVal}>
                      {formatDate(selectedInvoice.periodStart)} –{' '}
                      {formatDate(selectedInvoice.periodEnd)}
                    </Text>
                  </View>
                </View>

                {/* Financial Breakdown Table */}
                <Text style={styles.breakdownHeader}>Financial Breakdown</Text>
                <View style={styles.breakdownTable}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownDesc}>
                      {selectedInvoice.planName} Plan Fee ({selectedInvoice.durationMonths || 1} mo)
                    </Text>
                    <Text style={styles.breakdownAmt}>
                      {formatCurrency(selectedInvoice.subtotal || 0)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownDesc}>VAT / Tax (5%)</Text>
                    <Text style={styles.breakdownAmt}>
                      {formatCurrency(selectedInvoice.vatAmount || 0)}
                    </Text>
                  </View>
                  <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                    <Text style={styles.breakdownTotalLabel}>Total Amount (AED)</Text>
                    <Text style={styles.breakdownTotalAmt}>
                      {formatCurrency(selectedInvoice.totalAmount || 0)}
                    </Text>
                  </View>
                </View>

                {/* Payment Action if Unpaid */}
                {selectedInvoice.mamoPaymentUrl &&
                selectedInvoice.paymentStatus !== 'paid' &&
                selectedInvoice.paymentStatus !== 'manual_paid' ? (
                  <TouchableOpacity
                    style={styles.modalPayBtn}
                    onPress={() => {
                      const url = selectedInvoice.mamoPaymentUrl;
                      setSelectedInvoice(null);
                      handlePayNow(url);
                    }}
                  >
                    <ExternalLink size={16} color="#0f172a" />
                    <Text style={styles.modalPayBtnText}>Proceed to Mamo Pay Portal</Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: -4,
    marginBottom: 8,
  },
  planBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  planBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  tenantNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 4,
  },
  subdomainText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 12,
  },
  bannerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerMetaCol: {
    flex: 1,
  },
  bannerMetaLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#39ff14',
    marginTop: 2,
  },
  quotaContainer: {
    gap: 10,
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  quotaUsageValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quotaSubText: {
    fontSize: 11,
    color: '#64748b',
  },
  quotaDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  quotaStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quotaStatCol: {
    flex: 1,
  },
  statSubLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  statBoldVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusFilterBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  statusFilterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  statusFilterBtnTextActive: {
    color: '#ffffff',
  },
  invoicesListWrapper: {
    gap: 8,
    marginBottom: 16,
  },
  invoiceCard: {
    gap: 6,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  invoicePlanText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDatesText: {
    fontSize: 11,
    color: '#475569',
  },
  invoiceTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  invoiceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 4,
  },
  vatNoteText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#39ff14',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  payNowBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewDetailInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 11,
    color: '#64748b',
  },
  paymentCard: {
    gap: 4,
  },
  paymentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentCoverageText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  paymentAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  paymentNotesText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
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
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalScrollBody: {
    marginBottom: 16,
  },
  modalBanner: {
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
  modalBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  modalBannerVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  modalBannerSub: {
    fontSize: 11,
    color: '#64748b',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  breakdownHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  breakdownTable: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  breakdownDesc: {
    fontSize: 12,
    color: '#334155',
  },
  breakdownAmt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  breakdownTotalRow: {
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingBottom: 6,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownTotalAmt: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16a34a',
  },
  modalPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39ff14',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalPayBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
});
