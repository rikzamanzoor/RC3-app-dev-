import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatPKR } from '../utils/format';
import { theme } from '../utils/theme';

export function BalanceTable({ balances = [], sum = 0, style }) {
  const getAvatarInitials = (name) => {
    if (!name) return 'M';
    if (name.toLowerCase() === 'ayesha') return 'Ay';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarBg = (memberId) => {
    switch (memberId) {
      case 'M01':
        return theme.colors.primaryContainer;
      case 'M02':
        return theme.colors.secondaryContainer;
      case 'M03':
        return theme.colors.tertiary;
      default:
        return theme.colors.primaryFixed;
    }
  };

  const getAvatarTextColor = (memberId) => {
    switch (memberId) {
      case 'M02':
        return theme.colors.onSecondaryContainer;
      default:
        return theme.colors.onPrimary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Table Header Title */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.walletIcon}>💼</Text>
          <Text style={styles.titleText}>Member Balances</Text>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>{balances.length} Active</Text>
        </View>
      </View>

      {/* Column Headers */}
      <View style={styles.headerRow}>
        <Text style={[styles.columnHeader, { flex: 4 }]}>MEMBER</Text>
        <Text style={[styles.columnHeader, styles.alignRight, { flex: 3 }]}>PAID</Text>
        <Text style={[styles.columnHeader, styles.alignRight, { flex: 2.5 }]}>OWED</Text>
        <Text style={[styles.columnHeader, styles.alignRight, { flex: 2.5 }]}>NET</Text>
      </View>

      {/* Rows */}
      {balances.map((row) => {
        const isPositive = row.net > 0;
        const isNegative = row.net < 0;
        const netColor = isPositive
          ? theme.colors.onPrimaryFixedVariant
          : isNegative
          ? theme.colors.error
          : theme.colors.tertiary;

        const netBg = isPositive
          ? theme.colors.primaryFixed
          : isNegative
          ? theme.colors.errorContainer
          : theme.colors.surfaceContainer;

        const netPrefix = isPositive ? '+' : '';

        return (
          <View key={row.member_id} style={styles.dataRow}>
            {/* Member info with avatar */}
            <View style={[styles.memberCol, { flex: 4 }]}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: getAvatarBg(row.member_id) },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: getAvatarTextColor(row.member_id) },
                  ]}
                >
                  {getAvatarInitials(row.name)}
                </Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.memberId} numberOfLines={1}>
                  {row.member_id}
                </Text>
              </View>
            </View>

            {/* Paid */}
            <Text style={[styles.numText, styles.alignRight, { flex: 3 }]}>
              {Number(row.paid || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            {/* Owed */}
            <Text
              style={[
                styles.numText,
                styles.owedText,
                styles.alignRight,
                { flex: 2.5 },
              ]}
            >
              {Number(row.share_owed || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            {/* Net */}
            <View style={[styles.netCol, { flex: 2.5 }]}>
              <View style={[styles.netBadge, { backgroundColor: netBg }]}>
                <Text style={[styles.netText, { color: netColor }]}>
                  {netPrefix}
                  {Number(row.net || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Table Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Net Balance Total:{' '}
          <Text style={styles.footerBold}>{formatPKR(sum || 0)}</Text>
        </Text>
        <View style={styles.balancedPill}>
          <Text style={styles.balancedText}>✓ Balanced</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs + 2,
  },
  walletIcon: {
    fontSize: 18,
  },
  titleText: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  activePillText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  columnHeader: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  alignRight: {
    textAlign: 'right',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLow,
  },
  memberCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    ...theme.typography.labelSm,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
  },
  memberName: {
    ...theme.typography.bodySm,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  memberId: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    fontSize: 10,
  },
  numText: {
    ...theme.typography.bodySm,
    fontVariant: ['tabular-nums'],
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  owedText: {
    color: theme.colors.tertiary,
  },
  netCol: {
    alignItems: 'flex-end',
  },
  netBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs + 2,
    minWidth: 54,
    alignItems: 'center',
  },
  netText: {
    ...theme.typography.labelSm,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLow,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  footerText: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
  },
  footerBold: {
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  balancedPill: {
    backgroundColor: theme.colors.surfaceLowest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    ...theme.shadows.sm,
  },
  balancedText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

