import { AxiosResponse } from 'axios';
import { storage } from '../storage';
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
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  joinDate: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
}

class AuthService {
  async login(payload: LoginPayload): Promise<AxiosResponse<AuthResponse>> {
    const response = await api.post('/api/auth/login', payload);
    
    // Login başarılıysa token ve user data'yı kaydet
    if (response.data) {
      await storage.setToken(response.data.accessToken);
      await storage.setUserData({
        userId: response.data.userId,
        email: response.data.email,
        username: response.data.username,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        avatarUrl: response.data.avatarUrl,
        role: response.data.role,
        joinDate: response.data.joinDate
      });
      console.log('Token ve kullanıcı verisi kaydedildi');
    }
    
    return response;
  }

  async register(payload: RegisterPayload): Promise<AxiosResponse<AuthResponse>> {
    const response = await api.post('/api/auth/register', payload);
    
    // Register başarılıysa token ve user data'yı kaydet
    if (response.data) {
      await storage.setToken(response.data.accessToken);
      await storage.setUserData({
        userId: response.data.userId,
        email: response.data.email,
        username: response.data.username,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        avatarUrl: response.data.avatarUrl,
        role: response.data.role,
        joinDate: response.data.joinDate
      });
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

  async logout(): Promise<AxiosResponse<void>> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API hatası:', error);
    } finally {
      // Her durumda local storage'ı temizle
      await storage.clearAll();
      console.log('Kullanıcı çıkış yaptı, storage temizlendi');
    }
    
    return {} as AxiosResponse<void>;
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol et
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getToken();
    return !!token;
  }

  // Mevcut kullanıcı verilerini al
  async getCurrentUser(): Promise<any | null> {
    return await storage.getUserData();
  }
}

export const authService = new AuthService(); 