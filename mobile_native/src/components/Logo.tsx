import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const containerDims = {
    sm: { height: 28, width: 28, padding: 4 },
    md: { height: 36, width: 36, padding: 6 },
    lg: { height: 48, width: 48, padding: 8 },
  }[size];

  const fontSize = {
    sm: 14,
    md: 18,
    lg: 24,
  }[size];

  return (
    <View style={styles.container}>
      {/* Mini logo icon */}
      <View style={[styles.iconBox, containerDims]}>
        <View style={styles.barLeft} />
        <View style={styles.barRight} />
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
  iconBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  barLeft: {
    width: 4,
    height: '40%',
    borderRadius: 2,
    backgroundColor: '#0f172a',
    marginHorizontal: 1.5,
  },
  barRight: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    backgroundColor: '#39ff14',
    marginHorizontal: 1.5,
  },
  text: {
    fontWeight: '900',
    color: '#0f172a',
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  brandText: {
    color: '#39ff14',
  },
});
