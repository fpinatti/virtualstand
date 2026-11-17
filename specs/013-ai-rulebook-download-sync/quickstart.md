# Quickstart: AI-Assisted Rulebook Acquisition & Auto-Download Sync

**Feature**: `013-ai-rulebook-download-sync`
**Date**: 2026-11-17

This guide demonstrates how to execute and verify the rulebook discovery and auto-download synchronization pipeline.

---

## 1. Verifying via CLI Script

To run the full collection export and download pipeline across your BGG collection:

```bash
# 1. Download verified Brazilian Portuguese PDFs
node scripts/download-verified-rulebooks.js

# 2. Export and reconcile the complete catalog snapshot
node scripts/export-catalog.mjs fpinatti
```

Verify that the catalog file exists and reflects the newly downloaded PDFs:

```bash
node -e '
const cat = require("./assets/data/virtualstand-catalog.json");
const withR = cat.games.filter(g => g.rulebooks && g.rulebooks.length > 0);
console.log(`Total games: ${cat.totalGames}, Games with manuals: ${withR.length}`);
'
```

---

## 2. Testing via Mobile App (Localhost / Dev Mode)

1. Start the development server:
   ```bash
   npm start
   ```
2. In the app, open the **Settings** tab.
3. Locate the **Dev Maintenance (Localhost)** section.
4. Tap the button:
   `📥 Verificar e Baixar Manuais`
5. Watch the progress dialog stream in real-time as each game is checked and missing manuals are resolved.
6. Upon completion, a summary modal displays:
   - Total games audited.
   - Already possessed count.
   - Newly downloaded and registered count.
   - Unavailable count.

---

## 3. Running Automated Tests

Run the full test suite to verify contract fidelity and regression resistance:

```bash
# Run unit tests
npm test tests/unit/find-rulebook-api.test.ts tests/unit/batch-sync.test.ts

# Run complete test suite
npm test

# Run TypeScript checks
npm run typecheck

# Run design token audit
npm run ui:audit
```
