import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { ErrorBanner } from './ErrorBanner';
import { theme } from '../utils/theme';

const UNITS = ['bottle', 'bag', 'pack', 'dozen'];

export function AddItemForm({ visible, onClose, onSubmit, loading = false }) {
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('bottle');
  const [qty, setQty] = useState('1');
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = () => {
    setValidationError(null);
    if (!title || !title.trim()) {
      setValidationError('Please enter an item title.');
      return;
    }
    const numQty = parseInt(qty, 10);
    if (isNaN(numQty) || numQty <= 0) {
      setValidationError('Quantity must be a positive integer.');
      return;
    }

    onSubmit({
      title: title.trim(),
      unit,
      requested_qty: numQty,
    });
  };

  const handleClose = () => {
    setTitle('');
    setUnit('bottle');
    setQty('1');
    setValidationError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetContainer}
          >
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Add Shopping Item</Text>
                  <Text style={styles.subtitle}>Add to the shared household pantry</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ErrorBanner error={validationError} onDismiss={() => setValidationError(null)} />

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ITEM NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Milk, Rice, Cooking Oil"
                  placeholderTextColor={theme.colors.outlineVariant}
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    setValidationError(null);
                  }}
                  autoFocus
                />
              </View>

              {/* Unit Selection Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>UNIT</Text>
                <View style={styles.chipsRow}>
                  {UNITS.map((u) => {
                    const isSelected = unit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setUnit(u)}
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
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Quantity Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>REQUESTED QUANTITY</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      const cur = parseInt(qty, 10) || 1;
                      if (cur > 1) setQty(String(cur - 1));
                    }}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.textInput, styles.qtyInput]}
                    keyboardType="number-pad"
                    value={qty}
                    onChangeText={(val) => setQty(val.replace(/[^0-9]/g, ''))}
                  />
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      const cur = parseInt(qty, 10) || 1;
                      setQty(String(cur + 1));
                    }}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <PrimaryButton
                title="Add to Shopping List"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitBtn}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    height: 40,
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
    ...theme.typography.labelLg,
  },
  chipTextSelected: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  chipTextUnselected: {
    color: theme.colors.tertiary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
});

