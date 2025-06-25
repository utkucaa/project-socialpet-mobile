import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import communityService, { Answer, Question } from '../services/communityService';

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { id, new: isNew } = useLocalSearchParams<{ id?: string; new?: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [answerContent, setAnswerContent] = useState('');

  useEffect(() => {
    if (id) {
      loadQuestionAndAnswers();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadQuestionAndAnswers = async () => {
    try {
      setLoading(true);
      setError(null);
      if (id) {
        const questionData = await communityService.getQuestion(id);
        setQuestion(questionData);
        const answersData = await communityService.getAnswers(id);
        setAnswers(answersData);
      }
    } catch (err: any) {
      setError(err.message || 'Soru detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik alanlarını doldurun.');
      return;
    }

    try {
      setSubmitting(true);
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        Alert.alert('Hata', 'Lütfen giriş yapın.');
        router.push('/login');
        return;
      }
      const user = JSON.parse(userString);

      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await communityService.createQuestion({
        title,
        content,
        userId: user.id,
        tags: tagArray,
      });

      Alert.alert('Başarılı', 'Sorunuz başarıyla oluşturuldu.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Soru oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnswer = async () => {
    if (!answerContent.trim() || !id) {
      Alert.alert('Hata', 'Lütfen cevap içeriğini girin.');
      return;
    }

    try {
      setSubmitting(true);
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        Alert.alert('Hata', 'Lütfen giriş yapın.');
        router.push('/login');
        return;
      }
      const user = JSON.parse(userString);

      await communityService.createAnswer(id, {
        content: answerContent,
        userId: user.id,
      });

      setAnswerContent('');
      loadQuestionAndAnswers();
      Alert.alert('Başarılı', 'Cevabınız başarıyla eklendi.');
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Cevap eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#AB75C2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuestionAndAnswers}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isNew === 'true') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Başlık *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Sorunuzun başlığı"
            maxLength={200}
          />

          <Text style={styles.label}>İçerik *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Sorunuzu detaylı bir şekilde açıklayın"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Etiketler</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="Etiketleri virgülle ayırın (örn: köpek, sağlık, beslenme)"
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleCreateQuestion}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Soru Sor</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>{question?.title}</Text>
        <Text style={styles.questionContent}>{question?.content}</Text>
        
        {question?.tags && question.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {question.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.questionMeta}>
          <Text style={styles.metaText}>
            {question?.user?.name || 'Anonim'} tarafından
          </Text>
          <Text style={styles.metaText}>
            {new Date(question?.createdAt || '').toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>

      <View style={styles.answersContainer}>
        <Text style={styles.answersTitle}>Cevaplar ({answers.length})</Text>
        
        {answers.map((answer, index) => (
          <View key={answer.id || index} style={styles.answerCard}>
            <Text style={styles.answerContent}>{answer.content}</Text>
            <View style={styles.answerMeta}>
              <Text style={styles.metaText}>
                {answer.user?.name || 'Anonim'} tarafından
              </Text>
              <Text style={styles.metaText}>
                {new Date(answer.createdAt || '').toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.answerFormContainer}>
          <Text style={styles.label}>Cevabınız</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={answerContent}
            onChangeText={setAnswerContent}
            placeholder="Cevabınızı yazın"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleCreateAnswer}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Cevap Ver</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  questionContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  questionContent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
  answersContainer: {
    padding: 16,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  answerContent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 24,
  },
  answerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  answerFormContainer: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#AB75C2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 