import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SleeveShoppingItem } from '@/services/sleeve-types';

interface ShoppingListViewProps {
  items: SleeveShoppingItem[];
}

export function ShoppingListView({ items }: ShoppingListViewProps) {
  const itemsNeedingPurchase = items.filter((i) => i.netCardsDeficit > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Lista de Compras de Sleeves</Text>
      <Text style={styles.sectionSubtitle}>
        Calculada automaticamente cruzando cartas não envelopadas com seu estoque atual.
      </Text>

      {itemsNeedingPurchase.length === 0 ? (
        <View style={styles.allCoveredCard}>
          <Text style={styles.allCoveredTitle}>🎉 Tudo protegido!</Text>
          <Text style={styles.allCoveredText}>
            Todos os seus jogos estão com cartas envelopadas ou cobertos pelo seu estoque sobressalente.
          </Text>
        </View>
      ) : (
        itemsNeedingPurchase.map((item) => (
          <View key={item.dimensionKey} style={styles.card}>
            <View style={styles.mainRow}>
              <View style={styles.formatInfo}>
                <Text style={styles.formatName}>{item.formatName}</Text>
                <Text style={styles.dimensions}>
                  {item.widthMm} x {item.heightMm} mm
                </Text>
              </View>

              <View style={styles.buyBadge}>
                <Text style={styles.buyBadgeText}>
                  Comprar {item.packsToBuy} {item.packsToBuy === 1 ? 'pacote' : 'pacotes'}
                </Text>
              </View>
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
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 18,
  },
  allCoveredCard: {
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669',
  },
  allCoveredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34d399',
    marginBottom: 6,
  },
  allCoveredText: {
    fontSize: 13,
    color: '#a7f3d0',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 2,
  },
  dimensions: {
    fontSize: 13,
    color: '#94a3b8',
  },
  buyBadge: {
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buyBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statBold: {
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  statStock: {
    fontWeight: 'bold',
    color: '#34d399',
  },
  statDeficit: {
    fontWeight: 'bold',
    color: '#f87171',
  },
  gamesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gamesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  gamesList: {
    flex: 1,
    fontSize: 12,
    color: '#cbd5e1',
  },
});

