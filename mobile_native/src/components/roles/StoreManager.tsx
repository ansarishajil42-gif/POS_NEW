import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useStoreManager, RosterStaff, PricingRequest } from '../../lib/StoreManagerContext';
import { products, transfers, reports } from '../../lib/mockData';
import Svg, { Rect, Path } from 'react-native-svg';
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
  Settings,
  Clock,
  CheckCircle2,
  Ban,
  Trash2,
  Edit
} from 'lucide-react-native';

export function StoreManagerHome() {
  const { branch } = useAuth();
  const { staff } = useStoreManager();

  const handleExportZReport = () => {
    Alert.alert('Export Successful', 'Daily Z-Report CSV sheet compiled and downloaded.');
  };

  const activeStaffCount = staff.filter((s) => s.shift === 'open').length;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        {/* Export Z-Report Action */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={handleExportZReport} style={styles.headerBtn}>
            <Download size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Export Z-Report
          </Button>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Sales Today" value="$18.4k" icon={<DollarSign size={16} color="#39ff14" />} accent="brand" trend={{ dir: 'up', value: '6%' }} />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Footfall" value="1,240" icon={<Users size={16} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Active Tills" value="4 / 4" icon={<Boxes size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Staff On Shift" value={String(activeStaffCount)} icon={<Users size={16} color="#475569" />} accent="ink" />
          </View>
        </View>

        {/* Weekly sales SVG bar chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>This Week</Text>
          <View style={styles.svgWrapper}>
            <Svg width="100%" height={120} viewBox="0 0 340 120" preserveAspectRatio="none">
              {/* Grid Lines */}
              <Path d="M0,30 L340,30 M0,60 L340,60 M0,90 L340,90" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              {/* Draw Weekly Bars */}
              <Rect x="20" y="80" width="18" height="40" rx="3" fill="#39ff14" />
              <Rect x="65" y="83" width="18" height="37" rx="3" fill="#39ff14" />
              <Rect x="110" y="75" width="18" height="45" rx="3" fill="#39ff14" />
              <Rect x="155" y="65" width="18" height="55" rx="3" fill="#39ff14" />
              <Rect x="200" y="55" width="18" height="65" rx="3" fill="#39ff14" />
              <Rect x="245" y="45" width="18" height="75" rx="3" fill="#39ff14" />
              <Rect x="290" y="60" width="18" height="60" rx="3" fill="#39ff14" />
            </Svg>
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabelText}>M</Text>
            <Text style={styles.chartLabelText}>T</Text>
            <Text style={styles.chartLabelText}>W</Text>
            <Text style={styles.chartLabelText}>T</Text>
            <Text style={styles.chartLabelText}>F</Text>
            <Text style={styles.chartLabelText}>S</Text>
            <Text style={styles.chartLabelText}>S</Text>
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

export function StoreManagerStaff() {
  const { branch } = useAuth();
  const { staff, addStaff } = useStoreManager();
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Cashier');
  const [till, setTill] = useState('Till 01');
  const [time, setTime] = useState('08:00 - 16:00');
  const [status, setStatus] = useState<'open' | 'closed' | 'upcoming'>('open');

  const handleAddRoster = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter staff name');
      return;
    }
    const permissions = role === 'Supervisor' ? 'Supervisor' : role === 'Stock Clerk' ? 'Inventory' : 'Cashier';
    addStaff(name, role, till || '—', time, status, permissions);
    Alert.alert('Success', `Employee ${name} added to roster.`);
    setName('');
    setTill('Till 01');
    setTime('08:00 - 16:00');
    setRole('Cashier');
    setStatus('open');
    setAddStaffOpen(false);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        {/* Add Staff Action */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={() => setAddStaffOpen(true)} style={styles.headerBtn}>
            <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Add Staff to Roster
          </Button>
        </View>

        <Text style={styles.mainTitle}>Staff Roster</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {staff.map((s) => (
              <Card key={s.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.staffItemLeft}>
                    <View style={styles.staffInitialCircle}>
                      <Text style={styles.staffInitialText}>{s.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.staffName}>{s.name}</Text>
                      <Text style={styles.staffMeta}>{s.role} · {s.till} · {s.time}</Text>
                    </View>
                  </View>
                  <View style={styles.staffItemRight}>
                    <Badge variant={s.shift === 'open' ? 'success' : s.shift === 'upcoming' ? 'warn' : 'neutral'}>
                      {s.shift === 'open' ? 'On shift' : s.shift === 'upcoming' ? 'Upcoming' : 'Off'}
                    </Badge>
                    <Text style={styles.staffPerms}>{s.permissions}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* Roster Add Staff Sheet */}
      <Sheet
        open={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        title="Add Staff to Roster"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAddStaffOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAddRoster}>Add Staff</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Staff Name">
            <TextInput placeholder="e.g. Rahul S." value={name} onChangeText={setName} style={styles.modalInput} placeholderTextColor="#94a3b8" />
          </Field>
          <Field label="Role">
            <View style={styles.segmentedControl}>
              <TouchableOpacity style={[styles.segBtn, role === 'Cashier' && styles.segBtnActive]} onPress={() => setRole('Cashier')}>
                <Text style={[styles.segTxt, role === 'Cashier' && styles.segTxtActive]}>Cashier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segBtn, role === 'Supervisor' && styles.segBtnActive]} onPress={() => setRole('Supervisor')}>
                <Text style={[styles.segTxt, role === 'Supervisor' && styles.segTxtActive]}>Supervisor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segBtn, role === 'Stock Clerk' && styles.segBtnActive]} onPress={() => setRole('Stock Clerk')}>
                <Text style={[styles.segTxt, role === 'Stock Clerk' && styles.segTxtActive]}>Clerk</Text>
              </TouchableOpacity>
            </View>
          </Field>
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Till Assignment">
                <TextInput placeholder="e.g. Till 01" value={till} onChangeText={setTill} style={styles.modalInput} placeholderTextColor="#94a3b8" />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Shift Hours">
                <TextInput placeholder="08:00 - 16:00" value={time} onChangeText={setTime} style={styles.modalInput} placeholderTextColor="#94a3b8" />
              </Field>
            </View>
          </View>
          <Field label="Shift Status">
            <View style={styles.segmentedControl}>
              <TouchableOpacity style={[styles.segBtn, status === 'open' && styles.segBtnActive]} onPress={() => setStatus('open')}>
                <Text style={[styles.segTxt, status === 'open' && styles.segTxtActive]}>On Shift</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segBtn, status === 'upcoming' && styles.segBtnActive]} onPress={() => setStatus('upcoming')}>
                <Text style={[styles.segTxt, status === 'upcoming' && styles.segTxtActive]}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segBtn, status === 'closed' && styles.segBtnActive]} onPress={() => setStatus('closed')}>
                <Text style={[styles.segTxt, status === 'closed' && styles.segTxtActive]}>Off Shift</Text>
              </TouchableOpacity>
            </View>
          </Field>
        </View>
      </Sheet>
    </View>
  );
}

export function StoreManagerStock() {
  const { branch } = useAuth();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Dairy', 'Dry Goods', 'Grains', 'Meat', 'Produce', 'Beverages', 'Pantry'];

  const lowStock = products.filter((p) => p.stock < 10);

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Stock</Text>

        <Card style={styles.lowStockWarningCard}>
          <View style={styles.flexRow}>
            <AlertTriangle size={15} color="#d97706" />
            <Text style={styles.lowStockWarningText}>{lowStock.length} low-stock items in branch catalog</Text>
          </View>
        </Card>

        {/* Search and Filters */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search SKU or scan barcode..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        {/* Category Scroll Filter */}
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
              <Card key={p.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productMeta}>{p.sku} · {p.category}</Text>
                  </View>
                  <Badge variant={p.stock < 10 ? 'warn' : 'success'}>
                    {p.stock} {p.unit}
                  </Badge>
                </View>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <Text style={styles.noDataText}>No products match your search or filter.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}><ArrowUpDown size={13} color="#475569" style={styles.sectionIcon} /> Transfer Requests</Text>
          <View style={[styles.listContainer, { marginBottom: 24 }]}>
            {transfers.map((t) => (
              <Card key={t.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{t.item}</Text>
                    <Text style={styles.productMeta}>{t.from} → {t.to} · {t.date}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Text style={styles.productPrice}>{t.qty}</Text>
                    <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
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

export function StoreManagerPricing() {
  const { branch } = useAuth();
  const { pricingRequests, addPricingRequest, editPricingRequest, deletePricingRequest } = useStoreManager();

  // Dialog/Modal states
  const [requestOpen, setRequestOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<PricingRequest | null>(null);

  // Form states - Request Override
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reqPrice, setReqPrice] = useState('');
  const [stdPrice, setStdPrice] = useState('0');

  // Form states - Edit Override
  const [editPriceVal, setEditPriceVal] = useState('');

  const handleRequestOverride = () => {
    if (!selectedProductId) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const requestedVal = parseFloat(reqPrice);
    if (isNaN(requestedVal) || requestedVal <= 0) {
      Alert.alert('Error', 'Please enter a valid requested price');
      return;
    }

    addPricingRequest(product.name, product.price, requestedVal);
    Alert.alert('Requested', `Price override requested for ${product.name}.`);
    setSelectedProductId('');
    setReqPrice('');
    setStdPrice('0');
    setRequestOpen(false);
  };

  const handleEditRequest = () => {
    if (!activeRequest) return;
    const requestedVal = parseFloat(editPriceVal);
    if (isNaN(requestedVal) || requestedVal <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    editPricingRequest(activeRequest.id, requestedVal);
    Alert.alert('Updated', 'Price override request has been updated.');
    setEditPriceVal('');
    setActiveRequest(null);
    setEditOpen(false);
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
          onPress: () => {
            deletePricingRequest(pr.id);
            Alert.alert('Cancelled', 'Override request removed.');
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
            if (products.length > 0) {
              setSelectedProductId(products[0].id);
              setStdPrice(String(products[0].price));
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
                    <Text style={styles.productMeta}>Standard: ${pr.standardPrice.toFixed(2)} · Requested: ${pr.requestedPrice.toFixed(2)}</Text>
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
                      <Text style={[styles.priceActionBtnText, { color: '#ef4444' }]}>Delete</Text>
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
      <Sheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request Price Override"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleRequestOverride}>Request</Button>
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
                    onPress={() => {
                      setSelectedProductId(p.id);
                      setStdPrice(String(p.price));
                    }}
                  >
                    <Text style={[styles.pickerItemText, selectedProductId === p.id && styles.pickerItemTextActive]}>
                      {p.name} (${p.price.toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Field>
          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Standard Price ($)">
                <TextInput value={stdPrice} editable={false} style={[styles.modalInput, { backgroundColor: '#f1f5f9' }]} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Requested Price ($)">
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
        </View>
      </Sheet>

      {/* EDIT OVERRIDE SHEET */}
      <Sheet
        open={editOpen}
        onClose={() => {
          setActiveRequest(null);
          setEditOpen(false);
        }}
        title="Edit Requested Price"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => {
              setActiveRequest(null);
              setEditOpen(false);
            }}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleEditRequest}>Save</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {activeRequest && (
            <>
              <Field label="Product">
                <Text style={styles.productName}>{activeRequest.productName}</Text>
              </Field>
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="Standard Price ($)">
                    <Text style={styles.staffName}>${activeRequest.standardPrice.toFixed(2)}</Text>
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Requested Price ($)">
                    <TextInput
                      value={editPriceVal}
                      onChangeText={setEditPriceVal}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </Field>
                </View>
              </View>
            </>
          )}
        </View>
      </Sheet>
    </View>
  );
}

export function StoreManagerReports() {
  const { branch } = useAuth();
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Reports</Text>
        <View style={styles.listContainer}>
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
                  <View style={styles.reportBadgesRow}>
                    <Badge variant="neutral">Cash ${r.cash}</Badge>
                    <Badge variant="info">Card ${r.card}</Badge>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
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
  thirdCol: {
    width: '33.33%',
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
  svgWrapper: {
    height: 120,
    marginTop: 8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  chartLabelText: {
    fontSize: 9,
    color: '#94a3b8',
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
    color: '#39ff14',
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
  staffPerms: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
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
  reportBadgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },

  // Roster Add Form Styling
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
  sheetFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetFooterBtn: {
    flex: 1,
  },

  // Stock Filter styling
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

  // Pricing styling
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
});
