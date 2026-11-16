import React from 'react';
import { Tabs } from 'expo-router';
import { tokens } from '@/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tokens.colors.surface.canvas },
        headerTintColor: tokens.colors.text.primary,
        headerTitleStyle: {
          fontWeight: tokens.typography.weights.bold,
          fontSize: tokens.typography.scale.h2.fontSize,
        },
        tabBarStyle: {
          backgroundColor: tokens.colors.surface.canvas,
          borderTopColor: tokens.colors.border.subtle,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: tokens.colors.accent.primary,
        tabBarInactiveTintColor: tokens.colors.text.muted,
        tabBarLabelStyle: {
          fontSize: tokens.typography.scale.caption.fontSize,
          fontWeight: tokens.typography.weights.semibold,
        },
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
        name="settings"
        options={{
          title: 'Configurações',
          headerTitle: 'Configurações BGG',
        }}
      />
    </Tabs>
  );
}
