import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Rulebook, RulebookDocType } from '@/services/rulebook-types';
import { useRulebooks } from '@/hooks/use-rulebooks';
import { RulebookImportSheet } from './rulebook-import-sheet';
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
  onBeforeOpenReader?: () => void;
}

export function RulebookList({ bggId, onBeforeOpenReader }: RulebookListProps) {
  const router = useRouter();
  const {
    rulebooks,
    isDownloading,
    downloadProgress,
    importFromDevice,
    importFromUrl,
    downloadPtBrRulebook,
    cancelDownload,
    renameRulebook,
    countAnnotations,
    deleteRulebook,
  } = useRulebooks(bggId);

  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    annotationCount: number;
  } | null>(null);

  if (Platform.OS === 'web') {
    return (
      <Card variant="sunken" padding="sm">
        <Text style={styles.webFallbackText}>
          📖 Leitura de manuais disponível no app iOS/Android
        </Text>
      </Card>
    );
  }

  const hasPtBrManual = rulebooks.some(
    (rb) =>
      rb.sourceKind === 'BUNDLED_ASSET' ||
      rb.label.toLowerCase().includes('português') ||
      rb.label.includes('PT-BR')
  );

  const handleDownloadPtBr = async () => {
    setDownloadFeedback(null);
    const success = await downloadPtBrRulebook();
    if (success) {
      setDownloadFeedback('Manual em Português obtido com sucesso!');
    } else {
      setDownloadFeedback('Manual em PT-BR não localizado no repositório para este jogo.');
    }
  };

  const openReader = (rulebookId: number) => {
    if (onBeforeOpenReader) {
      onBeforeOpenReader();
    }
    router.push(`/rulebook/${rulebookId}`);
  };

  const handleRequestDelete = async (rulebookId: number) => {
    const count = await countAnnotations(rulebookId);
    setConfirmDelete({ id: rulebookId, annotationCount: count });
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
          {!hasPtBrManual ? (
            <Button
              label={isDownloading ? 'Baixando...' : '📥 Baixar PT-BR'}
              variant="secondary"
              size="sm"
              onPress={handleDownloadPtBr}
              disabled={isDownloading}
            />
          ) : null}
          <Button
            label="+ Anexar PDF"
            variant="primary"
            size="sm"
            onPress={() => setShowImport(true)}
          />
        </View>
      </View>

      {downloadFeedback ? (
        <Text style={styles.feedbackText}>{downloadFeedback}</Text>
      ) : null}

      {rulebooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum manual em PDF anexado para consulta offline.
          </Text>
          <View style={styles.downloadPromptWrap}>
            <Button
              label={isDownloading ? 'Baixando manual...' : '📥 Baixar Manual em Português (PT-BR)'}
              variant="primary"
              onPress={handleDownloadPtBr}
              disabled={isDownloading}
            />
          </View>
        </View>
      ) : (
        rulebooks.map((rb) => (
          <Card key={rb.id} variant="sunken" padding="sm" style={styles.card}>
            {editingId === rb.id ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editingLabel}
                  onChangeText={setEditingLabel}
                  maxLength={120}
                />
                <Button
                  label="Salvar"
                  variant="primary"
                  size="sm"
                  onPress={async () => {
                    await renameRulebook(rb.id, editingLabel);
                    setEditingId(null);
                  }}
                />
                <Button
                  label="Cancelar"
                  variant="secondary"
                  size="sm"
                  onPress={() => setEditingId(null)}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.mainInfo}
                  onPress={() => openReader(rb.id)}
                >
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
                </TouchableOpacity>

                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => openReader(rb.id)}>
                    <Text style={styles.readLink}>Ler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(rb.id);
                      setEditingLabel(rb.label);
                    }}
                  >
                    <Text style={styles.actionLink}>Renomear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRequestDelete(rb.id)}>
                    <Text style={styles.deleteLink}>Excluir</Text>
                  </TouchableOpacity>
                </View>

                {confirmDelete?.id === rb.id && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>
                      Confirmar exclusão do manual?{' '}
                      {confirmDelete.annotationCount > 0
                        ? `${confirmDelete.annotationCount} ${
                            confirmDelete.annotationCount === 1
                              ? 'anotação será removida'
                              : 'anotações serão removidas'
                          }.`
                        : 'O arquivo local será apagado.'}
                    </Text>
                    <View style={styles.confirmButtons}>
                      <Button
                        label="Cancelar"
                        variant="secondary"
                        size="sm"
                        onPress={() => setConfirmDelete(null)}
                      />
                      <Button
                        label="Apagar Manual"
                        variant="danger"
                        size="sm"
                        onPress={async () => {
                          await deleteRulebook(rb.id);
                          setConfirmDelete(null);
                        }}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </Card>
        ))
      )}

      <RulebookImportSheet
        visible={showImport}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onClose={() => setShowImport(false)}
        onImportDevice={importFromDevice}
        onImportUrl={importFromUrl}
        onCancelDownload={cancelDownload}
        onImported={(newRulebook: Rulebook) => {
          setShowImport(false);
          openReader(newRulebook.id);
        }}
      />
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
  card: {
    marginBottom: tokens.spacing.xs,
  },
  mainInfo: {
    marginBottom: tokens.spacing['2xs'],
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
  },
  docMeta: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.subtle,
    paddingTop: tokens.spacing['2xs'],
  },
  readLink: {
    color: tokens.colors.accent.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
  actionLink: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  deleteLink: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing['2xs'],
  },
  editInput: {
    flex: 1,
    backgroundColor: tokens.colors.surface.elevated,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing['2xs'],
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  confirmBox: {
    marginTop: tokens.spacing.xs,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.danger,
  },
  confirmText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs,
  },
  webFallbackText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    textAlign: 'center',
  },
});
