import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export function Card({ children, style, variant = 'elevated' }) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'flat' && styles.flat,
        variant === 'warm' && styles.warm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLowest,
  },
  elevated: {
    ...theme.shadows.sm,
  },
  flat: {
    backgroundColor: theme.colors.surfaceContainer,
  },
  warm: {
    backgroundColor: theme.colors.surfaceLow,
  },
});

