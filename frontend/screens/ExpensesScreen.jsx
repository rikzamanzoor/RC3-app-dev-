import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { BalanceTable } from '../components/BalanceTable';
import { ExpenseForm } from '../components/ExpenseForm';
import { SettleModal } from '../components/SettleModal';
import { SmartSettleCard } from '../components/SmartSettleCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatPKR, formatDate } from '../utils/format';
import { theme } from '../utils/theme';

export function ExpensesScreen() {
  const { user } = useAuth();
  const { members, refreshKey, bumpRefresh } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [balancesData, setBalancesData] = useState([]);
  const [balanceSum, setBalanceSum] = useState(0);
  const [simplifiedTransfers, setSimplifiedTransfers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isSmartSettleModalOpen, setIsSmartSettleModalOpen] = useState(false);

  // Prefill state for standard settle modal
  const [settlePrefill, setSettlePrefill] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [settlingTransferId, setSettlingTransferId] = useState(null);

  const loadAllExpensesData = useCallback(async () => {
    setError(null);
    try {
      const [expRes, balRes, simpRes] = await Promise.all([
        api.getExpenses().catch(() => []),
        api.getBalances().catch(() => ({ balances: [], sum: 0 })),
        api.getSimplifiedBalances().catch(() => ({ transfers: [] })),
      ]);

      if (Array.isArray(expRes)) setExpenses(expRes);
      if (balRes && balRes.balances) {
        setBalancesData(balRes.balances);
        setBalanceSum(balRes.sum || 0);
      }
      if (simpRes && Array.isArray(simpRes.transfers)) {
        setSimplifiedTransfers(simpRes.transfers);
      }
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    loadAllExpensesData();
  }, [loadAllExpensesData, refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllExpensesData();
    bumpRefresh();
    setRefreshing(false);
  };

  const handleAddExpense = async (payload) => {
    setActionLoading(true);
    setError(null);
    try {
      await api.addExpense(payload);
      setIsExpenseModalOpen(false);
      bumpRefresh();
      loadAllExpensesData();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettleSubmit = async (payload) => {
    setActionLoading(true);
    setError(null);
    try {
      await api.settleUp(payload);
      setIsSettleModalOpen(false);
      setIsSmartSettleModalOpen(false);
      setSettlePrefill(null);
      bumpRefresh();
      loadAllExpensesData();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOneTapSettle = async (transfer) => {
    setSettlingTransferId(`${transfer.from_id}-${transfer.to_id}`);
    setError(null);
    try {
      await api.settleUp({
        sender_id: transfer.from_id,
        recipient_id: transfer.to_id,
        amount: transfer.amount,
      });
      bumpRefresh();
      loadAllExpensesData();
    } catch (err) {
      setError(err);
    } finally {
      setSettlingTransferId(null);
    }
  };

  const openSettleWithPrefill = (senderId, recipientId, amount) => {
    setSettlePrefill({ senderId, recipientId, amount });
    setIsSettleModalOpen(true);
  };

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
        {/* Top Header Area */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Expenses</Text>
            <Text style={styles.screenSubtitle}>
              Shared ledger & settlement balance
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsExpenseModalOpen(true)}
            style={styles.addExpenseBtn}
          >
            <Text style={styles.addExpenseIcon}>➕</Text>
            <Text style={styles.addExpenseText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        {/* Member Balances Table */}
        <BalanceTable
          balances={balancesData}
          sum={balanceSum}
          style={styles.balanceTable}
        />

        {/* Side-by-Side Action Buttons: Settle Up & Smart Settle */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setSettlePrefill(null);
              setIsSettleModalOpen(true);
            }}
            style={styles.settleUpBtn}
          >
            <Text style={styles.actionBtnIcon}>🤝</Text>
            <Text style={styles.settleUpBtnText}>Settle Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsSmartSettleModalOpen(true)}
            style={styles.smartSettleBtn}
          >
            <Text style={styles.smartSettleIcon}>✨</Text>
            <Text style={styles.smartSettleBtnText}>Smart Settle</Text>
            {simplifiedTransfers.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{simplifiedTransfers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Smart Tip Card */}
        <View style={styles.smartTipCard}>
          <View style={styles.tipBulbCircle}>
            <Text style={styles.bulbEmoji}>💡</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipHeading}>Smart Tip</Text>
            <Text style={styles.tipDescription}>
              {simplifiedTransfers.length > 0
                ? `${simplifiedTransfers[0].from_name} can settle up with ${simplifiedTransfers[0].to_name} for ${formatPKR(simplifiedTransfers[0].amount)} to clear the highest balance transfer.`
                : 'All accounts are balanced! Tap Smart Settle anytime to see minimal settlement paths.'}
            </Text>
          </View>
        </View>

        {/* Recent Expenses List */}
        <View style={styles.recentExpensesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Text style={styles.expensesCountText}>{expenses.length} Total</Text>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🧾</Text>
              <Text style={styles.emptyTitle}>No expenses recorded</Text>
              <Text style={styles.emptySubtitle}>Tap Add Expense above to split a bill.</Text>
            </View>
          ) : (
            expenses.map((item) => (
              <View key={item.id} style={styles.expenseCard}>
                <View style={styles.expenseLeft}>
                  <View style={styles.categoryIconCircle}>
                    <Text style={styles.categoryEmoji}>
                      {item.category === 'Groceries'
                        ? '🛒'
                        : item.category === 'Utilities'
                        ? '⚡'
                        : item.category === 'Cleaning'
                        ? '🧹'
                        : item.category === 'Entertainment'
                        ? '🎬'
                        : '🧾'}
                    </Text>
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.expenseMeta}>
                      Paid by {item.payer_name || item.payer_id} • {formatDate(item.expense_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>{formatPKR(item.amount)}</Text>
                  <Text style={styles.splitStrategyText}>
                    {item.split_type === 'equal' ? 'Equal split' : 'Custom split'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Manual Expense Form Modal */}
      <ExpenseForm
        visible={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        members={members}
        loggedInMemberId={user?.member_id}
        onSubmit={handleAddExpense}
        loading={actionLoading}
      />

      {/* Manual Settle Modal */}
      <SettleModal
        visible={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettlePrefill(null);
        }}
        members={members}
        loggedInMemberId={user?.member_id}
        initialSenderId={settlePrefill?.senderId}
        initialRecipientId={settlePrefill?.recipientId}
        initialAmount={settlePrefill?.amount}
        onSubmit={handleSettleSubmit}
        loading={actionLoading}
      />

      {/* Smart Settle Modal (Screen 3 View) */}
      <Modal
        visible={isSmartSettleModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSmartSettleModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <TouchableOpacity
                  onPress={() => setIsSmartSettleModalOpen(false)}
                  style={styles.backBtn}
                >
                  <Text style={styles.backBtnText}>✕ Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Smart Settle</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.smartIntroBox}>
                <Text style={styles.smartIntroTitle}>Fewest payments to get everyone even</Text>
                <View style={styles.algorithmPill}>
                  <Text style={styles.algorithmEmoji}>✨</Text>
                  <Text style={styles.algorithmText}>
                    Greedy algorithm minimized transactions to {simplifiedTransfers.length}{' '}
                    {simplifiedTransfers.length === 1 ? 'transfer' : 'transfers'}
                  </Text>
                </View>
              </View>

              {simplifiedTransfers.length === 0 ? (
                <View style={styles.settledCompleteCard}>
                  <Text style={styles.settledEmoji}>🎉</Text>
                  <Text style={styles.settledTitle}>All Roommates Settled Up!</Text>
                  <Text style={styles.settledDesc}>
                    There are no outstanding debts between roommates right now.
                  </Text>
                </View>
              ) : (
                simplifiedTransfers.map((tr, idx) => (
                  <SmartSettleCard
                    key={`${tr.from_id}-${tr.to_id}-${idx}`}
                    transfer={tr}
                    priority={idx + 1}
                    loggedInMemberId={user?.member_id}
                    onSettle={handleOneTapSettle}
                    loading={settlingTransferId === `${tr.from_id}-${tr.to_id}`}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  screenTitle: {
    ...theme.typography.headlineLg,
    color: theme.colors.onSurface,
  },
  screenSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    gap: 6,
    ...theme.shadows.primaryGlow,
  },
  addExpenseIcon: {
    fontSize: 14,
    color: theme.colors.onPrimary,
  },
  addExpenseText: {
    ...theme.typography.labelLg,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  balanceTable: {
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  settleUpBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.primaryGlow,
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  settleUpBtnText: {
    ...theme.typography.titleSm,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  smartSettleBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...theme.shadows.sm,
  },
  smartSettleIcon: {
    fontSize: 16,
  },
  smartSettleBtnText: {
    ...theme.typography.titleSm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: theme.colors.primaryFixed,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 10,
  },
  smartTipCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  tipBulbCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbEmoji: {
    fontSize: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipHeading: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  tipDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
    lineHeight: 18,
  },
  recentExpensesSection: {
    marginTop: theme.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  expensesCountText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
  },
  expenseCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  categoryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
  },
  expenseMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  expenseAmount: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  splitStrategyText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.full,
  },
  backBtnText: {
    ...theme.typography.labelLg,
    color: theme.colors.tertiary,
    fontWeight: '700',
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
  },
  modalScrollContent: {
    padding: theme.spacing.lg,
  },
  smartIntroBox: {
    marginBottom: theme.spacing.md,
  },
  smartIntroTitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.tertiary,
    marginBottom: theme.spacing.xs,
  },
  algorithmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    gap: 6,
    alignSelf: 'flex-start',
  },
  algorithmEmoji: {
    fontSize: 14,
  },
  algorithmText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '700',
  },
  settledCompleteCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  settledEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  settledTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  settledDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.tertiary,
    marginTop: 6,
    textAlign: 'center',
  },
});

