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