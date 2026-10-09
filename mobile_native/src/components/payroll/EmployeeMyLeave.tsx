import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Field } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { apiClient } from '../../lib/apiClient';
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  ChevronRight,
} from 'lucide-react-native';

const LEAVE_TYPES = [
  { id: 'annual', label: 'Annual Leave' },
  { id: 'sick', label: 'Sick Leave' },
  { id: 'unpaid', label: 'Unpaid Leave' },
  { id: 'emergency', label: 'Emergency Leave' },
  { id: 'maternity_paternity', label: 'Maternity / Paternity' },
];

export function EmployeeMyLeave() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Form / Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Fetch logged in employee's leave requests
  const fetchMyLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/payroll/leaves/mine');
      if (res?.success) {
        setLeaves(res.leaveRequests || []);
      } else {
        showToast(res?.error || 'Failed to fetch leave history', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error loading leave history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  // Compute duration in days
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(`${startDate}T00:00:00Z`);
    const e = new Date(`${endDate}T00:00:00Z`);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const isPaidPreview = leaveType !== 'unpaid';

  const handleOpenNew = () => {
    setEditingLeaveId(null);
    const today = new Date().toISOString().slice(0, 10);
    setLeaveType('annual');
    setStartDate(today);
    setEndDate(today);
    setReason('');
    setModalOpen(true);
  };

  const handleOpenEdit = (req: any) => {
    if (req.status !== 'pending') {
      showToast('Only pending requests can be modified', 'error');
      return;
    }
    setEditingLeaveId(req.id);
    setLeaveType(req.leaveType || 'annual');
    setStartDate(req.startDate ? String(req.startDate).slice(0, 10) : '');
    setEndDate(req.endDate ? String(req.endDate).slice(0, 10) : '');
    setReason(req.reason || '');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      showToast('Please select both start and end dates', 'error');
      return;
    }
    if (calculatedDays <= 0) {
      showToast('End date must be on or after start date', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingLeaveId) {
        const res = await apiClient.patch<any>(`/payroll/leaves/${editingLeaveId}`, {
          leaveType,
          startDate,
          endDate,
          reason,
        });
        if (res?.success) {
          showToast('Leave request updated successfully!', 'success');
          setModalOpen(false);
          fetchMyLeaves();
        } else {
          showToast(res?.error || 'Failed to update leave request', 'error');
        }
      } else {
        const res = await apiClient.post<any>('/payroll/leaves', {
          leaveType,
          startDate,
          endDate,
          reason,
        });
        if (res?.success) {
          showToast('Leave request submitted successfully!', 'success');
          setModalOpen(false);
          fetchMyLeaves();
        } else {
          showToast(res?.error || 'Failed to submit leave request', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Error submitting leave request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await apiClient.delete<any>(`/payroll/leaves/${id}`);
      if (res?.success) {
        showToast('Leave request deleted successfully', 'success');
        setDeleteConfirmId(null);
        fetchMyLeaves();
      } else {
        showToast(res?.error || 'Failed to delete leave request', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting request', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>My Leave Requests</Text>
          <Text style={styles.headerSub}>
            {leaves.length} total · {pendingCount} pending · {approvedCount} approved
          </Text>
        </View>
        <TouchableOpacity style={styles.requestBtn} onPress={handleOpenNew} activeOpacity={0.8}>
          <Plus size={16} color="#0f172a" />
          <Text style={styles.requestBtnText}>Request Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Leave Requests List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#39ff14" />
          <Text style={styles.loadingText}>Loading leave history...</Text>
        </View>
      ) : leaves.length === 0 ? (
        <Card>
          <View style={styles.emptyContainer}>
            <Calendar size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Leave Requests Found</Text>
            <Text style={styles.emptySub}>
              You haven't submitted any leave requests yet. Tap "Request Leave" above to apply.
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.leavesList}>
          {leaves.map((item) => {
            const isPending = item.status === 'pending';
            const statusVariant =
              item.status === 'approved'
                ? 'success'
                : item.status === 'rejected'
                ? 'error'
                : 'warn';

            const typeLabel =
              LEAVE_TYPES.find((t) => t.id === item.leaveType)?.label || item.leaveType;

            return (
              <Card key={item.id}>
                <View style={styles.leaveCard}>
                  {/* Top Row: Type & Status */}
                  <View style={styles.leaveCardHeader}>
                    <View style={styles.typeRow}>
                      <Text style={styles.typeTitle}>{typeLabel}</Text>
                      <Badge
                        variant={item.isPaid ? 'brand' : 'neutral'}
                        label={item.isPaid ? 'Paid' : 'Unpaid'}
                      />
                    </View>
                    <Badge variant={statusVariant} label={item.status.toUpperCase()} />
                  </View>

                  {/* Dates & Duration */}
                  <View style={styles.datesRow}>
                    <Calendar size={13} color="#64748b" />
                    <Text style={styles.datesText}>
                      {item.startDate} → {item.endDate}
                    </Text>
                    <Text style={styles.daysPill}>
                      {item.daysCount} {item.daysCount === 1 ? 'day' : 'days'}
                    </Text>
                  </View>

                  {/* Reason if provided */}
                  {item.reason ? (
                    <Text style={styles.reasonText} numberOfLines={2}>
                      "{item.reason}"
                    </Text>
                  ) : null}

                  {/* Pending Actions */}
                  {isPending && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenEdit(item)}
                      >
                        <Edit3 size={13} color="#0284c7" />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 size={13} color="#e11d48" />
                        <Text style={styles.deleteBtnText}>Cancel Request</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingLeaveId ? 'Edit Leave Request' : 'Request Time Off'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Leave Type Selector */}
              <Text style={styles.fieldLabel}>Leave Category</Text>
              <View style={styles.typePillsWrapper}>
                {LEAVE_TYPES.map((t) => {
                  const isSelected = leaveType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typePill, isSelected && styles.typePillSelected]}
                      onPress={() => setLeaveType(t.id)}
                    >
                      <Text style={[styles.typePillText, isSelected && styles.typePillTextSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Inputs */}
              <View style={styles.formTwoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Field label="Start Date (YYYY-MM-DD)">
                    <TextInput
                      style={styles.formInput}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      autoCapitalize="none"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Field label="End Date (YYYY-MM-DD)">
                    <TextInput
                      style={styles.formInput}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      autoCapitalize="none"
                    />
                  </Field>
                </View>
              </View>

              {/* Live Preview of Days & Pay */}
              <View style={styles.durationBanner}>
                <View style={styles.durationCol}>
                  <Text style={styles.durationLabel}>Duration</Text>
                  <Text style={styles.durationVal}>
                    {calculatedDays > 0 ? `${calculatedDays} Days` : 'Invalid Range'}
                  </Text>
                </View>
                <View style={styles.durationCol}>
                  <Text style={styles.durationLabel}>Compensation</Text>
                  <Text style={[styles.durationVal, { color: isPaidPreview ? '#16a34a' : '#d97706' }]}>
                    {isPaidPreview ? 'Paid Time Off' : 'Unpaid Leave'}
                  </Text>
                </View>
              </View>

              {/* Reason */}
              <Field label="Reason (Optional)">
                <TextInput
                  style={[styles.formInput, styles.reasonInput]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Provide context or explanation for this request..."
                  multiline
                  numberOfLines={3}
                />
              </Field>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingLeaveId ? 'Update Request' : 'Submit Leave Request'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmId} transparent animationType="fade" onRequestClose={() => setDeleteConfirmId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <AlertCircle size={36} color="#e11d48" style={{ marginBottom: 12 }} />
            <Text style={styles.confirmTitle}>Cancel Leave Request?</Text>
            <Text style={styles.confirmSub}>
              Are you sure you want to cancel this pending leave request? This action cannot be undone.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Cancel Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  leavesList: {
    gap: 10,
  },
  leaveCard: {
    padding: 12,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeTitle: {
    fontSize: 14,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e11d48',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '85%',
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
  closeBtn: {
    padding: 4,
  },
  modalScrollBody: {
    maxHeight: 500,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  typePillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typePillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typePillTextSelected: {
    color: '#ffffff',
  },
  formTwoCol: {
    flexDirection: 'row',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  reasonInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  durationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    marginBottom: 14,
  },
  durationCol: {
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  durationVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#39ff14',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  confirmCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
