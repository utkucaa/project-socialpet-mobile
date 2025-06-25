import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import citiesData from '../../assets/il-ilce.json';
import lostPetService, { LostPet } from '../../services/lostPetService';

interface City {
  il_adi: string;
  ilceler: { ilce_adi: string }[];
}

const animalTypes = ['Köpek', 'Kedi', 'Kuş', 'Balık', 'Tavşan', 'Diğer'];
const genders = ['Erkek', 'Dişi'];

export default function LostScreen() {
  const [listings, setListings] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LostPet>({
    petName: '',
    animalType: '',
    breed: '',
    age: 0,
    gender: '',
    city: '',
    district: '',
    lastSeenDate: new Date().toISOString(),
    lastSeenLocation: '',
    description: '',
    contactName: '',
    contactPhone: '',
    reward: '',
    isFound: false,
    photos: []
  });

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAnimalTypeDropdown, setShowAnimalTypeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities] = useState<string[]>(citiesData.data.map((city: City) => city.il_adi));
  const [searchFilter, setSearchFilter] = useState({
    petType: '',
    city: ''
  });

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    if (formData.city) {
      const selectedCity = citiesData.data.find((city: City) => city.il_adi === formData.city);
      if (selectedCity) {
        const cityDistricts = selectedCity.ilceler.map(district => district.ilce_adi);
        setDistricts(cityDistricts);
        setFormData({
          ...formData,
          district: '',
          lastSeenLocation: ''
        });
      }
    }
  }, [formData.city]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await lostPetService.getLostPets();
      setListings(data);
    } catch (error: any) {
      console.error('İlanlar yüklenirken hata:', error);
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = listings.filter(item => {
      const matchesType = !searchFilter.petType || item.animalType === searchFilter.petType;
      const matchesCity = !searchFilter.city || item.city === searchFilter.city;
      return matchesType && matchesCity;
    });
    
    if (filtered.length === 0 && (searchFilter.petType || searchFilter.city)) {
      Alert.alert('Sonuç Bulunamadı', 'Arama kriterlerinize uygun ilan bulunamadı.');
    } else if (searchFilter.petType || searchFilter.city) {
      Alert.alert('Arama Tamamlandı', `${filtered.length} ilan bulundu.`);
    }
    
    setListings(filtered);
  };

  const clearSearch = () => {
    setSearchFilter({
      petType: '',
      city: ''
    });
    loadListings();
    setShowAnimalTypeDropdown(false);
    setShowCityDropdown(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    // Her zaman true döndür, hiçbir alan zorunlu değil
    return true;
  };

  const handleSubmit = async () => {
    try {
      // Tarih formatı kontrolünü kaldır
      setSubmitting(true);
      
      const newListing = await lostPetService.createLostPet(formData as LostPet);

      if (newListing) {
        Alert.alert(
          'Başarılı',
          'Kayıp ilanınız başarıyla oluşturuldu ve admin onayına gönderildi.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                setCreateModalVisible(false);
                resetForm();
                loadListings();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      petName: '',
      animalType: '',
      breed: '',
      age: 0,
      gender: '',
      city: '',
      district: '',
      lastSeenDate: new Date().toISOString(),
      lastSeenLocation: '',
      description: '',
      contactName: '',
      contactPhone: '',
      reward: '',
      isFound: false,
      photos: []
    });
    setSelectedPhoto(null);
  };

  const renderListingCard = ({ item }: { item: LostPet }) => (
    <TouchableOpacity 
      style={styles.listingCard} 
      activeOpacity={0.8}
      onPress={() => {
        router.push({
          pathname: '/lost-detail',
          params: { id: item.id?.toString() }
        });
      }}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=🐾' }} 
        style={styles.listingImage} 
      />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle}>{item.petName}</Text>
        <Text style={styles.listingDetails}>
          {item.animalType} • {item.city}
        </Text>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description || `${item.breed || ''} ${item.gender || ''} ${item.age ? `${item.age} yaşında` : ''}`}
        </Text>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => {
            router.push({
              pathname: '/lost-detail',
              params: { id: item.id?.toString() }
            });
          }}
        >
          <Text style={styles.detailButtonText}>Detayları Gör</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={[
          styles.stepDot,
          currentStep >= step ? styles.stepDotActive : null
        ]}>
          <Text style={[
            styles.stepText,
            currentStep >= step ? styles.stepTextActive : null
          ]}>{step}</Text>
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Temel Bilgiler</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hayvan Türü</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.customDropdown} 
                  onPress={() => setShowAnimalTypeDropdown(!showAnimalTypeDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {formData.animalType || 'Seçiniz...'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showAnimalTypeDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showAnimalTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    {animalTypes.map((type) => (
                      <TouchableOpacity 
                        key={type}
                        style={styles.dropdownItem} 
                        onPress={() => {
                          setFormData({...formData, animalType: type});
                          setShowAnimalTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hayvan Adı</Text>
              <TextInput
                style={styles.textInput}
                value={formData.petName}
                onChangeText={(value) => setFormData({...formData, petName: value})}
                placeholder="Örn: Pamuk"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cinsi</Text>
              <TextInput
                style={styles.textInput}
                value={formData.breed}
                onChangeText={(value) => setFormData({...formData, breed: value})}
                placeholder="Örn: Tekir, Golden Retriever"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Yaşı</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.age?.toString()}
                  onChangeText={(value) => setFormData({...formData, age: parseInt(value) || 0})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Cinsiyeti</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.customDropdown} 
                    onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {formData.gender || 'Seçiniz...'}
                    </Text>
                    <Text style={[styles.dropdownArrow, showGenderDropdown && styles.dropdownArrowUp]}>▼</Text>
                  </TouchableOpacity>
                  
                  {showGenderDropdown && (
                    <View style={styles.dropdownMenu}>
                      {genders.map((gender) => (
                        <TouchableOpacity 
                          key={gender}
                          style={styles.dropdownItem} 
                          onPress={() => {
                            setFormData({...formData, gender: gender});
                            setShowGenderDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{gender}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Şehir</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.customDropdown} 
                    onPress={() => setShowCityDropdown(!showCityDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {formData.city || 'Seçiniz...'}
                    </Text>
                    <Text style={[styles.dropdownArrow, showCityDropdown && styles.dropdownArrowUp]}>▼</Text>
                  </TouchableOpacity>
                  
                  {showCityDropdown && (
                    <View style={[styles.dropdownMenu, styles.cityDropdownMenu]}>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {cities.map((city) => (
                          <TouchableOpacity 
                            key={city}
                            style={styles.dropdownItem} 
                            onPress={() => {
                              setFormData({...formData, city: city});
                              setShowCityDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{city}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>İlçe</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.customDropdown, !formData.city && styles.dropdownDisabled]} 
                    onPress={() => formData.city && setShowDistrictDropdown(!showDistrictDropdown)}
                    disabled={!formData.city}
                  >
                    <Text style={[styles.dropdownText, !formData.city && styles.dropdownTextDisabled]}>
                      {!formData.city ? 'Önce şehir seçin' : (formData.district || 'Seçiniz...')}
                    </Text>
                    <Text style={[styles.dropdownArrow, showDistrictDropdown && styles.dropdownArrowUp]}>▼</Text>
                  </TouchableOpacity>
                  
                  {showDistrictDropdown && (
                    <View style={[styles.dropdownMenu, styles.districtDropdownMenu]}>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {districts.map((district) => (
                          <TouchableOpacity 
                            key={district}
                            style={styles.dropdownItem} 
                            onPress={() => {
                              setFormData({...formData, district: district});
                              setShowDistrictDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{district}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Detay Bilgiler</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kaybolduğu Tarih</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastSeenDate}
                onChangeText={(value) => setFormData({...formData, lastSeenDate: value})}
                placeholder="YYYY-AA-GG (örn: 2024-03-20)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kaybolduğu Yer</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastSeenLocation}
                onChangeText={(value) => setFormData({...formData, lastSeenLocation: value})}
                placeholder="Mümkün olduğunca detaylı belirtin"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => setFormData({...formData, description: value})}
                placeholder="Fiziksel özellikleri, varsa tasma rengi, özel işaretleri vb."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İletişim Adı</Text>
              <TextInput
                style={styles.textInput}
                value={formData.contactName}
                onChangeText={(value) => setFormData({...formData, contactName: value})}
                placeholder="İletişim kurulacak kişinin adı"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İletişim Telefonu</Text>
              <TextInput
                style={styles.textInput}
                value={formData.contactPhone}
                onChangeText={(value) => setFormData({...formData, contactPhone: value})}
                placeholder="05XX XXX XX XX"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ödül (Opsiyonel)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.reward}
                onChangeText={(value) => setFormData({...formData, reward: value})}
                placeholder="Örn: 1000 TL ödül verilecektir"
              />
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Fotoğraf Ekle</Text>
            
            <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
              {selectedPhoto ? (
                <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                  <Text style={styles.photoText}>Fotoğraf Seç</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.photoNote}>
              Net ve kaliteli bir fotoğraf eklemeniz bulunma olasılığını artıracaktır.
            </Text>
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
        <Text style={styles.loadingText}>Kayıp ilanları yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🔍 Kayıp İlanları</Text>
        <Text style={styles.headerSubtitle}>Kayıp dostlarımızı bulalım</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <LinearGradient
            colors={['#AB75C2', '#9B6BB0']}
            style={styles.createButtonGradient}
          >
            <Text style={styles.createButtonText}>+ Yeni İlan Ver</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>🔍 Son İlanları Ara</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Hangi Pet?</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.customDropdown} 
                  onPress={() => setShowAnimalTypeDropdown(!showAnimalTypeDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {formData.animalType || 'Tümü'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showAnimalTypeDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showAnimalTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        setFormData({...formData, animalType: ''});
                        setShowAnimalTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Tümü</Text>
                    </TouchableOpacity>
                    {animalTypes.map((type) => (
                      <TouchableOpacity 
                        key={type}
                        style={styles.dropdownItem} 
                        onPress={() => {
                          setFormData({...formData, animalType: type});
                          setShowAnimalTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Hangi Şehir?</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.customDropdown} 
                  onPress={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {formData.city || 'Tümü'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showCityDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showCityDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        setFormData({...formData, city: ''});
                        setShowCityDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Tümü</Text>
                    </TouchableOpacity>
                    {cities.map((city) => (
                      <TouchableOpacity 
                        key={city}
                        style={styles.dropdownItem} 
                        onPress={() => {
                          setFormData({...formData, city: city});
                          setShowCityDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.searchButtonRow}>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Ara</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Son Kayıp İlanları</Text>
            {(formData.animalType || formData.city) && (
              <Text style={styles.searchInfo}>
                {listings.length} ilan bulundu
                {formData.animalType && ` • ${formData.animalType}`}
                {formData.city && ` • ${formData.city}`}
              </Text>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#AB75C2" />
              <Text style={styles.loadingText}>İlanlar yükleniyor...</Text>
            </View>
          ) : (
            <FlatList
              data={listings}
              renderItem={renderListingCard}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Henüz ilan bulunmamaktadır</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.cancelButton}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Kayıp İlanı Oluştur</Text>
            <View style={{ width: 50 }} />
          </View>

          {renderStepIndicator()}
          {renderStep()}

          <View style={styles.modalFooter}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                <Text style={styles.previousButtonText}>Önceki</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < 3 ? (
              <TouchableOpacity 
                style={[styles.nextButton, !validateCurrentStep() && styles.nextButtonDisabled]} 
                onPress={handleNext}
                disabled={!validateCurrentStep()}
              >
                <Text style={styles.nextButtonText}>Sonraki</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting || !validateCurrentStep()}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Yayımlanıyor...' : 'Yayımla'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  createButton: {
    marginBottom: 20,
  },
  createButtonGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  searchButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchButton: {
    flex: 3,
    backgroundColor: '#AB75C2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '500',
  },
  listingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  searchInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  listingImage: {
    width: 120,
    height: '100%',
    resizeMode: 'cover',
  },
  listingInfo: {
    flex: 1,
    padding: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  listingDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  listingDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  detailButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    color: '#AB75C2',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  stepDotActive: {
    backgroundColor: '#AB75C2',
  },
  stepText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  photoUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 40,
    marginBottom: 10,
  },
  photoText: {
    fontSize: 16,
    color: '#6B7280',
  },
  photoNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previousButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  previousButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  customDropdown: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownDisabled: {
    backgroundColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownTextDisabled: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 14,
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
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  cityDropdownMenu: {
    maxHeight: 200,
  },
  districtDropdownMenu: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
}); 