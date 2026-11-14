import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Rulebook } from '@/services/rulebook-types';
import { rulebookService } from '@/services/rulebook.service';
import { useAnnotations } from '@/hooks/use-annotations';
import { AnnotationsPanel } from './annotations-panel';

interface PdfReaderProps {
  rulebook: Rulebook;
  onVerified?: (pageCount: number) => void;
  onUnreadable?: () => void;
}

export function PdfReader({ rulebook, onVerified }: PdfReaderProps) {
  const [currentPage, setCurrentPage] = useState<number>(
    Math.max(1, rulebook.lastViewedPage || 1)
  );
  const [totalPages, setTotalPages] = useState<number>(rulebook.pageCount ?? 1);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState(false);

  const latestPageRef = useRef<number>(currentPage);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    bookmarks,
    notes,
    bookmarkedPages,
    notedPages,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    addNote,
    updateNote,
    deleteNote,
  } = useAnnotations(rulebook.id);

  useEffect(() => {
    if (rulebook.status === 'PENDING_VERIFICATION') {
      const pages = rulebook.pageCount ?? 1;
      setTotalPages(pages);
      rulebookService.markVerified(rulebook.id, pages).then(() => {
        if (onVerified) onVerified(pages);
      }).catch(() => {});
    }
  }, [rulebook.id, rulebook.status, rulebook.pageCount, onVerified]);

  const scheduleSavePage = useCallback(
    (page: number) => {
      latestPageRef.current = page;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        rulebookService.saveLastViewedPage(rulebook.id, page).catch(() => {});
      }, 500);
    },
    [rulebook.id]
  );

  const navigateToPage = (targetPage: number) => {
    const maxPage = totalPages > 0 ? totalPages : targetPage;
    const clamped = Math.max(1, Math.min(maxPage, Math.floor(targetPage)));
    setCurrentPage(clamped);
    scheduleSavePage(clamped);
  };

  const handleJumpSubmit = () => {
    const parsed = parseInt(jumpInput, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      navigateToPage(parsed);
      setJumpInput('');
    }
  };

  const hasBookmarkOnPage = bookmarkedPages.has(currentPage);
  const hasNoteOnPage = notedPages.has(currentPage);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.pageStatusRow}>
          <Text style={styles.pageCounter}>
            Pág. {currentPage} {totalPages > 0 ? `/ ${totalPages}` : ''}
          </Text>
          {hasBookmarkOnPage && (
            <View style={styles.bookmarkIndicator}>
              <Text style={styles.indicatorText}>🔖 Marcada</Text>
            </View>
          )}
          {hasNoteOnPage && (
            <View style={styles.noteIndicator}>
              <Text style={styles.indicatorText}>📝 Com nota</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.jumpGroup}>
            <TextInput
              style={styles.jumpInput}
              placeholder="Ir p/ pág."
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              value={jumpInput}
              onChangeText={setJumpInput}
              onSubmitEditing={handleJumpSubmit}
            />
            <TouchableOpacity style={styles.jumpBtn} onPress={handleJumpSubmit}>
              <Text style={styles.jumpBtnText}>Ir</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.annotationsBtn}
            onPress={() => setShowAnnotations(true)}
          >
            <Text style={styles.annotationsBtnText}>
              🔖 Anotações ({bookmarks.length + notes.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.webPreviewContainer}>
        <Text style={styles.webPreviewTitle}>{rulebook.label}</Text>
        <Text style={styles.webPreviewSubtitle}>
          Visualizador nativo de PDF otimizado para iOS/Android. No modo Web você pode gerenciar marcadores e notas por página usando a barra superior.
        </Text>
      </View>

      <AnnotationsPanel
        visible={showAnnotations}
        currentPage={currentPage}
        bookmarks={bookmarks}
        notes={notes}
        onClose={() => setShowAnnotations(false)}
        onNavigate={navigateToPage}
        onAddBookmark={addBookmark}
        onUpdateBookmark={updateBookmark}
        onDeleteBookmark={deleteBookmark}
        onAddNote={addNote}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  toolbar: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 8,
  },
  pageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageCounter: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  bookmarkIndicator: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noteIndicator: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indicatorText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  jumpGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jumpInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: '#f8fafc',
    fontSize: 13,
    minWidth: 90,
  },
  jumpBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  jumpBtnText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  annotationsBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  annotationsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  webPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webPreviewTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  webPreviewSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
  },
});

