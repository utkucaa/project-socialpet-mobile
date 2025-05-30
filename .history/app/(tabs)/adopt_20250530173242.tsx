import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdoptScreen() {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#AB75C2', '#9B6BB0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🐾 Sahiplenme İlanları</Text>
        <Text style={styles.headerSubtitle}>Yeni yuva arayan dostlar</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={styles.comingSoon}>Yakında...</Text>
        <Text style={styles.description}>
          Sahiplenme ilanları burada görüntülenecek
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F3E5F5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  comingSoon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#AB75C2',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 