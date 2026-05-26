import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private baseUrl = 'http://10.0.2.2:8000/api';

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get token from storage
    let token = await storage.getItem('token');

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Set authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, try to refresh token by re-login
    if (response.status === 401) {
      console.log('Token expired, attempting re-login');
      const refreshSuccess = await this.refreshToken();

      if (refreshSuccess) {
        // Retry the request with new token
        token = await storage.getItem('token');
        headers.Authorization = `Bearer ${token}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }

      // If refresh failed, throw error
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
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
    return this.request('/transactions');
  }

  async getTransaction(id: number): Promise<any> {
    return this.request(`/transactions/${id}`);
  }

  async getServices(): Promise<any> {
    return this.request('/services');
  }

  async createTransaction(serviceId: number, totalPrice: number, paymentMethod: string = 'cash'): Promise<any> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        service_id: serviceId,
        total_price: totalPrice,
        payment_method: paymentMethod,
      }),
    });
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