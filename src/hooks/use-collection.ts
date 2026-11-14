import { useState, useEffect, useCallback, useMemo } from 'react';
import { collectionRepository, CollectionWithGame } from '@/db/repositories/collection.repository';

export function useCollection(ownedOnlyDefault = true) {
  const [items, setItems] = useState<CollectionWithGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(ownedOnlyDefault);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectionRepository.getCollectionWithGames(ownedOnly);
      setItems(data);
    } catch (err) {
      console.error('Failed to load local collection:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [ownedOnly]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) =>
      item.game.title.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  return {
    items: filteredItems,
    allItemsCount: items.length,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    ownedOnly,
    setOwnedOnly,
    refresh: loadCollection,
  };
}

