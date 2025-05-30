import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8080';

export interface LostPet {
  id: number;
  title: string;
  details: string;
  location: string;
  category: string;
  status: string;
  additionalInfo: string;
  contactInfo: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  imageUrl: string;
  animalType: string;
  image: string;
  timestamp: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface LostPetData {
  title: string;
  details: string;
  location: string;
  category: string;
  status: string;
  additionalInfo: string;
  contactInfo: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  imageUrl: string;
  animalType: string;
  image: string;
}

const lostPetService = {
  
  getLostPets: async (): Promise<LostPet[]> => {
    try {
      console.log('API isteği başlatılıyor:', `${API_BASE_URL}/api/lostpets`);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('Token yok, önce giriş yapılması gerekiyor');
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
        console.error('API Hatası:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
    
        if (response.status === 403) {
          throw new Error('Erişim reddedildi, lütfen yeniden giriş yapın');
        } else if (response.status === 404) {
          throw new Error('İlan bulunamadı');
        }
        
        throw new Error(errorData?.message || 'İlanlar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('API yanıtı:', data);
      
      if (!data) {
        throw new Error('Sunucudan veri alınamadı');
      }

      const processedData = data.map((listing: LostPet) => ({
        ...listing,
        imageUrl: listing.imageUrl ? 
          (listing.imageUrl.startsWith('http') ? listing.imageUrl : `${API_BASE_URL}${listing.imageUrl}`) 
          : null
      }));

      console.log('İşlenmiş veri:', processedData);
      return processedData;
    } catch (error: any) {
      console.error('API Hatası:', error);
      throw new Error(error.message || 'İlanlar yüklenirken bir hata oluştu');
    }
  },

  getLostPetById: async (id: string): Promise<LostPet> => {
    try {
      console.log('Kayıp ilan detayı getiriliyor, ID:', id);
      
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
        console.error('API Hatası:', errorData);
        
        if (response.status === 404) {
          throw new Error('İlan bulunamadı');
        } else if (response.status === 403) {
          throw new Error('Erişim reddedildi');
        }
        
        throw new Error(errorData?.message || 'İlan detayları yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('İlan detayı alındı:', data);

      return {
        ...data,
        imageUrl: data.imageUrl ? 
          (data.imageUrl.startsWith('http') ? data.imageUrl : `${API_BASE_URL}${data.imageUrl}`) 
          : null
      };
    } catch (error: any) {
      console.error('İlan detayı alma hatası:', error);
      throw new Error(error.message || 'İlan detayları yüklenirken bir hata oluştu');
    }
  },

  createLostPet: async (userId: number, data: LostPetData): Promise<LostPet> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      console.log('Kayıp ilan oluşturuluyor:', data);

      const response = await fetch(`${API_BASE_URL}/api/lostpets/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('İlan oluşturma hatası:', errorData);
        throw new Error(errorData?.message || 'İlan oluşturulurken bir hata oluştu');
      }

      const listing = await response.json();
      console.log('İlan oluşturuldu:', listing);

      return {
        ...listing,
        imageUrl: listing.imageUrl ? 
          (listing.imageUrl.startsWith('http') ? listing.imageUrl : `${API_BASE_URL}${listing.imageUrl}`)
          : null
      };
    } catch (error: any) {
      console.error('İlan oluşturma hatası:', error);
      throw new Error(error.message || 'İlan oluşturulurken bir hata oluştu');
    }
  },

  updateLostPet: async (id: number, data: LostPetData): Promise<LostPet> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const response = await fetch(`${API_BASE_URL}/api/lostpets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'İlan güncellenirken bir hata oluştu');
      }

      const listing = await response.json();
      return {
        ...listing,
        imageUrl: listing.imageUrl ? 
          (listing.imageUrl.startsWith('http') ? listing.imageUrl : `${API_BASE_URL}${listing.imageUrl}`)
          : null
      };
    } catch (error: any) {
      console.error('İlan güncelleme hatası:', error);
      throw new Error(error.message || 'İlan güncellenirken bir hata oluştu');
    }
  },

  deleteLostPet: async (id: number, userId: number): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const response = await fetch(`${API_BASE_URL}/api/lostpets/${id}?userId=${userId}`, {
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