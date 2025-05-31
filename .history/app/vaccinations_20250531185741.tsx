import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { VaccinationsPanel } from '../components/medical';

export default function VaccinationsScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Aşı Kayıtları',
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
      <VaccinationsPanel petId={petId || null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
}); 