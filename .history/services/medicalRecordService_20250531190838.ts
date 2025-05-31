import { Vaccination, VaccinationForm } from '../components/medical/types';
import apiClient from './apiClient';

// Get all vaccinations for a pet
export const getVaccinations = async (petId: string): Promise<Vaccination[]> => {
  try {
    const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/vaccinations`);
    
    if (response.error) {
      console.error('Error getting vaccinations:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Raw vaccination response:', response.data); // Debug log
    
    // Transform the response based on actual API structure
    const vaccinations = (response.data || []).map(item => {
      console.log('Processing vaccination item:', item); // Debug log
      
      const vaccination = {
        id: item.id?.toString() || String(Math.random()),
        name: item.vaccineName || 'Bilinmeyen Aşı',
        date: item.vaccinationDate || '',
        veterinarian: item.veterinarian || 'Belirtilmemiş'
      };
      
      console.log('Transformed vaccination:', vaccination); // Debug log
      return vaccination;
    });
    
    console.log('All transformed vaccinations:', vaccinations); // Debug log
    
    return vaccinations;
  } catch (error) {
    console.error('Error getting vaccinations:', error);
    return [];
  }
};

// Add a new vaccination
export const addVaccination = async (petId: string, vaccinationData: VaccinationForm): Promise<Vaccination> => {
  try {
    console.log('Adding vaccination for petId:', petId, 'data:', vaccinationData); // Debug log
    
    // Payload matches the API expectations
    const payload = {
      vaccineName: vaccinationData.vaccineName,
      vaccinationDate: vaccinationData.vaccinationDate,
      veterinarian: vaccinationData.veterinarian
    };
    
    console.log('Vaccination payload:', payload); // Debug log
    
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/vaccinations`, payload);
    
    if (response.error) {
      console.error('Error adding vaccination:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Add vaccination response:', response.data); // Debug log
    
    // Transform response to our format
    const vaccination: Vaccination = {
      id: response.data?.id?.toString() || String(Math.random()),
      name: response.data?.vaccineName || vaccinationData.vaccineName,
      date: response.data?.vaccinationDate || vaccinationData.vaccinationDate,
      veterinarian: response.data?.veterinarian || vaccinationData.veterinarian
    };
    
    return vaccination;
  } catch (error) {
    console.error('Error adding vaccination:', error);
    throw error;
  }
};

// Update an existing vaccination
export const updateVaccination = async (petId: string, vaccinationId: string, vaccinationData: VaccinationForm): Promise<Vaccination> => {
  try {
    const payload = {
      vaccineName: vaccinationData.vaccineName,
      vaccinationDate: vaccinationData.vaccinationDate,
      veterinarian: vaccinationData.veterinarian
    };
    
    console.log('Update vaccination payload:', payload, 'for ID:', vaccinationId); // Debug log
    
    const response = await apiClient.put<any>(`/pets/${petId}/medical-records/vaccinations/${vaccinationId}`, payload);
    
    if (response.error) {
      console.error('Error updating vaccination:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Update vaccination response:', response.data); // Debug log
    
    // Transform response to our format
    const vaccination: Vaccination = {
      id: vaccinationId,
      name: response.data?.vaccineName || vaccinationData.vaccineName,
      date: response.data?.vaccinationDate || vaccinationData.vaccinationDate,
      veterinarian: response.data?.veterinarian || vaccinationData.veterinarian
    };
    
    return vaccination;
  } catch (error) {
    console.error('Error updating vaccination:', error);
    throw error;
  }
};

// Delete a vaccination
export const deleteVaccination = async (petId: string, vaccinationId: string): Promise<boolean> => {
  try {
    console.log('Deleting vaccination ID:', vaccinationId, 'for pet:', petId); // Debug log
    
    const response = await apiClient.delete(`/pets/${petId}/medical-records/vaccinations/${vaccinationId}`);
    
    if (response.error) {
      console.error('Error deleting vaccination:', response.error);
      return false;
    }
    
    console.log('Delete vaccination response:', response); // Debug log
    
    return true;
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    return false;
  }
}; 