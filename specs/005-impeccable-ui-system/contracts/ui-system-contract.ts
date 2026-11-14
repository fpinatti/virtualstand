/**
 * Contract: Impeccable UI Design System & Deterministic Audit (Feature 005)
 */

export type SurfaceTokenKey = 'canvas' | 'card' | 'elevated' | 'interactive' | 'glassOverlay';
export type TextTokenKey = 'primary' | 'secondary' | 'muted' | 'inverse';
export type AccentTokenKey = 'primary' | 'primarySubtle' | 'secondary';
export type StatusToneKey = 'success' | 'warning' | 'danger' | 'info';
export type BorderTokenKey = 'subtle' | 'default' | 'strong' | 'focus';

export type SpacingTokenKey =
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'section'
  | 'hero';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'micro';

export type RadiusTokenKey = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface TypographyStyleContract {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
}

export interface DesignTokensContract {
  colors: {
    surface: Record<SurfaceTokenKey, string>;
    text: Record<TextTokenKey, string>;
    accent: Record<AccentTokenKey, string>;
    status: {
      success: string;
      successSubtle: string;
      warning: string;
      warningSubtle: string;
      danger: string;
      dangerSubtle: string;
      info: string;
      infoSubtle: string;
    };
    border: Record<BorderTokenKey, string>;
  };
  spacing: Record<SpacingTokenKey, number>;
  typography: Record<TypographyVariant, TypographyStyleContract>;
  radii: Record<RadiusTokenKey, number>;
  layout: {
    minTouchTarget: number;
    maxContentWidth: number;
  };
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'subtle';
export type BadgeTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

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
