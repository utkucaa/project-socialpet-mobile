import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
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
  color: string;
  type: HealthRecord['type'];
}

const healthCategories: HealthCategory[] = [
  {
    id: 'vaccines',
    title: 'Aşılar',
    icon: '💉',
    color: '#10B981',
    type: 'vaccine'
  },
  {
    id: 'treatments',
    title: 'Tedaviler',
    icon: '🔬',
    color: '#3B82F6',
    type: 'treatment'
  },
  {
    id: 'appointments',
    title: 'Randevular',
    icon: '📅',
    color: '#8B5CF6',
    type: 'appointment'
  },
  {
    id: 'medications',
    title: 'İlaçlar',
    icon: '💊',
    color: '#EF4444',
    type: 'medication'
  },
  {
    id: 'allergies',
    title: 'Alerjiler',
    icon: '🚨',
    color: '#F59E0B',
    type: 'allergy'
  },
  {
    id: 'weight',
    title: 'Ağırlık',
    icon: '⚖️',
    color: '#06B6D4',
    type: 'weight'
  }
];

export default function PetProfileScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory>(healthCategories[0]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    if (petId) {
      loadPetData();
    }
  }, [petId]);

  useEffect(() => {
    if (pet && selectedCategory) {
      loadHealthRecords();
    }
  }, [pet, selectedCategory]);

  const loadPetData = async () => {
    if (!petId) return;
    
    try {
      setLoading(true);
      const petData = await petService.getPetDetails(petId);
      
      if (petData) {
        setPet(petData);
      } else {
        Alert.alert('Hata', 'Evcil hayvan bilgileri bulunamadı.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      Alert.alert('Hata', 'Evcil hayvan bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthRecords = async () => {
    if (!pet) return;
    
    try {
      setRecordsLoading(true);
      
      let records: HealthRecord[] = [];
      
      switch (selectedCategory.type) {
        case 'vaccine':
          records = await petService.getVaccinations(pet.id);
          break;
        case 'treatment':
          records = await petService.getTreatments(pet.id);
          break;
        case 'appointment':
          records = await petService.getAppointments(pet.id);
          break;
        case 'medication':
          records = await petService.getMedications(pet.id);
          break;
        case 'allergy':
          records = await petService.getAllergies(pet.id);
          break;
        case 'weight':
          records = await petService.getWeightRecords(pet.id);
          break;
      }
      
      setHealthRecords(records);
    } catch (error) {
      console.error('Error loading health records:', error);
      Alert.alert('Hata', 'Sağlık kayıtları yüklenirken bir hata oluştu.');
    } finally {
      setRecordsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPetData();
    await loadHealthRecords();
    setRefreshing(false);
  }, []);

  const handleAddRecord = () => {
    Alert.alert(
      'Kayıt Ekle',
      `${selectedCategory.title} kategorisine yeni kayıt eklemek için bu özellik yakında eklenecek.`,
      [{ text: 'Tamam' }]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const renderHealthRecord = ({ item }: { item: HealthRecord }) => (
    <TouchableOpacity style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{item.title}</Text>
        <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
      </View>
      
      {item.description && (
        <Text style={styles.recordDescription}>{item.description}</Text>
      )}
      
      {/* Specific fields based on record type */}
      {item.veterinarian && (
        <Text style={styles.recordDetail}>👨‍⚕️ Veteriner: {item.veterinarian}</Text>
      )}
      
      {item.dosage && (
        <Text style={styles.recordDetail}>💉 Doz: {item.dosage}</Text>
      )}
      
      {item.weight && (
        <Text style={styles.recordDetail}>
          ⚖️ Ağırlık: {item.weight} {item.unit || 'kg'}
        </Text>
      )}
      
      {item.severity && (
        <Text style={[styles.recordDetail, { 
          color: item.severity === 'high' ? '#EF4444' : 
                item.severity === 'medium' ? '#F59E0B' : '#10B981' 
        }]}>
          🚨 Şiddet: {item.severity === 'high' ? 'Yüksek' : 
                    item.severity === 'medium' ? 'Orta' : 'Düşük'}
        </Text>
      )}
      
      {item.symptoms && (
        <Text style={styles.recordDetail}>🔍 Belirtiler: {item.symptoms}</Text>
      )}
      
      {item.duration && (
        <Text style={styles.recordDetail}>⏱️ Süre: {item.duration}</Text>
      )}
      
      {item.cost && (
        <Text style={styles.recordDetail}>💰 Ücret: {item.cost} TL</Text>
      )}
      
      {item.nextDate && (
        <Text style={styles.recordNextDate}>
          📅 Sonraki: {formatDate(item.nextDate)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderCategoryButton = ({ item }: { item: HealthCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        { backgroundColor: item.color },
        selectedCategory.id === item.id && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      {selectedCategory.id === item.id && (
        <View style={styles.selectedIndicator} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Evcil hayvan bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evcil hayvan bulunamadı</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Pet Header */}
        <View style={styles.petHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          
          <View style={styles.petInfo}>
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
            
            <View style={styles.petDetails}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{pet.breed}</Text>
              <Text style={styles.petAge}>
                {pet.age} yaşında • {pet.gender} • {pet.species}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>🏥 Sağlık Kategorileri</Text>
          
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={healthCategories}
            renderItem={renderCategoryButton}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        {/* Records Section */}
        <View style={styles.recordsSection}>
          <View style={styles.recordsHeader}>
            <Text style={styles.recordsTitle}>
              {selectedCategory.icon} {selectedCategory.title}
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddRecord}>
              <Text style={styles.addButtonText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>

          {recordsLoading ? (
            <View style={styles.recordsLoadingContainer}>
              <ActivityIndicator size="small" color="#AB75C2" />
              <Text style={styles.recordsLoadingText}>Kayıtlar yükleniyor...</Text>
            </View>
          ) : healthRecords.length > 0 ? (
            <FlatList
              data={healthRecords}
              renderItem={renderHealthRecord}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyRecordsIcon}>{selectedCategory.icon}</Text>
              <Text style={styles.emptyRecordsTitle}>
                Henüz {selectedCategory.title.toLowerCase()} kaydı yok
              </Text>
              <Text style={styles.emptyRecordsText}>
                İlk kaydı eklemek için yukarıdaki "+ Ekle" butonunu kullanın
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  petHeader: {
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#AB75C2',
    fontWeight: '600',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    marginRight: 20,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#AB75C2',
  },
  petImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  petImagePlaceholderText: {
    fontSize: 32,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 16,
    color: '#AB75C2',
    fontWeight: '600',
    marginBottom: 4,
  },
  petAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    position: 'relative',
  },
  selectedCategoryButton: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -4 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recordsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  recordsLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  recordDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recordDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  recordDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  recordNextDate: {
    fontSize: 13,
    color: '#AB75C2',
    fontWeight: '600',
    marginTop: 8,
  },
  emptyRecords: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyRecordsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyRecordsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRecordsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
}); 