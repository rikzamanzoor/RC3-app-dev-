import axios from 'axios';
import { Platform, NativeModules } from 'react-native';
import { tokenStorage } from './tokenStorage';

const getHostFromScriptURL = () => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
};

export const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8081/api`;
  }
  const host = getHostFromScriptURL();
  if (host) {
    return `http://${host}:8081/api`;
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.62.14:8081/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorizedCallback = null;

export function setOnUnauthorizedCallback(cb) {
  onUnauthorizedCallback = cb;
}

// Request interceptor: attach token & ensure dynamic baseURL
apiClient.interceptors.request.use(
  async (config) => {
    const currentBase = getBaseUrl();
    if (currentBase) {
      config.baseURL = currentBase;
    }
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize errors and handle 401
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (!error.response) {
      // Network drop or unreachable
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Cannot reach server. Check your connection.',
      });
    }

    const { status, data, config } = error.response;
    const isLoginEndpoint = config.url && config.url.includes('/auth/login');

    if (status === 401 && !isLoginEndpoint) {
      await tokenStorage.clearToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback('Session expired. Please log in again.');
      }
    }

    // Contract error envelope: { error: { code, message, field } }
    if (data && data.error) {
      return Promise.reject({
        code: data.error.code || 'UNKNOWN_ERROR',
        message: data.error.message || 'An unexpected error occurred.',
        field: data.error.field,
      });
    }

    return Promise.reject({
      code: 'INTERNAL_ERROR',
      message: data?.message || 'Server error occurred.',
    });
  }
);

// --- Auth Endpoints ---
export const api = {
  login: (username, password) => apiClient.post('/auth/login', { username, password }),
  getMe: () => apiClient.get('/auth/me'),

  // --- Members ---
  getMembers: () => apiClient.get('/members'),

  // --- Shopping ---
  getShopping: (status) => apiClient.get('/shopping', { params: status ? { status } : {} }),
  addShoppingItem: (payload) => apiClient.post('/shopping', payload),
  checkoutShopping: (payload) => apiClient.post('/shopping/checkout', payload),

  // --- Expenses ---
  getExpenses: () => apiClient.get('/expenses'),
  addExpense: (payload) => apiClient.post('/expenses', payload),

  // --- Balances & Settlements ---
  getBalances: () => apiClient.get('/balances'),
  getSimplifiedBalances: () => apiClient.get('/balances/simplify'),
  settleUp: (payload) => apiClient.post('/settle', payload),

  // --- Budget ---
  getBudget: () => apiClient.get('/budget'),

  // --- Health ---
  checkHealth: () => apiClient.get('/health'),
};

