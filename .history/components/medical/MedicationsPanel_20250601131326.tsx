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
    addMedication,
    deleteMedication,
    getMedications,
    updateMedication
} from '../../services/medicalRecordService';
import { Medication } from './types';

interface MedicationsPanelProps {
  petId: string | null;
}

export const MedicationsPanel: React.FC<MedicationsPanelProps> = ({ petId }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  
  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch medications from backend
  const fetchMedications = async () => {
    if (!petId) {
      setIsLoading(false);
      setMedications([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching medications for pet:', petId);
      const response = await getMedications(petId);
      console.log('Fetched medications:', response);
      
      setMedications(response);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setMedications([]);
      setError('İlaç kayıtları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [petId, refreshCounter]);

  const resetForm = () => {
    setMedicationName('');
    setDosage('');
    setFrequency('');
    setStartDate('');
    setEndDate('');
    setPrescribedBy('');
    setNotes('');
    setEditingMedication(null);
    setError(null);
    
    // Reset to today's date
    const today = new Date();
    setSelectedDate(today);
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

  const validateForm = () => {
    console.log('🔍 Validating medication form...');
    console.log('Name:', `"${medicationName}"`);
    console.log('Dosage:', `"${dosage}"`);
    console.log('Frequency:', `"${frequency}"`);
    console.log('Start Date:', `"${startDate}"`);
    console.log('Prescribed By:', `"${prescribedBy}"`);
    
    if (!medicationName.trim()) {
      console.log('❌ Medication name validation failed');
      setError('İlaç adı zorunludur');
      return false;
    }
    
    if (!dosage.trim()) {
      console.log('❌ Dosage validation failed');
      setError('Doz bilgisi zorunludur');
      return false;
    }
    
    if (!frequency.trim()) {
      console.log('❌ Frequency validation failed');
      setError('Kullanım sıklığı zorunludur');
      return false;
    }
    
    if (!startDate.trim()) {
      console.log('❌ Start date validation failed');
      setError('Başlangıç tarihi zorunludur');
      return false;
    }
    
    if (!prescribedBy.trim()) {
      console.log('❌ Prescribed by validation failed');
      setError('Reçete eden doktor adı zorunludur');
      return false;
    }
    
    console.log('🎉 All validations passed!');
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔵 HandleSubmit called');
    console.log('Pet ID:', petId);
    console.log('Form data:', { medicationName, dosage, frequency, startDate, endDate, prescribedBy, notes });

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
      
      const medicationData = {
        medicationName: medicationName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim() || null,
        prescribedBy: prescribedBy.trim(),
        notes: notes.trim()
      };
      
      console.log('📝 Submitting medication:', medicationData);
      
      if (editingMedication) {
        console.log('✏️ Updating medication with ID:', editingMedication.id);
        try {
          const updated = await updateMedication(petId, editingMedication.id, medicationData);
          console.log('✅ Updated medication:', updated);
          
          // Update the medication in the list
          setMedications(medications.map(medication => 
            medication.id === editingMedication.id ? updated : medication
          ));
        } catch (updateError) {
          console.log('⚠️ Backend update failed, updating locally:', updateError);
          // Update locally even if backend fails
          setMedications(medications.map(medication => 
            medication.id === editingMedication.id 
              ? { ...medication, ...medicationData, name: medicationData.medicationName }
              : medication
          ));
        }
      } else {
        console.log('➕ Adding new medication');
        try {
          const newMedication = await addMedication(petId, medicationData);
          console.log('✅ New medication created:', newMedication);
          
          setMedications([...medications, newMedication]);
        } catch (addError) {
          console.log('⚠️ Backend add failed, adding locally:', addError);
          // Create a temporary medication locally even if backend fails
          const tempId = `temp-${Date.now()}`;
          const tempMedication: Medication = {
            id: tempId,
            name: medicationData.medicationName,
            dosage: medicationData.dosage,
            frequency: medicationData.frequency,
            startDate: medicationData.startDate,
            endDate: medicationData.endDate,
            prescribedBy: medicationData.prescribedBy,
            notes: medicationData.notes
          };
          
          console.log('🔧 Created temp medication:', tempMedication);
          setMedications([...medications, tempMedication]);
        }
      }
      
      console.log('🎉 Medication operation completed');
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('💥 Error submitting medication:', err);
      setError('İlaç kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 HandleSubmit finished');
    }
  };

  const handleEdit = (medication: Medication) => {
    console.log('Editing medication:', medication);
    
    setMedicationName(medication.name);
    setDosage(medication.dosage);
    setFrequency(medication.frequency);
    setStartDate(medication.startDate);
    setEndDate(medication.endDate || '');
    setPrescribedBy(medication.prescribedBy);
    setNotes(medication.notes);
    
    setEditingMedication(medication);
    setShowModal(true);
  };

  const handleDelete = async (medicationId: string) => {
    Alert.alert(
      'İlaç Kaydını Sil',
      'Bu ilaç kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting medication with ID:', medicationId);
              await deleteMedication(petId!, medicationId);
              setMedications(medications.filter(medication => medication.id !== medicationId));
              setRefreshCounter(prev => prev + 1);
            } catch (err) {
              console.error('Error deleting medication:', err);
              setError('İlaç kaydı silinemedi. Lütfen tekrar deneyin.');
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

  const isCurrentMedication = (medication: Medication) => {
    if (!medication.endDate) return true;
    const endDate = new Date(medication.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  };

  const renderMedicationCard = (medication: Medication) => {
    const isCurrent = isCurrentMedication(medication);
    
    return (
      <View 
        key={medication.id} 
        style={[styles.medicationCard, !isCurrent && styles.pastMedicationCard]}
      >
        <View style={styles.cardMainHeader}>
          <View style={styles.medicationMainInfo}>
            <Text style={[styles.medicationNameLarge, !isCurrent && styles.pastText]}>
              💊 {medication.name}
            </Text>
            <Text style={[styles.medicationDateLarge, !isCurrent && styles.pastDateText]}>
              📅 {formatDate(medication.startDate)}
              {medication.endDate && ` - ${formatDate(medication.endDate)}`}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(medication)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(medication.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💊</Text>
            <Text style={styles.infoLabel}>Doz:</Text>
            <Text style={[styles.infoValue, !isCurrent && styles.pastText]}>
              {medication.dosage}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕘</Text>
            <Text style={styles.infoLabel}>Sıklık:</Text>
            <Text style={[styles.infoValue, !isCurrent && styles.pastText]}>
              {medication.frequency}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👨‍⚕️</Text>
            <Text style={styles.infoLabel}>Doktor:</Text>
            <Text style={[styles.infoValue, !isCurrent && styles.pastText]}>
              {medication.prescribedBy}
            </Text>
          </View>
          {medication.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📝</Text>
              <Text style={styles.infoLabel}>Notlar:</Text>
              <Text style={[styles.infoValue, !isCurrent && styles.pastText]}>
                {medication.notes}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Separate medications into current and past
  const currentMedications = medications.filter(medication => isCurrentMedication(medication));
  const pastMedications = medications.filter(medication => !isCurrentMedication(medication));

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ İlaç Ekle</Text>
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
            <Text style={styles.loadingText}>İlaç kayıtları yükleniyor...</Text>
          </View>
        ) : medications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyTitle}>Henüz ilaç kaydı yok</Text>
            <Text style={styles.emptyText}>İlk ilaç kaydınızı ekleyin</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={openAddModal}
            >
              <Text style={styles.emptyAddButtonText}>+ İlk İlacı Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.medicationsList} showsVerticalScrollIndicator={false}>
            {/* Current Medications */}
            {currentMedications.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Mevcut İlaçlar</Text>
                {currentMedications.map(renderMedicationCard)}
              </View>
            )}
            
            {/* Past Medications */}
            {pastMedications.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Geçmiş İlaçlar</Text>
                {pastMedications.map(renderMedicationCard)}
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
                  {editingMedication ? 'İlaç Kaydını Düzenle' : 'Yeni İlaç Ekle'}
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
                  <Text style={styles.label}>İlaç Adı *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={medicationName}
                    onChangeText={setMedicationName}
                    placeholder="Örn: Antibiyotik, Ağrı kesici..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Doz *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={dosage}
                    onChangeText={setDosage}
                    placeholder="Örn: 10mg, 1 tablet, 2ml..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kullanım Sıklığı *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={frequency}
                    onChangeText={setFrequency}
                    placeholder="Örn: Günde 2 kez, Sabah-akşam..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Başlangıç Tarihi *</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Start date button pressed!');
                      setShowStartDatePicker(true);
                    }}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {formatDisplayDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bitiş Tarihi (İsteğe bağlı)</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('End date button pressed!');
                      setShowEndDatePicker(true);
                    }}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {endDate ? formatDisplayDate(endDate) : '📅 Bitiş tarihi seçin (İsteğe bağlı)'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reçete Eden Doktor *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={prescribedBy}
                    onChangeText={setPrescribedBy}
                    placeholder="Doktor adını girin"
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
                      {isSubmitting ? 'Kaydediliyor...' : (editingMedication ? 'Güncelle' : 'Kaydet')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      
      <DatePickerModals
        showStartDatePicker={showStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        setShowStartDatePicker={setShowStartDatePicker}
        setShowEndDatePicker={setShowEndDatePicker}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setSelectedDate={setSelectedDate}
      />
    </>
  );
};

// Date Picker Modals - OUTSIDE the main component to avoid conflicts
const DatePickerModals: React.FC<{
  showStartDatePicker: boolean;
  showEndDatePicker: boolean;
  setShowStartDatePicker: (show: boolean) => void;
  setShowEndDatePicker: (show: boolean) => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSelectedDate: (date: Date) => void;
}> = ({
  showStartDatePicker,
  showEndDatePicker,
  setShowStartDatePicker,
  setShowEndDatePicker,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  setSelectedDate,
}) => {
  return (
    <>
      {/* Start Date Picker Modal */}
      <Modal
        visible={showStartDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Başlangıç Tarihi Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(false)}
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
                const isSelected = startDate === dateStr;
                
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      console.log('Start date selected:', dateStr);
                      setStartDate(dateStr);
                      setSelectedDate(date);
                      setShowStartDatePicker(false);
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

      {/* End Date Picker Modal */}
      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Bitiş Tarihi Seçin</Text>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(false)}
                style={styles.pickerCloseButton}
              >
                <Text style={styles.pickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateScrollContainer}>
              {/* Clear end date option */}
              <TouchableOpacity
                onPress={() => {
                  console.log('End date cleared');
                  setEndDate('');
                  setShowEndDatePicker(false);
                }}
                style={[styles.dateOption, styles.clearDateOption]}
              >
                <Text style={styles.clearDateOptionText}>
                  ❌ Bitiş tarihini temizle
                </Text>
              </TouchableOpacity>
              
              {Array.from({ length: 120 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i); // Today to 120 days in future
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = endDate === dateStr;
                
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      console.log('End date selected:', dateStr);
                      setEndDate(dateStr);
                      setSelectedDate(date);
                      setShowEndDatePicker(false);
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
  medicationsList: {
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
  medicationCard: {
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
  pastMedicationCard: {
    backgroundColor: '#f9fafb',
    borderLeftColor: '#9ca3af',
  },
  cardMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medicationMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicationNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  medicationDateLarge: {
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
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
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
  clearDateOption: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  clearDateOptionText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
}); 