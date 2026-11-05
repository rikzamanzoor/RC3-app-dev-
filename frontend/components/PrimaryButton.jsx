import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { theme } from '../utils/theme';

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  style,
  textStyle,
}) {
  const isActionDisabled = disabled || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'surface':
        return styles.surfaceContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'danger':
        return styles.dangerContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'surface':
        return styles.surfaceText;
      case 'ghost':
        return styles.ghostText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'outline' || variant === 'surface' || variant === 'ghost') {
      return theme.colors.primary;
    }
    return theme.colors.onPrimary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isActionDisabled}
      style={[
        styles.base,
        getContainerStyle(),
        isActionDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  primaryContainer: {
    backgroundColor: theme.colors.primaryContainer,
    ...theme.shadows.primaryGlow,
  },
  secondaryContainer: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryContainer,
  },
  surfaceContainer: {
    backgroundColor: theme.colors.surfaceLowest,
    ...theme.shadows.sm,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: theme.colors.error,
  },
  disabled: {
    opacity: 0.55,
  },
  baseText: {
    ...theme.typography.titleSm,
    textAlign: 'center',
  },
  primaryText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  secondaryText: {
    color: theme.colors.onSecondaryContainer,
    fontWeight: '700',
  },
  outlineText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  surfaceText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  ghostText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dangerText: {
    color: theme.colors.onError,
    fontWeight: '700',
  },
});

