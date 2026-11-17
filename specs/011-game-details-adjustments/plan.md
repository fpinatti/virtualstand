# Implementation Plan: Game Details Screen Adjustments (011-game-details-adjustments)

## Architecture & Component Changes

1. **`src/components/sleeves/game-sleeve-info.tsx`**:
   - Header renamed from "Sleeves Necessários" to "Sleeves".
   - State `showAddForm`, form inputs, `handleAddSleeve`, and `handleDeleteSleeve` removed.
   - Clean read-only rendering of formats, dimensions, and card counts.

2. **`src/data/bundled-rulebooks-catalog.ts` & `assets/rulebooks/`**:
   - Expand bundled catalog to cover additional popular games in the sleeve catalog so PT-BR downloads succeed on demand.

3. **`src/components/rulebooks/rulebook-list.tsx` & `src/hooks/use-rulebooks.ts`**:
   - Provide `downloadPtBrRulebook(bggId)` action.
   - Add button `📥 Baixar manual (PT-BR)` when manual is not yet downloaded.
   - Immediate feedback and state update.

4. **`src/components/game-detail-sheet.tsx`**:
   - Remove `notes`, `tags`, `tagInput`, `handleAddTag`, `handleRemoveTag`, `handleSave`, `saving`, `saveError`.
   - Remove "Anotações Pessoais", "Tags Personalizadas", and "Salvar Anotações".
   - Fetch dimensions via `gameRepository.getDimensionsByBggId(game.bggId)` and display read-only card.

5. **Quality Gates**:
   - Unit tests covering the simplified sleeve view, PT-BR manual download action, and read-only dimension presentation.
   - Full test run (`npm test`), strict TypeScript (`npm run typecheck`), UI audit (`npm run ui:audit`).
