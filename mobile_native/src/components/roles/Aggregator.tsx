import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button } from '../ui/Primitives';
import { aggregatorOrders } from '../../lib/mockData';
import { useAuth } from '../../lib/auth';
import { Zap, KeyRound } from 'lucide-react-native';

const CHANNELS = ['Talabat', 'Careem', 'InstaShop', 'Deliveroo'] as const;

export function AggregatorScreen({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const [channel, setChannel] = useState<string>('Talabat');
  const [sync, setSync] = useState<Record<string, boolean>>({ Downtown: true, Marina: true, Jumeirah: false, 'Business Bay': true });
  const [connected, setConnected] = useState<Record<string, boolean>>({ Talabat: true, Careem: true, InstaShop: false, Deliveroo: false });

  const orders = aggregatorOrders.filter((o) => o.channel === channel);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Aggregator Sync" subtitle="Food delivery integrations" onBack={onBack} />
      <ScreenBody>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconWrapper}>
            <Zap size={18} color="#ffffff" />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.summaryTitle}>Publish to all aggregators</Text>
            <Text style={styles.summarySub}>Sync prices & menu across channels</Text>
          </View>
          <Button style={styles.publishBtn}>Publish</Button>
        </Card>

        <Text style={styles.sectionTitle}>Incoming Orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelsScroll} contentContainerStyle={styles.channelsScrollContent}>
          {CHANNELS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setChannel(c)}
              style={[
                styles.channelPill,
                channel === c ? styles.channelPillActive : styles.channelPillInactive
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.pillRow}>
                <Text style={[
                  styles.channelPillText,
                  channel === c ? styles.channelPillTextActive : styles.channelPillTextInactive
                ]}>
                  {c}
                </Text>
                {connected[c] && <View style={styles.greenIndicatorDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          {orders.length === 0 && <Text style={styles.emptyOrdersText}>No orders on {channel} right now.</Text>}
          {orders.map((o) => (
            <Card key={o.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{o.number}</Text>
                  <Text style={styles.productMeta}>{o.customer} · {o.items} items</Text>
                </View>
                <View style={styles.productPriceCol}>
                  <Text style={styles.productPrice}>${o.total}</Text>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Stock Auto-Sync</Text>
        <Card>
          <View style={styles.togglesList}>
            {Object.keys(sync).map((b) => (
              <View key={b} style={styles.toggleRow}>
                <Text style={styles.toggleText}>{b}</Text>
                <TouchableOpacity
                  onPress={() => setSync({ ...sync, [b]: !sync[b] })}
                  style={[
                    styles.switchTrack,
                    sync[b] ? styles.trackOn : styles.trackOff
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.switchThumb,
                    sync[b] ? styles.thumbOn : styles.thumbOff
                  ]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}><KeyRound size={13} color="#475569" style={styles.sectionIcon} /> API Credential Vault</Text>
        <View style={styles.listContainer}>
          {CHANNELS.map((c) => (
            <Card key={c}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.productName}>{c}</Text>
                  <Text style={styles.productMeta}>{connected[c] ? '••••••••••••' : 'Not connected'}</Text>
                </View>
                <Button
                  variant={connected[c] ? 'secondary' : 'primary'}
                  style={styles.connectBtn}
                  onClick={() => setConnected({ ...connected, [c]: !connected[c] })}
                >
                  <Text style={styles.connectBtnText}>{connected[c] ? 'Connected' : 'Connect'}</Text>
                </Button>
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
  summaryCard: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconWrapper: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#39ff14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summarySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  publishBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  channelsScroll: {
    marginBottom: 12,
  },
  channelsScrollContent: {
    gap: 6,
  },
  channelPill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  channelPillActive: {
    backgroundColor: '#39ff14',
  },
  channelPillInactive: {
    backgroundColor: '#f1f5f9',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  channelPillTextActive: {
    color: '#ffffff',
  },
  channelPillTextInactive: {
    color: '#475569',
  },
  greenIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#bbf7d0',
    marginLeft: 6,
  },
  listContainer: {
    gap: 10,
  },
  emptyOrdersText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
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
  togglesList: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
  sectionIcon: {
    marginRight: 6,
  },
  connectBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  connectBtnText: {
    fontSize: 11,
  },
});
