import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TreatmentsPanel } from '../components/medical';

export default function TreatmentsScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Tedavi Kayıtları',
          headerStyle: {
            backgroundColor: '#F59E0B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <View style={styles.container}>
        <TreatmentsPanel petId={petId || null} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
}); 