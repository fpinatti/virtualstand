import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useShelfCollection } from '@/hooks/use-shelf-collection';
import { ShelfScene } from '@/components/shelf-3d/shelf-scene';
import { GameDetailSheet } from '@/components/game-detail-sheet';
import { collectionRepository, CollectionWithGame } from '@/db/repositories/collection.repository';
import { Badge, EmptyState, ScreenContainer, tokens } from '@/ui';

export default function ShelfScreen() {
  const router = useRouter();
  const { shelf, boxes, loading, refresh } = useShelfCollection();
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
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
          <Text style={styles.loadingText}>Construindo estante virtual 3D...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (boxes.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Nenhum jogo na estante"
          description="Importe seus jogos do BoardGameGeek para posicioná-los na estante 3D em escala real."
          actionLabel="Importar Coleção"
          onAction={() => router.push('/settings')}
        />
      </ScreenContainer>
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
        <Badge tone="accent" label={`${boxes.length} jogos na estante`} tabularNums />
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
    backgroundColor: tokens.colors.surface.sunken,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  loadingText: {
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.scale.body.fontSize,
  },
  floatingBadge: {
    position: 'absolute',
    top: tokens.spacing.md,
    right: tokens.spacing.md,
  },
});
