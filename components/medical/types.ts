export interface Vaccination {
  id: string;
  name: string;
  date: string;
  veterinarian: string;
}

export interface VaccinationForm {
  vaccineName: string;
  vaccinationDate: string;
  veterinarian: string;
}

export interface Appointment {
  id: string;
  date: string;
  reason: string;
  veterinarian: string;
  notes: string;
}

export interface AppointmentForm {
  appointmentDate: string;
  reason: string;
  veterinarian: string;
  notes: string;
}

export interface Treatment {
  id: string;
  type: string;
  description: string;
  date: string;
  veterinarian: string;
}

export interface TreatmentForm {
  treatmentType: string;
  description: string;
  treatmentDate: string;
  veterinarian: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  prescribedBy: string;
  notes: string;
}

export interface MedicationForm {
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  prescribedBy: string;
  notes: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: string;
  notes: string;
}

export interface AllergyForm {
  allergen: string;
  reaction: string;
  severity: string;
  notes: string;
}

export interface WeightRecord {
  id: string;
  weight: number;
  unit: 'kg' | 'lb';
  date: string;
  notes: string;
}

export interface WeightRecordForm {
  weight: number;
  unit: string;
  recordDate: string;
  notes: string;
} 