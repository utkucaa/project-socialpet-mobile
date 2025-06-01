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
    addTreatment,
    deleteTreatment,
    getTreatments,
    updateTreatment
} from '../../services/medicalRecordService';
import { Treatment } from './types';

interface TreatmentsPanelProps {
  petId: string | null;
}

export const TreatmentsPanel: React.FC<TreatmentsPanelProps> = ({ petId }) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [treatmentType, setTreatmentType] = useState('');
  const [description, setDescription] = useState('');
  const [treatmentDate, setTreatmentDate] = useState('');
  const [treatmentTime, setTreatmentTime] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  
  // Date and time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch treatments from backend
  const fetchTreatments = async () => {
    if (!petId) {
      setIsLoading(false);
      setTreatments([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching treatments for pet:', petId);
      const response = await getTreatments(petId);
      console.log('Fetched treatments:', response);
      
      setTreatments(response);
    } catch (err) {
      console.error('Error fetching treatments:', err);
      setTreatments([]);
      setError('Tedavi kayıtları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, [petId, refreshCounter]);

  const resetForm = () => {
    setTreatmentType('');
    setDescription('');
    setTreatmentDate('');
    setTreatmentTime('');
    setVeterinarian('');
    setEditingTreatment(null);
    setError(null);
    
    // Reset to today's date and 9 AM but don't auto-select
    const today = new Date();
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setSelectedDate(today);
    setSelectedTime(defaultTime);
  };

  const openAddModal = () => {
    console.log('⚕️ Tedavi ekleme modalı açılıyor...');
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
    console.log('🔍 Validating treatment form...');
    console.log('Type:', `"${treatmentType}"`);
    console.log('Description:', `"${description}"`);
    console.log('Date:', `"${treatmentDate}"`);
    console.log('Time:', `"${treatmentTime}"`);
    console.log('Veterinarian:', `"${veterinarian}"`);
    
    if (!treatmentType.trim()) {
      console.log('❌ Treatment type validation failed');
      setError('Tedavi türü zorunludur');
      return false;
    }
    
    if (!description.trim()) {
      console.log('❌ Description validation failed');
      setError('Tedavi açıklaması zorunludur');
      return false;
    }
    
    if (!treatmentDate.trim()) {
      console.log('❌ Date validation failed - empty');
      setError('Tedavi tarihi zorunludur');
      return false;
    }
    
    if (!treatmentTime.trim()) {
      console.log('❌ Time validation failed - empty');
      setError('Tedavi saati zorunludur');
      return false;
    }
    
    if (!veterinarian.trim()) {
      console.log('❌ Veterinarian validation failed');
      setError('Veteriner adı zorunludur');
      return false;
    }
    
    console.log('🎉 All validations passed!');
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔵 HandleSubmit called');
    console.log('Pet ID:', petId);
    console.log('Form data:', { treatmentType, description, treatmentDate, treatmentTime, veterinarian });

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
      const dateTimeString = `${treatmentDate}T${treatmentTime}:00`;
      console.log('📅 DateTime string:', dateTimeString);
      
      const treatmentData = {
        treatmentType: treatmentType.trim(),
        description: description.trim(),
        treatmentDate: dateTimeString,
        veterinarian: veterinarian.trim()
      };
      
      console.log('📝 Submitting treatment:', treatmentData);
      
      if (editingTreatment) {
        console.log('✏️ Updating treatment with ID:', editingTreatment.id);
        try {
          const updated = await updateTreatment(petId, editingTreatment.id, treatmentData);
          console.log('✅ Updated treatment:', updated);
          
          // Update the treatment in the list
          setTreatments(treatments.map(treatment => 
            treatment.id === editingTreatment.id 
              ? { ...treatment, type: treatmentData.treatmentType, description: treatmentData.description, veterinarian: treatmentData.veterinarian, date: dateTimeString }
              : treatment
          ));
        } catch (updateError) {
          console.log('⚠️ Backend update failed, updating locally:', updateError);
          // Update locally even if backend fails
          setTreatments(treatments.map(treatment => 
            treatment.id === editingTreatment.id 
              ? { ...treatment, type: treatmentData.treatmentType, description: treatmentData.description, veterinarian: treatmentData.veterinarian, date: dateTimeString }
              : treatment
          ));
        }
      } else {
        console.log('➕ Adding new treatment');
        try {
          const newTreatment = await addTreatment(petId, treatmentData);
          console.log('✅ New treatment created:', newTreatment);
          
          setTreatments([...treatments, newTreatment]);
        } catch (addError) {
          console.log('⚠️ Backend add failed, adding locally:', addError);
          // Create a temporary treatment locally even if backend fails
          const tempId = `temp-${Date.now()}`;
          const tempTreatment: Treatment = {
            id: tempId,
            type: treatmentData.treatmentType,
            description: treatmentData.description,
            date: dateTimeString,
            veterinarian: treatmentData.veterinarian
          };
          
          console.log('🔧 Created temp treatment:', tempTreatment);
          setTreatments([...treatments, tempTreatment]);
        }
      }
      
      console.log('🎉 Treatment operation completed');
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('💥 Error submitting treatment:', err);
      setError('Tedavi kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 HandleSubmit finished');
    }
  };

  const handleEdit = (treatment: Treatment) => {
    console.log('Editing treatment:', treatment);
    
    const treatmentDate = new Date(treatment.date);
    const dateStr = treatmentDate.toISOString().split('T')[0];
    const timeStr = treatmentDate.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    setTreatmentType(treatment.type);
    setDescription(treatment.description);
    setTreatmentDate(dateStr);
    setTreatmentTime(timeStr);
    setVeterinarian(treatment.veterinarian);
    
    // Set the selected date and time for pickers
    setSelectedDate(treatmentDate);
    setSelectedTime(treatmentDate);
    
    setEditingTreatment(treatment);
    setShowModal(true);
  };

  const handleDelete = async (treatmentId: string) => {
    Alert.alert(
      'Tedavi Kaydını Sil',
      'Bu tedavi kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting treatment with ID:', treatmentId);
              await deleteTreatment(petId!, treatmentId);
              setTreatments(treatments.filter(treatment => treatment.id !== treatmentId));
              setRefreshCounter(prev => prev + 1);
            } catch (err) {
              console.error('Error deleting treatment:', err);
              setError('Tedavi kaydı silinemedi. Lütfen tekrar deneyin.');
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

  const isPastTreatment = (dateString: string) => {
    const treatmentDate = new Date(dateString);
    const now = new Date();
    return treatmentDate < now;
  };

  const renderTreatmentCard = (treatment: Treatment) => {
    const isPast = isPastTreatment(treatment.date);
    
    return (
      <View 
        key={treatment.id} 
        style={[styles.treatmentCard, isPast && styles.pastTreatmentCard]}
      >
        <View style={styles.cardMainHeader}>
          <View style={styles.treatmentMainInfo}>
            <Text style={[styles.treatmentTypeLarge, isPast && styles.pastText]}>
              {treatment.type}
            </Text>
            <Text style={[styles.treatmentDateLarge, isPast && styles.pastDateText]}>
              {formatDate(treatment.date)} - {formatTime(treatment.date)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(treatment)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(treatment.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📝</Text>
            <Text style={styles.infoLabel}>Açıklama:</Text>
            <Text style={[styles.infoValue, isPast && styles.pastText]}>
              {treatment.description}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👨‍⚕️</Text>
            <Text style={styles.infoLabel}>Veteriner:</Text>
            <Text style={[styles.infoValue, isPast && styles.pastText]}>
              {treatment.veterinarian}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Separate treatments into recent and past
  const recentTreatments = treatments.filter(treatment => !isPastTreatment(treatment.date));
  const pastTreatments = treatments.filter(treatment => isPastTreatment(treatment.date));

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Tedavi Ekle</Text>
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
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Tedavi kayıtları yükleniyor...</Text>
          </View>
        ) : treatments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚕️</Text>
            <Text style={styles.emptyTitle}>Henüz tedavi kaydı yok</Text>
            <Text style={styles.emptyText}>İlk tedavi kaydınızı ekleyin</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={openAddModal}
            >
              <Text style={styles.emptyAddButtonText}>+ İlk Tedaviyi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.treatmentsList} showsVerticalScrollIndicator={false}>
            {/* Recent Treatments */}
            {recentTreatments.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Son Tedaviler</Text>
                {recentTreatments.map(renderTreatmentCard)}
              </View>
            )}
            
            {/* Past Treatments */}
            {pastTreatments.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Geçmiş Tedaviler</Text>
                {pastTreatments.map(renderTreatmentCard)}
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
                  {editingTreatment ? 'Tedavi Kaydını Düzenle' : 'Yeni Tedavi Ekle'}
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
                  <Text style={styles.label}>Tedavi Türü *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={treatmentType}
                    onChangeText={setTreatmentType}
                    placeholder="Örn: Parazit tedavisi, Diş temizliği, Cerrahi..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tedavi Açıklaması *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tedavi detaylarını açıklayın..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tedavi Tarihi *</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Date button pressed!');
                      setShowDatePicker(true);
                    }}
                    style={styles.datePickerButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {formatDisplayDate(treatmentDate)}
                    </Text>
                    <Text style={styles.datePickerIcon}>📅</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tedavi Saati *</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Time button pressed!');
                      setShowTimePicker(true);
                    }}
                    style={styles.timePickerButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timePickerButtonText}>
                      {formatDisplayTime(treatmentTime)}
                    </Text>
                    <Text style={styles.timePickerIcon}>🕐</Text>
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
                      {isSubmitting ? 'Kaydediliyor...' : (editingTreatment ? 'Güncelle' : 'Kaydet')}
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
        appointmentDate={treatmentDate}
        appointmentTime={treatmentTime}
        setAppointmentDate={setTreatmentDate}
        setAppointmentTime={setTreatmentTime}
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
              {Array.from({ length: 90 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 30 + i); // 30 days in past to 60 days in future
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
              {Array.from({ length: 24 }, (_, i) => {
                const hour = Math.floor(6 + (i * 0.5)); // 6:00 to 20:00 every 30 minutes
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#B2DFDB',
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
    color: '#00695C',
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
    backgroundColor: '#B2DFDB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddButtonText: {
    color: '#00695C',
    fontWeight: '600',
  },
  treatmentsList: {
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
  treatmentCard: {
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
  pastTreatmentCard: {
    backgroundColor: '#f9fafb',
    borderLeftColor: '#9ca3af',
  },
  cardMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  treatmentMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  treatmentTypeLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  treatmentDateLarge: {
    fontSize: 16,
    color: '#00695C',
    fontWeight: '700',
    backgroundColor: '#B2DFDB',
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
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  timePickerButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
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
    backgroundColor: '#B2DFDB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#00695C',
    fontWeight: '700',
    fontSize: 14,
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
    maxHeight: '70%',
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  pickerCloseText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  dateScrollContainer: {
    maxHeight: 300,
    paddingHorizontal: 10,
  },
  dateOption: {
    padding: 16,
    marginVertical: 2,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedDateOption: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedDateOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  timeScrollContainer: {
    maxHeight: 300,
    paddingHorizontal: 10,
  },
  timeOption: {
    padding: 16,
    marginVertical: 2,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedTimeOption: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedTimeOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  datePickerIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  timePickerIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
}); 