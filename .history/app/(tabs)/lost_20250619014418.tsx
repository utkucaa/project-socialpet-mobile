import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const animalTypes = ['DOG', 'CAT', 'BIRD', 'FISH', 'RABBIT', 'OTHER'];
const genders = ['MALE', 'FEMALE'];

export default function LostScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<LostPet>>({
    petName: '',
    animalType: '',
    breed: '',
    age: 0,
    gender: '',
    city: '',
    district: '',
    lastSeenDate: '',
    lastSeenLocation: '',
    description: '',
    contactName: '',
    contactPhone: '',
    reward: '',
    isFound: false,
  });

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [listings, setListings] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimalTypeDropdown, setShowAnimalTypeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities] = useState<string[]>(citiesData.data.map((city: City) => city.il_adi));

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    if (formData.city) {
      const selectedCity = citiesData.data.find((city: City) => city.il_adi === formData.city);
      if (selectedCity) {
        const cityDistricts = selectedCity.ilceler.map(district => district.ilce_adi);
        setDistricts(cityDistricts);
        setFormData((prev: Partial<LostPet>) => ({ ...prev, district: '' }));
      }
    }
  }, [formData.city]);

  const loadListings = async () => {
    try {
      const data = await lostPetService.getLostPets();
      setListings(data);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.lastSeenDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
        Alert.alert('Hata', 'Lütfen tarihi YYYY-AA-GG formatında giriniz (örn: 2024-03-20)');
        return;
      }

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
                setModalVisible(false);
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
    setFormData({
      petName: '',
      animalType: '',
      breed: '',
      age: 0,
      gender: '',
      city: '',
      district: '',
      lastSeenDate: '',
      lastSeenLocation: '',
      description: '',
      contactName: '',
      contactPhone: '',
      reward: '',
      isFound: false,
    });
    setSelectedPhoto(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>Kayıp İlanı Ver</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Kayıp İlanı Ver</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hayvan Adı *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.petName}
              onChangeText={(value) => setFormData({...formData, petName: value})}
              placeholder="Hayvanınızın adı"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hayvan Türü *</Text>
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
            <Text style={styles.inputLabel}>Cinsi</Text>
            <TextInput
              style={styles.textInput}
              value={formData.breed}
              onChangeText={(value) => setFormData({...formData, breed: value})}
              placeholder="Hayvanınızın cinsi"
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
              <Text style={styles.inputLabel}>Cinsiyeti *</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kaybolduğu Tarih *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.lastSeenDate}
              onChangeText={(value) => setFormData({...formData, lastSeenDate: value})}
              placeholder="YYYY-AA-GG (örn: 2024-03-20)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kaybolduğu Yer *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.lastSeenLocation}
              onChangeText={(value) => setFormData({...formData, lastSeenLocation: value})}
              placeholder="Mümkün olduğunca detaylı belirtin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama *</Text>
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
            <Text style={styles.inputLabel}>İletişim Adı *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.contactName}
              onChangeText={(value) => setFormData({...formData, contactName: value})}
              placeholder="İletişim kurulacak kişinin adı"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>İletişim Telefonu *</Text>
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
            >
              <Text style={styles.buttonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>İlan Ver</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />
      ) : (
        <ScrollView style={styles.listingsContainer}>
          {listings.map((listing) => (
            <View key={`${listing.id || Date.now()}-${Math.random()}`} style={styles.listingCard}>
              <Text style={styles.listingTitle}>{listing.petName}</Text>
              <Text>Tür: {listing.animalType}</Text>
              <Text>Kaybolduğu Yer: {listing.lastSeenLocation}</Text>
              <Text>Tarih: {listing.lastSeenDate}</Text>
              <Text>İletişim: {listing.contactName} - {listing.contactPhone}</Text>
              {listing.reward && <Text style={styles.rewardText}>Ödül: {listing.reward}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A8A8A8',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
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
  dropdownDisabled: {
    backgroundColor: '#D1D5DB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
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
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  cityDropdownMenu: {
    maxHeight: 200,
  },
  districtDropdownMenu: {
    maxHeight: 200,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingsContainer: {
    flex: 1,
  },
  listingCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardText: {
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 4,
  },
}); 