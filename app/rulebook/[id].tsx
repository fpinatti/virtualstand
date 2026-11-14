import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Rulebook } from '@/services/rulebook-types';
import { rulebookRepository } from '@/db/repositories/rulebook.repository';
import { rulebookFileService } from '@/services/rulebook-file.service';
import { PdfReader } from '@/components/rulebooks/pdf-reader';

export default function RulebookReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [rulebook, setRulebook] = useState<Rulebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (Platform.OS === 'web') {
        setLoading(false);
        return;
      }
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        setErrorMsg('Identificador de manual inválido.');
        setLoading(false);
        return;
      }
      try {
        const row = await rulebookRepository.findById(numericId);
        if (!row) {
          setErrorMsg('Manual não encontrado no armazenamento local.');
        } else {
          setRulebook({
            id: row.id,
            bggId: row.bggId,
            label: row.label,
            docType: row.docType as Rulebook['docType'],
            sourceKind: row.sourceKind as Rulebook['sourceKind'],
            sourceUrl: row.sourceUrl ?? null,
            fileUri: rulebookFileService.toAbsoluteUri(row.relativePath),
            fileSizeBytes: row.fileSizeBytes,
            pageCount: row.pageCount ?? null,
            lastViewedPage: row.lastViewedPage ?? 1,
            status: row.status as Rulebook['status'],
            createdAt: row.createdAt,
          });
        }
      } catch {
        setErrorMsg('Erro ao carregar o manual.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: rulebook?.label ?? 'Manual de Regras',
          headerBackTitle: 'Voltar',
        }}
      />

      {Platform.OS === 'web' ? (
        <View style={styles.center}>
          <Text style={styles.webNotice}>
            Leitura de manuais disponível no app iOS/Android.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Abrindo manual...</Text>
        </View>
      ) : errorMsg || !rulebook ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMsg ?? 'Manual indisponível.'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PdfReader
          rulebook={rulebook}
          onVerified={(pages) => {
            setRulebook((prev) =>
              prev ? { ...prev, status: 'READY', pageCount: pages } : prev
            );
          }}
          onUnreadable={() => {
            setErrorMsg('Arquivo PDF inválido ou protegido por senha. O registro foi removido.');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  webNotice: {
    color: '#cbd5e1',
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#f87171',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
});

