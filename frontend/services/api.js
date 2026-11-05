import axios from 'axios';
import { tokenStorage } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorizedCallback = null;

export function setOnUnauthorizedCallback(cb) {
  onUnauthorizedCallback = cb;
}

// Request interceptor: attach token
apiClient.interceptors.request.use(
  async (config) => {
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

