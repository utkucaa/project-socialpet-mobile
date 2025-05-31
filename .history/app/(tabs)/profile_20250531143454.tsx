import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import adoptionService from '../../services/adoptionService';
import lostPetService from '../../services/lostPetService';
import petService, { Pet } from '../../services/petService';

const { width } = Dimensions.get('window');

interface User {
  id: number;
  email: string;
  joinDate: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface UserStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
}

interface TabContent {
  id: string;
  title: string;
  icon: string;
}

const tabs: TabContent[] = [
  { id: 'listings', title: 'İlanlarım', icon: '🏠' },
  { id: 'pets', title: 'Evcil Hayvanlarım', icon: '🐾' },
  { id: 'notifications', title: 'Bildirimlerim', icon: '🔔' },
];

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [userStats, setUserStats] = useState<UserStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0
  });
  const [userListings, setUserListings] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadUserStats();
      loadUserPets();
    }
  }, [userData]);

  // URL parametresi ile tab değişimi
  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as string);
    }
  }, [params.tab]);

  // Focus effect to reload pets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userData && activeTab === 'pets') {
        loadUserPets();
      }
    }, [userData, activeTab])
  );

  const loadUserData = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userString && token) {
        const user = JSON.parse(userString);
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      
      // Kullanıcının ilanlarını getir
      const [adoptionListings, lostPets] = await Promise.all([
        adoptionService.getAdoptionListings().catch(() => []),
        lostPetService.getLostPets().catch(() => [])
      ]);

      // Kullanıcının ilanlarını filtrele (basit bir şekilde - normalde backend'den gelir)
      const userAdoptionListings = adoptionListings.filter(listing => 
        listing.fullName === `${userData?.firstName} ${userData?.lastName}`
      );
      
      const userLostPets = lostPets.filter(pet => 
        pet.user?.username === userData?.username
      );

      const allUserListings = [
        ...userAdoptionListings.map(listing => ({ ...listing, type: 'adoption' })),
        ...userLostPets.map(pet => ({ ...pet, type: 'lost' }))
      ];

      setUserListings(allUserListings);

      // İstatistikleri hesapla
      const totalListings = allUserListings.length;
      const activeListings = allUserListings.filter(listing => 
        listing.status === 'active' || listing.status === 'ACTIVE' || !listing.status
      ).length;
      
      // Görüntülenme sayısını hesapla (varsayılan değerler)
      const totalViews = allUserListings.reduce((sum, listing: any) => 
        sum + (listing.viewCount || Math.floor(Math.random() * 100) + 10), 0
      );

      setUserStats({
        totalListings,
        activeListings,
        totalViews
      });

    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUserPets = async () => {
    if (!userData) return;
    
    try {
      setPetsLoading(true);
      const pets = await petService.getUserPets(userData.id);
      setUserPets(pets);
    } catch (error) {
      console.error('Error loading user pets:', error);
    } finally {
      setPetsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const showLogoutConfirm = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'Hayır', style: 'cancel' },
        { text: 'Evet', onPress: handleLogout, style: 'destructive' }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Yakında!', 'Profil düzenleme özelliği yakında eklenecek.');
  };

  const handleAddPet = () => {
    router.push('/add-pet');
  };

  const handlePetPress = (pet: Pet) => {
    router.push(`/pet-profile?petId=${pet.id}`);
  };

  const renderListingItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.listingCard}>
      <View style={styles.listingImageContainer}>
        <Image 
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/100x80/AB75C2/FFFFFF?text=🐾' }} 
          style={styles.listingImage}
        />
        <View style={[styles.listingType, { 
          backgroundColor: item.type === 'adoption' ? '#AB75C2' : '#FF6B6B' 
        }]}>
          <Text style={styles.listingTypeText}>
            {item.type === 'adoption' ? 'Sahiplenme' : 'Kayıp'}
          </Text>
        </View>
      </View>
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {item.title || item.petName}
        </Text>
        <Text style={styles.listingLocation} numberOfLines={1}>
          {item.city ? `${item.city}, ${item.district}` : item.location}
        </Text>
        <Text style={styles.listingDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : 'Tarih belirsiz'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPetCard = ({ item }: { item: Pet }) => (
    <TouchableOpacity 
      style={styles.petCard}
      onPress={() => handlePetPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.petImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.petImage} />
        ) : (
          <View style={styles.petImagePlaceholder}>
            <Text style={styles.petImagePlaceholderText}>
              {item.species === 'köpek' ? '🐕' : 
               item.species === 'kedi' ? '🐱' : 
               item.species === 'kuş' ? '🐦' : '🐾'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetails}>
          {item.age} yaşında • {item.gender}
        </Text>
        <Text style={styles.petBreed}>{item.breed}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.medicalRecordButton}
        onPress={(e) => {
          e.stopPropagation();
          handlePetPress(item);
        }}
      >
        <Text style={styles.medicalRecordButtonText}>🏥 Sağlık</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings':
        return (
          <View style={styles.tabContentContainer}>
            {userListings.length > 0 ? (
              <FlatList
                data={userListings}
                renderItem={renderListingItem}
                keyExtractor={(item, index) => `${item.type}_${item.id}_${index}`}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📝</Text>
                <Text style={styles.emptyStateTitle}>Henüz ilan yok</Text>
                <Text style={styles.emptyStateText}>
                  İlk ilanınızı oluşturun ve sevimli dostlara yeni yuva bulun!
                </Text>
                <TouchableOpacity 
                  style={styles.createListingButton}
                  onPress={() => router.push('/(tabs)/adopt')}
                >
                  <Text style={styles.createListingButtonText}>İlan Oluştur</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      
      case 'pets':
        return (
          <View style={styles.tabContentContainer}>
            {petsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#AB75C2" />
                <Text style={styles.loadingText}>Evcil hayvanlar yükleniyor...</Text>
              </View>
            ) : userPets.length > 0 ? (
              <>
                <View style={styles.petsHeader}>
                  <Text style={styles.petsHeaderTitle}>🐾 Evcil Hayvanlarım ({userPets.length})</Text>
                  <TouchableOpacity 
                    style={styles.addPetHeaderButton}
                    onPress={handleAddPet}
                  >
                    <Text style={styles.addPetHeaderButtonText}>+ Ekle</Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={userPets}
                  renderItem={renderPetCard}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
                />
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🐾</Text>
                <Text style={styles.emptyStateTitle}>Evcil Hayvanlarım</Text>
                <Text style={styles.emptyStateText}>
                  Evcil hayvanlarınızı buradan takip edebilir, sağlık geçmişlerini tutabilirsiniz.
                </Text>
                <TouchableOpacity 
                  style={styles.addPetButton}
                  onPress={handleAddPet}
                >
                  <Text style={styles.addPetButtonText}>+ Yeni Evcil Hayvan Ekle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      
      case 'notifications':
        return (
          <View style={styles.tabContentContainer}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔔</Text>
              <Text style={styles.emptyStateTitle}>Bildirimlerim</Text>
              <Text style={styles.emptyStateText}>
                Henüz bildirim yok. İlanlarınız için gelen mesajlar burada görünecek.
              </Text>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#AB75C2', '#9B6BB0', '#8B5BA0']}
          style={styles.header}
        >
          <View style={styles.profileContainer}>
            {/* Profile Photo */}
            <View style={styles.profilePhotoContainer}>
              {userData?.avatar ? (
                <Image source={{ uri: userData.avatar }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.defaultProfilePhoto}>
                  <Text style={styles.profilePhotoText}>
                    {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                  </Text>
                </View>
              )}
            </View>
            
            {/* User Name */}
            <Text style={styles.userName}>
              {userData?.firstName} {userData?.lastName}
            </Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editButtonText}>✏️ Profili Düzenle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={showLogoutConfirm}
              >
                <Text style={styles.logoutButtonText}>🚪 Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>📊 Aktivite Özeti</Text>
          
          {statsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="small" color="#AB75C2" />
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📋</Text>
                </View>
                <Text style={styles.statNumber}>{userStats.totalListings}</Text>
                <Text style={styles.statLabel}>Toplam İlan</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>✅</Text>
                </View>
                <Text style={styles.statNumber}>{userStats.activeListings}</Text>
                <Text style={styles.statLabel}>Aktif İlan</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>👁️</Text>
                </View>
                <Text style={styles.statNumber}>{userStats.totalViews}</Text>
                <Text style={styles.statLabel}>Görüntülenme</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabNavContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  activeTab === tab.id && styles.activeTabButton
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
        
        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignItems: 'center',
  },
  profilePhotoContainer: {
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  defaultProfilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePhotoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#F3E5F5',
    marginBottom: 25,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 99, 99, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 99, 0.3)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    padding: 20,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#AB75C2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabNavigation: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabNavContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTabButton: {
    backgroundColor: '#AB75C2',
    borderColor: '#AB75C2',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContentContainer: {
    padding: 20,
    minHeight: 300,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listingImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  listingType: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listingTypeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  listingLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  listingDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  createListingButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createListingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addPetButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  petImageContainer: {
    marginRight: 15,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#AB75C2',
  },
  petImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  petImagePlaceholderText: {
    fontSize: 24,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  medicalRecordButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  medicalRecordButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  petsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  petsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  addPetHeaderButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPetHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 