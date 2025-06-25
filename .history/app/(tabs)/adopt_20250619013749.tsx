import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
    TouchableWithoutFeedback,
    View
} from 'react-native';
import rawCitiesData from '../../assets/il-ilce.json';
import adoptionService, { AdoptionData, AdoptionListing } from '../../services/adoptionService';

// Define types for city data
interface District {
  ilce_adi: string;
  [key: string]: any; // for other properties we don't use
}

interface City {
  il_adi: string;
  ilceler: District[];
  [key: string]: any; // for other properties we don't use
}

interface CityData {
  data: City[];
}

// Import city data with type
const citiesData: City[] = (rawCitiesData as CityData).data;

const petTypes = ['Köpek', 'Kedi', 'Kuş', 'Balık', 'Tavşan', 'Hamster'];
const sizes = ['Küçük', 'Orta', 'Büyük'];
const sources = ['Sahibinden', 'Barınak', 'Sokak', 'Veteriner'];
const genders = ['Erkek', 'Dişi'];

export default function AdoptScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState({
    petType: '',
    city: ''
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AdoptionData>({
    petName: '',
    animalType: '',
    city: '',
    breed: '',
    age: 0,
    size: '',
    gender: '',
    source: '',
    title: '',
    description: '',
    district: '',
    fullName: '',
    phone: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAnimalTypeDropdown, setShowAnimalTypeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities] = useState<string[]>(citiesData.map((city: City) => city.il_adi));

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    if (formData.city) {
      const selectedCity = citiesData.find((city: City) => city.il_adi === formData.city);
      if (selectedCity) {
        const cityDistricts = selectedCity.ilceler.map((district: District) => district.ilce_adi);
        setDistricts(cityDistricts);
        setFormData(prev => ({ ...prev, district: '' }));
      }
    }
  }, [formData.city]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await adoptionService.getAdoptionListings();
      setListings(data);
      setFilteredListings(data);
    } catch (error: any) {
      console.error('İlanlar yüklenirken hata:', error);
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchFilter({
      petType: '',
      city: ''
    });
    setFilteredListings(listings);
    setShowPetDropdown(false);
    setShowCityDropdown(false);
  };

  const handleSearch = () => {
    console.log('Manuel arama yapıldı:', searchFilter);
    
    if (filteredListings.length === 0 && (searchFilter.petType || searchFilter.city)) {
      Alert.alert('Sonuç Bulunamadı', 'Arama kriterlerinize uygun ilan bulunamadı.');
    } else if (searchFilter.petType || searchFilter.city) {
      Alert.alert('Arama Tamamlandı', `${filteredListings.length} ilan bulundu.`);
    }
  };

  const showPetTypeSelector = () => {
    setShowPetDropdown(!showPetDropdown);
    setShowCityDropdown(false);
  };

  const showCitySelector = () => {
    setShowCityDropdown(!showCityDropdown);
    setShowPetDropdown(false);
  };

  const selectPetType = (type: string) => {
    const newFilter = {...searchFilter, petType: type};
    setSearchFilter(newFilter);
    setShowPetDropdown(false);
    
    applyFilters(newFilter);
  };

  const selectCity = (city: string) => {
    const newFilter = {...searchFilter, city: city};
    setSearchFilter(newFilter);
    setShowCityDropdown(false);
    
    applyFilters(newFilter);
  };

  const selectAnimalType = (type: string) => {
    setFormData({...formData, animalType: type});
    setShowAnimalTypeDropdown(false);
  };

  const toggleAnimalTypeDropdown = () => {
    setShowAnimalTypeDropdown(!showAnimalTypeDropdown);
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
    setShowAnimalTypeDropdown(false);
    setShowGenderDropdown(false);
    setShowCityDropdown(false);
    setShowDistrictDropdown(false);
    setShowSizeDropdown(false);
    
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.animalType !== '';
      case 2:
        return (
          formData.petName.trim() !== '' &&
          formData.title.trim() !== '' &&
          formData.gender !== '' &&
          formData.city !== ''
        );
      case 3:
        return selectedPhoto !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Create adoption listing
      const newListing = await adoptionService.createAdoptionListing(
        {
          ...formData,
          // Convert values to match API requirements
          animalType: formData.animalType.toUpperCase(),
          size: formData.size.toUpperCase(),
          gender: formData.gender.toUpperCase(),
          source: formData.source.toUpperCase(),
        },
        selectedPhoto || undefined // Pass undefined if no photo is selected
      );

      if (newListing) {
        Alert.alert(
          'Başarılı',
          'İlanınız başarıyla oluşturuldu ve admin onayına gönderildi.',
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
      city: '',
      breed: '',
      age: 0,
      size: '',
      gender: '',
      source: '',
      title: '',
      description: '',
      district: '',
      fullName: '',
      phone: ''
    });
    setSelectedPhoto(null);
  };

  const renderListingCard = ({ item }: { item: AdoptionListing }) => (
    <TouchableOpacity style={styles.listingCard} activeOpacity={0.8}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150/AB75C2/FFFFFF?text=🐾' }} 
        style={styles.listingImage} 
      />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle}>{item.title}</Text>
        <Text style={styles.listingDetails}>
          {item.animalType} • {item.city}
        </Text>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => {
            router.push({
              pathname: '/adoption-detail' as any,
              params: { id: item.id.toString() }
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
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step ? styles.stepCircleActive : styles.stepCircleInactive
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step ? styles.stepTextActive : styles.stepTextInactive
            ]}>
              {step}
            </Text>
          </View>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Bilgilendirme' : 
             step === 2 ? 'İlan Detayı' :
             step === 3 ? 'Fotoğraflar' :
             'İlanı Yayınla'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hayvan Türünü Seçiniz *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.customDropdown} 
                  onPress={toggleAnimalTypeDropdown}
                >
                  <Text style={styles.dropdownText}>
                    {formData.animalType || 'Seçiniz...'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showAnimalTypeDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showAnimalTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    {petTypes.map((type) => (
                      <TouchableOpacity 
                        key={type}
                        style={styles.dropdownItem} 
                        onPress={() => selectAnimalType(type)}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Sadece ücretsiz sahiplendirmeler için ilan verilebilir. Evcil hayvan arıyorsanız arama içerikli ilanlar açmak yerine sahiplendirme ilanlarına bakabilirsiniz. Böylelikle yuva arayan dostlarımıza daha kolay ulaşmış olursunuz.
                {'\n\n'}
                Sahiplendirmek istediğiniz her evsiz hayvan için ayrı ayrı ilan vermelisiniz. Bu sayede daha da hızlı yuva bulabilirsiniz.
                {'\n\n'}
                Sahiplendirme ilanlarının doğruluğu, dostlarımıza en hızlı şekilde yuva bulabilmek adına bizim için çok değerli.
                {'\n\n'}
                Bu nedenle kurallara uygun olmayan ilanlar veren üyelerin üyelikleri yeniden açılmamak üzere iptal edilir.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pet Adı *</Text>
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
                  value={formData.age.toString()}
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Boyut</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.customDropdown} 
                  onPress={() => setShowSizeDropdown(!showSizeDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {formData.size || 'Seçiniz...'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showSizeDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showSizeDropdown && (
                  <View style={styles.dropdownMenu}>
                    {sizes.map((size) => (
                      <TouchableOpacity 
                        key={size}
                        style={styles.dropdownItem} 
                        onPress={() => {
                          setFormData({...formData, size: size});
                          setShowSizeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{size}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İlan Başlığı *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(value) => setFormData({...formData, title: value})}
                placeholder="Örn: Sevimli kedi sahiplendirilecek"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İlan Açıklaması</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => setFormData({...formData, description: value})}
                placeholder="Evcil hayvanınız hakkında detaylı bilgi verin..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kimden</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.source}
                  onValueChange={(value: string) => setFormData({...formData, source: value})}
                  style={styles.pickerStyle}
                >
                  <Picker.Item label="Seçiniz" value="" />
                  {sources.map((source) => (
                    <Picker.Item key={source} label={source} value={source} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Şehir *</Text>
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

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(value) => setFormData({...formData, fullName: value})}
                  placeholder="Adınız Soyadınız"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(value) => setFormData({...formData, phone: value})}
                  placeholder="0555 123 45 67"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>En az 1 fotoğraf zorunludur</Text>
            
            <TouchableOpacity style={styles.photoUploadButton} onPress={pickImage}>
              {selectedPhoto ? (
                <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                  <Text style={styles.photoPlaceholderLabel}>Fotoğraf Seç</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <View style={styles.previewCard}>
              {selectedPhoto && (
                <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
              )}
              <Text style={styles.previewTitle}>{formData.title}</Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const applyFilters = (filters: typeof searchFilter) => {
    let filtered = [...listings];
    
    if (filters.petType && filters.petType !== '') {
      filtered = filtered.filter(listing => 
        listing.animalType.toLowerCase().includes(filters.petType.toLowerCase())
      );
    }
    
    if (filters.city && filters.city !== '') {
      filtered = filtered.filter(listing => 
        listing.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    
    setFilteredListings(filtered);
  };

  const handleFilterChange = (type: string, value: string) => {
    const newFilter = { ...searchFilter, [type]: value };
    setSearchFilter(newFilter);
    
    // Filter listings
    const filtered = listings.filter(listing => {
      if (newFilter.petType && listing.animalType !== newFilter.petType) {
        return false;
      }
      if (newFilter.city && listing.city !== newFilter.city) {
        return false;
      }
      return true;
    });
    
    setFilteredListings(filtered);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🐾 Sahiplenme İlanları</Text>
        <Text style={styles.headerSubtitle}>Yeni yuva arayan dostlar</Text>
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
                  onPress={showPetTypeSelector}
                >
                  <Text style={styles.dropdownText}>
                    {searchFilter.petType || 'Tümü'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showPetDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showPetDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => selectPetType('')}
                    >
                      <Text style={styles.dropdownItemText}>Tümü</Text>
                    </TouchableOpacity>
                    {petTypes.map((type) => (
                      <TouchableOpacity 
                        key={type}
                        style={styles.dropdownItem} 
                        onPress={() => selectPetType(type)}
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
                  onPress={showCitySelector}
                >
                  <Text style={styles.dropdownText}>
                    {searchFilter.city || 'Tümü'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showCityDropdown && styles.dropdownArrowUp]}>▼</Text>
                </TouchableOpacity>
                
                {showCityDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => selectCity('')}
                    >
                      <Text style={styles.dropdownItemText}>Tümü</Text>
                    </TouchableOpacity>
                    {cities.map((city) => (
                      <TouchableOpacity 
                        key={city}
                        style={styles.dropdownItem} 
                        onPress={() => selectCity(city)}
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
            <Text style={styles.sectionTitle}>📋 Son Sahiplendirme İlanları</Text>
            {(searchFilter.petType || searchFilter.city) && (
              <Text style={styles.searchInfo}>
                {filteredListings.length} ilan bulundu
                {searchFilter.petType && ` • ${searchFilter.petType}`}
                {searchFilter.city && ` • ${searchFilter.city}`}
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
              data={filteredListings}
              renderItem={renderListingCard}
              keyExtractor={(item) => item.id.toString()}
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

      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sahiplendirme İlanı Ver</Text>
            <View style={{ width: 24 }} />
          </View>

          {renderStepIndicator()}
          
          <View style={styles.modalContent}>
            <TouchableWithoutFeedback onPress={() => setShowAnimalTypeDropdown(false)}>
              {renderStep()}
            </TouchableWithoutFeedback>
          </View>

          <View style={styles.modalFooter}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                <Text style={styles.previousButtonText}>Geri</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.nextButton,
                !validateCurrentStep() && styles.nextButtonDisabled
              ]}
              onPress={currentStep === 4 ? handleSubmit : handleNext}
              disabled={!validateCurrentStep() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentStep === 4 ? '📢 İlanı Yayınla' : 'Devam Et'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F3E5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  createButton: {
    marginBottom: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterItem: {
    flex: 0.48,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  customDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  pickerStyle: {
    height: 50,
    color: '#374151',
  },
  searchButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchButton: {
    backgroundColor: '#AB75C2',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listingsSection: {
    marginBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  listingDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 10,
    lineHeight: 16,
  },
  detailButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  modalCloseButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  stepContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 80,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#AB75C2',
  },
  stepCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepTextInactive: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
  },
  photoUploadButton: {
    alignItems: 'center',
    padding: 20,
  },
  selectedPhoto: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  photoPlaceholderLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  previewDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previousButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  previousButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
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
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  clearButton: {
    backgroundColor: '#9CA3AF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  cityDropdownMenu: {
    maxHeight: 200,
  },
  districtDropdownMenu: {
    maxHeight: 200,
  },
  dropdownDisabled: {
    backgroundColor: '#D1D5DB',
  },
  dropdownTextDisabled: {
    color: '#9CA3AF',
  },
}); 