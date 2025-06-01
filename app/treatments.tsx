import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { TreatmentsPanel } from '../components/medical';

export default function TreatmentsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Tedavi Kayıtları',
          headerBackTitle: 'Geri',
          headerTintColor: '#AB75C2',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            color: '#1f2937',
            fontWeight: 'bold',
          },
        }} 
      />
      <TreatmentsPanel petId={petId || null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
}); 