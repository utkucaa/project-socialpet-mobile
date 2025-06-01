import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WeightRecordsPanel } from '../components/medical';

export default function WeightRecordsScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Kilo Kayıtları',
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTintColor: '#7C3AED',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <WeightRecordsPanel petId={petId || null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
}); 