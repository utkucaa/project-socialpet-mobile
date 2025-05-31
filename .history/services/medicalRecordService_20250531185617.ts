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
    
    // Transform the response to match our Vaccination interface
    const vaccinations = (response.data || []).map(item => ({
      id: item.id?.toString() || String(Math.random()),
      name: item.vaccineName || item.title || '',
      date: item.vaccinationDate || item.date || '',
      veterinarian: item.veterinarian || ''
    }));
    
    return vaccinations;
  } catch (error) {
    console.error('Error getting vaccinations:', error);
    return [];
  }
};

// Add a new vaccination
export const addVaccination = async (petId: string, vaccinationData: VaccinationForm): Promise<Vaccination> => {
  try {
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/vaccinations`, {
      type: 'vaccine',
      title: vaccinationData.vaccineName,
      vaccineName: vaccinationData.vaccineName,
      vaccinationDate: vaccinationData.vaccinationDate,
      veterinarian: vaccinationData.veterinarian,
      date: vaccinationData.vaccinationDate,
      description: `${vaccinationData.vaccineName} aşısı`
    });
    
    if (response.error) {
      console.error('Error adding vaccination:', response.error);
      throw new Error(response.error);
    }
    
    // Transform response to our format
    const vaccination: Vaccination = {
      id: response.data?.id?.toString() || String(Math.random()),
      name: vaccinationData.vaccineName,
      date: vaccinationData.vaccinationDate,
      veterinarian: vaccinationData.veterinarian
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
    const response = await apiClient.put<any>(`/medical-records/${vaccinationId}`, {
      title: vaccinationData.vaccineName,
      vaccineName: vaccinationData.vaccineName,
      vaccinationDate: vaccinationData.vaccinationDate,
      veterinarian: vaccinationData.veterinarian,
      date: vaccinationData.vaccinationDate,
      description: `${vaccinationData.vaccineName} aşısı`
    });
    
    if (response.error) {
      console.error('Error updating vaccination:', response.error);
      throw new Error(response.error);
    }
    
    // Transform response to our format
    const vaccination: Vaccination = {
      id: vaccinationId,
      name: vaccinationData.vaccineName,
      date: vaccinationData.vaccinationDate,
      veterinarian: vaccinationData.veterinarian
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
    const response = await apiClient.delete(`/medical-records/${vaccinationId}`);
    
    if (response.error) {
      console.error('Error deleting vaccination:', response.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    return false;
  }
}; 