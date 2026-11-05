import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export function MemberSelector({
  members = [],
  activeMemberId,
  onSelectMember,
  label = 'Viewing balance for',
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}
      <View style={styles.chipsRow}>
        {members.map((member) => {
          const isSelected = member.id === activeMemberId;
          return (
            <TouchableOpacity
              key={member.id}
              activeOpacity={0.8}
              onPress={() => onSelectMember && onSelectMember(member.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  label: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primaryContainer,
    ...theme.shadows.primaryGlow,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surfaceLowest,
    ...theme.shadows.sm,
  },
  chipText: {
    ...theme.typography.titleSm,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: theme.colors.onPrimary,
  },
  chipTextUnselected: {
    color: theme.colors.tertiary,
  },
});

