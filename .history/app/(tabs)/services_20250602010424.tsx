import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Type definitions for the API response
type Photo = {
  height: number;
  width: number;
  photo_reference: string;
  html_attributions: string[];
  url?: string;
};

type Review = {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
};

type Business = {
  place_id: string;
  name: string;
  type: 'Veteriner' | 'Petshop';
  rating: number;
  vicinity: string;
  formatted_address?: string;
  city?: string;
  district?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  photos?: Photo[];
  location?: {
    lat: number;
    lng: number;
  };
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  services?: string[];
  reviews?: Review[];
  website?: string;
  mainPhotoUrl?: string;
};

type City = {
  il_adi: string;
  plaka_kodu: string;
  ilceler: District[];
};

type District = {
  ilce_adi: string;
  plaka_kodu: string;
  ilce_kodu: string;
  il_adi: string;
};

// Mock data for demonstration - replace with actual API calls later
const mockCities: City[] = [
  {
    il_adi: 'İstanbul',
    plaka_kodu: '34',
    ilceler: [
      { ilce_adi: 'Beşiktaş', plaka_kodu: '34', ilce_kodu: '01', il_adi: 'İstanbul' },
      { ilce_adi: 'Şişli', plaka_kodu: '34', ilce_kodu: '02', il_adi: 'İstanbul' },
      { ilce_adi: 'Kadıköy', plaka_kodu: '34', ilce_kodu: '03', il_adi: 'İstanbul' },
    ]
  },
  {
    il_adi: 'Ankara',
    plaka_kodu: '06',
    ilceler: [
      { ilce_adi: 'Çankaya', plaka_kodu: '06', ilce_kodu: '01', il_adi: 'Ankara' },
      { ilce_adi: 'Keçiören', plaka_kodu: '06', ilce_kodu: '02', il_adi: 'Ankara' },
    ]
  }
];

const mockBusinesses: Business[] = [
  {
    place_id: '1',
    name: 'Sevimli Dostlar Veteriner Kliniği',
    type: 'Veteriner',
    rating: 4.5,
    vicinity: 'Beşiktaş, İstanbul',
    city: 'İstanbul',
    district: 'Beşiktaş',
    formatted_phone_number: '+90 212 123 45 67',
    mainPhotoUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
    opening_hours: {
      open_now: true,
      weekday_text: ['Pazartesi: 09:00-18:00', 'Salı: 09:00-18:00']
    },
    services: ['Genel Muayene', 'Aşı', 'Ameliyat'],
    reviews: [
      {
        id: '1',
        author_name: 'Ahmet Yılmaz',
        rating: 5,
        text: 'Çok ilgili ve deneyimli veteriner. Kedimizi çok iyi tedavi ettiler.',
        time: Date.now() / 1000,
        profile_photo_url: 'https://via.placeholder.com/50x50'
      }
    ]
  },
  {
    place_id: '2',
    name: 'Pati Pet Shop',
    type: 'Petshop',
    rating: 4.2,
    vicinity: 'Şişli, İstanbul',
    city: 'İstanbul',
    district: 'Şişli',
    formatted_phone_number: '+90 212 987 65 43',
    mainPhotoUrl: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop',
    opening_hours: {
      open_now: false,
      weekday_text: ['Pazartesi: 10:00-20:00', 'Salı: 10:00-20:00']
    },
    services: ['Kedi Maması', 'Köpek Maması', 'Oyuncaklar', 'Bakım Ürünleri'],
  }
];

export default function ServicesScreen() {
  const [selectedType, setSelectedType] = useState<'Veteriner' | 'Petshop'>('Veteriner');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [showBusinessDetail, setShowBusinessDetail] = useState<boolean>(false);

  // Load cities data
  useEffect(() => {
    // For now, using mock data - replace with actual API call later
    setCities(mockCities);
  }, []);

  // Update districts when city changes
  useEffect(() => {
    if (selectedCity) {
      const city = cities.find(city => city.il_adi === selectedCity);
      if (city) {
        setDistricts(city.ilceler);
      } else {
        setDistricts([]);
      }
      setSelectedDistrict('');
    } else {
      setDistricts([]);
    }
  }, [selectedCity, cities]);

  const handleSearch = async () => {
    if (!selectedCity || !selectedDistrict) {
      Alert.alert('Uyarı', 'Lütfen şehir ve ilçe seçiniz.');
      return;
    }

    setSearchInitiated(true);
    setIsLoading(true);
    setError(null);

    try {
      // For now, using mock data - replace with actual API call later
      const filteredBusinesses = mockBusinesses.filter(
        business => 
          business.type === selectedType &&
          business.city === selectedCity &&
          business.district === selectedDistrict
      );
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBusinesses(filteredBusinesses);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('İşletme verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessPress = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessDetail(true);
  };

  const handlePhonePress = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderBusinessCard = ({ item }: { item: Business }) => (
    <TouchableOpacity 
      style={styles.businessCard}
      onPress={() => handleBusinessPress(item)}
    >
      <Image 
        source={{ uri: item.mainPhotoUrl || 'https://via.placeholder.com/300x200' }}
        style={styles.businessImage}
      />
      <View style={styles.businessTypeTag}>
        <Text style={styles.businessTypeText}>{item.type}</Text>
      </View>
      
      <View style={styles.businessInfo}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>{item.name}</Text>
          {item.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        
        {item.opening_hours?.open_now !== undefined && (
          <Text style={[styles.statusText, item.opening_hours.open_now ? styles.openText : styles.closedText]}>
            {item.opening_hours.open_now ? 'Şu anda açık' : 'Kapalı'}
          </Text>
        )}
        
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            {item.district ? `${item.district}, ${item.city}` : item.vicinity}
          </Text>
        </View>
        
        {item.formatted_phone_number && (
          <TouchableOpacity 
            style={styles.phoneContainer}
            onPress={() => handlePhonePress(item.formatted_phone_number!)}
          >
            <Text style={styles.phoneIcon}>📞</Text>
            <Text style={styles.phoneText}>{item.formatted_phone_number}</Text>
          </TouchableOpacity>
        )}
        
        {item.services && item.services.length > 0 && (
          <View style={styles.servicesContainer}>
            {item.services.slice(0, 3).map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{service}</Text>
              </View>
            ))}
            {item.services.length > 3 && (
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>+{item.services.length - 3}</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Detayları Gör</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBusinessDetail = () => {
    if (!selectedBusiness) return null;

    return (
      <Modal
        visible={showBusinessDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowBusinessDetail(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Image 
              source={{ uri: selectedBusiness.mainPhotoUrl || 'https://via.placeholder.com/400x250' }}
              style={styles.modalImage}
            />
            
            <View style={styles.modalInfo}>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle}>{selectedBusiness.name}</Text>
                {selectedBusiness.rating > 0 && (
                  <View style={styles.modalRating}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.ratingText}>{selectedBusiness.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.modalSubtitle}>{selectedBusiness.type}</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>İşletme Bilgileri</Text>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <Text style={styles.infoText}>
                    {selectedBusiness.formatted_address || selectedBusiness.vicinity}
                  </Text>
                </View>
                
                {selectedBusiness.formatted_phone_number && (
                  <TouchableOpacity 
                    style={styles.infoItem}
                    onPress={() => handlePhonePress(selectedBusiness.formatted_phone_number!)}
                  >
                    <Text style={styles.infoIcon}>📞</Text>
                    <Text style={[styles.infoText, styles.phoneLink]}>
                      {selectedBusiness.formatted_phone_number}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {selectedBusiness.opening_hours?.weekday_text && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>🕐</Text>
                    <View style={styles.hoursContainer}>
                      {selectedBusiness.opening_hours.weekday_text.map((day, index) => (
                        <Text key={index} style={styles.hoursText}>{day}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              
              {selectedBusiness.services && selectedBusiness.services.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Hizmetler</Text>
                  <View style={styles.servicesGrid}>
                    {selectedBusiness.services.map((service, index) => (
                      <View key={index} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {selectedBusiness.reviews && selectedBusiness.reviews.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
                  {selectedBusiness.reviews.map((review, index) => (
                    <View key={index} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Image 
                          source={{ uri: review.profile_photo_url || 'https://via.placeholder.com/40x40' }}
                          style={styles.reviewAvatar}
                        />
                        <View style={styles.reviewInfo}>
                          <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                          <View style={styles.reviewRating}>
                            <Text style={styles.starIcon}>⭐</Text>
                            <Text style={styles.reviewRatingText}>{review.rating}</Text>
                            <Text style={styles.reviewDate}>
                              {new Date(review.time * 1000).toLocaleDateString('tr-TR')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Veteriner ve Petshop Rehberi</Text>
        <Text style={styles.headerSubtitle}>Size en yakın veteriner ve petshopları keşfedin</Text>
      </View>
      
      {/* Search Section */}
      <View style={styles.searchSection}>
        {/* İşletme Tipi Picker */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.filterLabel}>İşletme Tipi</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(value) => setSelectedType(value)}
              style={styles.picker}
            >
              <Picker.Item label="Veteriner" value="Veteriner" />
              <Picker.Item label="Petshop" value="Petshop" />
            </Picker>
          </View>
        </View>
        
        {/* Şehir Picker */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.filterLabel}>Şehir</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedDistrict('');
              }}
              style={styles.picker}
            >
              <Picker.Item label="Şehir Seçiniz" value="" />
              {cities.map(city => (
                <Picker.Item key={city.plaka_kodu} label={city.il_adi} value={city.il_adi} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* İlçe Picker */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.filterLabel}>İlçe</Text>
          <View style={[styles.pickerContainer, !selectedCity && styles.pickerDisabled]}>
            <Picker
              selectedValue={selectedDistrict}
              onValueChange={setSelectedDistrict}
              enabled={!!selectedCity}
              style={styles.picker}
            >
              <Picker.Item label="İlçe Seçiniz" value="" />
              {districts.map(district => (
                <Picker.Item key={district.ilce_kodu} label={district.ilce_adi} value={district.ilce_adi} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* Search Button */}
        <TouchableOpacity 
          style={[styles.searchButton, (!selectedCity || !selectedDistrict) && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!selectedCity || !selectedDistrict}
        >
          <Text style={styles.searchButtonText}>🔍 Ara</Text>
        </TouchableOpacity>
      </View>
      
      {/* Results Section */}
      <View style={styles.resultsSection}>
        {searchInitiated && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {isLoading ? 'Yükleniyor...' : `${businesses.length} sonuç bulundu`}
            </Text>
            <Text style={styles.resultsSubtitle}>
              {selectedCity && `${selectedCity}`}
              {selectedDistrict && `, ${selectedDistrict}`}
              {` - ${selectedType}`}
            </Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        )}
        
        {!isLoading && searchInitiated && businesses.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptyText}>Lütfen farklı bir şehir veya işletme tipi seçin.</Text>
          </View>
        )}
        
        {!searchInitiated && !isLoading && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Arama Yapınız</Text>
            <Text style={styles.emptyText}>Lütfen şehir ve ilçe seçerek arama yapınız.</Text>
          </View>
        )}
        
        {!isLoading && searchInitiated && businesses.length > 0 && (
          <FlatList
            data={businesses}
            renderItem={renderBusinessCard}
            keyExtractor={(item) => item.place_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      
      {renderBusinessDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#C084FC',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  searchSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerWrapper: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? 56 : 52,
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 4,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 56 : 52,
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 0 : -4,
    marginBottom: Platform.OS === 'ios' ? 0 : -4,
    color: '#374151',
  },
  pickerDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  searchButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  businessCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  businessImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  businessTypeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  businessTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  businessInfo: {
    padding: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  statusText: {
    fontSize: 12,
    marginBottom: 8,
  },
  openText: {
    color: '#059669',
  },
  closedText: {
    color: '#DC2626',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#8B5CF6',
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  serviceTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  detailButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#374151',
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  modalInfo: {
    padding: 20,
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  phoneLink: {
    color: '#8B5CF6',
  },
  hoursContainer: {
    flex: 1,
  },
  hoursText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
}); 