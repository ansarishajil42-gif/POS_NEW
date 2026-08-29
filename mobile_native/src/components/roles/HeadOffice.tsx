import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, Modal, Keyboard } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useHeadOffice, PurchaseItem, RoleConfig, Customer, Promotion } from '../../lib/HeadOfficeContext';
import {
  products,
  customerHistory
} from '../../lib/mockData';
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
  X
} from 'lucide-react-native';

export function HeadOfficeHome() {
  const { branch } = useAuth();
  const { branches, purchases } = useHeadOffice();

  const totalSales = branches.reduce((a, b) => a + b.salesToday, 0);
  const totalAlerts = branches.reduce((a, b) => a + b.stockAlerts, 0);

  // Dynamic totals based on HeadOfficeContext
  const openPoValue = purchases.filter(p => p.stage === 'PO').reduce((s, p) => s + p.value, 0);
  const totalTills = branches.reduce((a, b) => a + b.tills, 0);

  const handleExportBrief = () => {
    Alert.alert('Export Successful', 'Daily Brief has been compiled and downloaded as a CSV audit file.');
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
    </View>
  );
}

export function HeadOfficeOutlets({ onOpen }: { onOpen: (id: string) => void }) {
  const { branch } = useAuth();
  const { branches, addBranch, updateBranch, deleteBranch } = useHeadOffice();
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save branch.');
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
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete branch.');
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
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete product.');
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save product.');
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

  const handleSettleInvoice = (inv: any) => {
    showToast(`Invoice ${inv.id} marked as settled`, 'success');
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
                          <Button variant="secondary" style={styles.miniBtn} onClick={() => handleSettleInvoice(inv)}>
                            Settle AP
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
                      <Badge variant={statusVariant(invoiceDetail.status)} text={invoiceDetail.status.toUpperCase()} />
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
                  <Button variant="secondary" onClick={() => showToast('PDF Download coming soon', 'success')}>Download PDF</Button>
                  <Button variant="secondary" onClick={() => showToast('Printing coming soon', 'success')}>Print Invoice</Button>
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
                <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: '#94a3b8' }]} value={activePo?.po?.branch?.name || branch?.name || 'Head Office'} editable={false} />
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
                <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: '#94a3b8' }]} value={activeConvertItem?.grn?.purchaseOrder?.branch?.name || branch?.name || 'Head Office'} editable={false} />
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
  const { roles, togglePermission } = useHeadOffice();

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Staff & Roles" subtitle="RBAC permissions editor" onBack={onBack} />
      <ScreenBody>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {roles.map((r) => (
              <Card key={r.role} style={styles.marginT}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.roleTitle}>{r.role}</Text>
                  <Badge variant="brand">{r.users} users</Badge>
                </View>
                <View style={styles.permsList}>
                  {r.perms.map((p) => (
                    <View key={p.name} style={styles.permRow}>
                      <Text style={styles.permName}>{p.name}</Text>
                      <TouchableOpacity
                        onPress={() => togglePermission(r.role, p.name)}
                        style={[
                          styles.switchTrack,
                          p.enabled ? styles.trackOn : styles.trackOff
                        ]}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.switchThumb,
                          p.enabled ? styles.thumbOn : styles.thumbOff
                        ]} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
          <View style={styles.auditLogBanner}>
            <ShieldCheck size={14} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={styles.auditLogText}>Every permission change is written to an immutable audit log.</Text>
          </View>
        </ScrollView>
      </ScreenBody>
    </View>
  );
}

export function VatScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const [inclusive, setInclusive] = useState(true);

  const handleDownloadSummary = () => {
    Alert.alert('Filing Saved', 'Q3 2026 FTA tax summary file has been saved to your downloads folder.');
  };

  const handleDownloadZReport = () => {
    Alert.alert('Download Complete', 'Audit-ready Z-Reports bundle has been generated.');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="VAT Compliance" subtitle="FTA-ready reports (download only)" onBack={onBack} />
      <ScreenBody>
        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Sample Tax Invoice</Text>
            <TouchableOpacity onPress={() => setInclusive(!inclusive)}>
              <Text style={styles.toggleTextAction}>{inclusive ? 'VAT Inclusive' : 'VAT Exclusive'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptLine}><Text style={styles.receiptLabel}>TRN</Text><Text style={styles.receiptVal}>100123456700003</Text></View>
            <View style={styles.receiptLine}><Text style={styles.receiptLabel}>Invoice #</Text><Text style={styles.receiptVal}>RCP-50421</Text></View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptLine}><Text style={styles.receiptLabel}>Subtotal</Text><Text style={styles.receiptVal}>$82.38</Text></View>
            <View style={styles.receiptLine}><Text style={styles.receiptLabel}>VAT (5%)</Text><Text style={styles.receiptVal}>$4.12</Text></View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptLine}><Text style={styles.receiptLabelBold}>Total</Text><Text style={styles.receiptValBold}>$86.50</Text></View>
          </View>
        </Card>

        {/* Read-Only FTA Card */}
        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>FTA Filing Summary (Q3 2026)</Text>
          <View style={styles.inventoryList}>
            <DetailRow label="Standard-rated supplies" value="$248,400" />
            <DetailRow label="Output VAT" value="$12,420" />
            <DetailRow label="Input VAT" value="$4,180" />
            <DetailRow label="Net VAT payable" value="$8,240" />
          </View>
        </Card>

        {/* Action Downloads Row */}
        <View style={styles.actionsGrid}>
          <View style={styles.halfCol}>
            <Button variant="secondary" style={styles.actionBtn} onClick={handleDownloadZReport}>
              Download Z-Reports
            </Button>
          </View>
          <View style={styles.halfCol}>
            <Button variant="primary" style={styles.actionBtn} onClick={handleDownloadSummary}>
              Download FTA Summary
            </Button>
          </View>
        </View>
      </ScreenBody>
    </View>
  );
}

export function CrmScreen({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { branch } = useAuth();
  const { customers, loyaltyPolicies, updateLoyaltyPolicies, issueVoucher } = useHeadOffice();

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
    Alert.alert('Success', 'Loyalty policies updated successfully.');
  };

  const handleIssueVoucher = (c: Customer) => {
    issueVoucher(c.id);
    Alert.alert('Voucher Issued', `A voucher code has been dispatched to ${c.name}.`);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Customer Loyalty</Text>

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

export function PromotionsScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { promotions, createCampaign } = useHeadOffice();
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('Discount');
  const [target, setTarget] = useState('');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !target.trim() || !value.trim() || !startDate.trim() || !endDate.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    createCampaign(name, type, target, value, startDate, endDate);
    Alert.alert('Success', `Campaign "${name}" created successfully.`);
    setName('');
    setTarget('');
    setValue('');
    setStartDate('');
    setEndDate('');
    setCreateOpen(false);
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
            {promotions.map((p) => (
              <Card key={p.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productMeta}>Target: {p.target} · Value: {p.value}</Text>
                    <Text style={styles.productMeta}>Dates: {p.startDate} to {p.endDate}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Badge variant={p.status === 'Active' ? 'success' : p.status === 'Scheduled' ? 'warn' : 'neutral'}>
                      {p.status}
                    </Badge>
                    <Badge variant="neutral" style={{ marginTop: 4 }}>{p.type}</Badge>
                  </View>
                </View>
              </Card>
            ))}
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
        <View style={styles.modalForm}>
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
              <Field label="Target">
                <TextInput
                  placeholder="e.g. Beverages"
                  value={target}
                  onChangeText={setTarget}
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
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
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Start Date">
                <TextInput
                  placeholder="2026-08-18"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="End Date">
                <TextInput
                  placeholder="2026-08-31"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </Field>
            </View>
          </View>
        </View>
      </Sheet>
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
