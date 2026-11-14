import { tokens, DesignTokens } from './tokens';

export type DesignViolationCode =
  | 'LOW_CONTRAST'
  | 'NON_MONOTONIC_SCALE'
  | 'TOUCH_TARGET_TOO_SMALL'
  | 'FORBIDDEN_CLICHE_COLOR'
  | 'RAW_HEX_OUTSIDE_TOKENS';

export interface ContrastCheckEntry {
  pairName: string;
  foreground: string;
  background: string;
  ratio: number;
  minRequired: number;
  passed: boolean;
}

export interface DesignViolation {
  code: DesignViolationCode;
  target: string;
  message: string;
}

export interface DesignAuditReport {
  valid: boolean;
  contrastChecks: ContrastCheckEntry[];
  violations: DesignViolation[];
}

/**
 * Legacy AI-slop slate/indigo colors banned by VirtualStand's DESIGN.md ("The No Cold Indigo Rule").
 */
export const FORBIDDEN_CLICHE_HEX_COLORS = [
  '#0f172a',
  '#1e293b',
  '#334155',
  '#6366f1',
  '#4f46e5',
] as const;

/**
 * Parses a 6-digit hex color string (#RRGGBB) into normalized [r, g, b] in 0..255.
 */
export function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Computes WCAG 2.1 relative luminance for an #RRGGBB color.
 */
export function calculateRelativeLuminance(hex: string): number {
  const [r8, g8, b8] = parseHexRgb(hex);
  const toLinear = (c8: number): number => {
    const s = c8 / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(r8);
  const g = toLinear(g8);
  const b = toLinear(b8);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes WCAG 2.1 contrast ratio between two #RRGGBB colors (1.0 to 21.0).
 */
export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = calculateRelativeLuminance(foregroundHex);
  const l2 = calculateRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Deterministically audits a DesignTokens object against WCAG AA contrast,
 * monotonic spatial scale, minimum touch target, and banned cliché colors.
 */
export function auditDesignTokens(targetTokens: DesignTokens = tokens): DesignAuditReport {
  const violations: DesignViolation[] = [];
  const contrastChecks: ContrastCheckEntry[] = [];

  const requiredPairs: Array<{
    pairName: string;
    fg: string;
    bg: string;
    minRequired: number;
  }> = [
    {
      pairName: 'text.primary on surface.canvas',
      fg: targetTokens.colors.text.primary,
      bg: targetTokens.colors.surface.canvas,
      minRequired: 4.5,
    },
    {
      pairName: 'text.primary on surface.card',
      fg: targetTokens.colors.text.primary,
      bg: targetTokens.colors.surface.card,
      minRequired: 4.5,
    },
    {
      pairName: 'text.secondary on surface.canvas',
      fg: targetTokens.colors.text.secondary,
      bg: targetTokens.colors.surface.canvas,
      minRequired: 4.5,
    },
    {
      pairName: 'text.secondary on surface.card',
      fg: targetTokens.colors.text.secondary,
      bg: targetTokens.colors.surface.card,
      minRequired: 4.5,
    },
    {
      pairName: 'text.muted on surface.canvas',
      fg: targetTokens.colors.text.muted,
      bg: targetTokens.colors.surface.canvas,
      minRequired: 4.5,
    },
    {
      pairName: 'text.inverse on accent.primary',
      fg: targetTokens.colors.text.inverse,
      bg: targetTokens.colors.accent.primary,
      minRequired: 4.5,
    },
    {
      pairName: 'accent.primary on surface.canvas',
      fg: targetTokens.colors.accent.primary,
      bg: targetTokens.colors.surface.canvas,
      minRequired: 3.0,
    },
    {
      pairName: 'status.success on surface.card',
      fg: targetTokens.colors.status.success,
      bg: targetTokens.colors.surface.card,
      minRequired: 3.0,
    },
    {
      pairName: 'status.warning on surface.card',
      fg: targetTokens.colors.status.warning,
      bg: targetTokens.colors.surface.card,
      minRequired: 3.0,
    },
    {
      pairName: 'status.danger on surface.card',
      fg: targetTokens.colors.status.danger,
      bg: targetTokens.colors.surface.card,
      minRequired: 3.0,
    },
  ];

  for (const item of requiredPairs) {
    const ratio = calculateContrastRatio(item.fg, item.bg);
    const passed = ratio >= item.minRequired;
    contrastChecks.push({
      pairName: item.pairName,
      foreground: item.fg,
      background: item.bg,
      ratio,
      minRequired: item.minRequired,
      passed,
    });
    if (!passed) {
      violations.push({
        code: 'LOW_CONTRAST',
        target: item.pairName,
        message: `Contrast ratio ${ratio}:1 is below required ${item.minRequired}:1 (${item.fg} on ${item.bg})`,
      });
    }
  }

  // Verify spacing scale is strictly increasing
  const spacingOrder = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'section', 'hero'] as const;
  for (let i = 1; i < spacingOrder.length; i++) {
    const prevKey = spacingOrder[i - 1];
    const currKey = spacingOrder[i];
    if (targetTokens.spacing[currKey] <= targetTokens.spacing[prevKey]) {
      violations.push({
        code: 'NON_MONOTONIC_SCALE',
        target: `spacing.${currKey}`,
        message: `spacing.${currKey} (${targetTokens.spacing[currKey]}) must be greater than spacing.${prevKey} (${targetTokens.spacing[prevKey]})`,
      });
    }
  }

  // Verify minimum touch target
  if (targetTokens.layout.minTouchTarget < 44) {
    violations.push({
      code: 'TOUCH_TARGET_TOO_SMALL',
      target: 'layout.minTouchTarget',
      message: `minTouchTarget (${targetTokens.layout.minTouchTarget}) must be at least 44pt`,
    });
  }

  // Verify no forbidden cliché colors exist in token palette
  const serializedTokens = JSON.stringify(targetTokens.colors).toLowerCase();
  for (const forbidden of FORBIDDEN_CLICHE_HEX_COLORS) {
    if (serializedTokens.includes(forbidden.toLowerCase())) {
      violations.push({
        code: 'FORBIDDEN_CLICHE_COLOR',
        target: 'colors',
        message: `Forbidden legacy cliché color ${forbidden} found in DesignTokens`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    contrastChecks,
    violations,
  };
}

/**
 * Scans a UI source file's text for banned AI-slop cliché colors (#0f172a, #6366f1, etc.).
 */
export function auditSourceTextForViolations(filePath: string, sourceText: string): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const lower = sourceText.toLowerCase();

  for (const forbidden of FORBIDDEN_CLICHE_HEX_COLORS) {
    if (lower.includes(forbidden.toLowerCase())) {
      violations.push({
        code: 'FORBIDDEN_CLICHE_COLOR',
        target: filePath,
        message: `File ${filePath} contains banned legacy color ${forbidden}; use semantic tokens from '@/ui' instead.`,
      });
    }
  }

  return violations;
}
