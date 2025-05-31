import axios from 'axios';
import { storage } from '../storage';

// API base configuration
export const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token eklendi:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('Token bulunamadı, authenticated olmayan istek yapılıyor');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 Unauthorized durumunda token'ı temizle
    if (error.response?.status === 401) {
      console.log('401 hatası alındı, token temizleniyor');
      await storage.removeToken();
      await storage.removeUserData();
    }
    return Promise.reject(error);
  }
); 