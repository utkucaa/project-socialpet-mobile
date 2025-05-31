import AsyncStorage from '@react-native-async-storage/async-storage';

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
    'Muhabbet Kuşu', 'Kanarya', 'Cennet Papağanı', 'Sultan Papağanı', 
    'Kakadu', 'Ara Papağanı', 'Bülbül', 'Saka', 'Diğer'
  ],
  hamster: [
    'Golden Hamster', 'Dwarf Hamster', 'Chinese Hamster', 'Roborovski', 'Diğer'
  ],
  tavşan: [
    'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Angora', 'Diğer'
  ]
};

class PetService {
  private petsKey = 'user_pets';
  private healthRecordsKey = 'health_records';

  // Evcil hayvan ekleme
  async addPet(petData: Omit<Pet, 'id' | 'createdAt'>): Promise<Pet> {
    try {
      const pets = await this.getUserPets(petData.ownerId);
      
      const newPet: Pet = {
        ...petData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      const updatedPets = [...pets, newPet];
      await this.savePets(updatedPets);
      
      return newPet;
    } catch (error) {
      console.error('Error adding pet:', error);
      throw error;
    }
  }

  // Kullanıcının evcil hayvanlarını getirme
  async getUserPets(userId: number): Promise<Pet[]> {
    try {
      const petsData = await AsyncStorage.getItem(this.petsKey);
      if (!petsData) return [];
      
      const allPets: Pet[] = JSON.parse(petsData);
      return allPets.filter(pet => pet.ownerId === userId);
    } catch (error) {
      console.error('Error getting user pets:', error);
      return [];
    }
  }

  // Evcil hayvan güncelleme
  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet | null> {
    try {
      const allPets = await this.getAllPets();
      const petIndex = allPets.findIndex(pet => pet.id === petId);
      
      if (petIndex === -1) return null;
      
      const updatedPet = { ...allPets[petIndex], ...updates };
      allPets[petIndex] = updatedPet;
      
      await this.savePets(allPets);
      return updatedPet;
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  }

  // Evcil hayvan silme
  async deletePet(petId: string): Promise<boolean> {
    try {
      const allPets = await this.getAllPets();
      const filteredPets = allPets.filter(pet => pet.id !== petId);
      
      await this.savePets(filteredPets);
      
      // İlgili sağlık kayıtlarını da sil
      await this.deleteHealthRecordsByPetId(petId);
      
      return true;
    } catch (error) {
      console.error('Error deleting pet:', error);
      return false;
    }
  }

  // Sağlık kaydı ekleme
  async addHealthRecord(recordData: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
    try {
      const records = await this.getHealthRecords(recordData.petId);
      
      const newRecord: HealthRecord = {
        ...recordData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      const updatedRecords = [...records, newRecord];
      await this.saveHealthRecords(updatedRecords);
      
      return newRecord;
    } catch (error) {
      console.error('Error adding health record:', error);
      throw error;
    }
  }

  // Evcil hayvanın sağlık kayıtlarını getirme
  async getHealthRecords(petId: string): Promise<HealthRecord[]> {
    try {
      const recordsData = await AsyncStorage.getItem(this.healthRecordsKey);
      if (!recordsData) return [];
      
      const allRecords: HealthRecord[] = JSON.parse(recordsData);
      return allRecords.filter(record => record.petId === petId);
    } catch (error) {
      console.error('Error getting health records:', error);
      return [];
    }
  }

  // Sağlık kaydı güncelleme
  async updateHealthRecord(recordId: string, updates: Partial<HealthRecord>): Promise<HealthRecord | null> {
    try {
      const allRecords = await this.getAllHealthRecords();
      const recordIndex = allRecords.findIndex(record => record.id === recordId);
      
      if (recordIndex === -1) return null;
      
      const updatedRecord = { ...allRecords[recordIndex], ...updates };
      allRecords[recordIndex] = updatedRecord;
      
      await this.saveHealthRecords(allRecords);
      return updatedRecord;
    } catch (error) {
      console.error('Error updating health record:', error);
      throw error;
    }
  }

  // Sağlık kaydı silme
  async deleteHealthRecord(recordId: string): Promise<boolean> {
    try {
      const allRecords = await this.getAllHealthRecords();
      const filteredRecords = allRecords.filter(record => record.id !== recordId);
      
      await this.saveHealthRecords(filteredRecords);
      return true;
    } catch (error) {
      console.error('Error deleting health record:', error);
      return false;
    }
  }

  // Türe göre sağlık kayıtlarını getirme
  async getHealthRecordsByType(petId: string, type: HealthRecord['type']): Promise<HealthRecord[]> {
    try {
      const records = await this.getHealthRecords(petId);
      return records.filter(record => record.type === type);
    } catch (error) {
      console.error('Error getting health records by type:', error);
      return [];
    }
  }

  // Private helper methods
  private async getAllPets(): Promise<Pet[]> {
    try {
      const petsData = await AsyncStorage.getItem(this.petsKey);
      return petsData ? JSON.parse(petsData) : [];
    } catch (error) {
      console.error('Error getting all pets:', error);
      return [];
    }
  }

  private async savePets(pets: Pet[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.petsKey, JSON.stringify(pets));
    } catch (error) {
      console.error('Error saving pets:', error);
      throw error;
    }
  }

  private async getAllHealthRecords(): Promise<HealthRecord[]> {
    try {
      const recordsData = await AsyncStorage.getItem(this.healthRecordsKey);
      return recordsData ? JSON.parse(recordsData) : [];
    } catch (error) {
      console.error('Error getting all health records:', error);
      return [];
    }
  }

  private async saveHealthRecords(records: HealthRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.healthRecordsKey, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving health records:', error);
      throw error;
    }
  }

  private async deleteHealthRecordsByPetId(petId: string): Promise<void> {
    try {
      const allRecords = await this.getAllHealthRecords();
      const filteredRecords = allRecords.filter(record => record.petId !== petId);
      await this.saveHealthRecords(filteredRecords);
    } catch (error) {
      console.error('Error deleting health records by pet id:', error);
    }
  }
}

export default new PetService(); 