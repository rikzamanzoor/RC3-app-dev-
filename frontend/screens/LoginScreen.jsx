import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { theme } from '../utils/theme';

export function LoginScreen() {
  const { login, sessionError, clearSessionError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLoginError(null);
    clearSessionError();

    if (!username.trim() || !password.trim()) {
      setLoginError({ message: 'Please enter both username and password.' });
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  const prefillAccount = (user) => {
    setUsername(user);
    setPassword('Demo@1234');
    setLoginError(null);
    clearSessionError();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Branding Section */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoEmoji}>🏡</Text>
              </View>
              <Text style={styles.brandTitle}>Shared Living</Text>
              <Text style={styles.brandSubtitle}>
                Fair household expense sharing & shopping pantry
              </Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Sign in to your household</Text>
              <Text style={styles.cardSubheading}>
                Enter your roommate account credentials
              </Text>

              {/* Error Banners */}
              {sessionError && (
                <ErrorBanner
                  error={{ code: 'SESSION_EXPIRED', message: sessionError }}
                  onDismiss={clearSessionError}
                />
              )}
              {loginError && (
                <ErrorBanner
                  error={loginError}
                  onDismiss={() => setLoginError(null)}
                />
              )}

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="ali, ayesha, or bilal"
                  placeholderTextColor={theme.colors.outlineVariant}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    setLoginError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input with Show/Hide toggle */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Enter password"
                    placeholderTextColor={theme.colors.outlineVariant}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setLoginError(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.toggleBtn}
                  >
                    <Text style={styles.toggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <PrimaryButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginBtn}
              />

              {/* Demo Accounts Quick-Select for fast demo runs */}
              <View style={styles.demoSection}>
                <Text style={styles.demoLabel}>Demo Quick Tap (Demo@1234):</Text>
                <View style={styles.demoButtonsRow}>
                  {['ali', 'ayesha', 'bilal'].map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => prefillAccount(u)}
                      style={[
                        styles.demoChip,
                        username.toLowerCase() === u && styles.demoChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.demoChipText,
                          username.toLowerCase() === u && styles.demoChipTextActive,
                        ]}
                      >
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  logoEmoji: {
    fontSize: 34,
  },
  brandTitle: {
    ...theme.typography.display,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  brandSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.tertiary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  card: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  cardHeading: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
  },
  cardSubheading: {
    ...theme.typography.bodySm,
    color: theme.colors.tertiary,
    marginTop: 2,
    marginBottom: theme.spacing.lg,
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
    height: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceLow,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 64,
  },
  toggleBtn: {
    position: 'absolute',
    right: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  toggleText: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  loginBtn: {
    marginTop: theme.spacing.xs,
    height: 52,
  },
  demoSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceLow,
    alignItems: 'center',
  },
  demoLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    marginBottom: theme.spacing.sm,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  demoChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLow,
  },
  demoChipActive: {
    backgroundColor: theme.colors.primaryFixed,
    borderWidth: 1,
    borderColor: theme.colors.primaryContainer,
  },
  demoChipText: {
    ...theme.typography.labelSm,
    color: theme.colors.tertiary,
    fontWeight: '600',
  },
  demoChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

