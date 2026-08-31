import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useStoreManager, PricingRequest } from '../../lib/StoreManagerContext';
import { Toast, type ToastType } from '../ui/Toast';
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
  Edit
} from 'lucide-react-native';

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
  const { stock, adjustHistory, adjustStock, fetchData } = useStoreManager();

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  useEffect(() => {
    fetchData();
  }, []);

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form states
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('Correction');
  const [note, setNote] = useState('');

  const categories = useMemo(() => {
    const list = stock.map((p) => p.category).filter(Boolean);
    return ['All', ...Array.from(new Set(list))];
  }, [stock]);

  const lowStock = useMemo(() => {
    return stock.filter((p) => p.stock < 10);
  }, [stock]);

  const filteredProducts = useMemo(() => {
    return stock.filter((p) => {
      const nameMatch = p.productName?.toLowerCase().includes(q.toLowerCase()) || p.sku?.toLowerCase().includes(q.toLowerCase());
      const catMatch = category === 'All' || p.category === category;
      return nameMatch && catMatch;
    });
  }, [stock, q, category]);

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
    } catch (e: any) {
      showToast(e.message || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Branch Stock</Text>

        <Card style={styles.lowStockWarningCard}>
          <View style={styles.flexRow}>
            <AlertTriangle size={15} color="#d97706" />
            <Text style={styles.lowStockWarningText}>{lowStock.length} low-stock items in branch catalog</Text>
          </View>
        </Card>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
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
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catBadgeText, category === cat && styles.catBadgeTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.listContainer}>
            {filteredProducts.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setSelectedProduct(p);
                  setAdjustOpen(true);
                }}
              >
                <Card>
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
            ))}
            {filteredProducts.length === 0 && (
              <Text style={styles.noDataText}>No products match your search or filter.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}><ArrowUpDown size={13} color="#475569" style={styles.sectionIcon} /> Stock Adjustments History</Text>
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
        </ScrollView>
      </ScreenBody>

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
  const { shifts, fetchData } = useStoreManager();

  useEffect(() => {
    fetchData();
  }, []);

  const closedShifts = useMemo(() => {
    return shifts.filter(s => s.status === 'Closed');
  }, [shifts]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Closed Shifts (Z-Reports)</Text>
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
      </ScreenBody>
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
});
