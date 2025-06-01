import { Allergy, AllergyForm, Appointment, AppointmentForm, Medication, MedicationForm, Treatment, TreatmentForm, Vaccination, VaccinationForm, WeightRecord, WeightRecordForm } from '../components/medical/types';
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

// Get all medications for a pet
export const getMedications = async (petId: string): Promise<Medication[]> => {
  try {
    const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/medications`);
    
    if (response.error) {
      console.error('Error getting medications:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Raw medication response:', response.data); // Debug log
    
    // Transform the response based on actual API structure
    const medications = (response.data || []).map(item => {
      console.log('Processing medication item:', item); // Debug log
      
      const medication = {
        id: item.id?.toString() || String(Math.random()),
        name: item.medicationName || 'Bilinmeyen İlaç',
        dosage: item.dosage || 'Belirtilmemiş',
        frequency: item.frequency || 'Belirtilmemiş',
        startDate: item.startDate || '',
        endDate: item.endDate || null,
        prescribedBy: item.prescribedBy || 'Belirtilmemiş',
        notes: item.notes || ''
      };
      
      console.log('Transformed medication:', medication); // Debug log
      return medication;
    });
    
    console.log('All transformed medications:', medications); // Debug log
    
    return medications;
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

// Add a new medication
export const addMedication = async (petId: string, medicationData: MedicationForm): Promise<Medication> => {
  try {
    console.log('Adding medication for petId:', petId, 'data:', medicationData); // Debug log
    
    // Payload matches the API expectations
    const payload = {
      medicationName: medicationData.medicationName,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      startDate: medicationData.startDate,
      endDate: medicationData.endDate,
      prescribedBy: medicationData.prescribedBy,
      notes: medicationData.notes
    };
    
    console.log('Medication payload:', payload); // Debug log
    
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/medications`, payload);
    
    if (response.error) {
      console.error('Error adding medication:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Add medication response:', response.data); // Debug log
    
    // Transform response to our format
    const medication: Medication = {
      id: response.data?.id?.toString() || String(Math.random()),
      name: response.data?.medicationName || medicationData.medicationName,
      dosage: response.data?.dosage || medicationData.dosage,
      frequency: response.data?.frequency || medicationData.frequency,
      startDate: response.data?.startDate || medicationData.startDate,
      endDate: response.data?.endDate || medicationData.endDate,
      prescribedBy: response.data?.prescribedBy || medicationData.prescribedBy,
      notes: response.data?.notes || medicationData.notes
    };
    
    return medication;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

// Update an existing medication
export const updateMedication = async (petId: string, medicationId: string, medicationData: MedicationForm): Promise<Medication> => {
  try {
    const payload = {
      medicationName: medicationData.medicationName,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      startDate: medicationData.startDate,
      endDate: medicationData.endDate,
      prescribedBy: medicationData.prescribedBy,
      notes: medicationData.notes
    };
    
    console.log('Update medication payload:', payload, 'for ID:', medicationId); // Debug log
    
    const response = await apiClient.put<any>(`/pets/${petId}/medical-records/medications/${medicationId}`, payload);
    
    if (response.error) {
      console.error('Error updating medication:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Update medication response:', response.data); // Debug log
    
    // Transform response to our format
    const medication: Medication = {
      id: medicationId,
      name: response.data?.medicationName || medicationData.medicationName,
      dosage: response.data?.dosage || medicationData.dosage,
      frequency: response.data?.frequency || medicationData.frequency,
      startDate: response.data?.startDate || medicationData.startDate,
      endDate: response.data?.endDate || medicationData.endDate,
      prescribedBy: response.data?.prescribedBy || medicationData.prescribedBy,
      notes: response.data?.notes || medicationData.notes
    };
    
    return medication;
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

// Delete a medication
export const deleteMedication = async (petId: string, medicationId: string): Promise<boolean> => {
  try {
    console.log('Deleting medication ID:', medicationId, 'for pet:', petId); // Debug log
    
    const response = await apiClient.delete(`/pets/${petId}/medical-records/medications/${medicationId}`);
    
    if (response.error) {
      console.error('Error deleting medication:', response.error);
      return false;
    }
    
    console.log('Delete medication response:', response); // Debug log
    
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    return false;
  }
};

// Get all allergies for a pet
export const getAllergies = async (petId: string): Promise<Allergy[]> => {
  try {
    const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/allergies`);
    
    if (response.error) {
      console.error('Error getting allergies:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Raw allergy response:', response.data); // Debug log
    
    // Transform the response based on actual API structure
    const allergies = (response.data || []).map(item => {
      console.log('Processing allergy item:', item); // Debug log
      
      const allergy = {
        id: item.id?.toString() || String(Math.random()),
        allergen: item.allergen || 'Bilinmeyen Alerjen',
        reaction: item.reaction || 'Belirtilmemiş',
        severity: item.severity || 'Bilinmeyen',
        notes: item.notes || ''
      };
      
      console.log('Transformed allergy:', allergy); // Debug log
      return allergy;
    });
    
    console.log('All transformed allergies:', allergies); // Debug log
    
    return allergies;
  } catch (error) {
    console.error('Error getting allergies:', error);
    return [];
  }
};

// Add a new allergy
export const addAllergy = async (petId: string, allergyData: AllergyForm): Promise<Allergy> => {
  try {
    console.log('Adding allergy for petId:', petId, 'data:', allergyData); // Debug log
    
    // Payload matches the API expectations
    const payload = {
      allergen: allergyData.allergen,
      reaction: allergyData.reaction,
      severity: allergyData.severity,
      notes: allergyData.notes
    };
    
    console.log('Allergy payload:', payload); // Debug log
    
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/allergies`, payload);
    
    if (response.error) {
      console.error('Error adding allergy:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Add allergy response:', response.data); // Debug log
    
    // Transform response to our format
    const allergy: Allergy = {
      id: response.data?.id?.toString() || String(Math.random()),
      allergen: response.data?.allergen || allergyData.allergen,
      reaction: response.data?.reaction || allergyData.reaction,
      severity: response.data?.severity || allergyData.severity,
      notes: response.data?.notes || allergyData.notes
    };
    
    return allergy;
  } catch (error) {
    console.error('Error adding allergy:', error);
    throw error;
  }
};

// Update an existing allergy
export const updateAllergy = async (petId: string, allergyId: string, allergyData: AllergyForm): Promise<Allergy> => {
  try {
    const payload = {
      allergen: allergyData.allergen,
      reaction: allergyData.reaction,
      severity: allergyData.severity,
      notes: allergyData.notes
    };
    
    console.log('Update allergy payload:', payload, 'for ID:', allergyId); // Debug log
    
    const response = await apiClient.put<any>(`/pets/${petId}/medical-records/allergies/${allergyId}`, payload);
    
    if (response.error) {
      console.error('Error updating allergy:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Update allergy response:', response.data); // Debug log
    
    // Transform response to our format
    const allergy: Allergy = {
      id: allergyId,
      allergen: response.data?.allergen || allergyData.allergen,
      reaction: response.data?.reaction || allergyData.reaction,
      severity: response.data?.severity || allergyData.severity,
      notes: response.data?.notes || allergyData.notes
    };
    
    return allergy;
  } catch (error) {
    console.error('Error updating allergy:', error);
    throw error;
  }
};

// Delete an allergy
export const deleteAllergy = async (petId: string, allergyId: string): Promise<boolean> => {
  try {
    console.log('Deleting allergy ID:', allergyId, 'for pet:', petId); // Debug log
    
    const response = await apiClient.delete(`/pets/${petId}/medical-records/allergies/${allergyId}`);
    
    if (response.error) {
      console.error('Error deleting allergy:', response.error);
      return false;
    }
    
    console.log('Delete allergy response:', response); // Debug log
    
    return true;
  } catch (error) {
    console.error('Error deleting allergy:', error);
    return false;
  }
};

// Get all weight records for a pet
export const getWeightRecords = async (petId: string): Promise<WeightRecord[]> => {
  try {
    const response = await apiClient.get<any[]>(`/pets/${petId}/medical-records/weight-records`);
    
    if (response.error) {
      console.error('Error getting weight records:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Raw weight record response:', response.data); // Debug log
    
    // Transform the response based on actual API structure
    const weightRecords = (response.data || []).map(item => {
      console.log('Processing weight record item:', item); // Debug log
      
      const weightRecord = {
        id: item.id?.toString() || String(Math.random()),
        weight: parseFloat(item.weight) || 0,
        unit: (item.unit || 'kg').toLowerCase() as 'kg' | 'lb',
        date: item.recordDate || new Date().toISOString().split('T')[0],
        notes: item.notes || ''
      };
      
      console.log('Transformed weight record:', weightRecord); // Debug log
      return weightRecord;
    });
    
    // Sort by date (oldest to newest)
    weightRecords.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    console.log('All transformed weight records:', weightRecords); // Debug log
    
    return weightRecords;
  } catch (error) {
    console.error('Error getting weight records:', error);
    return [];
  }
};

// Add a new weight record
export const addWeightRecord = async (petId: string, weightRecordData: WeightRecordForm): Promise<WeightRecord> => {
  try {
    console.log('Adding weight record for petId:', petId, 'data:', weightRecordData); // Debug log
    
    // Payload matches the API expectations
    const payload = {
      weight: weightRecordData.weight,
      unit: weightRecordData.unit,
      recordDate: weightRecordData.recordDate,
      notes: weightRecordData.notes
    };
    
    console.log('Weight record payload:', payload); // Debug log
    
    const response = await apiClient.post<any>(`/pets/${petId}/medical-records/weight-records`, payload);
    
    if (response.error) {
      console.error('Error adding weight record:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Add weight record response:', response.data); // Debug log
    
    // Transform response to our format
    const weightRecord: WeightRecord = {
      id: response.data?.id?.toString() || String(Math.random()),
      weight: response.data?.weight || weightRecordData.weight,
      unit: (response.data?.unit || weightRecordData.unit).toLowerCase() as 'kg' | 'lb',
      date: response.data?.recordDate || weightRecordData.recordDate,
      notes: response.data?.notes || weightRecordData.notes
    };
    
    return weightRecord;
  } catch (error) {
    console.error('Error adding weight record:', error);
    throw error;
  }
};

// Update an existing weight record
export const updateWeightRecord = async (petId: string, weightRecordId: string, weightRecordData: WeightRecordForm): Promise<WeightRecord> => {
  try {
    const payload = {
      weight: weightRecordData.weight,
      unit: weightRecordData.unit,
      recordDate: weightRecordData.recordDate,
      notes: weightRecordData.notes
    };
    
    console.log('Update weight record payload:', payload, 'for ID:', weightRecordId); // Debug log
    
    const response = await apiClient.put<any>(`/pets/${petId}/medical-records/weight-records/${weightRecordId}`, payload);
    
    if (response.error) {
      console.error('Error updating weight record:', response.error);
      throw new Error(response.error);
    }
    
    console.log('Update weight record response:', response.data); // Debug log
    
    // Transform response to our format
    const weightRecord: WeightRecord = {
      id: weightRecordId,
      weight: response.data?.weight || weightRecordData.weight,
      unit: (response.data?.unit || weightRecordData.unit).toLowerCase() as 'kg' | 'lb',
      date: response.data?.recordDate || weightRecordData.recordDate,
      notes: response.data?.notes || weightRecordData.notes
    };
    
    return weightRecord;
  } catch (error) {
    console.error('Error updating weight record:', error);
    throw error;
  }
};

// Delete a weight record
export const deleteWeightRecord = async (petId: string, weightRecordId: string): Promise<boolean> => {
  try {
    console.log('Deleting weight record ID:', weightRecordId, 'for pet:', petId); // Debug log
    
    const response = await apiClient.delete(`/pets/${petId}/medical-records/weight-records/${weightRecordId}`);
    
    if (response.error) {
      console.error('Error deleting weight record:', response.error);
      return false;
    }
    
    console.log('Delete weight record response:', response); // Debug log
    
    return true;
  } catch (error) {
    console.error('Error deleting weight record:', error);
    return false;
  }
}; 