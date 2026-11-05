import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export function StatusBadge({ status, label, style }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'pending':
        return {
          bg: theme.colors.secondaryFixed,
          text: theme.colors.onSecondaryFixedVariant,
          dot: theme.colors.secondary,
          defaultLabel: 'Pending',
        };
      case 'bought':
        return {
          bg: theme.colors.surfaceContainerHigh,
          text: theme.colors.primary,
          dot: theme.colors.primary,
          defaultLabel: 'Bought ✓',
        };
      case 'near_limit':
        return {
          bg: theme.colors.secondaryFixed,
          text: theme.colors.onSecondaryFixedVariant,
          dot: theme.colors.secondary,
          defaultLabel: 'Near Limit',
        };
      case 'on_track':
        return {
          bg: theme.colors.successContainer,
          text: theme.colors.success,
          dot: theme.colors.success,
          defaultLabel: 'On Track',
        };
      case 'over_budget':
        return {
          bg: theme.colors.errorContainer,
          text: theme.colors.error,
          dot: theme.colors.error,
          defaultLabel: 'Over Budget',
        };
      case 'balanced':
        return {
          bg: theme.colors.surfaceContainer,
          text: theme.colors.primary,
          dot: theme.colors.primary,
          defaultLabel: 'Balanced ✓',
        };
      case 'priority':
        return {
          bg: theme.colors.primaryFixed,
          text: theme.colors.primary,
          dot: theme.colors.primary,
          defaultLabel: label || 'Priority',
        };
      default:
        return {
          bg: theme.colors.surfaceContainer,
          text: theme.colors.onSurfaceVariant,
          dot: theme.colors.tertiary,
          defaultLabel: label || status,
        };
    }
  };

  const config = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      {config.dot && <View style={[styles.dot, { backgroundColor: config.dot }]} />}
      <Text style={[styles.label, { color: config.text }]}>
        {label || config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    ...theme.typography.labelSm,
    fontWeight: '700',
  },
});

