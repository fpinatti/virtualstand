import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayStats } from '@/services/playlog-types';
import { Badge, Card, tokens } from '@/ui';

interface PlayStatsCardProps {
  stats: PlayStats;
}

function formatIsoToPtBr(iso: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function PlayStatsCard({ stats }: PlayStatsCardProps) {
  return (
    <Card variant="sunken" padding="sm" style={styles.card}>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {stats.totalPlays} {stats.totalPlays === 1 ? 'partida' : 'partidas'}
          </Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatIsoToPtBr(stats.lastPlayedOn)}</Text>
          <Text style={styles.metricLabel}>Última</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {stats.averageDurationMinutes ? `${stats.averageDurationMinutes} min` : '—'}
          </Text>
          <Text style={styles.metricLabel}>Duração média</Text>
        </View>
      </View>

      {(stats.coopRecord.wins > 0 || stats.coopRecord.losses > 0) && (
        <Text style={styles.coopText}>
          Cooperativo: {stats.coopRecord.wins}V – {stats.coopRecord.losses}D
        </Text>
      )}

      {stats.winsByPlayer.length > 0 && (
        <View style={styles.winsBox}>
          <Text style={styles.winsTitle}>Vitórias por Jogador:</Text>
          <View style={styles.winsList}>
            {stats.winsByPlayer.map((w) => (
              <Badge
                key={w.playerId}
                tone="accent"
                label={`🏆 ${w.playerName}: ${w.wins} (${w.plays}j)`}
                tabularNums
              />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: tokens.spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginTop: 2,
  },
  coopText: {
    color: tokens.colors.semantic.info,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  winsBox: {
    marginTop: tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.subtle,
    paddingTop: tokens.spacing.xs,
  },
  winsTitle: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    marginBottom: tokens.spacing['2xs'],
  },
  winsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing['2xs'],
  },
});
