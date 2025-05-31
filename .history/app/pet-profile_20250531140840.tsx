import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import petService, { HealthRecord, Pet } from '../services/petService';

const { width } = Dimensions.get('window');

interface HealthCategory {
  id: string;
  title: string;
  icon: string;
  type: HealthRecord['type'];
  color: string;
}

const healthCategories: HealthCategory[] = [
  {
    id: 'vaccines',
    title: 'Aşılar',
    icon: '💉',
    type: 'vaccine',
    color: '#10B981'
  },
  {
    id: 'treatments',
    title: 'Tedaviler',
    icon: '🏥',
    type: 'treatment',
    color: '#3B82F6'
  },
  {
    id: 'appointments',
    title: 'Randevular',
    icon: '📅',
    type: 'appointment',
    color: '#8B5CF6'
  },
  {
    id: 'medications',
    title: 'İlaçlar',
    icon: '💊',
    type: 'medication',
    color: '#F59E0B'
  },
  {
    id: 'allergies',
    title: 'Alerjiler',
    icon: '⚠️',
    type: 'allergy',
    color: '#EF4444'
  },
  {
    id: 'weight',
    title: 'Kilo Kayıtları',
    icon: '⚖️',
    type: 'weight',
    color: '#06B6D4'
  }
];

export default function PetProfileScreen() {
  const params = useLocalSearchParams();
  const petId = params.petId as string;
  
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<Pet | null>(null);
  const [activeCategory, setActiveCategory] = useState<HealthCategory>(healthCategories[0]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    if (petId) {
      loadPetData();
      loadHealthRecords();
    }
  }, [petId]);

  useEffect(() => {
    if (activeCategory && pet) {
      loadHealthRecords();
    }
  }, [activeCategory]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      const userString = await AsyncStorage.getItem('user');
      if (!userString) return;
      
      const user = JSON.parse(userString);
      const pets = await petService.getUserPets(user.id);
      const foundPet = pets.find(p => p.id === petId);
      
      if (foundPet) {
        setPet(foundPet);
      } else {
        Alert.alert('Hata', 'Evcil hayvan bulunamadı.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Hata', 'Evcil hayvan bilgileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthRecords = async () => {
    if (!pet || !activeCategory) return;
    
    try {
      setRecordsLoading(true);
      const records = await petService.getHealthRecordsByType(pet.id, activeCategory.type);
      setHealthRecords(records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error loading health records:', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleAddRecord = () => {
    Alert.alert('Yakında!', `${activeCategory.title} ekleme özelliği yakında eklenecek.`);
  };

  const renderCategoryButton = ({ item }: { item: HealthCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        { borderColor: item.color },
        activeCategory.id === item.id && { backgroundColor: item.color }
      ]}
      onPress={() => setActiveCategory(item)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        activeCategory.id === item.id && styles.activeCategoryText
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderHealthRecord = ({ item }: { item: HealthRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{item.title}</Text>
        <Text style={styles.recordDate}>
          {new Date(item.date).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      
      {item.description && (
        <Text style={styles.recordDescription}>{item.description}</Text>
      )}
      
      {item.nextDate && (
        <View style={styles.nextDateContainer}>
          <Text style={styles.nextDateLabel}>Sonraki:</Text>
          <Text style={styles.nextDate}>
            {new Date(item.nextDate).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evcil hayvan bulunamadı</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        
        <View style={styles.petHeaderInfo}>
          <View style={styles.petImageContainer}>
            {pet.imageUrl ? (
              <Image source={{ uri: pet.imageUrl }} style={styles.petImage} />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Text style={styles.petImagePlaceholderText}>
                  {pet.species === 'köpek' ? '🐕' : 
                   pet.species === 'kedi' ? '🐱' : 
                   pet.species === 'kuş' ? '🐦' : '🐾'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.petBasicInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petDetails}>
              {pet.age} yaşında • {pet.gender} • {pet.breed}
            </Text>
            <Text style={styles.petSpecies}>
              {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Sağlık Kategorileri</Text>
        <FlatList
          data={healthCategories}
          renderItem={renderCategoryButton}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        />
      </View>

      {/* Active Category Content */}
      <View style={styles.contentSection}>
        <View style={styles.contentHeader}>
          <Text style={[styles.contentTitle, { color: activeCategory.color }]}>
            {activeCategory.icon} {activeCategory.title}
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: activeCategory.color }]}
            onPress={handleAddRecord}
          >
            <Text style={styles.addButtonText}>+ Ekle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recordsContainer}>
          {recordsLoading ? (
            <View style={styles.recordsLoadingContainer}>
              <ActivityIndicator size="small" color={activeCategory.color} />
              <Text style={styles.recordsLoadingText}>Kayıtlar yükleniyor...</Text>
            </View>
          ) : healthRecords.length > 0 ? (
            <FlatList
              data={healthRecords}
              renderItem={renderHealthRecord}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          ) : (
            <View style={styles.emptyRecordsContainer}>
              <Text style={styles.emptyRecordsIcon}>{activeCategory.icon}</Text>
              <Text style={styles.emptyRecordsTitle}>
                Henüz {activeCategory.title.toLowerCase()} kaydı yok
              </Text>
              <Text style={styles.emptyRecordsText}>
                İlk kaydınızı oluşturmak için "Ekle" butonuna tıklayın.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    padding: 10,
    zIndex: 1,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  petHeaderInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  petImageContainer: {
    marginBottom: 15,
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  petImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  petImagePlaceholderText: {
    fontSize: 40,
  },
  petBasicInfo: {
    alignItems: 'center',
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  petDetails: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 3,
  },
  petSpecies: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  categoriesSection: {
    padding: 20,
    paddingBottom: 10,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  categoriesList: {
    paddingHorizontal: 5,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minWidth: 80,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recordsContainer: {
    flex: 1,
  },
  recordsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordsLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  recordDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  recordDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  nextDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  nextDateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 5,
  },
  nextDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emptyRecordsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyRecordsIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyRecordsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRecordsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 