import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { formatPKR } from '../utils/format';
import { theme } from '../utils/theme';

export function MoneyText({ amount, style, variant = 'body', colorVariant = 'default' }) {
  const formatted = formatPKR(amount);

  const getColor = () => {
    switch (colorVariant) {
      case 'error':
      case 'negative':
        return theme.colors.error;
      case 'success':
      case 'positive':
        return theme.colors.success;
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.onSecondaryContainer;
      case 'tertiary':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurface;
    }
  };

  const getTypography = () => {
    switch (variant) {
      case 'display':
        return theme.typography.currency;
      case 'headline':
        return theme.typography.headlineMd;
      case 'title':
        return theme.typography.titleSm;
      case 'caption':
        return theme.typography.labelSm;
      default:
        return theme.typography.bodyMd;
    }
  };

  return (
    <Text style={[styles.text, getTypography(), { color: getColor() }, style]}>
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});

