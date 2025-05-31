import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import adminService, { DonationOrganization } from '../services/adminService';

const { width } = Dimensions.get('window');

export default function DonateScreen() {
  const [organizations, setOrganizations] = useState<DonationOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminService.getActiveDonationOrganizations();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message || 'Bağış kurumları yüklenirken bir hata oluştu');
      console.error('Error fetching donation organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePress = (phoneNumber: string) => {
    const cleanedNumber = phoneNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const handleIbanPress = (iban: string) => {
    Alert.alert(
      'IBAN Kopyalandı',
      `${iban} kopyalandı. Bağış yapmak için bankacılık uygulamanızı açın.`,
      [
        { text: 'Tamam', style: 'default' }
      ]
    );
  };

  const handleSocialPress = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderSocialButton = (url: string | undefined, icon: string, color: string) => {
    if (!url) return null;
    
    return (
      <TouchableOpacity
        style={[styles.socialButton, { backgroundColor: color }]}
        onPress={() => handleSocialPress(url)}
      >
        <Text style={styles.socialIcon}>{icon}</Text>
      </TouchableOpacity>
    );
  };

  const renderOrganizationCard = ({ item }: { item: DonationOrganization }) => (
    <View style={styles.organizationCard}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      
      {/* Organization Image */}
      <View style={styles.cardImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageIcon}>🏠</Text>
            <Text style={styles.noImageText}>Resim Yok</Text>
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        {/* Phone Number */}
        <TouchableOpacity 
          style={styles.infoRow} 
          onPress={() => handlePhonePress(item.phoneNumber)}
        >
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoText}>{item.phoneNumber}</Text>
        </TouchableOpacity>

        {/* IBAN */}
        <TouchableOpacity 
          style={styles.infoRow} 
          onPress={() => handleIbanPress(item.iban)}
        >
          <Text style={styles.infoIcon}>🏦</Text>
          <Text style={styles.infoText} numberOfLines={2}>{item.iban}</Text>
        </TouchableOpacity>

        {/* Address */}
        {item.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Adres:</Text>
              <Text style={styles.infoText}>{item.address}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {item.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Açıklama:</Text>
              <Text style={styles.infoText}>{item.description}</Text>
            </View>
          </View>
        )}

        {/* Social Media Links */}
        <View style={styles.socialLinksContainer}>
          <Text style={styles.socialLinksTitle}>Sosyal Medya:</Text>
          <View style={styles.socialButtonsRow}>
            {renderSocialButton(item.instagramUrl, '📷', '#E4405F')}
            {renderSocialButton(item.facebookUrl, '📘', '#1877F2')}
            {renderSocialButton(item.twitterUrl, '🐦', '#1DA1F2')}
            {renderSocialButton(item.website, '🌐', '#6B7280')}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#AB75C2', '#9B6BB0', '#8B5BA0']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <View style={styles.backButtonContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>← Geri</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Barınaklara Bağış</Text>
              <Text style={styles.heroSubtitle}>Bağışınızla Umut Işığı Olun!</Text>
              <Text style={styles.heroDescription}>
                Sokak hayvanlarına sahip çıkan barınaklara destek olun. 
                Her bağış, onlarca canlıya umut oluyor.
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💝 BAĞIŞ ALAN KURUMLAR</Text>
            <Text style={styles.sectionSubtitle}>
              Aktif olarak bağış kabul eden güvenilir barınaklar
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#AB75C2" />
              <Text style={styles.loadingText}>Bağış kurumları yükleniyor...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchOrganizations}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : organizations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>Henüz bağış kurumu yok</Text>
              <Text style={styles.emptyText}>
                Şu anda aktif bağış kurumu bulunmamaktadır. Lütfen daha sonra tekrar kontrol edin.
              </Text>
            </View>
          ) : (
            <FlatList
              data={organizations}
              renderItem={renderOrganizationCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
            />
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroTextContainer: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F3E5F5',
    textAlign: 'center',
    marginBottom: 15,
  },
  heroDescription: {
    fontSize: 16,
    color: '#E8D5EB',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  contentSection: {
    padding: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#AB75C2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  organizationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 15,
  },
  cardImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardImage: {
    width: width - 80,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  noImageContainer: {
    width: width - 80,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noImageIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardInfo: {
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
    flex: 1,
  },
  socialLinksContainer: {
    marginTop: 10,
  },
  socialLinksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    fontSize: 22,
  },
  bottomPadding: {
    height: 40,
  },
}); 