import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSync } from '@/hooks/use-sync';
import { collectionSyncService } from '@/services/collection-sync.service';
import { SyncProgressModal } from '@/components/sync-progress-modal';
import { Button, Card, Input, ScreenContainer, SectionHeader, tokens } from '@/ui';

export default function SettingsScreen() {
  const [username, setUsername] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isSyncing, progress, startSync, cancelSync } = useSync();

  useEffect(() => {
    if (username.trim()) {
      collectionSyncService.getLastSyncTimestamp(username.trim()).then((date) => {
        if (date) {
          setLastSync(date.toLocaleString('pt-BR'));
        }
      });
    }
  }, [username]);

  const handleStartSync = async () => {
    if (!username.trim()) {
      setValidationError('Por favor, informe seu nome de usuário do BoardGameGeek.');
      return;
    }

    setValidationError(null);
    setModalVisible(true);
    const result = await startSync(username.trim());
    if (result.success) {
      setLastSync(new Date().toLocaleString('pt-BR'));
    }
  };

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Integração BoardGameGeek"
        subtitle="Conecte sua conta do BGG para importar sua coleção de jogos de tabuleiro e sincronizar avaliações."
      />

      <Input
        label="Nome de Usuário no BGG"
        placeholder="ex: rodneysmith"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={(txt) => {
          setUsername(txt);
          if (validationError) setValidationError(null);
        }}
        errorText={validationError}
      />

      {lastSync ? (
        <Text style={styles.lastSyncText}>Última sincronização com sucesso: {lastSync}</Text>
      ) : null}

      <View style={styles.buttonWrap}>
        <Button
          label={isSyncing ? 'Sincronizando...' : 'Sincronizar Coleção Agora'}
          variant="primary"
          size="lg"
          onPress={handleStartSync}
          disabled={!username.trim() || isSyncing}
          loading={isSyncing}
        />
      </View>

      <Card variant="elevated" padding="md">
        <Text style={styles.infoTitle}>Como funciona o processo?</Text>
        <Text style={styles.infoItem}>
          • <Text style={styles.bold}>Fila do BGG (HTTP 202)</Text>: O BGG processa coleções em segundo plano. O app aguarda automaticamente com tentativas progressivas.
        </Text>
        <Text style={styles.infoItem}>
          • <Text style={styles.bold}>100% Offline</Text>: Todos os jogos, capas e notas são salvos localmente em SQLite.
        </Text>
        <Text style={styles.infoItem}>
          • <Text style={styles.bold}>Proteção de Dados Locais</Text>: Sincronizações nunca apagam suas anotações ou tags personalizadas.
        </Text>
      </Card>

      <SyncProgressModal
        visible={modalVisible}
        progress={progress}
        onCancel={() => {
          if (isSyncing) cancelSync();
          setModalVisible(false);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lastSyncText: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.semantic.success,
    marginBottom: tokens.spacing.md,
    fontVariant: ['tabular-nums'],
  },
  buttonWrap: {
    marginBottom: tokens.spacing.xl,
  },
  infoTitle: {
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
  },
  infoItem: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
    lineHeight: tokens.typography.scale.bodySm.lineHeight,
  },
  bold: {
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
});
