import * as THREE from 'three';

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
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3).trim() + '...';
}

export class SpineGeneratorService {
  private readonly textureCache = new Map<string, THREE.CanvasTexture>();

  /**
   * Generates a canvas texture for a game spine when canvas context is available.
   */
  createSpineTexture(title: string, width = 128, height = 512, bgColor?: string): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') {
      return null; // Non-DOM environment fallback
    }

    const color = bgColor || getDeterministicColorFromTitle(title);
    const cacheKey = `${title}_${color}_${width}x${height}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);

      // Draw spine borders
      ctx.strokeStyle = 'rgba(245, 240, 232, 0.22)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      // Draw rotated vertical text
      const textColor = calculateContrastTextColor(color);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 2); // Rotate 90 degrees for vertical spine reading
      ctx.fillText(formatSpineTitle(title), 0, 0);
      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
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
  }
}

export const spineGeneratorService = new SpineGeneratorService();
