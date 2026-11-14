import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { Rulebook } from '@/services/rulebook-types';
import { rulebookService } from '@/services/rulebook.service';
import { useAnnotations } from '@/hooks/use-annotations';
import { AnnotationsPanel } from './annotations-panel';

interface PdfReaderProps {
  rulebook: Rulebook;
  onVerified?: (pageCount: number) => void;
  onUnreadable?: () => void;
}

export function PdfReader({ rulebook, onVerified, onUnreadable }: PdfReaderProps) {
  const [currentPage, setCurrentPage] = useState<number>(
    Math.max(1, rulebook.lastViewedPage || 1)
  );
  const [totalPages, setTotalPages] = useState<number>(rulebook.pageCount ?? 0);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pdfRef = useRef<Pdf | null>(null);
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

  const flushLastPage = useCallback((pageToSave: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    rulebookService.saveLastViewedPage(rulebook.id, pageToSave).catch(() => {
      // Non-fatal persistence error
    });
  }, [rulebook.id]);

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

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flushLastPage(latestPageRef.current);
      }
    });

    return () => {
      sub.remove();
      flushLastPage(latestPageRef.current);
    };
  }, [flushLastPage]);

  const navigateToPage = (targetPage: number) => {
    const maxPage = totalPages > 0 ? totalPages : targetPage;
    const clamped = Math.max(1, Math.min(maxPage, Math.floor(targetPage)));
    setCurrentPage(clamped);
    scheduleSavePage(clamped);
    if (pdfRef.current && typeof pdfRef.current.setPage === 'function') {
      pdfRef.current.setPage(clamped);
    }
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

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Não foi possível abrir o manual</Text>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Reader Toolbar */}
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

      {/* PDF Canvas */}
      <Pdf
        ref={pdfRef}
        source={{ uri: rulebook.fileUri }}
        page={rulebook.lastViewedPage || 1}
        enablePaging
        minScale={1.0}
        maxScale={4.0}
        style={styles.pdfView}
        onLoadComplete={(numberOfPages) => {
          setTotalPages(numberOfPages);
          if (rulebook.status === 'PENDING_VERIFICATION') {
            rulebookService.markVerified(rulebook.id, numberOfPages).then(() => {
              if (onVerified) onVerified(numberOfPages);
            });
          }
        }}
        onPageChanged={(page, numberOfPages) => {
          if (numberOfPages > 0) setTotalPages(numberOfPages);
          setCurrentPage(page);
          scheduleSavePage(page);
        }}
        onError={() => {
          setLoadError('Arquivo PDF inválido, corrompido ou protegido por senha.');
          if (rulebook.status === 'PENDING_VERIFICATION') {
            rulebookService.rejectUnreadable(rulebook.id).then(() => {
              if (onUnreadable) onUnreadable();
            });
          }
        }}
      />

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
  pdfView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f172a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
});

