import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#AB75C2',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 0,
            borderRadius: 0,
            marginHorizontal: 0,
            marginBottom: 0,
            height: 85,
            paddingBottom: 20,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          },
          default: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 0,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            marginBottom: 0,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'house.fill' : 'house'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="adopt"
        options={{
          title: 'Sahiplendirme',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'heart.fill' : 'heart'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lost"
        options={{
          title: 'Kayıp',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'magnifyingglass.circle.fill' : 'magnifyingglass.circle'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Hizmetler',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'building.2.fill' : 'building.2'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Topluluk',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'person.2.fill' : 'person.2'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'person.crop.circle.fill' : 'person.crop.circle'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
