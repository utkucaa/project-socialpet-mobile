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
import adoptionService, { AdoptionListing } from '../services/adoptionService';

export default function AdoptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [adDetails, setAdDetails] = useState<AdoptionListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchAdDetails = async () => {
      console.log('=== ADOPTION DETAIL DEBUG ===');
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
        console.log("Fetching ad details for ID:", id);
        const data = await adoptionService.getAdoptionListingById(id);
        console.log("Received ad details:", data);
        
        if (!data) {
          console.log('No data returned from API');
          setError("İlan bulunamadı.");
          return;
        }
        
        setAdDetails(data);
      } catch (err: any) {
        console.error("Error fetching ad details:", err);
        console.error("Error message:", err.message);
        console.error("Full error:", JSON.stringify(err, null, 2));
        setError(err.message || "İlan detayları yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdDetails();
  }, [id]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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

  if (error || !adDetails) {
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
        <Text style={styles.headerTitle}>İlan Detayı</Text>
        <TouchableOpacity style={styles.favoriteIcon} onPress={toggleFavorite}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF6B6B" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: adDetails.imageUrl || 'https://via.placeholder.com/400/AB75C2/FFFFFF?text=🐾' }} 
            style={styles.mainImage} 
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{adDetails.title}</Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={16} color="#6B7280" />
            {' '}{adDetails.city} / {adDetails.district || 'Belirtilmemiş'}
          </Text>
          <Text style={styles.date}>
            İlan Tarihi: {new Date(adDetails.createdAt).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        {/* Pet Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐾 Pet Bilgileri</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pet Adı</Text>
              <Text style={styles.detailValue}>{adDetails.petName || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tür</Text>
              <Text style={styles.detailValue}>{adDetails.animalType || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cinsi</Text>
              <Text style={styles.detailValue}>{adDetails.breed || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Yaş</Text>
              <Text style={styles.detailValue}>{adDetails.age || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cinsiyet</Text>
              <Text style={styles.detailValue}>{adDetails.gender || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Boyut</Text>
              <Text style={styles.detailValue}>{adDetails.size || 'Belirtilmemiş'}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Açıklama</Text>
          <Text style={styles.description}>{adDetails.description}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 İletişim Bilgileri</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactName}>{adDetails.fullName || 'İlan Sahibi'}</Text>
            <Text style={styles.contactSource}>Kimden: {adDetails.source || 'Belirtilmemiş'}</Text>
            
            <View style={styles.contactButtons}>
              <TouchableOpacity 
                style={styles.phoneButton} 
                onPress={() => handleCall(adDetails.phone)}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.phoneButtonText}>{adDetails.phone}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.whatsappButton} 
                onPress={() => handleWhatsApp(adDetails.phone)}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.warningTitle}>Dikkat!</Text>
          </View>
          <Text style={styles.warningText}>
            SocialPet.com, pet arayanlar ve sahiplendirme yapanları buluşturan bir platform olup, satış yapmamaktadır. 
            Yüz yüze görüşülmeyen kişilere hiçbir şekilde kaparo ya da bir ödeme yapılmamalıdır.
          </Text>
        </View>

        {/* Report Button */}
        <TouchableOpacity style={styles.reportButton}>
          <Ionicons name="flag" size={20} color="#6B7280" />
          <Text style={styles.reportButtonText}>İlan İle İlgili Şikayetim Var</Text>
        </TouchableOpacity>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  favoriteIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactSource: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  contactButtons: {
    gap: 12,
  },
  phoneButton: {
    backgroundColor: '#AB75C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  phoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    margin: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  warningText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
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
    fontWeight: '600',
  },
}); 