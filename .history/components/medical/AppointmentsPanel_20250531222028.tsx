import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    addAppointment,
    deleteAppointment,
    getAppointments,
    updateAppointment
} from '../../services/medicalRecordService';
import { Appointment } from './types';

interface AppointmentsPanelProps {
  petId: string | null;
}

export const AppointmentsPanel: React.FC<AppointmentsPanelProps> = ({ petId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [reason, setReason] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Custom date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState('01');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [selectedYear, setSelectedYear] = useState('2024');
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Generate arrays for date and time selection
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    {label: 'Ocak', value: '01'}, {label: 'Şubat', value: '02'}, {label: 'Mart', value: '03'},
    {label: 'Nisan', value: '04'}, {label: 'Mayıs', value: '05'}, {label: 'Haziran', value: '06'},
    {label: 'Temmuz', value: '07'}, {label: 'Ağustos', value: '08'}, {label: 'Eylül', value: '09'},
    {label: 'Ekim', value: '10'}, {label: 'Kasım', value: '11'}, {label: 'Aralık', value: '12'}
  ];
  const years = Array.from({length: 10}, (_, i) => (2020 + i).toString());
  const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({length: 12}, (_, i) => (i * 5).toString().padStart(2, '0'));

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    if (!petId) {
      setIsLoading(false);
      setAppointments([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching appointments for pet:', petId);
      const response = await getAppointments(petId);
      console.log('Fetched appointments:', response);
      
      // Transform API data to match our component's Appointment type
      const transformedAppointments: Appointment[] = response.map((item: any) => {
        const appointmentDateTime = new Date(item.appointmentDate || item.date);
        
        return {
          id: item.id.toString(),
          date: appointmentDateTime.toISOString(),
          reason: item.reason,
          veterinarian: item.veterinarian,
          notes: item.notes || ''
        };
      });
      
      setAppointments(transformedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]);
      setError('Randevu kayıtları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [petId, refreshCounter]);

  const resetForm = () => {
    setReason('');
    setAppointmentDate('');
    setAppointmentTime('');
    setVeterinarian('');
    setNotes('');
    setEditingAppointment(null);
    setError(null);
    
    // Reset date picker to current date
    const today = new Date();
    setSelectedDay(today.getDate().toString().padStart(2, '0'));
    setSelectedMonth((today.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(today.getFullYear().toString());
    setSelectedHour('09');
    setSelectedMinute('00');
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openDatePicker = () => {
    // Parse current date if exists
    if (appointmentDate) {
      const parts = appointmentDate.split('-');
      if (parts.length === 3) {
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedDay(parts[2]);
      }
    }
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    const formattedDate = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    setAppointmentDate(formattedDate);
    setShowDatePicker(false);
  };

  const openTimePicker = () => {
    // Parse current time if exists
    if (appointmentTime) {
      const parts = appointmentTime.split(':');
      if (parts.length >= 2) {
        setSelectedHour(parts[0]);
        setSelectedMinute(parts[1]);
      }
    }
    setShowTimePicker(true);
  };

  const confirmTimeSelection = () => {
    const formattedTime = `${selectedHour}:${selectedMinute}`;
    setAppointmentTime(formattedTime);
    setShowTimePicker(false);
  };

  const validateForm = () => {
    if (!reason.trim()) {
      setError('Randevu sebebi zorunludur');
      return false;
    }
    if (!appointmentDate.trim()) {
      setError('Randevu tarihi zorunludur');
      return false;
    }
    if (!appointmentTime.trim()) {
      setError('Randevu saati zorunludur');
      return false;
    }
    if (!veterinarian.trim()) {
      setError('Veteriner adı zorunludur');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!petId) {
      setError('Pet ID eksik');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Combine date and time into a single ISO string
      const dateTimeString = `${appointmentDate}T${appointmentTime}:00`;
      
      const appointmentData = {
        appointmentDate: dateTimeString,
        reason: reason.trim(),
        veterinarian: veterinarian.trim(),
        notes: notes.trim()
      };
      
      console.log('Submitting appointment:', appointmentData);
      
      if (editingAppointment) {
        console.log('Updating appointment with ID:', editingAppointment.id);
        const updated = await updateAppointment(editingAppointment.id, appointmentData);
        console.log('Updated appointment:', updated);
        
        // Update the appointment in the list
        setAppointments(appointments.map(apt => 
          apt.id === editingAppointment.id 
            ? { ...apt, ...appointmentData, date: dateTimeString }
            : apt
        ));
      } else {
        const newAppointment = await addAppointment(petId, appointmentData);
        console.log('New appointment created:', newAppointment);
        
        // Transform the API response to match our component's Appointment type
        const appointmentDateTime = new Date(newAppointment.appointmentDate);
        const transformedAppointment: Appointment = {
          id: newAppointment.id.toString(),
          date: appointmentDateTime.toISOString(),
          reason: newAppointment.reason,
          veterinarian: newAppointment.veterinarian,
          notes: newAppointment.notes || ''
        };
        
        setAppointments([...appointments, transformedAppointment]);
      }
      
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setError('Randevu kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    console.log('Editing appointment:', appointment);
    
    const appointmentDate = new Date(appointment.date);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    const timeStr = appointmentDate.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    setReason(appointment.reason);
    setAppointmentDate(dateStr);
    setAppointmentTime(timeStr);
    setVeterinarian(appointment.veterinarian);
    setNotes(appointment.notes);
    setEditingAppointment(appointment);
    setShowModal(true);
  };

  const handleDelete = async (appointmentId: string) => {
    Alert.alert(
      'Randevuyu Sil',
      'Bu randevuyu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting appointment with ID:', appointmentId);
              await deleteAppointment(appointmentId);
              setAppointments(appointments.filter(apt => apt.id !== appointmentId));
              setRefreshCounter(prev => prev + 1);
            } catch (err) {
              console.error('Error deleting appointment:', err);
              setError('Randevu silinemedi. Lütfen tekrar deneyin.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const isPastAppointment = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const now = new Date();
    return appointmentDate < now;
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const isPast = isPastAppointment(appointment.date);
    
    return (
      <View 
        key={appointment.id} 
        style={[styles.appointmentCard, isPast && styles.pastAppointmentCard]}
      >
        <View style={styles.cardMainHeader}>
          <View style={styles.appointmentMainInfo}>
            <Text style={[styles.appointmentReasonLarge, isPast && styles.pastText]}>
              {appointment.reason}
            </Text>
            <Text style={[styles.appointmentDateLarge, isPast && styles.pastDateText]}>
              {formatDate(appointment.date)} - {formatTime(appointment.date)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(appointment)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(appointment.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👨‍⚕️</Text>
            <Text style={styles.infoLabel}>Veteriner:</Text>
            <Text style={[styles.infoValue, isPast && styles.pastText]}>
              {appointment.veterinarian}
            </Text>
          </View>
          {appointment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📝</Text>
              <Text style={styles.infoLabel}>Notlar:</Text>
              <Text style={[styles.infoValue, isPast && styles.pastText]}>
                {appointment.notes}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Separate appointments into upcoming and past
  const upcomingAppointments = appointments.filter(appointment => !isPastAppointment(appointment.date));
  const pastAppointments = appointments.filter(appointment => isPastAppointment(appointment.date));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Randevu Kayıtları</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Randevu Ekle</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={() => setError(null)}
            style={styles.errorCloseButton}
          >
            <Text style={styles.errorCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AB75C2" />
          <Text style={styles.loadingText}>Randevu kayıtları yükleniyor...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Henüz randevu kaydı yok</Text>
          <Text style={styles.emptyText}>İlk randevu kaydınızı ekleyin</Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={openAddModal}
          >
            <Text style={styles.emptyAddButtonText}>+ İlk Randevuyu Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
              {upcomingAppointments.map(renderAppointmentCard)}
            </View>
          )}
          
          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Geçmiş Randevular</Text>
              {pastAppointments.map(renderAppointmentCard)}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAppointment ? 'Randevu Kaydını Düzenle' : 'Yeni Randevu Ekle'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Randevu Sebebi *</Text>
                <TextInput
                  style={styles.textInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Örn: Genel kontrol, Aşı, Tedavi..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Randevu Tarihi *</Text>
                <TouchableOpacity
                  onPress={openDatePicker}
                  style={styles.datePickerButton}
                >
                  <Text style={[styles.datePickerButtonText, {color: appointmentDate ? '#1f2937' : '#9CA3AF'}]}>
                    {appointmentDate ? formatDate(appointmentDate) : 'Tarih seçin'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Randevu Saati *</Text>
                <TouchableOpacity
                  onPress={openTimePicker}
                  style={styles.datePickerButton}
                >
                  <Text style={[styles.datePickerButtonText, {color: appointmentTime ? '#1f2937' : '#9CA3AF'}]}>
                    {appointmentTime || 'Saat seçin'}
                  </Text>
                  <Text style={styles.datePickerIcon}>🕐</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Veteriner *</Text>
                <TextInput
                  style={styles.textInput}
                  value={veterinarian}
                  onChangeText={setVeterinarian}
                  placeholder="Veteriner adını girin"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notlar</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ek notlar (isteğe bağlı)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                >
                  <Text style={styles.saveButtonText}>
                    {isSubmitting ? 'Kaydediliyor...' : (editingAppointment ? 'Güncelle' : 'Kaydet')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Tarih Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Gün</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {days.map(day => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                      >
                        <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Ay</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {months.map(month => (
                      <TouchableOpacity
                        key={month.value}
                        onPress={() => setSelectedMonth(month.value)}
                        style={[styles.pickerItem, selectedMonth === month.value && styles.pickerItemSelected]}
                      >
                        <Text style={[styles.pickerItemText, selectedMonth === month.value && styles.pickerItemTextSelected]}>
                          {month.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Yıl</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {years.map(year => (
                      <TouchableOpacity
                        key={year}
                        onPress={() => setSelectedYear(year)}
                        style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                      >
                        <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <View style={styles.datePickerPreview}>
                <Text style={styles.datePickerPreviewText}>
                  Seçilen Tarih: {formatDate(`${selectedYear}-${selectedMonth}-${selectedDay}`)}
                </Text>
              </View>
              
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.datePickerCancelButton}
                >
                  <Text style={styles.datePickerCancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDateSelection}
                  style={styles.datePickerConfirmButton}
                >
                  <Text style={styles.datePickerConfirmButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Saat Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Saat</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {hours.map(hour => (
                      <TouchableOpacity
                        key={hour}
                        onPress={() => setSelectedHour(hour)}
                        style={[styles.pickerItem, selectedHour === hour && styles.pickerItemSelected]}
                      >
                        <Text style={[styles.pickerItemText, selectedHour === hour && styles.pickerItemTextSelected]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Dakika</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {minutes.map(minute => (
                      <TouchableOpacity
                        key={minute}
                        onPress={() => setSelectedMinute(minute)}
                        style={[styles.pickerItem, selectedMinute === minute && styles.pickerItemSelected]}
                      >
                        <Text style={[styles.pickerItemText, selectedMinute === minute && styles.pickerItemTextSelected]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <View style={styles.datePickerPreview}>
                <Text style={styles.datePickerPreviewText}>
                  Seçilen Saat: {selectedHour}:{selectedMinute}
                </Text>
              </View>
              
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  style={styles.datePickerCancelButton}
                >
                  <Text style={styles.datePickerCancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmTimeSelection}
                  style={styles.datePickerConfirmButton}
                >
                  <Text style={styles.datePickerConfirmButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#8B5A96',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorCloseButton: {
    padding: 4,
  },
  errorCloseText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: 'bold',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  emptyAddButton: {
    backgroundColor: '#E6D3F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddButtonText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  appointmentsList: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 4,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#8B5A96',
  },
  pastAppointmentCard: {
    backgroundColor: '#f9fafb',
    borderLeftColor: '#9ca3af',
  },
  cardMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  appointmentMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  appointmentReasonLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  appointmentDateLarge: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '700',
    backgroundColor: '#E6D3F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pastText: {
    color: '#6b7280',
  },
  pastDateText: {
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  cardContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#E6D3F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#6B46C1',
    fontWeight: '700',
    fontSize: 14,
  },
  datePickerButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
  },
  datePickerIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 120,
    width: '100%',
  },
  pickerItem: {
    padding: 12,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#8B5A96',
    borderColor: '#8B5A96',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  datePickerPreview: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  datePickerPreviewText: {
    fontSize: 16,
    color: '#15803d',
    fontWeight: '600',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  datePickerCancelButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  datePickerCancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  datePickerConfirmButton: {
    backgroundColor: '#E6D3F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  datePickerConfirmButtonText: {
    color: '#6B46C1',
    fontWeight: '700',
    fontSize: 14,
  },
}); 