import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PlaySession } from '@/services/playlog-types';
import { Badge, Card, tokens } from '@/ui';

interface PlayHistoryProps {
  sessions: PlaySession[];
  onEdit: (session: PlaySession) => void;
  onDelete: (sessionId: number) => Promise<void>;
}

export function PlayHistory({ sessions, onEdit, onDelete }: PlayHistoryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (sessions.length === 0) {
    return (
      <Text style={styles.emptyText}>Nenhuma partida registrada para este jogo.</Text>
    );
  }

  return (
    <View style={styles.list}>
      {sessions.map((s) => (
        <Card key={s.id} variant="sunken" padding="sm" style={styles.sessionCard}>
          <View style={styles.topRow}>
            <Text style={styles.dateText}>
              📅 {s.playedOn}
              {s.durationMinutes ? ` • ${s.durationMinutes} min` : ''}
            </Text>
            <Badge
              tone={
                s.outcome === 'COOP_WIN'
                  ? 'success'
                  : s.outcome === 'COOP_LOSS'
                  ? 'danger'
                  : 'info'
              }
              label={
                s.outcome === 'COOP_WIN'
                  ? 'Vitória do grupo'
                  : s.outcome === 'COOP_LOSS'
                  ? 'Derrota do grupo'
                  : 'Competitivo'
              }
            />
          </View>

          <View style={styles.participantsWrap}>
            {s.participants.map((p) => (
              <Text
                key={p.playerId}
                style={[styles.partText, p.isWinner && styles.winnerPartText]}
              >
                {p.isWinner ? '🏆 ' : ''}
                {p.playerName}
                {p.score !== null && p.score !== undefined ? ` (${p.score})` : ''}
              </Text>
            ))}
          </View>

          {s.comments ? <Text style={styles.commentText}>"{s.comments}"</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => onEdit(s)}>
              <Text style={styles.editLink}>Editar</Text>
            </TouchableOpacity>
            {confirmDeleteId === s.id ? (
              <TouchableOpacity
                onPress={async () => {
                  await onDelete(s.id);
                  setConfirmDeleteId(null);
                }}
              >
                <Text style={styles.confirmDelLink}>Confirmar exclusão</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setConfirmDeleteId(s.id)}>
                <Text style={styles.delLink}>Excluir</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontStyle: 'italic',
  },
  list: {
    gap: tokens.spacing.xs,
  },
  sessionCard: {
    marginBottom: tokens.spacing['2xs'],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing['2xs'],
  },
  dateText: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  participantsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing['2xs'],
  },
  partText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontVariant: ['tabular-nums'],
  },
  winnerPartText: {
    color: tokens.colors.accent.primary,
    fontWeight: tokens.typography.weights.bold,
  },
  commentText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontStyle: 'italic',
    marginTop: tokens.spacing['2xs'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
    paddingTop: tokens.spacing['2xs'],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.subtle,
  },
  editLink: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  delLink: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  confirmDelLink: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
});
