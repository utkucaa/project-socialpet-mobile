import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  userId: number;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  answersCount?: number;
}

export interface Answer {
  id: string;
  content: string;
  userId: number;
  questionId: string;
  createdAt: string;
  updatedAt?: string;
  user: {
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

// Mock data for testing
const mockQuestions: Question[] = [
  {
    id: '1',
    title: 'Köpeğim sürekli havlıyor, ne yapmalıyım?',
    content: 'Köpeğim gece vakitlerinde çok fazla havlıyor ve komşulardan şikayet gelmeye başladı. Bu durumu nasıl çözebilirim?',
    userId: 1,
    tags: ['köpek', 'eğitim', 'davranış'],
    createdAt: '2024-01-15T10:30:00Z',
    user: {
      id: 1,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmet@test.com'
    },
    answersCount: 3
  },
  {
    id: '2',
    title: 'Kedim yemek yemiyor, veterinere götürmeli miyim?',
    content: '3 yaşındaki kedim son 2 gündür normal yemeklerini yemiyor. Sadece su içiyor. Bu normal mi yoksa acil veteriner müdahalesi gerekli mi?',
    userId: 2,
    tags: ['kedi', 'sağlık', 'beslenme'],
    createdAt: '2024-01-14T15:45:00Z',
    user: {
      id: 2,
      firstName: 'Zeynep',
      lastName: 'Kaya',
      email: 'zeynep@test.com'
    },
    answersCount: 5
  },
  {
    id: '3',
    title: 'Hamster kafesi için en iyi malzemeler nelerdir?',
    content: 'Yeni aldığım hamster için en uygun kafes düzenini yapmak istiyorum. Hangi malzemeleri kullanmalıyım?',
    userId: 3,
    tags: ['hamster', 'bakım', 'kafes'],
    createdAt: '2024-01-13T09:20:00Z',
    user: {
      id: 3,
      firstName: 'Mehmet',
      lastName: 'Özkan',
      email: 'mehmet@test.com'
    },
    answersCount: 2
  }
];

const mockAnswers: { [key: string]: Answer[] } = {
  '1': [
    {
      id: '1-1',
      content: 'Köpeğinizi gece havlamaktan alıkoymak için önce neden havladığını anlamalısınız. Genellikle sıkıntı, korku veya dikkat çekme isteği nedeniyle havlarlar.',
      userId: 4,
      questionId: '1',
      createdAt: '2024-01-15T11:00:00Z',
      user: {
        id: 4,
        firstName: 'Veteriner',
        lastName: 'Ali',
        email: 'ali@test.com'
      }
    },
    {
      id: '1-2',
      content: 'Bizim köpeğimiz de aynı problemi yaşıyordu. Gece öncesi uzun yürüyüş yaptırarak enerjisini tüketmesini sağladık. Bu çok işe yaradı!',
      userId: 5,
      questionId: '1',
      createdAt: '2024-01-15T12:30:00Z',
      user: {
        id: 5,
        firstName: 'Ayşe',
        lastName: 'Demir',
        email: 'ayse@test.com'
      }
    }
  ],
  '2': [
    {
      id: '2-1',
      content: 'Kediler çok hassas hayvanlardır. 2 gün yemek yememesi ciddi bir durumdur. Kesinlikle veterinere götürün.',
      userId: 6,
      questionId: '2',
      createdAt: '2024-01-14T16:00:00Z',
      user: {
        id: 6,
        firstName: 'Dr. Fatma',
        lastName: 'Çelik',
        email: 'fatma@test.com'
      }
    }
  ],
  '3': [
    {
      id: '3-1',
      content: 'Hamster kafesi için doğal ahşap talaş kullanmanızı öneririm. Plastik malzemelerden uzak durun.',
      userId: 7,
      questionId: '3',
      createdAt: '2024-01-13T10:15:00Z',
      user: {
        id: 7,
        firstName: 'Petshop',
        lastName: 'Uzmanı',
        email: 'uzman@test.com'
      }
    }
  ]
};

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
  
  // Tüm soruları getir (Mock data kullanarak)
  async getQuestions(): Promise<Question[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockQuestions;
    } catch (error: any) {
      console.error('Questions API error:', error);
      throw new Error('Sorular yüklenirken bir hata oluştu');
    }
  }

  // Belirli bir soruyu getir (Mock data kullanarak)
  async getQuestion(id: string): Promise<Question> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const question = mockQuestions.find(q => q.id === id);
      if (!question) {
        throw new Error('Soru bulunamadı');
      }
      return question;
    } catch (error: any) {
      console.error('Question detail API error:', error);
      throw new Error('Soru detayları yüklenirken bir hata oluştu');
    }
  }

  // Belirli bir sorunun cevaplarını getir (Mock data kullanarak)
  async getAnswers(questionId: string): Promise<Answer[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockAnswers[questionId] || [];
    } catch (error: any) {
      console.error('Answers API error:', error);
      throw new Error('Cevaplar yüklenirken bir hata oluştu');
    }
  }

  // Yeni soru oluştur
  async createQuestion(questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<Question> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Giriş yapmanız gerekiyor');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newQuestion: Question = {
        id: Date.now().toString(),
        ...questionData,
        createdAt: new Date().toISOString(),
        user: {
          id: questionData.userId,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com'
        },
        answersCount: 0
      };

      // Mock olarak listeye ekle
      mockQuestions.unshift(newQuestion);
      return newQuestion;
    } catch (error: any) {
      console.error('Create question error:', error);
      throw new Error('Soru eklenirken bir hata oluştu');
    }
  }

  // Soruya cevap ver
  async createAnswer(questionId: string, answerData: { content: string; userId: number }): Promise<Answer> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Giriş yapmanız gerekiyor');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAnswer: Answer = {
        id: `${questionId}-${Date.now()}`,
        content: answerData.content,
        userId: answerData.userId,
        questionId: questionId,
        createdAt: new Date().toISOString(),
        user: {
          id: answerData.userId,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com'
        }
      };

      // Mock olarak listeye ekle
      if (!mockAnswers[questionId]) {
        mockAnswers[questionId] = [];
      }
      mockAnswers[questionId].push(newAnswer);
      
      return newAnswer;
    } catch (error: any) {
      console.error('Create answer error:', error);
      throw new Error('Cevap eklenirken bir hata oluştu');
    }
  }

  // Cevabı düzenleme
  async updateAnswer(answerId: string, content: string): Promise<Answer> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.put(`/answers/${answerId}`, { content }, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Update answer error:', error);
      throw new Error('Cevap güncellenirken bir hata oluştu');
    }
  }

  // Cevabı silme
  async deleteAnswer(answerId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await apiClient.delete(`/answers/${answerId}`, { headers });
    } catch (error: any) {
      console.error('Delete answer error:', error);
      throw new Error('Cevap silinirken bir hata oluştu');
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