import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSync } from '@/hooks/use-sync';
import { collectionSyncService } from '@/services/collection-sync.service';
import { SyncProgressModal } from '@/components/sync-progress-modal';
import { Badge, Button, Card, Input, ScreenContainer, SectionHeader, tokens } from '@/ui';

const TOKEN_STORAGE_KEY = 'virtualstand_bgg_api_token';
const USERNAME_STORAGE_KEY = 'virtualstand_bgg_username';

function readWebStorage(key: string): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? '';
    }
  } catch {
    // Ignore storage errors
  }
  return '';
}

function writeWebStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors
  }
}

export default function SettingsScreen() {
  const [username, setUsername] = useState(() => readWebStorage(USERNAME_STORAGE_KEY));
  const [apiToken, setApiToken] = useState(() => readWebStorage(TOKEN_STORAGE_KEY));
  const [showToken, setShowToken] = useState(false);
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
    writeWebStorage(USERNAME_STORAGE_KEY, username.trim());
    writeWebStorage(TOKEN_STORAGE_KEY, apiToken.trim());

    setModalVisible(true);
    const result = await startSync(username.trim(), apiToken.trim() || undefined);
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
        placeholder="ex: seu_usuario_bgg"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={(txt) => {
          setUsername(txt);
          if (validationError) setValidationError(null);
        }}
        errorText={validationError}
      />

      <Input
        label="Token da API BGG (Bearer Token Secreto)"
        placeholder="Cole o código secreto gerado ao clicar em Create Token"
        helperText='Atenção: cole o código secreto exibido uma única vez ao clicar em "Create Token" (e não o nome do token).'
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!showToken}
        value={apiToken}
        onChangeText={setApiToken}
      />

      <View style={styles.tokenToggleRow}>
        <Button
          label={showToken ? 'Ocultar Token' : 'Mostrar Token Digitado'}
          variant="ghost"
          size="sm"
          onPress={() => setShowToken((prev) => !prev)}
        />
      </View>

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

      <Card variant="elevated" padding="md" style={styles.authCard}>
        <View style={styles.authHeaderRow}>
          <Text style={styles.infoTitle}>Autenticação Bearer Token (BGG XMLAPI2)</Text>
          <Badge tone="warning" label="Obrigatório no BGG" />
        </View>
        <Text style={styles.infoItem}>
          O BoardGameGeek exige autenticação <Text style={styles.bold}>Bearer Token</Text> em todas as consultas à <Text style={styles.bold}>XMLAPI2</Text>.
        </Text>
        <Text style={styles.infoItem}>
          • Acesse <Text style={styles.bold}>boardgamegeek.com/applications</Text>, clique em <Text style={styles.bold}>Create Token</Text> e copie o código secreto exibido no modal para o campo acima.
        </Text>
      </Card>

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
  tokenToggleRow: {
    alignItems: 'flex-start',
    marginTop: -tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  buttonWrap: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  authCard: {
    marginBottom: tokens.spacing.md,
  },
  authHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  infoTitle: {
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
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
