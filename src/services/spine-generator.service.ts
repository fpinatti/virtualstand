import * as THREE from 'three';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const PALETTE = [
  '#7C2D12', // Warm Terracotta
  '#14532D', // Deep Felt Forest
  '#78350F', // Aged Brass Amber
  '#881337', // Burgundy Velvet
  '#1E3A5F', // Deep Prussian Navy
  '#134E4A', // Patina Teal
  '#581C87', // Royal Plum
  '#3F2E21', // Walnut Espresso
  '#713F12', // Ochre Gold
];

function cleanEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

/**
 * Draws an image onto a canvas using CSS `object-fit: cover` math (center crop, zero distortion).
 */
function drawImageCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number
): void {
  const imgW = img.naturalWidth || img.width || destW;
  const imgH = img.naturalHeight || img.height || destH;
  if (imgW <= 0 || imgH <= 0) return;

  const targetRatio = destW / destH;
  const imgRatio = imgW / imgH;

  let sx = 0;
  let sy = 0;
  let sw = imgW;
  let sh = imgH;

  if (imgRatio > targetRatio) {
    sw = imgH * targetRatio;
    sx = (imgW - sw) / 2;
  } else {
    sh = imgW / targetRatio;
    sy = (imgH - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, destX, destY, destW, destH);
}

/**
 * Calculates high-contrast text color (#ffffff or #0f172a) based on hex background luminance.
 */
export function calculateContrastTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Standard sRGB luminance calculation
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? '#0f172a' : '#ffffff';
}

/**
 * Returns a stable, deterministic theme color for any board game title.
 */
export function getDeterministicColorFromTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * Truncates and cleans title string for box spine display.
 */
export function formatSpineTitle(title: string, maxLength = 45): string {
  const cleaned = cleanEntities(title);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Wraps remote BGG CDN URLs in a CORS-safe image proxy when running in a browser DOM.
 */
export function resolveWebGlSafeImageUrl(uri: string): string {
  const trimmed = uri.trim();
  if (
    (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
    !trimmed.includes('wsrv.nl')
  ) {
    return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=512&output=jpg`;
  }
  return trimmed;
}

export class SpineGeneratorService {
  private readonly textureCache = new Map<string, THREE.CanvasTexture>();
  private readonly coverTextureCache = new Map<string, THREE.Texture>();
  private readonly coverImageCache = new Map<string, HTMLImageElement>();

  /**
   * Loads a remote or local cover image into THREE.Texture.
   * Cross-platform: Uses browser Canvas on Web, and FileSystem local caching + TextureLoader on Native.
   */
  async loadCoverArt(
    uri: string,
    onLoaded: (result: { coverTexture: THREE.Texture; image: HTMLImageElement | null }) => void
  ): Promise<void> {
    if (!uri) return;

    if (this.coverTextureCache.has(uri)) {
      onLoaded({
        coverTexture: this.coverTextureCache.get(uri)!,
        image: this.coverImageCache.get(uri) ?? null,
      });
      return;
    }

    if (Platform.OS === 'web') {
      const safeUrl = resolveWebGlSafeImageUrl(uri);
      if (typeof Image !== 'undefined' && typeof document !== 'undefined') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              drawImageCoverFit(ctx, img, 0, 0, 512, 512);
              const tex = new THREE.CanvasTexture(canvas);
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.needsUpdate = true;
              this.coverTextureCache.set(uri, tex);
              this.coverImageCache.set(uri, img);
              onLoaded({ coverTexture: tex, image: img });
            }
          } catch {
            // Ignore canvas security errors
          }
        };
        img.src = safeUrl;
      }
      return;
    }

    // Native Mobile (React Native / Expo)
    try {
      let localFileUri = uri;
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const cleanName = uri.split('/').pop()?.split('?')[0] || 'cover.jpg';
        const targetPath = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ''}covers_${cleanName}`;
        try {
          const info = await FileSystem.getInfoAsync(targetPath);
          if (!info.exists) {
            const res = await FileSystem.downloadAsync(uri, targetPath);
            localFileUri = res.uri;
          } else {
            localFileUri = targetPath;
          }
        } catch {
          localFileUri = uri;
        }
      }

      const loader = new THREE.TextureLoader();
      loader.load(
        localFileUri,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          this.coverTextureCache.set(uri, tex);
          onLoaded({
            coverTexture: tex,
            image: (tex.image as HTMLImageElement) || null,
          });
        },
        undefined,
        (err) => {
          console.warn('[SpineGenerator] Failed to load cover texture on native for:', uri, err);
        }
      );
    } catch (err) {
      console.warn('[SpineGenerator] Native cover load error:', err);
    }
  }

  /**
   * Generates a canvas texture for a game box lateral/spine face in DOM environments.
   * Returns null safely without throwing when running in React Native (non-DOM).
   */
  createSpineTexture(
    title: string,
    width = 256,
    height = 1024,
    bgColor?: string,
    coverImage?: HTMLImageElement | null
  ): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') {
      return null; // Safe non-DOM fallback
    }

    const cleanedTitle = cleanEntities(title);
    const color = bgColor || getDeterministicColorFromTitle(cleanedTitle);
    const hasImg = Boolean(coverImage);
    const cacheKey = `${cleanedTitle}_${color}_${width}x${height}_${hasImg ? (coverImage?.src ?? 'img') : 'plain'}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // 1. Base background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);

      // 2. When coverImage is loaded, wrap cover art cleanly without distortion
      if (coverImage) {
        drawImageCoverFit(ctx, coverImage, 0, 0, width, height);

        const edgeGrad = ctx.createLinearGradient(0, 0, width, 0);
        edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
        edgeGrad.addColorStop(0.12, 'rgba(0, 0, 0, 0.08)');
        edgeGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.08)');
        edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback when no cover image exists: clean editorial spine with vertical title
        ctx.strokeStyle = 'rgba(245, 240, 232, 0.22)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, width - 8, height - 8);

        const textColor = calculateContrastTextColor(color);
        ctx.fillStyle = textColor;
        const fontSize = Math.round(width * 0.18);
        ctx.font = `700 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(formatSpineTitle(cleanedTitle, 36), 0, 0);
        ctx.restore();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      this.textureCache.set(cacheKey, texture);
      return texture;
    } catch {
      return null;
    }
  }

  /**
   * Clears texture cache to prevent memory leaks.
   */
  dispose(): void {
    this.textureCache.forEach((texture) => texture.dispose());
    this.textureCache.clear();
    this.coverTextureCache.forEach((texture) => texture.dispose());
    this.coverTextureCache.clear();
    this.coverImageCache.clear();
  }
}

export const spineGeneratorService = new SpineGeneratorService();
