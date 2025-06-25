import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

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
      
      // Set the response data, even if empty
      setVaccinations(response);
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
      setVaccinations([]);
      setError('Aşı kayıtları yüklenirken hata oluştu.');
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
  };

  const openAddModal = () => {
    console.log('🩺 Aşı ekleme modalı açılıyor...');
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = () => {
    if (!vaccineName.trim()) {
      setError('Aşı adı zorunludur');
      return false;
    }
    if (!vaccinationDate.trim()) {
      setError('Aşı tarihi zorunludur (YYYY-MM-DD formatında)');
      return false;
    }
    if (!veterinarian.trim()) {
      setError('Veteriner adı zorunludur');
      return false;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(vaccinationDate)) {
      setError('Tarihi YYYY-MM-DD formatında girin (örn: 2024-12-25)');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit called');
    console.log('🐾 petId:', petId);
    console.log('📝 Form values:', { vaccineName, vaccinationDate, veterinarian });
    
    if (!petId) {
      console.log('❌ Pet ID missing');
      setError('Pet ID eksik');
      return;
    }
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
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
      
      console.log('📤 Submitting vaccination to backend:', vaccinationData);
      console.log('🆔 Pet ID:', petId);
      
      if (editingVaccination) {
        console.log('✏️ Updating existing vaccination');
        try {
          const result = await updateVaccination(petId, editingVaccination.id, vaccinationData);
          console.log('✅ Update result:', result);
          Alert.alert('Başarılı', 'Aşı kaydı güncellendi');
        } catch (backendError) {
          console.log('⚠️ Backend failed, updating locally');
          // Update locally even if backend fails
          const updatedVaccinations = vaccinations.map(v => 
            v.id === editingVaccination.id 
              ? { ...v, name: vaccinationData.vaccineName, date: vaccinationData.vaccinationDate, veterinarian: vaccinationData.veterinarian }
              : v
          );
          setVaccinations(updatedVaccinations);
          Alert.alert('Başarılı', 'Aşı kaydı güncellendi (yerel)');
        }
      } else {
        console.log('➕ Adding new vaccination');
        try {
          const result = await addVaccination(petId, vaccinationData);
          console.log('✅ Add result:', result);
          Alert.alert('Başarılı', 'Aşı kaydı eklendi');
        } catch (backendError) {
          console.log('⚠️ Backend failed, adding locally');
          // Add locally even if backend fails
          const tempId = `temp-${Date.now()}`;
          const newVaccination: Vaccination = {
            id: tempId,
            name: vaccinationData.vaccineName,
            date: vaccinationData.vaccinationDate,
            veterinarian: vaccinationData.veterinarian
          };
          setVaccinations([...vaccinations, newVaccination]);
          Alert.alert('Başarılı', 'Aşı kaydı eklendi (yerel)');
        }
      }
      
      console.log('🎉 Vaccination saved successfully');
      closeModal();
      console.log('🔄 Refreshing data...');
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('💥 Error saving vaccination:', err);
      
      let errorMessage = 'Aşı kaydı kaydedilemedi.';
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
        errorMessage += ` Hata: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 handleSubmit finished');
    }
  };

  const handleEdit = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination);
    setVaccineName(vaccination.name);
    setVaccinationDate(vaccination.date);
    setVeterinarian(vaccination.veterinarian);
    
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
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
          <ActivityIndicator size="large" color="#B2DFDB" />
          <Text style={styles.loadingText}>Aşı kayıtları yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={vaccinations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderVaccinationCard(item)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💉</Text>
              <Text style={styles.emptyTitle}>Henüz aşı kaydı yok</Text>
              <Text style={styles.emptySubtitle}>İlk aşı kaydını eklemek için yukarıdaki &quot;Aşı Ekle&quot; butonuna tıklayın</Text>
            </View>
          }
        />
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
                <Text style={styles.label}>Aşı Tarihi * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={vaccinationDate}
                  onChangeText={setVaccinationDate}
                  placeholder="2024-12-25"
                  placeholderTextColor="#9CA3AF"
                />
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#B2DFDB',
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
    color: '#00695C',
    fontWeight: '700',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  errorCloseText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  vaccinationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#B2DFDB',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  vaccineDateLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  cardContent: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
    minWidth: 70,
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 