import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import adoptionService, { AdoptionData, AdoptionListing } from '../../services/adoptionService';

const { width } = Dimensions.get('window');

const petTypes = ['Kedi', 'Köpek', 'Muhabbet Kuşu', 'Papağan'];
const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Kayseri'];
const genders = ['Erkek', 'Dişi'];
const sizes = ['Küçük', 'Orta', 'Büyük'];
const sources = ['Sahip', 'Barınak', 'Gönüllü'];

export default function AdoptScreen() {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
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

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await adoptionService.getAdoptionListings();
      setListings(data);
    } catch (error: any) {
      console.error('İlanlar yüklenirken hata:', error);
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Burada filtreleme yapılabilir
    Alert.alert('Arama', `${searchFilter.petType} - ${searchFilter.city} için arama yapılacak`);
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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.animalType !== '';
      case 2:
        return formData.petName !== '' && formData.title !== '' && formData.city !== '';
      case 3:
        return selectedPhoto !== null;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // İlan oluştur
      const newListing = await adoptionService.createAdoptionListing(formData);
      
      // Fotoğraf varsa yükle
      if (selectedPhoto && newListing.id) {
        await adoptionService.uploadPhoto(newListing.id, selectedPhoto);
      }

      Alert.alert('Başarılı!', 'İlanınız başarıyla oluşturuldu.', [
        {
          text: 'Tamam',
          onPress: () => {
            setCreateModalVisible(false);
            resetForm();
            loadListings(); // Listeyi yenile
          }
        }
      ]);
    } catch (error: any) {
      console.error('İlan oluşturma hatası:', error);
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
        <TouchableOpacity style={styles.detailButton}>
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
          {step < 4 && <View style={styles.stepLine} />}
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Hangi tür evcil hayvanı sahiplendirmek istiyorsunuz?</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.animalType}
                onValueChange={(value: string) => setFormData({...formData, animalType: value})}
                style={styles.pickerStyle}
              >
                <Picker.Item label="Seçiniz..." value="" />
                {petTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>İlan Detayları</Text>
            
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
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.gender}
                    onValueChange={(value: string) => setFormData({...formData, gender: value})}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="Seçiniz" value="" />
                    {genders.map((gender) => (
                      <Picker.Item key={gender} label={gender} value={gender} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Boyut</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.size}
                  onValueChange={(value: string) => setFormData({...formData, size: value})}
                  style={styles.pickerStyle}
                >
                  <Picker.Item label="Seçiniz" value="" />
                  {sizes.map((size) => (
                    <Picker.Item key={size} label={size} value={size} />
                  ))}
                </Picker>
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
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.city}
                    onValueChange={(value: string) => setFormData({...formData, city: value})}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="Seçiniz" value="" />
                    {cities.map((city) => (
                      <Picker.Item key={city} label={city} value={city} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>İlçe</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.district}
                  onChangeText={(value) => setFormData({...formData, district: value})}
                  placeholder="İlçe"
                />
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
            <Text style={styles.stepTitle}>Fotoğraf Yükleme</Text>
            <Text style={styles.stepSubtitle}>En az 1 fotoğraf zorunludur</Text>
            
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
            <Text style={styles.stepTitle}>Yayınlama Önizlemesi</Text>
            
            <View style={styles.previewCard}>
              {selectedPhoto && (
                <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
              )}
              <Text style={styles.previewTitle}>{formData.title}</Text>
              <Text style={styles.previewDetails}>
                {formData.animalType} • {formData.city}
              </Text>
              <Text style={styles.previewDescription}>{formData.description}</Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
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
        {/* İlan Ver Butonu */}
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

        {/* Arama Bölümü */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>�� Son İlanları Ara</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Hangi Pet?</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={searchFilter.petType}
                  onValueChange={(value: string) => setSearchFilter({...searchFilter, petType: value})}
                  style={styles.pickerStyle}
                >
                  <Picker.Item label="Tümü" value="" />
                  {petTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Hangi Şehir?</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={searchFilter.city}
                  onValueChange={(value: string) => setSearchFilter({...searchFilter, city: value})}
                  style={styles.pickerStyle}
                >
                  <Picker.Item label="Tümü" value="" />
                  {cities.map((city) => (
                    <Picker.Item key={city} label={city} value={city} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Ara</Text>
          </TouchableOpacity>
        </View>

        {/* İlanlar Listesi */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>📋 Son Sahiplendirme İlanları</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#AB75C2" />
              <Text style={styles.loadingText}>İlanlar yükleniyor...</Text>
            </View>
          ) : (
            <FlatList
              data={listings}
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

      {/* İlan Oluşturma Modal */}
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
            {renderStep()}
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
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerStyle: {
    height: 50,
  },
  searchButton: {
    backgroundColor: '#AB75C2',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 5,
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
}); 