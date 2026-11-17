import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameSleeveInfoProps, GameSleeveItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';
import { isZeroCardGame } from '@/data/community-sleeves-catalog';
import { Badge, Card, SectionHeader, tokens } from '@/ui';

export function GameSleeveInfoSection({ bggId }: GameSleeveInfoProps) {
  const [sleeves, setSleeves] = useState<GameSleeveItem[]>([]);

  const loadSleeves = useCallback(async () => {
    try {
      const data = await sleeveManagerService.getGameSleeves(bggId);
      setSleeves(data);
    } catch (err) {
      console.error('Failed to load game sleeves:', err);
    }
  }, [bggId]);

  useEffect(() => {
    loadSleeves();
  }, [loadSleeves]);

  const totalCards = sleeves.reduce((sum, s) => sum + s.cardCount, 0);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Sleeves"
        badgeText={totalCards > 0 ? `${totalCards} cartas` : undefined}
      />

      {sleeves.length === 0 ? (
        isZeroCardGame(bggId) ? (
          <View style={styles.zeroCardBox}>
            <Text style={styles.zeroCardText}>
              Este jogo não utiliza cartas (jogos de peças/tabuleiro).
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>
            Nenhum requisito de sleeve registrado para este jogo.
          </Text>
        )
      ) : (
        sleeves.map((s) => (
          <Card
            key={s.id || `${s.cardSetName}-${s.widthMm}x${s.heightMm}`}
            variant="sunken"
            padding="sm"
            style={styles.sleeveRow}
          >
            <View style={styles.sleeveInfo}>
              {s.cardSetName && s.cardSetName !== s.formatName ? (
                <Text style={styles.setName}>{s.cardSetName}</Text>
              ) : null}
              <Text style={styles.formatText}>
                {s.formatName} • {s.widthMm} x {s.heightMm} mm
              </Text>
            </View>

            <Badge tone="accent" label={`${s.cardCount} un.`} tabularNums />
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  emptyText: {
    color: tokens.colors.text.muted,
    fontStyle: 'italic',
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
  zeroCardBox: {
    backgroundColor: tokens.colors.surface.card,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.semantic.success,
  },
  zeroCardText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  sleeveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  sleeveInfo: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  setName: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.weights.semibold,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    marginBottom: 2,
  },
  formatText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontVariant: ['tabular-nums'],
  },
});
