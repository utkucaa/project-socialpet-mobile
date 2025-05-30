import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import communityService, { Question, QuestionData } from '../../services/communityService';

export default function CommunityScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formData, setFormData] = useState<QuestionData>({
    title: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadQuestions();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const auth = await communityService.checkAuthentication();
    setIsAuthenticated(auth);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await communityService.getQuestions();
      setQuestions(data);
    } catch (error: any) {
      console.error('Sorular yüklenirken hata:', error);
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Giriş Gerekli', 
        'Soru sorabilmek için lütfen giriş yapın.',
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
    setCreateModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setSubmitting(true);
      await communityService.createQuestion(formData);
      
      Alert.alert('Başarılı!', 'Sorunuz başarıyla oluşturuldu.', [
        {
          text: 'Tamam',
          onPress: () => {
            setCreateModalVisible(false);
            resetForm();
            loadQuestions();
          }
        }
      ]);
    } catch (error: any) {
      console.error('Soru oluşturma hatası:', error);
      Alert.alert('Hata', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: ''
    });
  };

  const handleQuestionPress = (questionId: number) => {
    router.push(`/question-detail?id=${questionId}`);
  };

  const renderQuestionCard = ({ item }: { item: Question }) => (
    <TouchableOpacity 
      style={styles.questionCard} 
      activeOpacity={0.8}
      onPress={() => handleQuestionPress(item.id)}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionTitle}>{item.title}</Text>
        <View style={styles.questionMeta}>
          <Text style={styles.authorName}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={styles.questionDate}>
            {new Date(item.datePosted).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>
      
      <Text style={styles.questionPreview} numberOfLines={2}>
        {item.content}
      </Text>
      
      <View style={styles.questionFooter}>
        <View style={styles.answerCount}>
          <Text style={styles.answerCountText}>
            {item.answerCount || 0} Cevap
          </Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Soruyu Gör</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCreateModal = () => (
    <Modal
      visible={createModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Soru Oluştur</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Soru Başlığı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Sorunuzun başlığını yazın..."
                    value={formData.title}
                    onChangeText={(text) => setFormData({...formData, title: text})}
                    maxLength={100}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Soru Detayı</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Sorunuzun detaylarını açıklayın..."
                    value={formData.content}
                    onChangeText={(text) => setFormData({...formData, content: text})}
                    multiline={true}
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Soruyu Gönder</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>💬 Topluluk</Text>
          <Text style={styles.headerSubtitle}>Sor & Yanıtla</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Sorular yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>💬 Topluluk</Text>
        <Text style={styles.headerSubtitle}>Sor & Yanıtla</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateQuestion}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>+ Yeni Soru Oluştur</Text>
        </TouchableOpacity>

        {questions.length > 0 ? (
          <FlatList
            data={questions}
            renderItem={renderQuestionCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Henüz soru yok</Text>
            <Text style={styles.emptySubtitle}>
              İlk soruyu siz sorun ve topluluktan cevap alın!
            </Text>
          </View>
        )}
      </View>

      {renderCreateModal()}
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8E5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  questionCard: {
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
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 22,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  questionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  questionPreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  answerCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 