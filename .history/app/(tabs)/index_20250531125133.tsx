import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import adoptionService, { AdoptionListing } from '../../services/adoptionService';
import lostPetService, { LostPet } from '../../services/lostPetService';

const { width } = Dimensions.get('window');

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface RecommendedItem {
  id: number;
  title: string;
  image: string;
  type: 'adopt' | 'lost';
  location: string;
  data: AdoptionListing | LostPet;
}

interface FeatureCard {
  id: number;
  icon: string;
  title: string;
  description: string;
  color: string;
  route: string;
}

const featureCards: FeatureCard[] = [
  {
    id: 1,
    icon: '🐾',
    title: 'Sahiplenme İlanları',
    description: 'Yeni yuva arayan sevimli dostlara göz atın.',
    color: '#FFE4E1',
    route: '/adopt'
  },
  {
    id: 2,
    icon: '🔍',
    title: 'Kayıp İlanları',
    description: 'Kayıp evcil hayvanlar için destek olun.',
    color: '#E1F5FE',
    route: '/lost'
  },
  {
    id: 3,
    icon: '💬',
    title: 'Topluluk (Soru-Cevap)',
    description: 'Sorular sorun, cevaplar verin. Topluluğa katılın.',
    color: '#F3E5F5',
    route: '/community'
  },
  {
    id: 4,
    icon: '🧬',
    title: 'Cins Dedektifi (AI Özellikli)',
    description: 'Fotoğrafla cins tahmini yapın.',
    color: '#E8F5E8',
    route: '/breed-detector'
  },
  {
    id: 5,
    icon: '🏥',
    title: 'Veteriner & Petshoplar',
    description: 'Size en yakın veteriner ve petshopları keşfedin.',
    color: '#FFF3E0',
    route: '/services'
  },
  {
    id: 6,
    icon: '❤️',
    title: 'Bağış Yap',
    description: 'Sokak hayvanları için destek olun, mama bağışlayın.',
    color: '#FFEBEE',
    route: '/donate'
  }
];

export default function HomeScreen() {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadUser();
  }, []);

  useEffect(() => {
    if (userData) {
      loadRecommendedItems();
    }
  }, [userData]);

  const checkAuthAndLoadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');
      
      if (!token || !userString) {
        // Giriş yapılmamış, login sayfasına yönlendir
        router.replace('/login');
        return;
      }
      
      const user = JSON.parse(userString);
      setUserData(user);
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedItems = async () => {
    try {
      setRecommendedLoading(true);
      
      // Paralel olarak hem sahiplenme hem kayıp ilanlarını çek
      const [adoptionListings, lostPets] = await Promise.all([
        adoptionService.getAdoptionListings().catch(() => []),
        lostPetService.getLostPets().catch(() => [])
      ]);

      // Sahiplenme ilanlarını RecommendedItem formatına dönüştür
      const adoptionItems: RecommendedItem[] = adoptionListings.slice(0, 3).map((listing: AdoptionListing) => ({
        id: listing.id,
        title: listing.title || listing.petName,
        image: listing.imageUrl || 'https://via.placeholder.com/200x150/FFD700/FFFFFF?text=🐕',
        type: 'adopt' as const,
        location: `${listing.city}, ${listing.district}`,
        data: listing
      }));

      // Kayıp ilanlarını RecommendedItem formatına dönüştür
      const lostItems: RecommendedItem[] = lostPets.slice(0, 3).map((pet: LostPet) => ({
        id: pet.id,
        title: pet.title,
        image: pet.imageUrl || 'https://via.placeholder.com/200x150/8B4513/FFFFFF?text=🐱',
        type: 'lost' as const,
        location: pet.lastSeenLocation || pet.location,
        data: pet
      }));

      // İki listeyi birleştir ve karışık hale getir
      const allItems = [...adoptionItems, ...lostItems];
      
      // Fisher-Yates shuffle algoritması ile karıştır
      for (let i = allItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
      }

      // Maksimum 6 ilan göster
      setRecommendedItems(allItems.slice(0, 6));
      
    } catch (error) {
      console.error('Önerilen ilanlar yüklenirken hata:', error);
      // Hata durumunda boş array set et
      setRecommendedItems([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  const handleFeaturePress = (route: string) => {
    console.log('Navigate to:', route);
    
    switch (route) {
      case '/adopt':
        router.push('/(tabs)/adopt');
        break;
      case '/lost':
        router.push('/(tabs)/lost');
        break;
      case '/community':
        router.push('/(tabs)/community');
        break;
      case '/services':
        router.push('/(tabs)/services');
        break;
      case '/breed-detector':
        // TODO: Implement breed detector page
        Alert.alert('Yakında!', 'Cins dedektifi özelliği yakında eklenecek.');
        break;
      case '/donate':
        router.push('/donate');
        break;
      default:
        console.log('Unknown route:', route);
    }
  };

  const renderFeatureCard = ({ item, index }: { item: FeatureCard; index: number }) => (
    <TouchableOpacity 
      style={[styles.featureCard, { backgroundColor: item.color }]}
      onPress={() => handleFeaturePress(item.route)}
      activeOpacity={0.8}
    >
      <Text style={styles.featureIcon}>{item.icon}</Text>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderRecommendedItem = ({ item }: { item: RecommendedItem }) => (
    <TouchableOpacity 
      style={styles.recommendedCard} 
      activeOpacity={0.8}
      onPress={() => {
        if (item.type === 'adopt') {
          router.push(`/adoption-detail?id=${item.id}`);
        } else {
          router.push(`/lost-detail?id=${item.id}`);
        }
      }}
    >
      <Image source={{ uri: item.image }} style={styles.recommendedImage} />
      <View style={styles.recommendedInfo}>
        <Text style={styles.recommendedTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.recommendedLocation} numberOfLines={1}>{item.location}</Text>
        <View style={[styles.recommendedType, { 
          backgroundColor: item.type === 'adopt' ? '#AB75C2' : '#FF6B6B' 
        }]}>
          <Text style={styles.recommendedTypeText}>
            {item.type === 'adopt' ? 'Sahiplenme' : 'Kayıp'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0', '#8B5BA0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Hoş geldiniz {userData?.firstName}! 👋
          </Text>
          <Text style={styles.slogan}>
            Evcil Hayvanların İçin En İyi Platform
          </Text>
          <Text style={styles.subSlogan}>
            Kayıp ilanları oluştur, yeni bir dost sahiplen, sağlık takibini yap ve daha fazlası!
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>🌟 Özellikler</Text>
        
        <FlatList
          data={featureCards}
          renderItem={renderFeatureCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        />

        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>✨ Önerilen İlanlar</Text>
          {recommendedLoading ? (
            <View style={styles.recommendedLoadingContainer}>
              <ActivityIndicator size="small" color="#AB75C2" />
              <Text style={styles.recommendedLoadingText}>İlanlar yükleniyor...</Text>
            </View>
          ) : recommendedItems.length > 0 ? (
            <FlatList
              data={recommendedItems}
              renderItem={renderRecommendedItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedList}
              ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
            />
          ) : (
            <View style={styles.noRecommendedContainer}>
              <Text style={styles.noRecommendedText}>Henüz ilan bulunmamaktadır.</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadRecommendedItems}
              >
                <Text style={styles.refreshButtonText}>Yenile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.quickStats}>
          <LinearGradient
            colors={['#F8F9FA', '#E9ECEF']}
            style={styles.statsCard}
          >
            <Text style={styles.statsTitle}>📊 Platform İstatistikleri</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1,247</Text>
                <Text style={styles.statLabel}>Sahiplenme</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>89</Text>
                <Text style={styles.statLabel}>Kayıp İlan</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2,156</Text>
                <Text style={styles.statLabel}>Üye</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Veteriner</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 10,
  },
  slogan: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 36,
  },
  subSlogan: {
    fontSize: 16,
    color: '#F3E5F5',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  recommendedSection: {
    marginTop: 30,
  },
  recommendedList: {
    paddingLeft: 0,
  },
  recommendedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recommendedImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  recommendedInfo: {
    padding: 15,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  recommendedLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  recommendedType: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedTypeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickStats: {
    marginTop: 30,
    marginBottom: 100, // Space for bottom navigation
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#AB75C2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recommendedLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  recommendedLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  noRecommendedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noRecommendedText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#AB75C2',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
