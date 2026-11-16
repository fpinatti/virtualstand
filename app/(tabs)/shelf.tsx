import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useShelfCollection } from '@/hooks/use-shelf-collection';
import { ShelfScene } from '@/components/shelf-3d/shelf-scene';
import { GameDetailSheet } from '@/components/game-detail-sheet';
import { CameraFocusSide } from '@/components/shelf-3d/types';
import { collectionRepository, CollectionWithGame } from '@/db/repositories/collection.repository';
import { Badge, Button, EmptyState, ScreenContainer, tokens } from '@/ui';

export default function ShelfScreen() {
  const router = useRouter();
  const { aisle, aisleBoxes, cameraBounds, loading, refresh } = useShelfCollection();
  const [selectedGame, setSelectedGame] = useState<CollectionWithGame | null>(null);
  const [focusSide, setFocusSide] = useState<CameraFocusSide>('CENTER');
  const [targetZ, setTargetZ] = useState<number>(cameraBounds.defaultZ);

  useEffect(() => {
    setTargetZ(cameraBounds.defaultZ);
  }, [cameraBounds.defaultZ]);

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

  const handleResetCenterView = () => {
    setFocusSide('CENTER');
  };

  const handleReturnToEntrance = () => {
    setFocusSide('CENTER');
    setTargetZ(cameraBounds.defaultZ);
  };

  if (loading && aisleBoxes.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
          <Text style={styles.loadingText}>Construindo corredor 3D de estantes...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (aisleBoxes.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Nenhum jogo na estante"
          description="Importe seus jogos do BoardGameGeek para posicioná-los no corredor 3D em escala real."
          actionLabel="Importar Coleção"
          onAction={() => router.push('/settings')}
        />
      </ScreenContainer>
    );
  }

  const isMovedFromEntrance = Math.abs(targetZ - cameraBounds.defaultZ) > 0.4;

  return (
    <View style={styles.container}>
      {aisle && (
        <ShelfScene
          aisle={aisle}
          boxes={aisleBoxes}
          cameraBounds={cameraBounds}
          focusSide={focusSide}
          targetZ={targetZ}
          onChangeFocusSide={setFocusSide}
          onChangeTargetZ={setTargetZ}
          onOpenGameDetails={handleOpenGameDetails}
        />
      )}

      {/* Top HUD: Hint + Game count badge */}
      <View style={styles.topHudRow} pointerEvents="box-none">
        <View style={styles.hintPill}>
          <Text style={styles.hintText}>
            ↕ Deslize p/ caminhar pelo corredor • Toque num lado p/ virar
          </Text>
        </View>
        <Badge tone="accent" label={`${aisleBoxes.length} jogos`} tabularNums />
      </View>

      {/* Bottom HUD: Left / Central Default / Right Camera Controls */}
      <View style={styles.bottomHudWrapper} pointerEvents="box-none">
        <View style={styles.bottomHudBar}>
          <Button
            label="◀ Estante Esq."
            variant={focusSide === 'LEFT' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setFocusSide('LEFT')}
          />

          <Button
            label="Visão Central"
            variant={focusSide === 'CENTER' ? 'primary' : 'secondary'}
            size="sm"
            onPress={handleResetCenterView}
          />

          <Button
            label="Estante Dir. ▶"
            variant={focusSide === 'RIGHT' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setFocusSide('RIGHT')}
          />

          {isMovedFromEntrance && (
            <Button
              label="Início"
              variant="ghost"
              size="sm"
              onPress={handleReturnToEntrance}
            />
          )}
        </View>
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
  topHudRow: {
    position: 'absolute',
    top: tokens.spacing.md,
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  hintPill: {
    backgroundColor: tokens.colors.surface.glassOverlay,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    flexShrink: 1,
  },
  hintText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.micro.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  bottomHudWrapper: {
    position: 'absolute',
    bottom: tokens.spacing.lg,
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    alignItems: 'center',
  },
  bottomHudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface.glassOverlay,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.xl,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
});
