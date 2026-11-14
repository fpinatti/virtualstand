import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useShelfCollection } from '@/hooks/use-shelf-collection';
import { ShelfScene } from '@/components/shelf-3d/shelf-scene';
import { GameDetailSheet } from '@/components/game-detail-sheet';
import { collectionRepository, CollectionWithGame } from '@/db/repositories/collection.repository';

export default function ShelfScreen() {
  const router = useRouter();
  const { shelf, boxes, loading, error, refresh } = useShelfCollection();
  const [selectedGame, setSelectedGame] = useState<CollectionWithGame | null>(null);

  const handleOpenGameDetails = async (bggId: number) => {
    try {
      const allItems = await collectionRepository.getCollectionWithGames();
      const found = allItems.find((item) => item.game.bggId === bggId);
      if (found) {
        setSelectedGame(found);
      }
    } catch (err) {
      console.error('Failed to open game details:', err);
    }
  };

  if (loading && boxes.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Construindo estante virtual 3D...</Text>
      </View>
    );
  }

  if (boxes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhum jogo na estante</Text>
        <Text style={styles.emptySubtitle}>
          Importe seus jogos do BoardGameGeek para posicioná-los na estante 3D em escala real.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/settings')}>
          <Text style={styles.btnText}>Importar Coleção</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {shelf && (
        <ShelfScene
          shelf={shelf}
          boxes={boxes}
          onOpenGameDetails={handleOpenGameDetails}
        />
      )}

      {/* Floating game count badge */}
      <View style={styles.floatingBadge}>
        <Text style={styles.badgeText}>{boxes.length} jogos na estante</Text>
      </View>

      <GameDetailSheet
        item={selectedGame}
        visible={selectedGame !== null}
        onClose={() => setSelectedGame(null)}
        onSaved={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  floatingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});

