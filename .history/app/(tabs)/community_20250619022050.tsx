import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import communityService, { Question } from '../../services/communityService';

export default function CommunityScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communityService.getQuestions();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || 'Sorular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderQuestion = ({ item }: { item: Question }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => router.push(`/question-detail?id=${item.id}`)}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.answerCount}>
          <Text style={styles.answerCountText}>
            {item.answersCount || 0} Cevap
          </Text>
        </View>
      </View>
      
      <Text style={styles.questionContent} numberOfLines={3}>
        {item.content}
      </Text>

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.questionFooter}>
        <Text style={styles.userInfo}>
          {item.user?.name || 'Anonim'} tarafından
        </Text>
        <Text style={styles.dateInfo}>
          {new Date(item.createdAt || '').toLocaleDateString('tr-TR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Soru ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => router.push('/question-detail?new=true')}
        >
          <Text style={styles.askButtonText}>Soru Sor</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#AB75C2" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          renderItem={renderQuestion}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadQuestions}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aramanızla eşleşen soru bulunamadı.' : 'Henüz soru yok.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  askButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  askButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  answerCount: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  answerCountText: {
    fontSize: 14,
    color: '#666',
  },
  questionContent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
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
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
  },
  dateInfo: {
    fontSize: 14,
    color: '#999',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 