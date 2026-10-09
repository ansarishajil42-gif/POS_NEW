import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const barDims = {
    sm: { width: 5, height: 18, radius: 999, gap: 3 },
    md: { width: 7, height: 24, radius: 999, gap: 4 },
    lg: { width: 9, height: 32, radius: 999, gap: 5 },
  }[size];

  const fontSize = {
    sm: 16,
    md: 20,
    lg: 26,
  }[size];

  return (
    <View style={styles.container}>
      <View style={[styles.pillsContainer, { marginRight: barDims.gap * 1.5 }]}>
        <View
          style={{
            width: barDims.width,
            height: barDims.height,
            borderRadius: barDims.radius,
            backgroundColor: '#39ff14',
            marginRight: barDims.gap,
          }}
        />
        <View
          style={{
            width: barDims.width,
            height: barDims.height,
            borderRadius: barDims.radius,
            backgroundColor: '#111827',
          }}
        />
      </View>
      <Text style={[styles.text, { fontSize }]}>
        cloudynation<Text style={styles.brandText}>pos</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  brandText: {
    color: '#39ff14',
  },
});

