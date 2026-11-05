import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export function ErrorBanner({ error, onDismiss, style }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message || 'An error occurred';
  const code = typeof error === 'object' && error.code ? error.code : null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>
        <View style={styles.textContainer}>
          {code && <Text style={styles.codeText}>{code}</Text>}
          <Text style={styles.messageText}>{message}</Text>
        </View>
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.dismissBtn}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  iconCircle: {
    marginRight: theme.spacing.sm,
  },
  iconText: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  codeText: {
    ...theme.typography.labelSm,
    color: theme.colors.error,
    fontWeight: '800',
    marginBottom: 2,
  },
  messageText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  dismissBtn: {
    padding: theme.spacing.xs,
  },
  dismissText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

