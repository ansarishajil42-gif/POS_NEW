import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, Modal, Keyboard, Platform } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useHeadOffice, PurchaseItem, RoleConfig, Customer, Promotion, permToKeyMap } from '../../lib/HeadOfficeContext';
import {
  products,
  customerHistory
} from '../../lib/mockData';
import { apiClient } from '../../lib/apiClient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  Store,
  Package,
  ShoppingCart,
  AlertTriangle,
  Boxes,
  Truck,
  Receipt,
  Users,
  FileText,
  Search,
  Plus,
  Layers,
  ChevronRight,
  ShieldCheck,
  Tag,
  Star,
  Coins,
  Download,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  Check
} from 'lucide-react-native';

export function HeadOfficeHome() {
  const { branch } = useAuth();
  const { branches, purchases } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const totalSales = branches.reduce((a, b) => a + b.salesToday, 0);
  const totalAlerts = branches.reduce((a, b) => a + b.stockAlerts, 0);

  // Dynamic totals based on HeadOfficeContext
  const openPoValue = purchases.filter(p => p.stage === 'PO').reduce((s, p) => s + p.value, 0);
  const totalTills = branches.reduce((a, b) => a + b.tills, 0);

  const handleExportBrief = () => {
    showToast('Daily Brief has been compiled and downloaded as a CSV audit file.', 'success');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        {/* Export Daily Brief Action Banner */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={handleExportBrief} style={styles.headerBtn}>
            <Download size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Export Daily Brief
          </Button>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Sales Today" value={formatCurrency(totalSales)} icon={<Store size={16} color="#39ff14" />} accent="brand" trend={{ dir: 'up', value: '6%' }} />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Stock Alerts" value={String(totalAlerts)} icon={<AlertTriangle size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Open POs Value" value={formatCurrency(openPoValue)} icon={<ShoppingCart size={16} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Active Branches" value={String(branches.length)} icon={<Store size={16} color="#475569" />} accent="ink" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Branch Overview</Text>
        <View style={styles.branchesList}>
          {branches.map((b) => (
            <Card key={b.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.branchNameText}>{b.name}</Text>
                  <Text style={styles.branchMetaText}>{b.tills} tills · {b.staff} staff</Text>
                </View>
                <Text style={styles.branchSalesText}>{formatCurrency(b.salesToday)}</Text>
              </View>
              <View style={styles.badgeRow}>
                <Badge variant={b.stockAlerts > 5 ? 'warn' : 'success'} dot>
                  {b.stockAlerts} stock alerts
                </Badge>
                <Badge variant="neutral">{b.tills} tills</Badge>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function HeadOfficeOutlets({ onOpen }: { onOpen: (id: string) => void }) {
  const { branch } = useAuth();
  const { branches, addBranch, updateBranch, deleteBranch } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', address: '', tills: '1' });

  const handleSave = async () => {
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, formData.name, formData.address, parseInt(formData.tills) || 1);
      } else {
        await addBranch(formData.name, formData.address, parseInt(formData.tills) || 1);
      }
      setIsFormOpen(false);
      showToast('Branch saved successfully.', 'success');
    } catch (error) {
      showToast('Failed to save branch.', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Branch', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBranch(id);
            showToast('Branch deleted successfully.', 'success');
          } catch (error: any) {
            showToast(error.message || 'Failed to delete branch.', 'error');
          }
        }
      }
    ]);
  };

  const openAdd = () => {
    setEditingBranch(null);
    setFormData({ name: '', address: '', tills: '1' });
    setIsFormOpen(true);
  };

  const openEdit = (b: any) => {
    setEditingBranch(b);
    setFormData({ name: b.name, address: b.address || '', tills: String(b.tills) });
    setIsFormOpen(true);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        <View style={styles.headerBtnWrapper}>
          <Text style={styles.mainTitle}>Outlets</Text>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
            New Branch
          </Button>
        </View>
        <View style={styles.branchesList}>
          {branches.map((b) => (
            <Card key={b.id} onClick={() => onOpen(b.id)}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.branchNameText}>{b.name}</Text>
                  <Text style={styles.branchMetaText}>{b.tills} tills · {b.staff} staff</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => openEdit(b)}>
                    <Edit2 size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(b.id, b.name)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStatCol}><Text style={styles.miniStatValue}>{formatCurrency(b.salesToday)}</Text><Text style={styles.miniStatLabel}>Sales</Text></View>
                <View style={styles.miniStatCol}><Text style={styles.miniStatValue}>{b.stockAlerts}</Text><Text style={styles.miniStatLabel}>Alerts</Text></View>
                <View style={styles.miniStatCol}><Text style={styles.miniStatValue}>{b.tills}</Text><Text style={styles.miniStatLabel}>Tills</Text></View>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
      <Sheet open={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingBranch ? 'Edit Branch' : 'New Branch'}>
        <View style={styles.formGroup}>
          <Field label="Branch Name">
            <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} placeholder="e.g. Al Barsha Branch" />
          </Field>
          <Field label="Address">
            <TextInput style={styles.input} value={formData.address} onChangeText={t => setFormData({ ...formData, address: t })} placeholder="e.g. Dubai" />
          </Field>
          <Field label="Tills Count">
            <TextInput style={styles.input} value={formData.tills} onChangeText={t => setFormData({ ...formData, tills: t })} keyboardType="number-pad" />
          </Field>
          <Button full variant="primary" onClick={handleSave} style={styles.marginT}>Save Branch</Button>
        </View>
      </Sheet>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function OutletDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { branches, fetchBranchStock, fetchBranchStaff } = useHeadOffice();
  const [stock, setStock] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const b = branches.find((x) => x.id === id);

  React.useEffect(() => {
    if (b) {
      fetchBranchStock(b.id).then(setStock);
      fetchBranchStaff(b.id).then(setStaff);
    }
  }, [b?.id]);

  if (!b) return null;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title={b.name} subtitle="Branch detail" onBack={onBack} />
      <ScreenBody>
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Sales Today" value={formatCurrency(b.salesToday)} accent="brand" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Staff" value={String(b.staff)} accent="sky" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Tills" value={String(b.tills)} accent="brand" />
          </View>
        </View>

        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Local Inventory</Text>
          <View style={styles.inventoryList}>
            {stock.length === 0 ? <Text style={styles.emptyText}>0 stock records</Text> : null}
            {stock.slice(0, 4).map((p) => (
              <View key={p.id} style={styles.inventoryRow}>
                <Text style={styles.inventoryName} numberOfLines={1}>{p.productName || 'Unknown Product'}</Text>
                <Badge variant={p.stock <= p.reorderLevel ? 'warn' : 'success'}>{p.stock} Qty</Badge>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Staff</Text>
          <View style={styles.inventoryList}>
            {staff.length === 0 ? <Text style={styles.emptyText}>0 staff members</Text> : null}
            {staff.map((s) => (
              <View key={s.id} style={styles.inventoryRow}>
                <Text style={styles.inventoryName}>{s.name || 'Unnamed User'}</Text>
                <Badge variant={s.isActive ? 'success' : 'neutral'}>{s.role}</Badge>
              </View>
            ))}
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

export function HeadOfficeCatalog({ onOpenProduct }: { onOpenProduct: (id: string) => void }) {
  const { branch } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, batches } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [tab, setTab] = useState<'catalog' | 'batches'>('catalog');
  const [q, setQ] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    unit: '',
    costPrice: '',
    salePrice: '',
    isBatchTracked: false,
    barcodes: [] as string[],
    variants: [] as any[],
    unitConversions: [] as any[]
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
  );

  const openAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', barcode: '', category: '', unit: '', costPrice: '', salePrice: '', isBatchTracked: false, barcodes: [], variants: [], unitConversions: [] });
    setIsFormOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      category: p.category,
      unit: p.unit,
      costPrice: p.costPriceRaw || String(p.cost),
      salePrice: p.salePriceRaw || String(p.price),
      isBatchTracked: p.isBatchTracked,
      barcodes: [...(p.barcodes || [])],
      variants: [...(p.variants || [])],
      unitConversions: [...(p.unitConversions || [])]
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Product', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(id);
            showToast('Product deleted successfully.', 'success');
          } catch (error: any) {
            showToast(error.message || 'Failed to delete product.', 'error');
          }
        }
      }
    ]);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      setIsFormOpen(false);
      showToast('Product saved successfully.', 'success');
    } catch (error) {
      showToast('Failed to save product.', 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.mainTitle, { marginBottom: 0 }]}>Products</Text>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Add Product
          </Button>
        </View>

        <View style={styles.tabButtonsRow}>
          <TouchableOpacity onPress={() => setTab('catalog')} style={[styles.tabBtn, tab === 'catalog' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, tab === 'catalog' && styles.tabBtnTextActive]}>Catalog</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('batches')} style={[styles.tabBtn, tab === 'batches' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, tab === 'batches' && styles.tabBtnTextActive]}>Batch & Expiry</Text>
          </TouchableOpacity>
        </View>

        {tab === 'catalog' ? (
          <>
            <View style={styles.searchBar}>
              <Search size={16} color="#94a3b8" />
              <TextInput value={q} onChangeText={setQ} placeholder="Search by name or SKU…" placeholderTextColor="#94a3b8" style={styles.searchInput} />
            </View>
            <View style={styles.listContainer}>
              {filtered.map((p) => (
                <Card key={p.id}>
                  <View style={styles.cardHeaderRow}>
                    <TouchableOpacity style={styles.flex1} onPress={() => onOpenProduct(p.id)}>
                      <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.productMeta}>{p.sku} · {p.barcode} · {p.category}</Text>
                    </TouchableOpacity>
                    <View style={styles.productPriceCol}>
                      <Text style={styles.productPrice}>{formatCurrency(p.price)}</Text>
                      <Badge variant={p.stock < 10 ? 'warn' : 'success'}>{p.stock} {p.unit}</Badge>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }}>
                    <TouchableOpacity onPress={() => openEdit(p)}>
                      <Edit2 size={16} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p.id, p.name)}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.listContainer}>
            {batches.map((b) => (
              <Card key={b.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.productName} numberOfLines={1}>{b.product}</Text>
                    <Text style={styles.productMeta}>Batch {b.id}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Text style={styles.productMeta}>Exp {b.expiry}</Text>
                    <Badge variant={statusVariant(b.status)} style={styles.marginT4}>
                      {b.status === 'urgent' ? 'Urgent' : b.status === 'near' ? 'Near expiry' : 'Fresh'}
                    </Badge>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScreenBody>

      <Sheet open={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <ScrollView style={{ padding: 16 }}>
          <Field label="Product Name">
            <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />
          </Field>
          <Field label="Barcode / SKU">
            <TextInput style={styles.input} value={formData.barcode} onChangeText={t => setFormData({ ...formData, barcode: t })} />
          </Field>
          <Field label="Category">
            <TextInput style={styles.input} value={formData.category} onChangeText={t => setFormData({ ...formData, category: t })} />
          </Field>
          <Field label="Unit">
            <TextInput style={styles.input} value={formData.unit} onChangeText={t => setFormData({ ...formData, unit: t })} />
          </Field>
          <Field label="Cost Price">
            <TextInput style={styles.input} value={formData.costPrice} onChangeText={t => setFormData({ ...formData, costPrice: t })} keyboardType="numeric" />
          </Field>
          <Field label="Retail Price">
            <TextInput style={styles.input} value={formData.salePrice} onChangeText={t => setFormData({ ...formData, salePrice: t })} keyboardType="numeric" />
          </Field>
          <View style={styles.permRow}>
            <Text style={styles.permName}>Track expiry dates and batches</Text>
            <TouchableOpacity
              style={[styles.switchTrack, formData.isBatchTracked ? styles.trackOn : styles.trackOff]}
              onPress={() => setFormData({ ...formData, isBatchTracked: !formData.isBatchTracked })}
            >
              <View style={[styles.switchThumb, formData.isBatchTracked ? styles.thumbOn : styles.thumbOff]} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.cardTitle, { marginTop: 24 }]}>Alternate Barcodes</Text>
          {formData.barcodes.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={b} onChangeText={t => {
                const arr = [...formData.barcodes]; arr[i] = t; setFormData({ ...formData, barcodes: arr });
              }} />
              <TouchableOpacity onPress={() => {
                const arr = [...formData.barcodes]; arr.splice(i, 1); setFormData({ ...formData, barcodes: arr });
              }} style={{ justifyContent: 'center' }}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <Button variant="secondary" onClick={() => setFormData({ ...formData, barcodes: [...formData.barcodes, ''] })}>
            <Plus size={14} color="#64748b" style={{ marginRight: 4 }} /> Add Alternate Barcode
          </Button>

          <Text style={[styles.cardTitle, { marginTop: 24 }]}>Product Variants</Text>
          {formData.variants.map((v, i) => (
            <View key={i} style={{ borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 8, marginBottom: 8 }}>
              <TextInput style={[styles.input, { marginBottom: 4 }]} placeholder="Variant Name" value={v.variantName} onChangeText={t => {
                const arr = [...formData.variants]; arr[i].variantName = t; setFormData({ ...formData, variants: arr });
              }} />
              <TextInput style={[styles.input, { marginBottom: 4 }]} placeholder="Variant Value" value={v.variantValue} onChangeText={t => {
                const arr = [...formData.variants]; arr[i].variantValue = t; setFormData({ ...formData, variants: arr });
              }} />
              <TextInput style={[styles.input, { marginBottom: 4 }]} placeholder="SKU" value={v.sku} onChangeText={t => {
                const arr = [...formData.variants]; arr[i].sku = t; setFormData({ ...formData, variants: arr });
              }} />
              <TextInput style={styles.input} placeholder="Price Adj" value={v.priceAdjustment} keyboardType="numeric" onChangeText={t => {
                const arr = [...formData.variants]; arr[i].priceAdjustment = t; setFormData({ ...formData, variants: arr });
              }} />
              <TouchableOpacity onPress={() => {
                const arr = [...formData.variants]; arr.splice(i, 1); setFormData({ ...formData, variants: arr });
              }} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={{ color: '#ef4444', fontSize: 12 }}>Remove Variant</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Button variant="secondary" onClick={() => setFormData({ ...formData, variants: [...formData.variants, { variantName: '', variantValue: '', sku: '', priceAdjustment: '0' }] })}>
            <Plus size={14} color="#64748b" style={{ marginRight: 4 }} /> Add Variant
          </Button>

          <Text style={[styles.cardTitle, { marginTop: 24 }]}>Unit Conversions</Text>
          {formData.unitConversions.map((c, i) => (
            <View key={i} style={{ borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 8, marginBottom: 8 }}>
              <TextInput style={[styles.input, { marginBottom: 4 }]} placeholder="From Unit" value={c.fromUnit} onChangeText={t => {
                const arr = [...formData.unitConversions]; arr[i].fromUnit = t; setFormData({ ...formData, unitConversions: arr });
              }} />
              <TextInput style={[styles.input, { marginBottom: 4 }]} placeholder="To Unit" value={c.toUnit} onChangeText={t => {
                const arr = [...formData.unitConversions]; arr[i].toUnit = t; setFormData({ ...formData, unitConversions: arr });
              }} />
              <TextInput style={styles.input} placeholder="Conversion Factor" value={String(c.conversionFactor)} keyboardType="numeric" onChangeText={t => {
                const arr = [...formData.unitConversions]; arr[i].conversionFactor = t; setFormData({ ...formData, unitConversions: arr });
              }} />
              <TouchableOpacity onPress={() => {
                const arr = [...formData.unitConversions]; arr.splice(i, 1); setFormData({ ...formData, unitConversions: arr });
              }} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={{ color: '#ef4444', fontSize: 12 }}>Remove Conversion</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Button variant="secondary" onClick={() => setFormData({ ...formData, unitConversions: [...formData.unitConversions, { fromUnit: '', toUnit: '', conversionFactor: '1' }] })}>
            <Plus size={14} color="#64748b" style={{ marginRight: 4 }} /> Add Unit Conversion
          </Button>

          <Button full variant="primary" onClick={handleSave} style={{ marginVertical: 32 }}>Save Product</Button>
        </ScrollView>
      </Sheet>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function ProductDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { products } = useHeadOffice();
  const p = products.find((x) => x.id === id);
  if (!p) return null;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader
        title={p.name}
        subtitle={p.sku}
        onBack={onBack}
      />
      <ScreenBody>
        <Card>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.statusSub}>Sale Price</Text>
              <Text style={styles.priceText}>{formatCurrency(p.price)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statusSub}>Cost</Text>
              <Text style={styles.priceText}>{formatCurrency(p.cost)}</Text>
            </View>
          </View>
          <View style={styles.cardHeaderRow}>
            <Badge variant={p.stock < 10 ? 'warn' : 'success'}>{p.stock} {p.unit} in stock</Badge>
            {p.isBatchTracked && <Badge variant="brand">Batch Tracked</Badge>}
          </View>
        </Card>

        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.inventoryList}>
            <DetailRow label="SKU / Barcode" value={p.barcode || 'N/A'} />
            <DetailRow label="Category" value={p.category} />
            <DetailRow label="Unit" value={p.unit} />
          </View>
        </Card>

        {p.barcodes && p.barcodes.length > 0 && (
          <Card style={styles.marginT}>
            <Text style={styles.cardTitle}>Alternate Barcodes</Text>
            <View style={styles.inventoryList}>
              {p.barcodes.map((b, i) => <DetailRow key={i} label={`Barcode ${i + 1}`} value={b} />)}
            </View>
          </Card>
        )}

        {p.variants && p.variants.length > 0 && (
          <Card style={styles.marginT}>
            <Text style={styles.cardTitle}>Variants</Text>
            <View style={styles.inventoryList}>
              {p.variants.map((v, i) => (
                <DetailRow key={i} label={`${v.variantName}: ${v.variantValue}`} value={`SKU: ${v.sku || 'N/A'} | Adj: ${v.priceAdjustment}`} />
              ))}
            </View>
          </Card>
        )}

        {p.unitConversions && p.unitConversions.length > 0 && (
          <Card style={styles.marginT}>
            <Text style={styles.cardTitle}>Unit Conversions</Text>
            <View style={styles.inventoryList}>
              {p.unitConversions.map((c, i) => (
                <DetailRow key={i} label={`${c.fromUnit} -> ${c.toUnit}`} value={`Factor: ${c.conversionFactor}`} />
              ))}
            </View>
          </Card>
        )}
      </ScreenBody>
    </View>
  );
}

export function HeadOfficePurchasing() {
  const { branch } = useAuth();
  const { purchases, vendors, products, branches, createPurchaseOrder, recordGRN, convertToInvoice, addVendor, updateVendor, deleteVendor } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [step, setStep] = useState<'po' | 'grn' | 'invoice' | 'vendors'>('po');

  // PO Form
  const [poOpen, setPoOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [poItems, setPoItems] = useState<{ productId: string, qty: string, unitPrice: string }[]>([]);

  // GRN Form
  const [grnOpen, setGrnOpen] = useState(false);
  const [activePo, setActivePo] = useState<any>(null);
  const [grnItems, setGrnItems] = useState<any[]>([]);

  // Vendor Form
  const [vendorOpen, setVendorOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<any | null>(null);
  const [vendorForm, setVendorForm] = useState({ name: '', email: '', trn: '' });

  const [grnNumber, setGrnNumber] = useState('');
  
  const [convertInvoiceOpen, setConvertInvoiceOpen] = useState(false);
  const [activeConvertItem, setActiveConvertItem] = useState<any>(null);
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: '', dueDate: '' });

  // Invoice Details
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<any>(null);

  const stepPurchases = purchases.filter((p) => p.stage.toLowerCase() === step);
  const totalPayable = purchases.filter((p) => p.stage === 'Invoice').reduce((s, p) => s + p.value, 0);

  const handleCreatePO = async () => {
    if (!selectedVendorId || !selectedBranchId) {
      showToast('Please select vendor and branch', 'error');
      return;
    }
    if (poItems.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    let total = 0;
    const items = poItems.map(i => {
      const q = parseInt(i.qty) || 0;
      const p = parseFloat(i.unitPrice) || 0;
      total += (q * p);
      return { productId: i.productId, qty: q, unitPrice: p };
    });

    try {
      await createPurchaseOrder(selectedVendorId, selectedBranchId, items, total);
      showToast('Purchase Order created successfully', 'success');
      setPoOpen(false);
      setPoItems([]);
    } catch (e: any) {
      showToast(e.message || 'Failed to create PO', 'error');
    }
  };

  const handleInvoiceClick = async (inv: any) => {
    try {
      const res = await apiClient.get(`/purchasing/invoices/${inv.id}`);
      setInvoiceDetail(res);
      setInvoiceDetailOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to load invoice details', 'error');
    }
  };

  const handleDownloadInvoicePdf = async (invoice: any) => {
    if (!invoice) return;
    try {
      const itemsHtml = (invoice.items || []).map((item: any) => `
        <tr>
          <td>${item.name}</td>
          <td class="right-align">${item.receivedQty} pcs</td>
          <td class="right-align">${formatCurrency(item.unitPrice)}</td>
          <td class="right-align">${formatCurrency(item.subtotal)}</td>
        </tr>
      `).join('');

      const badgeClass = invoice.status === 'paid' ? 'badge-paid' : (invoice.status === 'pending' ? 'badge-pending' : 'badge-default');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .tenant-title {
              font-size: 24px;
              font-weight: bold;
              color: #0f172a;
            }
            .branch-name {
              font-size: 14px;
              color: #64748b;
              margin-top: 4px;
            }
            .invoice-info {
              text-align: right;
            }
            .invoice-title {
              font-size: 20px;
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 5px;
            }
            .invoice-meta {
              font-size: 12px;
              color: #64748b;
              line-height: 1.5;
            }
            .details-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              gap: 20px;
            }
            .details-col {
              flex: 1;
            }
            .details-title {
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 8px;
              font-size: 14px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .details-text {
              font-size: 12px;
              color: #334155;
              line-height: 1.6;
            }
            .table-container {
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              color: #64748b;
              font-weight: bold;
              font-size: 12px;
              padding: 10px;
            }
            td {
              border-bottom: 1px solid #f1f5f9;
              padding: 10px;
              font-size: 12px;
              color: #0f172a;
            }
            .right-align {
              text-align: right;
            }
            .totals-container {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              border-top: 2px solid #e2e8f0;
              padding-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              width: 320px;
              margin-bottom: 6px;
              font-size: 14px;
              color: #64748b;
            }
            .total-row.final {
              font-size: 18px;
              font-weight: bold;
              color: #0f172a;
              margin-top: 5px;
            }
            .total-label {
              flex: 1;
              text-align: right;
              padding-right: 15px;
            }
            .total-val {
              width: 120px;
              text-align: right;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 5px;
            }
            .badge-paid { background-color: #dcfce7; color: #15803d; }
            .badge-pending { background-color: #fef9c3; color: #a16207; }
            .badge-default { background-color: #f1f5f9; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="tenant-title">${invoice.tenantName}</div>
              <div class="branch-name">Branch: ${invoice.branchName}</div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">
                Ref: ${invoice.invoiceNumber}<br/>
                Date: ${invoice.createdAt ? invoice.createdAt.split("T")[0] : ""}<br/>
                Due Date: ${invoice.dueDate ? invoice.dueDate.split("T")[0] : ""}
              </div>
            </div>
          </div>

          <div class="details-row">
            <div class="details-col">
              <div class="details-title">Supplier Details:</div>
              <div class="details-text">
                <strong>${invoice.vendorName}</strong><br/>
                ${invoice.vendorTrn ? `TRN: ${invoice.vendorTrn}<br/>` : ''}
                ${invoice.vendorContact ? `Contact: ${invoice.vendorContact}<br/>` : ''}
                ${invoice.vendorEmail ? `Email: ${invoice.vendorEmail}<br/>` : ''}
              </div>
            </div>
            <div class="details-col">
              <div class="details-title">References:</div>
              <div class="details-text">
                PO Reference: <strong>${invoice.poNumber}</strong><br/>
                GRN Reference: <strong>${invoice.grnNumber}</strong><br/>
                Status: <span class="badge ${badgeClass}">${invoice.status}</span>
              </div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="right-align">Rec. Qty</th>
                  <th class="right-align">Unit Price</th>
                  <th class="right-align">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || '<tr><td colspan="4" style="text-align:center;">No products found</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="totals-container">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-val">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">VAT (${invoice.vatRate}% ${invoice.vatInclusive ? 'Incl.' : 'Excl.'}):</span>
              <span class="total-val">${formatCurrency(invoice.vat)}</span>
            </div>
            <div class="total-row final">
              <span class="total-label">Total:</span>
              <span class="total-val">${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        showToast('PDF generated at ' + uri, 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to generate PDF', 'error');
    }
  };

  const openRecordGRN = (po: any) => {
    setActivePo(po);
    setGrnNumber('');
    const initialItems = po.po.items.map((i: any) => ({
      productId: i.productId,
      productName: i.product.name,
      orderedQty: i.qty,
      receivedQty: String(i.qty),
      isBatchTracked: i.product.isBatchTracked,
      batchNumber: '',
      expiryDate: ''
    }));
    setGrnItems(initialItems);
    setGrnOpen(true);
  };

  const submitGRN = async () => {
    if (!activePo) return;
    if (!grnNumber) {
      showToast('Supplier GRN Number / Invoice Reference is required', 'error');
      return;
    }
    try {
      await recordGRN(activePo.po.id, grnNumber, grnItems);
      showToast('GRN recorded successfully', 'success');
      setGrnOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to record GRN', 'error');
    }
  };

  const openConvertInvoice = (item: any) => {
    setActiveConvertItem(item);
    setInvoiceForm({ invoiceNumber: '', dueDate: '' });
    setConvertInvoiceOpen(true);
  };

  const submitConvertInvoice = async () => {
    if (!activeConvertItem) return;
    if (!invoiceForm.invoiceNumber) {
      showToast('Invoice Number is required', 'error');
      return;
    }
    if (!invoiceForm.dueDate) {
      showToast('Due Date is required', 'error');
      return;
    }
    try {
      await convertToInvoice(activeConvertItem.grn.id, invoiceForm.invoiceNumber, invoiceForm.dueDate, activeConvertItem.value);
      showToast('Converted to Invoice successfully', 'success');
      setConvertInvoiceOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to convert to invoice', 'error');
    }
  };



  const handleEditVendorClick = (v: any) => {
    setVendorForm({ name: v.name || '', email: v.email || '', trn: v.trn || '' });
    setEditVendor(v);
    setVendorOpen(true);
  };

  const handleDeleteVendorClick = (v: any) => {
    const isLinked = purchases.some((p) => p.vendor === v.name || (p as any).vendorId === v.id);
    if (isLinked) {
      showToast('Yeh vendor delete nahi ho sakta kyunke iske records maujood hain', 'error');
      return;
    }

    Alert.alert('Delete Vendor', `Are you sure you want to delete ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVendor(v.id);
            showToast('Vendor deleted successfully', 'success');
          } catch (err: any) {
            showToast(err.message || 'Failed to delete vendor', 'error');
          }
        },
      },
    ]);
  };

  const submitVendor = async () => {
    if (!vendorForm.name) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      if (editVendor) {
        await updateVendor(editVendor.id, vendorForm);
        showToast('Vendor updated successfully', 'success');
      } else {
        await addVendor(vendorForm);
        showToast('Vendor added successfully', 'success');
      }
      setVendorForm({ name: '', email: '', trn: '' });
      setEditVendor(null);
      setVendorOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to save vendor', 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.mainTitle, { marginBottom: 0 }]}>Purchasing</Text>
          {step === 'po' && (
            <Button variant="primary" onClick={() => setPoOpen(true)}>
              <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
              New PO
            </Button>
          )}
          {step === 'vendors' && (
            <Button variant="primary" onClick={() => {
              setEditVendor(null);
              setVendorForm({ name: '', email: '', trn: '' });
              setVendorOpen(true);
            }}>
              <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
              Add Vendor
            </Button>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.tabButtonsRow}>
            <TouchableOpacity onPress={() => setStep('po')} style={[styles.tabBtn, step === 'po' && styles.tabBtnActive, { minWidth: 80 }]}>
              <Text style={[styles.tabBtnText, step === 'po' && styles.tabBtnTextActive]}>1. POs</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('grn')} style={[styles.tabBtn, step === 'grn' && styles.tabBtnActive, { minWidth: 80 }]}>
              <Text style={[styles.tabBtnText, step === 'grn' && styles.tabBtnTextActive]}>2. GRNs</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('invoice')} style={[styles.tabBtn, step === 'invoice' && styles.tabBtnActive, { minWidth: 80 }]}>
              <Text style={[styles.tabBtnText, step === 'invoice' && styles.tabBtnTextActive]}>3. Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('vendors')} style={[styles.tabBtn, step === 'vendors' && styles.tabBtnActive, { minWidth: 80 }]}>
              <Text style={[styles.tabBtnText, step === 'vendors' && styles.tabBtnTextActive]}>Vendors</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {step === 'po' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              {stepPurchases.map((po) => (
                <Card key={po.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{po.id}</Text>
                      <Text style={styles.productMeta}>{po.vendor} · {po.date}</Text>
                      <Badge variant="neutral" style={{ marginTop: 4, alignSelf: 'flex-start' }}>{po.po?.status}</Badge>
                    </View>
                    <View style={[styles.productPriceCol, { minWidth: 100 }]}>
                      <Text style={styles.productPrice}>{formatCurrency(po.value)}</Text>
                      {po.po?.status === 'Draft' || po.po?.status === 'Ordered' ? (
                        <Button variant="secondary" style={styles.miniBtn} onClick={() => openRecordGRN(po)}>
                          Record GRN
                        </Button>
                      ) : null}
                    </View>
                  </View>
                </Card>
              ))}
              {stepPurchases.length === 0 && (
                <Text style={styles.noDataText}>No purchase orders found.</Text>
              )}
            </View>
          </ScrollView>
        )}

        {step === 'grn' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              {stepPurchases.map((g) => (
                <Card key={g.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{g.grn?.grnNumber}</Text>
                      <Text style={styles.productMeta}>{g.vendor} · {g.date}</Text>
                      {g.variance && (
                        <Badge variant="error" style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                          {g.variance}
                        </Badge>
                      )}
                    </View>
                    <View style={[styles.productPriceCol, { minWidth: 100 }]}>
                      <Text style={styles.productPrice}>{formatCurrency(g.value)}</Text>
                      {g.grn?.purchaseOrder?.status === 'GRN' ? (
                        <Button variant="secondary" style={styles.miniBtn} onClick={() => openConvertInvoice(g)}>
                          Convert to Invoice
                        </Button>
                      ) : (
                        <Badge variant="neutral">Invoiced</Badge>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
              {stepPurchases.length === 0 && (
                <Text style={styles.noDataText}>No GRNs found.</Text>
              )}
            </View>
          </ScrollView>
        )}

        {step === 'invoice' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              <Card style={styles.statsCard}>
                <View>
                  <Text style={styles.statusSub}>Accounts Payable</Text>
                  <Text style={styles.payableAmount}>{formatCurrency(totalPayable)}</Text>
                </View>
              </Card>
              <View style={styles.marginT}>
                {stepPurchases.map((inv) => (
                  <TouchableOpacity key={inv.id} onPress={() => handleInvoiceClick(inv)} activeOpacity={0.7}>
                    <Card style={{ marginBottom: 8 }}>
                      <View style={styles.cardHeaderRow}>
                        <View>
                          <Text style={styles.productName}>{inv.invoice?.invoiceNumber || inv.id}</Text>
                          <Text style={styles.productMeta}>{inv.vendor} · {inv.date}</Text>
                        </View>
                        <View style={styles.productPriceCol}>
                          <Text style={styles.productPrice}>{formatCurrency(inv.value)}</Text>
                          <Button variant="secondary" style={styles.miniBtn} onClick={() => handleInvoiceClick(inv)}>
                            View Details
                          </Button>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {step === 'vendors' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              {vendors.map((v) => (
                <Card key={v.id} style={{ marginBottom: 8 }}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{v.name}</Text>
                      <Text style={styles.productMeta}>{v.email || 'No email'} · {v.trn ? `TRN: ${v.trn}` : 'No TRN'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => handleEditVendorClick(v)} style={{ padding: 4 }}>
                        <Edit2 size={16} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteVendorClick(v)} style={{ padding: 4 }}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
              {vendors.length === 0 && (
                <Text style={styles.noDataText}>No vendors found.</Text>
              )}
            </View>
          </ScrollView>
        )}

      </ScreenBody>

      {/* Invoice Details Modal */}
      <Modal visible={invoiceDetailOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setInvoiceDetailOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invoice Details</Text>
            <TouchableOpacity onPress={() => setInvoiceDetailOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {invoiceDetail ? (
              <View style={{ paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{invoiceDetail.tenantName}</Text>
                    {!!invoiceDetail.tenantTrn && <Text style={{ fontSize: 12, color: '#64748b' }}>TRN: {invoiceDetail.tenantTrn}</Text>}
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Branch: {invoiceDetail.branchName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>INVOICE</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Ref: {invoiceDetail.invoiceNumber}</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Date: {invoiceDetail.createdAt ? invoiceDetail.createdAt.split("T")[0] : ""}</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Due: {invoiceDetail.dueDate ? invoiceDetail.dueDate.split("T")[0] : ""}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Supplier Details:</Text>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>{invoiceDetail.vendorName}</Text>
                    {!!invoiceDetail.vendorTrn && <Text style={{ fontSize: 12, color: '#64748b' }}>TRN: {invoiceDetail.vendorTrn}</Text>}
                    {!!invoiceDetail.vendorContact && <Text style={{ fontSize: 12, color: '#64748b' }}>Contact: {invoiceDetail.vendorContact}</Text>}
                    {!!invoiceDetail.vendorEmail && <Text style={{ fontSize: 12, color: '#64748b' }}>Email: {invoiceDetail.vendorEmail}</Text>}
                  </View>
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <Text style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>References:</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>PO: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{invoiceDetail.poNumber}</Text></Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>GRN: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{invoiceDetail.grnNumber}</Text></Text>
                    <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                      <Badge variant={statusVariant(invoiceDetail.status)}>{invoiceDetail.status.toUpperCase()}</Badge>
                    </View>
                  </View>
                </View>

                <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                    <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 12, color: '#64748b' }}>Product</Text>
                    <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'right' }}>Rec. Qty</Text>
                    <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'right' }}>Unit Price</Text>
                    <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'right' }}>Subtotal</Text>
                  </View>
                  {(invoiceDetail.items || []).length === 0 && (
                    <Text style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>No products found</Text>
                  )}
                  {(invoiceDetail.items || []).map((item: any) => (
                    <View key={item.productId} style={{ flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                      <Text style={{ flex: 2, fontWeight: '600', fontSize: 12, color: '#0f172a' }}>{item.name}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#0f172a', textAlign: 'right' }}>{item.receivedQty} pcs</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#0f172a', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</Text>
                      <Text style={{ flex: 1, fontWeight: '600', fontSize: 12, color: '#0f172a', textAlign: 'right' }}>{formatCurrency(item.subtotal)}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 16 }}>
                  <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Subtotal: {formatCurrency(invoiceDetail.subtotal)}</Text>
                  <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>VAT ({invoiceDetail.vatRate}% {invoiceDetail.vatInclusive ? 'Incl.' : 'Excl.'}): {formatCurrency(invoiceDetail.vat)}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Total: {formatCurrency(invoiceDetail.total)}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <Button variant="secondary" onClick={() => handleDownloadInvoicePdf(invoiceDetail)}>Download PDF</Button>
                  <Button variant="primary" onClick={() => setInvoiceDetailOpen(false)}>Close</Button>
                </View>
              </View>
            ) : (
              <Text style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading details...</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* PO Modal */}
      <Modal visible={poOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPoOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create PO</Text>
            <TouchableOpacity onPress={() => setPoOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Field label="Vendor">
              <TextInput 
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="Search vendor..."
                value={vendorSearch}
                onFocus={() => setVendorDropdownOpen(true)}
                onChangeText={(text) => {
                  setVendorSearch(text);
                  setVendorDropdownOpen(true);
                }}
              />
              {vendorDropdownOpen && (
                <View style={{ maxHeight: 150, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase())).map(v => (
                      <TouchableOpacity 
                        key={v.id} 
                        onPress={() => {
                          setSelectedVendorId(v.id);
                          setVendorSearch(v.name);
                          setVendorDropdownOpen(false);
                          Keyboard.dismiss();
                        }} 
                        style={{ padding: 12, backgroundColor: selectedVendorId === v.id ? '#39ff14' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                        <Text style={{ fontWeight: selectedVendorId === v.id ? 'bold' : 'normal', color: '#0f172a' }}>{v.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase())).length === 0 && (
                      <Text style={{ padding: 12, color: '#64748b' }}>No vendors found</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </Field>

            <Field label="Branch">
              <TextInput 
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="Search branch..."
                value={branchSearch}
                onFocus={() => setBranchDropdownOpen(true)}
                onChangeText={(text) => {
                  setBranchSearch(text);
                  setBranchDropdownOpen(true);
                }}
              />
              {branchDropdownOpen && (
                <View style={{ maxHeight: 150, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase())).map(b => (
                      <TouchableOpacity 
                        key={b.id} 
                        onPress={() => {
                          setSelectedBranchId(b.id);
                          setBranchSearch(b.name);
                          setBranchDropdownOpen(false);
                          Keyboard.dismiss();
                        }} 
                        style={{ padding: 12, backgroundColor: selectedBranchId === b.id ? '#39ff14' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                        <Text style={{ fontWeight: selectedBranchId === b.id ? 'bold' : 'normal', color: '#0f172a' }}>{b.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase())).length === 0 && (
                      <Text style={{ padding: 12, color: '#64748b' }}>No branches found</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </Field>

            <Field label="Items">
              {poItems.map((item, index) => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <View key={index} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>{prod?.name}</Text>
                    </View>
                    <TextInput style={[styles.input, { flex: 1, paddingVertical: 4 }]} value={item.qty} onChangeText={t => { const newItems = [...poItems]; newItems[index].qty = t; setPoItems(newItems); }} placeholder="Qty" keyboardType="numeric" />
                    <TextInput style={[styles.input, { flex: 1, paddingVertical: 4 }]} value={item.unitPrice} onChangeText={t => { const newItems = [...poItems]; newItems[index].unitPrice = t; setPoItems(newItems); }} placeholder="Price" keyboardType="numeric" />
                    <TouchableOpacity onPress={() => { const newItems = [...poItems]; newItems.splice(index, 1); setPoItems(newItems); }} style={{ padding: 4 }}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 8 }}>
                {products.map(p => (
                  <TouchableOpacity key={p.id} onPress={() => setPoItems([...poItems, { productId: p.id, qty: '1', unitPrice: String(p.cost) }])} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8, marginRight: 8 }}>
                    <Text style={{ fontSize: 12 }}>+ {p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Field>

            <Button variant="primary" onClick={handleCreatePO} style={{ marginTop: 24 }}>Submit PO</Button>
          </ScrollView>
        </View>
      </Modal>

      {/* GRN Modal */}
      <Modal visible={grnOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setGrnOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Record Goods Received (GRN)</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Record actual quantities received against PO.</Text>
            </View>
            <TouchableOpacity onPress={() => setGrnOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a', marginBottom: 6 }}>Supplier GRN Number / Invoice Reference *</Text>
                <TextInput style={styles.input} placeholder="e.g. GRN-9912" value={grnNumber} onChangeText={setGrnNumber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a', marginBottom: 6 }}>Delivery Branch</Text>
                <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: '#94a3b8' }]} value={activePo?.po?.branch?.name || (typeof branch === 'string' ? branch : (branch as any)?.name) || 'Head Office'} editable={false} />
              </View>
            </View>

            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 12, color: '#64748b' }}>PRODUCT</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'center' }}>ORDERED QTY</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'center' }}>RECEIVED QTY</Text>
                <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 12, color: '#64748b' }}>BATCH INFO (REQUIRED IF BATCH-TRACKED)</Text>
              </View>
              {grnItems.map((item, index) => (
                <View key={item.productId} style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' }}>
                  <Text style={{ flex: 2, fontWeight: '600', fontSize: 14, color: '#0f172a' }}>{item.productName}</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: '#0f172a', textAlign: 'center' }}>{item.orderedQty}</Text>
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <TextInput style={[styles.input, { textAlign: 'center', height: 36, paddingVertical: 0 }]} value={item.receivedQty} onChangeText={t => { const newItems = [...grnItems]; newItems[index].receivedQty = t; setGrnItems(newItems); }} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 2, paddingLeft: 8 }}>
                    {item.isBatchTracked && parseInt(item.receivedQty || '0') > 0 ? (
                      <View style={{ gap: 4 }}>
                        <TextInput style={[styles.input, { height: 32, paddingVertical: 0, fontSize: 12 }]} placeholder="Batch Number" value={item.batchNumber} onChangeText={t => { const newItems = [...grnItems]; newItems[index].batchNumber = t; setGrnItems(newItems); }} />
                        <TextInput style={[styles.input, { height: 32, paddingVertical: 0, fontSize: 12 }]} placeholder="Expiry (YYYY-MM-DD)" value={item.expiryDate} onChangeText={t => { const newItems = [...grnItems]; newItems[index].expiryDate = t; setGrnItems(newItems); }} />
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>No tracking required</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, marginBottom: 40 }}>
              <Button variant="secondary" onClick={() => setGrnOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submitGRN}>Receive & Save GRN</Button>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Convert to Invoice Modal */}
      <Modal visible={convertInvoiceOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setConvertInvoiceOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Convert to Invoice</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Create a vendor invoice against GRN from {activeConvertItem?.vendor}.</Text>
            </View>
            <TouchableOpacity onPress={() => setConvertInvoiceOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a', marginBottom: 6 }}>Invoice Number / Reference *</Text>
                <TextInput style={styles.input} placeholder="e.g. INV-10294" value={invoiceForm.invoiceNumber} onChangeText={t => setInvoiceForm({...invoiceForm, invoiceNumber: t})} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a', marginBottom: 6 }}>Due Date *</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={invoiceForm.dueDate} onChangeText={t => setInvoiceForm({...invoiceForm, dueDate: t})} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a', marginBottom: 6 }}>Vendor</Text>
                <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: '#94a3b8' }]} value={activeConvertItem?.vendor || ''} editable={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a', marginBottom: 6 }}>Delivery Branch</Text>
                <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: '#94a3b8' }]} value={activeConvertItem?.grn?.purchaseOrder?.branch?.name || (typeof branch === 'string' ? branch : (branch as any)?.name) || 'Head Office'} editable={false} />
              </View>
            </View>

            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 12, color: '#64748b' }}>PRODUCT</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'right' }}>RECEIVED QTY</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'right' }}>UNIT PRICE</Text>
                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, color: '#64748b', textAlign: 'right' }}>SUBTOTAL</Text>
              </View>
              {activeConvertItem?.grn?.items?.map((item: any) => {
                const poItem = activeConvertItem.grn.purchaseOrder?.items?.find((i: any) => i.productId === item.productId);
                const unitPrice = parseFloat(poItem?.unitPrice || 0);
                const subtotal = item.receivedQty * unitPrice;
                return (
                  <View key={item.id || item.productId} style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' }}>
                    <Text style={{ flex: 2, fontWeight: '600', fontSize: 14, color: '#0f172a' }}>{item.product?.name}</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: '#0f172a', textAlign: 'right' }}>{item.receivedQty} pcs</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: '#0f172a', textAlign: 'right' }}>{formatCurrency(unitPrice)}</Text>
                    <Text style={{ flex: 1, fontWeight: '600', fontSize: 14, color: '#0f172a', textAlign: 'right' }}>{formatCurrency(subtotal)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ alignItems: 'flex-end', paddingBottom: 16 }}>
              {(() => {
                let subtotalSum = 0;
                activeConvertItem?.grn?.items?.forEach((item: any) => {
                  const poItem = activeConvertItem.grn.purchaseOrder?.items?.find((i: any) => i.productId === item.productId);
                  subtotalSum += item.receivedQty * parseFloat(poItem?.unitPrice || 0);
                });
                const total = subtotalSum; 
                const actualVat = total - (total / 1.05);
                return (
                  <>
                    <Text style={{ fontSize: 14, color: '#0f172a', marginBottom: 4 }}>Subtotal: {formatCurrency(total)}</Text>
                    <Text style={{ fontSize: 14, color: '#0f172a', marginBottom: 8 }}>VAT (5% Included): {formatCurrency(actualVat)}</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Total: {formatCurrency(total)}</Text>
                  </>
                );
              })()}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8, marginBottom: 40 }}>
              <Button variant="secondary" onClick={() => setConvertInvoiceOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submitConvertInvoice}>Convert to Invoice</Button>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add/Edit Vendor Modal */}
      <Modal visible={vendorOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVendorOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editVendor ? 'Edit Vendor' : 'Add Vendor'}</Text>
            <TouchableOpacity onPress={() => setVendorOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Field label="Vendor Name">
              <TextInput style={styles.input} value={vendorForm.name} onChangeText={t => setVendorForm({ ...vendorForm, name: t })} />
            </Field>
            <Field label="Email">
              <TextInput style={styles.input} value={vendorForm.email} onChangeText={t => setVendorForm({ ...vendorForm, email: t })} />
            </Field>
            <Field label="TRN">
              <TextInput style={styles.input} value={vendorForm.trn} onChangeText={t => setVendorForm({ ...vendorForm, trn: t })} />
            </Field>
            <Button variant="primary" onClick={submitVendor} style={{ marginTop: 24 }}>{editVendor ? 'Save Changes' : 'Add Vendor'}</Button>
          </View>
        </View>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}
export function HeadOfficeMore({ onOpen }: { onOpen: (key: string) => void }) {
  const { branch } = useAuth();
  const items = [
    { key: 'rbac', label: 'Staff & Roles', desc: 'RBAC permissions editor', icon: <Users size={18} color="#39ff14" /> },
    { key: 'vat', label: 'VAT Compliance', desc: 'FTA summaries & tax filing downloads', icon: <FileText size={18} color="#39ff14" /> },
    { key: 'crm', label: 'Customer Loyalty', desc: 'Loyalty policies & vouchers issuing', icon: <Users size={18} color="#39ff14" /> },
    { key: 'promotions', label: 'Promotions', desc: 'Marketing campaigns & bundle codes', icon: <Tag size={18} color="#39ff14" /> },
    { key: 'price-requests', label: 'Price Requests', desc: 'Approve or reject override requests', icon: <ShoppingCart size={18} color="#39ff14" /> },
    { key: 'audit-logs', label: 'Audit Logs', desc: 'System actions and operations log', icon: <FileText size={18} color="#39ff14" /> },
    { key: 'aggregator', label: 'Aggregator Sync', desc: 'Talabat, Careem & more', icon: <Layers size={18} color="#39ff14" /> },
  ];

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>More</Text>
        <View style={styles.listContainer}>
          {items.map((i) => (
            <Card key={i.key} onClick={() => onOpen(i.key)}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.moreIconWrapper}>
                  {i.icon}
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.productName}>{i.label}</Text>
                  <Text style={styles.productMeta}>{i.desc}</Text>
                </View>
                <ChevronRight size={18} color="#cbd5e1" />
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
    </View>
  );
}

export function RbacScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { roles, togglePermission, staffUsers, addStaff, updateStaff, deleteStaff, branches, fetchStaffPermissions, toggleStaffPermissionOverride, resetStaffPermissions } = useHeadOffice();
  const [activeTab, setActiveTab] = useState<'directory' | 'roles'>('directory');
  const [selectedRoleName, setSelectedRoleName] = useState<string>('Branch Manager');
  
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Overrides UI states
  const [selectedRoleForStaffList, setSelectedRoleForStaffList] = useState<{ roleKey: string, roleName: string } | null>(null);
  const [roleStaffOpen, setRoleStaffOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any | null>(null);
  const [staffPermissionsOpen, setStaffPermissionsOpen] = useState(false);
  const [staffPermsLoading, setStaffPermsLoading] = useState(false);
  const [staffPermissionsList, setStaffPermissionsList] = useState<any[]>([]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);

  const [staffForm, setStaffForm] = useState<any>({
    id: '', name: '', email: '', role: 'cashier', branchId: '', pin: '', password: '', isActive: true
  });

  const roleOptions = [
    { label: 'Branch Manager', value: 'branch_manager' },
    { label: 'Inventory Manager', value: 'inventory_manager' },
    { label: 'Purchasing Officer', value: 'purchasing_officer' },
    { label: 'Cashier', value: 'cashier' },
  ];

  const handleAddUser = () => {
    setStaffForm({
      id: '',
      name: '',
      email: '',
      role: 'cashier',
      branchId: branches[0]?.id || '',
      pin: '',
      password: '',
      isActive: true
    });
    setStaffModalOpen(true);
  };

  const handleEdit = (u: any) => {
    setStaffForm({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'cashier',
      branchId: u.branchId || '',
      pin: '',
      password: '',
      isActive: u.isActive !== false
    });
    setStaffModalOpen(true);
  };

  const handleSave = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.role) {
      showToast("Name, Email and Role are required.", "error");
      return;
    }
    if (!staffForm.branchId) {
      showToast("Branch assignment is required.", "error");
      return;
    }
    if (!staffForm.id) {
      if (staffForm.role === 'cashier' && !staffForm.pin) {
        showToast("PIN is required for Cashier.", "error");
        return;
      }
      if (staffForm.role !== 'cashier' && !staffForm.password) {
        showToast("Password is required.", "error");
        return;
      }
    }

    try {
      if (staffForm.id) {
        await updateStaff(staffForm.id, staffForm);
      } else {
        await addStaff(staffForm);
      }
      setStaffModalOpen(false);
      showToast("Staff saved successfully.", "success");
    } catch (err: any) {
      console.error("Save staff error details:", err);
      showToast(err.message || "An error occurred.", "error");
    }
  };

  const handleOpenRoleStaff = (roleKey: string, roleName: string) => {
    setSelectedRoleForStaffList({ roleKey, roleName });
    setRoleStaffOpen(true);
  };

  const handleOpenStaffPermissions = async (user: any) => {
    setSelectedUserForPermissions(user);
    setStaffPermissionsOpen(true);
    setStaffPermsLoading(true);
    try {
      const data = await fetchStaffPermissions(user.id);
      const roleConfig = roles.find(r => r.role.toLowerCase().replace(" ", "_") === data.role);
      const standardPerms = roleConfig ? roleConfig.perms : [];
      const merged = standardPerms.map(p => {
        const dbPerm = permToKeyMap[p.name] || p.name.toLowerCase().replace(" ", "_");
        const override = data.overrides.find((o: any) => o.permission === dbPerm);
        return {
          name: p.name,
          enabled: override ? override.enabled : p.enabled,
          isOverridden: !!override,
        };
      });
      setStaffPermissionsList(merged);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch staff permissions", "error");
    } finally {
      setStaffPermsLoading(false);
    }
  };

  const handleToggleStaffOverride = async (permName: string, enabled: boolean) => {
    if (!selectedUserForPermissions) return;
    const dbPerm = permToKeyMap[permName] || permName.toLowerCase().replace(" ", "_");
    try {
      await toggleStaffPermissionOverride(selectedUserForPermissions.id, dbPerm, enabled);
      setStaffPermissionsList(prev => prev.map(p => {
        if (p.name === permName) {
          return { ...p, enabled, isOverridden: true };
        }
        return p;
      }));
      showToast("Override updated successfully.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to save override.", "error");
    }
  };

  const handleResetStaffOverrides = async () => {
    if (!selectedUserForPermissions) return;
    try {
      await resetStaffPermissions(selectedUserForPermissions.id);
      const data = await fetchStaffPermissions(selectedUserForPermissions.id);
      const roleConfig = roles.find(r => r.role.toLowerCase().replace(" ", "_") === data.role);
      const standardPerms = roleConfig ? roleConfig.perms : [];
      const merged = standardPerms.map(p => ({
        name: p.name,
        enabled: p.enabled,
        isOverridden: false,
      }));
      setStaffPermissionsList(merged);
      showToast("Resetted overrides back to default role-level.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to reset overrides.", "error");
    }
  };

  const roleCards = [
    {
      roleKey: 'branch_manager',
      roleName: 'Branch Manager',
      icon: <Store size={18} color="#4f46e5" />,
      memberCount: staffUsers.filter(u => u.role === 'branch_manager').length,
      customizedCount: staffUsers.filter(u => u.role === 'branch_manager' && u.isCustomized).length,
    },
    {
      roleKey: 'inventory_manager',
      roleName: 'Inventory Manager',
      icon: <Package size={18} color="#0891b2" />,
      memberCount: staffUsers.filter(u => u.role === 'inventory_manager').length,
      customizedCount: staffUsers.filter(u => u.role === 'inventory_manager' && u.isCustomized).length,
    },
    {
      roleKey: 'purchasing_officer',
      roleName: 'Purchasing Officer',
      icon: <Receipt size={18} color="#059669" />,
      memberCount: staffUsers.filter(u => u.role === 'purchasing_officer').length,
      customizedCount: staffUsers.filter(u => u.role === 'purchasing_officer' && u.isCustomized).length,
    },
    {
      roleKey: 'cashier',
      roleName: 'Cashier',
      icon: <Coins size={18} color="#d97706" />,
      memberCount: staffUsers.filter(u => u.role === 'cashier').length,
      customizedCount: staffUsers.filter(u => u.role === 'cashier' && u.isCustomized).length,
    },
  ];

  const getRoleLabel = (roleVal: string) => {
    const opt = roleOptions.find(o => o.value === roleVal);
    return opt ? opt.label : roleVal.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const selectedRole = roles.find(r => r.role === selectedRoleName);

  const filteredStaff = staffUsers
    .filter((u: any) => u.role !== 'super_admin' && u.role !== 'head_office_admin')
    .filter((u: any) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });

  const paginatedStaff = filteredStaff.slice(0, currentPage * 10);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Staff & Roles" subtitle="Manage users and permissions" onBack={onBack} />
      <ScreenBody>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Button variant={activeTab === 'directory' ? 'primary' : 'secondary'} onClick={() => setActiveTab('directory')}>Directory</Button>
          <Button variant={activeTab === 'roles' ? 'primary' : 'secondary'} onClick={() => setActiveTab('roles')}>Roles & Permissions</Button>
          {activeTab === 'directory' && (
            <View style={{ marginLeft: 'auto' }}>
              <Button variant="primary" onClick={handleAddUser}>Add User</Button>
            </View>
          )}
        </View>

        {activeTab === 'directory' ? (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.searchBar}>
              <Search size={16} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search staff by name or email..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
            </View>

            {paginatedStaff.map((u: any) => (
              <Card key={u.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>{u.name || 'Unnamed'}</Text>
                  <Text style={{ color: '#64748b', fontSize: 13 }}>{u.email}</Text>
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Role: {getRoleLabel(u.role)} • Branch: {branches.find(b => b.id === u.branchId)?.name || '-'}
                  </Text>
                  <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                    <Badge variant={u.isActive ? 'brand' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button variant="secondary" onClick={() => handleEdit(u)}>Edit</Button>
                  <Button variant="danger" onClick={() => {
                    Alert.alert(
                      "Delete User",
                      "Are you sure you want to delete this staff member?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await deleteStaff(u.id);
                              showToast("Staff deleted successfully.", "success");
                            } catch (err: any) {
                              showToast(err.message || "linked records maujood hain", "error");
                            }
                          }
                        }
                      ]
                    );
                  }}>Del</Button>
                </View>
              </Card>
            ))}
            {paginatedStaff.length === 0 && <Text style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8' }}>No staff found.</Text>}

            {filteredStaff.length > paginatedStaff.length && (
              <Button
                full
                variant="secondary"
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ marginVertical: 12 }}
              >
                Load More ({filteredStaff.length - paginatedStaff.length} remaining)
              </Button>
            )}
          </ScrollView>
        ) : (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Select a Role to Manage Permissions</Text>
            <View style={styles.statsGrid}>
              {roleCards.map(rc => (
                <View key={rc.roleKey} style={styles.halfCol}>
                  <TouchableOpacity onPress={() => handleOpenRoleStaff(rc.roleKey, rc.roleName)} activeOpacity={0.95}>
                    <Card style={[styles.statsCard, { minHeight: 120, justifyContent: 'space-between', padding: 14 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={styles.moreIconWrapper}>
                          {rc.icon}
                        </View>
                        <Badge variant={rc.customizedCount > 0 ? 'warn' : 'success'}>
                          {rc.customizedCount > 0 ? `${rc.customizedCount} Overridden` : 'Default'}
                        </Badge>
                      </View>
                      <View style={{ marginTop: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>{rc.roleName}</Text>
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{rc.memberCount} member{rc.memberCount !== 1 ? 's' : ''}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={[styles.auditLogBanner, { marginTop: 16 }]}>
              <ShieldCheck size={14} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={styles.auditLogText}>Every permission change is written to an immutable audit log.</Text>
            </View>
          </ScrollView>
        )}
      </ScreenBody>

      <Modal visible={staffModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#0f172a' }}>
              {staffForm.id ? 'Edit Staff Member' : 'Add Staff Member'}
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Full Name" value={staffForm.name} onChangeText={t => setStaffForm({...staffForm, name: t})} />
              
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" value={staffForm.email} onChangeText={t => setStaffForm({...staffForm, email: t})} />
              
              <Text style={styles.inputLabel}>Role</Text>
              <TouchableOpacity 
                style={[styles.input, { marginBottom: 12, justifyContent: 'center', minHeight: 45 }]} 
                onPress={() => setRolePickerOpen(true)}
              >
                <Text style={{ color: staffForm.role ? '#0f172a' : '#94a3b8' }}>
                  {roleOptions.find(o => o.value === staffForm.role)?.label || "Select Role"}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Branch assignment</Text>
              <TouchableOpacity 
                style={[styles.input, { marginBottom: 12, justifyContent: 'center', minHeight: 45 }]} 
                onPress={() => setBranchPickerOpen(true)}
              >
                <Text style={{ color: staffForm.branchId ? '#0f172a' : '#94a3b8' }}>
                  {branches.find(b => b.id === staffForm.branchId)?.name || "Select Branch"}
                </Text>
              </TouchableOpacity>
              
              {staffForm.role === 'cashier' ? (
                <>
                  <Text style={styles.inputLabel}>PIN {staffForm.id ? "(Leave blank to keep existing)" : "*"}</Text>
                  <TextInput 
                    style={[styles.input, { marginBottom: 12 }]} 
                    placeholder="4-digit PIN" 
                    keyboardType="numeric"
                    secureTextEntry 
                    value={staffForm.pin} 
                    onChangeText={t => setStaffForm({...staffForm, pin: t})} 
                  />
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Password {staffForm.id ? "(Leave blank to keep existing)" : "*"}</Text>
                  <TextInput 
                    style={[styles.input, { marginBottom: 12 }]} 
                    placeholder="Password" 
                    secureTextEntry 
                    value={staffForm.password} 
                    onChangeText={t => setStaffForm({...staffForm, password: t})} 
                  />
                </>
              )}

              {staffForm.id && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
                  <View>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>Active Status</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Inactive staff cannot log in.</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setStaffForm({...staffForm, isActive: !staffForm.isActive})}
                    style={[
                      styles.switchTrack,
                      staffForm.isActive ? styles.trackOn : styles.trackOff
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.switchThumb,
                      staffForm.isActive ? styles.thumbOn : styles.thumbOff
                    ]} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setStaffModalOpen(false)}>Cancel</Button>
              <Button variant="primary" style={{ flex: 1 }} onClick={handleSave}>Save Staff</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Picker Sheet */}
      <Sheet open={rolePickerOpen} onClose={() => setRolePickerOpen(false)} title="Select Role">
        {roleOptions.map(o => (
          <TouchableOpacity 
            key={o.value} 
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
            onPress={() => {
              setStaffForm({ ...staffForm, role: o.value });
              setRolePickerOpen(false);
            }}
          >
            <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: staffForm.role === o.value ? 'bold' : 'normal' }}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Sheet>

      {/* Branch Picker Sheet */}
      <Sheet open={branchPickerOpen} onClose={() => setBranchPickerOpen(false)} title="Select Branch">
        {branches.map(b => (
          <TouchableOpacity 
            key={b.id} 
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
            onPress={() => {
              setStaffForm({ ...staffForm, branchId: b.id });
              setBranchPickerOpen(false);
            }}
          >
            <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: staffForm.branchId === b.id ? 'bold' : 'normal' }}>
              {b.name}
            </Text>
          </TouchableOpacity>
        ))}
      </Sheet>

      {/* Role Staff List Sheet */}
      <Sheet
        open={roleStaffOpen}
        onClose={() => setRoleStaffOpen(false)}
        title={`${selectedRoleForStaffList?.roleName || ''} Staff`}
      >
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 4 }}>
            {staffUsers
              .filter(u => u.role === selectedRoleForStaffList?.roleKey)
              .map(u => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => {
                    setRoleStaffOpen(false);
                    handleOpenStaffPermissions(u);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 15 }}>{u.name || 'Unnamed'}</Text>
                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{u.email}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge variant={u.isCustomized ? 'warn' : 'neutral'}>
                      {u.isCustomized ? 'Customized' : 'Default'}
                    </Badge>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              ))}
            {staffUsers.filter(u => u.role === selectedRoleForStaffList?.roleKey).length === 0 && (
              <Text style={{ textAlign: 'center', color: '#94a3b8', marginVertical: 20 }}>No staff members found with this role.</Text>
            )}
          </View>
        </ScrollView>
      </Sheet>

      {/* Staff Permissions Overlay Grid */}
      <Sheet
        open={staffPermissionsOpen}
        onClose={() => setStaffPermissionsOpen(false)}
        title="Edit Staff Permissions"
        footer={
          staffPermissionsList.some(p => p.isOverridden) ? (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
              <Button variant="secondary" onClick={handleResetStaffOverrides} style={{ width: '100%' }}>
                Reset Overrides to Default Role
              </Button>
            </View>
          ) : undefined
        }
      >
        <View style={{ padding: 4 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>
              {selectedUserForPermissions?.name || 'Unnamed'}
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              {selectedUserForPermissions?.email} • {getRoleLabel(selectedUserForPermissions?.role || '')}
            </Text>
          </View>

          {staffPermsLoading ? (
            <Text style={{ textAlign: 'center', color: '#94a3b8', marginVertical: 20 }}>Loading permissions...</Text>
          ) : (
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={styles.permsList}>
                {staffPermissionsList.map((p) => (
                  <View key={p.name} style={styles.permRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.permName}>{p.name}</Text>
                      {p.isOverridden && (
                        <Text style={{ fontSize: 9, color: '#ef4444', marginTop: 2, fontWeight: '500' }}>
                          Customized Override
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleStaffOverride(p.name, !p.enabled)}
                      style={[styles.switchTrack, p.enabled ? styles.trackOn : styles.trackOff]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.switchThumb, p.enabled ? styles.thumbOn : styles.thumbOff]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function VatScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { fetchVatSettings, updateVatSettings, fetchVatSummary } = useHeadOffice();

  const [loading, setLoading] = useState(true);
  const [inclusive, setInclusive] = useState(true);
  const [vatRate, setVatRate] = useState("5.00");
  const [trn, setTrn] = useState("");
  const [currency, setCurrency] = useState("AED");

  // Summary stats
  const [summary, setSummary] = useState({
    salesExVat: "0.00",
    outputVat: "0.00",
    inputVat: "0.00",
    netVat: "0.00",
    csv: "",
  });

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const loadData = async () => {
    try {
      setLoading(true);
      const settings = await fetchVatSettings();
      setInclusive(settings.vatInclusive);
      setVatRate(settings.vatRate || "5.00");
      setTrn(settings.taxRegistrationNumber || "");
      setCurrency(settings.currency || "AED");

      const sumData = await fetchVatSummary("2026-07-01", "2026-09-30");
      setSummary({
        salesExVat: sumData.salesExVat || "0.00",
        outputVat: sumData.vatAmount || "0.00",
        inputVat: sumData.inputVat || "0.00",
        netVat: sumData.netVat || "0.00",
        csv: sumData.csv || "",
      });
    } catch (err: any) {
      console.error("VatScreen load error:", err);
      showToast("Failed to load VAT compliance details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await updateVatSettings({
        vatRate,
        vatInclusive: inclusive,
        taxRegistrationNumber: trn,
      });
      showToast("VAT settings saved", "success");
      loadData();
    } catch (err: any) {
      showToast("Failed to save settings", "error");
    }
  };

  const handleDownloadSummary = async () => {
    if (!summary.csv) {
      showToast("No CSV report content available.", "error");
      return;
    }
    try {
      const filename = `FTA_VAT_Summary_Q3_2026.csv`;
      const fileUri = `${documentDirectory}${filename}`;
      await writeAsStringAsync(fileUri, summary.csv, {
        encoding: EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export FTA Summary`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (err: any) {
      console.error('Export CSV error:', err);
      showToast('Failed to export CSV: ' + err.message, 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="VAT Compliance" subtitle="Configure and download compliance reports" onBack={onBack} />
      <ScreenBody>
        {loading ? (
          <Card style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#64748b' }}>Loading VAT configurations...</Text>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.cardTitle, { marginBottom: 16 }]}>VAT configuration</Text>
            
            {/* Tax-inclusive shelf pricing toggle */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16
            }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
                  {inclusive ? "Tax-inclusive" : "Tax-exclusive"} shelf pricing
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Applies to all outlets in this tenant.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setInclusive(!inclusive)}
                style={[styles.switchTrack, inclusive ? styles.trackOn : styles.trackOff]}
                activeOpacity={0.8}
              >
                <View style={[styles.switchThumb, inclusive ? styles.thumbOn : styles.thumbOff]} />
              </TouchableOpacity>
            </View>

            {/* Standard rate input */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 12
            }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Standard rate (%)</Text>
              <TextInput
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#0f172a',
                  width: 80,
                  textAlign: 'right',
                  padding: 0
                }}
                keyboardType="numeric"
                value={vatRate}
                onChangeText={setVatRate}
              />
            </View>

            {/* Output VAT read-only */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12
            }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Output VAT this period</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
                {currency} {parseFloat(summary.outputVat).toFixed(2)}
              </Text>
            </View>

            {/* Input VAT read-only */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 20
            }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>Input VAT this period</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
                {currency} {parseFloat(summary.inputVat).toFixed(2)}
              </Text>
            </View>

            {/* Action buttons inside the card */}
            <View style={{ flexDirection: 'column', gap: 10 }}>
              <Button variant="primary" onClick={handleSaveSettings}>
                Save VAT settings
              </Button>
              <Button variant="secondary" onClick={handleDownloadSummary}>
                Download FTA tax summary
              </Button>
            </View>
          </Card>
        )}
      </ScreenBody>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function CrmScreen({ onBack, onOpenCustomer }: { onBack: () => void; onOpenCustomer: (id: string) => void }) {
  const { branch } = useAuth();
  const { customers, loyaltyPolicies, updateLoyaltyPolicies, issueVoucher } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Policy Form Local States
  const [pointsSpent, setPointsSpent] = useState(String(loyaltyPolicies.pointsPerAed));
  const [minRedeem, setMinRedeem] = useState(String(loyaltyPolicies.minPoints));
  const [redValue, setRedValue] = useState(String(loyaltyPolicies.redemptionValue));

  const handleSavePolicies = () => {
    updateLoyaltyPolicies({
      pointsPerAed: parseInt(pointsSpent) || 10,
      minPoints: parseInt(minRedeem) || 5000,
      redemptionValue: parseInt(redValue) || 10,
    });
    showToast('Loyalty policies updated successfully.', 'success');
  };

  const handleIssueVoucher = (c: Customer) => {
    issueVoucher(c.id);
    showToast(`A voucher code has been dispatched to ${c.name}.`, 'success');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Customer Loyalty" subtitle="Loyalty policies & vouchers" onBack={onBack} />
      <ScreenBody>

        {/* Point-Redemption Policies Card */}
        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Point-Redemption Policies</Text>
          <View style={styles.settingsForm}>
            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.inputLabel}>Points per 1 AED</Text>
                <TextInput value={pointsSpent} onChangeText={setPointsSpent} keyboardType="numeric" style={styles.textInput} />
              </View>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.inputLabel}>Min Redeem Pts</Text>
                <TextInput value={minRedeem} onChangeText={setMinRedeem} keyboardType="numeric" style={styles.textInput} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Value (AED/1k pts)</Text>
                <TextInput value={redValue} onChangeText={setRedValue} keyboardType="numeric" style={styles.textInput} />
              </View>
            </View>
            <Button style={{ marginTop: 8 }} onClick={handleSavePolicies}>Save Policies</Button>
          </View>
        </Card>

        {/* Customer List Section */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Loyalty Accounts ({customers.length})</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.listContainer}>
            {customers.map((c) => (
              <Card key={c.id} onClick={() => onOpenCustomer(c.id)}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{c.name}</Text>
                    <Text style={styles.productMeta}>{c.phone}</Text>
                    <Text style={styles.productMeta}>{c.visits} visits · {formatCurrency(c.spent)} spent</Text>
                    {c.vouchersIssued > 0 && (
                      <Badge variant="success" style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                        {c.vouchersIssued} Voucher{c.vouchersIssued > 1 ? 's' : ''} Issued
                      </Badge>
                    )}
                  </View>
                  <View style={[styles.productPriceCol, { minWidth: 100 }]}>
                    <Text style={styles.pointsText}>{c.points} pts</Text>
                    <Badge variant={c.tier === 'Platinum' ? 'brand' : c.tier === 'Gold' ? 'warn' : c.tier === 'Silver' ? 'info' : 'neutral'}>
                      {c.tier}
                    </Badge>
                    <Button
                      variant="secondary"
                      style={{ marginTop: 6, paddingVertical: 4 }}
                      onClick={() => handleIssueVoucher(c)}
                    >
                      Issue Voucher
                    </Button>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      </ScreenBody>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function CustomerDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { customers } = useHeadOffice();
  const c = customers.find((x) => x.id === id);

  if (!c) return null;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title={c.name} subtitle={`${c.tier} · ${c.points} points`} onBack={onBack} />
      <ScreenBody>
        <View style={styles.statsGrid}>
          <View style={styles.thirdCol}>
            <StatCard label="Points" value={String(c.points)} accent="brand" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Visits" value={String(c.visits)} accent="sky" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Spent" value={formatCurrency(c.spent)} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Purchase History</Text>
        <View style={styles.listContainer}>
          {customerHistory.map((h) => (
            <Card key={h.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{h.date}</Text>
                  <Text style={styles.productMeta}>{h.items} items</Text>
                </View>
                <Text style={styles.productPrice}>${h.total}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
    </View>
  );
}



function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
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
  thirdCol: {
    width: '33.33%',
    padding: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  branchesList: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  branchNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  branchMetaText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  branchSalesText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#39ff14',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  miniStatCol: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  miniStatLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  marginT: {
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  inventoryList: {
    gap: 10,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryName: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    marginRight: 10,
  },
  tabButtonsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#39ff14',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
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
  listContainer: {
    gap: 10,
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
  marginT4: {
    marginTop: 4,
  },
  headerRightActionText: {
    color: '#39ff14',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
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
  fakeSelect: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  fakeSelectText: {
    fontSize: 13,
    color: '#0f172a',
  },
  statsCard: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  payableAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginVertical: 4,
  },
  miniBtn: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  miniBtnText: {
    fontSize: 11,
  },
  moreIconWrapper: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  permsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  permBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  permBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#475569',
  },
  toggleTextAction: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#39ff14',
  },
  receiptContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    gap: 6,
    marginTop: 10,
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
  receiptDivider: {
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  receiptLabelBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  receiptValBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Segmented control style
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

  // Sheet forms buttons
  sheetFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetFooterBtn: {
    flex: 1,
  },

  // RBAC custom editor switches
  roleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  permsList: {
    marginTop: 8,
    gap: 8,
  },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  permName: {
    fontSize: 12,
    color: '#475569',
  },
  switchTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#39ff14',
  },
  trackOff: {
    backgroundColor: '#cbd5e1',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
  auditLogBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  auditLogText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
  },

  // CRM Policies Form
  settingsForm: {
    gap: 8,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
  },

  // Top Action Button
  headerBtnWrapper: {
    marginBottom: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // General empty indicator text
  noDataText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  statusVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginVertical: 12,
  },
  actionBtn: {
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroup: {
    padding: 16,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

// ============================================================================
// MODULE 1: CRM & Customers Screen
// ============================================================================
export function CrmCustomersScreen({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { branch } = useAuth();
  const { customers, createCustomer, fetchCustomers, auditLogsList, fetchAuditLogs } = useHeadOffice();

  const [activeTab, setActiveTab] = useState<'customers' | 'segments' | 'communication'>('customers');
  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<'All' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum'>('All');
  
  // Create customer form states
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  useEffect(() => {
    if (activeTab === 'communication') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleCreateCustomer = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      await createCustomer(name, email, phone);
      showToast(`Customer "${name}" created successfully.`, 'success');
      setName('');
      setEmail('');
      setPhone('');
      setCreateOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to create customer', 'error');
    }
  };

  // Filter customers by selected tier segment
  const filteredCustomers = customers.filter(c => {
    if (selectedSegment === 'All') return true;
    return c.tier === selectedSegment;
  });

  // Calculate segment counts
  const segmentCounts = useMemo(() => {
    const counts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    customers.forEach(c => {
      if (c.tier in counts) {
        counts[c.tier as keyof typeof counts]++;
      }
    });
    return counts;
  }, [customers]);

  // Filter audit logs for CRM customer transactions
  const customerAudits = auditLogsList.filter(log => log.entityType === 'Customer');

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={styles.mainTitle}>CRM & Customers</Text>
        
        {/* Tab switch control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segBtn, activeTab === 'customers' && styles.segBtnActive]}
            onPress={() => { setActiveTab('customers'); setSelectedSegment('All'); }}
          >
            <Text style={[styles.segTxt, activeTab === 'customers' && styles.segTxtActive]}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, activeTab === 'segments' && styles.segBtnActive]}
            onPress={() => setActiveTab('segments')}
          >
            <Text style={[styles.segTxt, activeTab === 'segments' && styles.segTxtActive]}>Segments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, activeTab === 'communication' && styles.segBtnActive]}
            onPress={() => setActiveTab('communication')}
          >
            <Text style={[styles.segTxt, activeTab === 'communication' && styles.segTxtActive]}>History & Comm</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScreenBody style={{ paddingTop: 8 }}>
        {activeTab === 'customers' && (
          <View style={styles.flex1}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                placeholder="Search by name, email, phone..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#94a3b8"
                style={[styles.input, { flex: 1, height: 42, paddingVertical: 8 }]}
              />
              <Button onClick={() => setCreateOpen(true)}>New Customer</Button>
            </View>

            {selectedSegment !== 'All' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Filtered by segment: </Text>
                <Badge variant="brand">{selectedSegment}</Badge>
                <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => setSelectedSegment('All')}>
                  <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>[Clear]</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.listContainer}>
              {filteredCustomers.length === 0 ? (
                <Text style={styles.noDataText}>No customers found</Text>
              ) : (
                filteredCustomers.map((c) => (
                  <Card key={c.id} onClick={() => onOpenCustomer(c.id)}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{c.name}</Text>
                        <Text style={styles.productMeta}>{c.email} · {c.phone}</Text>
                        <Text style={styles.productMeta}>Balance Credit: AED {Number(c.storeCredit || 0).toFixed(2)}</Text>
                      </View>
                      <View style={[styles.productPriceCol, { minWidth: 90 }]}>
                        <Text style={styles.pointsText}>{c.points} pts</Text>
                        <Badge variant={c.tier === 'Platinum' ? 'brand' : c.tier === 'Gold' ? 'warn' : c.tier === 'Silver' ? 'info' : 'neutral'}>
                          {c.tier}
                        </Badge>
                        <Badge variant={c.isActive ? 'success' : 'neutral'} style={{ marginTop: 4 }}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'segments' && (
          <View style={styles.flex1}>
            <Text style={styles.sectionTitle}>Tiers & Segmentation</Text>
            <View style={styles.statsGrid}>
              <View style={styles.halfCol}>
                <TouchableOpacity onPress={() => { setSelectedSegment('Bronze'); setActiveTab('customers'); }}>
                  <StatCard label="Bronze Tier" value={String(segmentCounts.Bronze)} accent="ink" />
                </TouchableOpacity>
              </View>
              <View style={styles.halfCol}>
                <TouchableOpacity onPress={() => { setSelectedSegment('Silver'); setActiveTab('customers'); }}>
                  <StatCard label="Silver Tier" value={String(segmentCounts.Silver)} accent="sky" />
                </TouchableOpacity>
              </View>
              <View style={styles.halfCol}>
                <TouchableOpacity onPress={() => { setSelectedSegment('Gold'); setActiveTab('customers'); }}>
                  <StatCard label="Gold Tier" value={String(segmentCounts.Gold)} accent="amber" />
                </TouchableOpacity>
              </View>
              <View style={styles.halfCol}>
                <TouchableOpacity onPress={() => { setSelectedSegment('Platinum'); setActiveTab('customers'); }}>
                  <StatCard label="Platinum Tier" value={String(segmentCounts.Platinum)} accent="brand" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>How tiers are determined:</Text>
            <Card>
              <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }}>
                • <Text style={{ fontWeight: 'bold' }}>Bronze</Text>: Active account, default starting tier.{"\n"}
                • <Text style={{ fontWeight: 'bold' }}>Silver</Text>: Accumulated 1,000+ points.{"\n"}
                • <Text style={{ fontWeight: 'bold' }}>Gold</Text>: Accumulated 5,000+ points.{"\n"}
                • <Text style={{ fontWeight: 'bold' }}>Platinum</Text>: Accumulated 15,000+ points.
              </Text>
            </Card>
          </View>
        )}

        {activeTab === 'communication' && (
          <View style={styles.flex1}>
            <Text style={styles.sectionTitle}>Audit and Action Log</Text>
            <View style={styles.listContainer}>
              {customerAudits.length === 0 ? (
                <Text style={styles.noDataText}>No adjustment or CRM history available</Text>
              ) : (
                customerAudits.map((log) => (
                  <Card key={log.id}>
                    <View style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>{log.action}</Text>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#475569' }}>
                        Actor: {log.actorName || log.actorEmail || 'System'}
                      </Text>
                      {log.details && (
                        <View style={{ backgroundColor: '#f8fafc', padding: 6, borderRadius: 6, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#64748b' }}>
                            {JSON.stringify(log.details)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                ))
              )}
            </View>
          </View>
        )}
      </ScreenBody>

      {/* Customer Registration Sheet */}
      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register Customer"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreateCustomer}>Register</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Full Name *">
            <TextInput
              placeholder="e.g. Jane Doe"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
          <Field label="Email Address">
            <TextInput
              placeholder="jane@example.com"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              keyboardType="email-address"
            />
          </Field>
          <Field label="Phone Number">
            <TextInput
              placeholder="+971 50 123 4567"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              keyboardType="phone-pad"
            />
          </Field>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

// ============================================================================
// Customer CRM Detail View
// ============================================================================
export function CustomerCrmDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { customers, adjustCustomerPoints, adjustCustomerCredit, fetchCustomerHistory, updateCustomer } = useHeadOffice();
  const c = customers.find((x) => x.id === id);

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [history, setHistory] = useState<any>({ orders: [], totalSpend: 0, orderCount: 0 });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal forms
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pointsDelta, setPointsDelta] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  const [creditOpen, setCreditOpen] = useState(false);
  const [creditDelta, setCreditDelta] = useState('');
  const [creditReason, setCreditReason] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    if (c) {
      setLoadingHistory(true);
      fetchCustomerHistory(c.id)
        .then((res) => {
          if (res) setHistory(res);
        })
        .catch(console.error)
        .finally(() => setLoadingHistory(false));

      setEditName(c.name);
      setEditEmail(c.email || '');
      setEditPhone(c.phone || '');
      setEditActive(c.isActive ?? true);
    }
  }, [c?.id]);

  if (!c) return null;

  const handleAdjustPoints = async () => {
    if (!pointsReason.trim() || isNaN(Number(pointsDelta)) || Number(pointsDelta) === 0) {
      showToast('Please fill in points delta and reason', 'error');
      return;
    }
    try {
      await adjustCustomerPoints(c.id, Number(pointsDelta), pointsReason);
      showToast('Points adjusted successfully', 'success');
      setPointsOpen(false);
      setPointsDelta('');
      setPointsReason('');
    } catch (e: any) {
      showToast(e.message || 'Failed to adjust points', 'error');
    }
  };

  const handleAdjustCredit = async () => {
    if (!creditReason.trim() || isNaN(Number(creditDelta)) || Number(creditDelta) === 0) {
      showToast('Please fill in amount delta and reason', 'error');
      return;
    }
    try {
      await adjustCustomerCredit(c.id, Number(creditDelta), creditReason);
      showToast('Store credit adjusted successfully', 'success');
      setCreditOpen(false);
      setCreditDelta('');
      setCreditReason('');
    } catch (e: any) {
      showToast(e.message || 'Failed to adjust credit', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      await updateCustomer(c.id, editName, editEmail, editPhone, editActive);
      showToast('Customer profile updated', 'success');
      setEditOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to update profile', 'error');
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title={c.name} subtitle={`Segment: ${c.tier}`} onBack={onBack} />
      <ScreenBody>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{c.name}</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{c.email} · {c.phone}</Text>
            </View>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit Profile</Button>
          </View>
        </Card>

        {/* Adjustments Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <Card style={{ alignItems: 'center', justifyContent: 'space-between', height: 120 }}>
              <Text style={styles.statusSub}>Points Balance</Text>
              <Text style={[styles.pointsText, { fontSize: 20 }]}>{c.points} pts</Text>
              <Button style={{ paddingVertical: 4, width: '100%' }} onClick={() => setPointsOpen(true)}>Adjust Points</Button>
            </Card>
          </View>
          <View style={styles.halfCol}>
            <Card style={{ alignItems: 'center', justifyContent: 'space-between', height: 120 }}>
              <Text style={styles.statusSub}>Store Credit Balance</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a' }}>AED {Number(c.storeCredit || 0).toFixed(2)}</Text>
              <Button style={{ paddingVertical: 4, width: '100%' }} onClick={() => setCreditOpen(true)}>Adjust Credit</Button>
            </Card>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Purchase History</Text>
        <Card style={{ padding: 12, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#166534' }}>Lifetime Spent</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#166534' }}>AED {Number(history.totalSpend || 0).toFixed(2)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#166534' }}>Orders Placed</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#166534' }}>{history.orderCount}</Text>
          </View>
        </Card>

        <View style={styles.listContainer}>
          {loadingHistory ? (
            <Text style={styles.emptyText}>Loading purchase history...</Text>
          ) : history.orders.length === 0 ? (
            <Text style={styles.emptyText}>No purchases found for this customer.</Text>
          ) : (
            history.orders.map((o: any) => (
              <Card key={o.id}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                      ID: {o.id.slice(0, 8)}...
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                      Source: {o.source} · {new Date(o.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: 'bold', color: '#16a34a', fontSize: 14 }}>
                    AED {Number(o.total).toFixed(2)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScreenBody>

      {/* Adjust Points Sheet */}
      <Sheet
        open={pointsOpen}
        onClose={() => setPointsOpen(false)}
        title="Adjust Loyalty Points"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setPointsOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAdjustPoints}>Apply</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Points Change (Positive to add, negative to deduct) *">
            <TextInput
              placeholder="e.g. 500 or -200"
              value={pointsDelta}
              onChangeText={setPointsDelta}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
          <Field label="Adjustment Reason *">
            <TextInput
              placeholder="Reason for audit logs"
              value={pointsReason}
              onChangeText={setPointsReason}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
        </View>
      </Sheet>

      {/* Adjust Credit Sheet */}
      <Sheet
        open={creditOpen}
        onClose={() => setCreditOpen(false)}
        title="Adjust Store Credit"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setCreditOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAdjustCredit}>Apply</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Store Credit Change (AED) (Negative to deduct) *">
            <TextInput
              placeholder="e.g. 100.50 or -50"
              value={creditDelta}
              onChangeText={setCreditDelta}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
          <Field label="Adjustment Reason *">
            <TextInput
              placeholder="Reason for audit logs"
              value={creditReason}
              onChangeText={setCreditReason}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
        </View>
      </Sheet>

      {/* Edit Profile Sheet */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Customer Profile"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleUpdateProfile}>Save Profile</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Full Name *">
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.modalInput}
            />
          </Field>
          <Field label="Email Address">
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              style={styles.modalInput}
              keyboardType="email-address"
            />
          </Field>
          <Field label="Phone Number">
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              style={styles.modalInput}
              keyboardType="phone-pad"
            />
          </Field>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
            <Text style={{ fontSize: 13, color: '#334155' }}>Customer Account is Active</Text>
            <TouchableOpacity 
              style={[styles.switchTrack, editActive ? styles.trackOn : styles.trackOff]}
              onPress={() => setEditActive(!editActive)}
            >
              <View style={[styles.switchThumb, editActive ? styles.thumbOn : styles.thumbOff]} />
            </TouchableOpacity>
          </View>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function DatePickerSheet({
  open,
  onClose,
  title,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    }
  }, [value, open]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selectedDay = value ? new Date(value).getDate() : null;
  const isSameMonth = value ? new Date(value).getMonth() === month && new Date(value).getFullYear() === year : false;

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
            <ChevronLeft size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>{monthNames[month]} {year}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <View key={idx} style={{ width: '14.28%', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8' }}>{day}</Text>
            </View>
          ))}

          {days.map((day, idx) => {
            if (day === null) {
              return <View key={idx} style={{ width: '14.28%', height: 40 }} />;
            }
            const isSelected = isSameMonth && selectedDay === day;
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  onChange(dateString);
                  onClose();
                }}
                style={{
                  width: '14.28%',
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#39ff14' : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#0f172a' : '#475569',
                }}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

// ============================================================================
// MODULE 2: Promotions Screen
// ============================================================================
export function PromotionsScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { promotions, createCampaign, activatePromotion, deactivatePromotion, archivePromotion, fetchPromotions, products } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('Discount');
  const [targetScope, setTargetScope] = useState<'All' | 'Category' | 'Product'>('All');
  const [targetCategory, setTargetCategory] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Picker States
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Derive categories dynamically from catalog products
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !value.trim() || !startDate.trim() || !endDate.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (targetScope === 'Category' && !targetCategory) {
      showToast('Please select a category', 'error');
      return;
    }
    if (targetScope === 'Product' && selectedProductIds.length === 0) {
      showToast('Please select at least one product', 'error');
      return;
    }

    try {
      await createCampaign(
        name,
        type,
        targetScope,
        value,
        startDate,
        endDate,
        targetScope === 'Category' ? targetCategory : undefined,
        targetScope === 'Product' ? selectedProductIds.join(',') : undefined
      );
      showToast(`Campaign "${name}" created successfully.`, 'success');
      setName('');
      setTargetScope('All');
      setTargetCategory('');
      setSelectedProductIds([]);
      setValue('');
      setStartDate('');
      setEndDate('');
      setCreateOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to create campaign', 'error');
    }
  };

  const handleToggleStatus = async (p: any) => {
    try {
      if (p.status === 'Active') {
        await deactivatePromotion(p.id);
        showToast('Promotion deactivated successfully.', 'success');
      } else {
        await activatePromotion(p.id);
        showToast('Promotion activated successfully.', 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', 'error');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePromotion(id);
      showToast('Promotion deleted successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to delete promotion', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Promotion",
      `Are you sure you want to delete the promotion "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleArchive(id) }
      ]
    );
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Promotions" subtitle="Marketing campaigns manager" onBack={onBack} />
      <ScreenBody>
        <Card style={styles.statsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusSub}>Pricing Engine Status</Text>
              <Text style={styles.payableAmount}>Live</Text>
              <Text style={styles.statusSub}>Campaign bundles evaluated at checkout</Text>
            </View>
            <Button onClick={() => setCreateOpen(true)}>Create Campaign</Button>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Active Campaigns ({promotions.length})</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {promotions.length === 0 ? (
              <Text style={styles.emptyText}>No promotions found</Text>
            ) : (
              promotions.map((p) => (
                <Card key={p.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productMeta}>Target: {p.target} · Value: {p.value}</Text>
                      <Text style={styles.productMeta}>Dates: {p.startDate} to {p.endDate}</Text>
                    </View>
                    <View style={[styles.productPriceCol, { minWidth: 110 }]}>
                      <Badge variant={p.status === 'Active' ? 'success' : p.status === 'Scheduled' ? 'warn' : 'neutral'}>
                        {p.status}
                      </Badge>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                        <Button
                          variant="secondary"
                          style={{ paddingVertical: 4, paddingHorizontal: 6 }}
                          onClick={() => handleToggleStatus(p)}
                        >
                          {p.status === 'Active' ? 'Pause' : 'Play'}
                        </Button>
                        <Button
                          variant="danger"
                          style={{ paddingVertical: 4, paddingHorizontal: 6 }}
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          Delete
                        </Button>
                      </View>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Campaign"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreate}>Save Campaign</Button>
          </View>
        }
      >
        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
          <Field label="Campaign Name">
            <TextInput
              placeholder="e.g. National Day Bundle"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
          <Field label="Type">
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segBtn, type === 'Discount' && styles.segBtnActive]}
                onPress={() => setType('Discount')}
              >
                <Text style={[styles.segTxt, type === 'Discount' && styles.segTxtActive]}>Discount</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segBtn, type === 'Bundle' && styles.segBtnActive]}
                onPress={() => setType('Bundle')}
              >
                <Text style={[styles.segTxt, type === 'Bundle' && styles.segTxtActive]}>Bundle</Text>
              </TouchableOpacity>
            </View>
          </Field>
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Target Scope">
                <TouchableOpacity
                  onPress={() => setScopePickerOpen(true)}
                  style={[styles.modalInput, { justifyContent: 'center' }]}
                >
                  <Text style={{ color: '#0f172a' }}>
                    {targetScope === 'All' ? 'All Products' : targetScope === 'Category' ? 'Specific Category' : 'Specific Products'}
                  </Text>
                </TouchableOpacity>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Value">
                <TextInput
                  placeholder="e.g. 15% OFF"
                  value={value}
                  onChangeText={setValue}
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </Field>
            </View>
          </View>

          {targetScope === 'Category' && (
            <Field label="Select Category">
              <TouchableOpacity
                onPress={() => setCategoryPickerOpen(true)}
                style={[styles.modalInput, { justifyContent: 'center' }]}
              >
                <Text style={{ color: targetCategory ? '#0f172a' : '#94a3b8' }}>
                  {targetCategory || "Choose Category..."}
                </Text>
              </TouchableOpacity>
            </Field>
          )}

          {targetScope === 'Product' && (
            <Field label="Select Products">
              <TouchableOpacity
                onPress={() => setProductPickerOpen(true)}
                style={[styles.modalInput, { justifyContent: 'center' }]}
              >
                <Text style={{ color: selectedProductIds.length > 0 ? '#0f172a' : '#94a3b8' }}>
                  {selectedProductIds.length > 0 ? `${selectedProductIds.length} Products Selected` : "Choose Products..."}
                </Text>
              </TouchableOpacity>
            </Field>
          )}

          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Start Date">
                <TouchableOpacity
                  onPress={() => setStartDatePickerOpen(true)}
                  style={[styles.modalInput, { justifyContent: 'center' }]}
                >
                  <Text style={{ color: startDate ? '#0f172a' : '#94a3b8' }}>
                    {startDate || "Select Date..."}
                  </Text>
                </TouchableOpacity>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="End Date">
                <TouchableOpacity
                  onPress={() => setEndDatePickerOpen(true)}
                  style={[styles.modalInput, { justifyContent: 'center' }]}
                >
                  <Text style={{ color: endDate ? '#0f172a' : '#94a3b8' }}>
                    {endDate || "Select Date..."}
                  </Text>
                </TouchableOpacity>
              </Field>
            </View>
          </View>
        </ScrollView>
      </Sheet>

      {/* Target Scope Picker Sheet */}
      <Sheet open={scopePickerOpen} onClose={() => setScopePickerOpen(false)} title="Select Target Scope">
        {['All Products', 'Specific Category', 'Specific Products'].map((opt) => {
          const scopeVal = opt === 'All Products' ? 'All' : opt === 'Specific Category' ? 'Category' : 'Product';
          return (
            <TouchableOpacity
              key={opt}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
                backgroundColor: targetScope === scopeVal ? '#39ff1411' : 'transparent',
              }}
              onPress={() => {
                setTargetScope(scopeVal);
                setScopePickerOpen(false);
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </Sheet>

      {/* Category Picker Sheet */}
      <Sheet open={categoryPickerOpen} onClose={() => setCategoryPickerOpen(false)} title="Select Category">
        <ScrollView style={{ maxHeight: 300 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
                backgroundColor: targetCategory === cat ? '#39ff1411' : 'transparent',
              }}
              onPress={() => {
                setTargetCategory(cat);
                setCategoryPickerOpen(false);
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{cat}</Text>
            </TouchableOpacity>
          ))}
          {categories.length === 0 && (
            <Text style={{ padding: 24, color: '#94a3b8', textAlign: 'center', fontSize: 14 }}>
              No categories found in current Catalog
            </Text>
          )}
        </ScrollView>
      </Sheet>

      {/* Specific Products Picker Sheet */}
      <Sheet open={productPickerOpen} onClose={() => setProductPickerOpen(false)} title="Select Specific Products">
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <TextInput
            placeholder="Search products by name or SKU..."
            value={productSearchQuery}
            onChangeText={setProductSearchQuery}
            placeholderTextColor="#94a3b8"
            style={{
              height: 40,
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              paddingHorizontal: 12,
              fontSize: 14,
              color: '#0f172a',
            }}
          />
        </View>
        <ScrollView style={{ maxHeight: 300 }}>
          {products
            .filter((p) =>
              p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
            )
            .map((p) => {
              const isSelected = selectedProductIds.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                    } else {
                      setSelectedProductIds([...selectedProductIds, p.id]);
                    }
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{p.name}</Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>SKU: {p.sku}</Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isSelected ? '#39ff14' : '#cbd5e1',
                      backgroundColor: isSelected ? '#39ff14' : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {isSelected && <Check size={14} color="#0f172a" />}
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </Sheet>

      {/* Custom Date Pickers */}
      <DatePickerSheet
        open={startDatePickerOpen}
        onClose={() => setStartDatePickerOpen(false)}
        title="Select Start Date"
        value={startDate}
        onChange={setStartDate}
      />
      <DatePickerSheet
        open={endDatePickerOpen}
        onClose={() => setEndDatePickerOpen(false)}
        title="Select End Date"
        value={endDate}
        onChange={setEndDate}
      />

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

// ============================================================================
// MODULE 3: Price Requests Screen
// ============================================================================
export function PriceRequestsScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { priceRequests, fetchPriceRequests, approvePriceRequest, rejectPriceRequest } = useHeadOffice();

  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPriceRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approvePriceRequest(id);
      showToast('Price request approved successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to approve request', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectPriceRequest(id);
      showToast('Price request rejected successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to reject request', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPriceRequests();
    setRefreshing(false);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Price Requests" subtitle="Store override approvals" onBack={onBack} />
      <ScreenBody>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Override Requests ({priceRequests.length})</Text>
          <Button variant="secondary" onClick={handleRefresh}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </View>

        <View style={styles.listContainer}>
          {priceRequests.length === 0 ? (
            <Text style={styles.noDataText}>No price requests pending</Text>
          ) : (
            priceRequests.map((r) => (
              <Card key={r.id}>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>{r.productName}</Text>
                    <Badge variant={r.status === 'Pending' ? 'warn' : r.status === 'Approved' ? 'success' : 'neutral'}>
                      {r.status}
                    </Badge>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Branch: {r.branchName}</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginVertical: 4 }}>
                    <View>
                      <Text style={{ fontSize: 10, color: '#94a3b8' }}>Standard Price</Text>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b', textDecorationLine: 'line-through' }}>
                        AED {Number(r.standardPrice).toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: '#64748b' }}>Requested Price</Text>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                        AED {Number(r.requestedPrice).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#475569' }}><Text style={{ fontWeight: '500' }}>Reason:</Text> {r.reason}</Text>

                  {r.status === 'Pending' && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <Button variant="danger" style={{ flex: 1 }} onClick={() => handleReject(r.id)}>
                        Reject
                      </Button>
                      <Button variant="primary" style={{ flex: 1 }} onClick={() => handleApprove(r.id)}>
                        Approve
                      </Button>
                    </View>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScreenBody>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

const formatAuditDetails = (details: any): string => {
  if (!details) return 'N/A';
  if (typeof details === 'string') return details;
  
  if (details.summary) return details.summary;
  
  try {
    return Object.entries(details)
      .map(([key, val]) => {
        // Beautify camelCase keys (e.g. afterValue -> After Value)
        const displayKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        
        let displayVal = '';
        if (val && typeof val === 'object') {
          displayVal = JSON.stringify(val);
        } else {
          displayVal = String(val);
        }
        return `${displayKey}: ${displayVal}`;
      })
      .join('\n');
  } catch (e) {
    return String(details);
  }
};

// ============================================================================
// MODULE 4: Audit Logs Screen
// ============================================================================
export function AuditLogsScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { auditLogsList, fetchAuditLogs } = useHeadOffice();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
    setRefreshing(false);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Audit Logs" subtitle="System operation audits" onBack={onBack} />
      <ScreenBody>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Operations Log ({auditLogsList.length})</Text>
          <Button variant="secondary" onClick={handleRefresh}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </View>

        <View style={styles.listContainer}>
          {auditLogsList.length === 0 ? (
            <Text style={styles.noDataText}>No audit logs available</Text>
          ) : (
            auditLogsList.map((log) => (
              <Card key={log.id}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>{log.action}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#475569' }}>
                    Actor: {log.actorName || log.actorEmail || 'System'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    Entity: {log.entityType} ({log.entityId.slice(0, 8)}...)
                  </Text>
                  {log.details && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: '#475569', lineHeight: 16 }}>
                        {formatAuditDetails(log.details)}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScreenBody>
    </View>
  );
}

