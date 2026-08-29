import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useVendor } from '../../lib/VendorContext';
import { formatCurrency } from '../../lib/utils';
import { ShoppingCart, FileText, DollarSign, CheckCircle2, Download, AlertCircle } from 'lucide-react-native';

export function VendorHome() {
  const { branch } = useAuth();
  const { orders, invoices } = useVendor();

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((a, i) => a + i.total, 0);
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((a, i) => a + i.total, 0);
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;

  const handleDownloadStatement = () => {
    Alert.alert('Statement Downloaded', 'Gulf Foods LLC statement has been compiled and downloaded as a PDF audit ledger.');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="VE" branch={branch} />
      <ScreenBody>
        <View style={styles.headerBtnWrapper}>
          <Button full variant="secondary" onClick={handleDownloadStatement} style={styles.headerBtn}>
            <Download size={14} color="#0f172a" style={{ marginRight: 6 }} />
            Download Statement
          </Button>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Account summary</Text>
          <Text style={styles.summaryValue}>Gulf Foods LLC</Text>
          <Text style={styles.summarySub}>Active supplier · {orders.filter(o => o.status === 'fulfilled').length} orders fulfilled</Text>
        </Card>
        
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Paid" value={formatCurrency(totalPaid)} icon={<CheckCircle2 size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Outstanding" value={formatCurrency(totalPending)} icon={<DollarSign size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="New Orders" value={String(newOrdersCount)} icon={<AlertCircle size={16} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Invoices" value={String(invoices.length)} icon={<FileText size={16} color="#475569" />} accent="ink" />
          </View>
        </View>
      </ScreenBody>
    </View>
  );
}

export function VendorOrders() {
  const { branch } = useAuth();
  const { orders, acknowledgeOrder, declineOrder } = useVendor();

  const handleAcknowledge = (id: string, num: string) => {
    acknowledgeOrder(id);
    Alert.alert('Order Confirmed', `Purchase order ${num} acknowledged and queued for delivery.`);
  };

  const handleDecline = (id: string, num: string) => {
    Alert.alert(
      'Decline Order',
      `Are you sure you want to decline purchase order ${num}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            declineOrder(id);
            Alert.alert('Order Declined', `Purchase order ${num} has been declined.`);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="VE" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Incoming Orders</Text>
        <View style={styles.listContainer}>
          {orders.map((o) => (
            <Card key={o.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{o.number}</Text>
                  <Text style={styles.productMeta}>{o.from} · {o.date}</Text>
                </View>
                <View style={styles.productPriceCol}>
                  <Text style={styles.productPrice}>{formatCurrency(o.total)}</Text>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </View>
              </View>
              {o.status === 'new' && (
                <View style={styles.actionButtonsRow}>
                  <Button variant="secondary" onClick={() => handleDecline(o.id, o.number)} style={styles.halfBtn}>Decline</Button>
                  <Button onClick={() => handleAcknowledge(o.id, o.number)} style={styles.halfBtn}>Acknowledge</Button>
                </View>
              )}
            </Card>
          ))}
        </View>
      </ScreenBody>
    </View>
  );
}

export function VendorInvoices() {
  const { branch } = useAuth();
  const { orders, invoices, submitInvoice } = useVendor();
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [poRef, setPoRef] = useState('');
  const [amount, setAmount] = useState('');

  const activePos = orders.filter(o => o.status === 'acknowledged' || o.status === 'fulfilled');

  const handleCreateInvoice = () => {
    if (!invoiceNo.trim()) {
      Alert.alert('Error', 'Please enter invoice number');
      return;
    }
    if (!poRef.trim()) {
      Alert.alert('Error', 'Please select PO reference');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    submitInvoice(invoiceNo, poRef, val);
    setInvoiceNo('');
    setPoRef('');
    setAmount('');
    setCreateOpen(false);
    Alert.alert('Invoice Submitted', 'Invoice has been uploaded and submitted for review.');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="VE" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Invoices</Text>
        <View style={styles.listContainer}>
          {invoices.map((i) => (
            <Card key={i.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{i.number}</Text>
                  <Text style={styles.productMeta}>{i.to} · {i.date}</Text>
                </View>
                <View style={styles.productPriceCol}>
                  <Text style={styles.productPrice}>{formatCurrency(i.total)}</Text>
                  <Badge variant={statusVariant(i.status)}>{i.status}</Badge>
                </View>
              </View>
            </Card>
          ))}
        </View>
        <Button full onClick={() => setCreateOpen(true)} style={styles.marginT}>+ Create Invoice</Button>
      </ScreenBody>

      {/* CREATE INVOICE SHEET */}
      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Submit New Invoice"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreateInvoice}>Submit Invoice</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Invoice number">
            <TextInput
              value={invoiceNo}
              onChangeText={setInvoiceNo}
              placeholder="e.g. INV-ALM-003"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </Field>

          <Field label="PO Reference">
            <View style={styles.poPickerContainer}>
              <ScrollView style={styles.poPickerScroll} nestedScrollEnabled>
                {activePos.map((po) => (
                  <TouchableOpacity
                    key={po.id}
                    onPress={() => {
                      setPoRef(po.number);
                      setAmount(String(po.total));
                    }}
                    style={[styles.pickerItem, poRef === po.number && styles.pickerItemActive]}
                  >
                    <Text style={[styles.pickerItemText, poRef === po.number && styles.pickerItemTextActive]}>
                      {po.number} ({formatCurrency(po.total)})
                    </Text>
                  </TouchableOpacity>
                ))}
                {activePos.length === 0 && (
                  <Text style={styles.noActivePosText}>No active acknowledged purchase orders.</Text>
                )}
              </ScrollView>
            </View>
          </Field>

          <Field label="Invoice Amount">
            <View style={styles.methodInputWrapper}>
              <Text style={styles.currencyPrefix}>AED</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
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

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerBtnWrapper: {
    marginBottom: 12,
  },
  headerBtn: {
    paddingVertical: 10,
  },
  summaryCard: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  summarySub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
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
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  halfBtn: {
    flex: 1,
  },
  marginT: {
    marginTop: 16,
    marginBottom: 24,
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
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  poPickerContainer: {
    maxHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  poPickerScroll: {
    padding: 4,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  pickerItemActive: {
    backgroundColor: '#f0fdf4',
  },
  pickerItemText: {
    fontSize: 12,
    color: '#475569',
  },
  pickerItemTextActive: {
    fontWeight: 'bold',
    color: '#16a34a',
  },
  noActivePosText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  methodInputWrapper: {
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
});
