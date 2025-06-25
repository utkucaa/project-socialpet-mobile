export interface Breed {
  id?: number;
  name: string;
  description: string;
  animalType: 'DOG' | 'CAT';
}

export interface AnimalType {
  code: string;
  name: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class BreedService {
  // Get all breeds
  async getAllBreeds(): Promise<ApiResponse<Breed[]>> {
    try {
      const response = await fetch('http://localhost:8080/api/breeds');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🐾 Tüm cinsler alındı:', data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Cins listesi alma hatası:', error);
      return {
        error: 'Cins listesi alınamadı',
        status: 0
      };
    }
  }

  // Get breed by ID
  async getBreedById(id: number): Promise<ApiResponse<Breed>> {
    try {
      const response = await fetch(`http://192.168.1.120:8080/api/breeds/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🐾 Cins detayı alındı:', data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Cins detayı alma hatası:', error);
      return {
        error: 'Cins detayı alınamadı',
        status: 0
      };
    }
  }

  // Get breeds by animal type (path parameter)
  async getBreedsByAnimalType(animalType: 'DOG' | 'CAT'): Promise<ApiResponse<Breed[]>> {
    try {
      const response = await fetch(`http://192.168.1.120:8080/api/breeds/by-animal-type/${animalType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`🐾 ${animalType} cinsleri alındı:`, data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Hayvan türüne göre cins listesi alma hatası:', error);
      return {
        error: 'Hayvan türüne göre cins listesi alınamadı',
        status: 0
      };
    }
  }

  // Get breeds by animal type (query parameter)
  async getBreedsByAnimalTypeQuery(animalType: 'DOG' | 'CAT'): Promise<ApiResponse<Breed[]>> {
    try {
      const response = await fetch(`http://192.168.1.120:8080/api/breeds?animalType=${animalType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`🐾 ${animalType} cinsleri (query) alındı:`, data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Hayvan türüne göre cins listesi (query) alma hatası:', error);
      return {
        error: 'Hayvan türüne göre cins listesi alınamadı',
        status: 0
      };
    }
  }

  // Get all animal types
  async getAnimalTypes(): Promise<ApiResponse<AnimalType[]>> {
    try {
      const response = await fetch('http://192.168.1.120:8080/api/breeds/animal-types');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🐾 Hayvan türleri alındı:', data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Hayvan türleri alma hatası:', error);
      return {
        error: 'Hayvan türleri alınamadı',
        status: 0
      };
    }
  }

  // Create new breed
  async createBreed(breed: Omit<Breed, 'id'>): Promise<ApiResponse<Breed>> {
    try {
      const response = await fetch('http://192.168.1.120:8080/api/breeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(breed),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🐾 Yeni cins oluşturuldu:', data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Cins oluşturma hatası:', error);
      return {
        error: 'Cins oluşturulamadı',
        status: 0
      };
    }
  }

  // Update breed
  async updateBreed(id: number, breed: Omit<Breed, 'id'>): Promise<ApiResponse<Breed>> {
    try {
      const response = await fetch(`http://192.168.1.120:8080/api/breeds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(breed),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🐾 Cins güncellendi:', data);
      
      return {
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Cins güncelleme hatası:', error);
      return {
        error: 'Cins güncellenemedi',
        status: 0
      };
    }
  }

  // Delete breed
  async deleteBreed(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`http://192.168.1.120:8080/api/breeds/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('🐾 Cins silindi, ID:', id);
      
      return {
        status: response.status
      };
    } catch (error) {
      console.error('❌ Cins silme hatası:', error);
      return {
        error: 'Cins silinemedi',
        status: 0
      };
    }
  }
}

export default new BreedService(); 