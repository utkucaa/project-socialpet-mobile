import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Question {
  id?: string;
  title: string;
  content: string;
  userId: number;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  answersCount?: number;
}

export interface Answer {
  id?: string;
  content: string;
  userId: number;
  questionId: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface QuestionData {
  title: string;
  content: string;
}

export interface AnswerData {
  content: string;
  questionId: number;
}

const BASE_URL = 'http://localhost:8080/api';

class CommunityService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('jwt_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getAuthHeaders() {
    const token = await this.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  // Tüm soruları getir
  async getQuestions(): Promise<Question[]> {
    try {
      const token = await this.getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient.get('/questions', { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Sorular yüklenirken bir hata oluştu');
    }
  }

  // Belirli bir soruyu getir
  async getQuestion(id: string): Promise<Question> {
    try {
      const token = await this.getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient.get(`/questions/${id}`, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Soru detayları yüklenirken bir hata oluştu');
    }
  }

  // Yeni soru oluştur
  async createQuestion(questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<Question> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post('/questions', questionData, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Soru eklenirken bir hata oluştu');
    }
  }

  // Soruya cevap ver
  async createAnswer(questionId: string, answerData: { content: string; userId: number }): Promise<Answer> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post(`/answers/question/${questionId}`, answerData, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevap eklenirken bir hata oluştu');
    }
  }

  // Belirli bir sorunun cevaplarını getir
  async getAnswers(questionId: string): Promise<Answer[]> {
    try {
      const response = await apiClient.get(`/answers/question/${questionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevaplar yüklenirken bir hata oluştu');
    }
  }

  // Cevabı düzenleme
  async updateAnswer(answerId: string, content: string): Promise<Answer> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.put(`/answers/${answerId}`, { content }, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevap güncellenirken bir hata oluştu');
    }
  }

  // Cevabı silme
  async deleteAnswer(answerId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await apiClient.delete(`/answers/${answerId}`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevap silinirken bir hata oluştu');
    }
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol et
  async checkAuthentication(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      return token !== null;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Mevcut kullanıcıyı getir
  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        return null;
      }
      return JSON.parse(userString);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export default new CommunityService(); 