import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8080/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token alınıyor:', token ? `${token.substring(0, 20)}...` : 'Token yok');
      
      return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };
    } catch (error) {
      console.error('❌ Auth headers hatası:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'Request failed',
        status: response.status,
      };
    } catch (error) {
      console.error('API GET Error:', error);
      return {
        error: 'Network error',
        status: 0,
      };
    }
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      console.log('🌐 API POST isteği başlatılıyor');
      console.log('📍 Endpoint:', `${BASE_URL}${endpoint}`);
      console.log('📦 Gönderilecek veri:', JSON.stringify(body, null, 2));
      
      const headers = await this.getAuthHeaders();
      console.log('🔑 Headers:', JSON.stringify(headers, null, 2));
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      console.log('📈 Response status:', response.status);
      console.log('📈 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('📥 Response data:', JSON.stringify(data, null, 2));

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'Request failed',
        status: response.status,
      };
    } catch (error) {
      console.error('💥 API POST Error:', error);
      return {
        error: 'Network error',
        status: 0,
      };
    }
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'Request failed',
        status: response.status,
      };
    } catch (error) {
      console.error('API PUT Error:', error);
      return {
        error: 'Network error',
        status: 0,
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null; // DELETE might not return JSON
      }

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data?.message || 'Delete failed'),
        status: response.status,
      };
    } catch (error) {
      console.error('API DELETE Error:', error);
      return {
        error: 'Network error',
        status: 0,
      };
    }
  }
}

export default new ApiClient(); 