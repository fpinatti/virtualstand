import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={size ?? 24}
              color={typeof color === 'string' ? color : tokens.colors.accent.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shelf"
        options={{
          title: 'Estante 3D',
          headerTitle: 'Minha Estante 3D',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={size ?? 24}
              color={typeof color === 'string' ? color : tokens.colors.accent.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          headerTitle: 'Configurações BGG',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size ?? 24}
              color={typeof color === 'string' ? color : tokens.colors.accent.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
