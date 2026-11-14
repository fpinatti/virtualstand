import { useState, useEffect, useCallback } from 'react';
import { SleeveInventoryItem, SleeveShoppingItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';

export function useSleeves() {
  const [inventory, setInventory] = useState<SleeveInventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<SleeveShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, shop] = await Promise.all([
        sleeveManagerService.getInventory(),
        sleeveManagerService.calculateShoppingList(),
      ]);
      setInventory(inv);
      setShoppingList(shop);
    } catch (err) {
      console.error('Failed to load sleeve inventory & shopping list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    inventory,
    shoppingList,
    loading,
    refresh: loadData,
  };
}

