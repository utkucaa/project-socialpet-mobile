import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8080';

export interface AdoptionListing {
  id: number;
  title: string;
  petName: string;
  animalType: string;
  breed: string;
  age: number;
  gender: string;
  size: string;
  description: string;
  city: string;
  district: string;
  fullName: string;
  phone: string;
  imageUrl?: string;
  createdAt: string;
  status: string;
  source: string;
  slug?: string;
}

export interface AdoptionData {
  petName: string;
  animalType: string;
  city: string;
  breed: string;
  age: number;
  size: string;
  gender: string;
  source: string;
  title: string;
  description: string;
  district: string;
  fullName: string;
  phone: string;
}

const adoptionService = {
  
  getAdoptionListings: async (): Promise<AdoptionListing[]> => {
    try {
      console.log('API isteği başlatılıyor:', `${API_BASE_URL}/api/v1/adoption/recent`);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('Token yok, önce giriş yapılması gerekiyor');
        throw new Error('Lütfen önce giriş yapınız');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/adoption/recent`, {
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

      const processedData = data.map((listing: AdoptionListing) => ({
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

  createAdoptionListing: async (data: AdoptionData): Promise<AdoptionListing> => {
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

      const requestData = {
        ...data,
        user: {
          id: user.id
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/adoption/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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

  uploadPhoto: async (id: number, photoUri: string): Promise<any> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Lütfen önce giriş yapınız');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/v1/adoption/${id}/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Fotoğraf yükleme hatası:', errorData);
        throw new Error(errorData?.message || 'Fotoğraf yüklenirken bir hata oluştu');
      }

      const result = await response.json();
      console.log('Fotoğraf yüklendi:', result);
      return result;
    } catch (error: any) {
      console.error('Fotoğraf yükleme hatası:', error);
      throw new Error(error.message || 'Fotoğraf yüklenirken bir hata oluştu');
    }
  },

  getAdoptionListingById: async (id: string): Promise<AdoptionListing> => {
    try {
      console.log('getAdoptionListingById called with ID:', id);
      
      // Backend'de tek ilan endpoint'i olmadığı için, tüm ilanları çekip filtreliyoruz
      const allListings = await adoptionService.getAdoptionListings();
      console.log('All listings fetched:', allListings.length);
      
      const targetId = parseInt(id);
      const foundListing = allListings.find(listing => listing.id === targetId);
      
      if (!foundListing) {
        console.log('Listing not found for ID:', targetId);
        throw new Error('İlan bulunamadı');
      }
      
      console.log('Found listing:', foundListing);
      return foundListing;
    } catch (error: any) {
      console.error('Adoption listing fetch error:', error);
      throw new Error(error.message || 'İlan detayları yüklenemedi');
    }
  }
};

export default adoptionService; 