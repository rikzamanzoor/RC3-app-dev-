import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export function LoadingOverlay({ message = 'Loading...', visible = true }) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={theme.colors.primaryContainer} />
        {message ? <Text style={styles.text}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 27, 24, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: theme.colors.surfaceLowest,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    minWidth: 160,
    ...theme.shadows.md,
  },
  text: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
});

