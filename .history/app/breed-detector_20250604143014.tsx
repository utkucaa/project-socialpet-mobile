import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { detectBreed } from '../services/breedDetectionService';

const { width, height } = Dimensions.get('window');

interface DetectionResult {
  type: string;
  breed: string;
  confidence?: number;
}

interface AnimalType {
  id: 'cat' | 'dog';
  name: string;
  icon: string;
  color: string;
  description: string;
}

const animalTypes: AnimalType[] = [
  {
    id: 'cat',
    name: 'Kedi',
    icon: '🐱',
    color: '#E1BEE7',
    description: 'Kedi fotoğrafı yükleyerek cinsini öğrenin'
  },
  {
    id: 'dog',
    name: 'Köpek',
    icon: '🐶',
    color: '#D1C4E9',
    description: 'Köpek fotoğrafı yükleyerek cinsini öğrenin'
  }
];

const BreedDetectorScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<'cat' | 'dog'>('cat');
  const [showResult, setShowResult] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
      setShowResult(false);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera erişim izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
      setShowResult(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Fotoğraf Seç',
      'Nasıl bir fotoğraf eklemek istiyorsunuz?',
      [
        { text: 'Kameradan Çek', onPress: takePhoto },
        { text: 'Galeriden Seç', onPress: pickImage },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const handleDetectBreed = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      const detectionResult = await detectBreed(selectedImage, selectedAnimal);
      setResult(detectionResult);
      setShowResult(true);
      
      // Animate result appearance
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (error) {
      console.error('Breed detection error:', error);
      Alert.alert('Hata', 'Cins tespiti sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setResult(null);
    setShowResult(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0', '#8B5BA0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>🧬 Cins Dedektifi</Text>
            <Text style={styles.headerSubtitle}>AI ile Cins Tespiti</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Animal Type Selection */}
        <View style={styles.animalTypeSection}>
          <Text style={styles.sectionTitle}>Hayvan Türü Seçin</Text>
          <View style={styles.animalTypeGrid}>
            {animalTypes.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={[
                  styles.animalTypeCard,
                  { backgroundColor: animal.color },
                  selectedAnimal === animal.id && styles.selectedAnimalType
                ]}
                onPress={() => setSelectedAnimal(animal.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.animalIcon}>{animal.icon}</Text>
                <Text style={styles.animalName}>{animal.name}</Text>
                <Text style={styles.animalDescription}>{animal.description}</Text>
                {selectedAnimal === animal.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#AB75C2" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Image Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Fotoğraf Yükle</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={resetDetection}
              >
                <Ionicons name="close-circle" size={30} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={showImagePicker}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F8F9FA', '#E9ECEF']}
                style={styles.uploadGradient}
              >
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadTitle}>
                  {selectedAnimal === 'cat' ? 'Kedi' : 'Köpek'} Fotoğrafı Ekle
                </Text>
                <Text style={styles.uploadDescription}>
                  Galeriden seç veya kameradan çek
                </Text>
                <View style={styles.uploadHint}>
                  <Ionicons name="camera" size={20} color="#AB75C2" />
                  <Text style={styles.uploadHintText}>Dokunun</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        {selectedImage && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.detectButton,
                isLoading && styles.detectButtonDisabled
              ]}
              onPress={handleDetectBreed}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#B0B0B0', '#A0A0A0'] : ['#AB75C2', '#9B6BB0']}
                style={styles.detectButtonGradient}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.detectButtonText}>Analiz Ediliyor...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="search" size={20} color="white" />
                    <Text style={styles.detectButtonText}>Cins Tespit Et</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetDetection}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#AB75C2" />
              <Text style={styles.resetButtonText}>Sıfırla</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Result Section */}
        {showResult && result && (
          <Animated.View style={[styles.resultSection, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#AB75C2', '#9B6BB0']}
              style={styles.resultGradient}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>🎯 Sonuç</Text>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
              
              <View style={styles.resultContent}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Tür:</Text>
                  <Text style={styles.resultValue}>{result.type}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Cins:</Text>
                  <Text style={styles.resultValue}>{result.breed}</Text>
                </View>
                
                {result.confidence && (
                  <View style={styles.confidenceSection}>
                    <Text style={styles.resultLabel}>Doğruluk Oranı:</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceProgress,
                          { width: `${result.confidence}%` }
                        ]} 
                      />
                      <Text style={styles.confidenceText}>%{result.confidence}</Text>
                    </View>
                  </View>
                )}
              </View>
              
              <View style={styles.resultFooter}>
                <Text style={styles.disclaimerText}>
                  ℹ️ Bu sonuçlar AI tahminidir ve %100 doğru olmayabilir.
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 İpuçları</Text>
          <View style={styles.tipsGrid}>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>📸</Text>
              <Text style={styles.tipTitle}>İyi Aydınlatma</Text>
              <Text style={styles.tipText}>Fotoğrafın iyi aydınlatılmış olduğundan emin olun</Text>
            </View>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>🎯</Text>
              <Text style={styles.tipTitle}>Net Çekim</Text>
              <Text style={styles.tipText}>Hayvanın yüzünün net görünür olması önemli</Text>
            </View>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>🔍</Text>
              <Text style={styles.tipTitle}>Yakın Plan</Text>
              <Text style={styles.tipText}>Hayvanın belirgin özelliklerini gösterin</Text>
            </View>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>🚫</Text>
              <Text style={styles.tipTitle}>Tek Hayvan</Text>
              <Text style={styles.tipText}>Fotoğrafta sadece bir hayvan bulunsun</Text>
            </View>
          </View>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Özellikler</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={24} color="#AB75C2" />
              <Text style={styles.featureText}>Hızlı AI Analizi</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="library" size={24} color="#AB75C2" />
              <Text style={styles.featureText}>Geniş Cins Veritabanı</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={24} color="#AB75C2" />
              <Text style={styles.featureText}>Doğruluk Oranı</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color="#AB75C2" />
              <Text style={styles.featureText}>Güvenli İşlem</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 15,
  },
  animalTypeSection: {
    marginBottom: 30,
  },
  animalTypeGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  animalTypeCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAnimalType: {
    borderColor: '#AB75C2',
    shadowColor: '#AB75C2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  animalIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 5,
  },
  animalDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  uploadSection: {
    marginBottom: 30,
  },
  uploadArea: {
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
  },
  uploadGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 15,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 5,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  uploadHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  uploadHintText: {
    fontSize: 14,
    color: '#AB75C2',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 15,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 15,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  detectButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detectButtonDisabled: {
    opacity: 0.7,
  },
  detectButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#AB75C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetButtonText: {
    color: '#AB75C2',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  resultGradient: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  resultContent: {
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  confidenceSection: {
    marginTop: 10,
  },
  confidenceBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: 25,
    borderRadius: 12,
    marginTop: 5,
    position: 'relative',
    justifyContent: 'center',
  },
  confidenceProgress: {
    backgroundColor: 'white',
    height: '100%',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
  },
  confidenceText: {
    color: '#AB75C2',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  resultFooter: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  disclaimerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  tipsSection: {
    marginBottom: 30,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  tipCard: {
    width: (width - 55) / 2,
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 5,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    gap: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
  },
});

export default BreedDetectorScreen; 