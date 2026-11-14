import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Coleção',
          headerTitle: 'Minha Coleção',
        }}
      />
      <Tabs.Screen
        name="shelf"
        options={{
          title: 'Estante 3D',
          headerTitle: 'Minha Estante 3D',
        }}
      />
      <Tabs.Screen
        name="sleeves"
        options={{
          title: 'Sleeves',
          headerTitle: 'Central de Sleeves',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          headerTitle: 'Configurações BGG',
        }}
      />
    </Tabs>
  );
}

