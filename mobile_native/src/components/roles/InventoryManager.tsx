import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useInventoryManager, FEFOBatch, StockTransfer, InventoryProduct } from '../../lib/InventoryManagerContext';
import { formatCurrency } from '../../lib/utils';
import {
  Boxes,
  AlertTriangle,
  Calendar,
  ArrowUpDown,
  Bell,
  Search,
  Plus,
  Download,
  Clipboard,
  ShoppingCart
} from 'lucide-react-native';

export function InventoryHome() {
  const { branch } = useAuth();
  const { products, transfers, batches, startStockCount } = useInventoryManager();

  // Local search/filter states
  const [q, setQ] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');

  const branchesFilter = ['All', 'Al Barsha', 'Deira', 'Corniche', 'Central Warehouse'];

  const lowStockCount = products.filter((p) => p.stock <= p.reorder).length;
  const nearExpiryCount = batches.filter((b) => b.status !== 'fresh').length;
  const pendingTransfers = transfers.filter((t) => t.status !== 'Received').length;

  const handleStartCount = () => {
    startStockCount();
    Alert.alert('Stock Count Started', 'Physical stock count sequence initiated. Scanner terminals synchronized.');
  };

  const handleExportStock = () => {
    Alert.alert('Export Complete', 'Branch stock levels sheet has been exported to CSV.');
  };

  // Filtered Stock Levels list
  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase());
    const matchesBranch = selectedBranch === 'All' || p.branch === selectedBranch;
    return matchesQuery && matchesBranch;
  });

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        {/* Start Stock Count Header Action */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={handleStartCount} style={styles.headerBtn}>
            <Boxes size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Start Stock Count
          </Button>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Total SKUs" value={String(products.length)} icon={<Boxes size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Low Stock" value={String(lowStockCount)} icon={<AlertTriangle size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Near Expiry" value={String(nearExpiryCount)} icon={<Calendar size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Pending Transfers" value={String(pendingTransfers)} icon={<ArrowUpDown size={16} color="#0284c7" />} accent="sky" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Stock Levels</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search SKU or Product Name..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        {/* Branch Filter & Export Buttons */}
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContainer}>
            {branchesFilter.map((brName) => (
              <TouchableOpacity
                key={brName}
                style={[styles.catBadge, selectedBranch === brName && styles.catBadgeActive]}
                onPress={() => setSelectedBranch(brName)}
              >
                <Text style={[styles.catBadgeText, selectedBranch === brName && styles.catBadgeTextActive]}>
                  {brName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Button variant="secondary" onClick={handleExportStock}>
            <Download size={14} color="#475569" style={{ marginRight: 6 }} />
            Export Inventory Report
          </Button>
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.listContainer}>
            {filteredProducts.map((p) => {
              const isLow = p.stock <= p.reorder;
              return (
                <Card key={p.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productMeta}>SKU: {p.sku} · Category: {p.category} · Branch: {p.branch}</Text>
                      <Text style={styles.productMeta}>Reorder Trigger: {p.reorder} {p.unit}</Text>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={styles.productPrice}>{p.stock} {p.unit}</Text>
                      <Badge variant={isLow ? 'warn' : 'success'}>
                        {isLow ? 'Low Stock' : 'Healthy'}
                      </Badge>
                    </View>
                  </View>
                </Card>
              );
            })}
            {filteredProducts.length === 0 && (
              <Text style={styles.noDataText}>No inventory matches your filters.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>
    </View>
  );
}

export function InventoryBatches() {
  const { branch } = useAuth();
  const { batches, updateClearancePrice } = useInventoryManager();

  // Search and Modal states
  const [q, setQ] = useState('');
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<FEFOBatch | null>(null);
  const [clearanceVal, setClearanceVal] = useState('');

  const handleSetClearance = () => {
    if (!selectedBatch) return;
    const price = parseFloat(clearanceVal);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid clearance price');
      return;
    }
    updateClearancePrice(selectedBatch.id, price);
    Alert.alert('Clearance Price Set', `Override price set to ${formatCurrency(price)} for ${selectedBatch.product}.`);
    setClearanceVal('');
    setSelectedBatch(null);
    setClearanceOpen(false);
  };

  const filteredBatches = batches.filter((b) =>
    b.id.toLowerCase().includes(q.toLowerCase()) || b.product.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Batch & Expiry (FEFO)</Text>

        {/* Batch Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search Batch No. or Product Name..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {filteredBatches.map((b) => (
              <Card key={b.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{b.product}</Text>
                    <Text style={styles.productMeta}>Batch: {b.id} · Stock: {b.qty} units</Text>
                    {b.clearancePrice && (
                      <Badge variant="brand" style={{ marginTop: 4 }}>
                        Clearance: ${b.clearancePrice.toFixed(2)}
                      </Badge>
                    )}
                  </View>
                  <View style={styles.productPriceCol}>
                    <Text style={styles.productMeta}>Exp {b.expiry}</Text>
                    <Badge variant={statusVariant(b.status)} style={styles.marginT4}>
                      {b.status === 'urgent' ? 'Urgent' : b.status === 'near' ? 'Near' : 'Fresh'}
                    </Badge>
                  </View>
                </View>
                {(b.status === 'urgent' || b.status === 'near') && (
                  <Button
                    variant="secondary"
                    style={styles.clearanceBtn}
                    onClick={() => {
                      setSelectedBatch(b);
                      setClearanceVal(b.clearancePrice ? String(b.clearancePrice) : '');
                      setClearanceOpen(true);
                    }}
                  >
                    Set Clearance Price
                  </Button>
                )}
              </Card>
            ))}
            {filteredBatches.length === 0 && (
              <Text style={styles.noDataText}>No batches found.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* Clearance Price Sheet */}
      <Sheet
        open={clearanceOpen}
        onClose={() => {
          setSelectedBatch(null);
          setClearanceOpen(false);
        }}
        title="Set Clearance Price"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => {
              setSelectedBatch(null);
              setClearanceOpen(false);
            }}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleSetClearance}>Set Price</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {selectedBatch && (
            <>
              <Field label="Product">
                <Text style={styles.productName}>{selectedBatch.product}</Text>
                <Text style={styles.productMeta}>Batch: {selectedBatch.id} · Expiry: {selectedBatch.expiry}</Text>
              </Field>
              <Field label="Clearance Discount Price ($)">
                <TextInput
                  placeholder="e.g. 2.99"
                  value={clearanceVal}
                  onChangeText={setClearanceVal}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </Field>
            </>
          )}
        </View>
      </Sheet>
    </View>
  );
}

export function InventoryTransfers() {
  const { branch } = useAuth();
  const { products, transfers, addTransfer } = useInventoryManager();

  // Create wizard states
  const [newTransferOpen, setNewTransferOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qtyVal, setQtyVal] = useState('');
  const [origin, setOrigin] = useState('Central Warehouse');
  const [destination, setDestination] = useState('Al Barsha');

  const handleCreateTransfer = () => {
    if (!selectedProductId) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(qtyVal);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid transfer quantity');
      return;
    }

    addTransfer(product.name, qty, origin, destination);
    Alert.alert('Transfer Created', `Inter-branch stock transfer requested for ${product.name}.`);
    setSelectedProductId('');
    setQtyVal('');
    setOrigin('Central Warehouse');
    setDestination('Al Barsha');
    setNewTransferOpen(false);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <View style={styles.headerRow}>
          <Text style={styles.mainTitle}>Inter-Branch Transfers</Text>
          <Button style={styles.newBtn} onClick={() => {
            if (products.length > 0) {
              setSelectedProductId(products[0].id);
            }
            setNewTransferOpen(true);
          }}>
            + New
          </Button>
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {transfers.map((t) => (
              <Card key={t.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{t.id}</Text>
                    <Text style={styles.productName}>{t.item}</Text>
                    <Text style={styles.productMeta}>From: {t.from} → To: {t.to}</Text>
                    <Text style={styles.productMeta}>Requested on {t.date}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Text style={styles.productPrice}>{t.qty} units</Text>
                    <Badge variant={t.status === 'Received' ? 'success' : t.status === 'In Transit' ? 'warn' : 'neutral'}>
                      {t.status}
                    </Badge>
                  </View>
                </View>
              </Card>
            ))}
            {transfers.length === 0 && (
              <Text style={styles.noDataText}>No active stock transfers recorded.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* New Transfer Wizard */}
      <Sheet
        open={newTransferOpen}
        onClose={() => setNewTransferOpen(false)}
        title="Inter-Branch Stock Transfer"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setNewTransferOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreateTransfer}>Initiate</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Select Product">
            <View style={styles.productPickerScrollContainer}>
              <ScrollView style={styles.productPickerScroll} nestedScrollEnabled>
                {products.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerItem, selectedProductId === p.id && styles.pickerItemActive]}
                    onPress={() => setSelectedProductId(p.id)}
                  >
                    <Text style={[styles.pickerItemText, selectedProductId === p.id && styles.pickerItemTextActive]}>
                      {p.name} (Stock: {p.stock})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Field>
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Origin Branch">
                <TextInput value={origin} onChangeText={setOrigin} style={styles.modalInput} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Destination Branch">
                <TextInput value={destination} onChangeText={setDestination} style={styles.modalInput} />
              </Field>
            </View>
          </View>
          <Field label="Quantity to Move">
            <TextInput
              placeholder="e.g. 50"
              value={qtyVal}
              onChangeText={setQtyVal}
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
        </View>
      </Sheet>
    </View>
  );
}

export function InventoryAlerts() {
  const { branch } = useAuth();
  const { products, batches, raisePoDraft } = useInventoryManager();

  const handleRaiseDraft = (productName: string) => {
    raisePoDraft(productName);
    Alert.alert('PO Draft Raised', `A PO Draft has been submitted to HO for ${productName}.`);
  };

  const lowStock = products.filter((p) => p.stock <= p.reorder);

  const alerts = [
    ...lowStock.map((p) => ({ id: p.id, type: 'Low Stock', msg: `${p.name} — ${p.stock} units remaining (Reorder: ${p.reorder})`, level: 'warn', productName: p.name })),
    ...batches.filter((b) => b.status !== 'fresh').map((b) => ({ id: b.id, type: 'Near Expiry', msg: `${b.product} (Batch: ${b.id}) — exp ${b.expiry}`, level: b.status === 'urgent' ? 'error' : 'warn', productName: b.product })),
  ];

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Low-Stock Alerts</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {alerts.map((a) => (
              <Card key={a.id}>
                <View style={styles.alertHeaderRow}>
                  <Bell size={16} color={a.level === 'error' ? '#ef4444' : '#d97706'} style={{ marginRight: 10 }} />
                  <View style={styles.alertContent}>
                    <Text style={styles.productName}>{a.type}</Text>
                    <Text style={styles.productMeta}>{a.msg}</Text>
                  </View>
                  <Badge variant={a.level === 'error' ? 'error' : 'warn'}>
                    {a.level === 'error' ? 'Urgent' : 'Warn'}
                  </Badge>
                </View>
                {a.type === 'Low Stock' && (
                  <Button
                    variant="secondary"
                    style={styles.clearanceBtn}
                    onClick={() => handleRaiseDraft(a.productName)}
                  >
                    <ShoppingCart size={14} color="#475569" style={{ marginRight: 6 }} />
                    Raise PO Draft
                  </Button>
                )}
              </Card>
            ))}
            {alerts.length === 0 && (
              <Text style={styles.noDataText}>All inventory levels are healthy.</Text>
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
  marginT4: {
    marginTop: 4,
  },
  clearanceBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },

  // Stock filters styling
  headerBtnWrapper: {
    marginBottom: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  noDataText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Modal forms
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
  sheetFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetFooterBtn: {
    flex: 1,
  },
});
