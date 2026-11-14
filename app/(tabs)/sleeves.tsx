import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSleeves } from '@/hooks/use-sleeves';
import { ShoppingListView } from '@/components/sleeves/shopping-list-view';
import { InventoryListView } from '@/components/sleeves/inventory-list';
import { ScreenContainer, tokens } from '@/ui';

type TabSection = 'shopping' | 'inventory';

export default function SleevesScreen() {
  const { inventory, shoppingList, loading, refresh } = useSleeves();
  const [activeTab, setActiveTab] = useState<TabSection>('shopping');

  const pendingBuyCount = shoppingList
    .filter((item) => item.packsToBuy > 0)
    .reduce((sum, item) => sum + item.packsToBuy, 0);

  return (
    <ScreenContainer padded={false}>
      {/* Top Segmented Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'shopping' && styles.activeTabButton]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'shopping' && styles.activeTabButtonText]}
          >
            Lista de Compras {pendingBuyCount > 0 ? `(${pendingBuyCount} pct)` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inventory' && styles.activeTabButton]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'inventory' && styles.activeTabButtonText]}
          >
            Meu Estoque ({inventory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading && inventory.length === 0 && shoppingList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
          <Text style={styles.loadingText}>Carregando dados de sleeves...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={tokens.colors.accent.primary}
            />
          }
        >
          {activeTab === 'shopping' ? (
            <ShoppingListView items={shoppingList} />
          ) : (
            <InventoryListView inventory={inventory} onRefresh={refresh} />
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface.elevated,
    padding: tokens.spacing['2xs'],
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  tabButton: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    borderRadius: tokens.radius.md,
  },
  activeTabButton: {
    backgroundColor: tokens.colors.accent.primary,
  },
  tabButtonText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    fontVariant: ['tabular-nums'],
  },
  activeTabButtonText: {
    color: tokens.colors.text.inverse,
    fontWeight: tokens.typography.weights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  loadingText: {
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.xl,
  },
});
