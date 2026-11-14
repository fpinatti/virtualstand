import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCollection } from '@/hooks/use-collection';
import { useSync } from '@/hooks/use-sync';
import { SyncProgressModal } from '@/components/sync-progress-modal';
import { GameDetailSheet } from '@/components/game-detail-sheet';
import { CollectionWithGame } from '@/db/repositories/collection.repository';
import { Badge, Card, EmptyState, Input, ScreenContainer, tokens } from '@/ui';

export default function CollectionScreen() {
  const router = useRouter();
  const { items, allItemsCount, loading, searchQuery, setSearchQuery, refresh } = useCollection();
  const { isSyncing, progress, cancelSync } = useSync();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionWithGame | null>(null);

  const renderGameItem = ({ item }: { item: CollectionWithGame }) => {
    const { game, collection } = item;
    const imageUri = game.localThumbnailUri || game.thumbnailUrl;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedItem(item)}
        style={styles.cardTouch}
      >
        <Card variant="elevated" padding="none" style={styles.card}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.noImage]}>
              <Text style={styles.noImageText}>Sem Capa</Text>
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {game.title}
            </Text>
            <Text style={styles.subtitle}>
              {game.yearPublished ? `${game.yearPublished} • ` : ''}
              {game.minPlayers && game.maxPlayers
                ? `${game.minPlayers}-${game.maxPlayers} jogadores`
                : ''}
            </Text>

            <View style={styles.tagsRow}>
              {collection.bggRating ? (
                <Badge
                  tone="accent"
                  label={`★ ${collection.bggRating.toFixed(1)}`}
                  tabularNums
                />
              ) : null}

              {collection.localNotes ? (
                <Badge tone="success" label="Nota pessoal" />
              ) : null}

              {collection.customTags ? (
                <Badge
                  tone="neutral"
                  label={`${JSON.parse(collection.customTags).length} tags`}
                  tabularNums
                />
              ) : null}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.searchHeader}>
        <Input
          placeholder="Buscar nos meus jogos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && allItemsCount === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
          <Text style={styles.emptyText}>Carregando jogos...</Text>
        </View>
      ) : allItemsCount === 0 ? (
        <EmptyState
          title="Sua estante está vazia"
          description="Importe sua coleção do BoardGameGeek para visualizar seus jogos aqui."
          actionLabel="Configurar Usuário BGG"
          onAction={() => router.push('/settings')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.collection.collId)}
          renderItem={renderGameItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={tokens.colors.accent.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Nenhum jogo encontrado"
              description={`Nenhum resultado corresponde à busca "${searchQuery}".`}
            />
          }
        />
      )}

      <SyncProgressModal
        visible={modalVisible}
        progress={progress}
        onCancel={() => {
          if (isSyncing) cancelSync();
          setModalVisible(false);
          refresh();
        }}
      />

      <GameDetailSheet
        item={selectedItem}
        visible={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onSaved={refresh}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchHeader: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xs,
    backgroundColor: tokens.colors.surface.elevated,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
  },
  listContent: {
    padding: tokens.spacing.md,
  },
  cardTouch: {
    marginBottom: tokens.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  thumbnail: {
    width: 90,
    height: 112,
    backgroundColor: tokens.colors.surface.sunken,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  info: {
    flex: 1,
    padding: tokens.spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: tokens.typography.scale.h3.fontSize,
    lineHeight: tokens.typography.scale.h3.lineHeight,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing['2xs'],
  },
  subtitle: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  emptyText: {
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
});
