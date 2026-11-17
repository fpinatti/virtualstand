import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CollectionWithGame } from '@/db/repositories/collection.repository';
import { gameRepository } from '@/db/repositories/game.repository';
import { BoxDimension } from '@/db/schema';
import { GameSleeveInfoSection } from './sleeves/game-sleeve-info';
import { RulebookList } from './rulebooks/rulebook-list';
import { PersonalRatingInput } from './personal-rating-input';
import { PlayStatsCard } from './playlog/play-stats-card';
import { PlayHistory } from './playlog/play-history';
import { PlaySessionForm } from './playlog/play-session-form';
import { useRulebooks } from '@/hooks/use-rulebooks';
import { usePlayLog } from '@/hooks/use-play-log';
import { PlaySession, PlaySessionInput } from '@/services/playlog-types';
import { Badge, Card, SectionHeader, tokens } from '@/ui';

interface GameDetailSheetProps {
  item: CollectionWithGame | null;
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
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

  const [dimensions, setDimensions] = useState<BoxDimension | null>(null);
  const [showPlayForm, setShowPlayForm] = useState(false);
  const [editingSession, setEditingSession] = useState<PlaySession | null>(null);

  useEffect(() => {
    if (bggId && visible) {
      gameRepository.getDimensionsByBggId(bggId).then((dim) => {
        setDimensions(dim ?? null);
      });
    }
  }, [bggId, visible]);

  if (!item) return null;

  const { game, collection } = item;

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

            {/* Direct Per-Game Sleeve Information (Clean, Read-Only) */}
            <View style={styles.section}>
              <GameSleeveInfoSection bggId={game.bggId} />
            </View>

            {/* Offline PDF Rulebooks Section with PT-BR download */}
            <View style={styles.section}>
              <SectionHeader title="Manuais de Regras (PDF Offline)" />
              <RulebookList bggId={game.bggId} onBeforeOpenReader={onClose} />
            </View>

            {/* Physical Box Dimensions (Read-Only) */}
            <View style={styles.section}>
              <SectionHeader title="Dimensões Físicas da Caixa (Estante 3D)" />
              <Card variant="sunken" padding="sm" style={styles.dimensionCard}>
                <View style={styles.dimensionRow}>
                  <Text style={styles.dimensionValues}>
                    {dimensions
                      ? `${dimensions.widthCm.toFixed(1)} × ${dimensions.heightCm.toFixed(1)} × ${dimensions.depthCm.toFixed(1)} cm`
                      : '29.7 × 29.7 × 7.1 cm (Padrão Euro)'}
                  </Text>
                  <Badge
                    tone={dimensions?.isEstimated ? 'warning' : 'accent'}
                    label={dimensions?.isEstimated ? 'Estimada' : 'Verificada'}
                  />
                </View>
                <Text style={styles.dimensionHint}>
                  Largura × Altura × Profundidade da caixa física
                </Text>
              </Card>
            </View>

            {/* Play Sessions & Statistics Section */}
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
          </ScrollView>
        </View>

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
    paddingBottom: tokens.spacing.xxl,
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
  dimensionCard: {
    marginTop: tokens.spacing.xs,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimensionValues: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.scale.body.fontSize,
    fontVariant: ['tabular-nums'],
  },
  dimensionHint: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginTop: tokens.spacing['2xs'],
  },
});
