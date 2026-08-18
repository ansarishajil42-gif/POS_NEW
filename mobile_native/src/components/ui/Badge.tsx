import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Variant = 'success' | 'warn' | 'error' | 'neutral' | 'info' | 'brand';

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  style,
}: {
  children: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
  style?: any;
}) {
  const variantStyles = {
    success: { bg: '#f0fdf4', text: '#39ff14', border: '#bbf7d0' },
    warn: { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' },
    error: { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' },
    neutral: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    info: { bg: '#f0f9ff', text: '#0284c7', border: '#e0f2fe' },
    brand: { bg: '#f0fdf4', text: '#39ff14', border: '#bbf7d0' },
  }[variant];

  // Stringify child text
  const textContent = typeof children === 'string' || typeof children === 'number'
    ? String(children)
    : '';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: variantStyles.bg, borderColor: variantStyles.border },
      style
    ]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: variantStyles.text }]} />
      )}
      <Text style={[styles.text, { color: variantStyles.text }]}>
        {textContent || children}
      </Text>
    </View>
  );
}

export function statusVariant(status: string): Variant {
  const s = status.toLowerCase();
  if (['active', 'open', 'received', 'paid', 'fresh', 'synced', 'completed', 'fulfilled', 'approved'].includes(s)) return 'success';
  if (['suspended', 'overdue', 'urgent', 'error', 'expired'].includes(s)) return 'error';
  if (['trial', 'pending', 'near', 'warn', 'in-transit', 'acknowledged', 'buffering'].includes(s)) return 'warn';
  if (['new', 'preparing', 'packed', 'draft', 'sent'].includes(s)) return 'info';
  return 'neutral';
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
