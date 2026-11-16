# Quickstart: Pre-populated Sleeves & Brazilian Portuguese Rulebooks

## Validation Scenarios

### Scenario 1: Immediate Sleeve Consultation for Collection Games
1. Start the application or run test suite.
2. Navigate to an owned game with cards (e.g. *Wingspan* or *Catan*).
3. Open the game details sheet.
4. **Verification**:
   - The sleeve section displays the pre-populated card sets (e.g., 212 standard American cards for Wingspan).
   - Zero manual typing or configuration is needed.

### Scenario 2: Zero-Card Indicator for Tile & Component Games
1. Navigate to a game with no cards (e.g. *Azul* or *Carcassonne*).
2. Open the game details sheet.
3. **Verification**:
   - The sleeve section displays: "Este jogo não utiliza cartas."
   - No empty error state or broken controls appear.

### Scenario 3: Bundled Brazilian Portuguese (PT-BR) Rulebook Access
1. In the repository, verify that `assets/rulebooks/` contains the Brazilian Portuguese PDF rulebooks.
2. Open a game with a bundled rulebook (e.g. *Catan* or *Azul*).
3. In the game details sheet, tap on the Brazilian Portuguese rulebook.
4. **Verification**:
   - The rulebook opens immediately in the PDF reader.
   - Works fully offline without internet connection.
   - Page navigation, bookmarks, and notes are functional.

## Automated Verification Commands

```bash
# 1. Typecheck validation
npm run typecheck

# 2. Unit and contract test suite
npm test tests/unit/preloaded-content.test.ts

# 3. Impeccable design system audit
npm run ui:audit
```
