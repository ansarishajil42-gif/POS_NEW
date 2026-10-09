import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toast, type ToastType } from '../ui/Toast';
import { formatCurrency } from '../../lib/utils';
import { apiClient } from '../../lib/apiClient';
import {
  DollarSign,
  FileText,
  RefreshCw,
  X,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Building2,
  Lock,
} from 'lucide-react-native';

export interface MyPayslipSummary {
  itemId: string;
  payrollRunId: string;
  month: string;
  status: 'Approved' | 'Paid';
  branchName: string;
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  unpaidDays: number;
  unpaidDeduction: number;
  standardDeductions: number;
  netSalary: number;
  approvedAt: string | null;
  paidAt: string | null;
}

export function EmployeeMyPayslips() {
  const [payslips, setPayslips] = useState<MyPayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Payslip Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Strictly IDOR-safe: fetches session employee's own approved/paid payslips
  const fetchMyPayslips = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get<any>('/payroll/my-payslips');
      if (res?.success) {
        setPayslips(res.payslips || []);
      } else {
        showToast(res?.error || 'Failed to load payslips history', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error connecting to payroll server', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPayslips();
  }, [fetchMyPayslips]);

  const handleOpenDetail = async (runId: string) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await apiClient.get<any>(`/payroll/my-payslips/${runId}`);
      if (res?.success && res.payslip) {
        setSelectedPayslip(res.payslip);
      } else {
        showToast(res?.error || 'Failed to load payslip detail', 'error');
        setDetailModalOpen(false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error retrieving payslip statement', 'error');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      {/* Header with Title & Refresh */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconCircle}>
            <DollarSign size={16} color="#16a34a" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>My Salary Statements</Text>
            <Text style={styles.sectionSub}>Official approved & disbursed payslips</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchMyPayslips(true)}
          disabled={refreshing || loading}
          activeOpacity={0.7}
        >
          <RefreshCw size={13} color="#475569" />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Payslips Content */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#16a34a" />
          <Text style={styles.loadingText}>Loading salary statements...</Text>
        </View>
      ) : payslips.length === 0 ? (
        <Card>
          <View style={styles.emptyContainer}>
            <FileText size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Released Payslips Yet</Text>
            <Text style={styles.emptySub}>
              Once your monthly payroll run is reviewed and approved by management, your official monthly statements will appear here.
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.listContainer}>
          {payslips.map((p) => {
            const statusVariant = p.status === 'Paid' ? 'success' : 'info';

            return (
              <TouchableOpacity
                key={p.itemId}
                onPress={() => handleOpenDetail(p.payrollRunId)}
                activeOpacity={0.8}
              >
                <Card>
                  <View style={styles.payslipCard}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.monthBadgeRow}>
                          <Calendar size={13} color="#0f172a" style={{ marginRight: 4 }} />
                          <Text style={styles.monthText}>{p.month}</Text>
                        </View>
                        <Text style={styles.branchMeta}>
                          {p.branchName || 'All Outlets (Consolidated)'}
                        </Text>
                      </View>
                      <Badge variant={statusVariant} label={p.status.toUpperCase()} />
                    </View>

                    {/* Pay Summary Columns */}
                    <View style={styles.compRow}>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Gross Pay</Text>
                        <Text style={styles.compValSky}>{formatCurrency(p.grossSalary)}</Text>
                      </View>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Deductions</Text>
                        <Text style={styles.compValRose}>
                          -{formatCurrency(p.unpaidDeduction + p.standardDeductions)}
                        </Text>
                      </View>
                      <View style={styles.compCol}>
                        <Text style={styles.compLabel}>Net Payable</Text>
                        <Text style={styles.compValNet}>{formatCurrency(p.netSalary)}</Text>
                      </View>
                    </View>

                    {/* Card Footer Action */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.tapToViewText}>Tap to view official statement</Text>
                      <ChevronRight size={14} color="#64748b" />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ==================================================================== */}
      {/* MODAL: FULL OFFICIAL PAYSLIP DETAIL */}
      {/* ==================================================================== */}
      <Modal
        visible={detailModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Official Payslip</Text>
                <Text style={styles.modalSub}>
                  {selectedPayslip?.payslipNumber || 'Salary Statement'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.modalCenterBox}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Fetching statement details...</Text>
              </View>
            ) : selectedPayslip ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Period & Verification Banner */}
                <View style={styles.payslipBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.periodLabel}>Pay Period</Text>
                    <Text style={styles.periodValue}>{selectedPayslip.periodMonth}</Text>
                    <Text style={styles.periodSub}>
                      Status: {selectedPayslip.status} · Approved By Management
                    </Text>
                  </View>
                  <Badge
                    variant={selectedPayslip.status === 'Paid' ? 'success' : 'info'}
                    label={selectedPayslip.status?.toUpperCase() || 'APPROVED'}
                  />
                </View>

                {/* Employee Info Card */}
                <View style={styles.employeeBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Staff Member:</Text>
                    <Text style={styles.infoVal}>{selectedPayslip.employee?.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Designation:</Text>
                    <Text style={styles.infoVal}>
                      {selectedPayslip.employee?.role?.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Branch / Outlet:</Text>
                    <Text style={styles.infoVal}>{selectedPayslip.employee?.branchName}</Text>
                  </View>
                  {selectedPayslip.employee?.bankName && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Bank Account:</Text>
                      <Text style={styles.infoVal}>
                        {selectedPayslip.employee.bankName}
                        {selectedPayslip.employee.maskedIban
                          ? ` (${selectedPayslip.employee.maskedIban})`
                          : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Earnings Breakdown */}
                <Text style={styles.tableHeader}>Gross Earnings</Text>
                <View style={styles.tableCard}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableDesc}>Basic Monthly Salary</Text>
                    <Text style={styles.tableVal}>
                      {formatCurrency(selectedPayslip.earnings?.basicSalary || 0)}
                    </Text>
                  </View>
                  {Number(selectedPayslip.earnings?.housingAllowance || 0) > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableDesc}>Housing Allowance</Text>
                      <Text style={styles.tableVal}>
                        +{formatCurrency(selectedPayslip.earnings.housingAllowance)}
                      </Text>
                    </View>
                  )}
                  {Number(selectedPayslip.earnings?.transportAllowance || 0) > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableDesc}>Transport Allowance</Text>
                      <Text style={styles.tableVal}>
                        +{formatCurrency(selectedPayslip.earnings.transportAllowance)}
                      </Text>
                    </View>
                  )}
                  {Number(selectedPayslip.earnings?.otherAllowances || 0) > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableDesc}>Other Allowances</Text>
                      <Text style={styles.tableVal}>
                        +{formatCurrency(selectedPayslip.earnings.otherAllowances)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.tableRow, styles.subtotalRow]}>
                    <Text style={styles.subtotalLabel}>Total Gross Salary</Text>
                    <Text style={styles.subtotalVal}>
                      {formatCurrency(selectedPayslip.earnings?.grossSalary || 0)}
                    </Text>
                  </View>
                </View>

                {/* Deductions Breakdown */}
                <Text style={styles.tableHeader}>Deductions & Adjustments</Text>
                <View style={styles.tableCard}>
                  {Number(selectedPayslip.deductions?.unpaidDays || 0) > 0 ? (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableDesc}>
                        Unpaid Absence ({selectedPayslip.deductions.unpaidDays} days)
                      </Text>
                      <Text style={[styles.tableVal, { color: '#e11d48' }]}>
                        -{formatCurrency(selectedPayslip.deductions.unpaidDeduction || 0)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableDesc}>Absence Deductions (0 days)</Text>
                      <Text style={styles.tableVal}>0.00</Text>
                    </View>
                  )}
                  {Number(selectedPayslip.deductions?.standardDeductions || 0) > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableDesc}>Standard Payroll Deductions</Text>
                      <Text style={[styles.tableVal, { color: '#e11d48' }]}>
                        -{formatCurrency(selectedPayslip.deductions.standardDeductions)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.tableRow, styles.subtotalRow]}>
                    <Text style={styles.subtotalLabel}>Total Deductions</Text>
                    <Text style={[styles.subtotalVal, { color: '#e11d48' }]}>
                      -{formatCurrency(selectedPayslip.deductions?.totalDeductions || 0)}
                    </Text>
                  </View>
                </View>

                {/* Net Take-Home Card */}
                <View style={styles.netCard}>
                  <Text style={styles.netLabel}>Net Take-Home Salary</Text>
                  <Text style={styles.netAmount}>
                    {formatCurrency(selectedPayslip.netSalary || 0)}
                  </Text>
                  <Text style={styles.netMeta}>
                    Currency: {selectedPayslip.currency || 'AED'} · System Verified
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  centerBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
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
  listContainer: {
    gap: 10,
  },
  payslipCard: {
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  monthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  branchMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  compRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  compCol: {
    flex: 1,
  },
  compLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  compValSky: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  compValRose: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e11d48',
  },
  compValNet: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  tapToViewText: {
    fontSize: 11,
    color: '#64748b',
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
  modalHeader: {
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
  modalCenterBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  modalScroll: {
    marginBottom: 16,
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
  periodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  periodSub: {
    fontSize: 11,
    color: '#64748b',
  },
  employeeBox: {
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
  tableHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  tableDesc: {
    fontSize: 12,
    color: '#334155',
  },
  tableVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtotalRow: {
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingBottom: 6,
  },
  subtotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  netCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#39ff14',
    marginVertical: 4,
  },
  netMeta: {
    fontSize: 10,
    color: '#64748b',
  },
});
