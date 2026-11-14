import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PlaySession } from '@/services/playlog-types';

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
        <View key={s.id} style={styles.sessionCard}>
          <View style={styles.topRow}>
            <Text style={styles.dateText}>
              📅 {s.playedOn}
              {s.durationMinutes ? ` • ${s.durationMinutes} min` : ''}
            </Text>
            <Text style={styles.outcomeBadge}>
              {s.outcome === 'COOP_WIN'
                ? 'Vitória do grupo'
                : s.outcome === 'COOP_LOSS'
                ? 'Derrota do grupo'
                : 'Competitivo'}
            </Text>
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  list: {
    gap: 8,
  },
  sessionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  outcomeBadge: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
  },
  participantsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  partText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  winnerPartText: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  commentText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  editLink: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  delLink: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmDelLink: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
});

