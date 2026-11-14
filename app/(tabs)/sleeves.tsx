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

type TabSection = 'shopping' | 'inventory';

export default function SleevesScreen() {
  const { inventory, shoppingList, loading, refresh } = useSleeves();
  const [activeTab, setActiveTab] = useState<TabSection>('shopping');

  const pendingBuyCount = shoppingList
    .filter((item) => item.packsToBuy > 0)
    .reduce((sum, item) => sum + item.packsToBuy, 0);

  return (
    <View style={styles.container}>
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
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Carregando dados de sleeves...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#6366f1" />
          }
        >
          {activeTab === 'shopping' ? (
            <ShoppingListView items={shoppingList} />
          ) : (
            <InventoryListView inventory={inventory} onRefresh={refresh} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#6366f1',
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});

