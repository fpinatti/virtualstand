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
    cancelDownload,
    renameRulebook,
    countAnnotations,
    deleteRulebook,
  } = useRulebooks(bggId);

  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    annotationCount: number;
  } | null>(null);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>
          📖 Leitura de manuais disponível no app iOS/Android
        </Text>
      </View>
    );
  }

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
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowImport(true)}>
          <Text style={styles.addBtnText}>+ Anexar PDF</Text>
        </TouchableOpacity>
      </View>

      {rulebooks.length === 0 ? (
        <Text style={styles.emptyText}>
          Nenhum manual em PDF anexado para consulta offline.
        </Text>
      ) : (
        rulebooks.map((rb) => (
          <View key={rb.id} style={styles.card}>
            {editingId === rb.id ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editingLabel}
                  onChangeText={setEditingLabel}
                  maxLength={120}
                />
                <TouchableOpacity
                  style={styles.saveEditBtn}
                  onPress={async () => {
                    await renameRulebook(rb.id, editingLabel);
                    setEditingId(null);
                  }}
                >
                  <Text style={styles.saveEditText}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => setEditingId(null)}
                >
                  <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.mainInfo}
                  onPress={() => openReader(rb.id)}
                >
                  <Text style={styles.docLabel}>{rb.label}</Text>
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
                      <TouchableOpacity
                        style={styles.cancelEditBtn}
                        onPress={() => setConfirmDelete(null)}
                      >
                        <Text style={styles.cancelEditText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmDelBtn}
                        onPress={async () => {
                          await deleteRulebook(rb.id);
                          setConfirmDelete(null);
                        }}
                      >
                        <Text style={styles.saveEditText}>Apagar Manual</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
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
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mainInfo: {
    marginBottom: 6,
  },
  docLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  docMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 6,
  },
  readLink: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  actionLink: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteLink: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#f8fafc',
    fontSize: 13,
  },
  saveEditBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveEditText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelEditBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelEditText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  confirmBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  confirmText: {
    color: '#fca5a5',
    fontSize: 12,
    marginBottom: 8,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmDelBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  webFallback: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  webFallbackText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});

