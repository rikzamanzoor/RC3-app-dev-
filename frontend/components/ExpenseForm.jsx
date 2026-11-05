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
import { todayDate, formatPKR } from '../utils/format';
import { theme } from '../utils/theme';

const CATEGORIES = ['Groceries', 'Utilities', 'Entertainment', 'Cleaning', 'Other'];

export function ExpenseForm({
  visible,
  onClose,
  members = [],
  loggedInMemberId,
  onSubmit,
  loading = false,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayDate());
  const [payerId, setPayerId] = useState(loggedInMemberId || 'M01');
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'custom'

  // Equal split: which members share
  const [equalMembers, setEqualMembers] = useState([]);

  // Custom split: memberId -> amount string
  const [customAmounts, setCustomAmounts] = useState({});

  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setCategory('Groceries');
      setAmount('');
      setExpenseDate(todayDate());
      setPayerId(loggedInMemberId || 'M01');
      setSplitType('equal');
      setEqualMembers(members.map((m) => m.id));

      const initialCustom = {};
      members.forEach((m) => {
        initialCustom[m.id] = '';
      });
      setCustomAmounts(initialCustom);
      setValidationError(null);
    }
  }, [visible, loggedInMemberId, members]);

  const toggleEqualMember = (memberId) => {
    if (equalMembers.includes(memberId)) {
      if (equalMembers.length === 1) {
        setValidationError('At least one member must be included in the split.');
        return;
      }
      setEqualMembers(equalMembers.filter((id) => id !== memberId));
    } else {
      setEqualMembers([...equalMembers, memberId]);
    }
  };

  const handleCustomAmountChange = (memberId, val) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [memberId]: val,
    }));
    setValidationError(null);
  };

  // Compute live sum for custom split
  const customSum = Object.values(customAmounts).reduce((acc, curr) => {
    const n = parseFloat(curr) || 0;
    return acc + n;
  }, 0);

  const handleSubmit = () => {
    setValidationError(null);

    if (!title || !title.trim()) {
      setValidationError('Please enter an expense title.');
      return;
    }

    const totalAmt = parseFloat(amount);
    if (isNaN(totalAmt) || totalAmt <= 0) {
      setValidationError('Please enter a valid amount greater than 0.');
      return;
    }

    if (splitType === 'equal') {
      if (equalMembers.length === 0) {
        setValidationError('Select at least one member to share the expense.');
        return;
      }

      onSubmit({
        title: title.trim(),
        category,
        amount: totalAmt,
        payer_id: payerId,
        split_type: 'equal',
        expense_date: expenseDate || todayDate(),
        splits: equalMembers.map((id) => ({ member_id: id })),
      });
    } else {
      // Custom split validation: sum of custom splits must match total amount
      const diff = Math.abs(customSum - totalAmt);
      if (diff > 0.01) {
        setValidationError(
          `Custom splits sum (${formatPKR(customSum)}) does not match total amount (${formatPKR(totalAmt)}).`
        );
        return;
      }

      const splitsPayload = members
        .map((m) => ({
          member_id: m.id,
          amount: parseFloat(customAmounts[m.id]) || 0,
        }))
        .filter((s) => s.amount > 0);

      onSubmit({
        title: title.trim(),
        category,
        amount: totalAmt,
        payer_id: payerId,
        split_type: 'custom',
        expense_date: expenseDate || todayDate(),
        splits: splitsPayload,
      });
    }
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
                <Text style={styles.title}>Record Expense</Text>
                <Text style={styles.subtitle}>Add a household bill or shared purchase</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ErrorBanner error={validationError} onDismiss={() => setValidationError(null)} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EXPENSE TITLE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Electricity Bill, Internet, Cleaning"
                  placeholderTextColor={theme.colors.outlineVariant}
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    setValidationError(null);
                  }}
                  autoFocus
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TOTAL AMOUNT (PKR)</Text>
                <View style={styles.currencyInputRow}>
                  <Text style={styles.currencyPrefix}>PKR</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.outlineVariant}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={(val) => {
                      setAmount(val);
                      setValidationError(null);
                    }}
                  />
                </View>
              </View>

              {/* Category Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryRow}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={[
                            styles.categoryChip,
                            isSelected ? styles.categorySelected : styles.categoryUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              isSelected ? styles.categoryTextSelected : styles.categoryTextUnselected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
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

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DATE (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={expenseDate}
                  onChangeText={setExpenseDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.outlineVariant}
                />
              </View>

              {/* Split Strategy Toggle: Equal vs Custom */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SPLIT STRATEGY</Text>
                <View style={styles.strategyRow}>
                  <TouchableOpacity
                    onPress={() => setSplitType('equal')}
                    style={[
                      styles.strategyBtn,
                      splitType === 'equal' ? styles.strategyBtnActive : styles.strategyBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.strategyText,
                        splitType === 'equal' ? styles.strategyTextActive : styles.strategyTextInactive,
                      ]}
                    >
                      Equal Split
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSplitType('custom')}
                    style={[
                      styles.strategyBtn,
                      splitType === 'custom' ? styles.strategyBtnActive : styles.strategyBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.strategyText,
                        splitType === 'custom' ? styles.strategyTextActive : styles.strategyTextInactive,
                      ]}
                    >
                      Custom Split
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Equal Split details */}
              {splitType === 'equal' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SPLIT EQUALLY BETWEEN</Text>
                  <View style={styles.chipsRow}>
                    {members.map((m) => {
                      const isChecked = equalMembers.includes(m.id);
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => toggleEqualMember(m.id)}
                          style={[
                            styles.equalChip,
                            isChecked ? styles.equalChipChecked : styles.equalChipUnchecked,
                          ]}
                        >
                          <Text style={styles.checkIcon}>{isChecked ? '✓' : '○'}</Text>
                          <Text
                            style={[
                              styles.chipText,
                              isChecked ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}
                          >
                            {m.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Custom Split details */}
              {splitType === 'custom' && (
                <View style={styles.inputGroup}>
                  <View style={styles.customHeader}>
                    <Text style={styles.inputLabel}>SPECIFY AMOUNT PER MEMBER</Text>
                    <Text
                      style={[
                        styles.customSumIndicator,
                        Math.abs(customSum - (parseFloat(amount) || 0)) < 0.01
                          ? styles.customSumMatch
                          : styles.customSumMismatch,
                      ]}
                    >
                      Sum: {formatPKR(customSum)}
                    </Text>
                  </View>
                  {members.map((m) => (
                    <View key={m.id} style={styles.customMemberRow}>
                      <Text style={styles.customMemberName}>{m.name}</Text>
                      <View style={styles.customInputWrap}>
                        <Text style={styles.customInputPrefix}>PKR</Text>
                        <TextInput
                          style={styles.customInput}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={theme.colors.outlineVariant}
                          value={customAmounts[m.id]}
                          onChangeText={(val) => handleCustomAmountChange(m.id, val)}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <PrimaryButton
                title="Save Expense"
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
    maxHeight: '92%',
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
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs + 2,
  },
  textInput: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceLow,
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
  categoryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  categorySelected: {
    backgroundColor: theme.colors.primaryFixed,
    borderColor: theme.colors.primaryContainer,
  },
  categoryUnselected: {
    backgroundColor: theme.colors.surfaceContainer,
    borderColor: 'transparent',
  },
  categoryText: {
    ...theme.typography.labelLg,
  },
  categoryTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  categoryTextUnselected: {
    color: theme.colors.tertiary,
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
  strategyRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.full,
    padding: 3,
  },
  strategyBtn: {
    flex: 1,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyBtnActive: {
    backgroundColor: theme.colors.surfaceLowest,
    ...theme.shadows.sm,
  },
  strategyBtnInactive: {
    backgroundColor: 'transparent',
  },
  strategyText: {
    ...theme.typography.titleSm,
  },
  strategyTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  strategyTextInactive: {
    color: theme.colors.tertiary,
  },
  equalChip: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  equalChipChecked: {
    backgroundColor: theme.colors.primaryFixed,
    borderColor: theme.colors.primaryContainer,
  },
  equalChipUnchecked: {
    backgroundColor: theme.colors.surfaceLow,
    borderColor: theme.colors.border,
  },
  checkIcon: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  customSumIndicator: {
    ...theme.typography.labelSm,
    fontWeight: '700',
  },
  customSumMatch: {
    color: theme.colors.success,
  },
  customSumMismatch: {
    color: theme.colors.error,
  },
  customMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  customMemberName: {
    ...theme.typography.titleSm,
    color: theme.colors.onSurface,
    width: 80,
  },
  customInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLow,
    paddingHorizontal: theme.spacing.sm,
  },
  customInputPrefix: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginRight: 6,
  },
  customInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
});

