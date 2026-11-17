# Research & Architectural Decisions: AI-Assisted Rulebook Acquisition & Auto-Download Sync

**Feature**: `013-ai-rulebook-download-sync`
**Date**: 2026-11-17

## Executive Summary

The previous batch sync button merely scanned local disk files and fell back to generating synthetic plain-text LLM summaries disguised as PDFs. The user explicitly rejected synthetic text and requested that the system actively locate authentic, illustrated Brazilian Portuguese (`pt-BR`) publisher PDFs, download their binary content into `assets/rulebooks/`, and associate them in SQLite and the physical versioned catalog `assets/data/virtualstand-catalog.json`.

This research document details the architectural decisions for the discovery, verification, download, and registration pipeline.

---

## Architectural Decisions

### 1. Hybrid Rulebook Discovery Architecture (Curated Registry + AI Search Grounding)

- **Problem**: Brazilian board game rulebooks are distributed across several distinct publisher websites (Galápagos, Devir, Papergames, Grok, Conclave, MeepleBR) and open community archives (Panda Board Games, Bravo Jogos). Some sites use bot-gated interfaces (Cloudflare Turnstile on Ludopedia) or require interactive sessions (BGG files), while others host direct public PDFs or Google Drive downloads.
- **Decision**: Adopt a hybrid two-tier resolution strategy:
  1. **Tier 1 (Curated Community & Publisher Registry)**: High-speed, deterministic lookup using pre-indexed public Google Drive IDs and direct publisher URLs (covering hundreds of verified Brazilian titles from Panda Board Games, Bravo Jogos, Scorpion Masqué, etc.).
  2. **Tier 2 (AI Search Grounding Fallback)**: For titles unindexed in Tier 1, invoke Gemini 3.8 Flash with Google Search Grounding (`tools: [{ googleSearch: {} }]`). Extract candidate URLs from `groundingChunks` (e.g., direct publisher links, Amazon user guides, or public shared storage), and test candidates with HTTP HEAD/GET.
- **Rationale**: Guarantees sub-second resolution for verified major catalog titles while maintaining autonomous discovery for new or unindexed games, without brittle HTML scraping of bot-gated sites.

### 2. Binary Stream Integrity & PDF Signature Validation

- **Problem**: When scraping or following search results, endpoints sometimes return HTTP 200 with HTML error pages, Cloudflare challenge captchas, or 404 pages disguised as successful responses.
- **Decision**: Every downloaded file must undergo binary validation:
  - Check HTTP status 200 and Content-Type (if present).
  - Inspect the leading 5 bytes of the binary payload to guarantee it strictly matches `%PDF-`.
  - Discard any payload that fails this check with an explicit `NOT_A_PDF` error code.
  - Zero synthetic text or canvas-rendered summaries: only authentic binary documents are written to disk.
- **Rationale**: Prevents corrupted files or HTML challenge pages from polluting the `assets/rulebooks/` asset directory.

### 3. Localhost & Dev Execution Isolation

- **Problem**: React Native and mobile environments cannot arbitrarily write new static asset files into the bundled application package at runtime without backend assistance.
- **Decision**: The downloader runs via the dev API route `app/api/find-rulebook+api.ts`:
  - When running in dev/localhost (`isLocalhostOrDev()`), `batchSyncService` triggers `/api/find-rulebook`.
  - The API route downloads the verified binary PDF, writes it directly into the physical repository path `assets/rulebooks/${slug}-regras-ptbr.pdf`, and returns metadata.
  - `batchSyncService` receives the confirmation and creates the SQLite record as `READY`.
  - The updated catalog is immediately persisted to `assets/data/virtualstand-catalog.json`.
- **Rationale**: Allows the developer to curate and populate the repository on localhost, version the resulting PDFs and catalog in Git, and distribute them cleanly to the mobile app without requiring remote storage infrastructure.

### 4. Precision Slug & Boundary Matching

- **Problem**: Naive substring matching creates false positives (e.g., the title "TEN" matching "explodingkittens-regras-ptbr.pdf" because of the letters "ten", or "Cat and the Tower" matching "catan-regras-ptbr.pdf").
- **Decision**: Implement strict matching hierarchy:
  1. Exact slug match: `${slug}-regras-ptbr.pdf`.
  2. Boundary-aware prefix match: `slug.startsWith(fileBase + '-')` with minimum word length.
  3. Rejection of substrings that do not align with token boundaries.
- **Rationale**: Guarantees 100% precision in associating rulebooks to the exact game.

---

## Performance & Resource Budget

- **Download Concurrency**: Sequential or throttled (1-2 parallel requests) to avoid triggering IP rate-limiting from public file hosts.
- **Disk Footprint**: High-resolution PDFs average 1 to 15 MB per title. The 36 verified titles total ~61 MB, well within modern mobile device storage budgets.
- **Timeout Thresholds**: 15-second timeout per remote fetch to prevent hanging batches.
