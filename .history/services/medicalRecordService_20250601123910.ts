import { Appointment, AppointmentForm, Vaccination, VaccinationForm } from '../components/medical/types';
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

// Get all appointments for a pet
export const getAppointments = async (petId: string): Promise<Appointment[]> => {
  try {
    const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/appointments`);
    
    if (response.error) {
      console.error('Error getting appointments:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Raw appointment response:', response.data); // Debug log
    
    // Transform the response based on actual API structure
    const appointments = (response.data || []).map(item => {
      console.log('Processing appointment item:', item); // Debug log
      
      const appointment = {
        id: item.id?.toString() || String(Math.random()),
        date: item.appointmentDate || '',
        reason: item.reason || 'Belirtilmemiş',
        veterinarian: item.veterinarian || 'Belirtilmemiş',
        notes: item.notes || ''
      };
      
      console.log('Transformed appointment:', appointment); // Debug log
      return appointment;
    });
    
    console.log('All transformed appointments:', appointments); // Debug log
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
};

// Add a new appointment
export const addAppointment = async (petId: string, appointmentData: AppointmentForm): Promise<any> => {
  try {
    console.log('Adding appointment for petId:', petId, 'data:', appointmentData); // Debug log
    
    // Payload matches the API expectations
    const payload = {
      appointmentDate: appointmentData.appointmentDate,
      reason: appointmentData.reason,
      veterinarian: appointmentData.veterinarian,
      notes: appointmentData.notes
    };
    
    console.log('Appointment payload:', payload); // Debug log
    
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/appointments`, payload);
    
    if (response.error) {
      console.error('Error adding appointment:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Add appointment response:', response.data); // Debug log
    
    // Return the raw response so component can handle transformation
    return response.data;
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

// Update an existing appointment
export const updateAppointment = async (appointmentId: string, appointmentData: AppointmentForm): Promise<Appointment> => {
  try {
    const payload = {
      appointmentDate: appointmentData.appointmentDate,
      reason: appointmentData.reason,
      veterinarian: appointmentData.veterinarian,
      notes: appointmentData.notes
    };
    
    console.log('Update appointment payload:', payload, 'for ID:', appointmentId); // Debug log
    
    const response = await apiClient.put<any>(`/medical-records/appointments/${appointmentId}`, payload);
    
    if (response.error) {
      console.error('Error updating appointment:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Update appointment response:', response.data); // Debug log
    
    // Transform response to our format
    const appointment: Appointment = {
      id: appointmentId,
      date: response.data?.appointmentDate || appointmentData.appointmentDate,
      reason: response.data?.reason || appointmentData.reason,
      veterinarian: response.data?.veterinarian || appointmentData.veterinarian,
      notes: response.data?.notes || appointmentData.notes
    };
    
    return appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Delete an appointment
export const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
  try {
    console.log('Deleting appointment ID:', appointmentId); // Debug log
    
    const response = await apiClient.delete(`/medical-records/appointments/${appointmentId}`);
    
    if (response.error) {
      console.error('Error deleting appointment:', response.error);
      return false;
    }
    
    console.log('Delete appointment response:', response); // Debug log
    
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
};

// Get all treatments for a pet
export const getTreatments = async (petId: string): Promise<Treatment[]> => {
  try {
    const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/treatments`);
    
    if (response.error) {
      console.error('Error getting treatments:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Raw treatment response:', response.data); // Debug log
    
    // Transform the response based on actual API structure
    const treatments = (response.data || []).map(item => {
      console.log('Processing treatment item:', item); // Debug log
      
      const treatment = {
        id: item.id?.toString() || String(Math.random()),
        type: item.treatmentType || 'Belirtilmemiş',
        description: item.description || '',
        date: item.treatmentDate || '',
        veterinarian: item.veterinarian || 'Belirtilmemiş'
      };
      
      console.log('Transformed treatment:', treatment); // Debug log
      return treatment;
    });
    
    console.log('All transformed treatments:', treatments); // Debug log
    
    return treatments;
  } catch (error) {
    console.error('Error getting treatments:', error);
    return [];
  }
};

// Add a new treatment
export const addTreatment = async (petId: string, treatmentData: TreatmentForm): Promise<Treatment> => {
  try {
    console.log('Adding treatment for petId:', petId, 'data:', treatmentData); // Debug log
    
    // Payload matches the API expectations
    const payload = {
      treatmentType: treatmentData.treatmentType,
      description: treatmentData.description,
      treatmentDate: treatmentData.treatmentDate,
      veterinarian: treatmentData.veterinarian
    };
    
    console.log('Treatment payload:', payload); // Debug log
    
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/treatments`, payload);
    
    if (response.error) {
      console.error('Error adding treatment:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Add treatment response:', response.data); // Debug log
    
    // Transform response to our format
    const treatment: Treatment = {
      id: response.data?.id?.toString() || String(Math.random()),
      type: response.data?.treatmentType || treatmentData.treatmentType,
      description: response.data?.description || treatmentData.description,
      date: response.data?.treatmentDate || treatmentData.treatmentDate,
      veterinarian: response.data?.veterinarian || treatmentData.veterinarian
    };
    
    return treatment;
  } catch (error) {
    console.error('Error adding treatment:', error);
    throw error;
  }
};

// Update an existing treatment
export const updateTreatment = async (petId: string, treatmentId: string, treatmentData: TreatmentForm): Promise<Treatment> => {
  try {
    const payload = {
      treatmentType: treatmentData.treatmentType,
      description: treatmentData.description,
      treatmentDate: treatmentData.treatmentDate,
      veterinarian: treatmentData.veterinarian
    };
    
    console.log('Update treatment payload:', payload, 'for ID:', treatmentId); // Debug log
    
    const response = await apiClient.put<any>(`/pets/${petId}/medical-records/treatments/${treatmentId}`, payload);
    
    if (response.error) {
      console.error('Error updating treatment:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Update treatment response:', response.data); // Debug log
    
    // Transform response to our format
    const treatment: Treatment = {
      id: treatmentId,
      type: response.data?.treatmentType || treatmentData.treatmentType,
      description: response.data?.description || treatmentData.description,
      date: response.data?.treatmentDate || treatmentData.treatmentDate,
      veterinarian: response.data?.veterinarian || treatmentData.veterinarian
    };
    
    return treatment;
  } catch (error) {
    console.error('Error updating treatment:', error);
    throw error;
  }
};

// Delete a treatment
export const deleteTreatment = async (petId: string, treatmentId: string): Promise<boolean> => {
  try {
    console.log('Deleting treatment ID:', treatmentId, 'for pet:', petId); // Debug log
    
    const response = await apiClient.delete(`/pets/${petId}/medical-records/treatments/${treatmentId}`);
    
    if (response.error) {
      console.error('Error deleting treatment:', response.error);
      return false;
    }
    
    console.log('Delete treatment response:', response); // Debug log
    
    return true;
  } catch (error) {
    console.error('Error deleting treatment:', error);
    return false;
  }
}; 