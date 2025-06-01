import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
  const { tab } = useLocalSearchParams<{ tab?: string }>();
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
  
  // Modal states
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Form states
  const [petName, setPetName] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petGender, setPetGender] = useState<'erkek' | 'dişi'>('erkek');
  const [petSpecies, setPetSpecies] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [selectedBreed, setSelectedBreed] = useState<{id: number, name: string} | null>(null);
  const [petImageUri, setPetImageUri] = useState<string | null>(null);

  // Dropdown states
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  // API data states
  const [animalTypes, setAnimalTypes] = useState<{code: string, name: string}[]>([]);
  const [availableBreeds, setAvailableBreeds] = useState<{id: number, name: string, description: string, animalType: string}[]>([]);
  const [loadingAnimalTypes, setLoadingAnimalTypes] = useState(false);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  // Computed values (statik artık kullanmıyoruz)
  // const availableBreeds = (petSpecies && ANIMAL_SPECIES[petSpecies as keyof typeof ANIMAL_SPECIES]) || [];

  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadUserStats();
      loadUserPets();
    }
  }, [userData]);

  // Set activeTab based on URL parameter
  useEffect(() => {
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  // Focus effect to reload pets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userData && activeTab === 'pets') {
        loadUserPets();
      }
    }, [userData, activeTab])
  );

  // Set initial breed when species changes
  useEffect(() => {
    if (availableBreeds && Array.isArray(availableBreeds) && availableBreeds.length > 0) {
      const firstBreed = availableBreeds[0];
      setPetBreed(firstBreed.name);
      setSelectedBreed({ id: firstBreed.id, name: firstBreed.name });
    } else {
      setPetBreed('');
      setSelectedBreed(null);
    }
  }, [availableBreeds]);

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

  // Hayvan türlerini yükle
  const loadAnimalTypes = async () => {
    try {
      setLoadingAnimalTypes(true);
      const types = await petService.getAnimalTypes();
      setAnimalTypes(types);
      console.log('🐾 Hayvan türleri yüklendi:', types);
    } catch (error) {
      console.error('Error loading animal types:', error);
    } finally {
      setLoadingAnimalTypes(false);
    }
  };

  // Seçili hayvan türüne göre cinslerini yükle
  const loadBreedsByAnimalType = async (animalType: string) => {
    try {
      setLoadingBreeds(true);
      const breeds = await petService.getBreedsByAnimalType(animalType);
      setAvailableBreeds(breeds);
      console.log('🐾 Cinsler yüklendi:', breeds);
      
      // İlk cinsi otomatik seç
      if (breeds.length > 0) {
        const firstBreed = breeds[0];
        setPetBreed(firstBreed.name);
        setSelectedBreed({ id: firstBreed.id, name: firstBreed.name });
      } else {
        setPetBreed('');
        setSelectedBreed(null);
      }
    } catch (error) {
      console.error('Error loading breeds:', error);
      setAvailableBreeds([]);
      setPetBreed('');
      setSelectedBreed(null);
    } finally {
      setLoadingBreeds(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // router.replace('/login');
      Alert.alert('Çıkış', 'Çıkış işlemi tamamlandı');
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
    console.log('🐾 Evcil hayvan ekleme butonu tıklandı!');
    console.log('handleAddPet called');
    resetForm();
    setShowAddPetModal(true);
    console.log('Modal should be open:', true);
    
    // Modal açıldığında hayvan türlerini yükle
    loadAnimalTypes();
  };

  const resetForm = () => {
    setPetName('');
    setPetAge('');
    setPetGender('erkek');
    setPetSpecies('');
    setPetBreed(''); // Start empty since no species selected
    setSelectedBreed(null);
    setPetImageUri(null);
    // Close all dropdowns
    setShowGenderDropdown(false);
    setShowSpeciesDropdown(false);
    setShowBreedDropdown(false);
  };

  const closeModal = () => {
    setShowAddPetModal(false);
    resetForm();
  };

  // Dropdown handlers
  const toggleGenderDropdown = () => {
    setShowGenderDropdown(!showGenderDropdown);
    setShowSpeciesDropdown(false);
    setShowBreedDropdown(false);
  };

  const toggleSpeciesDropdown = () => {
    setShowSpeciesDropdown(!showSpeciesDropdown);
    setShowGenderDropdown(false);
    setShowBreedDropdown(false);
  };

  const toggleBreedDropdown = () => {
    setShowBreedDropdown(!showBreedDropdown);
    setShowGenderDropdown(false);
    setShowSpeciesDropdown(false);
  };

  const selectGender = (gender: 'erkek' | 'dişi') => {
    setPetGender(gender);
    setShowGenderDropdown(false);
  };

  const selectSpecies = (species: string) => {
    setPetSpecies(species);
    setShowSpeciesDropdown(false);
    
    // Seçilen türe göre API'dan cinslerini yükle
    const selectedAnimalType = animalTypes.find(type => type.name === species);
    if (selectedAnimalType) {
      loadBreedsByAnimalType(selectedAnimalType.code);
    } else {
      setAvailableBreeds([]);
      setPetBreed('');
    }
  };

  const selectBreed = (breedName: string) => {
    const selectedBreedObj = availableBreeds.find(breed => breed.name === breedName);
    setPetBreed(breedName);
    setSelectedBreed(selectedBreedObj ? { id: selectedBreedObj.id, name: selectedBreedObj.name } : null);
    setShowBreedDropdown(false);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gerekli.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPetImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleSubmitPet = async () => {
    console.log('🔵 handleSubmitPet başladı');
    console.log('userData:', userData);
    console.log('userData.id:', userData?.id);
    
    // Form validation
    if (!petName.trim()) {
      Alert.alert('Hata', 'Lütfen hayvanın ismini girin.');
      return;
    }

    if (!petAge.trim() || isNaN(Number(petAge)) || Number(petAge) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir yaş girin.');
      return;
    }

    if (!petSpecies.trim()) {
      Alert.alert('Hata', 'Lütfen hayvan türünü seçin.');
      return;
    }

    if (!petBreed.trim() || !selectedBreed) {
      Alert.alert('Hata', 'Lütfen cinsi seçin.');
      return;
    }

    if (!userData) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı.');
      return;
    }

    if (!userData.id) {
      Alert.alert('Hata', 'Kullanıcı ID bilgisi eksik. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      setModalLoading(true);

      const petData = {
        name: petName.trim(),
        age: Number(petAge),
        gender: petGender,
        species: petSpecies,
        breed: petBreed,
        selectedBreed: selectedBreed, // Seçilen breed objesini gönder
        imageUrl: petImageUri || undefined,
        ownerId: userData.id
      };

      console.log('📝 Gönderilecek pet verisi:', petData);

      const newPet = await petService.addPet(petData);
      console.log('✅ Yeni pet eklendi:', newPet);
      
      // Modal'ı kapat ve formu sıfırla
      closeModal();
      
      // Evcil hayvanlar sekmesine geç
      setActiveTab('pets');
      
      // Pet listesini yeniden yükle
      await loadUserPets();

      Alert.alert('Başarılı!', 'Evcil hayvanınız başarıyla eklendi.');

    } catch (error) {
      console.error('💥 Error adding pet:', error);
      Alert.alert('Hata', 'Evcil hayvan eklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setModalLoading(false);
    }
  };

  const handlePetPress = (pet: Pet) => {
    // Navigate to pet profile with pet ID
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
              <View>
                {userListings.map((item, index) => (
                  <View key={`${item.type}_${item.id}_${index}`}>
                    {renderListingItem({ item })}
                    {index < userListings.length - 1 && <View style={{ height: 15 }} />}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📝</Text>
                <Text style={styles.emptyStateTitle}>Henüz ilan yok</Text>
                <Text style={styles.emptyStateText}>
                  İlk ilanınızı oluşturun ve sevimli dostlara yeni yuva bulun!
                </Text>
                <TouchableOpacity 
                  style={styles.createListingButton}
                  onPress={() => Alert.alert('İlan Oluştur', 'Bu özellik yakında eklenecek')}
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
                
                <View>
                  {userPets.map((item, index) => (
                    <View key={item.id}>
                      {renderPetCard({ item })}
                      {index < userPets.length - 1 && <View style={{ height: 15 }} />}
                    </View>
                  ))}
                </View>
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

  const renderAddPetModal = () => {
    console.log('renderAddPetModal called, showAddPetModal:', showAddPetModal);
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddPetModal}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Evcil Hayvan Ekle</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Photo Section */}
                <View style={styles.modalPhotoSection}>
                  <TouchableOpacity style={styles.modalPhotoButton} onPress={pickImage}>
                    {petImageUri ? (
                      <Image source={{ uri: petImageUri }} style={styles.modalPetPhoto} />
                    ) : (
                      <View style={styles.modalPhotoPlaceholder}>
                        <Text style={styles.modalPhotoPlaceholderIcon}>📷</Text>
                        <Text style={styles.modalPhotoPlaceholderText}>Fotoğraf Ekle</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.modalFormSection}>
                  {/* Name */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Hayvan İsmi *</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      value={petName}
                      onChangeText={setPetName}
                      placeholder="Örn: Karamel, Boncuk, Şeker..."
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  {/* Age */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Yaş *</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      value={petAge}
                      onChangeText={setPetAge}
                      placeholder="Yaş (sayı olarak)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Gender */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Cinsiyet *</Text>
                    <View style={styles.modalDropdownContainer}>
                      <TouchableOpacity 
                        style={styles.modalCustomDropdown} 
                        onPress={toggleGenderDropdown}
                      >
                        <Text style={styles.modalDropdownText}>
                          {petGender === 'erkek' ? 'Erkek' : 'Dişi'}
                        </Text>
                        <Text style={[styles.modalDropdownArrow, showGenderDropdown && styles.modalDropdownArrowUp]}>▼</Text>
                      </TouchableOpacity>
                      
                      {showGenderDropdown && (
                        <View style={styles.modalDropdownMenu}>
                          <TouchableOpacity 
                            style={styles.modalDropdownItem} 
                            onPress={() => selectGender('erkek')}
                          >
                            <Text style={styles.modalDropdownItemText}>Erkek</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.modalDropdownItem} 
                            onPress={() => selectGender('dişi')}
                          >
                            <Text style={styles.modalDropdownItemText}>Dişi</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Species */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Hayvan Türü *</Text>
                    <View style={styles.modalDropdownContainer}>
                      <TouchableOpacity 
                        style={styles.modalCustomDropdown} 
                        onPress={toggleSpeciesDropdown}
                      >
                        <Text style={styles.modalDropdownText}>
                          {petSpecies ? petSpecies.charAt(0).toUpperCase() + petSpecies.slice(1) : 'Hayvan türü seçiniz'}
                        </Text>
                        <Text style={[styles.modalDropdownArrow, showSpeciesDropdown && styles.modalDropdownArrowUp]}>▼</Text>
                      </TouchableOpacity>
                      
                      {showSpeciesDropdown && (
                        <View style={styles.modalDropdownMenu}>
                          {animalTypes.map((type) => (
                            <TouchableOpacity 
                              key={type.code}
                              style={styles.modalDropdownItem} 
                              onPress={() => selectSpecies(type.name)}
                            >
                              <Text style={styles.modalDropdownItemText}>
                                {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Breed */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Cinsi *</Text>
                    <View style={styles.modalDropdownContainer}>
                      <TouchableOpacity 
                        style={[styles.modalCustomDropdown, !petSpecies && styles.modalDropdownDisabled]}
                        onPress={petSpecies ? toggleBreedDropdown : undefined}
                        disabled={!petSpecies}
                      >
                        <Text style={[styles.modalDropdownText, !petSpecies && styles.modalDropdownTextDisabled]}>
                          {!petSpecies ? 'Önce hayvan türünü seçin' : (petBreed || 'Cinsi seçin')}
                        </Text>
                        <Text style={[styles.modalDropdownArrow, showBreedDropdown && styles.modalDropdownArrowUp]}>▼</Text>
                      </TouchableOpacity>
                      
                      {showBreedDropdown && petSpecies && (
                        <View style={styles.modalDropdownMenu}>
                          {availableBreeds.map((breedItem: {id: number, name: string, description: string, animalType: string}) => (
                            <TouchableOpacity 
                              key={breedItem.id}
                              style={styles.modalDropdownItem} 
                              onPress={() => selectBreed(breedItem.name)}
                            >
                              <Text style={styles.modalDropdownItemText}>{breedItem.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                  style={[styles.modalSubmitButton, modalLoading && styles.modalSubmitButtonDisabled]}
                  onPress={handleSubmitPet}
                  disabled={modalLoading}
                >
                  <LinearGradient
                    colors={modalLoading ? ['#9CA3AF', '#6B7280'] : ['#AB75C2', '#9B6BB0']}
                    style={styles.modalSubmitButtonGradient}
                  >
                    {modalLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.modalSubmitButtonText}>🐾 Evcil Hayvan Ekle</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    );
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
      
      {/* Add Pet Modal */}
      {renderAddPetModal()}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: '85%',
    height: '80%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
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
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalPhotoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalPhotoButton: {
    // Same as photoButton
  },
  modalPetPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#AB75C2',
  },
  modalPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  modalPhotoPlaceholderIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  modalPhotoPlaceholderText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalFormSection: {
    padding: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
  },
  modalDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  modalCustomDropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  modalDropdownTextDisabled: {
    color: '#9CA3AF',
  },
  modalDropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalDropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  modalDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalDropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalSubmitButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.7,
  },
  modalSubmitButtonGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalDropdownDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
}); 