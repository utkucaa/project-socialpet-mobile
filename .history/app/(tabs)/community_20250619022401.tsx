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
import communityService, { Question } from '../../services/communityService';

const topicOptions = [
  { label: 'Sorunuz için en uygun konuyu seçiniz', value: '' },
  { label: 'Köpek Eğitimi ve Psikolojisi', value: 'kopek-egitim' },
  { label: 'Köpek Irkları', value: 'kopek-irk' },
  { label: 'Köpek Bakımı ve Sağlığı', value: 'kopek-bakim' },
  { label: 'Köpek Beslenmesi', value: 'kopek-beslenme' },
  { label: 'Kedi Irkları', value: 'kedi-irk' },
  { label: 'Kedi Bakımı ve Sağlığı', value: 'kedi-bakim' },
  { label: 'Kedi Genel Konular', value: 'kedi-genel' },
  { label: 'Kemirgenler Genel Konular', value: 'kemirgen' },
  { label: 'Sürüngenler Genel Konular', value: 'surungen' },
  { label: 'Kuşlar Genel Konular', value: 'kus' },
  { label: 'Akvaryum ve Balık Genel Konular', value: 'akvaryum' },
];

export default function CommunityScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    title: '',
    content: '',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

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

  const handleCreateQuestion = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
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
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.topic) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir konu seçin.');
      return;
    }
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setSubmitting(true);
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        Alert.alert('Hata', 'Oturum süreniz dolmuş.');
        router.push('/login');
        return;
      }
      const user = JSON.parse(userString);

      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await communityService.createQuestion({
        title: formData.title,
        content: formData.content,
        userId: user.id,
        tags: tagArray
      });
      
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
      topic: '',
      title: '',
      content: '',
      tags: ''
    });
  };

  const handleQuestionPress = (questionId: string) => {
    router.push(`/question-detail?id=${questionId}`);
  };

  const selectTopic = (topic: string) => {
    setFormData({...formData, topic});
    setShowTopicDropdown(false);
  };

  const getTopicLabel = (value: string) => {
    const topic = topicOptions.find(option => option.value === value);
    return topic ? topic.label : 'Sorunuz için en uygun konuyu seçiniz';
  };

  const renderQuestionCard = ({ item }: { item: Question }) => (
    <TouchableOpacity 
      style={styles.questionCard} 
      activeOpacity={0.8}
      onPress={() => handleQuestionPress(item.id!)}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionTitle}>{item.title}</Text>
        <View style={styles.questionMeta}>
          <Text style={styles.authorName}>
            {item.user?.name || 'Anonim'}
          </Text>
          <Text style={styles.questionDate}>
            {new Date(item.createdAt || '').toLocaleDateString('tr-TR', {
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
            {item.answersCount || 0} Cevap
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
                <Text style={styles.modalTitle}>Yeni Soru Sor</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.breadcrumb}>
                  <Text style={styles.breadcrumbText}>
                    <Text style={styles.breadcrumbLink}>Topluluk</Text> » <Text style={styles.breadcrumbCurrent}>Yeni Soru Sor</Text>
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Konu *</Text>
                  <TouchableWithoutFeedback onPress={() => setShowTopicDropdown(false)}>
                    <View>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setShowTopicDropdown(!showTopicDropdown)}
                      >
                        <Text style={[styles.dropdownButtonText, !formData.topic && styles.placeholderText]}>
                          {getTopicLabel(formData.topic)}
                        </Text>
                        <Text style={[styles.dropdownArrow, showTopicDropdown && styles.dropdownArrowUp]}>▼</Text>
                      </TouchableOpacity>
                      
                      {showTopicDropdown && (
                        <View style={styles.dropdownMenu}>
                          {topicOptions.map((option) => (
                            <TouchableOpacity 
                              key={option.value}
                              style={styles.dropdownItem} 
                              onPress={() => selectTopic(option.value)}
                            >
                              <Text style={[styles.dropdownItemText, option.value === '' && styles.placeholderText]}>
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableWithoutFeedback>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Soru *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Sorunuzun özetini anlaşılır bir şekilde buraya yazmalısınız. Soru cümlesi olmalıdır."
                    value={formData.title}
                    onChangeText={(text) => setFormData({...formData, title: text})}
                    maxLength={200}
                    multiline={true}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Detay *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Sorunuzu detaylı anlatırsanız, diğer üyeler ve uzmanlardan daha doğru cevaplar alabilirsiniz."
                    value={formData.content}
                    onChangeText={(text) => setFormData({...formData, content: text})}
                    multiline={true}
                    numberOfLines={8}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Etiketler</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Etiketleri virgülle ayırın (örn: köpek, sağlık, beslenme)"
                    value={formData.tags}
                    onChangeText={(text) => setFormData({...formData, tags: text})}
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
                    <Text style={styles.submitButtonText}>Sor</Text>
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
          colors={['#AB75C2', '#9B6BB0']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>💬 Topluluk</Text>
          <Text style={styles.headerSubtitle}>Sor & Yanıtla</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AB75C2" />
          <Text style={styles.loadingText}>Sorular yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>💬 Topluluk</Text>
        <Text style={styles.headerSubtitle}>Sor & Yanıtla</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateQuestion}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#AB75C2', '#9B6BB0']}
            style={styles.createButtonGradient}
          >
            <Text style={styles.createButtonText}>+ Yeni Soru Oluştur</Text>
          </LinearGradient>
        </TouchableOpacity>

        {questions.length > 0 ? (
          <FlatList
            data={questions}
            renderItem={renderQuestionCard}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={loadQuestions}
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
    color: '#F3E5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  createButton: {
    marginBottom: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
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
  questionHeader: {
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    color: '#AB75C2',
    fontWeight: '600',
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
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  answerCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#AB75C2',
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
    fontWeight: 'bold',
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
    maxHeight: '95%',
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
    fontWeight: 'bold',
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
  breadcrumb: {
    marginBottom: 20,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#6B7280',
  },
  breadcrumbLink: {
    color: '#AB75C2',
  },
  breadcrumbCurrent: {
    color: '#1F2937',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#AB75C2',
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
    fontWeight: 'bold',
  },
}); 