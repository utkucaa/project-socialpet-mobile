import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AllergiesPanel } from '../components/medical';

export default function AllergiesScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Alerjiler',
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTintColor: '#7C3AED',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <AllergiesPanel petId={petId || null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
}); 