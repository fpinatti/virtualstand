import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSync } from '@/hooks/use-sync';
import { collectionSyncService } from '@/services/collection-sync.service';
import { SyncProgressModal } from '@/components/sync-progress-modal';

export default function SettingsScreen() {
  const [username, setUsername] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
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
      Alert.alert('Atenção', 'Por favor, informe seu nome de usuário do BoardGameGeek.');
      return;
    }

    setModalVisible(true);
    const result = await startSync(username.trim());
    if (result.success) {
      setLastSync(new Date().toLocaleString('pt-BR'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Integração BoardGameGeek</Text>
      <Text style={styles.sectionSubtitle}>
        Conecte sua conta do BGG para importar sua coleção de jogos de tabuleiro e sincronizar avaliações.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome de Usuário no BGG</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: rodneysmith"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
      </View>

      {lastSync ? (
        <Text style={styles.lastSyncText}>Última sincronização com sucesso: {lastSync}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.syncButton, !username.trim() && styles.syncButtonDisabled]}
        onPress={handleStartSync}
        disabled={!username.trim() || isSyncing}
      >
        <Text style={styles.syncButtonText}>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Coleção Agora'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
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
      </View>

      <SyncProgressModal
        visible={modalVisible}
        progress={progress}
        onCancel={() => {
          if (isSyncing) cancelSync();
          setModalVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  lastSyncText: {
    fontSize: 13,
    color: '#10b981',
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 32,
  },
  syncButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
});

