# Phase 1 Data Model: Sistema de Design e Governança Visual Impeccable (`005-impeccable-ui-system`)

**Date**: 2026-11-14
**Feature**: [spec.md](./spec.md)

> **Nota Arquitetural**: Esta feature não introduz novas tabelas SQLite, pois opera na camada de apresentação e governança visual (`src/ui/`, `app/`, `src/components/`, `PRODUCT.md` e `DESIGN.md`). As entidades abaixo modelam as estruturas de dados estritas do sistema de design e do auditor determinístico.

---

## 1. `DesignTokens` (Catálogo Central de Tokens Semânticos)

Representa a fonte única da verdade para cores, tipografia, espaçamento, raios de borda, elevação e restrições de layout.

| Campo | Tipo | Regras de Validação / Invariantes |
|-------|------|-----------------------------------|
| `colors.surface` | `{ canvas, card, elevated, interactive, glassOverlay }` | Cores hexadecimais/RGBA escuras em escala progressiva de luminância (`canvas < card < elevated < interactive`). |
| `colors.text` | `{ primary, secondary, muted, inverse }` | `primary`, `secondary` e `muted` DEVEM atingir relação de contraste `>= 4.5:1` sobre `surface.canvas` e `surface.card`. `inverse` DEVE atingir `>= 4.5:1` sobre `accent.primary`. |
| `colors.accent` | `{ primary, primarySubtle, secondary }` | `primary` reservado exclusivamente para a ação principal da tela/modal e indicadores ativos. |
| `colors.status` | `{ success, successSubtle, warning, warningSubtle, danger, dangerSubtle, info, infoSubtle }` | Cores semânticas de estado com contraste `>= 3.0:1` sobre superfícies escuras. |
| `colors.border` | `{ subtle, default, strong, focus }` | Delimitadores visuais de baixa interferência. |
| `spacing` | `{ xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 32, hero: 48 }` | Escala estritamente monotônica crescente. |
| `typography` | `Record<TypographyVariant, TypographyStyle>` | Variantes: `display`, `h1`, `h2`, `h3`, `body`, `bodyStrong`, `caption`, `micro`. Sempre define `fontSize`, `lineHeight` (`>= 1.25 * fontSize`) e `fontWeight`. |
| `radii` | `{ sm: 6, md: 10, lg: 14, xl: 20, full: 9999 }` | Raios de borda padronizados para botões, cartões, modais e pílulas. |
| `layout` | `{ minTouchTarget: 44, maxContentWidth: 920 }` | Restrições ergonômicas obrigatórias para Mobile e Web. |

---

## 2. `UI Primitives` (Entidades de Componentes Padronizados)

### 2.1 `ButtonProps`
- `label: string` (obrigatório, não vazio)
- `variant?: 'primary' | 'secondary' | 'ghost' | 'danger'` (padrão: `'primary'`)
- `size?: 'md' | 'sm'` (padrão: `'md'`; ambos garantem área de toque mínima de `44x44pt` via `minHeight` ou `hitSlop`)
- `disabled?: boolean`
- `loading?: boolean`
- `fullWidth?: boolean`
- `onPress: () => void`

### 2.2 `CardProps`
- `variant?: 'default' | 'elevated' | 'outlined' | 'subtle'` (padrão: `'default'`)
- `padding?: keyof SpacingTokens` (padrão: `'lg'`)
- `children: React.ReactNode`

### 2.3 `BadgeProps`
- `label: string`
- `tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` (padrão: `'neutral'`)

### 2.4 `InputProps`
- `label?: string`
- `error?: string | null`
- `helperText?: string`
- Herda propriedades seguras de `TextInputProps` com altura mínima `44pt` e estilização semântica de erro/foco.

### 2.5 `SectionHeaderProps`
- `title: string`
- `subtitle?: string`
- `badgeText?: string`
- `actionLabel?: string`
- `onActionPress?: () => void`

### 2.6 `EmptyStateProps`
- `title: string`
- `description: string`
- `actionLabel?: string`
- `onActionPress?: () => void`

---

## 3. `DesignAuditResult` (Entidade de Auditoria Determinística Impeccable)

Resultado retornado pelo motor determinístico `auditDesignSystem()` em `src/ui/audit.ts`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `valid` | `boolean` | `true` somente se `violations.length === 0`. |
| `contrastChecks` | `ContrastCheckEntry[]` | Lista de pares `(foreground, background, ratio, minRequired, passed)` avaliados pela fórmula WCAG 2.1 de luminância relativa. |
| `violations` | `DesignViolation[]` | Lista de violações detectadas (`LOW_CONTRAST`, `NON_MONOTONIC_SCALE`, `TOUCH_TARGET_TOO_SMALL`, `FORBIDDEN_CLICHE_COLOR`, `RAW_HEX_OUTSIDE_TOKENS`). |
