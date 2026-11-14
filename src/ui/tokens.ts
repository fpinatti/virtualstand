/**
 * VirtualStand Impeccable Design Tokens ("The Tactile Tabletop Lounge")
 * Canonical source of truth for colors, spacing, typography, radii, and layout bounds.
 */

const typographyScale = {
  display: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  micro: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600' as const,
  },
} as const;

const statusColors = {
  success: '#4ADE80',
  successSubtle: 'rgba(74, 222, 128, 0.15)',
  warning: '#FBBF24',
  warningSubtle: 'rgba(251, 191, 36, 0.15)',
  danger: '#F87171',
  dangerSubtle: 'rgba(248, 113, 113, 0.15)',
  info: '#4DB6AC',
  infoSubtle: 'rgba(77, 182, 172, 0.16)',
} as const;

const radiiTokens = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
  pill: 9999,
} as const;

export const tokens = {
  colors: {
    surface: {
      canvas: '#121316',
      card: '#1B1D22',
      elevated: '#24272E',
      interactive: '#2E323B',
      sunken: '#121316',
      glassOverlay: 'rgba(18, 19, 22, 0.88)',
      overlay: 'rgba(18, 19, 22, 0.88)',
    },
    text: {
      primary: '#F5F2EB',
      secondary: '#B5B0A4',
      muted: '#8A857A',
      inverse: '#121316',
    },
    accent: {
      primary: '#E5A93C',
      primaryDeep: '#C88D24',
      primarySubtle: 'rgba(229, 169, 60, 0.16)',
      secondary: '#4DB6AC',
      secondarySubtle: 'rgba(77, 182, 172, 0.16)',
    },
    status: statusColors,
    semantic: statusColors,
    border: {
      subtle: '#262930',
      default: '#323640',
      strong: '#454A57',
      focus: '#E5A93C',
    },
    shelf3d: {
      frameWood: '#1D1815',
      backingBoard: '#14110F',
    },
  },
  spacing: {
    none: 0,
    xxs: 2,
    '2xs': 4,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    section: 32,
    hero: 48,
  },
  typography: {
    ...typographyScale,
    scale: typographyScale,
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    tabularNums: ['tabular-nums'] as const,
  },
  radii: radiiTokens,
  radius: radiiTokens,
  layout: {
    minTouchTarget: 44,
    maxContentWidth: 920,
  },
  touchTarget: {
    minSize: 44,
  },
} as const;

export type DesignTokens = typeof tokens;
export type SpacingKey = keyof typeof tokens.spacing;
export type RadiusKey = keyof typeof tokens.radii;
export type TypographyKey = keyof typeof typographyScale;
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'subtle' | 'sunken';
export type BadgeTone =
  | 'primary'
  | 'accent'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
