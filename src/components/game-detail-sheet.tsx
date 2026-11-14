import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
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
import { Badge, Button, Card, Input, SectionHeader, tokens } from '@/ui';

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
                <Badge tone="success" label="📖 Manual offline" />
              )}
            </View>

            {collection.bggRating ? (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Avaliação no BGG:</Text>
                <Badge
                  tone="accent"
                  label={`★ ${collection.bggRating.toFixed(1)} / 10`}
                  tabularNums
                />
              </View>
            ) : null}

            <PersonalRatingInput rating={personalRating} onChange={setRating} />

            {collection.bggComment ? (
              <Card variant="sunken" padding="sm" style={styles.bggCommentBox}>
                <Text style={styles.bggCommentTitle}>Comentário importado do BGG:</Text>
                <Text style={styles.bggCommentText}>{collection.bggComment}</Text>
              </Card>
            ) : null}

            {/* Offline PDF Rulebooks Section (US1) */}
            <View style={styles.section}>
              <SectionHeader title="Manuais de Regras (PDF Offline)" />
              <RulebookList bggId={game.bggId} onBeforeOpenReader={onClose} />
            </View>

            {/* Play Sessions & Statistics Section (US3) */}
            <View style={styles.section}>
              <SectionHeader
                title="Partidas e Estatísticas"
                actionLabel="🎲 Registrar partida"
                onAction={() => {
                  setEditingSession(null);
                  setShowPlayForm(true);
                }}
              />
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
              <Input
                label="Anotações Pessoais (Salvas apenas no app)"
                multiline
                numberOfLines={4}
                placeholder="ex: Componentes guardados em ziplocks; jogado na ludoteca dia 10..."
                value={notes}
                onChangeText={setNotes}
                style={styles.textArea}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Tags Personalizadas" />
              <View style={styles.tagInputRow}>
                <View style={styles.tagInputFlex}>
                  <Input
                    placeholder="Nova tag (ex: favoritos, cooperativo)..."
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                  />
                </View>
                <Button label="Adicionar" variant="secondary" size="sm" onPress={handleAddTag} />
              </View>

              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity key={tag} onPress={() => handleRemoveTag(tag)}>
                    <Badge tone="neutral" label={`#${tag} ✕`} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Proteção de Cartas (Sleeves)" />
              <Button
                label="🃏 Gerenciar Sleeves e Quantidade de Cartas"
                variant="secondary"
                onPress={() => setShowSleeveModal(true)}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Dimensões Físicas da Caixa (Estante 3D)" />
              <Button
                label="📐 Visualizar / Calibrar Medidas da Caixa"
                variant="secondary"
                onPress={() => setShowDimensionEditor(true)}
              />
            </View>

            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

            <View style={styles.saveBtnWrap}>
              <Button
                label={saving ? 'Salvando...' : 'Salvar Anotações'}
                variant="primary"
                size="lg"
                onPress={handleSave}
                disabled={saving}
                loading={saving}
              />
            </View>
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
  content: {
    padding: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing['2xs'],
  },
  title: {
    fontSize: tokens.typography.scale.h1.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  closeBtn: {
    padding: tokens.spacing['2xs'],
  },
  closeBtnText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  meta: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  ratingLabel: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
  },
  bggCommentBox: {
    marginBottom: tokens.spacing.md,
  },
  bggCommentTitle: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.muted,
    fontWeight: tokens.typography.weights.semibold,
    marginBottom: tokens.spacing['2xs'],
  },
  bggCommentText: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: tokens.spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.xs,
  },
  tagInputFlex: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  saveBtnWrap: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
});
