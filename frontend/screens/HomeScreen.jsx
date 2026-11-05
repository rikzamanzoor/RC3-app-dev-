import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MemberSelector } from '../components/MemberSelector';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatPKR, formatDate } from '../utils/format';
import { theme } from '../utils/theme';

export function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { members, activeMemberId, setActiveMemberId, refreshKey, bumpRefresh } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [budgetData, setBudgetData] = useState(null);
  const [balancesData, setBalancesData] = useState([]);
  const [pendingShoppingCount, setPendingShoppingCount] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setFetchError(null);
    try {
      const [budgetRes, balancesRes, shoppingRes, expensesRes] = await Promise.all([
        api.getBudget().catch(() => null),
        api.getBalances().catch(() => ({ balances: [] })),
        api.getShopping('pending').catch(() => []),
        api.getExpenses().catch(() => []),
      ]);

      if (budgetRes) setBudgetData(budgetRes);
      if (balancesRes && balancesRes.balances) setBalancesData(balancesRes.balances);
      if (Array.isArray(shoppingRes)) setPendingShoppingCount(shoppingRes.length);
      if (Array.isArray(expensesRes)) setRecentExpenses(expensesRes.slice(0, 3));
    } catch (err) {
      setFetchError(err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    bumpRefresh();
    setRefreshing(false);
  };

  // Find active member's balance record
  const activeBalance = balancesData.find((b) => b.member_id === activeMemberId) || {
    name: user?.name || 'You',
    net: 0,
    paid: 0,
    share_owed: 0,
  };

  const isSelf = user?.member_id === activeMemberId;
  const activeMemberName = activeBalance.name || 'Member';

  // Format net balance message
  const netAmount = Number(activeBalance.net || 0);
  const absNet = Math.abs(netAmount);

  let netTitle = '';
  let netColor = theme.colors.onSurface;
  let netBadgeStatus = 'balanced';
  let netBadgeLabel = 'Settled';

  if (netAmount > 0) {
    netTitle = isSelf ? `You are owed ${formatPKR(absNet)}` : `${activeMemberName} is owed ${formatPKR(absNet)}`;
    netColor = theme.colors.primary;
    netBadgeStatus = 'on_track';
    netBadgeLabel = 'Receiving';
  } else if (netAmount < 0) {
    netTitle = isSelf ? `You owe ${formatPKR(absNet)}` : `${activeMemberName} owes ${formatPKR(absNet)}`;
    netColor = theme.colors.error;
    netBadgeStatus = 'over_budget';
    netBadgeLabel = 'Pending';
  } else {
    netTitle = isSelf ? 'You are all settled up ✓' : `${activeMemberName} is all settled up ✓`;
    netColor = theme.colors.primary;
    netBadgeStatus = 'balanced';
    netBadgeLabel = 'Settled';
  }

  // Budget calculations
  const spent = budgetData?.spent || 0;
  const budget = budgetData?.budget || 5000;
  const remaining = budgetData?.remaining ?? (budget - spent);
  const percentUsed = budgetData?.percent_used || (budget > 0 ? (spent / budget) * 100 : 0);
  const budgetStatus = budgetData?.status || 'on_track';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primaryContainer}
            colors={[theme.colors.primaryContainer]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting & Logout */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>Hi, {user?.name || 'Roommate'} 👋</Text>
            <Text style={styles.greetingSubtitle}>
              Logged in as <Text style={styles.usernameBold}>{user?.username || 'member'}</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            style={styles.logoutBtn}
            accessibilityLabel="Logout"
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner if any */}
        <ErrorBanner error={fetchError} onDismiss={() => setFetchError(null)} />

        {/* Member Selector (Ali / Ayesha / Bilal) */}
        <MemberSelector
          members={members}
          activeMemberId={activeMemberId}
          onSelectMember={(id) => setActiveMemberId(id)}
          label="Viewing balance for"
          style={styles.memberSelector}
        />

        {/* Net Balance Card */}
        <View style={styles.netCard}>
          {/* Top Warm Gradient Edge Accent Bar */}
          <View style={styles.accentBar} />

          <View style={styles.netCardInner}>
            <View style={styles.netHeaderRow}>
              <Text style={styles.netCardLabel}>
                {activeMemberName.toUpperCase()}'S NET BALANCE
              </Text>
              <StatusBadge status={netBadgeStatus} label={netBadgeLabel} />
            </View>

            <View style={styles.netAmountRow}>
              <View
                style={[
                  styles.arrowCircle,
                  netAmount < 0
                    ? styles.arrowCircleDown
                    : netAmount > 0
                    ? styles.arrowCircleUp
                    : styles.arrowCircleSettled,
                ]}
              >
                <Text style={styles.arrowIcon}>
                  {netAmount < 0 ? '↓' : netAmount > 0 ? '↑' : '✓'}
                </Text>
              </View>
              <Text style={[styles.netAmountText, { color: netColor }]} numberOfLines={1}>
                {netTitle}
              </Text>
            </View>

            <Text style={styles.netSubtext}>
              Household shared expenses • Settle up anytime
            </Text>

            {/* Other room status records pill preview */}
            <View style={styles.subRecordsWrap}>
              <Text style={styles.subRecordsLabel}>Other room status records:</Text>
              <View style={styles.subRecordsChips}>
                {balancesData
                  .filter((b) => b.member_id !== activeMemberId)
                  .map((b) => {
                    const bNet = Number(b.net || 0);
                    const bIsOwed = bNet > 0;
                    const bOwes = bNet < 0;
                    return (
                      <View key={b.member_id} style={styles.subRecordPill}>
                        <View
                          style={[
                            styles.subRecordDot,
                            {
                              backgroundColor: bIsOwed
                                ? theme.colors.secondaryContainer
                                : bOwes
                                ? theme.colors.error
                                : theme.colors.primary,
                            },
                          ]}
                        />
                        <Text style={styles.subRecordText}>
                          {b.name}: {bNet === 0 ? 'Settled ✓' : formatPKR(bNet)}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Budget Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeaderRow}>
            <View style={styles.budgetTitleLeft}>
              <View style={styles.budgetIconCircle}>
                <Text style={styles.budgetEmoji}>📊</Text>
              </View>
              <Text style={styles.budgetTitle}>This month's budget</Text>
            </View>
            <StatusBadge status={budgetStatus} />
          </View>

          {/* Figures */}
          <View style={styles.budgetFiguresRow}>
            <Text style={styles.spentAmount}>{formatPKR(spent)}</Text>
            <Text style={styles.totalBudget}>of {formatPKR(budget)}</Text>
          </View>

          {/* Thick Progress Bar */}
          <ProgressBar percent={percentUsed} status={budgetStatus} height={14} />

          {/* Subtext */}
          <View style={styles.budgetSubtextRow}>
            <Text style={styles.budgetRemainingText}>
              {formatPKR(remaining)} remaining
            </Text>
            <Text style={styles.budgetPercentText}>
              {percentUsed.toFixed(0)}% spent
            </Text>
          </View>
        </View>

        {/* Pending Shopping Card Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation && navigation.navigate('Shopping')}
          style={styles.shoppingBanner}
        >
          <View style={styles.shoppingBannerLeft}>
            <View style={styles.shoppingBasketCircle}>
              <Text style={styles.shoppingBasketIcon}>🛒</Text>
            </View>
            <View>
              <Text style={styles.shoppingBannerTitle}>
                {pendingShoppingCount} {pendingShoppingCount === 1 ? 'item' : 'items'} left to buy
              </Text>
              <Text style={styles.shoppingBannerSubtitle}>Tap to view shared pantry list</Text>
            </View>
          </View>
          <View style={styles.chevronCircle}>
            <Text style={styles.chevronIcon}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* House Updates Section */}
        <View style={styles.houseUpdatesSection}>
          <View style={styles.updatesHeaderRow}>
            <Text style={styles.sectionHeading}>House Updates</Text>
            <TouchableOpacity onPress={() => navigation && navigation.navigate('Expenses')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No expenses logged yet this month</Text>
            </View>
          ) : (
            recentExpenses.map((exp) => (
              <View key={exp.id} style={styles.updateCard}>
                <View style={styles.updateLeft}>
                  <View style={styles.updateCategoryCircle}>
                    <Text style={styles.updateEmoji}>
                      {exp.category === 'Groceries'
                        ? '🍎'
                        : exp.category === 'Utilities'
                        ? '⚡'
                        : exp.category === 'Cleaning'
                        ? '🧹'
                        : '🧾'}
                    </Text>
                  </View>
                  <View style={styles.updateInfo}>
                    <Text style={styles.updateTitle} numberOfLines={1}>
                      {exp.title}
                    </Text>
                    <Text style={styles.updateMeta}>
                      Paid by {exp.payer_name || exp.payer_id} • {formatDate(exp.expense_date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.updateRight}>
                  <Text style={styles.updateAmount}>{formatPKR(exp.amount)}</Text>
                  <Text style={styles.updateSplitType}>
                    {exp.split_type === 'equal' ? 'Split evenly' : 'Custom split'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  greetingTitle: {
    ...theme.typography.headlineLg,
    color: theme.colors.onSurface,
  },
  greetingSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  usernameBold: {
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryFixed,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  logoutIcon: {
    fontSize: 14,
  },
  logoutText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  memberSelector: {
    marginVertical: theme.spacing.sm,
  },
  netCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xxl,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  accentBar: {
    height: 5,
    backgroundColor: theme.colors.primaryContainer,
  },
  netCardInner: {
    padding: theme.spacing.md + 2,
  },
  netHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  netCardLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    letterSpacing: 0.8,
  },
  netAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleDown: {
    backgroundColor: theme.colors.errorContainer,
  },
  arrowCircleUp: {
    backgroundColor: theme.colors.primaryFixed,
  },
  arrowCircleSettled: {
    backgroundColor: theme.colors.successContainer,
  },
  arrowIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  netAmountText: {
    ...theme.typography.headlineLg,
    fontWeight: '800',
    flex: 1,
  },
  netSubtext: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  subRecordsWrap: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceLow,
  },
  subRecordsLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginBottom: 6,
  },
  subRecordsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs + 2,
  },
  subRecordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  subRecordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subRecordText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  budgetCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  budgetTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs + 2,
  },
  budgetIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetEmoji: {
    fontSize: 14,
  },
  budgetTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
  },
  budgetFiguresRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  spentAmount: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: '800',
  },
  totalBudget: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    fontWeight: '500',
  },
  budgetSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs + 2,
  },
  budgetRemainingText: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
  },
  budgetPercentText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSecondaryContainer,
    fontWeight: '700',
  },
  shoppingBanner: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  shoppingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  shoppingBasketCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingBasketIcon: {
    fontSize: 22,
  },
  shoppingBannerTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  shoppingBannerSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 1,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  houseUpdatesSection: {
    marginTop: theme.spacing.xs,
  },
  updatesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  seeAllText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  updateCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  updateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 2,
    flex: 1,
  },
  updateCategoryCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateEmoji: {
    fontSize: 18,
  },
  updateInfo: {
    flex: 1,
  },
  updateTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
  },
  updateMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    fontSize: 12,
    marginTop: 1,
  },
  updateRight: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  updateAmount: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  updateSplitType: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginTop: 1,
  },
  emptyCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
  },
});

