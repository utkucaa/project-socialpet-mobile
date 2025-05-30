import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import lostPetService, { LostPet } from '../services/lostPetService';

export default function LostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [lostPetDetails, setLostPetDetails] = useState<LostPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const getImageSource = () => {
    if (lostPetDetails?.imageUrl && lostPetDetails.imageUrl.startsWith('http')) {
      return { uri: lostPetDetails.imageUrl };
    }
    return { uri: 'https://via.placeholder.com/400/AB75C2/FFFFFF' };
  };

  useEffect(() => {
    const fetchLostPetDetails = async () => {
      console.log('=== LOST PET DETAIL DEBUG ===');
      console.log('Received ID from params:', id);
      console.log('ID type:', typeof id);
      
      if (!id) {
        console.log('No ID provided');
        setError("İlan ID'si bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        console.log("Fetching lost pet details for ID:", id);
        const data = await lostPetService.getLostPetById(id);
        console.log("Received lost pet details:", data);
        
        if (!data) {
          console.log('No data returned from API');
          setError("İlan bulunamadı.");
          return;
        }
        
        setLostPetDetails(data);
      } catch (err: any) {
        console.error("Error fetching lost pet details:", err);
        console.error("Error message:", err.message);
        console.error("Full error:", JSON.stringify(err, null, 2));
        setError(err.message || "İlan detayları yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchLostPetDetails();
  }, [id]);

  const handleCall = (phone: string) => {
    // Telefon numarasından sadece rakamları al
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // API çağrısı burada yapılacak
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>İlan yükleniyor...</Text>
      </View>
    );
  }

  if (error || !lostPetDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || "İlan bulunamadı."}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kayıp İlan Detayı</Text>
        <TouchableOpacity style={styles.favoriteIcon} onPress={toggleFavorite}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FFFFFF" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image 
            source={getImageSource()} 
            style={styles.mainImage} 
          />
          {/* Status Badge */}
          <View style={[styles.statusBadge, 
            lostPetDetails.status === 'Bulundu' ? styles.statusFoundBadge : styles.statusLostBadge
          ]}>
            <Text style={styles.statusText}>{lostPetDetails.status}</Text>
          </View>
        </View>

        {/* Title and Location */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{lostPetDetails.title}</Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={16} color="#6B7280" />
            {' '}{lostPetDetails.location}
          </Text>
          <Text style={styles.date}>
            İlan Tarihi: {new Date(lostPetDetails.createdAt).toLocaleDateString('tr-TR')}
          </Text>
          
          {/* Additional Info Badge */}
          {lostPetDetails.additionalInfo && (
            <View style={styles.additionalInfoBadge}>
              <Text style={styles.additionalInfoText}>{lostPetDetails.additionalInfo}</Text>
            </View>
          )}
        </View>

        {/* Pet Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Kayıp Hayvan Bilgileri</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hayvan Türü</Text>
              <Text style={styles.detailValue}>{lostPetDetails.animalType || lostPetDetails.category || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Son Görüldüğü Yer</Text>
              <Text style={styles.detailValue}>{lostPetDetails.lastSeenLocation || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Son Görülme Tarihi</Text>
              <Text style={styles.detailValue}>
                {lostPetDetails.lastSeenDate ? 
                  new Date(lostPetDetails.lastSeenDate).toLocaleDateString('tr-TR') : 
                  'Belirtilmemiş'
                }
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Kaybolduğu Bölge</Text>
              <Text style={styles.detailValue}>{lostPetDetails.location || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Durum</Text>
              <Text style={[styles.detailValue, 
                lostPetDetails.status === 'Bulundu' ? styles.statusFound : styles.statusLost
              ]}>
                {lostPetDetails.status}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Görüntülenme</Text>
              <Text style={styles.detailValue}>{lostPetDetails.viewCount || 0} kez</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Açıklama</Text>
          <Text style={styles.description}>{lostPetDetails.details}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 İletişim Bilgileri</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactName}>
              {lostPetDetails.user?.username || 'İlan Sahibi'}
            </Text>
            <Text style={styles.contactEmail}>
              {lostPetDetails.user?.email ? `E-posta: ${lostPetDetails.user.email}` : ''}
            </Text>
            
            <View style={styles.contactButtons}>
              <TouchableOpacity 
                style={styles.phoneButton} 
                onPress={() => handleCall(lostPetDetails.contactInfo)}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.phoneButtonText}>{lostPetDetails.contactInfo}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.whatsappButton} 
                onPress={() => handleWhatsApp(lostPetDetails.contactInfo)}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Emergency Notice */}
        {lostPetDetails.additionalInfo === 'Acil' && (
          <View style={styles.emergencyNotice}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.emergencyText}>
              Bu acil bir durumdur! Lütfen en kısa sürede iletişime geçin.
            </Text>
          </View>
        )}

        {/* Reward Notice */}
        {lostPetDetails.additionalInfo === 'Bulana ödül verilecektir' && (
          <View style={styles.rewardNotice}>
            <Ionicons name="gift" size={24} color="#10B981" />
            <Text style={styles.rewardText}>
              Bu hayvanı bulana ödül verilecektir.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusLostBadge: {
    backgroundColor: '#EF4444',
  },
  statusFoundBadge: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  additionalInfoBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  additionalInfoText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  statusFound: {
    color: '#10B981',
  },
  statusLost: {
    color: '#EF4444',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AB75C2',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  phoneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emergencyNotice: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emergencyText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  rewardNotice: {
    margin: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 50,
  },
}); 