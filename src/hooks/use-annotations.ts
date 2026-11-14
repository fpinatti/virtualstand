import { useState, useEffect, useCallback } from 'react';
import { Bookmark, PageNote } from '@/services/rulebook-types';
import { annotationService } from '@/services/annotation.service';

export function useAnnotations(rulebookId: number | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<PageNote[]>([]);
  const [bookmarkedPages, setBookmarkedPages] = useState<Set<number>>(new Set());
  const [notedPages, setNotedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!rulebookId) {
      setBookmarks([]);
      setNotes([]);
      setBookmarkedPages(new Set());
      setNotedPages(new Set());
      return;
    }
    setLoading(true);
    try {
      const [bList, nList, sets] = await Promise.all([
        annotationService.listBookmarks(rulebookId),
        annotationService.listNotes(rulebookId),
        annotationService.annotatedPages(rulebookId),
      ]);
      setBookmarks(bList);
      setNotes(nList);
      setBookmarkedPages(sets.bookmarked);
      setNotedPages(sets.noted);
    } finally {
      setLoading(false);
    }
  }, [rulebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addBookmark = useCallback(
    async (page: number, title: string) => {
      if (!rulebookId) return;
      await annotationService.addBookmark(rulebookId, page, title);
      await refresh();
    },
    [rulebookId, refresh]
  );

  const updateBookmark = useCallback(
    async (id: number, title: string) => {
      await annotationService.updateBookmark(id, title);
      await refresh();
    },
    [refresh]
  );

  const deleteBookmark = useCallback(
    async (id: number) => {
      await annotationService.deleteBookmark(id);
      await refresh();
    },
    [refresh]
  );

  const addNote = useCallback(
    async (page: number, body: string) => {
      if (!rulebookId) return;
      await annotationService.addNote(rulebookId, page, body);
      await refresh();
    },
    [rulebookId, refresh]
  );

  const updateNote = useCallback(
    async (id: number, body: string) => {
      await annotationService.updateNote(id, body);
      await refresh();
    },
    [refresh]
  );

  const deleteNote = useCallback(
    async (id: number) => {
      await annotationService.deleteNote(id);
      await refresh();
    },
    [refresh]
  );

  return {
    bookmarks,
    notes,
    bookmarkedPages,
    notedPages,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    addNote,
    updateNote,
    deleteNote,
    refresh,
  };
}

