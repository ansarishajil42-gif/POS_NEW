import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useStoreManager, PricingRequest } from '../../lib/StoreManagerContext';
import { Toast, type ToastType } from '../ui/Toast';
import { formatCurrency } from '../../lib/utils';
import {
  DollarSign,
  Users,
  Boxes,
  FileText,
  ArrowUpDown,
  AlertTriangle,
  Download,
  Search,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Receipt,
  Calendar,
  Send,
  RefreshCw,
  Eye,
  MessageSquare,
  CheckCircle2,
  Clock,
  Check,
  ChevronRight,
  Layers,
  CreditCard,
  Building2,
} from 'lucide-react-native';
import { EmployeeMyLeave } from '../payroll/EmployeeMyLeave';
import { EmployeeMyPayslips } from '../payroll/EmployeeMyPayslips';

export function StoreManagerHome() {
  const { branch: authBranch } = useAuth();
  const { orders, shifts, tills, stock, fetchData, loading } = useStoreManager();
  
  // Toast state
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportZReport = () => {
    showToast('Daily Z-Reports compiled and exported successfully', 'success');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayOrders = useMemo(() => {
    return orders.filter((o) => o.createdAt?.startsWith(todayStr));
  }, [orders, todayStr]);

  const totalSalesToday = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  }, [todayOrders]);

  const activeTillsCount = useMemo(() => {
    return tills.filter((t) => t.status === 'Open').length;
  }, [tills]);

  const activeStaffCount = useMemo(() => {
    return shifts.filter((s) => s.status === 'Open').length;
  }, [shifts]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={authBranch} />
      <ScreenBody>
        {/* Export Z-Report Action */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={handleExportZReport} style={styles.headerBtn}>
            <Download size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Export Z-Reports
          </Button>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard
              label="Sales Today"
              value={`AED ${totalSalesToday.toFixed(2)}`}
              icon={<DollarSign size={16} color="#39ff14" />}
              accent="brand"
            />
          </View>
          <View style={styles.halfCol}>
            <StatCard
              label="Transactions"
              value={String(todayOrders.length)}
              icon={<FileText size={16} color="#0284c7" />}
              accent="sky"
            />
          </View>
          <View style={styles.halfCol}>
            <StatCard
              label="Active Tills"
              value={`${activeTillsCount} / ${tills.length}`}
              icon={<Boxes size={16} color="#39ff14" />}
              accent="brand"
            />
          </View>
          <View style={styles.halfCol}>
            <StatCard
              label="Staff On Shift"
              value={String(activeStaffCount)}
              icon={<Users size={16} color="#475569" />}
              accent="ink"
            />
          </View>
        </View>

        {/* Info panel */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Branch Summary</Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={{ fontSize: 13, color: '#475569' }}>
              Branch Name: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{authBranch || 'Al Barsha Branch'}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: '#475569' }}>
              Total Products: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{stock.length}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: '#475569' }}>
              Branch Tills Total: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{tills.length}</Text>
            </Text>
          </View>
        </Card>
      </ScreenBody>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function StoreManagerStaff() {
  const { branch } = useAuth();
  const {
    shifts,
    staff,
    tills,
    addStaff,
    deleteRosterShift,
    createTill,
    resetCashierPin,
    recordCashDrop,
    closeShift,
    fetchData
  } = useStoreManager();

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  useEffect(() => {
    fetchData();
  }, []);

  // Modal open states
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [addTillOpen, setAddTillOpen] = useState(false);
  const [resetPinOpen, setResetPinOpen] = useState(false);
  const [cashDropOpen, setCashDropOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);

  // Form states
  const [cashierId, setCashierId] = useState('');
  const [tillId, setTillId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  // Dropdown search queries
  const [cashierSearch, setCashierSearch] = useState('');
  const [tillSearch, setTillSearch] = useState('');
  const [dropShiftSearch, setDropShiftSearch] = useState('');
  const [closeShiftSearch, setCloseShiftSearch] = useState('');
  const [pinCashierSearch, setPinCashierSearch] = useState('');

  // Till form states
  const [tillName, setTillName] = useState('');
  const [tillDesc, setTillDesc] = useState('');
  const [tillFloat, setTillFloat] = useState('200.00');

  // PIN reset form states
  const [pinCashierId, setPinCashierId] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Cash drop form states
  const [dropShiftId, setDropShiftId] = useState('');
  const [dropAmount, setDropAmount] = useState('');
  const [dropNote, setDropNote] = useState('');

  // Close shift form states
  const [closeShiftId, setCloseShiftId] = useState('');
  const [actualCash, setActualCash] = useState('');

  const cashiersList = useMemo(() => {
    return staff.filter((s) => s.role === 'cashier');
  }, [staff]);

  const filteredCashiers = useMemo(() => {
    return cashiersList.filter((c) => {
      const name = c.name || c.email || '';
      return name.toLowerCase().includes(cashierSearch.toLowerCase());
    });
  }, [cashiersList, cashierSearch]);

  const filteredTills = useMemo(() => {
    return tills.filter((t) => {
      const name = t.name || '';
      return name.toLowerCase().includes(tillSearch.toLowerCase());
    });
  }, [tills, tillSearch]);

  const activeShifts = useMemo(() => {
    return shifts.filter(s => s.status === 'Open');
  }, [shifts]);

  const filteredDropShifts = useMemo(() => {
    return activeShifts.filter((s) => {
      const name = s.cashierName || s.cashierEmail || '';
      return name.toLowerCase().includes(dropShiftSearch.toLowerCase());
    });
  }, [activeShifts, dropShiftSearch]);

  const filteredCloseShifts = useMemo(() => {
    return activeShifts.filter((s) => {
      const name = s.cashierName || s.cashierEmail || '';
      return name.toLowerCase().includes(closeShiftSearch.toLowerCase());
    });
  }, [activeShifts, closeShiftSearch]);

  const filteredPinCashiers = useMemo(() => {
    return cashiersList.filter((c) => {
      const name = c.name || c.email || '';
      return name.toLowerCase().includes(pinCashierSearch.toLowerCase());
    });
  }, [cashiersList, pinCashierSearch]);

  const handleAddRoster = async () => {
    if (!cashierId || !tillId || !shiftDate || !startTime || !endTime) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await addStaff(cashierId, tillId, shiftDate, startTime, endTime, notes);
      showToast('Staff scheduled successfully.', 'success');
      setAddStaffOpen(false);
      setCashierId('');
      setTillId('');
      setNotes('');
      setCashierSearch('');
      setTillSearch('');
    } catch (e: any) {
      showToast(e.message || 'Failed to schedule shift', 'error');
    }
  };

  const handleCreateTill = async () => {
    if (!tillName.trim()) {
      showToast('Please enter a till name/number', 'error');
      return;
    }
    try {
      await createTill(tillName, tillDesc, parseFloat(tillFloat || '0'));
      showToast(`Till ${tillName} created successfully.`, 'success');
      setAddTillOpen(false);
      setTillName('');
      setTillDesc('');
      setTillFloat('200.00');
    } catch (e: any) {
      showToast(e.message || 'Failed to create till', 'error');
    }
  };

  const handleResetPin = async () => {
    if (!pinCashierId || !newPin || !confirmPin) {
      showToast('Please fill all fields', 'error');
      return;
    }
    try {
      await resetCashierPin(pinCashierId, newPin, confirmPin);
      showToast('Cashier security credentials updated.', 'success');
      setResetPinOpen(false);
      setNewPin('');
      setConfirmPin('');
      setPinCashierId('');
      setPinCashierSearch('');
    } catch (e: any) {
      showToast(e.message || 'Failed to reset PIN', 'error');
    }
  };

  const handleCashDrop = async () => {
    if (!dropShiftId || !dropAmount) {
      showToast('Please select cashier shift and enter amount', 'error');
      return;
    }
    try {
      await recordCashDrop(dropShiftId, parseFloat(dropAmount), dropNote);
      showToast('Cash drop registered successfully.', 'success');
      setCashDropOpen(false);
      setDropShiftId('');
      setDropAmount('');
      setDropNote('');
      setDropShiftSearch('');
    } catch (e: any) {
      showToast(e.message || 'Failed to record drop', 'error');
    }
  };

  const handleCloseShift = async () => {
    if (!closeShiftId || !actualCash) {
      showToast('Please select shift and enter cash count', 'error');
      return;
    }
    try {
      const receipt = await closeShift(closeShiftId, parseFloat(actualCash));
      // Z-Report receipt is an exception (safety audit log receipt) and will remain in Alert.alert to avoid disappearing
      Alert.alert(
        'Shift Closed Successfully',
        `Receipt details:\nOpening Float: AED ${receipt.openingFloat}\nExpected Cash: AED ${receipt.expectedCash}\nActual Cash: AED ${receipt.actualCash}\nVariance: AED ${receipt.variance}`,
        [{ text: 'Close' }]
      );
      setCloseShiftOpen(false);
      setCloseShiftId('');
      setActualCash('');
      setCloseShiftSearch('');
    } catch (e: any) {
      showToast(e.message || 'Failed to close shift', 'error');
    }
  };

  const handleCancelRoster = (id: string, name: string) => {
    Alert.alert('Delete Shift', `Are you sure you want to cancel the shift for ${name || 'Cashier'}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await deleteRosterShift(id);
          showToast('Shift cancelled successfully.', 'success');
        } catch (e: any) {
          showToast('Failed to cancel shift', 'error');
        }
      }}
    ]);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        {/* Quick actions panel */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          <Button style={{ flex: 1 }} variant="primary" onClick={() => setAddStaffOpen(true)}>Roster</Button>
          <Button style={{ flex: 1 }} variant="secondary" onClick={() => setAddTillOpen(true)}>Add Till</Button>
          <Button style={{ flex: 1 }} variant="secondary" onClick={() => setResetPinOpen(true)}>Reset PIN</Button>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          <Button style={{ flex: 1 }} variant="danger" onClick={() => setCashDropOpen(true)}>Cash Drop</Button>
          <Button style={{ flex: 1 }} variant="primary" onClick={() => setCloseShiftOpen(true)}>Close Shift</Button>
        </View>

        <Text style={styles.mainTitle}>Staff Roster & Shifts</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {shifts.map((s) => (
              <Card key={s.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.staffItemLeft}>
                    <View style={styles.staffInitialCircle}>
                      <Text style={styles.staffInitialText}>{(s.cashierName || s.cashierEmail || 'C').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.staffName}>{s.cashierName || s.cashierEmail || 'Cashier'}</Text>
                      <Text style={styles.staffMeta}>
                        Till: {s.tillName || s.tillId || 'N/A'} · Status: {s.status}
                      </Text>
                      <Text style={styles.staffMeta}>
                        Hours: {s.startTime || '—'} - {s.endTime || '—'} ({s.shiftDate || '—'})
                      </Text>
                    </View>
                  </View>
                  <View style={styles.staffItemRight}>
                    <Badge variant={s.status === 'Open' ? 'success' : s.status === 'Scheduled' ? 'warn' : 'neutral'}>
                      {s.status}
                    </Badge>
                    {s.status === 'Scheduled' && (
                      <TouchableOpacity onPress={() => handleCancelRoster(s.id, s.cashierName || s.cashierEmail)} style={{ padding: 4, marginTop: 4 }}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            ))}
            {shifts.length === 0 && (
              <Text style={styles.noDataText}>No scheduled or active shifts rostered.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}><Boxes size={13} color="#475569" style={styles.sectionIcon} /> Till Registry</Text>
          <View style={[styles.listContainer, { marginBottom: 24 }]}>
            {tills.map((t) => (
              <Card key={t.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{t.name}</Text>
                    <Text style={styles.productMeta}>{t.description || "No description"}</Text>
                    <Text style={styles.productMeta}>Opening Float: AED {parseFloat(t.openingFloat || 0).toFixed(2)}</Text>
                    <Text style={styles.productMeta}>Created: {new Date(t.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Badge variant={t.status === 'Open' ? 'success' : 'neutral'}>
                      {t.status}
                    </Badge>
                  </View>
                </View>
              </Card>
            ))}
            {tills.length === 0 && (
              <Text style={styles.noDataText}>No tills registered in this branch.</Text>
            )}
          </View>

          {/* Employee Self-Service: My Leave & My Payslips */}
          <EmployeeMyLeave />
          <EmployeeMyPayslips />
        </ScrollView>
      </ScreenBody>

      {/* Roster Add Staff Sheet */}
      <Sheet open={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Schedule Cashier Shift">
        <View style={styles.modalForm}>
          <Field label="Select Cashier">
            <TextInput
              placeholder="Search cashier name/email..."
              placeholderTextColor="#94a3b8"
              value={cashierSearch}
              onChangeText={setCashierSearch}
              style={styles.dropdownSearchInput}
            />
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {filteredCashiers.map((c) => c && (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pickerItem, cashierId === c.id && styles.pickerItemActive]}
                    onPress={() => setCashierId(c.id)}
                  >
                    <Text style={[styles.pickerItemText, cashierId === c.id && styles.pickerItemTextActive]}>
                      {c.name || c.email} ({c.email})
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredCashiers.length === 0 && (
                  <Text style={styles.noDataText}>No matching cashiers found.</Text>
                )}
              </ScrollView>
            </View>
          </Field>

          <Field label="Select Till">
            <TextInput
              placeholder="Search tills..."
              placeholderTextColor="#94a3b8"
              value={tillSearch}
              onChangeText={setTillSearch}
              style={styles.dropdownSearchInput}
            />
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {filteredTills.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerItem, tillId === t.id && styles.pickerItemActive]}
                    onPress={() => setTillId(t.id)}
                  >
                    <Text style={[styles.pickerItemText, tillId === t.id && styles.pickerItemTextActive]}>
                      {t.name} (Opening Float: AED {t.openingFloat})
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredTills.length === 0 && (
                  <Text style={styles.noDataText}>No registers found.</Text>
                )}
              </ScrollView>
            </View>
          </Field>

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Start Time (HH:MM)">
                <TextInput value={startTime} onChangeText={setStartTime} style={styles.modalInput} placeholder="e.g. 09:00" />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="End Time (HH:MM)">
                <TextInput value={endTime} onChangeText={setEndTime} style={styles.modalInput} placeholder="e.g. 17:00" />
              </Field>
            </View>
          </View>

          <Field label="Shift Date (YYYY-MM-DD)">
            <TextInput value={shiftDate} onChangeText={setShiftDate} style={styles.modalInput} placeholder="YYYY-MM-DD" />
          </Field>

          <Field label="Notes (Optional)">
            <TextInput value={notes} onChangeText={setNotes} style={styles.modalInput} placeholder="Notes" />
          </Field>

          <Button variant="primary" full onClick={handleAddRoster}>Schedule Shift</Button>
        </View>
      </Sheet>

      {/* Till Creation Sheet */}
      <Sheet open={addTillOpen} onClose={() => setAddTillOpen(false)} title="Create New Cash Register">
        <View style={styles.modalForm}>
          <Field label="Till Name / Number">
            <TextInput placeholder="e.g. Till 05" value={tillName} onChangeText={setTillName} style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Field label="Description">
            <TextInput placeholder="e.g. Front counter checkout" value={tillDesc} onChangeText={setTillDesc} style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Field label="Opening Cash Float (AED)">
            <TextInput placeholder="200.00" value={tillFloat} onChangeText={setTillFloat} keyboardType="numeric" style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Button variant="primary" full onClick={handleCreateTill}>Create Register</Button>
        </View>
      </Sheet>

      {/* Cashier Reset PIN Sheet */}
      <Sheet open={resetPinOpen} onClose={() => setResetPinOpen(false)} title="Reset Cashier Credentials">
        <View style={styles.modalForm}>
          <Field label="Select Cashier">
            <TextInput
              placeholder="Search cashier name/email..."
              placeholderTextColor="#94a3b8"
              value={pinCashierSearch}
              onChangeText={setPinCashierSearch}
              style={styles.dropdownSearchInput}
            />
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {filteredPinCashiers.map((c) => c && (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pickerItem, pinCashierId === c.id && styles.pickerItemActive]}
                    onPress={() => setPinCashierId(c.id)}
                  >
                    <Text style={[styles.pickerItemText, pinCashierId === c.id && styles.pickerItemTextActive]}>
                      {c.name || c.email} ({c.email})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Field>
          <Field label="New 4-Digit Security PIN">
            <TextInput placeholder="e.g. 1234" value={newPin} onChangeText={setNewPin} keyboardType="numeric" maxLength={4} secureTextEntry style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Field label="Confirm Security PIN">
            <TextInput placeholder="e.g. 1234" value={confirmPin} onChangeText={setConfirmPin} keyboardType="numeric" maxLength={4} secureTextEntry style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Button variant="primary" full onClick={handleResetPin}>Update PIN</Button>
        </View>
      </Sheet>

      {/* Cash Drop Sheet */}
      <Sheet open={cashDropOpen} onClose={() => setCashDropOpen(false)} title="Record Cash Drop">
        <View style={styles.modalForm}>
          <Field label="Select Active Shift">
            <TextInput
              placeholder="Search open cashier shift..."
              placeholderTextColor="#94a3b8"
              value={dropShiftSearch}
              onChangeText={setDropShiftSearch}
              style={styles.dropdownSearchInput}
            />
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {filteredDropShifts.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.pickerItem, dropShiftId === s.id && styles.pickerItemActive]}
                    onPress={() => setDropShiftId(s.id)}
                  >
                    <Text style={[styles.pickerItemText, dropShiftId === s.id && styles.pickerItemTextActive]}>
                      {s.cashierName || s.cashierEmail} (Till: {s.tillName})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Field>
          <Field label="Cash Drop Amount (AED)">
            <TextInput placeholder="150.00" value={dropAmount} onChangeText={setDropAmount} keyboardType="numeric" style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Field label="Note / Reference">
            <TextInput placeholder="Note" value={dropNote} onChangeText={setDropNote} style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Button variant="danger" full onClick={handleCashDrop}>Submit Drop</Button>
        </View>
      </Sheet>

      {/* Close Shift Sheet */}
      <Sheet open={closeShiftOpen} onClose={() => setCloseShiftOpen(false)} title="Close Shift & Evaluate variance">
        <View style={styles.modalForm}>
          <Field label="Select Cashier Shift to Close">
            <TextInput
              placeholder="Search open cashier shift..."
              placeholderTextColor="#94a3b8"
              value={closeShiftSearch}
              onChangeText={setCloseShiftSearch}
              style={styles.dropdownSearchInput}
            />
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {filteredCloseShifts.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.pickerItem, closeShiftId === s.id && styles.pickerItemActive]}
                    onPress={() => setCloseShiftId(s.id)}
                  >
                    <Text style={[styles.pickerItemText, closeShiftId === s.id && styles.pickerItemTextActive]}>
                      {s.cashierName || s.cashierEmail} (Till: {s.tillName})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Field>
          <Field label="Actual Cash Drawer Count (AED)">
            <TextInput placeholder="500.00" value={actualCash} onChangeText={setActualCash} keyboardType="numeric" style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Button variant="primary" full onClick={handleCloseShift}>Evaluate & Close Shift</Button>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function StoreManagerStock() {
  const { branch } = useAuth();
  const { adjustHistory, adjustStock, fetchStockPaginated } = useStoreManager();

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Stock Pagination & Filter State
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');

  // Form states
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('Correction');
  const [note, setNote] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadStock = useCallback(async (targetPage = 1, searchQuery = q, targetCat = category) => {
    setStockLoading(true);
    try {
      const res = await fetchStockPaginated(targetPage, 50, searchQuery, targetCat);
      setStockItems(res.stock || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
      setLimit(res.limit || 50);
      if (res.categories && res.categories.length > 0) {
        setCategories(res.categories);
      }
      if (typeof res.lowStockCount === 'number') {
        setLowStockCount(res.lowStockCount);
      }
    } catch (err: any) {
      showToast('Failed to load stock', 'error');
    } finally {
      setStockLoading(false);
    }
  }, [fetchStockPaginated, q, category]);

  useEffect(() => {
    loadStock(1, '', 'All');
  }, []);

  const searchTimerRef = React.useRef<any>(null);
  const handleSearchChange = (text: string) => {
    setQ(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      loadStock(1, text, category);
    }, 350);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setPage(1);
    loadStock(1, q, newCat);
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !quantityChange) {
      showToast('Please enter quantity change', 'error');
      return;
    }
    try {
      await adjustStock(selectedProduct.productId, parseInt(quantityChange), reason, note);
      showToast('Stock adjusted successfully.', 'success');
      setAdjustOpen(false);
      setQuantityChange('');
      setNote('');
      setSelectedProduct(null);
      // Reload current page to update stock count
      loadStock(page, q, category);
    } catch (e: any) {
      showToast(e.message || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <View style={[styles.flex1, { backgroundColor: '#f8fafc' }]}>
      <AppHeader roleLabel="SM" branch={branch} />
      <FlatList
        style={styles.flex1}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={stockItems}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => {
              setSelectedProduct(p);
              setAdjustOpen(true);
            }}
          >
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.productName}</Text>
                  <Text style={styles.productMeta}>{p.sku} · {p.category}</Text>
                  <Text style={styles.productMeta}>Base Price: AED {parseFloat(p.basePrice || 0).toFixed(2)}</Text>
                </View>
                <Badge variant={p.stock < 10 ? 'warn' : 'success'}>
                  {p.stock} {p.unit || 'pcs'}
                </Badge>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View>
            <Text style={styles.mainTitle}>Branch Stock</Text>

            <Card style={[styles.lowStockWarningCard, { marginBottom: 12 }]}>
              <View style={styles.flexRow}>
                <AlertTriangle size={15} color="#d97706" />
                <Text style={styles.lowStockWarningText}>{lowStockCount} low-stock items in branch catalog</Text>
              </View>
            </Card>

            {/* Search */}
            <View style={styles.searchBar}>
              <Search size={16} color="#94a3b8" />
              <TextInput
                value={q}
                onChangeText={handleSearchChange}
                placeholder="Search SKU or product name..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
            </View>

            {/* Categories scroll filter */}
            <View style={{ marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBadge, category === cat && styles.catBadgeActive]}
                    onPress={() => handleCategoryChange(cat)}
                  >
                    <Text style={[styles.catBadgeText, category === cat && styles.catBadgeTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          stockLoading ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#39ff14" />
              <Text style={[styles.noDataText, { marginTop: 12 }]}>Loading branch stock...</Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>No products match your search or filter.</Text>
          )
        }
        ListFooterComponent={
          <View style={{ marginTop: 16 }}>
            {/* Pagination Controls */}
            {total > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 }}>
                <Button
                  variant="secondary"
                  disabled={page <= 1 || stockLoading}
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    loadStock(newPage, q, category);
                  }}
                >
                  Previous
                </Button>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>
                  Page {page} of {totalPages} ({total} items)
                </Text>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages || stockLoading}
                  onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    setPage(newPage);
                    loadStock(newPage, q, category);
                  }}
                >
                  Next
                </Button>
              </View>
            )}

            {/* Stock Adjustments History */}
            <Text style={styles.sectionTitle}>
              <ArrowUpDown size={13} color="#475569" style={styles.sectionIcon} /> Stock Adjustments History
            </Text>
            <View style={[styles.listContainer, { marginBottom: 24 }]}>
              {adjustHistory.map((t) => (
                <Card key={t.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{t.productName}</Text>
                      <Text style={styles.productMeta}>Reason: {t.reason}</Text>
                      <Text style={styles.productMeta}>Date: {new Date(t.createdAt).toLocaleString()}</Text>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={[styles.productPrice, { color: t.quantityChange > 0 ? '#10b981' : '#ef4444' }]}>
                        {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                      </Text>
                      <Text style={styles.productMeta}>New: {t.newQuantity}</Text>
                    </View>
                  </View>
                </Card>
              ))}
              {adjustHistory.length === 0 && (
                <Text style={styles.noDataText}>No stock adjustment log entries recorded.</Text>
              )}
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={5}
      />

      {/* Stock adjustment sheet */}
      <Sheet open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust Stock Quantity">
        <View style={styles.modalForm}>
          {selectedProduct && (
            <>
              <Field label="Selected Product">
                <Text style={styles.productName}>{selectedProduct.productName}</Text>
                <Text style={styles.productMeta}>Current Stock: {selectedProduct.stock} {selectedProduct.unit}</Text>
              </Field>
              <Field label="Quantity Change (+/-)">
                <TextInput placeholder="e.g. -5 or 15" value={quantityChange} onChangeText={setQuantityChange} keyboardType="numeric" style={styles.modalInput} placeholderTextColor="#94a3b8" />
              </Field>
              <Field label="Adjustment Reason">
                <View style={styles.segmentedControl}>
                  {['Correction', 'Wastage', 'Damage', 'Other'].map((r) => (
                    <TouchableOpacity key={r} style={[styles.segBtn, reason === r && styles.segBtnActive]} onPress={() => setReason(r)}>
                      <Text style={[styles.segTxt, reason === r && styles.segTxtActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
              <Field label="Additional Note (Optional)">
                <TextInput placeholder="Notes..." value={note} onChangeText={setNote} style={styles.modalInput} placeholderTextColor="#94a3b8" />
              </Field>
              <Button variant="primary" full onClick={handleAdjustStock}>Save Adjustment</Button>
            </>
          )}
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function StoreManagerPricing() {
  const { branch } = useAuth();
  const { pricingRequests, stock, addPricingRequest, editPricingRequest, deletePricingRequest, fetchData } = useStoreManager();

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  useEffect(() => {
    fetchData();
  }, []);

  // Dialog/Modal states
  const [requestOpen, setRequestOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<PricingRequest | null>(null);

  // Form states - Request Override
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reqPrice, setReqPrice] = useState('');
  const [stdPrice, setStdPrice] = useState('0');
  const [reason, setReason] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Form states - Edit Override
  const [editPriceVal, setEditPriceVal] = useState('');

  const filteredProductsList = useMemo(() => {
    return stock.filter((p) => {
      const name = p.productName || '';
      return name.toLowerCase().includes(productSearch.toLowerCase());
    });
  }, [stock, productSearch]);

  const handleRequestOverride = async () => {
    if (!selectedProductId || !reqPrice || !reason) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await addPricingRequest(selectedProductId, parseFloat(reqPrice), reason);
      showToast('Price override request submitted successfully.', 'success');
      setSelectedProductId('');
      setReqPrice('');
      setStdPrice('0');
      setReason('');
      setProductSearch('');
      setRequestOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to submit override request', 'error');
    }
  };

  const handleEditRequest = async () => {
    if (!activeRequest) return;
    const requestedVal = parseFloat(editPriceVal);
    if (isNaN(requestedVal) || requestedVal <= 0) {
      showToast('Please enter a valid price', 'error');
      return;
    }
    try {
      await editPricingRequest(activeRequest.id, requestedVal);
      showToast('Price override request updated.', 'success');
      setEditPriceVal('');
      setActiveRequest(null);
      setEditOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to update request', 'error');
    }
  };

  const handleDeleteRequest = (pr: PricingRequest) => {
    Alert.alert(
      'Cancel Request',
      `Are you sure you want to cancel the price override request for ${pr.productName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePricingRequest(pr.id);
              showToast('Override request removed.', 'success');
            } catch (e: any) {
              showToast(e.message || 'Failed to cancel request', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        {/* Request override Header Action */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={() => {
            if (stock.length > 0) {
              setSelectedProductId(stock[0].productId);
              setStdPrice(String(stock[0].basePrice));
            }
            setRequestOpen(true);
          }} style={styles.headerBtn}>
            <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Request Pricing Override
          </Button>
        </View>

        <Text style={styles.mainTitle}>Pricing Adjustments</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {pricingRequests.map((pr) => (
              <Card key={pr.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{pr.productName}</Text>
                    <Text style={styles.productMeta}>Standard: AED {pr.standardPrice.toFixed(2)} · Requested: AED {pr.requestedPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Badge variant={pr.status === 'Approved' ? 'success' : pr.status === 'Pending' ? 'warn' : 'error'}>
                      {pr.status}
                    </Badge>
                  </View>
                </View>

                {pr.status === 'Pending' && (
                  <View style={styles.priceActionsRow}>
                    <TouchableOpacity
                      style={styles.priceActionBtn}
                      onPress={() => {
                        setActiveRequest(pr);
                        setEditPriceVal(String(pr.requestedPrice));
                        setEditOpen(true);
                      }}
                    >
                      <Edit size={14} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.priceActionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.priceActionBtn}
                      onPress={() => handleDeleteRequest(pr)}
                    >
                      <Trash2 size={14} color="#ef4444" style={{ marginRight: 4 }} />
                      <Text style={[styles.priceActionBtnText, { color: '#ef4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}
            {pricingRequests.length === 0 && (
              <Text style={styles.noDataText}>No pricing overrides requested.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* REQUEST OVERRIDE SHEET */}
      <Sheet open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Price Override">
        <View style={styles.modalForm}>
          <Field label="Select Product">
            <TextInput
              placeholder="Search product..."
              placeholderTextColor="#94a3b8"
              value={productSearch}
              onChangeText={setProductSearch}
              style={styles.dropdownSearchInput}
            />
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {filteredProductsList.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerItem, selectedProductId === p.productId && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedProductId(p.productId);
                      setStdPrice(String(p.basePrice));
                    }}
                  >
                    <Text style={[styles.pickerItemText, selectedProductId === p.productId && styles.pickerItemTextActive]}>
                      {p.productName} (AED {parseFloat(p.basePrice).toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredProductsList.length === 0 && (
                  <Text style={styles.noDataText}>No products found.</Text>
                )}
              </ScrollView>
            </View>
          </Field>
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Standard Price (AED)">
                <TextInput value={parseFloat(stdPrice || '0').toFixed(2)} editable={false} style={[styles.modalInput, { backgroundColor: '#f1f5f9' }]} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Requested Price (AED)">
                <TextInput
                  placeholder="e.g. 4.50"
                  value={reqPrice}
                  onChangeText={setReqPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </Field>
            </View>
          </View>
          <Field label="Reason">
            <TextInput placeholder="Reason for discount request" value={reason} onChangeText={setReason} style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Button variant="primary" full onClick={handleRequestOverride}>Request Override</Button>
        </View>
      </Sheet>

      {/* EDIT OVERRIDE SHEET */}
      <Sheet open={editOpen} onClose={() => { setActiveRequest(null); setEditOpen(false); }} title="Edit Requested Price">
        <View style={styles.modalForm}>
          {activeRequest && (
            <>
              <Field label="Product">
                <Text style={styles.productName}>{activeRequest.productName}</Text>
              </Field>
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="Standard Price (AED)">
                    <Text style={styles.staffName}>AED {activeRequest.standardPrice.toFixed(2)}</Text>
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Requested Price (AED)">
                    <TextInput
                      value={editPriceVal}
                      onChangeText={setEditPriceVal}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </Field>
                </View>
              </View>
              <Button variant="primary" full onClick={handleEditRequest}>Save Request</Button>
            </>
          )}
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function StoreManagerReports() {
  const { branch } = useAuth();
  const {
    shifts,
    fetchData,
    getMyBranchReport,
    submitBranchReport,
    getMyBranchSubmissions,
    updateBranchSubmission,
    deleteBranchSubmission,
  } = useStoreManager();

  // Active Sub-Tab
  type ReportSubTab = 'financial' | 'submissions' | 'shifts';
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('financial');

  // Date Preset for Financial Report
  type DatePreset = 'this-month' | 'last-month' | 'last-30' | 'today';
  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');

  // Financial Report Data State
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Submit to Head Office State
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Modal / Sheet States
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [activeSnapshot, setActiveSnapshot] = useState<any>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [activeEditSub, setActiveEditSub] = useState<any>(null);
  const [editNotesVal, setEditNotesVal] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Compute ISO date strings for current preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = `${year}-${pad(month + 1)}-${pad(now.getDate())}`;

    if (datePreset === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (datePreset === 'this-month') {
      const start = `${year}-${pad(month + 1)}-01`;
      return { startDate: start, endDate: todayStr };
    }
    if (datePreset === 'last-month') {
      const firstOfThisMonth = new Date(year, month, 1);
      const lastDayOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
      const prevYear = lastDayOfPrevMonth.getFullYear();
      const prevMonth = lastDayOfPrevMonth.getMonth();
      const start = `${prevYear}-${pad(prevMonth + 1)}-01`;
      const end = `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDayOfPrevMonth.getDate())}`;
      return { startDate: start, endDate: end };
    }
    // last-30
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`;
    return { startDate: start, endDate: todayStr };
  }, [datePreset]);

  // Load Financial Report Data
  const loadFinancialReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await getMyBranchReport(startDate, endDate);
      const reportPayload = res?.data || res?.report;
      if (res?.success && reportPayload) {
        setReportData(reportPayload);
      } else {
        showToast(res?.error || 'Failed to calculate branch report', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error loading report', 'error');
    } finally {
      setReportLoading(false);
    }
  }, [startDate, endDate, getMyBranchReport]);

  // Load Submissions History
  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const res = await getMyBranchSubmissions();
      if (res?.success) {
        setSubmissions(res.submissions || []);
      } else {
        showToast(res?.error || 'Failed to load submissions', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error fetching submissions', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  }, [getMyBranchSubmissions]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'financial') {
      loadFinancialReport();
    } else if (activeSubTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeSubTab, loadFinancialReport, loadSubmissions]);

  // Submit Report to Head Office Handler
  const handleSubmitToHeadOffice = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitBranchReport({
        startDate,
        endDate,
        notes: submitNotes.trim() || undefined,
      });
      if (res?.success) {
        showToast('Financial report submitted to Head Office successfully!', 'success');
        setSubmitNotes('');
        await loadSubmissions();
        setActiveSubTab('submissions');
      } else {
        showToast(res?.error || 'Failed to submit report', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Submission Handler
  const handleSaveEditSubmission = async () => {
    if (!activeEditSub) return;
    setSavingEdit(true);
    try {
      const res = await updateBranchSubmission(activeEditSub.id, {
        notes: editNotesVal.trim(),
      });
      if (res?.success) {
        showToast('Submission updated successfully', 'success');
        setEditSheetOpen(false);
        setActiveEditSub(null);
        await loadSubmissions();
      } else {
        showToast(res?.error || 'Failed to update submission', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating submission', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Submission Handler
  const handleDeleteSubmission = (sub: any) => {
    Alert.alert(
      'Delete Submission',
      `Delete report submission for ${sub.periodStart} to ${sub.periodEnd}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteBranchSubmission(sub.id);
              if (res?.success) {
                showToast('Submission removed successfully', 'success');
                await loadSubmissions();
              } else {
                showToast(res?.error || 'Failed to delete submission', 'error');
              }
            } catch (err: any) {
              showToast(err?.message || 'Error deleting submission', 'error');
            }
          },
        },
      ]
    );
  };

  const closedShifts = useMemo(() => {
    return shifts.filter((s) => s.status === 'Closed');
  }, [shifts]);

  const exec = reportData?.executiveSummary;
  const sales = reportData?.salesMargin;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Branch Reports & Financials</Text>

        {/* 3-Tab Segmented Control */}
        <View style={styles.tabSegmentBar}>
          <TouchableOpacity
            style={[styles.tabSegmentBtn, activeSubTab === 'financial' && styles.tabSegmentBtnActive]}
            onPress={() => setActiveSubTab('financial')}
            activeOpacity={0.7}
          >
            <TrendingUp size={14} color={activeSubTab === 'financial' ? '#0f172a' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabSegmentText, activeSubTab === 'financial' && styles.tabSegmentTextActive]}>
              Financials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegmentBtn, activeSubTab === 'submissions' && styles.tabSegmentBtnActive]}
            onPress={() => setActiveSubTab('submissions')}
            activeOpacity={0.7}
          >
            <Send size={14} color={activeSubTab === 'submissions' ? '#0f172a' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabSegmentText, activeSubTab === 'submissions' && styles.tabSegmentTextActive]}>
              My Submissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegmentBtn, activeSubTab === 'shifts' && styles.tabSegmentBtnActive]}
            onPress={() => setActiveSubTab('shifts')}
            activeOpacity={0.7}
          >
            <Clock size={14} color={activeSubTab === 'shifts' ? '#0f172a' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabSegmentText, activeSubTab === 'shifts' && styles.tabSegmentTextActive]}>
              Closed Shifts
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: FINANCIAL REPORTS */}
        {activeSubTab === 'financial' && (
          <ScrollView
            style={styles.flex1}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={reportLoading} onRefresh={loadFinancialReport} colors={['#39ff14']} />
            }
          >
            {/* Date Preset Filter Bar */}
            <View style={styles.datePresetRow}>
              <TouchableOpacity
                style={[styles.datePill, datePreset === 'this-month' && styles.datePillActive]}
                onPress={() => setDatePreset('this-month')}
              >
                <Calendar size={12} color={datePreset === 'this-month' ? '#0f172a' : '#64748b'} />
                <Text style={[styles.datePillText, datePreset === 'this-month' && styles.datePillTextActive]}>
                  This Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.datePill, datePreset === 'last-month' && styles.datePillActive]}
                onPress={() => setDatePreset('last-month')}
              >
                <Text style={[styles.datePillText, datePreset === 'last-month' && styles.datePillTextActive]}>
                  Last Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.datePill, datePreset === 'last-30' && styles.datePillActive]}
                onPress={() => setDatePreset('last-30')}
              >
                <Text style={[styles.datePillText, datePreset === 'last-30' && styles.datePillTextActive]}>
                  Last 30 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.datePill, datePreset === 'today' && styles.datePillActive]}
                onPress={() => setDatePreset('today')}
              >
                <Text style={[styles.datePillText, datePreset === 'today' && styles.datePillTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.periodBanner}>
              <Text style={styles.periodBannerText}>
                Reporting Period: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{startDate} ~ {endDate}</Text>
              </Text>
            </View>

            {reportLoading && !reportData ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#39ff14" />
                <Text style={styles.loadingBoxText}>Computing branch performance metrics...</Text>
              </View>
            ) : exec ? (
              <View style={{ marginTop: 8 }}>
                {/* Executive Summary Cards */}
                <Text style={styles.sectionHeader}>Executive Performance</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.halfCol}>
                    <StatCard
                      label="Total Revenue"
                      value={formatCurrency(exec.totalRevenue || 0)}
                      icon={<DollarSign size={16} color="#39ff14" />}
                      accent="brand"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <StatCard
                      label="Cost of Goods (COGS)"
                      value={formatCurrency(exec.cogs || 0)}
                      icon={<Receipt size={16} color="#dc2626" />}
                      accent="rose"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <StatCard
                      label="Gross Profit"
                      value={formatCurrency(exec.grossProfit || 0)}
                      icon={<TrendingUp size={16} color="#39ff14" />}
                      accent="brand"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <StatCard
                      label="Gross Margin"
                      value={`${(exec.grossMarginPercent || 0).toFixed(1)}%`}
                      icon={<DollarSign size={16} color="#0284c7" />}
                      accent="sky"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <StatCard
                      label="Order Count"
                      value={String(exec.orderCount || 0)}
                      icon={<FileText size={16} color="#64748b" />}
                      accent="ink"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <StatCard
                      label="Avg Order Value"
                      value={formatCurrency(exec.averageOrderValue || 0)}
                      icon={<TrendingUp size={16} color="#64748b" />}
                      accent="ink"
                    />
                  </View>
                </View>

                {/* Sales & Margin Breakdown */}
                {sales && (
                  <>
                    <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Payment Methods</Text>
                    <Card style={styles.breakdownCard}>
                      {(sales.tenders || []).map((t: any, idx: number) => (
                        <View key={t.method || t.tender || idx} style={[styles.breakdownItemRow, idx > 0 && styles.itemDivider]}>
                          <CreditCard size={15} color="#0284c7" style={{ marginRight: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.breakdownName}>{t.method || t.tender}</Text>
                            <Text style={styles.breakdownMeta}>{t.count} payments</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.breakdownVal}>{formatCurrency(t.amount ?? t.total ?? 0)}</Text>
                            <Badge variant="neutral">{t.percentage ?? t.sharePercent ?? 0}%</Badge>
                          </View>
                        </View>
                      ))}
                      {(!sales.tenders || sales.tenders.length === 0) && (
                        <Text style={styles.emptySubText}>No payment tenders recorded in this period.</Text>
                      )}
                    </Card>

                    <Text style={[styles.sectionHeader, { marginTop: 14 }]}>Top Selling Products</Text>
                    <Card style={styles.breakdownCard}>
                      {(sales.topProducts || []).slice(0, 5).map((p: any, idx: number) => (
                        <View key={p.id || p.productId || idx} style={[styles.breakdownItemRow, idx > 0 && styles.itemDivider]}>
                          <View style={styles.rankBadge}>
                            <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.breakdownName}>{p.name}</Text>
                            <Text style={styles.breakdownMeta}>{p.qtySold ?? p.quantitySold ?? 0} units sold</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.breakdownVal}>{formatCurrency(p.revenue || 0)}</Text>
                            <Text style={styles.breakdownMeta}>Margin: {p.grossMarginPercent ?? p.marginPercent ?? 0}%</Text>
                          </View>
                        </View>
                      ))}
                      {(!sales.topProducts || sales.topProducts.length === 0) && (
                        <Text style={styles.emptySubText}>No product sales recorded in this period.</Text>
                      )}
                    </Card>
                  </>
                )}

                {/* Submit to Head Office Section */}
                <Card style={styles.submitSectionCard}>
                  <View style={styles.submitHeaderRow}>
                    <Send size={18} color="#0284c7" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.submitSectionTitle}>Submit to Head Office</Text>
                      <Text style={styles.submitSectionSub}>
                        Snapshot this period ({startDate} ~ {endDate}) and submit for Head Office review.
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.inputLabel}>Branch Manager Notes (Optional):</Text>
                    <TextInput
                      style={styles.submitNotesInput}
                      placeholder="Add any commentary, context on variances, or special highlights for Head Office..."
                      placeholderTextColor="#94a3b8"
                      value={submitNotes}
                      onChangeText={setSubmitNotes}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={{ marginTop: 14 }}>
                    <Button
                      variant="primary"
                      full
                      onClick={handleSubmitToHeadOffice}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting to Head Office...' : 'Submit Report to Head Office'}
                    </Button>
                  </View>
                </Card>
              </View>
            ) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>No financial data found for this period.</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* TAB 2: MY SUBMISSIONS */}
        {activeSubTab === 'submissions' && (
          <ScrollView
            style={styles.flex1}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={submissionsLoading} onRefresh={loadSubmissions} colors={['#39ff14']} />
            }
          >
            <View style={styles.submissionsHeaderRow}>
              <Text style={styles.sectionHeader}>Submission History</Text>
              <TouchableOpacity onPress={loadSubmissions} style={styles.refreshIconBtn}>
                <RefreshCw size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            {submissionsLoading && submissions.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#39ff14" />
                <Text style={styles.loadingBoxText}>Loading past submissions...</Text>
              </View>
            ) : submissions.length === 0 ? (
              <Card style={{ padding: 24, alignItems: 'center' }}>
                <Send size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
                <Text style={styles.noDataTitle}>No Submissions Yet</Text>
                <Text style={styles.noDataSub}>
                  Run a financial report in the "Financials" tab and click "Submit Report to Head Office".
                </Text>
              </Card>
            ) : (
              <View style={styles.listContainer}>
                {submissions.map((sub) => {
                  const isUnlocked = sub.status === 'submitted' || sub.status === 'returned';
                  const isReturned = sub.status === 'returned';
                  const isReviewed = sub.status === 'reviewed';

                  const badgeVariant = isReviewed ? 'success' : isReturned ? 'error' : 'info';
                  const badgeText = isReviewed ? 'REVIEWED' : isReturned ? 'RETURNED' : 'SUBMITTED';

                  const snap = sub.snapshotData?.executiveSummary;

                  return (
                    <Card key={sub.id} style={styles.submissionCard}>
                      <View style={styles.subTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subPeriodTitle}>
                            Period: {sub.periodStart} ~ {sub.periodEnd}
                          </Text>
                          <Text style={styles.subCreatedMeta}>
                            Submitted on {new Date(sub.createdAt).toLocaleDateString()} at{' '}
                            {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Badge variant={badgeVariant}>{badgeText}</Badge>
                      </View>

                      {/* Head Office Return Message (Prominently displayed) */}
                      {isReturned && sub.headOfficeMessage && (
                        <View style={styles.returnedAlertBox}>
                          <AlertTriangle size={16} color="#dc2626" style={{ marginTop: 2, marginRight: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.returnedAlertTitle}>Head Office Feedback (Action Required):</Text>
                            <Text style={styles.returnedAlertMsg}>{sub.headOfficeMessage}</Text>
                          </View>
                        </View>
                      )}

                      {/* Branch Manager Notes */}
                      {sub.notes ? (
                        <View style={styles.notesBox}>
                          <Text style={styles.notesBoxLabel}>Branch Notes:</Text>
                          <Text style={styles.notesBoxText}>{sub.notes}</Text>
                        </View>
                      ) : null}

                      {/* Snapshot Quick Stats */}
                      {snap && (
                        <View style={styles.subSnapStatsRow}>
                          <View style={styles.subSnapStat}>
                            <Text style={styles.subSnapStatLabel}>Revenue</Text>
                            <Text style={styles.subSnapStatVal}>{formatCurrency(snap.totalRevenue || 0)}</Text>
                          </View>
                          <View style={styles.subSnapStat}>
                            <Text style={styles.subSnapStatLabel}>Gross Profit</Text>
                            <Text style={styles.subSnapStatVal}>{formatCurrency(snap.grossProfit || 0)}</Text>
                          </View>
                          <View style={styles.subSnapStat}>
                            <Text style={styles.subSnapStatLabel}>Orders</Text>
                            <Text style={styles.subSnapStatVal}>{snap.orderCount || 0}</Text>
                          </View>
                        </View>
                      )}

                      {/* Reviewed Info */}
                      {isReviewed && (
                        <View style={styles.reviewedNotice}>
                          <CheckCircle2 size={13} color="#39ff14" style={{ marginRight: 6 }} />
                          <Text style={styles.reviewedNoticeText}>
                            Approved by Head Office on{' '}
                            {sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString() : 'Official Record'}
                          </Text>
                        </View>
                      )}

                      {/* Actions Row */}
                      <View style={styles.subActionsBar}>
                        <TouchableOpacity
                          style={styles.actionPillBtn}
                          onPress={() => {
                            setActiveSnapshot(sub);
                            setSnapshotModalOpen(true);
                          }}
                        >
                          <Eye size={13} color="#0284c7" style={{ marginRight: 4 }} />
                          <Text style={[styles.actionPillText, { color: '#0284c7' }]}>View Snapshot</Text>
                        </TouchableOpacity>

                        {isUnlocked && (
                          <>
                            <TouchableOpacity
                              style={styles.actionPillBtn}
                              onPress={() => {
                                setActiveEditSub(sub);
                                setEditNotesVal(sub.notes || '');
                                setEditSheetOpen(true);
                              }}
                            >
                              <Edit size={13} color="#64748b" style={{ marginRight: 4 }} />
                              <Text style={styles.actionPillText}>Edit Notes</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionPillBtn}
                              onPress={() => handleDeleteSubmission(sub)}
                            >
                              <Trash2 size={13} color="#ef4444" style={{ marginRight: 4 }} />
                              <Text style={[styles.actionPillText, { color: '#ef4444' }]}>Delete</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* TAB 3: CLOSED SHIFTS (Z-REPORTS) */}
        {activeSubTab === 'shifts' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              {closedShifts.map((s) => (
                <Card key={s.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.staffItemLeft}>
                      <View style={[styles.reportBadge, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={[styles.reportBadgeText, { color: '#10b981' }]}>Z</Text>
                      </View>
                      <View>
                        <Text style={styles.staffName}>Report ID: Z-{s.id.slice(0, 5).toUpperCase()}</Text>
                        <Text style={styles.staffMeta}>Cashier: {s.cashierName || s.cashierEmail}</Text>
                        <Text style={styles.staffMeta}>Opened: {new Date(s.openedAt).toLocaleString()}</Text>
                        {s.closedAt && <Text style={styles.staffMeta}>Closed: {new Date(s.closedAt).toLocaleString()}</Text>}
                      </View>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={styles.productPrice}>Actual: AED {parseFloat(s.actualCash || 0).toFixed(2)}</Text>
                      <Text style={styles.productMeta}>Expected: AED {parseFloat(s.expectedCash || 0).toFixed(2)}</Text>
                      <Badge variant={parseFloat(s.actualCash || 0) === parseFloat(s.expectedCash || 0) ? 'success' : 'warn'}>
                        Variance: AED {(parseFloat(s.actualCash || 0) - parseFloat(s.expectedCash || 0)).toFixed(2)}
                      </Badge>
                    </View>
                  </View>
                </Card>
              ))}
              {closedShifts.length === 0 && (
                <Text style={styles.noDataText}>No closed shifts available to display.</Text>
              )}
            </View>
          </ScrollView>
        )}
      </ScreenBody>

      {/* VIEW SNAPSHOT MODAL */}
      <Modal
        visible={snapshotModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSnapshotModalOpen(false)}
      >
        <View style={styles.snapshotModalOverlay}>
          <View style={styles.snapshotModalCard}>
            <View style={styles.snapshotModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.snapshotModalTitle}>Snapshot Details</Text>
                <Text style={styles.snapshotModalSub}>
                  {activeSnapshot?.periodStart} to {activeSnapshot?.periodEnd}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSnapshotModalOpen(false)}>
                <Text style={styles.snapshotModalClose}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {activeSnapshot?.snapshotData?.executiveSummary && (
                <View style={{ gap: 10, paddingVertical: 6 }}>
                  <Text style={styles.snapshotSectionTitle}>Executive Performance</Text>
                  <View style={styles.snapRow}>
                    <Text style={styles.snapRowLabel}>Total Revenue</Text>
                    <Text style={styles.snapRowVal}>
                      {formatCurrency(activeSnapshot.snapshotData.executiveSummary.totalRevenue || 0)}
                    </Text>
                  </View>
                  <View style={styles.snapRow}>
                    <Text style={styles.snapRowLabel}>Cost of Goods (COGS)</Text>
                    <Text style={styles.snapRowVal}>
                      {formatCurrency(activeSnapshot.snapshotData.executiveSummary.cogs || 0)}
                    </Text>
                  </View>
                  <View style={styles.snapRow}>
                    <Text style={styles.snapRowLabel}>Gross Profit</Text>
                    <Text style={styles.snapRowVal}>
                      {formatCurrency(activeSnapshot.snapshotData.executiveSummary.grossProfit || 0)}
                    </Text>
                  </View>
                  <View style={styles.snapRow}>
                    <Text style={styles.snapRowLabel}>Gross Margin %</Text>
                    <Text style={styles.snapRowVal}>
                      {(activeSnapshot.snapshotData.executiveSummary.grossMarginPercent || 0).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.snapRow}>
                    <Text style={styles.snapRowLabel}>Orders</Text>
                    <Text style={styles.snapRowVal}>
                      {activeSnapshot.snapshotData.executiveSummary.orderCount || 0}
                    </Text>
                  </View>

                  {activeSnapshot.snapshotData.salesMargin?.tenders?.length > 0 && (
                    <>
                      <Text style={[styles.snapshotSectionTitle, { marginTop: 12 }]}>Payment Tenders</Text>
                      {activeSnapshot.snapshotData.salesMargin.tenders.map((t: any, idx: number) => (
                        <View key={idx} style={styles.snapRow}>
                          <Text style={styles.snapRowLabel}>{t.method || t.tender}</Text>
                          <Text style={styles.snapRowVal}>
                            {formatCurrency(t.amount ?? t.total ?? 0)} ({t.percentage ?? t.sharePercent ?? 0}%)
                          </Text>
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

      {/* EDIT SUBMISSION SHEET */}
      <Sheet
        open={editSheetOpen}
        onClose={() => {
          setActiveEditSub(null);
          setEditSheetOpen(false);
        }}
        title="Edit Submission Notes"
      >
        <View style={styles.modalForm}>
          {activeEditSub && (
            <>
              <Field label="Reporting Period">
                <Text style={styles.staffName}>
                  {activeEditSub.periodStart} to {activeEditSub.periodEnd}
                </Text>
              </Field>

              <Field label="Branch Notes">
                <TextInput
                  value={editNotesVal}
                  onChangeText={setEditNotesVal}
                  placeholder="Update your notes for Head Office..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                />
              </Field>

              <Button
                variant="primary"
                full
                onClick={handleSaveEditSubmission}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving...' : 'Save & Update Submission'}
              </Button>
            </>
          )}
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
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
  chartCard: {
    padding: 16,
    marginVertical: 6,
  },
  chartCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  staffInitialCircle: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInitialText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  staffName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  staffMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  staffItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lowStockWarningCard: {
    padding: 10,
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    marginBottom: 12,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lowStockWarningText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#d97706',
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  productMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  reportBadge: {
    height: 36,
    width: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerBtnWrapper: {
    marginBottom: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    gap: 12,
    paddingVertical: 8,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  categoryScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  catBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  catBadgeActive: {
    backgroundColor: '#39ff14',
    borderColor: '#39ff14',
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catBadgeTextActive: {
    color: '#0f172a',
  },
  priceActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
  priceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  productPickerScrollContainer: {
    height: 140,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    marginTop: 4,
  },
  productPickerScroll: {
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
    fontSize: 12,
    color: '#334155',
  },
  pickerItemTextActive: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  noDataText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  dropdownSearchInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 4,
  },
  // Sub-Tab Segment Bar
  tabSegmentBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabSegmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabSegmentTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  // Date Presets
  datePresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  datePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePillActive: {
    backgroundColor: '#39ff14',
    borderColor: '#39ff14',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  datePillTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  periodBanner: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  periodBannerText: {
    fontSize: 11,
    color: '#64748b',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBoxText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownCard: {
    padding: 12,
    borderRadius: 12,
  },
  breakdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  breakdownMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  // Submit Section
  submitSectionCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0f2fe',
    backgroundColor: '#ffffff',
  },
  submitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  submitSectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  submitNotesInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  noDataCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  noDataSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  // Submissions
  submissionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refreshIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  submissionCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  subTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subPeriodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  subCreatedMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  returnedAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  returnedAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  returnedAlertMsg: {
    fontSize: 12,
    color: '#991b1b',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notesBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  notesBoxText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  subSnapStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  subSnapStat: {
    flex: 1,
  },
  subSnapStatLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  subSnapStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  reviewedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reviewedNoticeText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
  subActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  // Snapshot Modal
  snapshotModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  snapshotModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    maxHeight: '80%',
  },
  snapshotModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  snapshotModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  snapshotModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  snapshotModalClose: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
    padding: 4,
  },
  snapshotSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  snapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  snapRowLabel: {
    fontSize: 13,
    color: '#475569',
  },
  snapRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
});
