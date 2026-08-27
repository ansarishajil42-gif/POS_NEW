import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getBaseUrl();

// Token Storage Abstraction
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const storage = {
  setToken: async (token: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('[Storage Error] Failed to set token', error);
    }
  },
  getToken: async () => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('[Storage Error] Failed to get token', error);
      return null;
    }
  },
  removeToken: async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('[Storage Error] Failed to remove token', error);
    }
  },
  setUser: async (user: any) => {
    try {
      const userStr = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, userStr);
      } else {
        await SecureStore.setItemAsync(USER_KEY, userStr);
      }
    } catch (error) {
      console.error('[Storage Error] Failed to set user', error);
    }
  },
  getUser: async () => {
    try {
      let userStr;
      if (Platform.OS === 'web') {
        userStr = localStorage.getItem(USER_KEY);
      } else {
        userStr = await SecureStore.getItemAsync(USER_KEY);
      }
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[Storage Error] Failed to get user', error);
      return null;
    }
  },
  clearSession: async () => {
    await storage.removeToken();
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (error) {
      console.error('[Storage Error] Failed to clear session', error);
    }
  },
};

// API Client
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

const fetchWithTimeout = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out');
    }
    // Network errors usually don't have a status
    throw new ApiError(0, 'Network unavailable or request failed');
  }
};

const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await storage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (__DEV__) {
    // Safe logging - don't log auth headers or bodies containing passwords
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);
  }

  const response = await fetchWithTimeout(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T; // No content
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : {};
  }

  if (!response.ok) {
    let errorMessage = data?.error || data?.message || 'An error occurred';
    
    // Status specific handling
    if (response.status === 401) {
      errorMessage = data?.error || 'Unauthorized - Please log in again';
    } else if (response.status === 403) {
      errorMessage = data?.error || 'Forbidden - You do not have permission';
    } else if (response.status === 404) {
      errorMessage = data?.error || 'Resource not found';
    } else if (response.status === 422) {
      errorMessage = data?.error || 'Validation error';
    } else if (response.status >= 500) {
      errorMessage = data?.error || 'Internal server error';
    }

    if (__DEV__) {
      console.error(`[API Error] ${response.status} ${url} - ${errorMessage}`);
    }

    throw new ApiError(response.status, errorMessage, data);
  }

  // Handle response envelope if backend wraps everything in { data: ... }
  // Based on current inspection, it returns object directly (e.g., { message, user, token })
  return data as T;
};

export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
