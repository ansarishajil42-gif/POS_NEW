import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { purchaseOrders, grns, vendors } from '../../lib/mockData';
import { useAuth } from '../../lib/auth';
import { ShoppingCart, CheckCircle2, AlertTriangle, Truck, Plus } from 'lucide-react-native';

export function PurchasingHome() {
  const { branch } = useAuth();
  const openPOs = purchaseOrders.filter((p) => p.status === 'open' || p.status === 'sent').length;
  const pendingGRNs = grns.filter((g) => g.status === 'pending').length;
  const variances = grns.filter((g) => g.variance > 0).length;
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="PO" branch={branch} />
      <ScreenBody>
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Open POs" value={String(openPOs)} icon={<ShoppingCart size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Pending GRNs" value={String(pendingGRNs)} icon={<CheckCircle2 size={16} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Variance Alerts" value={String(variances)} icon={<AlertTriangle size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Vendors" value={String(vendors.length)} icon={<Truck size={16} color="#475569" />} accent="ink" />
          </View>
        </View>
      </ScreenBody>
    </View>
  );
}

export function PurchasingPOs({ onNew }: { onNew: () => void }) {
  const { branch } = useAuth();
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="PO" branch={branch} />
      <ScreenBody>
        <View style={styles.headerRow}>
          <Text style={styles.mainTitle}>Purchase Orders</Text>
          <Button style={styles.newBtn} onClick={onNew}>
            <View style={styles.btnContentRow}>
              <Plus size={14} color="#ffffff" />
              <Text style={styles.btnText}>New PO</Text>
            </View>
          </Button>
        </View>
        <View style={styles.listContainer}>
          {purchaseOrders.map((p) => (
            <Card key={p.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{p.number}</Text>
                  <Text style={styles.productMeta}>{p.vendor} · {p.date}</Text>
                </View>
                <View style={styles.productPriceCol}>
                  <Text style={styles.productPrice}>${p.total.toLocaleString()}</Text>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
    </View>
  );
}

export function NewPOScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const [vendor, setVendor] = useState(vendors[0].name);
  const [lines, setLines] = useState([
    { name: 'Basmati Rice 5kg', qty: 20, price: 48 },
    { name: 'Olive Oil 750ml', qty: 15, price: 39 }
  ]);
  const total = lines.reduce((a, l) => a + l.qty * l.price, 0);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="PO" branch={branch} />
      <ScreenHeader title="New Purchase Order" onBack={onBack} />
      <ScreenBody>
        <Card>
          <Field label="Vendor">
            <View style={styles.fakeSelect}><Text style={styles.fakeSelectText}>{vendor}</Text></View>
          </Field>
        </Card>

        <Text style={styles.sectionTitle}>Line Items</Text>
        <View style={styles.listContainer}>
          {lines.map((l, i) => (
            <Card key={i}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{l.name}</Text>
                  <Text style={styles.productMeta}>{l.qty} × ${l.price}</Text>
                </View>
                <Text style={styles.productPrice}>${l.qty * l.price}</Text>
              </View>
            </Card>
          ))}
          <Button variant="secondary" style={styles.marginT}>+ Add line</Button>
        </View>

        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${total}</Text>
        </Card>
        <Button full style={styles.marginT}>Create PO</Button>
      </ScreenBody>
    </View>
  );
}

export function PurchasingGRNs() {
  const { branch } = useAuth();
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="PO" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Goods Received Notes</Text>
        <View style={styles.listContainer}>
          {grns.map((g) => (
            <Card key={g.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{g.number}</Text>
                  <Text style={styles.productMeta}>{g.vendor} · {g.date}</Text>
                </View>
                <View style={styles.grnActionCol}>
                  {g.variance > 0 ? (
                    <Badge variant="error">Variance {g.variance}</Badge>
                  ) : (
                    <Badge variant="success">No variance</Badge>
                  )}
                  <Button variant="secondary" style={styles.miniBtn}>
                    <Text style={styles.miniBtnText}>Convert to Invoice</Text>
                  </Button>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>
    </View>
  );
}

export function PurchasingVendors() {
  const { branch } = useAuth();
  const totalPayable = vendors.reduce((a, v) => a + v.payable, 0);
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="PO" branch={branch} />
      <ScreenBody>
        <Card style={styles.totalCard}>
          <View>
            <Text style={styles.statusSub}>Total Accounts Payable</Text>
            <Text style={styles.totalPayableVal}>${totalPayable.toLocaleString()}</Text>
          </View>
        </Card>

        <Text style={styles.mainTitle}>Vendors</Text>
        <View style={styles.listContainer}>
          {vendors.map((v) => (
            <Card key={v.id}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.vendorRowLeft}>
                  <View style={styles.vendorIconWrapper}>
                    <Truck size={18} color="#475569" />
                  </View>
                  <View>
                    <Text style={styles.productName}>{v.name}</Text>
                    <Text style={styles.productMeta}>{v.category} · {v.orders} orders</Text>
                  </View>
                </View>
                <View style={styles.productPriceCol}>
                  <Text style={styles.productPrice}>${v.payable.toLocaleString()}</Text>
                  <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  newBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  marginT: {
    marginTop: 10,
  },
  totalCard: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#39ff14',
  },
  grnActionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  miniBtn: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  miniBtnText: {
    fontSize: 10,
  },
  statusSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  totalPayableVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#39ff14',
    marginTop: 2,
  },
  vendorRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vendorIconWrapper: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
