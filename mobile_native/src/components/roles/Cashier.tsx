import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Keyboard } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useCashier } from '../../lib/CashierContext';
import { Toast, type ToastType } from '../ui/Toast';
import { apiClient } from '../../lib/apiClient';
import { Search, Trash2, CreditCard, Banknote, Sparkles, Wallet, Printer, Scale, X } from 'lucide-react-native';

export function CashierTill() {
  const { branch } = useAuth();
  const {
    offline,
    bufferedCount,
    cart,
    toggleOffline,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    activeShift,
    tills,
    catalog,
    openShift,
  } = useCashier();

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [q, setQ] = useState('');
  const [payOpen, setPayOpen] = useState(false);

  // Open Shift Form States
  const [openingFloatVal, setOpeningFloatVal] = useState('500');
  const [selectedTillId, setSelectedTillId] = useState('');
  const [tillDropdownOpen, setTillDropdownOpen] = useState(false);
  const [tillSearch, setTillSearch] = useState('');

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  // Search real catalog instead of mock tillQuickProducts
  const filtered = catalog.filter((p) => 
    p.name.toLowerCase().includes(q.toLowerCase()) || 
    (p.barcode && p.barcode.includes(q))
  );

  const handleOpenShift = async () => {
    const floatNum = parseFloat(openingFloatVal);
    if (isNaN(floatNum) || floatNum < 0) {
      showToast('Please enter a valid opening float', 'error');
      return;
    }
    if (!selectedTillId) {
      showToast('Please select a till terminal', 'error');
      return;
    }
    try {
      await openShift(floatNum, selectedTillId);
      showToast('Shift opened successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to open shift', 'error');
    }
  };

  const handleReadScale = () => {
    // Simulates reading from a scale
    const banana = catalog.find(p => p.name.toLowerCase().includes('banana') || p.id === 'p9') || { id: 'p9', name: 'Bananas 1kg', basePrice: 5.0 };
    addToCart({ id: banana.id, name: banana.name, price: Number(banana.priceOverride || banana.basePrice) });
    showToast('Scale Integrated: 1.240 kg added.', 'success');
  };

  // If shift is not active, render Open Shift form
  if (!activeShift) {
    const matchedTills = tills.filter(t => t.name.toLowerCase().includes(tillSearch.toLowerCase()));
    return (
      <View style={styles.flex1}>
        <AppHeader roleLabel="CA" branch={branch} />
        <ScreenBody>
          <Text style={styles.mainTitle}>Open Cashier Shift</Text>
          <Card style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              You must open a shift and declare the opening float to start processing sales.
            </Text>

            <Field label="Till Terminal">
              <TextInput
                style={[styles.searchInput, { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 }]}
                placeholder="Select Till Terminal..."
                value={tillSearch}
                onFocus={() => setTillDropdownOpen(true)}
                onChangeText={(text) => {
                  setTillSearch(text);
                  setTillDropdownOpen(true);
                }}
              />
              {tillDropdownOpen && (
                <View style={{ maxHeight: 150, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 12 }}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {matchedTills.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          setSelectedTillId(t.id);
                          setTillSearch(t.name);
                          setTillDropdownOpen(false);
                          Keyboard.dismiss();
                        }}
                        style={{ padding: 12, backgroundColor: selectedTillId === t.id ? '#e0f2fe' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                      >
                        <Text style={{ color: '#0f172a', fontWeight: selectedTillId === t.id ? 'bold' : 'normal' }}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {matchedTills.length === 0 && (
                      <Text style={{ padding: 12, color: '#94a3b8', fontStyle: 'italic' }}>No tills found</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </Field>

            <Field label="Opening Float (AED)">
              <View style={styles.methodInputWrapper}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  keyboardType="numeric"
                  value={openingFloatVal}
                  onChangeText={setOpeningFloatVal}
                  placeholder="500.00"
                  style={styles.methodInput}
                />
              </View>
            </Field>

            <Button variant="primary" full style={{ marginTop: 16 }} onClick={handleOpenShift}>
              Open Shift
            </Button>
          </Card>
        </ScreenBody>
        {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="CA" branch={branch} offline={offline} bufferedCount={bufferedCount} />
      <ScreenBody>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Scan barcode or search…"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity onPress={handleReadScale} style={styles.scaleBtn} activeOpacity={0.8}>
            <Scale size={16} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.scaleBtnText}>Scale</Text>
          </TouchableOpacity>
        </View>

        {/* Quick products grid */}
        <View style={styles.quickGrid}>
          {filtered.slice(0, 6).map((p) => (
            <TouchableOpacity 
              key={p.id} 
              onPress={() => addToCart({ id: p.id, name: p.name, price: Number(p.priceOverride || p.basePrice) })} 
              style={styles.quickBtn} 
              activeOpacity={0.8}
            >
              <Text style={styles.quickEmoji}>📦</Text>
              <Text style={styles.quickLabel} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.quickPrice}>AED {Number(p.priceOverride || p.basePrice).toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cart Card */}
        <Card style={styles.cartCard}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Cart · {cart.length} lines</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
                <Trash2 size={13} color="#ef4444" />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.cartScroll} nestedScrollEnabled>
            {cart.length === 0 ? (
              <Text style={styles.emptyCartText}>Scan or search items to begin</Text>
            ) : (
              <View style={styles.cartItemsContainer}>
                {cart.map((i) => (
                  <View key={i.id} style={styles.cartItemRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{i.name}</Text>
                      <Text style={styles.cartItemMeta}>AED {i.price.toFixed(2)} each</Text>
                    </View>
                    <View style={styles.cartActions}>
                      <TouchableOpacity onPress={() => updateCartQty(i.id, -1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{i.qty}</Text>
                      <TouchableOpacity onPress={() => updateCartQty(i.id, 1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <Text style={styles.cartItemPrice}>AED {(i.price * i.qty).toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => removeFromCart(i.id)} style={styles.trashIcon}>
                        <Trash2 size={14} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.cartTotals}>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalVal}>AED {subtotal.toFixed(2)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>VAT (5%)</Text><Text style={styles.totalVal}>AED {vat.toFixed(2)}</Text></View>
            <View style={[styles.totalRow, styles.grandTotalRow]}><Text style={styles.grandTotalLabel}>Total</Text><Text style={styles.grandTotalVal}>AED {total.toFixed(2)}</Text></View>
          </View>
        </Card>

        <View style={styles.actionGrid}>
          <Button variant="secondary" onClick={toggleOffline} style={styles.halfBtn}>
            {offline === 'synced' ? 'Work Offline' : 'Sync Offline'}
          </Button>
          <Button disabled={cart.length === 0} onClick={() => setPayOpen(true)} style={styles.halfBtn}>Pay AED {total.toFixed(2)}</Button>
        </View>
      </ScreenBody>

      <SplitPayment open={payOpen} onClose={() => setPayOpen(false)} total={total} showToast={showToast} />
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

function SplitPayment({ open, onClose, total, showToast }: { open: boolean; onClose: () => void; total: number; showToast: (msg: string, type?: ToastType) => void }) {
  const { settleTransaction } = useCashier();
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [loyalty, setLoyalty] = useState('');
  const [credit, setCredit] = useState('');

  // Customer search inside payment sheet
  const [customerSearch, setCustomerSearch] = useState('');
  const [matchedCustomers, setMatchedCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const paid = (Number(cash) || 0) + (Number(card) || 0) + (Number(loyalty) || 0) + (Number(credit) || 0);
  const remaining = Math.max(0, total - paid);

  const handleCustomerSearch = async (term: string) => {
    setCustomerSearch(term);
    if (term.length >= 2) {
      try {
        const res = await apiClient.post('/pos/customers/search', { term }) as any;
        setMatchedCustomers(res.customers || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setMatchedCustomers([]);
    }
  };

  const handleSettle = async () => {
    try {
      await settleTransaction({
        cash: Number(cash) || 0,
        card: Number(card) || 0,
        loyalty: Number(loyalty) || 0,
        credit: Number(credit) || 0
      }, selectedCustomerId || undefined);

      setCash('');
      setCard('');
      setLoyalty('');
      setCredit('');
      setSelectedCustomerId('');
      setSelectedCustomer(null);
      setCustomerSearch('');
      onClose();
      showToast('Sale Completed successfully · receipt printed.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to complete checkout', 'error');
    }
  };

  const methods = [
    { key: 'cash', label: 'Cash', icon: <Banknote size={16} color="#22c55e" />, val: cash, set: setCash },
    { key: 'card', label: 'Card', icon: <CreditCard size={16} color="#3b82f6" />, val: card, set: setCard },
    { key: 'loyalty', label: 'Loyalty Pts', icon: <Sparkles size={16} color="#eab308" />, val: loyalty, set: setLoyalty },
    { key: 'credit', label: 'Store Credit', icon: <Wallet size={16} color="#a855f7" />, val: credit, set: setCredit },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Split Payment"
      footer={
        <View style={styles.sheetFooter}>
          <View style={styles.remainingRow}>
            <Text style={styles.remainingLabel}>Remaining balance</Text>
            <Text style={[styles.remainingVal, remaining > 0 ? styles.colorWarn : styles.colorSuccess]}>{formatCurrency(remaining)}</Text>
          </View>
          <Button full disabled={remaining > 0} onClick={handleSettle}>
            {remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Complete & Settle'}
          </Button>
        </View>
      }
    >
      <View style={styles.paymentDueBox}>
        <View style={styles.receiptLine}><Text style={styles.receiptLabel}>Total due</Text><Text style={styles.receiptVal}>AED {total.toFixed(2)}</Text></View>
        <View style={styles.receiptLine}><Text style={styles.receiptLabel}>Paid</Text><Text style={styles.receiptVal}>AED {paid.toFixed(2)}</Text></View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Field label="Link Customer (Search by Name/Phone/Email)">
          <TextInput
            style={[styles.searchInput, { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }]}
            placeholder="Search customer..."
            value={customerSearch}
            onChangeText={handleCustomerSearch}
          />
          {matchedCustomers.length > 0 && (
            <View style={{ maxHeight: 150, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', marginTop: 4 }}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {matchedCustomers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      setSelectedCustomerId(c.id);
                      setSelectedCustomer(c);
                      setCustomerSearch(`${c.name} (${c.phone || c.email || ''})`);
                      setMatchedCustomers([]);
                      Keyboard.dismiss();
                    }}
                    style={{ padding: 12, backgroundColor: selectedCustomerId === c.id ? '#e0f2fe' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                  >
                    <Text style={{ color: '#0f172a', fontWeight: selectedCustomerId === c.id ? 'bold' : 'normal' }}>
                      {c.name} · Pts: {c.points} · Credit: AED {parseFloat(c.storeCredit || 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {selectedCustomer && (
            <View style={{ marginTop: 6, flexDirection: 'row', gap: 12 }}>
              <Badge variant="success">Pts: {selectedCustomer.points}</Badge>
              <Badge variant="success">Credit: AED {parseFloat(selectedCustomer.storeCredit || 0).toFixed(2)}</Badge>
            </View>
          )}
        </Field>
      </View>
      
      <View style={styles.methodsList}>
        {methods.map((m) => (
          <View key={m.key} style={styles.methodItem}>
            <View style={styles.methodIconWrapper}>
              {m.icon}
            </View>
            <Text style={styles.methodLabel}>{m.label}</Text>
            <View style={styles.methodInputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={m.val}
                onChangeText={m.set}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                style={styles.methodInput}
              />
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

export function CashierShift() {
  const { branch } = useAuth();
  const {
    openingFloat,
    cashSales,
    cardSales,
    cashDrops,
    expectedDrawer,
    reports,
    recordCashDrop,
    adjustFloat,
    closeShiftAndPrintZ,
    activeShift,
  } = useCashier();

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [openDropSheet, setOpenDropSheet] = useState(false);
  const [openFloatSheet, setOpenFloatSheet] = useState(false);
  const [localDrop, setLocalDrop] = useState('');
  const [localFloat, setLocalFloat] = useState('');
  const [dropReason, setDropReason] = useState('Mid-shift drop');

  // Actual Cash Count on closure
  const [openCloseSheet, setOpenCloseSheet] = useState(false);
  const [actualCashCount, setActualCashCount] = useState('');

  const handleRecordDrop = async () => {
    const amt = parseFloat(localDrop);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid drop amount', 'error');
      return;
    }
    try {
      await recordCashDrop(amt, dropReason);
      setLocalDrop('');
      setOpenDropSheet(false);
      showToast(`Cash drop of AED ${amt} logged successfully.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to record cash drop', 'error');
    }
  };

  const handleAdjustFloat = async () => {
    const amt = parseFloat(localFloat);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid float amount', 'error');
      return;
    }
    try {
      await adjustFloat(amt);
      setLocalFloat('');
      setOpenFloatSheet(false);
      showToast(`Opening float adjusted to AED ${amt}.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to adjust float', 'error');
    }
  };

  const handlePrintX = () => {
    Alert.alert(
      'X Report (Mid-Shift)',
      `Snapshot at: ${new Date().toLocaleTimeString()}\n\nExpected Cash: ${formatCurrency(expectedDrawer)}\nCash Sales: ${formatCurrency(cashSales)}\nCard Sales: ${formatCurrency(cardSales)}\n\nSnapshot dispatched to thermal POS printer.`
    );
  };

  const handleCloseShiftSubmit = async () => {
    const amt = parseFloat(actualCashCount);
    if (isNaN(amt) || amt < 0) {
      showToast('Please enter a valid cash count amount', 'error');
      return;
    }
    try {
      await closeShiftAndPrintZ(amt);
      setActualCashCount('');
      setOpenCloseSheet(false);
      showToast('Shift closed successfully. Z-Report compiled.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to close shift', 'error');
    }
  };

  if (!activeShift) {
    return (
      <View style={styles.flex1}>
        <AppHeader roleLabel="CA" branch={branch} />
        <ScreenBody>
          <Text style={styles.mainTitle}>Shift control</Text>
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>No active shift open.</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
              Please go to the Till tab and open a shift to activate shift controls.
            </Text>
          </Card>
        </ScreenBody>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="CA" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Shift control</Text>
        <Card style={styles.shiftActiveCard}>
          <View>
            <Text style={styles.statusSub}>Shift status</Text>
            <Text style={styles.shiftActiveVal}>Open · Shift active</Text>
          </View>
          <Badge variant="success">Active</Badge>
        </Card>

        <View style={styles.shiftListDetails}>
          {[
            ['Opening float', formatCurrency(openingFloat)],
            ['Cash sales', formatCurrency(cashSales)],
            ['Card sales', formatCurrency(cardSales)],
            ['Cash drops', formatCurrency(cashDrops)],
            ['Expected drawer', formatCurrency(expectedDrawer)],
          ].map(([k, v]) => (
            <View key={k} style={styles.shiftDetailRow}>
              <Text style={styles.shiftDetailLabel}>{k}</Text>
              <Text style={styles.shiftDetailValue}>{v}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.actionGrid}>
          <Button variant="secondary" onClick={() => setOpenDropSheet(true)} style={styles.halfBtn}>Cash Drop</Button>
          <Button variant="secondary" onClick={() => setOpenFloatSheet(true)} style={styles.halfBtn}>Adjust Float</Button>
        </View>

        <View style={styles.actionGrid}>
          <Button variant="secondary" onClick={handlePrintX} style={styles.halfBtn}>
            <Printer size={14} color="#0f172a" style={{ marginRight: 6 }} /> Print X
          </Button>
          <Button variant="danger" onClick={() => setOpenCloseSheet(true)} style={styles.halfBtn}>Close Shift & Z</Button>
        </View>

        <Text style={styles.sectionTitle}>Shift History Reports</Text>
        <View style={[styles.listContainer, { marginBottom: 24 }]}>
          {reports.map((r) => (
            <Card key={r.id}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.staffItemLeft}>
                  <View style={[
                    styles.reportBadge,
                    { backgroundColor: r.type === 'Z' ? '#f0fdf4' : '#e0f2fe' }
                  ]}>
                    <Text style={[
                      styles.reportBadgeText,
                      { color: r.type === 'Z' ? '#22c55e' : '#3b82f6' }
                    ]}>
                      {r.type}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.staffName}>{r.number}</Text>
                    <Text style={styles.staffMeta}>{r.date}</Text>
                  </View>
                </View>
                <View style={styles.productPriceCol}>
                  <Text style={styles.productPrice}>AED {r.sales.toLocaleString()}</Text>
                  <TouchableOpacity style={styles.printBtn} onPress={() => showToast(`Re-sending ${r.number} report to POS printer.`, 'success')}>
                    <Printer size={13} color="#22c55e" />
                    <Text style={styles.printBtnText}>Re-print</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
          {reports.length === 0 && (
            <Text style={{ padding: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No shifts closed in this session.</Text>
          )}
        </View>
      </ScreenBody>
      
      {/* CASH DROP SHEET */}
      <Sheet open={openDropSheet} onClose={() => setOpenDropSheet(false)} title="Mid-shift Cash Drop" footer={
        <View style={styles.sheetFooterBtnRow}>
          <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setOpenDropSheet(false)}>Cancel</Button>
          <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleRecordDrop}>Record Drop</Button>
        </View>
      }>
        <View style={styles.modalForm}>
          <Field label="Drop amount">
            <View style={styles.methodInputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={localDrop}
                onChangeText={setLocalDrop}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                style={styles.methodInput}
              />
            </View>
          </Field>
          <Field label="Reason">
            <TextInput
              value={dropReason}
              onChangeText={setDropReason}
              placeholder="Drop reason..."
              placeholderTextColor="#94a3b8"
              style={[styles.searchInput, { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }]}
            />
          </Field>
        </View>
      </Sheet>

      {/* ADJUST FLOAT SHEET */}
      <Sheet open={openFloatSheet} onClose={() => setOpenFloatSheet(false)} title="Adjust Cash Float" footer={
        <View style={styles.sheetFooterBtnRow}>
          <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setOpenFloatSheet(false)}>Cancel</Button>
          <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAdjustFloat}>Adjust Float</Button>
        </View>
      }>
        <View style={styles.modalForm}>
          <Field label="Set drawer opening float">
            <View style={styles.methodInputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={localFloat}
                onChangeText={setLocalFloat}
                keyboardType="numeric"
                placeholder="500.00"
                placeholderTextColor="#94a3b8"
                style={styles.methodInput}
              />
            </View>
          </Field>
        </View>
      </Sheet>

      {/* CLOSE SHIFT CASH COUNT SHEET */}
      <Sheet open={openCloseSheet} onClose={() => setOpenCloseSheet(false)} title="Close Shift & Z-Report" footer={
        <View style={styles.sheetFooterBtnRow}>
          <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setOpenCloseSheet(false)}>Cancel</Button>
          <Button variant="danger" style={styles.sheetFooterBtn} onClick={handleCloseShiftSubmit}>Close Shift</Button>
        </View>
      }>
        <View style={styles.modalForm}>
          <Text style={{ fontSize: 12, color: '#64748b' }}>
            Count the cash in the drawer and declare below to compile the closure variance.
          </Text>
          <Field label="Actual Cash Count (AED)">
            <View style={styles.methodInputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                value={actualCashCount}
                onChangeText={setActualCashCount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                style={styles.methodInput}
              />
            </View>
          </Field>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function CashierHistory() {
  const { branch } = useAuth();
  const { transactions } = useCashier();
  const [q, setQ] = useState('');
  const filtered = transactions.filter((t) => t.receipt.toLowerCase().includes(q.toLowerCase()));
  
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="CA" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Transaction history</Text>
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput value={q} onChangeText={setQ} placeholder="Search receipt number…" placeholderTextColor="#94a3b8" style={styles.searchInput} />
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.listContainer, { marginBottom: 24 }]}>
            {filtered.map((t) => (
              <Card key={t.id} onClick={() => Alert.alert('Receipt Details', `Receipt: ${t.receipt}\nTotal: ${formatCurrency(t.total)}\nItems: ${t.items}\nMethod: ${t.method}`)}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.productName}>{t.receipt}</Text>
                    <Text style={styles.productMeta}>{t.time} · {t.items} items · {t.method}</Text>
                  </View>
                  <Text style={styles.productPrice}>AED {t.total.toFixed(2)}</Text>
                </View>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Text style={{ padding: 24, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No transactions recorded.</Text>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  scaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  scaleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  quickBtn: {
    width: '33.33%',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginVertical: 4,
  },
  quickEmoji: {
    fontSize: 22,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 4,
  },
  quickPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 2,
  },
  cartCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  cartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  cartScroll: {
    maxHeight: 180,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyCartText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  cartItemsContainer: {
    gap: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  cartItemMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    width: 14,
    textAlign: 'center',
  },
  cartItemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    width: 48,
    textAlign: 'right',
  },
  trashIcon: {
    paddingLeft: 4,
  },
  cartTotals: {
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  totalVal: {
    fontSize: 11,
    color: '#475569',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  halfBtn: {
    flex: 1,
  },
  sheetFooter: {
    gap: 12,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  remainingLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  remainingVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  colorWarn: {
    color: '#d97706',
  },
  colorSuccess: {
    color: '#22c55e',
  },
  paymentDueBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#f8fafc',
    gap: 4,
    marginBottom: 16,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  receiptVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  methodsList: {
    gap: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodIconWrapper: {
    height: 36,
    width: 36,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    width: 80,
  },
  methodInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 13,
    color: '#94a3b8',
    marginRight: 4,
  },
  methodInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  shiftActiveCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  statusSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  shiftActiveVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 2,
  },
  shiftListDetails: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 4,
    marginBottom: 12,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  shiftDetailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  shiftDetailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  halfCol: {
    width: '50%',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
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
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  printBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
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
  sheetFooterBtnRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  sheetFooterBtn: {
    flex: 1,
  },
  modalForm: {
    gap: 16,
    paddingBottom: 16,
  },
});
