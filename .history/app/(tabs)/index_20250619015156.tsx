import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import adoptionService, { AdoptionListing } from '../../services/adoptionService';
import lostPetService, { LostPet } from '../../services/lostPetService';

export default function HomeScreen() {
  const [adoptionListings, setAdoptionListings] = useState<AdoptionListing[]>([]);
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adoptionData, lostData] = await Promise.all([
        adoptionService.getAdoptionListings(),
        lostPetService.getLostPets()
      ]);
      setAdoptionListings(adoptionData);
      setLostPets(lostData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAdoptionCard = ({ item }: { item: AdoptionListing }) => {
    const getImageSource = () => {
      if (item.imageUrl && item.imageUrl.startsWith('http')) {
        return { uri: item.imageUrl };
      }
      return require('../../assets/social.png');
    };

    return (
      <Link
        href={{
          pathname: '/adoption-detail',
          params: { id: item.id?.toString() }
        }}
        asChild
      >
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <Image source={getImageSource()} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.petName}</Text>
            <Text style={styles.cardDetails}>
              {item.animalType} • {item.age} yaşında
            </Text>
            <Text style={styles.cardLocation}>
              {item.city}, {item.district}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const renderLostPetCard = ({ item }: { item: LostPet }) => {
    const getImageSource = () => {
      if (item.imageUrl && item.imageUrl.startsWith('http')) {
        return { uri: item.imageUrl };
      }
      return require('../../assets/social.png');
    };

    return (
      <Link
        href={{
          pathname: '/lost-detail',
          params: { id: item.id?.toString() }
        }}
        asChild
      >
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <Image source={getImageSource()} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.petName}</Text>
            <Text style={styles.cardDetails}>
              {item.animalType} • Kayıp
            </Text>
            <Text style={styles.cardLocation}>
              {item.city}, {item.district}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB75C2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🏠 Anasayfa</Text>
        <Text style={styles.headerSubtitle}>Hoş geldiniz!</Text>
      </LinearGradient>

      {/* Sahiplendirme İlanları */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sahiplendirme İlanları</Text>
          <Link href="/adopt" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>Tümünü Gör</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <FlatList
          data={adoptionListings.slice(0, 5)}
          renderItem={renderAdoptionCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
        />
      </View>

      {/* Kayıp İlanları */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kayıp İlanları</Text>
          <Link href="/lost" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>Tümünü Gör</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <FlatList
          data={lostPets.slice(0, 5)}
          renderItem={renderLostPetCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  section: {
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllButton: {
    color: '#AB75C2',
    fontSize: 14,
    fontWeight: '600',
  },
  cardList: {
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 5,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
