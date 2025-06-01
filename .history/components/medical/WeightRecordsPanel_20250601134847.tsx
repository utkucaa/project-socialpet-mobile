import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import {
    addWeightRecord,
    deleteWeightRecord,
    getWeightRecords,
    updateWeightRecord
} from '../../services/medicalRecordService';
import { WeightRecord } from './types';

interface WeightRecordsPanelProps {
  petId: string | null;
}

export const WeightRecordsPanel: React.FC<WeightRecordsPanelProps> = ({ petId }) => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingWeightRecord, setEditingWeightRecord] = useState<WeightRecord | null>(null);
  
  // Date and unit picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  
  // Counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Unit options
  const unitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'lb', label: 'Pound (lb)' }
  ];

  // Fetch weight records from backend
  const fetchWeightRecords = async () => {
    if (!petId) {
      setIsLoading(false);
      setWeightRecords([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching weight records for pet:', petId);
      const response = await getWeightRecords(petId);
      console.log('Fetched weight records:', response);
      
      setWeightRecords(response);
    } catch (err) {
      console.error('Error fetching weight records:', err);
      setWeightRecords([]);
      setError('Kilo kayıtları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightRecords();
  }, [petId, refreshCounter]);

  const resetForm = () => {
    setWeight('');
    setUnit('kg');
    setDate('');
    setNotes('');
    setEditingWeightRecord(null);
    setError(null);
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
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
    console.log('🔍 Validating weight record form...');
    console.log('Weight:', `"${weight}"`);
    console.log('Unit:', `"${unit}"`);
    console.log('Date:', `"${date}"`);
    
    if (!weight.trim()) {
      console.log('❌ Weight validation failed');
      setError('Kilo bilgisi zorunludur');
      return false;
    }
    
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      console.log('❌ Weight value validation failed');
      setError('Geçerli bir kilo değeri girin');
      return false;
    }
    
    if (!date.trim()) {
      console.log('❌ Date validation failed');
      setError('Tarih zorunludur');
      return false;
    }
    
    console.log('🎉 All validations passed!');
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔵 HandleSubmit called');
    console.log('Pet ID:', petId);
    console.log('Form data:', { weight, unit, date, notes });

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
      
      const weightRecordData = {
        weight: parseFloat(weight),
        unit: unit.toUpperCase(),
        recordDate: date.trim(),
        notes: notes.trim()
      };
      
      console.log('📝 Submitting weight record:', weightRecordData);
      
      if (editingWeightRecord) {
        console.log('✏️ Updating weight record with ID:', editingWeightRecord.id);
        try {
          const updated = await updateWeightRecord(petId, editingWeightRecord.id, weightRecordData);
          console.log('✅ Updated weight record:', updated);
          
          // Update the weight record in the list
          setWeightRecords(weightRecords.map(record => 
            record.id === editingWeightRecord.id ? updated : record
          ));
        } catch (updateError) {
          console.log('⚠️ Backend update failed, updating locally:', updateError);
          // Update locally even if backend fails
          setWeightRecords(weightRecords.map(record => 
            record.id === editingWeightRecord.id 
              ? { ...record, weight: weightRecordData.weight, unit: unit, date: weightRecordData.recordDate, notes: weightRecordData.notes }
              : record
          ));
        }
      } else {
        console.log('➕ Adding new weight record');
        try {
          const newWeightRecord = await addWeightRecord(petId, weightRecordData);
          console.log('✅ New weight record created:', newWeightRecord);
          
          setWeightRecords([...weightRecords, newWeightRecord]);
        } catch (addError) {
          console.log('⚠️ Backend add failed, adding locally:', addError);
          // Create a temporary weight record locally even if backend fails
          const tempId = `temp-${Date.now()}`;
          const tempWeightRecord: WeightRecord = {
            id: tempId,
            weight: weightRecordData.weight,
            unit: unit,
            date: weightRecordData.recordDate,
            notes: weightRecordData.notes
          };
          
          console.log('🔧 Created temp weight record:', tempWeightRecord);
          setWeightRecords([...weightRecords, tempWeightRecord]);
        }
      }
      
      console.log('🎉 Weight record operation completed');
      closeModal();
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error('💥 Error submitting weight record:', err);
      setError('Kilo kaydı kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 HandleSubmit finished');
    }
  };

  const handleEdit = (weightRecord: WeightRecord) => {
    console.log('Editing weight record:', weightRecord);
    
    setWeight(weightRecord.weight.toString());
    setUnit(weightRecord.unit);
    setDate(weightRecord.date);
    setNotes(weightRecord.notes);
    
    setEditingWeightRecord(weightRecord);
    setShowModal(true);
  };

  const handleDelete = async (weightRecordId: string) => {
    Alert.alert(
      'Kilo Kaydını Sil',
      'Bu kilo kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting weight record with ID:', weightRecordId);
              await deleteWeightRecord(petId!, weightRecordId);
              setWeightRecords(weightRecords.filter(record => record.id !== weightRecordId));
              setRefreshCounter(prev => prev + 1);
            } catch (err) {
              console.error('Error deleting weight record:', err);
              setError('Kilo kaydı silinemedi. Lütfen tekrar deneyin.');
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
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (weightRecords.length === 0) return null;
    
    const sortedRecords = [...weightRecords].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return {
      labels: sortedRecords.map(record => formatDate(record.date)),
      datasets: [{
        data: sortedRecords.map(record => record.weight),
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green color
      }]
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#10B981'
    }
  };

  const renderWeightCard = (weightRecord: WeightRecord) => {
    return (
      <View key={weightRecord.id} style={styles.weightCard}>
        <View style={styles.cardMainHeader}>
          <View style={styles.weightMainInfo}>
            <Text style={styles.weightValueLarge}>
              ⚖️ {weightRecord.weight} {weightRecord.unit}
            </Text>
            <Text style={styles.weightDateLarge}>
              📅 {formatDate(weightRecord.date)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(weightRecord)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(weightRecord.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {weightRecord.notes && (
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📝</Text>
              <Text style={styles.infoLabel}>Notlar:</Text>
              <Text style={styles.infoValue}>
                {weightRecord.notes}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const chartData = getChartData();
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Kilo Ekle</Text>
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
            <Text style={styles.loadingText}>Kilo kayıtları yükleniyor...</Text>
          </View>
        ) : weightRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={styles.emptyTitle}>Henüz kilo kaydı yok</Text>
            <Text style={styles.emptyText}>İlk kilo kaydınızı ekleyin</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={openAddModal}
            >
              <Text style={styles.emptyAddButtonText}>+ İlk Kiloyu Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.weightRecordsList} showsVerticalScrollIndicator={false}>
            {/* Weight Chart */}
            {chartData && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>📈 Kilo Geçmişi</Text>
                <LineChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
                <Text style={styles.chartUnit}>
                  Birim: {weightRecords[0]?.unit || 'kg'}
                </Text>
              </View>
            )}
            
            {/* Weight Records List */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Kilo Kayıtları</Text>
              {[...weightRecords]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(renderWeightCard)}
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
                  {editingWeightRecord ? 'Kilo Kaydını Düzenle' : 'Yeni Kilo Ekle'}
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
                  <Text style={styles.label}>Kilo *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="Örn: 5.5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Birim *</Text>
                  <TouchableOpacity
                    onPress={() => setShowUnitPicker(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerButtonText}>
                      {unit ? unitOptions.find(opt => opt.value === unit)?.label : '⚖️ Birim seçin'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tarih *</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerButtonText}>
                      {formatDisplayDate(date)}
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
                      {isSubmitting ? 'Kaydediliyor...' : (editingWeightRecord ? 'Güncelle' : 'Kaydet')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Unit Picker Modal */}
        <Modal
          visible={showUnitPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowUnitPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Birim Seçin</Text>
                <TouchableOpacity
                  onPress={() => setShowUnitPicker(false)}
                  style={styles.pickerCloseButton}
                >
                  <Text style={styles.pickerCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.unitOptionsContainer}>
                {unitOptions.map((option, index) => {
                  const isSelected = unit === option.value;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setUnit(option.value as 'kg' | 'lb');
                        setShowUnitPicker(false);
                      }}
                      style={[
                        styles.unitOption,
                        isSelected && styles.selectedUnitOption
                      ]}
                    >
                      <Text style={[
                        styles.unitOptionText,
                        isSelected && styles.selectedUnitOptionText
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
                  const isSelected = date === dateStr;
                  
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        console.log('Date selected:', dateStr);
                        setDate(dateStr);
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
  weightRecordsList: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  chartUnit: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
  weightCard: {
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
    marginBottom: 8,
  },
  weightMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  weightValueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  weightDateLarge: {
    fontSize: 16,
    color: '#00695C',
    fontWeight: '700',
    backgroundColor: '#B2DFDB',
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
    width: 60,
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
    maxHeight: '70%',
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
  unitOptionsContainer: {
    padding: 20,
  },
  unitOption: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectedUnitOption: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  unitOptionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
  },
  selectedUnitOptionText: {
    color: 'white',
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
}); 