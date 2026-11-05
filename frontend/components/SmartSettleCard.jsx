import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { formatPKR } from '../utils/format';
import { theme } from '../utils/theme';

export function SmartSettleCard({
  transfer,
  priority = 1,
  loggedInMemberId,
  onSettle,
  loading = false,
  style,
}) {
  const { from_id, from_name, to_id, to_name, amount } = transfer;

  // AUTHFE-11: Enabled only where logged-in member is sender or recipient
  const isParty = loggedInMemberId === from_id || loggedInMemberId === to_id;

  const getInitials = (name) => {
    if (!name) return 'M';
    if (name.toLowerCase() === 'ayesha') return 'Ay';
    return name.charAt(0).toUpperCase();
  };

  return (
    <View style={[styles.card, style]}>
      {/* Top Priority Badge */}
      <View style={styles.topRow}>
        <View style={styles.priorityBadge}>
          <Text style={styles.boltIcon}>⚡</Text>
          <Text style={styles.priorityText}>Priority {priority}</Text>
        </View>
        <Text style={styles.categoryNote}>Smart Settle Suggestion</Text>
      </View>

      {/* Transfer Flow */}
      <View style={styles.flowRow}>
        {/* Payer (Sender) */}
        <View style={styles.memberBox}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text style={[styles.avatarText, { color: theme.colors.onSecondaryContainer }]}>
              {getInitials(from_name)}
            </Text>
          </View>
          <Text style={styles.memberName} numberOfLines={1}>
            {from_name}
          </Text>
          <Text style={styles.roleSubtext}>Sends</Text>
        </View>

        {/* Arrow & Flow */}
        <View style={styles.arrowContainer}>
          <View style={styles.arrowTrack}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowCircle}>
              <Text style={styles.arrowIcon}>➔</Text>
            </View>
          </View>
          <Text style={styles.paysText}>pays</Text>
        </View>

        {/* Receiver */}
        <View style={styles.memberBox}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.avatarText, { color: theme.colors.onPrimary }]}>
              {getInitials(to_name)}
            </Text>
          </View>
          <Text style={styles.memberName} numberOfLines={1}>
            {to_name}
          </Text>
          <Text style={styles.roleSubtext}>Receives</Text>
        </View>
      </View>

      {/* Amount Display */}
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Settlement Amount</Text>
        <Text style={styles.amountValue}>{formatPKR(amount)}</Text>
      </View>

      {/* Action Button */}
      {isParty ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSettle && onSettle(transfer)}
          disabled={loading}
          style={[styles.settleBtn, loading && styles.btnDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <View style={styles.btnContent}>
              <Text style={styles.btnIcon}>⚡</Text>
              <Text style={styles.btnText}>One-Tap Settle</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledHintText}>
            🔒 Only the people involved can record this payment
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryFixed,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  boltIcon: {
    fontSize: 12,
  },
  priorityText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  categoryNote: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  memberBox: {
    alignItems: 'center',
    width: 72,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...theme.shadows.sm,
  },
  avatarText: {
    ...theme.typography.headlineMd,
    fontWeight: '700',
  },
  memberName: {
    ...theme.typography.labelLg,
    color: theme.colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleSubtext: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  arrowTrack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 28,
  },
  arrowLine: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 2,
  },
  arrowCircle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  arrowIcon: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  paysText: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 4,
  },
  amountBox: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm + 4,
    marginVertical: theme.spacing.md,
  },
  amountLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginBottom: 2,
  },
  amountValue: {
    ...theme.typography.currency,
    color: theme.colors.onSurface,
    fontWeight: '800',
  },
  settleBtn: {
    height: 48,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.primaryGlow,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnIcon: {
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
  btnText: {
    ...theme.typography.titleSm,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  disabledContainer: {
    backgroundColor: theme.colors.surfaceLow,
    padding: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  disabledHintText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

