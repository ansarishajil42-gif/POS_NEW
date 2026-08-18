import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { tillQuickProducts } from '../../lib/mockData';
import { useAuth } from '../../lib/auth';
import { useCashier } from '../../lib/CashierContext';
import { Search, Trash2, CreditCard, Banknote, Sparkles, Wallet, Printer, Scale } from 'lucide-react-native';

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
    clearCart
  } = useCashier();

  const [q, setQ] = useState('');
  const [payOpen, setPayOpen] = useState(false);

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  const filtered = tillQuickProducts.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const handleReadScale = () => {
    // Simulates reading from a scale
    const banana = tillQuickProducts.find(p => p.id === 'p9') || { id: 'p9', name: 'Bananas 1kg', price: 5.0 };
    addToCart(banana);
    Alert.alert('Scale Integrated', 'Reading: 1.240 kg. Added Bananas 1kg.');
  };

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
            <TouchableOpacity key={p.id} onPress={() => addToCart(p)} style={styles.quickBtn} activeOpacity={0.8}>
              <Text style={styles.quickEmoji}>{p.emoji}</Text>
              <Text style={styles.quickLabel} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.quickPrice}>${p.price.toFixed(2)}</Text>
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
              <Text style={styles.emptyCartText}>Scan or tap quick keys to begin</Text>
            ) : (
              <View style={styles.cartItemsContainer}>
                {cart.map((i) => (
                  <View key={i.id} style={styles.cartItemRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{i.name}</Text>
                      <Text style={styles.cartItemMeta}>${i.price.toFixed(2)} each</Text>
                    </View>
                    <View style={styles.cartActions}>
                      <TouchableOpacity onPress={() => updateCartQty(i.id, -1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{i.qty}</Text>
                      <TouchableOpacity onPress={() => updateCartQty(i.id, 1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <Text style={styles.cartItemPrice}>${(i.price * i.qty).toFixed(2)}</Text>
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
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalVal}>${subtotal.toFixed(2)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>VAT (5%)</Text><Text style={styles.totalVal}>${vat.toFixed(2)}</Text></View>
            <View style={[styles.totalRow, styles.grandTotalRow]}><Text style={styles.grandTotalLabel}>Total</Text><Text style={styles.grandTotalVal}>${total.toFixed(2)}</Text></View>
          </View>
        </Card>

        <View style={styles.actionGrid}>
          <Button variant="secondary" onClick={toggleOffline} style={styles.halfBtn}>
            {offline === 'synced' ? 'Work Offline' : 'Sync Offline'}
          </Button>
          <Button disabled={cart.length === 0} onClick={() => setPayOpen(true)} style={styles.halfBtn}>Pay ${total.toFixed(2)}</Button>
        </View>
      </ScreenBody>

      <SplitPayment open={payOpen} onClose={() => setPayOpen(false)} total={total} />
    </View>
  );
}

function SplitPayment({ open, onClose, total }: { open: boolean; onClose: () => void; total: number }) {
  const { settleTransaction } = useCashier();
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [loyalty, setLoyalty] = useState('');
  const [credit, setCredit] = useState('');

  const paid = (Number(cash) || 0) + (Number(card) || 0) + (Number(loyalty) || 0) + (Number(credit) || 0);
  const remaining = Math.max(0, total - paid);

  const handleSettle = () => {
    settleTransaction({
      cash: Number(cash) || 0,
      card: Number(card) || 0,
      loyalty: Number(loyalty) || 0,
      credit: Number(credit) || 0
    });
    setCash('');
    setCard('');
    setLoyalty('');
    setCredit('');
    onClose();
    Alert.alert('Sale Completed', 'Transaction completed successfully · receipt printed.');
  };

  const methods = [
    { key: 'cash', label: 'Cash', icon: <Banknote size={16} color="#39ff14" />, val: cash, set: setCash },
    { key: 'card', label: 'Card', icon: <CreditCard size={16} color="#39ff14" />, val: card, set: setCard },
    { key: 'loyalty', label: 'Loyalty Pts', icon: <Sparkles size={16} color="#39ff14" />, val: loyalty, set: setLoyalty },
    { key: 'credit', label: 'Store Credit', icon: <Wallet size={16} color="#39ff14" />, val: credit, set: setCredit },
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
            <Text style={[styles.remainingVal, remaining > 0 ? styles.colorWarn : styles.colorSuccess]}>${remaining.toFixed(2)}</Text>
          </View>
          <Button full disabled={remaining > 0} onClick={handleSettle}>
            {remaining > 0 ? `$${remaining.toFixed(2)} remaining` : 'Complete & Settle'}
          </Button>
        </View>
      }
    >
      <View style={styles.paymentDueBox}>
        <View style={styles.receiptLine}><Text style={styles.receiptLabel}>Total due</Text><Text style={styles.receiptVal}>${total.toFixed(2)}</Text></View>
        <View style={styles.receiptLine}><Text style={styles.receiptLabel}>Paid</Text><Text style={styles.receiptVal}>${paid.toFixed(2)}</Text></View>
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
    closeShiftAndPrintZ
  } = useCashier();

  const [openDropSheet, setOpenDropSheet] = useState(false);
  const [openFloatSheet, setOpenFloatSheet] = useState(false);
  const [localDrop, setLocalDrop] = useState('');
  const [localFloat, setLocalFloat] = useState('');

  const handleRecordDrop = () => {
    const amt = parseFloat(localDrop);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid drop amount');
      return;
    }
    recordCashDrop(amt);
    setLocalDrop('');
    setOpenDropSheet(false);
    Alert.alert('Drop Recorded', `Cash drop of $${amt.toFixed(2)} successfully logged.`);
  };

  const handleAdjustFloat = () => {
    const amt = parseFloat(localFloat);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid float amount');
      return;
    }
    adjustFloat(amt);
    setLocalFloat('');
    setOpenFloatSheet(false);
    Alert.alert('Float Adjusted', `Opening float adjusted to $${amt.toFixed(2)}.`);
  };

  const handlePrintX = () => {
    Alert.alert(
      'X Report (Mid-Shift)',
      `Snapshot at: ${new Date().toLocaleTimeString()}\n\nExpected Cash: $${expectedDrawer.toFixed(2)}\nCash Sales: $${cashSales.toFixed(2)}\nCard Sales: $${cardSales.toFixed(2)}\n\nSnapshot dispatched to thermal POS printer.`
    );
  };

  const handleCloseShift = () => {
    Alert.alert(
      'Confirm Close Shift',
      'This will seal the shift ledger, generate a Z-Report, and post totals to Head Office. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Shift',
          style: 'destructive',
          onPress: () => {
            closeShiftAndPrintZ();
            Alert.alert('Shift Closed', 'Z-Report compiled and dispatched to thermal POS printer.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="CA" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Shift control</Text>
        <Card style={styles.shiftActiveCard}>
          <View>
            <Text style={styles.statusSub}>Shift status</Text>
            <Text style={styles.shiftActiveVal}>Open · Till 02</Text>
          </View>
          <Badge variant="success">Active</Badge>
        </Card>

        <View style={styles.shiftListDetails}>
          {[
            ['Opening float', `$${openingFloat.toFixed(2)}`],
            ['Cash sales', `$${cashSales.toFixed(2)}`],
            ['Card sales', `$${cardSales.toFixed(2)}`],
            ['Cash drops', `$${cashDrops.toFixed(2)}`],
            ['Expected drawer', `$${expectedDrawer.toFixed(2)}`],
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
          <Button variant="danger" onClick={handleCloseShift} style={styles.halfBtn}>Close Shift & Z</Button>
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
                      { color: r.type === 'Z' ? '#39ff14' : '#0369a1' }
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
                  <Text style={styles.productPrice}>${r.sales.toLocaleString()}</Text>
                  <TouchableOpacity style={styles.printBtn} onPress={() => Alert.alert('Printing', `Re-sending ${r.number} report to POS printer.`)}>
                    <Printer size={13} color="#39ff14" />
                    <Text style={styles.printBtnText}>Re-print</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
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
              <Card key={t.id} onClick={() => Alert.alert('Receipt Details', `Receipt: ${t.receipt}\nTotal: $${t.total.toFixed(2)}\nItems: ${t.items}\nMethod: ${t.method}`)}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.productName}>{t.receipt}</Text>
                    <Text style={styles.productMeta}>{t.time} · {t.items} items · {t.method}</Text>
                  </View>
                  <Text style={styles.productPrice}>${t.total.toFixed(2)}</Text>
                </View>
              </Card>
            ))}
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
    color: '#39ff14',
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
    color: '#39ff14',
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
    color: '#39ff14',
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
