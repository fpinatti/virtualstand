import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

export default function CollectionScreen() {
  const router = useRouter();
  const { items, allItemsCount, loading, error, searchQuery, setSearchQuery, refresh } = useCollection();
  const { isSyncing, progress, startSync, cancelSync } = useSync();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionWithGame | null>(null);

  const renderGameItem = ({ item }: { item: CollectionWithGame }) => {
    const { game, collection } = item;
    const imageUri = game.localThumbnailUri || game.thumbnailUrl;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedItem(item)}
      >
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
            {game.minPlayers && game.maxPlayers ? `${game.minPlayers}-${game.maxPlayers} jogadores` : ''}
          </Text>

          <View style={styles.tagsRow}>
            {collection.bggRating ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {collection.bggRating.toFixed(1)}</Text>
              </View>
            ) : null}

            {collection.localNotes ? (
              <View style={styles.noteBadge}>
                <Text style={styles.noteBadgeText}>Nota pessoal</Text>
              </View>
            ) : null}

            {collection.customTags ? (
              <View style={styles.customTagsBadge}>
                <Text style={styles.customTagsText}>
                  {JSON.parse(collection.customTags).length} tags
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar nos meus jogos..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && allItemsCount === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.emptyText}>Carregando jogos...</Text>
        </View>
      ) : allItemsCount === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sua estante está vazia</Text>
          <Text style={styles.emptySubtitle}>
            Importe sua coleção do BoardGameGeek para visualizar seus jogos aqui.
          </Text>
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.importButtonText}>Configurar Usuário BGG</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.collection.collId)}
          renderItem={renderGameItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <Text style={styles.noResultsText}>Nenhum jogo encontrado com "{searchQuery}".</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchHeader: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  thumbnail: {
    width: 90,
    height: 110,
    backgroundColor: '#0f172a',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#64748b',
    fontSize: 12,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingBadge: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  noteBadge: {
    backgroundColor: '#065f46',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noteBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '500',
  },
  customTagsBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customTagsText: {
    color: '#93c5fd',
    fontSize: 11,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 32,
    fontSize: 14,
  },
  importButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
