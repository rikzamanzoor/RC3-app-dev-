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

export function SettleModal({
  visible,
  onClose,
  members = [],
  loggedInMemberId,
  onSubmit,
  loading = false,
  initialSenderId,
  initialRecipientId,
  initialAmount,
}) {
  const [senderId, setSenderId] = useState(initialSenderId || loggedInMemberId || 'M01');
  const [recipientId, setRecipientId] = useState(initialRecipientId || 'M02');
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (visible) {
      const sId = initialSenderId || loggedInMemberId || 'M01';
      setSenderId(sId);
      // Default recipient to first member that is not sender
      const other = members.find((m) => m.id !== sId);
      setRecipientId(initialRecipientId || (other ? other.id : 'M02'));
      setAmount(initialAmount ? String(initialAmount) : '');
      setValidationError(null);
    }
  }, [visible, loggedInMemberId, initialSenderId, initialRecipientId, initialAmount, members]);

  // AUTHFE-11: Caller must be sender or recipient
  const isParty = loggedInMemberId === senderId || loggedInMemberId === recipientId;

  const handleSubmit = () => {
    setValidationError(null);

    if (senderId === recipientId) {
      setValidationError('Sender and recipient cannot be the same member.');
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setValidationError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!isParty) {
      setValidationError('Only the people involved can record this payment.');
      return;
    }

    onSubmit({
      sender_id: senderId,
      recipient_id: recipientId,
      amount: amtNum,
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
                <Text style={styles.title}>Record Settlement</Text>
                <Text style={styles.subtitle}>Direct debt payment between roommates</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ErrorBanner error={validationError} onDismiss={() => setValidationError(null)} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sender Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WHO IS SENDING MONEY? (PAYER / DEBTOR)</Text>
                <View style={styles.chipsRow}>
                  {members.map((m) => {
                    const isSelected = senderId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => {
                          setSenderId(m.id);
                          setValidationError(null);
                        }}
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

              {/* Recipient Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WHO IS RECEIVING MONEY? (CREDITOR)</Text>
                <View style={styles.chipsRow}>
                  {members.map((m) => {
                    const isSelected = recipientId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => {
                          setRecipientId(m.id);
                          setValidationError(null);
                        }}
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

              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AMOUNT (PKR)</Text>
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
                    autoFocus
                  />
                </View>
              </View>

              {/* Auth Warning Hint if logged-in user is not involved */}
              {!isParty && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    🔒 Note: You are logged in as{' '}
                    <Text style={styles.hintBold}>{loggedInMemberId}</Text>. Settle payments can
                    only be recorded by the sender or recipient involved.
                  </Text>
                </View>
              )}

              <PrimaryButton
                title="Confirm Settlement"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !isParty}
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
    marginBottom: theme.spacing.lg,
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
  hintBox: {
    backgroundColor: theme.colors.surfaceLow,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondaryContainer,
  },
  hintText: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    lineHeight: 18,
  },
  hintBold: {
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
});

