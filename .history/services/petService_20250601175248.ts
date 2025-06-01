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
    'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 
    'Siberian Husky', 'Shih Tzu', 'Boston Terrier', 'Kangal', 'Akbaş', 'Diğer'
  ],
  kedi: [
    'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal', 'Siamese', 'Abyssinian', 'Russian Blue', 'Scottish Fold', 'Sphynx',
    'Tekir', 'Van Kedisi', 'Ankara Kedisi', 'Diğer'
  ],
  kuş: [
    'Muhabbet Kuşu', 'Kanarya', 'Sultan Papağanı', 'Cennet Papağanı', 'Hint Bülbülü', 'Java İspinozu', 'Diğer'
  ],
  balık: [
    'Goldfish', 'Betta', 'Guppy', 'Neon Tetra', 'Angelfish', 'Discus', 'Diğer'
  ],
  tavşan: [
    'Holland Lop', 'Mini Rex', 'Lionhead', 'Netherland Dwarf', 'Angora', 'Diğer'
  ]
};

// Backend için ID mappingleri
const ANIMAL_TYPE_IDS = {
  'köpek': 1,
  'kedi': 2,
  'kuş': 3,
  'balık': 4,
  'tavşan': 5,
  'hamster': 6,
  'kobay': 7,
  'tavuk': 8,
  'kaplumbağa': 9,
  'iguana': 10
};

// Hayvan türü ID'lerinden string kodlara mapping
const ANIMAL_TYPE_CODES = {
  'köpek': 'DOG',
  'kedi': 'CAT', 
  'kuş': 'BIRD',
  'balık': 'FISH',
  'tavşan': 'RABBIT',
  'hamster': 'HAMSTER',
  'yılan': 'SNAKE',
  'tavuk': 'CHICKEN',
  'kaplumbağa': 'TURTLE',
  'iguana': 'IGUANA'
};

const BREED_IDS = {
  // Köpek cinsleri
  'Labrador Retriever': 1,
  'Golden Retriever': 2,
  'German Shepherd': 3,
  'Bulldog': 4,
  'Poodle': 5,
  'Beagle': 6,
  'Rottweiler': 7,
  'Yorkshire Terrier': 8,
  'Dachshund': 9,
  'Siberian Husky': 10,
  'Shih Tzu': 11,
  'Boston Terrier': 12,
  'Kangal': 13,
  'Akbaş': 14,
  // Kedi cinsleri
  'Persian': 15,
  'Maine Coon': 16,
  'British Shorthair': 17,
  'Ragdoll': 18,
  'Bengal': 19,
  'Siamese': 20,
  'Abyssinian': 21,
  'Russian Blue': 22,
  'Scottish Fold': 23,
  'Sphynx': 24,
  'Tekir': 25,
  'Van Kedisi': 26,
  'Ankara Kedisi': 27,
  // Kuş cinsleri  
  'Muhabbet Kuşu': 28,
  'Kanarya': 29,
  'Sultan Papağanı': 30,
  'Cennet Papağanı': 31,
  'Hint Bülbülü': 32,
  'Java İspinozu': 33,
  // Balık cinsleri
  'Goldfish': 34,
  'Betta': 35,
  'Guppy': 36,
  'Neon Tetra': 37,
  'Angelfish': 38,
  'Discus': 39,
  // Tavşan cinsleri
  'Holland Lop': 40,
  'Mini Rex': 41,
  'Lionhead': 42,
  'Netherland Dwarf': 43,
  'Angora': 44,
  // Varsayılan
  'Diğer': 999
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
      console.log('🌐 API endpoint: /api/pets');
      
      // Backend'in beklediği format için animalType string'ini alıyoruz
      const animalType = ANIMAL_TYPE_CODES[petData.species as keyof typeof ANIMAL_TYPE_CODES];
      const breedId = BREED_IDS[petData.breed as keyof typeof BREED_IDS];
      
      if (!animalType) {
        console.error('❌ Geçersiz hayvan türü:', petData.species);
        throw new Error(`Geçersiz hayvan türü: ${petData.species}`);
      }
      
      if (!breedId) {
        console.error('❌ Geçersiz cins:', petData.breed);
        throw new Error(`Geçersiz cins: ${petData.breed}`);
      }
      
      // Backend'in beklediği formatı hazırlayalım (endpoint dökümantasyonuna göre)
      const backendFormat = {
        name: petData.name,
        age: petData.age,
        gender: petData.gender,
        animalType: animalType,  // animalTypeId değil animalType string olarak
        breedId: breedId,
        ownerId: petData.ownerId
      };
      
      console.log('🔄 Backend formatında veri:', JSON.stringify(backendFormat, null, 2));
      
      const response = await apiClient.post<Pet>('/api/pets', backendFormat);
      console.log('📡 API yanıtı:', JSON.stringify(response, null, 2));
      
      if (!response.error && response.data) {
        console.log('✅ Pet başarıyla eklendi:', response.data);
        return response.data;
      } else {
        console.error('❌ Pet ekleme başarısız:', response.error);
        throw new Error(response.error || 'Pet ekleme başarısız');
      }
      
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