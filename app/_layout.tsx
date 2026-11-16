import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeTables } from '@/db/client';
import { rulebookService } from '@/services/rulebook.service';
import { preloadedRulebookService } from '@/services/preloaded-rulebook.service';
import { tokens } from '@/ui';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initializeTables();
      rulebookService.cleanupPending().catch(() => {
        // Non-blocking startup cleanup
      });
      preloadedRulebookService.syncAllBundledRulebooks().catch(() => {
        // Non-blocking startup seed of bundled PT-BR rulebooks
      });
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize local database:', err);
      setInitError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  if (initError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Erro ao inicializar banco de dados</Text>
        <Text style={styles.errorText}>{initError}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
        <Text style={styles.loadingText}>Carregando VirtualStand...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tokens.colors.surface.canvas },
          headerTintColor: tokens.colors.text.primary,
          headerTitleStyle: {
            fontWeight: tokens.typography.weights.bold,
            fontSize: tokens.typography.scale.h2.fontSize,
          },
          contentStyle: { backgroundColor: tokens.colors.surface.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="rulebook/[id]"
          options={{
            headerShown: true,
            title: 'Manual de Regras',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface.canvas,
    padding: tokens.spacing.lg,
  },
  loadingText: {
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.scale.body.fontSize,
  },
  errorTitle: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
    marginBottom: tokens.spacing.xs,
  },
  errorText: {
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
});
