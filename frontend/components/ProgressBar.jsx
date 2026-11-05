import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export function ProgressBar({ percent = 0, status = 'on_track', height = 12, style }) {
  const clamped = Math.min(Math.max(percent, 0), 100);

  const getBarColor = () => {
    switch (status) {
      case 'over_budget':
        return theme.colors.error;
      case 'near_limit':
        return theme.colors.secondaryContainer;
      case 'on_track':
      default:
        return theme.colors.primaryContainer;
    }
  };

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: getBarColor(),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: theme.colors.primaryFixed,
    overflow: 'hidden',
    padding: 1.5,
  },
  fill: {
    minWidth: 4,
  },
});

