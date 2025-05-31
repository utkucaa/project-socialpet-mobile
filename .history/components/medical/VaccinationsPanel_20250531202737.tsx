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
    addVaccination,
    deleteVaccination,
    getVaccinations,
    updateVaccination
} from '../../services/medicalRecordService';
import { Vaccination } from './types';

interface VaccinationsPanelProps {
  petId: string | null;
}

export const VaccinationsPanel: React.FC<VaccinationsPanelProps> = ({ petId }) => {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [vaccineName, setVaccineName] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);
  
  // Custom date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState('01');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [selectedYear, setSelectedYear] = useState('2024');
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Generate arrays for date selection
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    {label: 'Ocak', value: '01'}, {label: 'Şubat', value: '02'}, {label: 'Mart', value: '03'},
    {label: 'Nisan', value: '04'}, {label: 'Mayıs', value: '05'}, {label: 'Haziran', value: '06'},
    {label: 'Temmuz', value: '07'}, {label: 'Ağustos', value: '08'}, {label: 'Eylül', value: '09'},
    {label: 'Ekim', value: '10'}, {label: 'Kasım', value: '11'}, {label: 'Aralık', value: '12'}
  ];
  const years = Array.from({length: 10}, (_, i) => (2020 + i).toString());

  // Test data for when there's no backend data
  const getSampleVaccinations = (): Vaccination[] => [
    {
      id: 'sample-1',
      name: 'Kuduz Aşısı',
      date: '2024-01-15',
      veterinarian: 'Dr. Ahmet Yılmaz'
    },
    {
      id: 'sample-2', 
      name: '5li Karma Aşı',
      date: '2024-02-10',
      veterinarian: 'Dr. Ayşe Demir'
    },
    {
      id: 'sample-3',
      name: 'Leptospira Aşısı', 
      date: '2024-03-05',
      veterinarian: 'Dr. Mehmet Öz'
    }
  ];

  // Fetch vaccinations from backend
  const fetchVaccinations = async () => {
    if (!petId) {
      setIsLoading(false);
      setVaccinations([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching vaccinations for pet:', petId);
      const response = await getVaccinations(petId);
      console.log('Fetched vaccinations:', response);
      
      // If no data from backend, show sample data for testing
      if (response.length === 0) {
        console.log('No vaccinations found, showing sample data for testing');
        setVaccinations(getSampleVaccinations());
      } else {
        setVaccinations(response);
      }
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
      console.log('Error occurred, showing sample data for testing');
      // Show sample data on error for testing purposes
      setVaccinations(getSampleVaccinations());
      setError('Backend bağlantısı kurulamadı. Test verileri gösteriliyor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
  }, [petId, refreshCounter]);

  const resetForm = () => {
    setVaccineName('');
    setVaccinationDate('');
    setVeterinarian('');
    setEditingVaccination(null);
    setError(null);
    
    // Reset date picker to current date
    const today = new Date();
    setSelectedDay(today.getDate().toString().padStart(2, '0'));
    setSelectedMonth((today.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(today.getFullYear().toString());
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
    if (vaccinationDate) {
      const parts = vaccinationDate.split('-');
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
    setVaccinationDate(formattedDate);
    setShowDatePicker(false);
  };

  const validateForm = () => {
    if (!vaccineName.trim()) {
      setError('Aşı adı zorunludur');
      return false;
    }
    if (!vaccinationDate.trim()) {
      setError('Aşı tarihi zorunludur');
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
      
      const vaccinationData = {
        vaccineName: vaccineName.trim(),
        vaccinationDate: vaccinationDate.trim(),
        veterinarian: veterinarian.trim()
      };
      
      console.log('Submitting vaccination:', vaccinationData);
      
      if (editingVaccination) {
        await updateVaccination(petId, editingVaccination.id, vaccinationData);
        Alert.alert('Başarılı', 'Aşı kaydı güncellendi');
      } else {
        await addVaccination(petId, vaccinationData);
        Alert.alert('Başarılı', 'Aşı kaydı eklendi');
      }
      
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('Error saving vaccination:', err);
      setError('Aşı kaydı kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination);
    setVaccineName(vaccination.name);
    setVaccinationDate(vaccination.date);
    setVeterinarian(vaccination.veterinarian);
    
    // Parse date for date picker
    if (vaccination.date) {
      const parts = vaccination.date.split('-');
      if (parts.length === 3) {
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedDay(parts[2]);
      }
    }
    
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (vaccinationId: string) => {
    if (!petId) {
      setError('Pet ID eksik');
      return;
    }
    
    Alert.alert(
      'Aşı Kaydını Sil',
      'Bu aşı kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVaccination(petId, vaccinationId);
              Alert.alert('Başarılı', 'Aşı kaydı silindi');
              setRefreshCounter(prev => prev + 1);
            } catch (err) {
              console.error('Error deleting vaccination:', err);
              setError('Aşı kaydı silinemedi.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih belirtilmemiş';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if can't parse
      }
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const renderVaccinationCard = (vaccination: Vaccination) => (
    <View key={vaccination.id} style={styles.vaccinationCard}>
      {/* Main Card Header - Vaccine Name and Date Prominent */}
      <View style={styles.cardMainHeader}>
        <View style={styles.vaccineMainInfo}>
          <Text style={styles.vaccineNameLarge}>💉 {vaccination.name || 'Aşı adı belirtilmemiş'}</Text>
          <Text style={styles.vaccineDateLarge}>📅 {formatDate(vaccination.date)}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleEdit(vaccination)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(vaccination.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Detailed Info Section */}
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👨‍⚕️</Text>
          <Text style={styles.infoLabel}>Veteriner:</Text>
          <Text style={styles.infoValue}>{vaccination.veterinarian || 'Belirtilmemiş'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏥</Text>
          <Text style={styles.infoLabel}>Durum:</Text>
          <Text style={styles.infoValueGreen}>Tamamlandı</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💉 Aşı Kayıtları</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Aşı Ekle</Text>
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
          <Text style={styles.loadingText}>Aşı kayıtları yükleniyor...</Text>
        </View>
      ) : vaccinations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💉</Text>
          <Text style={styles.emptyTitle}>Henüz aşı kaydı yok</Text>
          <Text style={styles.emptyText}>İlk aşı kaydınızı ekleyin</Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={openAddModal}
          >
            <Text style={styles.emptyAddButtonText}>+ İlk Aşıyı Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.vaccinesList} showsVerticalScrollIndicator={false}>
          {vaccinations.map(renderVaccinationCard)}
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
                {editingVaccination ? 'Aşı Kaydını Düzenle' : 'Yeni Aşı Ekle'}
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
                <Text style={styles.label}>Aşı Adı *</Text>
                <TextInput
                  style={styles.textInput}
                  value={vaccineName}
                  onChangeText={setVaccineName}
                  placeholder="Örn: Karma aşı, Kuduz, Hepatit..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aşı Tarihi *</Text>
                <TouchableOpacity
                  onPress={openDatePicker}
                  style={styles.datePickerButton}
                >
                  <Text style={[styles.datePickerButtonText, {color: vaccinationDate ? '#1f2937' : '#9CA3AF'}]}>
                    {vaccinationDate ? formatDate(vaccinationDate) : 'Tarih seçin'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
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
                    {isSubmitting ? 'Kaydediliyor...' : (editingVaccination ? 'Güncelle' : 'Kaydet')}
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
                  Seçilen tarih: {selectedDay}/{selectedMonth}/{selectedYear}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    flex: 1,
    fontSize: 14,
  },
  errorCloseButton: {
    padding: 4,
  },
  errorCloseText: {
    color: '#dc2626',
    fontWeight: 'bold',
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
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  vaccinesList: {
    flex: 1,
  },
  vaccinationCard: {
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
  cardMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vaccineMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  vaccineNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  vaccineDateLarge: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
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
  infoValueGreen: {
    fontSize: 14,
    color: '#10B981',
    flex: 1,
    fontWeight: '700',
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
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: 'white',
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
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  datePickerConfirmButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
}); 