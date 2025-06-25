import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

export interface User {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  userId: number;
  tags: string[];
  datePosted?: string;
  createdAt?: string;
  updatedAt?: string;
  user: {
    id: number;
    userName?: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  answersCount?: number;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  content: string;
  userId: number;
  questionId: string;
  datePosted?: string;
  createdAt?: string;
  updatedAt?: string;
  user: {
    id: number;
    userName?: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface QuestionData {
  title: string;
  content: string;
  userId: number;
  tags: string[];
}

export interface AnswerData {
  content: string;
  userId: number;
}

class CommunityService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
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
      const response = await apiClient.get('/questions');
      return response.data;
    } catch (error: any) {
      console.error('Questions API error:', error);
      throw new Error(error.response?.data?.message || 'Sorular yüklenirken bir hata oluştu');
    }
  }

  // Belirli bir soruyu getir
  async getQuestion(id: string): Promise<Question> {
    try {
      const response = await apiClient.get(`/questions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Question API error:', error);
      throw new Error(error.response?.data?.message || 'Soru yüklenirken bir hata oluştu');
    }
  }

  // Bir sorunun tüm cevaplarını getir
  async getAnswers(questionId: string): Promise<Answer[]> {
    try {
      const response = await apiClient.get(`/answers/question/${questionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Answers API error:', error);
      throw new Error(error.response?.data?.message || 'Cevaplar yüklenirken bir hata oluştu');
    }
  }

  // Yeni soru oluştur
  async createQuestion(questionData: QuestionData): Promise<Question> {
    try {
      const response = await apiClient.post('/questions', {
        title: questionData.title,
        content: questionData.content,
        userId: questionData.userId,
        tags: questionData.tags
      });
      return response.data;
    } catch (error: any) {
      console.error('Create question API error:', error);
      throw new Error(error.response?.data?.message || 'Soru oluşturulurken bir hata oluştu');
    }
  }

  // Soruya cevap ver
  async createAnswer(questionId: string, answerData: AnswerData): Promise<Answer> {
    try {
      const response = await apiClient.post(`/answers/question/${questionId}`, {
        content: answerData.content,
        userId: answerData.userId
      });
      return response.data;
    } catch (error: any) {
      console.error('Create answer API error:', error);
      throw new Error(error.response?.data?.message || 'Cevap oluşturulurken bir hata oluştu');
    }
  }

  // Soruyu güncelle
  async updateQuestion(questionId: string, questionData: Partial<QuestionData>): Promise<Question> {
    try {
      const response = await apiClient.put(`/questions/${questionId}`, questionData);
      return response.data;
    } catch (error: any) {
      console.error('Update question API error:', error);
      throw new Error(error.response?.data?.message || 'Soru güncellenirken bir hata oluştu');
    }
  }

  // Cevabı güncelle
  async updateAnswer(answerId: string, content: string, userId: number): Promise<Answer> {
    try {
      const response = await apiClient.put(`/answers/${answerId}`, {
        content,
        userId
      });
      return response.data;
    } catch (error: any) {
      console.error('Update answer API error:', error);
      throw new Error(error.response?.data?.message || 'Cevap güncellenirken bir hata oluştu');
    }
  }

  // Soruyu sil
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await apiClient.delete(`/questions/${questionId}`);
    } catch (error: any) {
      console.error('Delete question API error:', error);
      throw new Error(error.response?.data?.message || 'Soru silinirken bir hata oluştu');
    }
  }

  // Cevabı sil
  async deleteAnswer(answerId: string, userId: number): Promise<void> {
    try {
      await apiClient.delete(`/answers/${answerId}?userId=${userId}`);
    } catch (error: any) {
      console.error('Delete answer API error:', error);
      throw new Error(error.response?.data?.message || 'Cevap silinirken bir hata oluştu');
    }
  }

  // Belirli bir cevabı getir
  async getAnswer(answerId: string): Promise<Answer> {
    try {
      const response = await apiClient.get(`/answers/${answerId}`);
      return response.data;
    } catch (error: any) {
      console.error('Answer API error:', error);
      throw new Error(error.response?.data?.message || 'Cevap yüklenirken bir hata oluştu');
    }
  }

  // Auth check
  async checkAuthentication(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export default new CommunityService(); 