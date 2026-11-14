import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CollectionWithGame, collectionRepository } from '@/db/repositories/collection.repository';
import { BoxDimensionEditor } from './box-dimension-editor';
import { GameSleeveManagerModal } from './sleeves/game-sleeve-manager';
import { RulebookList } from './rulebooks/rulebook-list';
import { PersonalRatingInput } from './personal-rating-input';
import { PlayStatsCard } from './playlog/play-stats-card';
import { PlayHistory } from './playlog/play-history';
import { PlaySessionForm } from './playlog/play-session-form';
import { useRulebooks } from '@/hooks/use-rulebooks';
import { usePlayLog } from '@/hooks/use-play-log';
import { PlaySession, PlaySessionInput } from '@/services/playlog-types';

interface GameDetailSheetProps {
  item: CollectionWithGame | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function GameDetailSheet({ item, visible, onClose, onSaved }: GameDetailSheetProps) {
  const bggId = item?.game.bggId ?? null;
  const { hasReadyRulebook } = useRulebooks(bggId);
  const {
    sessions,
    stats,
    players,
    personalRating,
    logSession,
    updateSession,
    deleteSession,
    createPlayer,
    renamePlayer,
    hidePlayer,
    deletePlayer,
    setRating,
  } = usePlayLog(bggId);

  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDimensionEditor, setShowDimensionEditor] = useState(false);
  const [showSleeveModal, setShowSleeveModal] = useState(false);
  const [showPlayForm, setShowPlayForm] = useState(false);
  const [editingSession, setEditingSession] = useState<PlaySession | null>(null);

  useEffect(() => {
    if (item) {
      setNotes(item.collection.localNotes ?? '');
      setTags(item.collection.customTags ? JSON.parse(item.collection.customTags) : []);
      setSaveError(null);
    }
  }, [item]);

  if (!item) return null;

  const { game, collection } = item;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await collectionRepository.updateLocalEnrichments(
        collection.collId,
        notes.trim() === '' ? null : notes.trim(),
        tags.length > 0 ? tags : undefined
      );
      onSaved();
      onClose();
    } catch {
      setSaveError('Não foi possível salvar as anotações.');
    } finally {
      setSaving(false);
    }
  };

  const handleSessionSubmit = async (input: PlaySessionInput, sessionId?: number) => {
    if (sessionId) {
      return updateSession(sessionId, input);
    }
    return logSession(input);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{game.title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {game.yearPublished ? `${game.yearPublished} • ` : ''}
                {game.minPlayers && game.maxPlayers
                  ? `${game.minPlayers}-${game.maxPlayers} jogadores • `
                  : ''}
                {game.minPlaytime ? `${game.minPlaytime} min` : ''}
              </Text>
              {hasReadyRulebook && (
                <View style={styles.offlineManualBadge}>
                  <Text style={styles.offlineManualBadgeText}>📖 Manual offline</Text>
                </View>
              )}
            </View>

            {collection.bggRating ? (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Avaliação no BGG:</Text>
                <Text style={styles.ratingValue}>★ {collection.bggRating.toFixed(1)} / 10</Text>
              </View>
            ) : null}

            <PersonalRatingInput rating={personalRating} onChange={setRating} />

            {collection.bggComment ? (
              <View style={styles.bggCommentBox}>
                <Text style={styles.bggCommentTitle}>Comentário importado do BGG:</Text>
                <Text style={styles.bggCommentText}>{collection.bggComment}</Text>
              </View>
            ) : null}

            {/* Offline PDF Rulebooks Section (US1) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Manuais de Regras (PDF Offline):</Text>
              <RulebookList bggId={game.bggId} onBeforeOpenReader={onClose} />
            </View>

            {/* Play Sessions & Statistics Section (US3) */}
            <View style={styles.section}>
              <View style={styles.playHeaderRow}>
                <Text style={styles.sectionLabel}>Partidas e Estatísticas:</Text>
                <TouchableOpacity
                  style={styles.logPlayBtn}
                  onPress={() => {
                    setEditingSession(null);
                    setShowPlayForm(true);
                  }}
                >
                  <Text style={styles.logPlayBtnText}>🎲 Registrar partida</Text>
                </TouchableOpacity>
              </View>
              <PlayStatsCard stats={stats} />
              <PlayHistory
                sessions={sessions}
                onEdit={(session) => {
                  setEditingSession(session);
                  setShowPlayForm(true);
                }}
                onDelete={deleteSession}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Anotações Pessoais (Salvas apenas no app):</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="ex: Componentes guardados em ziplocks; jogado na ludoteca dia 10..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tags Personalizadas:</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Nova tag (ex: favoritos, cooperativo)..."
                  placeholderTextColor="#64748b"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                  <Text style={styles.addTagBtnText}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagBadge}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagBadgeText}>#{tag} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Proteção de Cartas (Sleeves):</Text>
              <TouchableOpacity
                style={styles.dimBtn}
                onPress={() => setShowSleeveModal(true)}
              >
                <Text style={styles.dimBtnText}>🃏 Gerenciar Sleeves e Quantidade de Cartas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Dimensões Físicas da Caixa (Estante 3D):</Text>
              <TouchableOpacity
                style={styles.dimBtn}
                onPress={() => setShowDimensionEditor(true)}
              >
                <Text style={styles.dimBtnText}>📐 Visualizar / Calibrar Medidas da Caixa</Text>
              </TouchableOpacity>
            </View>

            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Anotações'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <BoxDimensionEditor
          bggId={game.bggId}
          gameTitle={game.title}
          visible={showDimensionEditor}
          onClose={() => setShowDimensionEditor(false)}
          onSaved={onSaved}
        />

        <GameSleeveManagerModal
          bggId={game.bggId}
          gameTitle={game.title}
          visible={showSleeveModal}
          onClose={() => setShowSleeveModal(false)}
          onUpdated={onSaved}
        />

        <PlaySessionForm
          visible={showPlayForm}
          bggId={game.bggId}
          players={players}
          editingSession={editingSession}
          onClose={() => {
            setShowPlayForm(false);
            setEditingSession(null);
          }}
          onSubmit={handleSessionSubmit}
          onCreatePlayer={createPlayer}
          onRenamePlayer={renamePlayer}
          onHidePlayer={hidePlayer}
          onDeletePlayer={deletePlayer}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  meta: {
    fontSize: 14,
    color: '#94a3b8',
  },
  offlineManualBadge: {
    backgroundColor: '#065f46',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  offlineManualBadgeText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  bggCommentBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bggCommentTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  bggCommentText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  playHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logPlayBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logPlayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addTagBtn: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addTagBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: '#93c5fd',
    fontSize: 12,
  },
  dimBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4338ca',
    alignItems: 'center',
  },
  dimBtnText: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
