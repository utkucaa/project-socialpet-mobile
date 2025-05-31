import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
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
  gradientColors: string[];
  type: HealthRecord['type'];
}

const healthCategories: HealthCategory[] = [
  {
    id: 'vaccines',
    title: 'Aşılar',
    icon: '💉',
    color: '#10B981',
    gradientColors: ['#10B981', '#059669'],
    type: 'vaccine'
  },
  {
    id: 'treatments',
    title: 'Tedaviler',
    icon: '🔬',
    color: '#3B82F6',
    gradientColors: ['#3B82F6', '#2563EB'],
    type: 'treatment'
  },
  {
    id: 'appointments',
    title: 'Randevular',
    icon: '📅',
    color: '#8B5CF6',
    gradientColors: ['#8B5CF6', '#7C3AED'],
    type: 'appointment'
  },
  {
    id: 'medications',
    title: 'İlaçlar',
    icon: '💊',
    color: '#EF4444',
    gradientColors: ['#EF4444', '#DC2626'],
    type: 'medication'
  },
  {
    id: 'allergies',
    title: 'Alerjiler',
    icon: '🚨',
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#D97706'],
    type: 'allergy'
  },
  {
    id: 'weight',
    title: 'Kilo Kayıtları',
    icon: '⚖️',
    color: '#06B6D4',
    gradientColors: ['#06B6D4', '#0891B2'],
    type: 'weight'
  }
];

type ListItem = 
  | { type: 'header'; pet: Pet }
  | { type: 'categories' }
  | { type: 'recordsHeader'; category: HealthCategory }
  | { type: 'record'; record: HealthRecord }
  | { type: 'loading' }
  | { type: 'empty'; category: HealthCategory }
  | { type: 'spacer' };

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

  const handleVaccinationPress = () => {
    if (pet) {
      router.push(`/vaccinations?petId=${pet.id}`);
    }
  };

  const handleCategoryPress = (category: HealthCategory) => {
    if (category.id === 'vaccines') {
      // Navigate to vaccination screen for vaccines category
      handleVaccinationPress();
    } else {
      // For other categories, keep the existing behavior
      setSelectedCategory(category);
    }
  };

  // Prepare data for FlatList - simplified without records display
  const getListData = (): ListItem[] => {
    if (!pet) return [];

    const items: ListItem[] = [
      { type: 'header', pet },
      { type: 'categories' },
      { type: 'spacer' }
    ];

    return items;
  };

  const renderCategoryButton = (item: HealthCategory) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory.id === item.id && styles.selectedCategoryCard
      ]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={selectedCategory.id === item.id ? item.gradientColors as any : ['#FFFFFF', '#F8FAFC']}
        style={styles.categoryGradient}
      >
        <View style={styles.categoryIconContainer}>
          <Text style={[
            styles.categoryIcon,
            selectedCategory.id === item.id && styles.selectedCategoryIcon
          ]}>
            {item.icon}
          </Text>
        </View>
        <Text style={[
          styles.categoryTitle,
          selectedCategory.id === item.id && styles.selectedCategoryTitle
        ]}>
          {item.title}
        </Text>
        {selectedCategory.id === item.id && (
          <View style={styles.selectedDot} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderHealthRecord = (record: HealthRecord) => (
    <TouchableOpacity style={styles.recordCard} activeOpacity={0.7}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFEFE']}
        style={styles.recordGradient}
      >
        <View style={styles.recordHeader}>
          <View style={styles.recordTitleContainer}>
            <Text style={styles.recordIcon}>{selectedCategory.icon}</Text>
            <Text style={styles.recordTitle}>{record.title}</Text>
          </View>
          <View style={styles.recordDateContainer}>
            <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
          </View>
        </View>
        
        {record.description && (
          <Text style={styles.recordDescription}>{record.description}</Text>
        )}
        
        <View style={styles.recordDetailsContainer}>
          {/* Specific fields based on record type */}
          {record.veterinarian && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>👨‍⚕️</Text>
              <Text style={styles.recordDetail}>Veteriner: {record.veterinarian}</Text>
            </View>
          )}
          
          {record.dosage && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>💉</Text>
              <Text style={styles.recordDetail}>Doz: {record.dosage}</Text>
            </View>
          )}
          
          {record.weight && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>⚖️</Text>
              <Text style={styles.recordDetail}>
                Ağırlık: {record.weight} {record.unit || 'kg'}
              </Text>
            </View>
          )}
          
          {record.severity && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>🚨</Text>
              <Text style={[styles.recordDetail, { 
                color: record.severity === 'high' ? '#EF4444' : 
                      record.severity === 'medium' ? '#F59E0B' : '#10B981' 
              }]}>
                Şiddet: {record.severity === 'high' ? 'Yüksek' : 
                        record.severity === 'medium' ? 'Orta' : 'Düşük'}
              </Text>
            </View>
          )}
          
          {record.symptoms && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>🔍</Text>
              <Text style={styles.recordDetail}>Belirtiler: {record.symptoms}</Text>
            </View>
          )}
          
          {record.duration && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>⏱️</Text>
              <Text style={styles.recordDetail}>Süre: {record.duration}</Text>
            </View>
          )}
          
          {record.cost && (
            <View style={styles.recordDetailRow}>
              <Text style={styles.recordDetailIcon}>💰</Text>
              <Text style={styles.recordDetail}>Ücret: {record.cost} TL</Text>
            </View>
          )}
        </View>
        
        {record.nextDate && (
          <View style={styles.nextDateContainer}>
            <Text style={styles.nextDateIcon}>📅</Text>
            <Text style={styles.recordNextDate}>
              Sonraki: {formatDate(record.nextDate)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderListItem = ({ item, index }: { item: ListItem; index: number }) => {
    switch (item.type) {
      case 'header':
        return (
          <LinearGradient
            colors={['#F3E8FF', '#EDE9FE']}
            style={styles.petHeader}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.backButtonGradient}
              >
                <Text style={styles.backButtonText}>← Geri</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.petInfo}>
              <View style={styles.petImageContainer}>
                {item.pet.imageUrl ? (
                  <Image source={{ uri: item.pet.imageUrl }} style={styles.petImage} />
                ) : (
                  <LinearGradient
                    colors={['#AB75C2', '#9B6BB0']}
                    style={styles.petImagePlaceholder}
                  >
                    <Text style={styles.petImagePlaceholderText}>
                      {item.pet.species === 'köpek' ? '🐕' : 
                       item.pet.species === 'kedi' ? '🐱' : 
                       item.pet.species === 'kuş' ? '🐦' : '🐾'}
                    </Text>
                  </LinearGradient>
                )}
              </View>
              
              <View style={styles.petDetails}>
                <Text style={styles.petName}>{item.pet.name}</Text>
                <Text style={styles.petBreed}>{item.pet.breed}</Text>
                <View style={styles.petInfoRow}>
                  <View style={styles.petInfoItem}>
                    <Text style={styles.petInfoIcon}>🎂</Text>
                    <Text style={styles.petInfoText}>{item.pet.age} yaş</Text>
                  </View>
                  <View style={styles.petInfoItem}>
                    <Text style={styles.petInfoIcon}>
                      {item.pet.gender === 'erkek' ? '♂️' : '♀️'}
                    </Text>
                    <Text style={styles.petInfoText}>{item.pet.gender}</Text>
                  </View>
                  <View style={styles.petInfoItem}>
                    <Text style={styles.petInfoIcon}>🐾</Text>
                    <Text style={styles.petInfoText}>{item.pet.species}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        );

      case 'categories':
        return (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>🏥 Sağlık Kategorileri</Text>
            
            <View style={styles.categoriesGrid}>
              {healthCategories.slice(0, 3).map((category) => (
                <View key={category.id} style={styles.categoryCardWrapper}>
                  {renderCategoryButton(category)}
                </View>
              ))}
            </View>
            
            <View style={styles.categoriesGrid}>
              {healthCategories.slice(3, 6).map((category) => (
                <View key={category.id} style={styles.categoryCardWrapper}>
                  {renderCategoryButton(category)}
                </View>
              ))}
            </View>
          </View>
        );

      case 'spacer':
        return <View style={{ height: 100 }} />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#F3E8FF', '#EDE9FE', '#DDD6FE']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Evcil hayvan bilgileri yükleniyor...</Text>
      </LinearGradient>
    );
  }

  if (!pet) {
    return (
      <LinearGradient
        colors={['#F3E8FF', '#EDE9FE']}
        style={styles.errorContainer}
      >
        <Text style={styles.errorText}>Evcil hayvan bulunamadı</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Geri Dön</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#F8F4FF', '#F3E8FF', '#EDE9FE']}
        style={styles.container}
      >
        <FlatList
          data={getListData()}
          renderItem={renderListItem}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  petHeader: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '700',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    marginRight: 20,
  },
  petImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  petImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  petImagePlaceholderText: {
    fontSize: 36,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  petBreed: {
    fontSize: 18,
    color: '#6B46C1',
    fontWeight: '600',
    marginBottom: 12,
  },
  petInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  petInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petInfoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  petInfoText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryCardWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  categoryCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  categoryGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
    position: 'relative',
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
  },
  selectedCategoryIcon: {
    fontSize: 26,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedCategoryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  selectedDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  recordsSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  recordsHeaderContainer: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  recordsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordsHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  recordsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  recordsLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
  },
  recordContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  recordCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  recordGradient: {
    padding: 20,
    borderRadius: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  recordIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  recordTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  recordDateContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  recordDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  recordDetailsContainer: {
    marginBottom: 12,
  },
  recordDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordDetailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  recordDetail: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  nextDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  nextDateIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  recordNextDate: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '700',
  },
  emptyRecords: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  emptyRecordsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyRecordsIcon: {
    fontSize: 56,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyRecordsTitle: {
    fontSize: 18,
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
    fontWeight: '500',
  },
  quickVaccinationButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  quickVaccinationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quickVaccinationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickVaccinationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 