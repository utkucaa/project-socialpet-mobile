import { AxiosResponse } from 'axios';
import { api } from './api.ts';

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
    return api.post('/api/auth/login', payload);
  }

  async register(payload: RegisterPayload): Promise<AxiosResponse<AuthResponse>> {
    return api.post('/api/auth/register', payload);
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
    return api.post('/auth/logout');
  }
}

export const authService = new AuthService(); 