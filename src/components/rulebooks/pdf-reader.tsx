import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  AppState,
  AppStateStatus,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
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

interface NativePdfInstance {
  setPage?: (page: number) => void;
}

type NativePdfComponentType = React.ComponentType<{
  ref?: React.Ref<NativePdfInstance>;
  source: { uri: string };
  page?: number;
  enablePaging?: boolean;
  minScale?: number;
  maxScale?: number;
  style?: object;
  onLoadComplete?: (numberOfPages: number) => void;
  onPageChanged?: (page: number, numberOfPages: number) => void;
  onError?: () => void;
}>;

/**
 * Resolves `react-native-pdf` only when running in a standalone/dev-client build.
 * Inside standard Expo Go (`storeClient`), custom native modules like `RNPDFPdfView`
 * are not compiled into the Expo Go binary, so we return null to avoid TurboModule crashes.
 */
function resolveNativePdfComponent(): NativePdfComponentType | null {
  try {
    const isExpoGo =
      Constants.executionEnvironment === 'storeClient' ||
      Constants.appOwnership === 'expo';
    if (isExpoGo) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-pdf');
    return (mod?.default ?? mod) as NativePdfComponentType;
  } catch {
    return null;
  }
}

export function PdfReader({ rulebook, onVerified, onUnreadable }: PdfReaderProps) {
  const router = useRouter();
  const NativePdf = useRef<NativePdfComponentType | null>(resolveNativePdfComponent()).current;

  const [currentPage, setCurrentPage] = useState<number>(
    Math.max(1, rulebook.lastViewedPage || 1)
  );
  const [totalPages, setTotalPages] = useState<number>(rulebook.pageCount ?? 0);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pdfRef = useRef<NativePdfInstance | null>(null);
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
    if (!NativePdf && rulebook.status === 'PENDING_VERIFICATION') {
      const pages = rulebook.pageCount ?? 1;
      setTotalPages(pages);
      rulebookService
        .markVerified(rulebook.id, pages)
        .then(() => {
          if (onVerified) onVerified(pages);
        })
        .catch(() => {});
    }
  }, [NativePdf, rulebook.id, rulebook.status, rulebook.pageCount, onVerified]);

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

      {/* PDF Canvas or Expo Go Fallback */}
      {NativePdf ? (
        <NativePdf
          ref={pdfRef}
          source={{ uri: rulebook.fileUri }}
          page={rulebook.lastViewedPage || 1}
          enablePaging
          minScale={1.0}
          maxScale={4.0}
          style={styles.pdfView}
          onLoadComplete={(numberOfPages: number) => {
            setTotalPages(numberOfPages);
            if (rulebook.status === 'PENDING_VERIFICATION') {
              rulebookService.markVerified(rulebook.id, numberOfPages).then(() => {
                if (onVerified) onVerified(numberOfPages);
              });
            }
          }}
          onPageChanged={(page: number, numberOfPages: number) => {
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
      ) : (
        <View style={styles.expoGoFallback}>
          <Text style={styles.expoGoTitle}>{rulebook.label}</Text>
          <Text style={styles.expoGoSubtitle}>
            No ambiente Expo Go você pode gerenciar marcadores e anotações por página ou abrir o documento oficial no navegador.
          </Text>
          <View style={styles.expoGoActions}>
            {rulebook.sourceUrl ? (
              <Button
                label="🌐 Abrir PDF no Navegador"
                variant="primary"
                onPress={() => {
                  if (rulebook.sourceUrl) {
                    Linking.openURL(rulebook.sourceUrl);
                  }
                }}
              />
            ) : null}
            <Button
              label="‹ Voltar para a Coleção"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      )}

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
  pdfView: {
    flex: 1,
    width: '100%',
    backgroundColor: tokens.colors.surface.canvas,
  },
  expoGoFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  expoGoTitle: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  expoGoSubtitle: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: tokens.typography.scale.bodySm.lineHeight,
  },
  expoGoActions: {
    marginTop: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    width: '100%',
    maxWidth: 280,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.surface.canvas,
  },
  errorTitle: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    marginBottom: tokens.spacing.xs,
  },
  errorText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    textAlign: 'center',
  },
});
