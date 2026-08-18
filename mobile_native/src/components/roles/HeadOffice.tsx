import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useHeadOffice, PurchaseItem, RoleConfig, Customer, Promotion } from '../../lib/HeadOfficeContext';
import {
  branches,
  products,
  batches,
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
  Download
} from 'lucide-react-native';

export function HeadOfficeHome() {
  const { branch } = useAuth();
  const { purchases } = useHeadOffice();

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
            <StatCard label="Sales Today" value={`$${(totalSales / 1000).toFixed(1)}k`} icon={<Store size={16} color="#39ff14" />} accent="brand" trend={{ dir: 'up', value: '6%' }} />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Stock Alerts" value={String(totalAlerts)} icon={<AlertTriangle size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Open POs Value" value={`$${(openPoValue / 1000).toFixed(1)}k`} icon={<ShoppingCart size={16} color="#0284c7" />} accent="sky" />
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
                <Text style={styles.branchSalesText}>${b.salesToday.toLocaleString()}</Text>
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
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Outlets</Text>
        <View style={styles.branchesList}>
          {branches.map((b) => (
            <Card key={b.id} onClick={() => onOpen(b.id)}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.branchNameText}>{b.name}</Text>
                  <Text style={styles.branchMetaText}>{b.tills} tills · {b.staff} staff</Text>
                </View>
                <Store size={18} color="#cbd5e1" />
              </View>
              <View style={styles.miniStatsRow}>
                <View style={styles.miniStatCol}><Text style={styles.miniStatValue}>${(b.salesToday / 1000).toFixed(1)}k</Text><Text style={styles.miniStatLabel}>Sales</Text></View>
                <View style={styles.miniStatCol}><Text style={styles.miniStatValue}>{b.stockAlerts}</Text><Text style={styles.miniStatLabel}>Alerts</Text></View>
                <View style={styles.miniStatCol}><Text style={styles.miniStatValue}>{b.tills}</Text><Text style={styles.miniStatLabel}>Tills</Text></View>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
    </View>
  );
}

export function OutletDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const b = branches.find((x) => x.id === id)!;
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title={b.name} subtitle="Branch detail" onBack={onBack} />
      <ScreenBody>
        <View style={styles.statsGrid}>
          <View style={styles.thirdCol}>
            <StatCard label="Sales Today" value={`$${(b.salesToday / 1000).toFixed(1)}k`} accent="brand" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Staff" value={String(b.staff)} accent="sky" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Tills" value={String(b.tills)} accent="brand" />
          </View>
        </View>

        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Local Inventory (sample)</Text>
          <View style={styles.inventoryList}>
            {products.slice(0, 4).map((p) => (
              <View key={p.id} style={styles.inventoryRow}>
                <Text style={styles.inventoryName} numberOfLines={1}>{p.name}</Text>
                <Badge variant={p.stock < 10 ? 'warn' : 'success'}>{p.stock} {p.unit}</Badge>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Staff</Text>
          <View style={styles.inventoryList}>
            <View style={styles.inventoryRow}>
              <Text style={styles.inventoryName}>Ahmed Khalil</Text>
              <Badge variant="success">Cashier</Badge>
            </View>
            <View style={styles.inventoryRow}>
              <Text style={styles.inventoryName}>Sara Mohammed</Text>
              <Badge variant="brand">Supervisor</Badge>
            </View>
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

export function HeadOfficeCatalog({ onOpenProduct }: { onOpenProduct: (id: string) => void }) {
  const { branch } = useAuth();
  const [tab, setTab] = useState<'catalog' | 'batches'>('catalog');
  const [q, setQ] = useState('');
  
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
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
                <Card key={p.id} onClick={() => onOpenProduct(p.id)}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.productMeta}>{p.sku} · {p.barcode} · {p.category}</Text>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={styles.productPrice}>${p.price}</Text>
                      <Badge variant={p.stock < 10 ? 'warn' : 'success'}>{p.stock} {p.unit}</Badge>
                    </View>
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
                  <View>
                    <Text style={styles.productName}>{b.product}</Text>
                    <Text style={styles.productMeta}>{b.batch} · qty {b.qty}</Text>
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
    </View>
  );
}

export function ProductDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const p = products.find((x) => x.id === id)!;
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(p.price));
  
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader
        title={p.name}
        subtitle={p.sku}
        onBack={onBack}
        right={
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.headerRightActionText}>Edit</Text>
          </TouchableOpacity>
        }
      />
      <ScreenBody>
        <Card>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.statusSub}>Price</Text>
              <Text style={styles.priceText}>${p.price}</Text>
            </View>
            <Badge variant={p.stock < 10 ? 'warn' : 'success'}>{p.stock} {p.unit} in stock</Badge>
          </View>
        </Card>
        
        <Card style={styles.marginT}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.inventoryList}>
            <DetailRow label="SKU" value={p.sku} />
            <DetailRow label="Barcode" value={p.barcode} />
            <DetailRow label="Category" value={p.category} />
            <DetailRow label="Unit" value={p.unit} />
          </View>
        </Card>
      </ScreenBody>

      {/* Edit Modal Drawer */}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit product" footer={<Button full onClick={() => setEditing(false)}>Save</Button>}>
        <View style={styles.modalForm}>
          <Field label="Price">
            <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.modalInput} />
          </Field>
          <Field label="Unit">
            <View style={styles.fakeSelect}><Text style={styles.fakeSelectText}>{p.unit}</Text></View>
          </Field>
        </View>
      </Sheet>
    </View>
  );
}

export function HeadOfficePurchasing() {
  const { branch } = useAuth();
  const { purchases, createPurchaseOrder, recordGRN, convertToInvoice } = useHeadOffice();

  const [step, setStep] = useState<'po' | 'grn' | 'invoice'>('po');
  const [poOpen, setPoOpen] = useState(false);

  // Form states
  const [vendorName, setVendorName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  const stepPurchases = purchases.filter((p) => p.stage.toLowerCase() === step);
  const totalPayable = purchases.filter((p) => p.stage === 'Invoice').reduce((s, p) => s + p.value, 0);

  const handleCreatePO = () => {
    if (!vendorName.trim() || !estimatedValue.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const val = parseFloat(estimatedValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid estimated value');
      return;
    }
    createPurchaseOrder(vendorName, val);
    Alert.alert('Success', `Purchase Order created successfully`);
    setVendorName('');
    setEstimatedValue('');
    setPoOpen(false);
  };

  const handleRecordGRN = (item: PurchaseItem) => {
    recordGRN(item.id);
    Alert.alert('GRN Created', `${item.id} received successfully. GRN registered.`);
  };

  const handleConvertInvoice = (item: PurchaseItem) => {
    convertToInvoice(item.id);
    Alert.alert('Invoice Saved', `${item.id} converted to Vendor Invoice.`);
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody>
        {/* Create PO Action Header Button */}
        <View style={styles.headerBtnWrapper}>
          <Button full variant="primary" onClick={() => setPoOpen(true)} style={styles.headerBtn}>
            <Plus size={16} color="#0f172a" style={{ marginRight: 8 }} />
            Create New PO
          </Button>
        </View>

        <View style={styles.tabButtonsRow}>
          <TouchableOpacity onPress={() => setStep('po')} style={[styles.tabBtn, step === 'po' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, step === 'po' && styles.tabBtnTextActive]}>1. POs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('grn')} style={[styles.tabBtn, step === 'grn' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, step === 'grn' && styles.tabBtnTextActive]}>2. GRNs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('invoice')} style={[styles.tabBtn, step === 'invoice' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, step === 'invoice' && styles.tabBtnTextActive]}>3. Invoices</Text>
          </TouchableOpacity>
        </View>

        {step === 'po' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              {stepPurchases.map((po) => (
                <Card key={po.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{po.id}</Text>
                      <Text style={styles.productMeta}>{po.vendor} · {po.date}</Text>
                    </View>
                    <View style={[styles.productPriceCol, { minWidth: 100 }]}>
                      <Text style={styles.productPrice}>${po.value.toLocaleString()}</Text>
                      <Button variant="secondary" style={styles.miniBtn} onClick={() => handleRecordGRN(po)}>
                        Record GRN
                      </Button>
                    </View>
                  </View>
                </Card>
              ))}
              {stepPurchases.length === 0 && (
                <Text style={styles.noDataText}>No outstanding purchase orders.</Text>
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
                      <Text style={styles.productName}>{g.id}</Text>
                      <Text style={styles.productMeta}>{g.vendor} · {g.date}</Text>
                      {g.variance && (
                        <Badge variant="error" style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                          {g.variance}
                        </Badge>
                      )}
                    </View>
                    <View style={[styles.productPriceCol, { minWidth: 100 }]}>
                      <Text style={styles.productPrice}>${g.value.toLocaleString()}</Text>
                      <Button variant="secondary" style={styles.miniBtn} onClick={() => handleConvertInvoice(g)}>
                        Convert
                      </Button>
                    </View>
                  </View>
                </Card>
              ))}
              {stepPurchases.length === 0 && (
                <Text style={styles.noDataText}>No pending goods received logs.</Text>
              )}
            </View>
          </ScrollView>
        )}

        {step === 'invoice' && (
          <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
            <View style={styles.listContainer}>
              <Card style={styles.statsCard}>
                <View>
                  <Text style={styles.statusSub}>Accounts Payable Outstanding</Text>
                  <Text style={styles.payableAmount}>${totalPayable.toLocaleString()}</Text>
                  <Text style={styles.statusSub}>Due platform-wide within 7 days</Text>
                </View>
              </Card>
              <View style={styles.marginT}>
                {stepPurchases.map((inv) => (
                  <Card key={inv.id} style={{ marginBottom: 8 }}>
                    <View style={styles.cardHeaderRow}>
                      <View>
                        <Text style={styles.productName}>{inv.id}</Text>
                        <Text style={styles.productMeta}>{inv.vendor} · {inv.date}</Text>
                      </View>
                      <View style={styles.productPriceCol}>
                        <Text style={styles.productPrice}>${inv.value.toLocaleString()}</Text>
                        <Badge variant="neutral">Open AP</Badge>
                      </View>
                    </View>
                  </Card>
                ))}
                {stepPurchases.length === 0 && (
                  <Text style={styles.noDataText}>No unpaid invoices.</Text>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </ScreenBody>

      {/* CREATE PO SHEET */}
      <Sheet
        open={poOpen}
        onClose={() => setPoOpen(false)}
        title="Create Purchase Order"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setPoOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreatePO}>Submit PO</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          <Field label="Vendor Name">
            <TextInput
              placeholder="e.g. Almarai UAE"
              value={vendorName}
              onChangeText={setVendorName}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
          <Field label="Estimated Value (AED)">
            <TextInput
              placeholder="e.g. 18400"
              value={estimatedValue}
              onChangeText={setEstimatedValue}
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
                    <Text style={styles.productMeta}>{c.visits} visits · ${c.spent} spent</Text>
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
            <StatCard label="Spent" value={`$${c.spent}`} />
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
});
