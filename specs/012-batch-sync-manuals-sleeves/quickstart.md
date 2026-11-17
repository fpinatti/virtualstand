# Quickstart: Batch Sync for Rulebooks & AI-Powered Sleeves (012-batch-sync-manuals-sleeves)

## Overview
This quickstart documents the validation scenarios for Feature 012. It covers:
1. Environment detection (localhost / development visibility guard).
2. Bulk manual verification and sync.
3. Bulk sleeve audit, token budget estimation, and AI fallback execution.

---

## Scenario A: Localhost / Development Visibility Guard

### Goal
Ensure the batch maintenance panel in `app/(tabs)/settings.tsx` is visible when running locally/in dev, but hidden in production builds.

### Steps
1. In development mode (`__DEV__ === true` or browsing on `localhost:8081`):
   - Open Settings screen.
   - Verify the card `"Ferramentas de Manutenção (Localhost / Dev)"` is rendered.
2. In production mode (`__DEV__ === false` and non-localhost origin):
   - Verify the card is completely omitted from the layout.

---

## Scenario B: Bulk Rulebook Check & Sync

### Goal
Audit all games in SQLite and download available PT-BR manuals for games currently missing rulebooks.

### Steps
1. Populate database with 3 games (e.g. Catan with rulebook, Carcassonne without rulebook, Wingspan without rulebook).
2. Tap `"Verificar e Baixar Manuais"` in Settings.
3. Observe progress messages: `"Processando Catan (1 de 3)..."`, `"Processando Carcassonne (2 de 3)..."`.
4. Observe final report summary: `"2 novos manuais em PT-BR sincronizados"`.
5. Tap again to test idempotency: verify 0 new manuals are downloaded, and all are marked already synced.

---

## Scenario C: Bulk Sleeve Audit, Token Estimation & AI Fallback

### Goal
Audit games lacking sleeve records, provide an upfront token estimate, seed known titles from community catalog, and query Gemini AI for uncataloged games.

### Steps
1. Have 3 games in collection:
   - Game 1: Catan (in catalog) -> seeded via catalog (0 tokens).
   - Game 2: Azul (zero-card game) -> recognized as zero-card (0 tokens).
   - Game 3: Uncataloged Game (e.g., "Custom Indie Game") -> queries Gemini AI.
2. Verify pre-audit displays: `"1 jogo pendente de busca • Estimativa: ~220 tokens"`.
3. Tap `"Sincronizar Sleeves (Catálogo + IA)"`.
4. System executes:
   - Catan: seeded locally from `COMMUNITY_SLEEVE_CATALOG`.
   - Azul: marked zero-card.
   - Indie Game: Gemini API generates structured JSON `{ "isZeroCard": false, "sleeves": [...] }`.
5. Result report displays: `"1 semeado do catálogo • 1 sem cartas • 1 descoberto via IA (~200 tokens)"`.
6. Open game details for each title and verify sleeve specifications are populated.
