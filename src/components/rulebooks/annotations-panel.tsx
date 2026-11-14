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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.content}>
            {/* Quick Add on Current Page */}
            <View style={styles.addCard}>
              <Text style={styles.sectionTitle}>Adicionar na Página {currentPage}</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="Título do marcador (ex: Pontuação final)"
                  placeholderTextColor="#64748b"
                  value={newBookmarkTitle}
                  onChangeText={setNewBookmarkTitle}
                  maxLength={80}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateBookmark}>
                  <Text style={styles.primaryBtnText}>+ Marcador</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nova nota de regra ou esclarecimento..."
                placeholderTextColor="#64748b"
                value={newNoteBody}
                onChangeText={setNewNoteBody}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleCreateNote}>
                <Text style={styles.secondaryBtnText}>+ Adicionar Nota na Pág. {currentPage}</Text>
              </TouchableOpacity>
            </View>

            {/* Bookmarks List */}
            <Text style={styles.sectionTitle}>Marcadores ({bookmarks.length})</Text>
            {bookmarks.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum marcador registrado neste manual.</Text>
            ) : (
              bookmarks.map((bm) => (
                <View key={bm.id} style={styles.itemCard}>
                  {editingBookmarkId === bm.id ? (
                    <View style={styles.inlineRow}>
                      <TextInput
                        style={[styles.input, styles.flexInput]}
                        value={editingBookmarkText}
                        onChangeText={setEditingBookmarkText}
                        maxLength={80}
                      />
                      <TouchableOpacity
                        style={styles.smallPrimaryBtn}
                        onPress={() => handleSaveBookmarkEdit(bm.id)}
                      >
                        <Text style={styles.primaryBtnText}>Salvar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.smallGhostBtn}
                        onPress={() => setEditingBookmarkId(null)}
                      >
                        <Text style={styles.ghostBtnText}>Cancelar</Text>
                      </TouchableOpacity>
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
                        <View style={styles.pageBadge}>
                          <Text style={styles.pageBadgeText}>Pág. {bm.page}</Text>
                        </View>
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
                </View>
              ))
            )}

            {/* Notes List */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Notas por Página ({notes.length})
            </Text>
            {notes.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma nota adicionada neste manual.</Text>
            ) : (
              notes.map((note) => (
                <View key={note.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <TouchableOpacity
                      style={styles.itemMain}
                      disabled={!note.isPageAvailable}
                      onPress={() => {
                        onNavigate(note.page);
                        onClose();
                      }}
                    >
                      <View style={styles.notePageBadge}>
                        <Text style={styles.pageBadgeText}>Pág. {note.page}</Text>
                      </View>
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
                    <View style={{ marginTop: 8 }}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={editingNoteText}
                        onChangeText={setEditingNoteText}
                        multiline
                        maxLength={2000}
                      />
                      <View style={styles.inlineRow}>
                        <TouchableOpacity
                          style={styles.smallPrimaryBtn}
                          onPress={() => handleSaveNoteEdit(note.id)}
                        >
                          <Text style={styles.primaryBtnText}>Salvar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.smallGhostBtn}
                          onPress={() => setEditingNoteId(null)}
                        >
                          <Text style={styles.ghostBtnText}>Cancelar</Text>
                        </TouchableOpacity>
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
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  closeText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  addCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  flexInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#334155',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  smallPrimaryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallGhostBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ghostBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
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
    gap: 8,
  },
  pageBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notePageBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pageBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  unavailableBadge: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  deleteConfirmLink: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  noteBodyText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
});

