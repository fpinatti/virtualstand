import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SleeveShoppingItem } from '@/services/sleeve-types';
import { Badge, Card, EmptyState, SectionHeader, tokens } from '@/ui';

interface ShoppingListViewProps {
  items: SleeveShoppingItem[];
}

export function ShoppingListView({ items }: ShoppingListViewProps) {
  const itemsNeedingPurchase = items.filter((i) => i.netCardsDeficit > 0);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Lista de Compras de Sleeves"
        subtitle="Calculada automaticamente cruzando cartas não envelopadas com seu estoque atual."
      />

      {itemsNeedingPurchase.length === 0 ? (
        <EmptyState
          title="Tudo protegido!"
          description="Todos os seus jogos estão com cartas envelopadas ou cobertos pelo seu estoque sobressalente."
        />
      ) : (
        itemsNeedingPurchase.map((item) => (
          <Card key={item.dimensionKey} variant="elevated" padding="md" style={styles.card}>
            <View style={styles.mainRow}>
              <View style={styles.formatInfo}>
                <Text style={styles.formatName}>{item.formatName}</Text>
                <Text style={styles.dimensions}>
                  {item.widthMm} x {item.heightMm} mm
                </Text>
              </View>

              <Badge
                tone="accent"
                label={`Comprar ${item.packsToBuy} ${item.packsToBuy === 1 ? 'pacote' : 'pacotes'}`}
                tabularNums
              />
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                Necessárias: <Text style={styles.statBold}>{item.totalCardsNeeded}</Text>
              </Text>
              <Text style={styles.statText}>
                Em estoque: <Text style={styles.statStock}>{item.totalStockAvailable}</Text>
              </Text>
              <Text style={styles.statText}>
                Déficit: <Text style={styles.statDeficit}>{item.netCardsDeficit}</Text>
              </Text>
            </View>

            {item.affectedGameTitles.length > 0 && (
              <View style={styles.gamesRow}>
                <Text style={styles.gamesLabel}>Jogos:</Text>
                <Text style={styles.gamesList} numberOfLines={2}>
                  {item.affectedGameTitles.join(', ')}
                </Text>
              </View>
            )}
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.xl,
  },
  card: {
    marginBottom: tokens.spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  formatInfo: {
    flex: 1,
    marginRight: tokens.spacing.xs,
  },
  formatName: {
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing['2xs'],
  },
  dimensions: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.colors.border.subtle,
    marginBottom: tokens.spacing.xs,
  },
  statText: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  statBold: {
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  statStock: {
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.semantic.success,
  },
  statDeficit: {
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.semantic.danger,
  },
  gamesRow: {
    flexDirection: 'row',
    gap: tokens.spacing['2xs'],
  },
  gamesLabel: {
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.text.muted,
  },
  gamesList: {
    flex: 1,
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.secondary,
  },
});
