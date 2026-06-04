import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Create a storage wrapper that handles different environments
class StorageService {
  private inMemoryStorage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    try {
      console.log('Storage: Attempting SecureStore for', key);
      const value = await SecureStore.getItemAsync(key);
      console.log('Storage: SecureStore successful for', key, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.warn('SecureStore failed:', error instanceof Error ? error.message : String(error));
      console.warn('SecureStore not available, trying AsyncStorage');
    }

    try {
      console.log('Storage: Attempting AsyncStorage for', key);
      const value = await AsyncStorage.getItem(key);
      console.log('Storage: AsyncStorage successful for', key, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.warn('AsyncStorage failed:', error instanceof Error ? error.message : String(error));
      console.warn('AsyncStorage not available, trying fallbacks');
    }

    // Try localStorage for web
    try {
      if (typeof localStorage !== 'undefined') {
        console.log('Storage: Using localStorage for', key);
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('localStorage not available, using in-memory storage');
    }

    // Final fallback: in-memory storage
    console.log('Storage: Using in-memory storage for', key);
    return this.inMemoryStorage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      console.log('Storage: Attempting SecureStore set for', key);
      await SecureStore.setItemAsync(key, value);
      console.log('Storage: SecureStore set successful');
      return;
    } catch (error) {
      console.warn('SecureStore set failed:', error instanceof Error ? error.message : String(error));
      console.warn('SecureStore not available, trying AsyncStorage');
    }

    try {
      await AsyncStorage.setItem(key, value);
      console.log('Storage: AsyncStorage set successful');
      return;
    } catch (error) {
      console.warn('AsyncStorage failed:', error instanceof Error ? error.message : String(error));
      console.warn('AsyncStorage not available, trying fallbacks');
    }

    // Try localStorage for web
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        console.log('Storage: localStorage set successful');
        return;
      }
    } catch (error) {
      console.warn('localStorage not available, using in-memory storage');
    }

    // Final fallback: in-memory storage
    console.log('Storage: Using in-memory storage set');
    this.inMemoryStorage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log('Storage: SecureStore delete successful');
      return;
    } catch (error) {
      console.warn('SecureStore delete failed, trying AsyncStorage');
    }

    try {
      await AsyncStorage.removeItem(key);
      console.log('Storage: AsyncStorage delete successful');
      return;
    } catch (error) {
      console.warn('AsyncStorage delete failed, trying fallbacks');
    }

    // Try localStorage for web
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        console.log('Storage: localStorage delete successful');
        return;
      }
    } catch (error) {
      console.warn('localStorage not available, using in-memory storage');
    }

    // Final fallback: in-memory storage
    console.log('Storage: Using in-memory storage delete');
    this.inMemoryStorage.delete(key);
  }
}

// API helper with automatic token refresh
class ApiService {
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 30_000;

constructor() {
  if (__DEV__) {
    // CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
    this.baseUrl = 'http://10.13.18.228:8000/api';
  } else {
    this.baseUrl = 'https://your-production-domain.com/api';
  }

  console.log('API URL:', this.baseUrl);
}

  private getCached(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    let token = await storage.getItem('token');

    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    headers['Accept'] = 'application/json';
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseContentType = response.headers.get('content-type') || '';

    const parseJson = async (res: Response) => {
      try {
        return await res.json();
      } catch {
        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('Server returned an HTML page instead of JSON. Make sure you are logged in and the API URL is correct.');
        }
        throw new Error(`Invalid JSON response from server: ${text.slice(0, 200)}`);
      }
    };

    if (response.status === 401) {
      console.log('Token expired, attempting re-login');
      const refreshSuccess = await this.refreshToken();

      if (refreshSuccess) {
        token = (await storage.getItem('token')) || token;
        headers['Authorization'] = `Bearer ${token}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        if (retryResponse.ok) {
          return parseJson(retryResponse);
        }
      }

      await storage.removeItem('token');
      await storage.removeItem('user');
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      if (responseContentType.includes('application/json')) {
        const errorData = await parseJson(response);
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }
      const errorText = await response.text();
      throw new Error(errorText || `API request failed: ${response.status}`);
    }

    if (responseContentType.includes('application/json')) {
      return parseJson(response);
    }

    const text = await response.text();
    if (text.trim().startsWith('<')) {
      throw new Error('Server returned HTML instead of JSON. Check that the API URL is correct and you are properly authenticated.');
    }

    return text;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // Get stored credentials
      const userData = await storage.getItem('user');
      if (!userData) {
        return false;
      }

      const user = JSON.parse(userData);
      const loginResponse = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: 'password', // This is a demo, in real app you'd need secure credential storage
        }),
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        await storage.setItem('token', data.token);
        console.log('Token refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

    async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    address: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  }

  async getTransactions(): Promise<any> {
    const cached = this.getCached('/transactions');
    if (cached) return cached;
    const data = await this.request('/transactions');
    this.setCache('/transactions', data);
    return data;
  }

  async getTransaction(id: number): Promise<any> {
    const key = `/transactions/${id}`;
    const cached = this.getCached(key);
    if (cached) return cached;
    const data = await this.request(key);
    this.setCache(key, data);
    return data;
  }

  async getServices(): Promise<any> {
    const cached = this.getCached('/services');
    if (cached) return cached;
    const data = await this.request('/services');
    this.setCache('/services', data);
    return data;
  }

  async createTransaction(serviceId: number, totalPrice: number, amount: number, paymentMethod: string = 'cash'): Promise<any> {
    this.cache.delete('/transactions');
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        service_id: serviceId,
        total_price: totalPrice,
        amount: amount,
        payment_method: paymentMethod,
      }),
    });
  }



  async uploadTransactionProof(transactionId: number, uri: string): Promise<any> {
    const url = `${this.baseUrl}/transactions/${transactionId}/payment-proof`;

    if (!transactionId) {
      throw new Error('Invalid transaction ID');
    }

    let token = await storage.getItem('token');

    if (!token) {
      throw new Error('No authentication token available');
    }

    const fileName = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileName || '');
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const form = new FormData();
    form.append('payment_proof', {
      uri,
      name: fileName,
      type,
    } as any);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return { success: true };
  }

  async getProfile(): Promise<any> {
    return this.request('/profile');
  }

  async updateProfile(data: { name: string; phone: string; address: string }): Promise<any> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const storage = new StorageService();
export const api = new ApiService();
