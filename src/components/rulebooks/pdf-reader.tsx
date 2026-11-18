import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import { Rulebook } from '@/services/rulebook-types';

const PdfWebView = WebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<WebView | null> }
>;
import { rulebookService } from '@/services/rulebook.service';
import { useAnnotations } from '@/hooks/use-annotations';
import { AnnotationsPanel } from './annotations-panel';
import { Badge, Button, tokens } from '@/ui';
import bundledCatalog from '../../../assets/data/virtualstand-catalog.json';

export const GITHUB_RAW_RULEBOOKS_BASE_URL =
  'https://raw.githubusercontent.com/fpinatti/virtualstand/main/assets/rulebooks';

/**
 * Resolves the direct GitHub raw PDF URL for a rulebook.
 * If the database row points to an older synthetic stub while the bundled catalog
 * has the authentic multi-MB PDF for that bggId, upgrades automatically to the real file.
 */
export function resolveGithubRulebookUrl(rulebook: Rulebook): string {
  const cleanUri = (rulebook.fileUri || '').replace(/\\/g, '/');
  let fileName = cleanUri.split('/').pop() || '';

  // Upgrade synthetic stub to authentic catalog PDF if available for this game
  const isStubName = fileName.endsWith('-regras-ptbr.pdf') && (rulebook.fileSizeBytes ?? 0) < 50000;
  if (isStubName || !fileName) {
    const catalogGame = (bundledCatalog as any)?.games?.find(
      (g: any) => g.bggId === rulebook.bggId
    );
    const catalogRb = catalogGame?.rulebooks?.[0];
    if (catalogRb?.relativePath) {
      const catFileName = String(catalogRb.relativePath).replace(/\\/g, '/').split('/').pop();
      if (catFileName) {
        fileName = catFileName;
      }
    }
  }

  if (fileName) {
    return `${GITHUB_RAW_RULEBOOKS_BASE_URL}/${encodeURIComponent(fileName)}`;
  }

  if (rulebook.sourceUrl && rulebook.sourceUrl.startsWith('https://')) {
    return rulebook.sourceUrl;
  }

  return `${GITHUB_RAW_RULEBOOKS_BASE_URL}/manual.pdf`;
}

/**
 * Builds a self-contained HTML document that uses Mozilla PDF.js to fetch and render
 * the PDF directly from GitHub inside React Native WebView with lazy canvas rendering,
 * pinch-to-zoom, zoom buttons, and bidirectional page sync.
 */
export function buildGithubPdfViewerHtml(
  pdfUrl: string,
  initialPage: number,
  label: string
): string {
  const safeUrl = JSON.stringify(pdfUrl);
  const safeLabel = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const startPage = Math.max(1, Math.floor(initialPage || 1));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=4.0, user-scalable=yes" />
  <title>${safeLabel}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      min-height: 100%;
      background-color: #141210;
      color: #F5F0E8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    #viewer-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 4px 64px 4px;
      gap: 12px;
      width: 100%;
    }
    .page-slot {
      position: relative;
      background-color: #1E1B18;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .page-slot canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .page-badge {
      position: absolute;
      bottom: 6px;
      right: 8px;
      background: rgba(20, 18, 16, 0.72);
      color: #D6CFC2;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 10px;
      pointer-events: none;
    }
    #loading-overlay {
      position: fixed;
      inset: 0;
      background-color: #141210;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 100;
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #2C2723;
      border-top-color: #D97706;
      border-radius: 50%;
      animation: spin 0.85s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #loading-title {
      font-size: 15px;
      font-weight: 600;
      color: #F5F0E8;
      margin-bottom: 6px;
      max-width: 320px;
    }
    #loading-status {
      font-size: 13px;
      color: #A89F91;
      margin-bottom: 14px;
    }
    .progress-track {
      width: 220px;
      height: 6px;
      background: #2C2723;
      border-radius: 4px;
      overflow: hidden;
    }
    #progress-bar {
      width: 0%;
      height: 100%;
      background: #D97706;
      transition: width 0.15s ease;
    }
    #zoom-controls {
      position: fixed;
      bottom: 14px;
      right: 14px;
      display: flex;
      gap: 6px;
      z-index: 50;
      background: rgba(30, 27, 24, 0.92);
      border: 1px solid #3A332C;
      padding: 4px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .zoom-btn {
      background: #2C2723;
      color: #F5F0E8;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 6px;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoom-btn:active { background: #D97706; }
  </style>
</head>
<body>
  <div id="loading-overlay">
    <div class="spinner"></div>
    <div id="loading-title">${safeLabel}</div>
    <div id="loading-status">Carregando PDF do GitHub...</div>
    <div class="progress-track"><div id="progress-bar"></div></div>
  </div>

  <div id="viewer-container"></div>

  <div id="zoom-controls">
    <button class="zoom-btn" onclick="changeZoom(-0.25)">−</button>
    <button class="zoom-btn" onclick="resetZoom()" style="font-size:12px;width:44px;" id="zoom-label">100%</button>
    <button class="zoom-btn" onclick="changeZoom(0.25)">+</button>
  </div>

  <script>
    (function() {
      var pdfUrl = ${safeUrl};
      var initialPage = ${startPage};
      var pdfDoc = null;
      var currentZoom = 1.0;
      var renderedPages = {};
      var renderingPages = {};
      var pageRatio = 1.414;

      function postToRN(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (e) {}
      }

      try {
        var workerBlob = new Blob([
          'importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");'
        ], { type: 'application/javascript' });
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
      } catch (e) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      function getSlotDimensions() {
        var baseWidth = Math.max(280, (window.innerWidth || 360) - 12);
        var w = Math.round(baseWidth * currentZoom);
        var h = Math.round(w * pageRatio);
        return { width: w, height: h };
      }

      function renderPage(pageNum) {
        if (!pdfDoc || renderedPages[pageNum] || renderingPages[pageNum]) return;
        var slot = document.getElementById('page-slot-' + pageNum);
        if (!slot) return;

        renderingPages[pageNum] = true;
        pdfDoc.getPage(pageNum).then(function(page) {
          var unscaled = page.getViewport({ scale: 1 });
          if (pageNum === 1 && unscaled.width > 0) {
            pageRatio = unscaled.height / unscaled.width;
          }
          var targetW = slot.clientWidth || getSlotDimensions().width;
          var dpr = Math.min(window.devicePixelRatio || 1.5, 2.0);
          var scale = (targetW / unscaled.width) * dpr;
          var viewport = page.getViewport({ scale: scale });

          var displayH = Math.round(targetW * (unscaled.height / unscaled.width));
          slot.style.height = displayH + 'px';

          var canvas = slot.querySelector('canvas');
          if (!canvas) {
            canvas = document.createElement('canvas');
            slot.insertBefore(canvas, slot.firstChild);
          }
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          var ctx = canvas.getContext('2d');
          return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
            renderedPages[pageNum] = true;
            delete renderingPages[pageNum];
          });
        }).catch(function() {
          delete renderingPages[pageNum];
        });
      }

      function setupObserver() {
        if (!('IntersectionObserver' in window)) {
          for (var i = 1; i <= Math.min(pdfDoc.numPages, 5); i++) {
            renderPage(i);
          }
          return;
        }

        var renderObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            var p = parseInt(entry.target.getAttribute('data-page'), 10);
            if (entry.isIntersecting && p) {
              renderPage(p);
            }
          });
        }, { rootMargin: '150% 0px' });

        var visibleObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var p = parseInt(entry.target.getAttribute('data-page'), 10);
              if (p) {
                postToRN({ type: 'pageChanged', page: p, numPages: pdfDoc.numPages });
              }
            }
          });
        }, { threshold: 0.55 });

        var slots = document.querySelectorAll('.page-slot');
        slots.forEach(function(s) {
          renderObserver.observe(s);
          visibleObserver.observe(s);
        });
      }

      window.scrollToPage = function(pageNum) {
        if (!pdfDoc) return;
        var clamped = Math.max(1, Math.min(pdfDoc.numPages, Math.floor(pageNum)));
        var slot = document.getElementById('page-slot-' + clamped);
        if (slot) {
          renderPage(clamped);
          slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
          postToRN({ type: 'pageChanged', page: clamped, numPages: pdfDoc.numPages });
        }
      };

      function applySlotSizes() {
        var dims = getSlotDimensions();
        var slots = document.querySelectorAll('.page-slot');
        slots.forEach(function(s) {
          s.style.width = dims.width + 'px';
          s.style.height = dims.height + 'px';
        });
        renderedPages = {};
        var visiblePage = 1;
        slots.forEach(function(s) {
          var rect = s.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            var p = parseInt(s.getAttribute('data-page'), 10);
            if (p) {
              visiblePage = p;
              renderPage(p);
            }
          }
        });
      }

      window.changeZoom = function(delta) {
        currentZoom = Math.max(0.75, Math.min(2.5, currentZoom + delta));
        document.getElementById('zoom-label').textContent = Math.round(currentZoom * 100) + '%';
        applySlotSizes();
      };

      window.resetZoom = function() {
        currentZoom = 1.0;
        document.getElementById('zoom-label').textContent = '100%';
        applySlotSizes();
      };

      var loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });

      loadingTask.onProgress = function(prog) {
        var statusEl = document.getElementById('loading-status');
        var barEl = document.getElementById('progress-bar');
        if (prog.total > 0) {
          var pct = Math.min(100, Math.round((prog.loaded / prog.total) * 100));
          var mbLoaded = (prog.loaded / (1024 * 1024)).toFixed(1);
          var mbTotal = (prog.total / (1024 * 1024)).toFixed(1);
          if (statusEl) statusEl.textContent = 'Baixando do GitHub... ' + mbLoaded + ' / ' + mbTotal + ' MB (' + pct + '%)';
          if (barEl) barEl.style.width = pct + '%';
        } else if (prog.loaded > 0) {
          var mb = (prog.loaded / (1024 * 1024)).toFixed(1);
          if (statusEl) statusEl.textContent = 'Baixando do GitHub... ' + mb + ' MB';
          if (barEl) barEl.style.width = '60%';
        }
      };

      loadingTask.promise.then(function(pdf) {
        pdfDoc = pdf;
        return pdf.getPage(1).then(function(firstPage) {
          var vp = firstPage.getViewport({ scale: 1 });
          if (vp.width > 0) {
            pageRatio = vp.height / vp.width;
          }
          var container = document.getElementById('viewer-container');
          var dims = getSlotDimensions();

          for (var i = 1; i <= pdf.numPages; i++) {
            var slot = document.createElement('div');
            slot.className = 'page-slot';
            slot.id = 'page-slot-' + i;
            slot.setAttribute('data-page', String(i));
            slot.style.width = dims.width + 'px';
            slot.style.height = dims.height + 'px';

            var badge = document.createElement('div');
            badge.className = 'page-badge';
            badge.textContent = i + ' / ' + pdf.numPages;
            slot.appendChild(badge);

            container.appendChild(slot);
          }

          var overlay = document.getElementById('loading-overlay');
          if (overlay) overlay.style.display = 'none';

          postToRN({ type: 'loaded', numPages: pdf.numPages });
          renderPage(1);
          setupObserver();

          if (initialPage > 1 && initialPage <= pdf.numPages) {
            setTimeout(function() {
              window.scrollToPage(initialPage);
            }, 150);
          }
        });
      }).catch(function(err) {
        postToRN({ type: 'error', message: err && err.message ? err.message : 'Erro ao carregar PDF do GitHub' });
      });
    })();
  </script>
</body>
</html>`;
}

interface PdfReaderProps {
  rulebook: Rulebook;
  onVerified?: (pageCount: number) => void;
  onUnreadable?: () => void;
}

export function PdfReader({ rulebook, onVerified }: PdfReaderProps) {
  const router = useRouter();
  const webViewRef = useRef<WebView | null>(null);

  const githubPdfUrl = useMemo(() => resolveGithubRulebookUrl(rulebook), [rulebook]);
  const initialPage = useMemo(
    () => Math.max(1, rulebook.lastViewedPage || 1),
    [rulebook.lastViewedPage]
  );
  const viewerHtml = useMemo(
    () => buildGithubPdfViewerHtml(githubPdfUrl, initialPage, rulebook.label),
    [githubPdfUrl, initialPage, rulebook.label]
  );

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(rulebook.pageCount ?? 0);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const flushLastPage = useCallback(
    (pageToSave: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      rulebookService.saveLastViewedPage(rulebook.id, pageToSave).catch(() => {
        // Non-fatal persistence error
      });
    },
    [rulebook.id]
  );

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
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.scrollToPage(${clamped}); true;`);
    }
  };

  const handleJumpSubmit = () => {
    const parsed = parseInt(jumpInput, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      navigateToPage(parsed);
      setJumpInput('');
    }
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded' && typeof data.numPages === 'number') {
        setTotalPages(data.numPages);
        if (rulebook.status === 'PENDING_VERIFICATION') {
          rulebookService.markVerified(rulebook.id, data.numPages).then(() => {
            if (onVerified) onVerified(data.numPages);
          });
        }
      } else if (data.type === 'pageChanged' && typeof data.page === 'number') {
        if (typeof data.numPages === 'number' && data.numPages > 0) {
          setTotalPages(data.numPages);
        }
        setCurrentPage(data.page);
        scheduleSavePage(data.page);
      } else if (data.type === 'error') {
        setLoadError(data.message || 'Não foi possível carregar o PDF do GitHub.');
      }
    } catch {
      // Ignore malformed messages
    }
  };

  const hasBookmarkOnPage = bookmarkedPages.has(currentPage);
  const hasNoteOnPage = notedPages.has(currentPage);

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Não foi possível carregar o manual</Text>
        <Text style={styles.errorText}>{loadError}</Text>
        <View style={styles.errorActions}>
          <Button
            label="🌐 Abrir PDF Direto do GitHub"
            variant="primary"
            onPress={() => Linking.openURL(githubPdfUrl)}
          />
          <Button
            label="‹ Voltar"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
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

      {/* Embedded GitHub PDF Reader */}
      {Platform.OS === 'web' ? (
        <iframe
          src={githubPdfUrl}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' } as any}
          title={rulebook.label}
        />
      ) : (
        <PdfWebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{
            html: viewerHtml,
            baseUrl: 'https://cdnjs.cloudflare.com/',
          }}
          style={styles.pdfView}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onMessage={handleWebViewMessage}
          onError={() => {
            setLoadError('Falha de conexão ao carregar o leitor de PDF.');
          }}
        />
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
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.scale.bodySm.fontSize,
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
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing['2xs'],
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    minWidth: 90,
    fontVariant: ['tabular-nums'],
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  pdfView: {
    flex: 1,
    width: '100%',
    backgroundColor: tokens.colors.surface.canvas,
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
    marginBottom: tokens.spacing.md,
  },
  errorActions: {
    gap: tokens.spacing.sm,
    width: '100%',
    maxWidth: 280,
  },
});
