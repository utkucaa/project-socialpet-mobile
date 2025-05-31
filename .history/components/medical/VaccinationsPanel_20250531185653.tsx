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
      
      const response = await getVaccinations(petId);
      setVaccinations(response);
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
      setError('Aşı kayıtları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
  }, [petId, refreshCounter]);

  const handleSubmit = async () => {
    if (!petId) {
      setError('Pet ID eksik');
      return;
    }
    
    if (!vaccineName || !vaccinationDate || !veterinarian) {
      setError('Tüm alanlar zorunludur');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const vaccinationData = {
        vaccineName,
        vaccinationDate,
        veterinarian
      };
      
      if (editingVaccination) {
        await updateVaccination(petId, editingVaccination.id, vaccinationData);
      } else {
        await addVaccination(petId, vaccinationData);
      }
      
      setVaccineName('');
      setVaccinationDate('');
      setVeterinarian('');
      setShowModal(false);
      setEditingVaccination(null);
      
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('Error saving vaccination:', err);
      setError('Aşı kaydı kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination);
    setVaccineName(vaccination.name);
    setVaccinationDate(vaccination.date);
    setVeterinarian(vaccination.veterinarian);
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR');
    } catch {
      return dateString;
    }
  };

  const renderVaccinationCard = (vaccination: Vaccination) => (
    <View key={vaccination.id} style={styles.vaccinationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.vaccineName}>💉 {vaccination.name}</Text>
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
      <View style={styles.cardContent}>
        <Text style={styles.vaccinationDate}>📅 {formatDate(vaccination.date)}</Text>
        <Text style={styles.veterinarian}>👨‍⚕️ {vaccination.veterinarian}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💉 Aşı Kayıtları</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingVaccination(null);
            setVaccineName('');
            setVaccinationDate('');
            setVeterinarian('');
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Aşı Ekle</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
        </View>
      ) : (
        <ScrollView style={styles.vaccinesList} showsVerticalScrollIndicator={false}>
          {vaccinations.map(renderVaccinationCard)}
        </ScrollView>
      )}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVaccination ? 'Aşı Kaydını Düzenle' : 'Yeni Aşı Ekle'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aşı Adı</Text>
                <TextInput
                  style={styles.textInput}
                  value={vaccineName}
                  onChangeText={setVaccineName}
                  placeholder="Aşı adını girin"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aşı Tarihi</Text>
                <TextInput
                  style={styles.textInput}
                  value={vaccinationDate}
                  onChangeText={setVaccinationDate}
                  placeholder="YYYY-MM-DD formatında"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Veteriner</Text>
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
                  onPress={() => setShowModal(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>İptal Et</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                >
                  <Text style={styles.saveButtonText}>
                    {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
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
  },
  vaccinesList: {
    flex: 1,
  },
  vaccinationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  cardContent: {
    gap: 4,
  },
  vaccinationDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  veterinarian: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    fontSize: 18,
    color: '#6b7280',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#AB75C2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 