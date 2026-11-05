import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ShoppingScreen } from './screens/ShoppingScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { theme } from './utils/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return '🏠';
      case 'Shopping':
        return '🛒';
      case 'Expenses':
        return '🧾';
      default:
        return '●';
    }
  };

  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{getIcon()}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tertiary,
        tabBarLabelStyle: {
          ...theme.typography.labelSm,
          fontWeight: '700',
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
          ...theme.shadows.sm,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { status } = useAuth();

  // AUTHFE-04: Show warm splash indicator while checking initial auth status
  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.splashCard}>
          <Text style={styles.splashEmoji}>🏡</Text>
          <Text style={styles.splashTitle}>Shared Living</Text>
          <ActivityIndicator
            size="large"
            color={theme.colors.primaryContainer}
            style={styles.splashSpinner}
          />
        </View>
      </View>
    );
  }

  // AUTHFE-05: Navigation guard - Login when signed out, Tabs when signed in
  return (
    <NavigationContainer>
      {status === 'signedIn' ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <AuthProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  splashEmoji: {
    fontSize: 52,
    marginBottom: theme.spacing.sm,
  },
  splashTitle: {
    ...theme.typography.display,
    color: theme.colors.onSurface,
    fontWeight: '800',
  },
  splashSpinner: {
    marginTop: theme.spacing.lg,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: theme.colors.primaryFixed,
  },
  tabEmoji: {
    fontSize: 18,
    opacity: 0.7,
  },
  tabEmojiActive: {
    opacity: 1,
  },
});
