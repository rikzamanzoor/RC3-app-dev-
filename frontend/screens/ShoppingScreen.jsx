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
import { AddItemForm } from '../components/AddItemForm';
import { CheckoutModal } from '../components/CheckoutModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { StatusBadge } from '../components/StatusBadge';
import { theme } from '../utils/theme';

export function ShoppingScreen() {
  const { user } = useAuth();
  const { members, refreshKey, bumpRefresh } = useApp();

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getShopping();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const toggleItemSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddItem = async (itemData) => {
    setActionLoading(true);
    setError(null);
    try {
      await api.addShoppingItem(itemData);
      setIsAddModalOpen(false);
      bumpRefresh();
      fetchItems();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async (checkoutData) => {
    setActionLoading(true);
    setError(null);
    try {
      await api.checkoutShopping(checkoutData);
      setIsCheckoutModalOpen(false);
      setSelectedIds([]);
      bumpRefresh();
      fetchItems();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingItems = items.filter((i) => i.status === 'pending');
  const boughtItems = items.filter((i) => i.status === 'bought');
  const selectedPendingItems = pendingItems.filter((i) => selectedIds.includes(i.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
          {/* Subheader & Fast Add Trigger */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.screenTitle}>Shopping List</Text>
              <View style={styles.stockStatusRow}>
                <View style={styles.amberDot} />
                <Text style={styles.stockStatusText}>
                  3 roommates sharing • {pendingItems.length} to buy
                </Text>
              </View>
            </View>

            {/* Coral Circular Add Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsAddModalOpen(true)}
              style={styles.addBtn}
              accessibilityLabel="Add shopping item"
            >
              <Text style={styles.addBtnIcon}>➕</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          <ErrorBanner error={error} onDismiss={() => setError(null)} />

          {/* Roommate Shared Avatars & Summary Pills */}
          <View style={styles.sharedCartCard}>
            <View style={styles.sharedCartLeft}>
              <View style={styles.avatarGroup}>
                <View style={[styles.miniAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={styles.miniAvatarText}>A</Text>
                </View>
                <View style={[styles.miniAvatar, { backgroundColor: theme.colors.secondaryContainer, marginLeft: -8 }]}>
                  <Text style={[styles.miniAvatarText, { color: theme.colors.onSecondaryContainer }]}>Ay</Text>
                </View>
                <View style={[styles.miniAvatar, { backgroundColor: theme.colors.tertiary, marginLeft: -8 }]}>
                  <Text style={styles.miniAvatarText}>B</Text>
                </View>
              </View>
              <View>
                <Text style={styles.sharedCartTitle}>Shared Pantry</Text>
                <Text style={styles.sharedCartSubtitle}>Ali, Ayesha & Bilal</Text>
              </View>
            </View>

            <View style={styles.cartCountBadge}>
              <Text style={styles.cartEmoji}>🛍️</Text>
              <Text style={styles.cartCountText}>{pendingItems.length} to buy</Text>
            </View>
          </View>

          {/* Section: Needs Restock (Pending Items) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Needs Restock</Text>
            <Text style={styles.selectedCountText}>
              Selected:{' '}
              <Text style={styles.selectedCountBold}>{selectedIds.length}</Text>
            </Text>
          </View>

          {pendingItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Shared pantry is all stocked!</Text>
              <Text style={styles.emptySubtitle}>Tap the (+) button above to request an item.</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {pendingItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => toggleItemSelection(item.id)}
                    style={[
                      styles.itemCard,
                      isSelected && styles.itemCardSelected,
                    ]}
                  >
                    {/* Active highlight glow accent bar */}
                    {isSelected && <View style={styles.selectedAccentBar} />}

                    <View style={styles.itemLeft}>
                      {/* Coral Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          isSelected ? styles.checkboxChecked : styles.checkboxUnchecked,
                        ]}
                      >
                        <Text style={[styles.checkboxCheck, isSelected && styles.checkboxCheckActive]}>
                          {isSelected ? '✓' : ''}
                        </Text>
                      </View>

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.requested_qty} {item.unit}
                        </Text>
                      </View>
                    </View>

                    <StatusBadge status="pending" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Section: Already Bought */}
          {boughtItems.length > 0 && (
            <View style={styles.boughtSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.boughtTitleGroup}>
                  <Text style={styles.sectionTitleMuted}>Recently Purchased</Text>
                  <View style={styles.boughtCountPill}>
                    <Text style={styles.boughtCountText}>{boughtItems.length}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.itemsList}>
                {boughtItems.map((item) => (
                  <View key={item.id} style={styles.boughtItemCard}>
                    <View style={styles.itemLeft}>
                      <View style={styles.boughtCheckIconCircle}>
                        <Text style={styles.boughtCheckmark}>✓</Text>
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.boughtItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.boughtItemMeta}>
                          {item.requested_qty} {item.unit}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge status="bought" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Household Tip Box */}
          <View style={styles.householdTipBox}>
            <View style={styles.tipIconCircle}>
              <Text style={styles.tipEmoji}>💡</Text>
            </View>
            <View style={styles.tipTextWrap}>
              <Text style={styles.tipTitle}>Household Tip</Text>
              <Text style={styles.tipBody}>
                Items checked here automatically prepare split ledger receipts for dinner tonight!
              </Text>
            </View>
          </View>

          {/* Bottom spacing to ensure list doesn't get covered by floating checkout bar */}
          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Floating Checkout Bar */}
        {selectedIds.length > 0 && (
          <View style={styles.floatingCheckoutContainer}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setIsCheckoutModalOpen(true)}
              style={styles.floatingCheckoutBtn}
            >
              <View style={styles.floatingCheckoutLeft}>
                <Text style={styles.cartBtnEmoji}>🛒</Text>
                <Text style={styles.floatingCheckoutLabel}>
                  Checkout ({selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'})
                </Text>
              </View>
              <View style={styles.floatingCheckoutRight}>
                <Text style={styles.floatingCheckoutPillText}>Ready to settle</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Item Form Modal */}
        <AddItemForm
          visible={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddItem}
          loading={actionLoading}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          visible={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          selectedItems={selectedPendingItems}
          members={members}
          loggedInMemberId={user?.member_id}
          onSubmit={handleCheckout}
          loading={actionLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  screenTitle: {
    ...theme.typography.headlineLg,
    color: theme.colors.onSurface,
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondaryContainer,
  },
  stockStatusText: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.primaryGlow,
  },
  addBtnIcon: {
    fontSize: 20,
    color: theme.colors.onPrimary,
  },
  sharedCartCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sharedCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surfaceContainer,
  },
  miniAvatarText: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  sharedCartTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
  },
  sharedCartSubtitle: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
  },
  cartCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 5,
    ...theme.shadows.sm,
  },
  cartEmoji: {
    fontSize: 14,
  },
  cartCountText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '700',
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
  selectedCountText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
  },
  selectedCountBold: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  itemsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  itemCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  itemCardSelected: {
    backgroundColor: theme.colors.surfaceLowest,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryContainer,
  },
  selectedAccentBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: theme.colors.primaryContainer,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
    paddingLeft: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primaryContainer,
  },
  checkboxUnchecked: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  checkboxCheck: {
    fontSize: 16,
    fontWeight: '800',
  },
  checkboxCheckActive: {
    color: theme.colors.onPrimary,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
  },
  itemMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 1,
  },
  boughtSection: {
    marginTop: theme.spacing.xs,
    opacity: 0.85,
  },
  boughtTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleMuted: {
    ...theme.typography.titleSm,
    color: theme.colors.tertiary,
  },
  boughtCountPill: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  boughtCountText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    fontWeight: '700',
  },
  boughtItemCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boughtCheckIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: theme.colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boughtCheckmark: {
    fontSize: 14,
    color: theme.colors.tertiary,
    fontWeight: 'bold',
  },
  boughtItemTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.tertiary,
    textDecorationLine: 'line-through',
  },
  boughtItemMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.outline,
    marginTop: 1,
  },
  householdTipBox: {
    backgroundColor: theme.colors.primaryFixed,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  tipIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  tipEmoji: {
    fontSize: 18,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    ...theme.typography.titleSm,
    color: theme.colors.onPrimaryFixedVariant,
    fontWeight: '700',
  },
  tipBody: {
    ...theme.typography.bodySm,
    color: theme.colors.onPrimaryFixedVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  floatingCheckoutContainer: {
    position: 'absolute',
    bottom: 16,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  floatingCheckoutBtn: {
    height: 54,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.primaryGlow,
  },
  floatingCheckoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBtnEmoji: {
    fontSize: 20,
  },
  floatingCheckoutLabel: {
    ...theme.typography.titleSm,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  floatingCheckoutRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  floatingCheckoutPillText: {
    ...theme.typography.labelSm,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
});

