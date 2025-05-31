import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import petService, { ANIMAL_SPECIES, Pet } from '../services/petService';

const { width } = Dimensions.get('window');

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export default function AddPetScreen() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'erkek' | 'dişi'>('erkek');
  const [species, setSpecies] = useState('köpek');
  const [breed, setBreed] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Tür değiştiğinde cins seçimini sıfırla
    const availableBreeds = ANIMAL_SPECIES[species as keyof typeof ANIMAL_SPECIES];
    setBreed(availableBreeds[0]);
  }, [species]);

  const loadUserData = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
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
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen hayvanın ismini girin.');
      return;
    }

    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir yaş girin.');
      return;
    }

    if (!userData) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı.');
      return;
    }

    try {
      setLoading(true);

      const petData: Omit<Pet, 'id' | 'createdAt'> = {
        name: name.trim(),
        age: Number(age),
        gender,
        species,
        breed,
        imageUrl: imageUri || undefined,
        ownerId: userData.id
      };

      await petService.addPet(petData);

      Alert.alert(
        'Başarılı!', 
        'Evcil hayvanınız başarıyla eklendi.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              router.back();
              // Profile sayfasının pets tab'ına yönlendir
              router.push('/(tabs)/profile?tab=pets');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Hata', 'Evcil hayvan eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const availableBreeds = ANIMAL_SPECIES[species as keyof typeof ANIMAL_SPECIES] || [];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#AB75C2', '#9B6BB0']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Yeni Evcil Hayvan Ekle</Text>
            <Text style={styles.headerSubtitle}>
              Evcil hayvanınızın bilgilerini girin
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>📸 Fotoğraf</Text>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.petPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderText}>Fotoğraf Ekle</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Temel Bilgiler</Text>
            
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hayvan İsmi *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Örn: Karamel, Boncuk, Şeker..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yaş *</Text>
              <TextInput
                style={styles.textInput}
                value={age}
                onChangeText={setAge}
                placeholder="Yaş (sayı olarak)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cinsiyet *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gender}
                  onValueChange={setGender}
                  style={styles.picker}
                >
                  <Picker.Item label="Erkek" value="erkek" />
                  <Picker.Item label="Dişi" value="dişi" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Species & Breed Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🐾 Tür ve Cins</Text>
            
            {/* Species */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hayvan Türü *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={species}
                  onValueChange={setSpecies}
                  style={styles.picker}
                >
                  {Object.keys(ANIMAL_SPECIES).map((speciesKey) => (
                    <Picker.Item 
                      key={speciesKey} 
                      label={speciesKey.charAt(0).toUpperCase() + speciesKey.slice(1)} 
                      value={speciesKey} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Breed */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cinsi *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={breed}
                  onValueChange={setBreed}
                  style={styles.picker}
                >
                  {availableBreeds.map((breedItem) => (
                    <Picker.Item 
                      key={breedItem} 
                      label={breedItem} 
                      value={breedItem} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#6B7280'] : ['#AB75C2', '#9B6BB0']}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>🐾 Evcil Hayvan Ekle</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoButton: {
    marginTop: 15,
  },
  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#AB75C2',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#374151',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    color: '#374151',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 50,
  },
}); 