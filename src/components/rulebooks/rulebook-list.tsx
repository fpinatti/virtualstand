import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RulebookDocType } from '@/services/rulebook-types';
import { useRulebooks } from '@/hooks/use-rulebooks';
import { Badge, Button, Card, tokens } from '@/ui';

const DOC_TYPE_LABELS: Record<RulebookDocType, string> = {
  BASE_RULES: 'Regras base',
  EXPANSION: 'Expansão',
  QUICK_REFERENCE: 'Referência rápida',
  FAQ: 'FAQ',
  OTHER: 'Outro',
};

interface RulebookListProps {
  bggId: number;
  gameTitle?: string;
  onBeforeOpenReader?: () => void;
}

export function RulebookList({ bggId, gameTitle, onBeforeOpenReader }: RulebookListProps) {
  const router = useRouter();
  const {
    rulebooks,
    isDownloading,
    downloadPtBrRulebook,
  } = useRulebooks(bggId);

  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const hasPtBrManual = rulebooks.some(
    (rb) =>
      rb.sourceKind === 'BUNDLED_ASSET' ||
      rb.label.toLowerCase().includes('português') ||
      rb.label.includes('PT-BR')
  );

  const handleDownloadPtBr = async () => {
    setDownloadFeedback(null);
    const success = await downloadPtBrRulebook(gameTitle);
    if (success) {
      setDownloadFeedback('Manual em Português obtido com sucesso!');
    } else {
      setDownloadFeedback('Manual em PT-BR não localizado para download.');
    }
  };

  const openReader = (rulebookId: number) => {
    if (onBeforeOpenReader) {
      onBeforeOpenReader();
    }
    // Small timeout ensures parent modal dismisses cleanly before route navigation
    setTimeout(() => {
      router.push(`/rulebook/${rulebookId}`);
    }, 100);
  };

  const formatSizeMb = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Manuais ({rulebooks.length})</Text>
        <View style={styles.headerActions}>
          {!hasPtBrManual && (
            <Button
              label={isDownloading ? 'Baixando...' : '📥 Baixar PT-BR'}
              variant="secondary"
              size="sm"
              onPress={handleDownloadPtBr}
              disabled={isDownloading}
            />
          )}
        </View>
      </View>

      {downloadFeedback ? (
        <Text style={styles.feedbackText}>{downloadFeedback}</Text>
      ) : null}

      {rulebooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum manual oficial em PDF anexado para este jogo.
          </Text>
          <View style={styles.downloadPromptWrap}>
            <Button
              label={isDownloading ? 'Baixando Manual...' : '📥 Baixar Manual Oficial (PT-BR)'}
              variant="primary"
              onPress={handleDownloadPtBr}
              disabled={isDownloading}
            />
          </View>
        </View>
      ) : (
        rulebooks.map((rb) => (
          <TouchableOpacity
            key={rb.id}
            activeOpacity={0.7}
            onPress={() => openReader(rb.id)}
            style={styles.cardTouchable}
          >
            <Card variant="sunken" padding="sm" style={styles.card}>
              <View style={styles.mainInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.docLabel}>{rb.label}</Text>
                  {rb.sourceKind === 'BUNDLED_ASSET' || rb.label.includes('PT-BR') ? (
                    <Badge label="PT-BR" tone="accent" />
                  ) : null}
                </View>
                <Text style={styles.docMeta}>
                  {DOC_TYPE_LABELS[rb.docType] ?? rb.docType} •{' '}
                  {rb.pageCount ? `${rb.pageCount} págs` : 'Verificando'} •{' '}
                  {formatSizeMb(rb.fileSizeBytes)}
                  {rb.lastViewedPage > 1 ? ` • Parou na pág. ${rb.lastViewedPage}` : ''}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: tokens.spacing['2xs'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    alignItems: 'center',
  },
  feedbackText: {
    color: tokens.colors.accent.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: tokens.spacing.xs,
  },
  downloadPromptWrap: {
    marginTop: tokens.spacing.sm,
    gap: tokens.spacing.xs,
  },
  headerTitle: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontStyle: 'italic',
  },
  cardTouchable: {
    marginBottom: tokens.spacing.xs,
  },
  card: {
    marginBottom: 0,
  },
  mainInfo: {
    paddingVertical: tokens.spacing['2xs'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  docLabel: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    flex: 1,
  },
  docMeta: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  webFallbackText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    textAlign: 'center',
  },
});
