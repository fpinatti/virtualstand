import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Rulebook } from '@/services/rulebook-types';
import { rulebookService } from '@/services/rulebook.service';
import { useAnnotations } from '@/hooks/use-annotations';
import { AnnotationsPanel } from './annotations-panel';
import { Badge, Button, tokens } from '@/ui';

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
          {hasBookmarkOnPage && <Badge tone="accent" label="🔖 Marcada" />}
          {hasNoteOnPage && <Badge tone="info" label="📝 Com nota" />}
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.jumpGroup}>
            <TextInput
              style={styles.jumpInput}
              placeholder="Ir p/ pág."
              placeholderTextColor={tokens.colors.text.muted}
              keyboardType="number-pad"
              value={jumpInput}
              onChangeText={setJumpInput}
              onSubmitEditing={handleJumpSubmit}
            />
            <Button label="Ir" variant="secondary" size="sm" onPress={handleJumpSubmit} />
          </View>

          <Button
            label={`🔖 Anotações (${bookmarks.length + notes.length})`}
            variant="primary"
            size="sm"
            onPress={() => setShowAnnotations(true)}
          />
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
    backgroundColor: tokens.colors.surface.canvas,
  },
  toolbar: {
    backgroundColor: tokens.colors.surface.elevated,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
    gap: tokens.spacing.xs,
  },
  pageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  pageCounter: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  jumpGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing['2xs'],
  },
  jumpInput: {
    backgroundColor: tokens.colors.surface.sunken,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 5,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    minWidth: 90,
    fontVariant: ['tabular-nums'],
  },
  webPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  webPreviewTitle: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  webPreviewSubtitle: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: tokens.typography.scale.bodySm.lineHeight,
  },
});
