import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Rulebook } from '@/services/rulebook-types';
import { rulebookRepository } from '@/db/repositories/rulebook.repository';
import { rulebookFileService } from '@/services/rulebook-file.service';
import { PdfReader } from '@/components/rulebooks/pdf-reader';
import { Button, ScreenContainer, tokens } from '@/ui';

export default function RulebookReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [rulebook, setRulebook] = useState<Rulebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        if (isMounted) {
          setErrorMsg('Identificador de manual inválido.');
          setLoading(false);
        }
        return;
      }
      try {
        const row = await rulebookRepository.findById(numericId);
        if (!isMounted) return;
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
        if (isMounted) {
          setErrorMsg('Erro ao carregar o manual.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <ScreenContainer padded={false}>
      <Stack.Screen
        options={{
          title: rulebook?.label ?? 'Manual de Regras',
          headerTitleAlign: 'center',
          headerBackVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backButtonText}>‹ Voltar</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
          <Text style={styles.loadingText}>Abrindo manual...</Text>
          <View style={styles.actionWrap}>
            <Button label="Cancelar / Voltar" variant="secondary" size="sm" onPress={() => router.back()} />
          </View>
        </View>
      ) : errorMsg || !rulebook ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMsg ?? 'Manual indisponível.'}</Text>
          <Button label="Voltar à Coleção" variant="secondary" onPress={() => router.back()} />
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  backButton: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing['2xs'],
    justifyContent: 'center',
  },
  backButtonText: {
    color: tokens.colors.accent.primary,
    fontSize: tokens.typography.scale.body.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  actionWrap: {
    marginTop: tokens.spacing.md,
  },
  loadingText: {
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
  webNotice: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.body.fontSize,
    textAlign: 'center',
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.body.fontSize,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
});
