import AsyncStorage from '@react-native-async-storage/async-storage';
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
import communityService, { Answer, Question, User } from '../services/communityService';

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (id) {
      loadQuestionAndAnswers();
    }
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');
      setIsAuthenticated(!!token);
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const loadQuestionAndAnswers = async () => {
    if (!id) {
      setError('Geçersiz soru ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [questionData, answersData] = await Promise.all([
        communityService.getQuestion(id),
        communityService.getAnswers(id)
      ]);
      setQuestion(questionData);
      setAnswers(answersData);
    } catch (err: any) {
      setError(err.message || 'Soru detayları yüklenirken bir hata oluştu');
      console.error('Error loading question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim() || !id) {
      Alert.alert('Hata', 'Lütfen cevap içeriğini girin.');
      return;
    }

    if (!isAuthenticated || !currentUser) {
      Alert.alert(
        'Giriş Gerekli',
        'Cevap verebilmek için giriş yapmanız gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await communityService.createAnswer(id, {
        content: newAnswer,
        userId: currentUser.id
      });

      // Yeni cevabı ekle
      if (response) {
        setAnswers(prev => [...prev, response]);
        setNewAnswer('');
        Alert.alert('Başarılı', 'Cevabınız başarıyla eklendi.');
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Cevap eklenirken bir hata oluştu');
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

  const handleEditAnswer = (answer: Answer) => {
    setEditingAnswer(answer);
    setEditingContent(answer.content);
  };

  const handleSaveEdit = async () => {
    if (!editingAnswer || !editingContent.trim() || !currentUser) {
      Alert.alert('Hata', 'Lütfen cevap içeriğini girin.');
      return;
    }

    try {
      setSubmitting(true);
      await communityService.updateAnswer(editingAnswer.id, editingContent, currentUser.id);
      
      // Güncellenmiş cevapları yükle
      if (id) {
        const updatedAnswers = await communityService.getAnswers(id);
        setAnswers(updatedAnswers);
      }
      
      setEditingAnswer(null);
      setEditingContent('');
      Alert.alert('Başarılı', 'Cevabınız güncellendi.');
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Cevap güncellenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAnswer(null);
    setEditingContent('');
  };

  const handleDeleteAnswer = (answerId: string) => {
    Alert.alert(
      'Cevabı Sil',
      'Bu cevabı silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!currentUser) return;
            
            try {
              setSubmitting(true);
              await communityService.deleteAnswer(answerId, currentUser.id);
              
              // Cevapları yeniden yükle
              if (id) {
                const updatedAnswers = await communityService.getAnswers(id);
                setAnswers(updatedAnswers);
              }
              
              Alert.alert('Başarılı', 'Cevap silindi.');
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Cevap silinirken bir hata oluştu');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
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
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuestionAndAnswers}>
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
              {question.user ? `${question.user.firstName} ${question.user.lastName}` : 'Anonim'}
            </Text>
            <Text style={styles.dateInfo}>
              {new Date(question.datePosted || question.createdAt || '').toLocaleDateString('tr-TR')}
            </Text>
          </View>

          <Text style={styles.questionContent}>{question.content}</Text>

          {question.tags && question.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {question.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.questionActions}>
            <TouchableOpacity style={styles.complaintButton} onPress={handleComplaint}>
              <Text style={styles.complaintButtonText}>Şikayet Et</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.answersSection}>
          <Text style={styles.sectionTitle}>Cevaplar ({answers.length})</Text>
          
          {answers.map((answer, index) => (
            <View key={answer.id || index} style={styles.answerBox}>
              <View style={styles.userInfo}>
                <View style={styles.profileImage}>
                  <Text style={styles.profileIcon}>🐾</Text>
                </View>
                <Text style={styles.username}>
                  {answer.user ? `${answer.user.firstName} ${answer.user.lastName}` : 'Anonim'}
                </Text>
                <Text style={styles.dateInfo}>
                  {new Date(answer.datePosted || answer.createdAt || '').toLocaleDateString('tr-TR')}
                </Text>
                {currentUser && currentUser.id === answer.userId && (
                  <View style={styles.answerActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditAnswer(answer)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAnswer(answer.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {editingAnswer && editingAnswer.id === answer.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingContent}
                    onChangeText={setEditingContent}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveEdit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.answerContent}>{answer.content}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.answerInputContainer}>
          <TextInput
            style={styles.answerInput}
            placeholder="Cevabınızı yazın..."
            value={newAnswer}
            onChangeText={setNewAnswer}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitAnswer}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Cevapla</Text>
            )}
          </TouchableOpacity>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  questionStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  questionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileIcon: {
    fontSize: 20,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  dateInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  questionContent: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  answersSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  answerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  answerContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  answerInputContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#AB75C2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 24,
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
  answerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
}); 