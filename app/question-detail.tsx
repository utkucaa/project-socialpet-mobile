import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import communityService, { Answer, Question } from '../services/communityService';

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchQuestion();
      fetchAnswers();
      checkAuth();
    }
  }, [id]);

  const checkAuth = async () => {
    const auth = await communityService.checkAuthentication();
    setIsAuthenticated(auth);
  };

  const fetchQuestion = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await communityService.getQuestion(Number(id));
      setQuestion(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      setLoading(false);
    }
  };

  const fetchAnswers = async (): Promise<void> => {
    try {
      const data = await communityService.getAnswers(Number(id));
      setAnswers(data);
    } catch (err) {
      console.error('Cevaplar yüklenirken hata:', err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Giriş Gerekli', 
        'Cevap verebilmek için lütfen giriş yapın.',
        [
          {
            text: 'Giriş Yap',
            onPress: () => router.push('/login')
          },
          {
            text: 'İptal',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    if (!newAnswer.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir cevap yazın');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await communityService.createAnswer({
        content: newAnswer,
        questionId: Number(id)
      });
      
      // Cevapları yeniden yükle
      await fetchAnswers();
      setNewAnswer('');
      
      Alert.alert('Başarılı!', 'Cevabınız başarıyla gönderildi.');
      
    } catch (err) {
      console.error('Cevap gönderilirken hata oluştu:', err);
      Alert.alert('Hata', err instanceof Error ? err.message : 'Cevap gönderilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaint = () => {
    Alert.alert(
      'Şikayet Et',
      'Bu soruyu şikayet etmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Şikayet Et',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Şikayet', 'Şikayetiniz alındı. İnceleme süreci başlatıldı.');
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#AB75C2', '#9B6BB0']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Soru Detayı</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AB75C2" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#AB75C2', '#9B6BB0']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hata</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hata: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuestion}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (!question) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#AB75C2', '#9B6BB0']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Soru Bulunamadı</Text>
        </LinearGradient>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Soru bulunamadı</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soru Detayı</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionTitle}>{question.title}</Text>
          <View style={styles.questionStats}>
            <Text style={styles.statsText}>👁 82 Görüntülenme</Text>
            <Text style={styles.statsText}>💬 {answers.length} Cevap</Text>
          </View>
        </View>

        <View style={styles.questionBox}>
          <View style={styles.userInfo}>
            <View style={styles.profileImage}>
              <Text style={styles.profileIcon}>🐾</Text>
            </View>
            <Text style={styles.username}>
              {question.user.firstName} {question.user.lastName}
            </Text>
          </View>

          <View style={styles.questionContent}>
            <Text style={styles.questionText}>{question.content}</Text>
            <View style={styles.questionActions}>
              <TouchableOpacity style={styles.complaintButton} onPress={handleComplaint}>
                <Text style={styles.complaintButtonText}>Şikayet Et</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.postDate}>
              <Text style={styles.dateText}>
                {new Date(question.datePosted).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.answersSection}>
          <View style={styles.answersHeader}>
            <Text style={styles.answersTitle}>
              {answers.length} CEVAP
            </Text>
          </View>
          
          {answers.length > 0 ? (
            answers.map((answer) => (
              <View key={answer.id} style={styles.answerBox}>
                <View style={styles.userInfo}>
                  <View style={styles.profileImage}>
                    <Text style={styles.profileIcon}>🐾</Text>
                  </View>
                  <Text style={styles.username}>
                    {answer.user.firstName} {answer.user.lastName}
                  </Text>
                </View>
                <View style={styles.answerContent}>
                  <Text style={styles.answerText}>{answer.content}</Text>
                  <View style={styles.postDate}>
                    <Text style={styles.dateText}>
                      {new Date(answer.datePosted).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noAnswers}>
              <Text style={styles.noAnswersText}>
                Bu soruya henüz cevap verilmemiş. İlk cevabı siz verin!
              </Text>
            </View>
          )}
          
          <View style={styles.addAnswerSection}>
            <Text style={styles.addAnswerTitle}>Cevabınızı Yazın</Text>
            {isAuthenticated ? (
              <View style={styles.answerForm}>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Cevabınızı buraya yazın..."
                  value={newAnswer}
                  onChangeText={setNewAnswer}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity 
                  style={[styles.submitAnswerBtn, submitting && styles.submitAnswerBtnDisabled]}
                  onPress={handleSubmitAnswer}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitAnswerBtnText}>Cevabı Gönder</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Cevap verebilmek için giriş yapmalısınız.
                </Text>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 18,
    color: '#6B7280',
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 28,
  },
  questionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  questionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#AB75C2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileIcon: {
    fontSize: 18,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AB75C2',
  },
  questionContent: {
    marginLeft: 52,
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  questionActions: {
    marginBottom: 12,
  },
  complaintButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  complaintButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  postDate: {
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  answersSection: {
    marginBottom: 24,
  },
  answersHeader: {
    marginBottom: 16,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  answerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  answerContent: {
    marginLeft: 52,
  },
  answerText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
  },
  noAnswers: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  noAnswersText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  addAnswerSection: {
    marginTop: 24,
  },
  addAnswerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  answerForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitAnswerBtn: {
    backgroundColor: '#AB75C2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitAnswerBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitAnswerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 