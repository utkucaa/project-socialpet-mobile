import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  datePosted: string;
  user: User;
  answerCount?: number;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  content: string;
  datePosted: string;
  user: User;
  questionId: number;
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
      const response = await fetch(`${BASE_URL}/api/questions`);
      if (!response.ok) {
        throw new Error('Sorular yüklenirken hata oluştu');
      }
      const questions = await response.json();
      
      // Her soru için cevap sayısını getir
      const questionsWithAnswerCount = await Promise.all(
        questions.map(async (question: Question) => {
          try {
            const answers = await this.getAnswers(question.id);
            return {
              ...question,
              answerCount: answers.length
            };
          } catch (error) {
            return {
              ...question,
              answerCount: 0
            };
          }
        })
      );
      
      return questionsWithAnswerCount;
    } catch (error) {
      console.error('Questions fetch error:', error);
      throw error;
    }
  }

  // Belirli bir soruyu getir ve cevaplarını dahil et
  async getQuestion(id: number): Promise<Question> {
    try {
      const response = await fetch(`${BASE_URL}/api/questions/${id}`);
      if (!response.ok) {
        throw new Error('Soru yüklenirken hata oluştu');
      }
      const question = await response.json();
      
      // Sorunun cevaplarını da getir
      try {
        const answers = await this.getAnswers(id);
        return {
          ...question,
          answers,
          answerCount: answers.length
        };
      } catch (error) {
        return {
          ...question,
          answers: [],
          answerCount: 0
        };
      }
    } catch (error) {
      console.error('Question fetch error:', error);
      throw error;
    }
  }

  // Yeni soru oluştur
  async createQuestion(questionData: QuestionData): Promise<Question> {
    try {
      // Kullanıcı bilgisini al
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.');
      }
      const user = JSON.parse(userString);

      const response = await fetch(`${BASE_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...questionData,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Soru oluşturulurken hata oluştu');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Question creation error:', error);
      throw error;
    }
  }

  // Soruya cevap ver
  async createAnswer(answerData: AnswerData): Promise<Answer> {
    try {
      // Kullanıcı bilgisini al
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.');
      }
      const user = JSON.parse(userString);

      const response = await fetch(`${BASE_URL}/api/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...answerData,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Cevap gönderilirken hata oluştu');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Answer creation error:', error);
      throw error;
    }
  }

  // Belirli bir sorunun cevaplarını getir
  async getAnswers(questionId: number): Promise<Answer[]> {
    try {
      // Kullanıcı bilgisini al
      const userString = await AsyncStorage.getItem('user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Eğer kullanıcı varsa token'ı ekle
      if (userString) {
        const user = JSON.parse(userString);
        if (user.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }
      }

      const response = await fetch(`${BASE_URL}/api/answers?questionId=${questionId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Cevaplar yüklenirken hata oluştu');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Answers fetch error:', error);
      throw error;
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