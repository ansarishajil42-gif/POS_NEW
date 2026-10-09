import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../lib/auth';
import {
  BookOpen,
  Wallet,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Globe,
  Sparkles,
} from 'lucide-react-native';

interface SuperAdminMoreProps {
  onOpen: (key: string) => void;
}

export function SuperAdminMore({ onOpen }: SuperAdminMoreProps) {
  const { branch } = useAuth();

  const menuItems = [
    {
      key: 'sa-blog',
      title: 'Blog Management',
      desc: 'Create, edit, and publish platform marketing articles',
      badge: 'CMS',
      badgeVariant: 'brand' as const,
      icon: <BookOpen size={20} color="#39ff14" />,
    },
    {
      key: 'sa-settings',
      title: 'Tax & Currency',
      desc: 'UAE VAT rates (5%), AED currency & pricing rules',
      badge: 'Regional',
      badgeVariant: 'info' as const,
      icon: <Wallet size={20} color="#0284c7" />,
    },
    {
      key: 'sa-analytics',
      title: 'Fleet Analytics',
      desc: 'Platform growth overview, MRR and tenant metrics',
      badge: 'Insights',
      badgeVariant: 'neutral' as const,
      icon: <TrendingUp size={20} color="#64748b" />,
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader roleLabel="SA" branch={branch} />

      <ScreenBody>
        {/* Header Banner */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>More Options</Text>
            <Text style={styles.pageSubtitle}>
              Platform administration, content publishing & system configuration
            </Text>
          </View>

          {/* Quick Hub Cards */}
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <Card
                key={item.key}
                style={styles.menuCard}
                onClick={() => onOpen(item.key)}
              >
                <View style={styles.cardInner}>
                  <View style={styles.iconCircle}>
                    {item.icon}
                  </View>

                  <View style={styles.textColumn}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Badge variant={item.badgeVariant}>
                        {item.badge}
                      </Badge>
                    </View>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>

                  <ChevronRight size={18} color="#94a3b8" style={styles.chevron} />
                </View>
              </Card>
            ))}
          </View>

          {/* Platform Info Box */}
          <Card style={styles.systemCard}>
            <View style={styles.systemHeader}>
              <View style={styles.shieldIconWrap}>
                <ShieldCheck size={18} color="#39ff14" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.systemTitle}>Super Admin HQ</Text>
                <Text style={styles.systemSubtitle}>Centralized cloud management</Text>
              </View>
              <Badge variant="success">Active</Badge>
            </View>

            <View style={styles.systemDivider} />

            <View style={styles.systemRow}>
              <View style={styles.systemItem}>
                <Globe size={14} color="#64748b" />
                <Text style={styles.systemItemLabel}>Region: UAE / GCC</Text>
              </View>
              <View style={styles.systemItem}>
                <Sparkles size={14} color="#64748b" />
                <Text style={styles.systemItemLabel}>Platform v2.4</Text>
              </View>
            </View>
          </Card>

          <View style={{ height: 40 }} />
        </ScreenBody>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  pageHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  menuList: {
    gap: 12,
    marginBottom: 20,
  },
  menuCard: {
    borderRadius: 16,
    padding: 16,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  chevron: {
    marginLeft: 4,
  },
  systemCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  systemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  systemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemItemLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
