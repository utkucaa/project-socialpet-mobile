import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MedicationsPanel } from '../components/medical';

export default function MedicationsScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'İlaçlar',
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTintColor: '#7C3AED',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <MedicationsPanel petId={petId || null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
}); 