import AsyncStorage from '@react-native-async-storage/async-storage';
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
    View
} from 'react-native';
import lostPetService, { LostPet, LostPetData } from '../../services/lostPetService';

const petTypes = ['Kedi', 'Köpek', 'Muhabbet Kuşu', 'Papağan'];
const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Kayseri'];
const statusOptions = ['Kayıp', 'Bulundu'];
const additionalInfoOptions = ['', 'Bulana ödül verilecektir', 'Acil'];

export default function LostScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LostPetData>({
    title: '',
    details: '',
    location: '',
    category: '',
    status: 'Kayıp',
    additionalInfo: '',
    contactInfo: '',
    lastSeenDate: '',
    lastSeenLocation: '',
    imageUrl: '',
    animalType: '',
    image: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAnimalTypeDropdown, setShowAnimalTypeDropdown] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

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

  const selectAnimalType = (type: string) => {
    setFormData({...formData, animalType: type, category: type});
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
      setFormData(prev => ({
        ...prev,
        image: result.assets[0].uri,
        imageUrl: result.assets[0].uri
      }));
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
    switch (currentStep) {
      case 1:
        return formData.title !== '' && formData.animalType !== '' && formData.location !== '';
      case 2:
        return formData.details !== '' && formData.contactInfo !== '' && formData.lastSeenLocation !== '';
      case 3:
        return selectedPhoto !== null;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Kullanıcı bilgisini al
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }
      const user = JSON.parse(userString);

      // İlan oluştur
      const submitData = {
        ...formData,
        timestamp: Date.now(),
        viewCount: 0
      };

      await lostPetService.createLostPet(user.id, submitData);

      Alert.alert('Başarılı!', 'Kayıp ilanınız başarıyla oluşturuldu.', [
        {
          text: 'Tamam',
          onPress: () => {
            setCreateModalVisible(false);
            resetForm();
            loadListings();
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
      title: '',
      details: '',
      location: '',
      category: '',
      status: 'Kayıp',
      additionalInfo: '',
      contactInfo: '',
      lastSeenDate: '',
      lastSeenLocation: '',
      imageUrl: '',
      animalType: '',
      image: ''
    });
    setSelectedPhoto(null);
  };

  const renderListingCard = ({ item }: { item: LostPet }) => (
    <TouchableOpacity style={styles.listingCard} activeOpacity={0.8}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150/AB75C2/FFFFFF?text=🔍' }} 
        style={styles.listingImage} 
      />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle}>{item.title}</Text>
        <Text style={styles.listingDetails}>
          {item.animalType} • {item.location} • {item.status}
        </Text>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.details}
        </Text>
        <Text style={styles.lastSeen}>
          Son görülme: {item.lastSeenLocation}
        </Text>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => {
            router.push({
              pathname: '/lost-detail' as any,
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
              <Text style={styles.inputLabel}>İlan Başlığı *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="Kayıp Golden Retriever..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hayvan Türü *</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={toggleAnimalTypeDropdown}
              >
                <Text style={formData.animalType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.animalType || 'Seçiniz'}
                </Text>
              </TouchableOpacity>
              {showAnimalTypeDropdown && (
                <View style={styles.dropdownList}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kaybolduğu Konum *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholder="İstanbul, Kadıköy..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Durum</Text>
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
                style={styles.picker}
              >
                {statusOptions.map((status) => (
                  <Picker.Item key={status} label={status} value={status} />
                ))}
              </Picker>
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Detay Bilgiler</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Açıklama *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.details}
                onChangeText={(text) => setFormData({...formData, details: text})}
                placeholder="Hayvanınızın detaylı açıklamasını yazın..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Son Görüldüğü Yer *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastSeenLocation}
                onChangeText={(text) => setFormData({...formData, lastSeenLocation: text})}
                placeholder="Kadıköy Moda Parkı..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Son Görülme Tarihi</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastSeenDate}
                onChangeText={(text) => setFormData({...formData, lastSeenDate: text})}
                placeholder="2024-01-15"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İletişim Bilgileri *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.contactInfo}
                onChangeText={(text) => setFormData({...formData, contactInfo: text})}
                placeholder="Telefon numaranız..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ek Bilgiler</Text>
              <Picker
                selectedValue={formData.additionalInfo}
                onValueChange={(value) => setFormData({...formData, additionalInfo: value})}
                style={styles.picker}
              >
                <Picker.Item label="Seçiniz" value="" />
                {additionalInfoOptions.filter(info => info !== '').map((info) => (
                  <Picker.Item key={info} label={info} value={info} />
                ))}
              </Picker>
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

  // Loading screen
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
      {/* Header */}
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🔍 Kayıp İlanları</Text>
        <Text style={styles.headerSubtitle}>Kayıp dostları bulalım</Text>
      </LinearGradient>

      {/* Create Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setCreateModalVisible(true)}
      >
        <Text style={styles.createButtonText}>+ Yeni İlan Ver</Text>
      </TouchableOpacity>

      {/* İlanlar Başlığı */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>İlanlar</Text>
      </View>

      {/* Listings */}
      <FlatList
        data={listings}
        renderItem={renderListingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

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
    color: '#E8D5F2',
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
  createButton: {
    backgroundColor: '#AB75C2',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContainer: {
    padding: 20,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  listingInfo: {
    padding: 15,
  },
  listingTitle: {
    fontSize: 18,
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
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  lastSeen: {
    fontSize: 12,
    color: '#AB75C2',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  dropdown: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
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
}); 