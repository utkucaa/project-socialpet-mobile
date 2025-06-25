import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponse } from 'axios';
import { api } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// Backend'den dönen response format - curl documentation'a uygun
export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

class AuthService {
  async login(payload: LoginPayload): Promise<AxiosResponse<AuthResponse>> {
    const response = await api.post('/auth/login', payload);
    
    // Login başarılıysa token ve user data'yı kaydet
    if (response.data) {
      await AsyncStorage.setItem('jwt_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('Token ve kullanıcı verisi kaydedildi');
    }
    
    return response;
  }

  async register(payload: RegisterPayload): Promise<AxiosResponse<AuthResponse>> {
    const response = await api.post('/auth/register', payload);
    
    // Register başarılıysa token ve user data'yı kaydet
    if (response.data) {
      await AsyncStorage.setItem('jwt_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('Token ve kullanıcı verisi kaydedildi');
    }
    
    return response;
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<AxiosResponse<void>> {
    return api.post('/auth/forgot-password', payload);
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<AxiosResponse<void>> {
    return api.post('/auth/reset-password', payload);
  }

  async verifyEmail(token: string): Promise<AxiosResponse<void>> {
    return api.post(`/auth/verify-email/${token}`);
  }

  async refreshToken(): Promise<AxiosResponse<{ token: string }>> {
    return api.post('/auth/refresh-token');
  }

  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        await api.post('/auth/logout', null, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API hatası:', error);
    } finally {
      // Her durumda local storage'ı temizle
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user');
      console.log('Kullanıcı çıkış yaptı, storage temizlendi');
    }
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol et
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('jwt_token');
    return !!token;
  }

  // Mevcut kullanıcı verilerini al
  async getCurrentUser(): Promise<any | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }
}

export const authService = new AuthService(); 