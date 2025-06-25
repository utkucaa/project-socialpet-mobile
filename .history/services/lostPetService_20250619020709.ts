import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8080';

export interface LostPet {
  id?: number;
  petName: string;
  animalType: string;
  breed: string;
  age: number;
  gender: string;
  city: string;
  district: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  description: string;
  contactName: string;
  contactPhone: string;
  reward?: string;
  isFound: boolean;
  imageUrl?: string;
  createdAt?: string;
  status?: string;
}

const animalTypeMapping: { [key: string]: string } = {
  'Köpek': 'DOG',
  'Kedi': 'CAT',
  'Kuş': 'BIRD',
  'Balık': 'FISH',
  'Tavşan': 'RABBIT',
  'Diğer': 'OTHER'
};

const genderMapping: { [key: string]: string } = {
  'Erkek': 'MALE',
  'Dişi': 'FEMALE'
};

const lostPetService = {
  getLostPets: async (): Promise<LostPet[]> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const response = await fetch(`${API_BASE_URL}/api/lostpets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 403) {
          throw new Error('Erişim reddedildi, lütfen yeniden giriş yapın');
        }
        throw new Error(errorData?.message || 'İlanlar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API Hatası:', error);
      throw new Error(error.message || 'İlanlar yüklenirken bir hata oluştu');
    }
  },

  createLostPet: async (data: LostPet): Promise<LostPet> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const user = JSON.parse(userString);

      // Boş alanları varsayılan değerlerle doldur ve Türkçe değerleri İngilizce'ye çevir
      const processedData = {
        ...data,
        petName: data.petName || 'İsimsiz',
        animalType: animalTypeMapping[data.animalType] || 'OTHER',
        breed: data.breed || 'Belirtilmemiş',
        age: data.age || 0,
        gender: genderMapping[data.gender] || 'UNKNOWN',
        city: data.city || 'Belirtilmemiş',
        district: data.district || 'Belirtilmemiş',
        lastSeenDate: data.lastSeenDate || new Date().toISOString(),
        reward: data.reward || '',
        description: data.description || '',
        photos: data.photos || []
      };

      const response = await fetch(`${API_BASE_URL}/api/lostpets/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'İlan oluşturulurken bir hata oluştu');
      }

      return await response.json();
    } catch (error: any) {
      console.error('İlan oluşturma hatası:', error);
      throw new Error(error.message || 'İlan oluşturulurken bir hata oluştu');
    }
  },

  getLostPetById: async (id: string): Promise<LostPet> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const response = await fetch(`${API_BASE_URL}/api/lostpets/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'İlan bulunamadı');
      }

      return await response.json();
    } catch (error: any) {
      console.error('İlan detayı getirme hatası:', error);
      throw new Error(error.message || 'İlan detayı alınırken bir hata oluştu');
    }
  },

  deleteLostPet: async (id: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const user = JSON.parse(userString);

      const response = await fetch(`${API_BASE_URL}/api/lostpets/${id}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'İlan silinirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('İlan silme hatası:', error);
      throw new Error(error.message || 'İlan silinirken bir hata oluştu');
    }
  }
};

export default lostPetService; 