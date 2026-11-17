# Quickstart & Verification Guide: Mobile UX & 3D Shelf Audit Fixes

**Feature**: `014-mobile-ux-shelf-fixes`  
**Date**: 2026-11-17

## Test Scenarios & Manual Verification Steps

### 1. Verification of Bottom Tab Bar Icons
1. Run `npx expo start --go` or `npm run start:go` to open the app on an Android or iOS device in Expo Go.
2. Look at the bottom navigation bar.
3. **Verify**:
   - "Coleção" shows a book/library vector icon.
   - "Estante 3D" shows a 3D cube/box vector icon.
   - "Configurações" shows a gear/settings vector icon.
   - Zero missing-glyph rectangle boxes (`􀀀`) appear.

### 2. Verification of Game Details Modal & Safe Rulebook Opening
1. On the "Coleção" screen, tap any game that has a rulebook (e.g. *Azul*, *Wingspan*, *Academia*).
2. Inspect the "Manuais de Regras" section in the details sheet.
3. **Verify**:
   - The "+ Anexar PDF" button is removed.
   - The "🔍 Ludopedia" button is removed.
   - The inline "Ler", "Renomear", and "Excluir" links are removed.
   - Only the clean rulebook card is displayed.
4. Tap directly on the rulebook card.
5. **Verify**:
   - The details modal cleanly dismisses.
   - The rulebook screen opens without freezing or locking the screen.
   - The top header has a prominent "Voltar" / back button.
   - Tapping "Voltar" immediately returns to the previous screen.

### 3. Verification of 3D Shelf Textures & Wider Lateral FOV
1. Navigate to the "Estante 3D" tab.
2. Scroll through the aisle corridor.
3. **Verify**:
   - Box covers and spines render with their proper images and title typography.
4. Tap the "◀ Esquerda" or "Direita ▶" lateral focus button.
5. **Verify**:
   - The camera steps back and broadens its field of view (FOV ~70°).
   - Multiple shelf cubbies are comfortably visible simultaneously with zero claustrophobic over-zoom.
6. Tap the central focus button to return to corridor view.
7. **Verify**:
   - The camera smoothly transitions back to default central corridor alignment and FOV.
