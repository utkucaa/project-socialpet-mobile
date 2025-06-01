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
  
  // Date and time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

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
    
    // Reset to today's date and 9 AM but don't auto-select
    const today = new Date();
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setSelectedDate(today);
    setSelectedTime(defaultTime);
    
    // Don't set default display values - let user select
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '📅 Tarih seçin';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '📅 Tarih seçin';
    }
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '🕘 Saat seçin';
    return `🕘 ${timeStr}`;
  };

  const validateForm = () => {
    console.log('🔍 Validating form...');
    console.log('Reason:', `"${reason}"`);
    console.log('Date:', `"${appointmentDate}"`);
    console.log('Time:', `"${appointmentTime}"`);
    console.log('Veterinarian:', `"${veterinarian}"`);
    
    if (!reason.trim()) {
      console.log('❌ Reason validation failed');
      setError('Randevu sebebi zorunludur');
      return false;
    }
    console.log('✅ Reason validation passed');
    
    if (!appointmentDate.trim()) {
      console.log('❌ Date validation failed - empty');
      setError('Randevu tarihi zorunludur (YYYY-MM-DD formatında)');
      return false;
    }
    console.log('✅ Date not empty');
    
    if (!appointmentTime.trim()) {
      console.log('❌ Time validation failed - empty');
      setError('Randevu saati zorunludur (HH:MM formatında)');
      return false;
    }
    console.log('✅ Time not empty');
    
    if (!veterinarian.trim()) {
      console.log('❌ Veterinarian validation failed');
      setError('Veteriner adı zorunludur');
      return false;
    }
    console.log('✅ Veterinarian validation passed');
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointmentDate)) {
      console.log('❌ Date format validation failed. Expected: YYYY-MM-DD, Got:', appointmentDate);
      setError('Lütfen tarihi YYYY-MM-DD formatında girin (örn: 2024-12-25)');
      return false;
    }
    console.log('✅ Date format validation passed');
    
    // Validate time format  
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(appointmentTime)) {
      console.log('❌ Time format validation failed. Expected: HH:MM, Got:', appointmentTime);
      setError('Lütfen saati HH:MM formatında girin (örn: 14:30)');
      return false;
    }
    console.log('✅ Time format validation passed');
    
    console.log('🎉 All validations passed!');
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔵 HandleSubmit called');
    console.log('Pet ID:', petId);
    console.log('Form data:', { reason, appointmentDate, appointmentTime, veterinarian, notes });

    if (!petId) {
      setError('Pet ID eksik');
      return;
    }
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validation passed');
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Combine date and time into a single ISO string
      const dateTimeString = `${appointmentDate}T${appointmentTime}:00`;
      console.log('📅 DateTime string:', dateTimeString);
      
      const appointmentData = {
        appointmentDate: dateTimeString,
        reason: reason.trim(),
        veterinarian: veterinarian.trim(),
        notes: notes.trim()
      };
      
      console.log('📝 Submitting appointment:', appointmentData);
      
      if (editingAppointment) {
        console.log('✏️ Updating appointment with ID:', editingAppointment.id);
        try {
          const updated = await updateAppointment(editingAppointment.id, appointmentData);
          console.log('✅ Updated appointment:', updated);
          
          // Update the appointment in the list
          setAppointments(appointments.map(apt => 
            apt.id === editingAppointment.id 
              ? { ...apt, reason: appointmentData.reason, veterinarian: appointmentData.veterinarian, notes: appointmentData.notes, date: dateTimeString }
              : apt
          ));
        } catch (updateError) {
          console.log('⚠️ Backend update failed, updating locally:', updateError);
          // Update locally even if backend fails
          setAppointments(appointments.map(apt => 
            apt.id === editingAppointment.id 
              ? { ...apt, reason: appointmentData.reason, veterinarian: appointmentData.veterinarian, notes: appointmentData.notes, date: dateTimeString }
              : apt
          ));
        }
      } else {
        console.log('➕ Adding new appointment');
        try {
          const newAppointment = await addAppointment(petId, appointmentData);
          console.log('✅ New appointment created:', newAppointment);
          
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
        } catch (addError) {
          console.log('⚠️ Backend add failed, adding locally:', addError);
          // Create a temporary appointment locally even if backend fails
          const tempId = `temp-${Date.now()}`;
          const tempAppointment: Appointment = {
            id: tempId,
            date: dateTimeString,
            reason: appointmentData.reason,
            veterinarian: appointmentData.veterinarian,
            notes: appointmentData.notes
          };
          
          console.log('🔧 Created temp appointment:', tempAppointment);
          setAppointments([...appointments, tempAppointment]);
        }
      }
      
      console.log('🎉 Appointment operation completed');
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('💥 Error submitting appointment:', err);
      setError('Randevu kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 HandleSubmit finished');
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
    
    // Set the selected date and time for pickers
    setSelectedDate(appointmentDate);
    setSelectedTime(appointmentDate);
    
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
    <>
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
                    onPress={() => {
                      console.log('Date button pressed!');
                      setShowDatePicker(true);
                    }}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {formatDisplayDate(appointmentDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Randevu Saati *</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Time button pressed!');
                      setShowTimePicker(true);
                    }}
                    style={styles.timePickerButton}
                  >
                    <Text style={styles.timePickerButtonText}>
                      {formatDisplayTime(appointmentTime)}
                    </Text>
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
      </View>
      
      <DateTimePickerModals
        showDatePicker={showDatePicker}
        showTimePicker={showTimePicker}
        setShowDatePicker={setShowDatePicker}
        setShowTimePicker={setShowTimePicker}
        appointmentDate={appointmentDate}
        appointmentTime={appointmentTime}
        setAppointmentDate={setAppointmentDate}
        setAppointmentTime={setAppointmentTime}
        setSelectedDate={setSelectedDate}
        setSelectedTime={setSelectedTime}
      />
    </>
  );
};

// Date and Time Picker Modals - OUTSIDE the main component to avoid conflicts
const DateTimePickerModals: React.FC<{
  showDatePicker: boolean;
  showTimePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  setShowTimePicker: (show: boolean) => void;
  appointmentDate: string;
  appointmentTime: string;
  setAppointmentDate: (date: string) => void;
  setAppointmentTime: (time: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: Date) => void;
}> = ({
  showDatePicker,
  showTimePicker,
  setShowDatePicker,
  setShowTimePicker,
  appointmentDate,
  appointmentTime,
  setAppointmentDate,
  setAppointmentTime,
  setSelectedDate,
  setSelectedTime,
}) => {
  return (
    <>
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Tarih Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.pickerCloseButton}
              >
                <Text style={styles.pickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateScrollContainer}>
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = appointmentDate === dateStr;
                
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      console.log('Date selected:', dateStr);
                      setAppointmentDate(dateStr);
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }}
                    style={[
                      styles.dateOption,
                      isSelected && styles.selectedDateOption
                    ]}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      isSelected && styles.selectedDateOptionText
                    ]}>
                      {date.toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Saat Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={styles.pickerCloseButton}
              >
                <Text style={styles.pickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeScrollContainer}>
              {Array.from({ length: 21 }, (_, i) => {
                const hour = Math.floor(8 + (i * 0.5));
                const minute = (i % 2) * 30;
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isSelected = appointmentTime === timeStr;
                
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      console.log('Time selected:', timeStr);
                      setAppointmentTime(timeStr);
                      const newTime = new Date();
                      newTime.setHours(hour, minute, 0, 0);
                      setSelectedTime(newTime);
                      setShowTimePicker(false);
                    }}
                    style={[
                      styles.timeOption,
                      isSelected && styles.selectedTimeOption
                    ]}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      isSelected && styles.selectedTimeOptionText
                    ]}>
                      {timeStr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: '#10B981',
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
    borderLeftColor: '#10B981',
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
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  timePickerButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
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
  pickerHeader: {
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
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickerCloseButton: {
    padding: 4,
  },
  pickerCloseText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  dateScrollContainer: {
    flex: 1,
  },
  dateOption: {
    padding: 12,
  },
  selectedDateOption: {
    backgroundColor: '#10B981',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDateOptionText: {
    color: 'white',
  },
  timeScrollContainer: {
    flex: 1,
  },
  timeOption: {
    padding: 12,
  },
  selectedTimeOption: {
    backgroundColor: '#8B5A96',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedTimeOptionText: {
    color: 'white',
  },
}); 