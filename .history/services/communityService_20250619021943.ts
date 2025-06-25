import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Question {
  id?: string;
  title: string;
  content: string;
  userId: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  answersCount?: number;
}

export interface Answer {
  id?: string;
  content: string;
  userId: string;
  questionId: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
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

const BASE_URL = 'http://localhost:8080';

class CommunityService {
  
  // Tüm soruları getir ve cevap sayısını hesapla
  async getQuestions(): Promise<Question[]> {
    try {
      const response = await apiClient.get('/questions');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Sorular yüklenirken bir hata oluştu');
    }
  }

  // Belirli bir soruyu getir ve cevaplarını dahil et
  async getQuestion(id: string): Promise<Question> {
    try {
      const response = await apiClient.get(`/questions/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Soru detayları yüklenirken bir hata oluştu');
    }
  }

  // Yeni soru oluştur
  async createQuestion(questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<Question> {
    try {
      const response = await apiClient.post('/questions', questionData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Soru eklenirken bir hata oluştu');
    }
  }

  // Soruya cevap ver
  async createAnswer(questionId: string, answerData: Omit<Answer, 'id' | 'questionId' | 'createdAt' | 'updatedAt' | 'user'>): Promise<Answer> {
    try {
      const response = await apiClient.post(`/questions/${questionId}/answers`, answerData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevap eklenirken bir hata oluştu');
    }
  }

  // Belirli bir sorunun cevaplarını getir
  async getAnswers(questionId: string): Promise<Answer[]> {
    try {
      const response = await apiClient.get(`/questions/${questionId}/answers`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevaplar yüklenirken bir hata oluştu');
    }
  }

  // Cevabı düzenleme
  async updateAnswer(answerId: string, data: { content: string; userId: string }): Promise<Answer> {
    try {
      const response = await apiClient.put(`/answers/${answerId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevap güncellenirken bir hata oluştu');
    }
  }

  // Cevabı silme
  async deleteAnswer(answerId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`/answers/${answerId}?userId=${userId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cevap silinirken bir hata oluştu');
    }
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol et
  async checkAuthentication(): Promise<boolean> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString !== null;
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