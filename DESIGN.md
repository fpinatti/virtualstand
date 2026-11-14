---
name: VirtualStand
description: Tactile Tabletop Lounge design system for board game collectors
colors:
  amber-brass: "#E5A93C"
  amber-brass-deep: "#C88D24"
  amber-brass-subtle: "rgba(229, 169, 60, 0.16)"
  meeple-teal: "#4DB6AC"
  meeple-teal-subtle: "rgba(77, 182, 172, 0.16)"
  obsidian-canvas: "#121316"
  walnut-card: "#1B1D22"
  slate-elevated: "#24272E"
  ash-interactive: "#2E323B"
  glass-overlay: "rgba(18, 19, 22, 0.88)"
  ivory-primary: "#F5F2EB"
  stone-secondary: "#B5B0A4"
  parchment-muted: "#8A857A"
  ink-inverse: "#121316"
  border-subtle: "#262930"
  border-default: "#323640"
  border-strong: "#454A57"
  emerald-success: "#4ADE80"
  emerald-subtle: "rgba(74, 222, 128, 0.15)"
  topaz-warning: "#FBBF24"
  topaz-subtle: "rgba(251, 191, 36, 0.15)"
  coral-danger: "#F87171"
  coral-subtle: "rgba(248, 113, 113, 0.15)"
typography:
  display:
    fontFamily: "System"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.23
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "System"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.27
    letterSpacing: "-0.02em"
  title:
    fontFamily: "System"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "-0.01em"
  body:
    fontFamily: "System"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "0em"
  label:
    fontFamily: "System"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.38
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  section: "32px"
  hero: "48px"
components:
  button-primary:
    backgroundColor: "{colors.amber-brass}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.ash-interactive}"
    textColor: "{colors.ivory-primary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.coral-subtle}"
    textColor: "{colors.coral-danger}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  card-default:
    backgroundColor: "{colors.walnut-card}"
    textColor: "{colors.ivory-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-default:
    backgroundColor: "{colors.obsidian-canvas}"
    textColor: "{colors.ivory-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    height: "44px"
---

# Design System: VirtualStand

## Overview

**Creative North Star: "The Tactile Tabletop Lounge"**

VirtualStand's visual identity is crafted for the warm, focused atmosphere of an evening board game session. Instead of cold, blue-tinted SaaS dashboards or generic indigo gradients, the interface draws from the physical materials of modern tabletop gaming: deep obsidian felt, dark walnut shelving, warm linen rulebook pages, and stamped amber-brass tokens.

Because board game box art and 3D procedural spines are inherently vibrant and chromatic, the application chrome intentionally acts as a quiet, warm-neutral gallery frame. Surfaces step up through subtle luminance shifts (`#121316` → `#1B1D22` → `#24272E`), allowing cover thumbnails, 3D shelves, and status badges to stand out effortlessly without visual fatigue.

**Key Characteristics:**
- Warm-neutral dark surfaces (`#121316` to `#2E323B`) that eliminate cold blue glare in low-light rooms.
- High-contrast editorial ivory typography (`#F5F2EB`) paired with warm stone secondary copy (`#B5B0A4`).
- Confident Amber Brass (`#E5A93C`) primary actions with dark ink labels (`#121316`) for unmistakable hierarchy.
- Strict 4pt spatial rhythm and 44pt minimum touch targets across iOS, Android, and Web Localhost.

## Colors

The palette pairs warm charcoal-obsidian surfaces with linen-ivory typography and a single high-craft metallic amber accent.

### Primary
- **Amber Brass** (`#E5A93C`): Reserved exclusively for the single primary call-to-action in a view, active tab indicators, and personal rating highlights. Always paired with `ink-inverse` (`#121316`) text for a 9.4:1 contrast ratio.
- **Amber Brass Deep** (`#C88D24`): Active/pressed state for primary buttons.
- **Amber Brass Subtle** (`rgba(229, 169, 60, 0.16)`): Tinted highlight surface for selected filter pills and active badges.

### Secondary
- **Meeple Teal** (`#4DB6AC`): Secondary informational accent used for page notes, rulebook verification badges, and cooperative play metrics.
- **Meeple Teal Subtle** (`rgba(77, 182, 172, 0.16)`): Background tint for informational badges and note indicators.

### Tertiary
- **Emerald Success** (`#4ADE80`): Completed sync states, 100% sleeved decks, and competitive victories.
- **Topaz Warning** (`#FBBF24`): BGG HTTP 202 queue states, estimated box dimensions, and partial sleeve coverage.
- **Coral Danger** (`#F87171`): Destructive actions, sleeve deficits (packs to buy), and sync/validation errors.

### Neutral
- **Obsidian Canvas** (`#121316`): Root screen background and input well background.
- **Walnut Card** (`#1B1D22`): Default surface for collection cards, sleeve rows, and play session items.
- **Slate Elevated** (`#24272E`): Bottom sheets, modals, and floating toolbars.
- **Ash Interactive** (`#2E323B`): Secondary buttons, unselected chips, and stepper controls.
- **Ivory Primary** (`#F5F2EB`): Primary titles, game names, and numerical metrics (15.8:1 contrast on canvas).
- **Stone Secondary** (`#B5B0A4`): Metadata, player counts, dimensions, and body descriptions (7.9:1 contrast on canvas).
- **Parchment Muted** (`#8A857A`): Captions, timestamps, and input placeholders (4.6:1 contrast on canvas).

### Named Rules
**The One Brass Token Rule.** `amber-brass` (`#E5A93C`) may appear as a solid fill on at most one primary button per active screen or modal section. All sibling actions must step down to `ash-interactive` or ghost treatments.

**The No Cold Indigo Rule.** Legacy AI-default colors (`#0f172a`, `#1e293b`, `#6366f1`, `#4f46e5`) are strictly banned across all screens and components.

## Typography

**Display Font:** Platform System Sans (`SF Pro Display` / `Roboto` / `Inter` fallback)
**Body Font:** Platform System Sans (`SF Pro Text` / `Roboto` / system-ui)

**Character:** Clean, tabular-friendly, and scannable at arm's length across a gaming table, relying on crisp weight contrasts (`700` vs `400`) and generous line height rather than decorative serifs.

### Hierarchy
- **Display** (`700`, `26px`, line-height `32px`, `-0.02em`): Hero counters and primary modal headers.
- **Headline** (`700`, `22px`, line-height `28px`, `-0.02em`): Screen titles and empty-state headlines.
- **Title** (`700`, `18px`, line-height `24px`, `-0.01em`): Section headers (`SectionHeader`) and card titles.
- **Body** (`400` / `600`, `15px`, line-height `22px`): Primary descriptions, user notes, and form input values.
- **Label** (`600`, `13px`, line-height `18px`, `0.01em`): Button labels, field labels, and metadata badges (`11px` micro variant for compact pills).

### Named Rules
**The Self-Sufficient Heading Rule.** Section headings stand on their own weight and spacing; never stack uppercase eyebrow kickers above a heading.

## Layout

All screens use a 4pt base spatial scale (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`). List screens and settings views apply `16px` (`lg`) horizontal padding on mobile and center within a `920px` (`maxContentWidth`) container on Web Localhost so cards and forms never stretch uncomfortably across widescreen monitors.

## Elevation & Depth

VirtualStand uses **tonal surface layering** reinforced by crisp `1px` structural borders (`#262930` subtle, `#323640` default) rather than heavy drop shadows. Depth is communicated by stepping luminance from `obsidian-canvas` (`#121316`) to `walnut-card` (`#1B1D22`) to `slate-elevated` (`#24272E`).

### Named Rules
**The Single Boundary Rule.** Declare card boundaries once via tonal contrast and a `1px` subtle border (`#262930`)—never combine thick borders with wide outer glows.

## Shapes

- **Cards & Panels:** Gently rounded corners (`14px` / `lg`) that echo die-cut board game player boards.
- **Buttons & Inputs:** Tactile medium corners (`10px` / `md`) with a mandatory `44px` minimum height.
- **Badges & Filter Pills:** Compact `6px` (`sm`) radius for metadata tags and `9999px` (`full`) for floating HUD counters over the 3D viewport.

## Components

### Buttons (`src/ui/primitives/button.tsx`)
- **Shape:** `10px` radius (`md`), minimum height `44px`, horizontal padding `16px–20px`.
- **Primary:** Solid `amber-brass` (`#E5A93C`) fill with `ink-inverse` (`#121316`) bold label (`700`).
- **Secondary:** `ash-interactive` (`#2E323B`) fill with `1px` `border-default` (`#323640`) and `ivory-primary` (`#F5F2EB`) label.
- **Ghost:** Transparent background with `stone-secondary` (`#B5B0A4`) label for low-priority actions (`Cancelar`, `Fechar`).
- **Danger:** `coral-subtle` (`rgba(248, 113, 113, 0.15)`) fill with `1px` `coral-danger` border and `#F87171` label.

### Badges (`src/ui/primitives/badge.tsx`)
- **Style:** Tinted subtle background paired with high-contrast semantic label (`primary`, `neutral`, `success`, `warning`, `danger`, `info`), `6px` radius, `4px 8px` padding.

### Cards (`src/ui/primitives/card.tsx`)
- **Corner Style:** `14px` radius (`lg`).
- **Background:** `walnut-card` (`#1B1D22`) for `default`, `slate-elevated` (`#24272E`) for `elevated`, `obsidian-canvas` (`#121316`) for `subtle`.
- **Border:** `1px solid #262930` (`border-subtle`).
- **Internal Padding:** `16px` (`lg`) default.

### Inputs (`src/ui/primitives/input.tsx`)
- **Style:** `obsidian-canvas` (`#121316`) well, `1px solid #323640` (`border-default`), `10px` radius, `44px` minimum height, `ivory-primary` text, `parchment-muted` placeholder.
- **Focus / Error:** Border shifts to `amber-brass` (`#E5A93C`) on focus or `coral-danger` (`#F87171`) when an error message is present.

### Navigation (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`)
- **Style:** `obsidian-canvas` (`#121316`) header and tab bar separated by a `1px` `#262930` hairline, with `amber-brass` (`#E5A93C`) active tab tint and `parchment-muted` (`#8A857A`) inactive tint.

## Do's and Don'ts

### Do:
- **Do** import all colors, spacing, typography, and radii from `@/ui/tokens` and compose screens with `@/ui` primitives (`Button`, `Card`, `Badge`, `Input`, `SectionHeader`, `EmptyState`, `ScreenContainer`).
- **Do** wrap scrollable tab screens in `ScreenContainer` so Web Localhost views stay centered at `920px` max width.
- **Do** maintain at least `4.5:1` contrast for all body/metadata text and `44x44pt` touch targets on every pressable element.

### Don't:
- **Don't** hardcode legacy Tailwind slate/indigo hex values (`#0f172a`, `#1e293b`, `#334155`, `#6366f1`, `#4f46e5`) in any screen or component.
- **Don't** place two `primary` (`amber-brass`) buttons side by side in the same card, toolbar, or modal footer.
- **Don't** use thick colored left borders (`borderLeftWidth > 1`) or zero-offset neon glow shadows on cards.
