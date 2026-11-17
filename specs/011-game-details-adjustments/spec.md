# Feature Specification: Game Details Screen Adjustments (011-game-details-adjustments)

## User Goal & Context
The user uses VirtualStand primarily as a fast, offline-first consultation tool during board game sessions, rather than a data entry or configuration app.
To streamline the game details sheet (`GameDetailSheet`):
1. **Sleeves Section**: Rename "Sleeves Necessários" to "Sleeves". Remove creation/editing/deletion actions, keeping a clean list of required sleeve formats, dimensions, and card quantities.
2. **Rulebooks Section**: Add a direct button to download/sync Brazilian Portuguese (pt-BR) manuals on demand whenever the user doesn't already have them offline.
3. **Tags**: Remove custom tags section completely from the game details sheet.
4. **Physical Box Dimensions**: Remove box dimension calibration/editing; display box dimensions directly in read-only mode.
5. **Personal Notes**: Remove the personal notes text area and "Salvar Anotações" button, keeping the sheet purely focused on reading and consulting.

## Requirements

### FR-001: Simplified Sleeves Consultation
- Rename section header from "Sleeves Necessários" to "Sleeves".
- Remove "+ Formato" button, form fields, and item deletion ("✕") buttons.
- Display sleeve formats, millimeter dimensions (e.g., `63.5 x 88 mm`), and card quantities (`X un.`) clearly.
- Maintain zero-card game messaging when applicable.

### FR-002: On-Demand PT-BR Rulebook Download
- In the rulebooks section of `GameDetailSheet` and `RulebookList`, provide a button: "📥 Baixar manual (PT-BR)".
- When clicked, check if an official PT-BR manual is available (via bundled catalog or remote source) and register/download it for offline reading.
- When the manual is already available, show "✓ Manual em PT-BR disponível" or direct reader access.
- If no PT-BR manual is found, inform the user clearly with non-blocking feedback.

### FR-003: Removal of Custom Tags
- Remove the "Tags Personalizadas" section and associated input, add button, and chip handlers from `GameDetailSheet`.

### FR-004: Read-Only Box Dimensions
- Remove the "📐 Visualizar / Calibrar Medidas da Caixa" button that opens `BoxDimensionEditor`.
- Display physical dimensions inline: `${width} × ${height} × ${depth} cm` with estimation/verification badge.

### FR-005: Removal of Personal Notes & Save Action
- Remove the "Anotações Pessoais" multi-line text input and the "Salvar Anotações" button from `GameDetailSheet`.

## Success Criteria
- SC-001: All 5 requirements reflected in `GameDetailSheet` and related components.
- SC-002: Zero TypeScript compiler errors (`npm run typecheck`).
- SC-003: All existing and updated unit tests pass without regression (`npm test`).
- SC-004: UI adheres to Impeccable Design System tokens (`npm run ui:audit`).
