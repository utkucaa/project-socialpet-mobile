
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
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Hatası:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        if (response.status === 404) {
          throw new Error('Bağış kurumları bulunamadı');
        }
        
        throw new Error(errorData?.message || 'Bağış kurumları yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('API yanıtı:', data);
      
      if (!data) {
        throw new Error('Sunucudan veri alınamadı');
      }

      // Görsel URL'lerini işle
      const processedData = data.map((org: DonationOrganization) => ({
        ...org,
        imageUrl: org.imageUrl ? 
          (org.imageUrl.startsWith('http') ? org.imageUrl : `${API_BASE_URL}${org.imageUrl}`) 
          : null
      }));

      console.log('İşlenmiş veri:', processedData);
      return processedData;
    } catch (error: any) {
      console.error('API Hatası:', error);
      throw new Error(error.message || 'Bağış kurumları yüklenirken bir hata oluştu');
    }
  },

  getDonationOrganizationById: async (id: number): Promise<DonationOrganization> => {
    try {
      console.log('Bağış kurumu detayı getiriliyor, ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/donation-organizations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Hatası:', errorData);
        
        if (response.status === 404) {
          throw new Error('Bağış kurumu bulunamadı');
        }
        
        throw new Error(errorData?.message || 'Bağış kurumu detayları yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      console.log('Bağış kurumu detayı alındı:', data);

      return {
        ...data,
        imageUrl: data.imageUrl ? 
          (data.imageUrl.startsWith('http') ? data.imageUrl : `${API_BASE_URL}${data.imageUrl}`) 
          : null
      };
    } catch (error: any) {
      console.error('Bağış kurumu detayı alma hatası:', error);
      throw new Error(error.message || 'Bağış kurumu detayları yüklenirken bir hata oluştu');
    }
  }
};

export default adminService; 