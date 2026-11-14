import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayStats } from '@/services/playlog-types';

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
    <View style={styles.card}>
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
              <View key={w.playerId} style={styles.winBadge}>
                <Text style={styles.winBadgeText}>
                  🏆 {w.playerName}: {w.wins} ({w.plays}j)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
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
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  coopText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  winsBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  winsTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  winsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  winBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winBadgeText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
});

