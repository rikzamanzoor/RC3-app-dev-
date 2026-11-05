import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

// In-memory fallback for web environment where SecureStore is not natively supported
let webMemoryToken = null;

export const tokenStorage = {
  async getToken() {
    try {
      if (Platform.OS === 'web') {
        return webMemoryToken;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  },

  async setToken(token) {
    try {
      if (Platform.OS === 'web') {
        webMemoryToken = token;
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      // safe fallback
    }
  },

  async clearToken() {
    try {
      if (Platform.OS === 'web') {
        webMemoryToken = null;
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      // safe fallback
    }
  },
};

