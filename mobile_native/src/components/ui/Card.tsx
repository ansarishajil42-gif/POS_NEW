import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function Card({
  children,
  onClick,
  noPad = false,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  noPad?: boolean;
  style?: any;
}) {
  const CardContainer = onClick ? TouchableOpacity : View;

  return (
    <CardContainer
      onPress={onClick}
      activeOpacity={onClick ? 0.9 : 1}
      style={[
        styles.card,
        !noPad && styles.padded,
        style
      ]}
    >
      {children}
    </CardContainer>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'brand',
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: 'brand' | 'ink' | 'amber' | 'sky';
  trend?: { dir: 'up' | 'down'; value: string };
}) {
  const accentStyles = {
    brand: { bg: '#f0fdf4', text: '#39ff14' },
    ink: { bg: '#f1f5f9', text: '#475569' },
    amber: { bg: '#fffbeb', text: '#d97706' },
    sky: { bg: '#f0f9ff', text: '#0284c7' },
  }[accent];

  return (
    <Card style={styles.statCard}>
      <View style={styles.row}>
        <Text style={styles.statLabel}>{label}</Text>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: accentStyles.bg }]}>
            {icon}
          </View>
        )}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {trend && (
          <Text style={[styles.trend, trend.dir === 'up' ? styles.trendUp : styles.trendDown]}>
            {trend.dir === 'up' ? '▲' : '▼'} {trend.value}
          </Text>
        )}
      </View>
      {sub && <Text style={styles.subText}>{sub}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginVertical: 4,
  },
  padded: {
    padding: 16,
  },
  statCard: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrapper: {
    height: 32,
    width: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 6,
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
    paddingBottom: 2,
  },
  trendUp: {
    color: '#39ff14',
  },
  trendDown: {
    color: '#ef4444',
  },
  subText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});
