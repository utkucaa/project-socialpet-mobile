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
    addAllergy,
    deleteAllergy,
    getAllergies,
    updateAllergy
} from '../../services/medicalRecordService';
import { Allergy } from './types';

interface AllergiesPanelProps {
  petId: string | null;
}

export const AllergiesPanel: React.FC<AllergiesPanelProps> = ({ petId }) => {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  
  // Severity picker state
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Severity options
  const severityOptions = [
    { value: 'Hafif', label: 'Hafif', color: '#FED7AA', textColor: '#C2410C' },
    { value: 'Orta', label: 'Orta', textColor: '#7C2D12' },
    { value: 'Ciddi', label: 'Ciddi', color: '#FECACA', textColor: '#DC2626' }
  ];

  // Fetch allergies from backend
  const fetchAllergies = async () => {
    if (!petId) {
      setIsLoading(false);
      setAllergies([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching allergies for pet:', petId);
      const response = await getAllergies(petId);
      console.log('Fetched allergies:', response);
      
      setAllergies(response);
    } catch (err) {
      console.error('Error fetching allergies:', err);
      setAllergies([]);
      setError('Alerji kayıtları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllergies();
  }, [petId, refreshCounter]);

  const resetForm = () => {
    setAllergen('');
    setReaction('');
    setSeverity('');
    setNotes('');
    setEditingAllergy(null);
    setError(null);
  };

  const openAddModal = () => {
    console.log('🤧 Alerjı ekleme modalı açılıyor...');
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = () => {
    console.log('🔍 Validating allergy form...');
    console.log('Allergen:', `"${allergen}"`);
    console.log('Reaction:', `"${reaction}"`);
    console.log('Severity:', `"${severity}"`);
    
    if (!allergen.trim()) {
      console.log('❌ Allergen validation failed');
      setError('Alerjen adı zorunludur');
      return false;
    }
    
    if (!reaction.trim()) {
      console.log('❌ Reaction validation failed');
      setError('Reaksiyon açıklaması zorunludur');
      return false;
    }
    
    if (!severity.trim()) {
      console.log('❌ Severity validation failed');
      setError('Şiddet derecesi zorunludur');
      return false;
    }
    
    console.log('🎉 All validations passed!');
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔵 HandleSubmit called');
    console.log('Pet ID:', petId);
    console.log('Form data:', { allergen, reaction, severity, notes });

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
      
      const allergyData = {
        allergen: allergen.trim(),
        reaction: reaction.trim(),
        severity: severity.trim(),
        notes: notes.trim()
      };
      
      console.log('📝 Submitting allergy:', allergyData);
      
      if (editingAllergy) {
        console.log('✏️ Updating allergy with ID:', editingAllergy.id);
        try {
          const updated = await updateAllergy(petId, editingAllergy.id, allergyData);
          console.log('✅ Updated allergy:', updated);
          
          // Update the allergy in the list
          setAllergies(allergies.map(allergy => 
            allergy.id === editingAllergy.id ? updated : allergy
          ));
        } catch (updateError) {
          console.log('⚠️ Backend update failed, updating locally:', updateError);
          // Update locally even if backend fails
          setAllergies(allergies.map(allergy => 
            allergy.id === editingAllergy.id 
              ? { ...allergy, ...allergyData }
              : allergy
          ));
        }
      } else {
        console.log('➕ Adding new allergy');
        try {
          const newAllergy = await addAllergy(petId, allergyData);
          console.log('✅ New allergy created:', newAllergy);
          
          setAllergies([...allergies, newAllergy]);
        } catch (addError) {
          console.log('⚠️ Backend add failed, adding locally:', addError);
          // Create a temporary allergy locally even if backend fails
          const tempId = `temp-${Date.now()}`;
          const tempAllergy: Allergy = {
            id: tempId,
            allergen: allergyData.allergen,
            reaction: allergyData.reaction,
            severity: allergyData.severity,
            notes: allergyData.notes
          };
          
          console.log('🔧 Created temp allergy:', tempAllergy);
          setAllergies([...allergies, tempAllergy]);
        }
      }
      
      console.log('🎉 Allergy operation completed');
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('💥 Error submitting allergy:', err);
      setError('Alerji kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 HandleSubmit finished');
    }
  };

  const handleEdit = (allergy: Allergy) => {
    console.log('Editing allergy:', allergy);
    
    setAllergen(allergy.allergen);
    setReaction(allergy.reaction);
    setSeverity(allergy.severity);
    setNotes(allergy.notes);
    
    setEditingAllergy(allergy);
    setShowModal(true);
  };

  const handleDelete = async (allergyId: string) => {
    Alert.alert(
      'Alerji Kaydını Sil',
      'Bu alerji kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting allergy with ID:', allergyId);
              await deleteAllergy(petId!, allergyId);
              setAllergies(allergies.filter(allergy => allergy.id !== allergyId));
              setRefreshCounter(prev => prev + 1);
            } catch (err) {
              console.error('Error deleting allergy:', err);
              setError('Alerji kaydı silinemedi. Lütfen tekrar deneyin.');
            }
          }
        }
      ]
    );
  };

  const getSeverityStyle = (severityValue: string) => {
    const option = severityOptions.find(opt => opt.value === severityValue);
    if (!option) return { backgroundColor: '#F3F4F6', color: '#374151' };
    
    return {
      backgroundColor: option.color || '#F3F4F6',
      color: option.textColor || '#374151'
    };
  };

  const renderAllergyCard = (allergy: Allergy) => {
    const severityStyle = getSeverityStyle(allergy.severity);
    
    return (
      <View key={allergy.id} style={styles.allergyCard}>
        <View style={styles.cardMainHeader}>
          <View style={styles.allergyMainInfo}>
            <Text style={styles.allergyNameLarge}>
              🤧 {allergy.allergen}
            </Text>
            <View style={styles.severityContainer}>
              <Text style={[styles.severityBadge, severityStyle]}>
                {allergy.severity}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(allergy)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(allergy.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={styles.infoLabel}>Reaksiyon:</Text>
            <Text style={styles.infoValue}>
              {allergy.reaction}
            </Text>
          </View>
          {allergy.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📝</Text>
              <Text style={styles.infoLabel}>Notlar:</Text>
              <Text style={styles.infoValue}>
                {allergy.notes}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Alerji Ekle</Text>
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
            <Text style={styles.loadingText}>Alerji kayıtları yükleniyor...</Text>
          </View>
        ) : allergies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🤧</Text>
            <Text style={styles.emptyTitle}>Henüz alerji kaydı yok</Text>
            <Text style={styles.emptyText}>İlk alerji kaydınızı ekleyin</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={openAddModal}
            >
              <Text style={styles.emptyAddButtonText}>+ İlk Alerjiyi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.allergiesList} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Alerji Kayıtları</Text>
              {allergies.map(renderAllergyCard)}
            </View>
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
                  {editingAllergy ? 'Alerji Kaydını Düzenle' : 'Yeni Alerji Ekle'}
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
                  <Text style={styles.label}>Alerjen *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={allergen}
                    onChangeText={setAllergen}
                    placeholder="Örn: Polen, Gıda, İlaç..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reaksiyon *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={reaction}
                    onChangeText={setReaction}
                    placeholder="Alerji belirtilerini açıklayın..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şiddet Derecesi *</Text>
                  <TouchableOpacity
                    onPress={() => setShowSeverityPicker(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerButtonText}>
                      {severity || '📊 Şiddet derecesi seçin'}
                    </Text>
                  </TouchableOpacity>
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
                      {isSubmitting ? 'Kaydediliyor...' : (editingAllergy ? 'Güncelle' : 'Kaydet')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Severity Picker Modal */}
        <Modal
          visible={showSeverityPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSeverityPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Şiddet Derecesi Seçin</Text>
                <TouchableOpacity
                  onPress={() => setShowSeverityPicker(false)}
                  style={styles.pickerCloseButton}
                >
                  <Text style={styles.pickerCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.severityOptionsContainer}>
                {severityOptions.map((option, index) => {
                  const isSelected = severity === option.value;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSeverity(option.value);
                        setShowSeverityPicker(false);
                      }}
                      style={[
                        styles.severityOption,
                        isSelected && styles.selectedSeverityOption
                      ]}
                    >
                      <Text style={[
                        styles.severityOptionText,
                        isSelected && styles.selectedSeverityOptionText,
                        { color: option.textColor }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  allergiesList: {
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
  allergyCard: {
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
  allergyMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  allergyNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    width: 80,
    marginTop: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
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
  pickerButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  pickerButtonText: {
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
  severityOptionsContainer: {
    padding: 20,
  },
  severityOption: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectedSeverityOption: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  severityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedSeverityOptionText: {
    color: 'white',
  },
}); 