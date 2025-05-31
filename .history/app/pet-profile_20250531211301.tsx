import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import petService, { Pet } from '../services/petService';

interface HealthRecord {
  id: string;
  type: 'vaccination' | 'checkup' | 'treatment' | 'medication' | 'surgery' | 'allergy';
  title: string;
  date: string;
  description?: string;
  veterinarian?: string;
  dosage?: string;
  weight?: number;
  unit?: string;
  severity?: 'low' | 'medium' | 'high';
  symptoms?: string;
  duration?: string;
  cost?: number;
  nextDate?: string;
}

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
    type: 'vaccination'
  },
  {
    id: 'checkups',
    title: 'Kontroller',
    icon: '🩺',
    color: '#3B82F6',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    type: 'checkup'
  },
  {
    id: 'treatments',
    title: 'Tedaviler',
    icon: '⚕️',
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#D97706'],
    type: 'treatment'
  },
  {
    id: 'medications',
    title: 'İlaçlar',
    icon: '💊',
    color: '#8B5CF6',
    gradientColors: ['#8B5CF6', '#7C3AED'],
    type: 'medication'
  },
  {
    id: 'surgeries',
    title: 'Ameliyatlar',
    icon: '🏥',
    color: '#EF4444',
    gradientColors: ['#EF4444', '#DC2626'],
    type: 'surgery'
  },
  {
    id: 'allergies',
    title: 'Alerjiler',
    icon: '🤧',
    color: '#F97316',
    gradientColors: ['#F97316', '#EA580C'],
    type: 'allergy'
  }
];

type ListItem = 
  | { type: 'header'; pet: Pet }
  | { type: 'categories' }
  | { type: 'spacer' };

export default function PetProfileScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory>(healthCategories[0]);

  useEffect(() => {
    if (petId) {
      loadPetData();
    }
  }, [petId]);

  const loadPetData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!petId) {
        throw new Error('Pet ID bulunamadı');
      }
      
      const petData = await petService.getPetDetails(petId);
      if (petData) {
        setPet(petData);
      } else {
        throw new Error('Evcil hayvan bulunamadı');
      }
    } catch (err) {
      console.error('Error loading pet:', err);
      setError('Evcil hayvan bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && pet) {
        // Here you would normally upload the image and update the pet
        const newImageUrl = result.assets[0].uri;
        setPet({...pet, imageUrl: newImageUrl});
        Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
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
    // Update selected category for visual feedback
    setSelectedCategory(category);
    
    if (category.id === 'vaccines') {
      // Navigate to vaccination screen for vaccines category
      handleVaccinationPress();
    } else {
      // For other categories, just update selection (can add navigation later)
      console.log(`Selected category: ${category.title}`);
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

  const renderCategoryButton = (item: HealthCategory) => {
    const isSelected = selectedCategory.id === item.id;
    
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isSelected ? ['#B2DFDB', '#80CBC4'] : ['#FFFFFF', '#F8FAFC']} // Light teal when selected, white when not
          style={styles.categoryGradient}
        >
          <View style={styles.categoryIconContainer}>
            <Text style={[styles.categoryIcon, { color: isSelected ? '#00695C' : '#6B7280' }]}>
              {item.icon}
            </Text>
          </View>
          <Text style={[styles.categoryTitle, { color: isSelected ? '#00695C' : '#374151' }]}>
            {item.title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

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
            
            {/* Centered Profile Section */}
            <View style={styles.profileContainer}>
              {/* Profile Image */}
              <TouchableOpacity onPress={handleImagePicker} style={styles.imageContainer}>
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
                <View style={styles.editPhotoOverlay}>
                  <Text style={styles.editPhotoText}>📷</Text>
                </View>
              </TouchableOpacity>
              
              {/* Pet Details */}
              <View style={styles.petDetailsContainer}>
                <Text style={styles.petName}>{item.pet.name}</Text>
                <Text style={styles.petBreed}>{item.pet.breed}</Text>
                
                {/* Age and Gender Info */}
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
                </View>
              </View>
            </View>
          </LinearGradient>
        );

      case 'categories':
        return (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>🏥 Sağlık Kategorileri</Text>
            
            {/* First Row - 2 categories */}
            <View style={styles.categoriesRow}>
              {healthCategories.slice(0, 2).map((category) => (
                <View key={category.id} style={styles.categoryWrapper}>
                  {renderCategoryButton(category)}
                </View>
              ))}
            </View>
            
            {/* Second Row - 2 categories */}
            <View style={styles.categoriesRow}>
              {healthCategories.slice(2, 4).map((category) => (
                <View key={category.id} style={styles.categoryWrapper}>
                  {renderCategoryButton(category)}
                </View>
              ))}
            </View>
            
            {/* Third Row - 2 categories */}
            <View style={styles.categoriesRow}>
              {healthCategories.slice(4, 6).map((category) => (
                <View key={category.id} style={styles.categoryWrapper}>
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Evcil hayvan profili yükleniyor...</Text>
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Evcil hayvan bulunamadı'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPetData}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Hide the header for this screen */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        <FlatList
          data={getListData()}
          renderItem={renderListItem}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E8FF', // Light purple/lavender background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 20,
  },
  petHeader: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    padding: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    marginRight: 20,
    alignItems: 'center',
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  petImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  petImagePlaceholderText: {
    fontSize: 40,
  },
  petDetailsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  petBreed: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  petInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  petInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 75,
    justifyContent: 'center',
  },
  petInfoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  petInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  categoryWrapper: {
    width: '48%',
  },
  categoryCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  editPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
}); 