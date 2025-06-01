import apiClient from './apiClient';

export interface Pet {
  id: string;
  name: string;
  age: number;
  gender: 'erkek' | 'dişi';
  species: string; // köpek, kedi, kuş vb.
  breed: string;
  imageUrl?: string;
  createdAt: string;
  ownerId: number;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'vaccine' | 'treatment' | 'appointment' | 'medication' | 'allergy' | 'weight';
  title: string;
  description: string;
  date: string;
  nextDate?: string;
  createdAt: string;
  
  // Extended fields for specific types
  veterinarian?: string; // for appointments, treatments
  dosage?: string; // for medications, vaccines
  weight?: number; // for weight records
  unit?: string; // for weight records (kg, lb)
  severity?: 'low' | 'medium' | 'high'; // for allergies
  symptoms?: string; // for allergies
  duration?: string; // for treatments, medications
  cost?: number; // for treatments, appointments
}

// Hayvan türleri ve cinsler
export const ANIMAL_SPECIES = {
  köpek: [
    'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 
    'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 
    'Siberian Husky', 'Shih Tzu', 'Boston Terrier', 'Kangal', 'Akbaş', 'Diğer'
  ],
  kedi: [
    'Persian', 'British Shorthair', 'Maine Coon', 'Ragdoll', 'Bengal', 
    'Siamese', 'Abyssinian', 'Russian Blue', 'Scottish Fold', 'Sphynx',
    'Tekir', 'Van Kedisi', 'Ankara Kedisi', 'Diğer'
  ],
  kuş: [
    'Muhabbet Kuşu', 'Kanarya', 'Cennet Papağanı', 'Sultan Papağanı', 'Kakadu', 
    'Ara Papağanı', 'Afrika Grisi', 'Amazon Papağanı', 'Conure', 'Diğer'
  ],
  hamster: [
    'Golden Hamster', 'Dwarf Hamster', 'Roborovski', 'Chinese Hamster', 'Diğer'
  ],
  tavşan: [
    'Holland Lop', 'Mini Rex', 'Lionhead', 'Netherland Dwarf', 'Angora', 'Diğer'
  ]
};

class PetService {
  // 🐾 Kullanıcının evcil hayvanlarını getirme
  async getUserPets(userId: number): Promise<Pet[]> {
    try {
      const response = await apiClient.get<Pet[]>(`/pets/owner/${userId}`);
      
      if (response.error) {
        console.error('Error getting user pets:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting user pets:', error);
      return [];
    }
  }

  // 🐾 Belirli bir evcil hayvan detayı
  async getPetDetails(petId: string): Promise<Pet | null> {
    try {
      const response = await apiClient.get<Pet>(`/pets/${petId}`);
      
      if (response.error) {
        console.error('Error getting pet details:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || null;
    } catch (error) {
      console.error('Error getting pet details:', error);
      return null;
    }
  }

  // Evcil hayvan ekleme (backend endpoint'i gerekecek)
  async addPet(petData: Omit<Pet, 'id' | 'createdAt'>): Promise<Pet> {
    try {
      console.log('🐾 addPet metodu çağrıldı');
      console.log('📝 Gönderilecek pet verisi:', JSON.stringify(petData, null, 2));
      console.log('🌐 API endpoint: /pets');
      
      // Backend'in beklediği formatı test etmek için alternatif formatlar deneyelim
      const alternativeFormats = [
        // Orijinal format
        petData,
        // userId yerine ownerId deneme
        { ...petData, userId: petData.ownerId, ownerId: undefined },
        // owner objesi formatı deneme
        { ...petData, owner: { id: petData.ownerId }, ownerId: undefined },
        // Farklı alan isimleri deneme
        { 
          ...petData, 
          owner_id: petData.ownerId, 
          ownerId: undefined 
        }
      ];

      let lastError: any = null;
      
      for (let i = 0; i < alternativeFormats.length; i++) {
        const format = alternativeFormats[i];
        console.log(`🔄 Format ${i + 1} deneniyor:`, JSON.stringify(format, null, 2));
        
        try {
          const response = await apiClient.post<Pet>('/pets', format);
          console.log(`📡 Format ${i + 1} API yanıtı:`, JSON.stringify(response, null, 2));
          
          if (!response.error && response.data) {
            console.log(`✅ Format ${i + 1} başarılı! Pet eklendi:`, response.data);
            return response.data;
          } else {
            console.log(`❌ Format ${i + 1} başarısız:`, response.error);
            lastError = response.error;
          }
        } catch (error) {
          console.log(`💥 Format ${i + 1} hata:`, error);
          lastError = error;
        }
      }
      
      // Hiçbir format çalışmadıysa hata fırlat
      throw new Error(lastError || 'Tüm formatlar başarısız oldu');
      
    } catch (error) {
      console.error('💥 Pet ekleme sırasında hata:', error);
      if (error instanceof Error) {
        console.error('Hata mesajı:', error.message);
        console.error('Hata stack:', error.stack);
      }
      throw error;
    }
  }

  // Evcil hayvan güncelleme (backend endpoint'i gerekecek)
  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet | null> {
    try {
      const response = await apiClient.put<Pet>(`/pets/${petId}`, updates);
      
      if (response.error) {
        console.error('Error updating pet:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || null;
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  }

  // Evcil hayvan silme (backend endpoint'i gerekecek)
  async deletePet(petId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/pets/${petId}`);
      
      if (response.error) {
        console.error('Error deleting pet:', response.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting pet:', error);
      return false;
    }
  }

  // 🏥 Evcil hayvanın tüm tıbbi kayıtları
  async getAllMedicalRecords(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records`);
      
      if (response.error) {
        console.error('Error getting medical records:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting medical records:', error);
      return [];
    }
  }

  // 💉 Aşıları getir
  async getVaccinations(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records/vaccinations`);
      
      if (response.error) {
        console.error('Error getting vaccinations:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting vaccinations:', error);
      return [];
    }
  }

  // 🔬 Tedavileri getir
  async getTreatments(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records/treatments`);
      
      if (response.error) {
        console.error('Error getting treatments:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting treatments:', error);
      return [];
    }
  }

  // 🚨 Alerjileri getir
  async getAllergies(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records/allergies`);
      
      if (response.error) {
        console.error('Error getting allergies:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting allergies:', error);
      return [];
    }
  }

  // 📅 Randevuları getir
  async getAppointments(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records/appointments`);
      
      if (response.error) {
        console.error('Error getting appointments:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  }

  // ⚖️ Ağırlık kayıtlarını getir
  async getWeightRecords(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records/weight-records`);
      
      if (response.error) {
        console.error('Error getting weight records:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting weight records:', error);
      return [];
    }
  }

  // 💊 İlaçları getir
  async getMedications(petId: string): Promise<HealthRecord[]> {
    try {
      const response = await apiClient.get<HealthRecord[]>(`/pets/${petId}/medical-records/medications`);
      
      if (response.error) {
        console.error('Error getting medications:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting medications:', error);
      return [];
    }
  }

  // Sağlık kaydı ekleme (backend endpoint'i gerekecek)
  async addHealthRecord(recordData: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
    try {
      const endpoint = this.getHealthRecordEndpoint(recordData.type, recordData.petId);
      const response = await apiClient.post<HealthRecord>(endpoint, recordData);
      
      if (response.error) {
        console.error('Error adding health record:', response.error);
        throw new Error(response.error);
      }
      
      return response.data!;
    } catch (error) {
      console.error('Error adding health record:', error);
      throw error;
    }
  }

  // Sağlık kaydı güncelleme (backend endpoint'i gerekecek)
  async updateHealthRecord(recordId: string, updates: Partial<HealthRecord>): Promise<HealthRecord | null> {
    try {
      const response = await apiClient.put<HealthRecord>(`/medical-records/${recordId}`, updates);
      
      if (response.error) {
        console.error('Error updating health record:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || null;
    } catch (error) {
      console.error('Error updating health record:', error);
      throw error;
    }
  }

  // Sağlık kaydı silme (backend endpoint'i gerekecek)
  async deleteHealthRecord(recordId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/medical-records/${recordId}`);
      
      if (response.error) {
        console.error('Error deleting health record:', response.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting health record:', error);
      return false;
    }
  }

  // Legacy method for backward compatibility - now uses getAllMedicalRecords
  async getHealthRecords(petId: string): Promise<HealthRecord[]> {
    return this.getAllMedicalRecords(petId);
  }

  // Legacy method for backward compatibility
  async getHealthRecordsByType(petId: string, type: HealthRecord['type']): Promise<HealthRecord[]> {
    switch (type) {
      case 'vaccine':
        return this.getVaccinations(petId);
      case 'treatment':
        return this.getTreatments(petId);
      case 'appointment':
        return this.getAppointments(petId);
      case 'medication':
        return this.getMedications(petId);
      case 'allergy':
        return this.getAllergies(petId);
      case 'weight':
        return this.getWeightRecords(petId);
      default:
        return [];
    }
  }

  // Helper method to get correct endpoint for health record type
  private getHealthRecordEndpoint(type: HealthRecord['type'], petId: string): string {
    const baseEndpoint = `/pets/${petId}/medical-records`;
    
    switch (type) {
      case 'vaccine':
        return `${baseEndpoint}/vaccinations`;
      case 'treatment':
        return `${baseEndpoint}/treatments`;
      case 'appointment':
        return `${baseEndpoint}/appointments`;
      case 'medication':
        return `${baseEndpoint}/medications`;
      case 'allergy':
        return `${baseEndpoint}/allergies`;
      case 'weight':
        return `${baseEndpoint}/weight-records`;
      default:
        return baseEndpoint;
    }
  }
}

export default new PetService(); 