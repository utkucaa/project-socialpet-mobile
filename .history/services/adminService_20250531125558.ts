const API_BASE_URL = 'http://localhost:8080';

export interface DonationOrganization {
  id: number;
  name: string;
  phoneNumber: string;
  iban: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const adminService = {
  
  getActiveDonationOrganizations: async (): Promise<DonationOrganization[]> => {
    try {
      console.log('API isteği başlatılıyor:', `${API_BASE_URL}/api/v1/donation-organizations`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/donation-organizations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Hatası:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        if (response.status === 404) {
          throw new Error('Bağış kurumları bulunamadı');
        } else if (response.status === 403) {
          throw new Error('Bu işlem için yetkiniz bulunmuyor');
        } else if (response.status === 500) {
          throw new Error('Sunucu hatası');
        }
        
        throw new Error(errorData?.message || 'Bağış kurumları yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('API yanıtı:', data);
      
      if (!data) {
        throw new Error('Sunucudan veri alınamadı');
      }

      // Array kontrolü - eğer data array değilse boş array döndür
      if (!Array.isArray(data)) {
        console.warn('API yanıtı array değil:', data);
        return [];
      }

      // Görsel URL'lerini işle
      const processedData = data.map((org: DonationOrganization) => ({
        ...org,
        imageUrl: org.imageUrl ? 
          (org.imageUrl.startsWith('http') ? org.imageUrl : `${API_BASE_URL}${org.imageUrl}`) 
          : undefined
      }));

      console.log('İşlenmiş veri:', processedData);
      return processedData;
    } catch (error: any) {
      console.error('API Hatası:', error);
      
      // Network hatası durumunda mock data döndür
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        console.log('Network hatası, mock data döndürülüyor');
        return adminService.getMockDonationOrganizations();
      }
      
      throw new Error(error.message || 'Bağış kurumları yüklenirken bir hata oluştu');
    }
  },

  // Mock data for testing
  getMockDonationOrganizations: (): DonationOrganization[] => {
    return [
      {
        id: 1,
        name: "İstanbul Hayvan Barınağı",
        phoneNumber: "+90 212 555 0101",
        iban: "TR12 0001 0000 0000 0000 0000 01",
        address: "Zeytinburnu, İstanbul",
        description: "İstanbul'da bulunan en büyük hayvan barınaklarından biri. 500'den fazla sokak hayvanına ev sahipliği yapıyor.",
        imageUrl: "https://via.placeholder.com/400x200/AB75C2/FFFFFF?text=İstanbul+Barınağı",
        instagramUrl: "https://instagram.com/istanbulbarinak",
        facebookUrl: "https://facebook.com/istanbulbarinak",
        website: "https://istanbulbarinak.com",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      },
      {
        id: 2,
        name: "Ankara Pati Dostları Derneği",
        phoneNumber: "+90 312 555 0202", 
        iban: "TR34 0002 0000 0000 0000 0000 02",
        address: "Çankaya, Ankara",
        description: "Ankara'da sokak hayvanlarının tedavi ve bakımını üstlenen gönüllü kuruluş.",
        imageUrl: "https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=Ankara+Pati",
        instagramUrl: "https://instagram.com/ankarapati",
        twitterUrl: "https://twitter.com/ankarapati",
        website: "https://ankarapati.org",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      },
      {
        id: 3,
        name: "İzmir Sevimli Dostlar Vakfı",
        phoneNumber: "+90 232 555 0303",
        iban: "TR56 0003 0000 0000 0000 0000 03", 
        address: "Konak, İzmir",
        description: "İzmir ve çevresinde sokak hayvanlarının beslenmesi ve sağlık hizmetleri konusunda faaliyet gösteren vakıf.",
        imageUrl: "https://via.placeholder.com/400x200/4ECDC4/FFFFFF?text=İzmir+Vakfı",
        instagramUrl: "https://instagram.com/izmirsevimli",
        facebookUrl: "https://facebook.com/izmirsevimli",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z", 
        updatedAt: "2024-01-01T00:00:00Z"
      }
    ];
  },

  getDonationOrganizationById: async (id: number): Promise<DonationOrganization> => {
    try {
      console.log('Bağış kurumu detayı getiriliyor, ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/donation-organizations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Hatası:', errorData);
        
        if (response.status === 404) {
          throw new Error('Bağış kurumu bulunamadı');
        } else if (response.status === 403) {
          throw new Error('Bu işlem için yetkiniz bulunmuyor');
        }
        
        throw new Error(errorData?.message || 'Bağış kurumu detayları yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('Bağış kurumu detayı alındı:', data);

      return {
        ...data,
        imageUrl: data.imageUrl ? 
          (data.imageUrl.startsWith('http') ? data.imageUrl : `${API_BASE_URL}${data.imageUrl}`) 
          : undefined
      };
    } catch (error: any) {
      console.error('Bağış kurumu detayı alma hatası:', error);
      
      // Network hatası durumunda mock data'dan bul
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        const mockData = adminService.getMockDonationOrganizations();
        const found = mockData.find((org: DonationOrganization) => org.id === id);
        if (found) {
          return found;
        }
      }
      
      throw new Error(error.message || 'Bağış kurumu detayları yüklenirken bir hata oluştu');
    }
  }
};

export default adminService; 