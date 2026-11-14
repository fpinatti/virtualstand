import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Bookmark, PageNote } from '@/services/rulebook-types';
import { Badge, Button, Card, tokens } from '@/ui';

interface AnnotationsPanelProps {
  visible: boolean;
  currentPage: number;
  bookmarks: Bookmark[];
  notes: PageNote[];
  onClose: () => void;
  onNavigate: (page: number) => void;
  onAddBookmark: (page: number, title: string) => Promise<void>;
  onUpdateBookmark: (id: number, title: string) => Promise<void>;
  onDeleteBookmark: (id: number) => Promise<void>;
  onAddNote: (page: number, body: string) => Promise<void>;
  onUpdateNote: (id: number, body: string) => Promise<void>;
  onDeleteNote: (id: number) => Promise<void>;
}

export function AnnotationsPanel({
  visible,
  currentPage,
  bookmarks,
  notes,
  onClose,
  onNavigate,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: AnnotationsPanelProps) {
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<number | null>(null);
  const [editingBookmarkText, setEditingBookmarkText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [confirmDeleteBookmarkId, setConfirmDeleteBookmarkId] = useState<number | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateBookmark = async () => {
    setErrorMsg(null);
    if (!newBookmarkTitle.trim()) {
      setErrorMsg('Informe um título para o marcador.');
      return;
    }
    try {
      await onAddBookmark(currentPage, newBookmarkTitle.trim());
      setNewBookmarkTitle('');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao salvar marcador.');
    }
  };

  const handleCreateNote = async () => {
    setErrorMsg(null);
    if (!newNoteBody.trim()) {
      setErrorMsg('Informe o texto da nota.');
      return;
    }
    try {
      await onAddNote(currentPage, newNoteBody.trim());
      setNewNoteBody('');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao salvar nota.');
    }
  };

  const handleSaveBookmarkEdit = async (id: number) => {
    if (!editingBookmarkText.trim()) return;
    await onUpdateBookmark(id, editingBookmarkText.trim());
    setEditingBookmarkId(null);
    setEditingBookmarkText('');
  };

  const handleSaveNoteEdit = async (id: number) => {
    if (!editingNoteText.trim()) return;
    await onUpdateNote(id, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Marcadores e Notas (Pág. {currentPage})</Text>
            <Button label="Fechar" variant="secondary" size="sm" onPress={onClose} />
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.content}>
            {/* Quick Add on Current Page */}
            <Card variant="sunken" padding="sm" style={styles.addCard}>
              <Text style={styles.sectionTitle}>Adicionar na Página {currentPage}</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="Título do marcador (ex: Pontuação final)"
                  placeholderTextColor={tokens.colors.text.muted}
                  value={newBookmarkTitle}
                  onChangeText={setNewBookmarkTitle}
                  maxLength={80}
                />
                <Button
                  label="+ Marcador"
                  variant="primary"
                  size="sm"
                  onPress={handleCreateBookmark}
                />
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nova nota de regra ou esclarecimento..."
                placeholderTextColor={tokens.colors.text.muted}
                value={newNoteBody}
                onChangeText={setNewNoteBody}
                multiline
                maxLength={2000}
              />
              <Button
                label={`+ Adicionar Nota na Pág. ${currentPage}`}
                variant="secondary"
                size="sm"
                onPress={handleCreateNote}
              />
            </Card>

            {/* Bookmarks List */}
            <Text style={styles.sectionTitle}>Marcadores ({bookmarks.length})</Text>
            {bookmarks.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum marcador registrado neste manual.</Text>
            ) : (
              bookmarks.map((bm) => (
                <Card key={bm.id} variant="sunken" padding="sm" style={styles.itemCard}>
                  {editingBookmarkId === bm.id ? (
                    <View style={styles.inlineRow}>
                      <TextInput
                        style={[styles.input, styles.flexInput]}
                        value={editingBookmarkText}
                        onChangeText={setEditingBookmarkText}
                        maxLength={80}
                      />
                      <Button
                        label="Salvar"
                        variant="primary"
                        size="sm"
                        onPress={() => handleSaveBookmarkEdit(bm.id)}
                      />
                      <Button
                        label="Cancelar"
                        variant="secondary"
                        size="sm"
                        onPress={() => setEditingBookmarkId(null)}
                      />
                    </View>
                  ) : (
                    <View style={styles.itemHeader}>
                      <TouchableOpacity
                        style={styles.itemMain}
                        disabled={!bm.isPageAvailable}
                        onPress={() => {
                          onNavigate(bm.page);
                          onClose();
                        }}
                      >
                        <Badge tone="accent" label={`Pág. ${bm.page}`} tabularNums />
                        <View style={styles.itemTextWrap}>
                          <Text style={styles.itemTitle}>{bm.title}</Text>
                          {!bm.isPageAvailable && (
                            <Text style={styles.unavailableBadge}>página indisponível</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingBookmarkId(bm.id);
                            setEditingBookmarkText(bm.title);
                          }}
                        >
                          <Text style={styles.actionLink}>Editar</Text>
                        </TouchableOpacity>
                        {confirmDeleteBookmarkId === bm.id ? (
                          <TouchableOpacity
                            onPress={async () => {
                              await onDeleteBookmark(bm.id);
                              setConfirmDeleteBookmarkId(null);
                            }}
                          >
                            <Text style={styles.deleteConfirmLink}>Confirmar</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity onPress={() => setConfirmDeleteBookmarkId(bm.id)}>
                            <Text style={styles.deleteLink}>Excluir</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </Card>
              ))
            )}

            {/* Notes List */}
            <Text style={[styles.sectionTitle, { marginTop: tokens.spacing.md }]}>
              Notas por Página ({notes.length})
            </Text>
            {notes.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma nota adicionada neste manual.</Text>
            ) : (
              notes.map((note) => (
                <Card key={note.id} variant="sunken" padding="sm" style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <TouchableOpacity
                      style={styles.itemMain}
                      disabled={!note.isPageAvailable}
                      onPress={() => {
                        onNavigate(note.page);
                        onClose();
                      }}
                    >
                      <Badge tone="info" label={`Pág. ${note.page}`} tabularNums />
                      {!note.isPageAvailable && (
                        <Text style={styles.unavailableBadge}>página indisponível</Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingNoteId(note.id);
                          setEditingNoteText(note.body);
                        }}
                      >
                        <Text style={styles.actionLink}>Editar</Text>
                      </TouchableOpacity>
                      {confirmDeleteNoteId === note.id ? (
                        <TouchableOpacity
                          onPress={async () => {
                            await onDeleteNote(note.id);
                            setConfirmDeleteNoteId(null);
                          }}
                        >
                          <Text style={styles.deleteConfirmLink}>Confirmar</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => setConfirmDeleteNoteId(note.id)}>
                          <Text style={styles.deleteLink}>Excluir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {editingNoteId === note.id ? (
                    <View style={{ marginTop: tokens.spacing.xs }}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={editingNoteText}
                        onChangeText={setEditingNoteText}
                        multiline
                        maxLength={2000}
                      />
                      <View style={styles.inlineRow}>
                        <Button
                          label="Salvar"
                          variant="primary"
                          size="sm"
                          onPress={() => handleSaveNoteEdit(note.id)}
                        />
                        <Button
                          label="Cancelar"
                          variant="secondary"
                          size="sm"
                          onPress={() => setEditingNoteId(null)}
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={!note.isPageAvailable}
                      onPress={() => {
                        onNavigate(note.page);
                        onClose();
                      }}
                    >
                      <Text style={styles.noteBodyText}>{note.body}</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: tokens.colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.colors.surface.elevated,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
  },
  title: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  errorBox: {
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface.sunken,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.danger,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  addCard: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.bold,
    marginBottom: tokens.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  flexInput: {
    flex: 1,
  },
  input: {
    backgroundColor: tokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: tokens.spacing.xs,
  },
  emptyText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontStyle: 'italic',
    marginBottom: tokens.spacing.xs,
  },
  itemCard: {
    marginBottom: tokens.spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: tokens.spacing.xs,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  unavailableBadge: {
    color: tokens.colors.semantic.warning,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
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
  deleteConfirmLink: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
  noteBodyText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginTop: tokens.spacing.xs,
    lineHeight: tokens.typography.scale.bodySm.lineHeight,
  },
});
