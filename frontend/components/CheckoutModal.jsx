import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { ErrorBanner } from './ErrorBanner';
import { theme } from '../utils/theme';

export function CheckoutModal({
  visible,
  onClose,
  selectedItems = [],
  members = [],
  loggedInMemberId,
  onSubmit,
  loading = false,
}) {
  const [totalPaid, setTotalPaid] = useState('');
  const [payerId, setPayerId] = useState(loggedInMemberId || 'M01');
  const [splitMembers, setSplitMembers] = useState([]);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (visible) {
      setPayerId(loggedInMemberId || 'M01');
      // Default split members: all members
      setSplitMembers(members.map((m) => m.id));
      setTotalPaid('');
      setValidationError(null);
    }
  }, [visible, loggedInMemberId, members]);

  const toggleSplitMember = (memberId) => {
    if (splitMembers.includes(memberId)) {
      if (splitMembers.length === 1) {
        setValidationError('At least one member must share this expense.');
        return;
      }
      setSplitMembers(splitMembers.filter((id) => id !== memberId));
    } else {
      setSplitMembers([...splitMembers, memberId]);
    }
  };

  const handleSubmit = () => {
    setValidationError(null);
    const amountNum = parseFloat(totalPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      setValidationError('Please enter a valid total paid amount greater than 0.');
      return;
    }
    if (splitMembers.length === 0) {
      setValidationError('Select at least one member to split the cost.');
      return;
    }

    onSubmit({
      item_ids: selectedItems.map((item) => item.id),
      total_paid: amountNum,
      payer_id: payerId,
      split_members: splitMembers,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Checkout Groceries</Text>
                <Text style={styles.subtitle}>
                  Settling {selectedItems.length} pantry {selectedItems.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ErrorBanner error={validationError} onDismiss={() => setValidationError(null)} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selected items summary */}
              <View style={styles.itemsBox}>
                <Text style={styles.itemsLabel}>ITEMS TO PURCHASE</Text>
                <View style={styles.itemsRow}>
                  {selectedItems.map((item) => (
                    <View key={item.id} style={styles.itemTag}>
                      <Text style={styles.itemTagText}>
                        {item.title} ({item.requested_qty} {item.unit})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Total Paid Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TOTAL AMOUNT PAID (PKR)</Text>
                <View style={styles.currencyInputRow}>
                  <Text style={styles.currencyPrefix}>PKR</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.outlineVariant}
                    keyboardType="decimal-pad"
                    value={totalPaid}
                    onChangeText={(val) => {
                      setTotalPaid(val);
                      setValidationError(null);
                    }}
                    autoFocus
                  />
                </View>
              </View>

              {/* Payer Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PAID BY</Text>
                <View style={styles.chipsRow}>
                  {members.map((m) => {
                    const isSelected = payerId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setPayerId(m.id)}
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
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Split Members Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SPLIT EQUALLY BETWEEN</Text>
                <View style={styles.splitRow}>
                  {members.map((m) => {
                    const isChecked = splitMembers.includes(m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => toggleSplitMember(m.id)}
                        style={[
                          styles.splitChip,
                          isChecked ? styles.splitChipChecked : styles.splitChipUnchecked,
                        ]}
                      >
                        <Text style={styles.checkIcon}>{isChecked ? '✓' : '○'}</Text>
                        <Text
                          style={[
                            styles.splitText,
                            isChecked ? styles.splitTextChecked : styles.splitTextUnchecked,
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <PrimaryButton
                title="Confirm & Record Expense"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 27, 24, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: theme.colors.surfaceLowest,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.tertiary,
    fontWeight: 'bold',
  },
  itemsBox: {
    backgroundColor: theme.colors.surfaceLow,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
  },
  itemsLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginBottom: 6,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs + 2,
  },
  itemTag: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  itemTagText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurface,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs + 2,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLow,
    paddingHorizontal: theme.spacing.md,
  },
  currencyPrefix: {
    ...theme.typography.titleSm,
    color: theme.colors.primary,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.colors.primaryContainer,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surfaceContainer,
  },
  chipText: {
    ...theme.typography.titleSm,
  },
  chipTextSelected: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  chipTextUnselected: {
    color: theme.colors.tertiary,
  },
  splitRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  splitChip: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  splitChipChecked: {
    backgroundColor: theme.colors.primaryFixed,
    borderColor: theme.colors.primaryContainer,
  },
  splitChipUnchecked: {
    backgroundColor: theme.colors.surfaceLow,
    borderColor: theme.colors.border,
  },
  checkIcon: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  splitText: {
    ...theme.typography.labelLg,
  },
  splitTextChecked: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  splitTextUnchecked: {
    color: theme.colors.tertiary,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
});

