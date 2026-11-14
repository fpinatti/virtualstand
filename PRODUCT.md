# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Board game collectors, hobbyists, and tabletop group hosts managing physical game libraries of 10 to 500+ titles. They use VirtualStand both while organizing physical shelves at home and during live game nights at the table—frequently in warm, dim ambient lighting and in venues with unreliable or absent internet connectivity.

## Product Purpose

VirtualStand is an offline-first companion application that bridges a collector's digital BoardGameGeek (BGG) catalog with their physical tabletop reality: rendering a real-scale 3D Kallax-style virtual shelf, tracking card sleeve inventory and shopping deficits, storing offline PDF rulebooks with page-level bookmarks and notes, and logging play sessions with personal ratings.

## Positioning

Unlike web-bound catalog trackers or generic spreadsheet apps, VirtualStand combines deterministic BGG XMLAPI2 synchronization (handling HTTP 202 queues) with procedural 3D box generation based on actual edition dimensions, integrated card-sleeve math, and an offline PDF rulebook reader—all persisted locally in SQLite so it never stalls at the gaming table.

## Operating Context

- **At the gaming table:** Quick reference of PDF rulebooks, jumping to bookmarked setup/FAQ pages, and logging session winners and scores immediately after a match.
- **At the physical shelf:** Visualizing how boxes pack into cubbies in 3D scale and checking personal ratings or box dimensions.
- **Before buying expansions or accessories:** Auditing un-sleeved card decks against spare sleeve packs in stock to generate an accurate shopping list by millimeter format.

## Capabilities and Constraints

- **Offline-First Architecture:** All collection items, box dimensions, sleeve requirements, spare sleeve inventory, PDF rulebook metadata/annotations, play sessions, and personal ratings live locally in SQLite (`expo-sqlite` / Drizzle ORM).
- **Cross-Platform Runtime:** React Native + Expo SDK 52 targeting iOS, Android, and Web Localhost (`react-native-web`).
- **Procedural 3D Rendering:** `@react-three/fiber` + `three` rendering procedural box meshes from real physical dimensions (`widthCm`, `heightCm`, `depthCm`) and deterministic high-contrast spine textures.
- **Language & Copy:** All user-facing interface copy is in Brazilian Portuguese (`pt-BR`), using clear, domain-authentic tabletop terminology (*Coleção*, *Estante 3D*, *Sleeves*, *Manuais*, *Partidas*).

## Brand Commitments

- **Domain Voice:** Knowledgeable, tactile, calm, and utility-driven—speaking the language of tabletop hobbyists without childish gimmicks or generic SaaS marketing jargon.

## Evidence on Hand

- Local SQLite schema and repositories in `src/db/` covering 12 core tables (`games`, `box_dimensions`, `collection_items`, `sync_logs`, `game_sleeves`, `sleeve_inventory`, `rulebooks`, `rulebook_bookmarks`, `rulebook_notes`, `players`, `play_sessions`, `play_participants`, `personal_ratings`).
- Verified community card-sleeve dataset in `src/data/sleeve-catalog.json`.
- Procedural 3D shelf layout and spine texture engine in `src/services/shelf-layout.service.ts` and `src/services/spine-generator.service.ts`.

## Product Principles

1. **Tabletop Readiness Over Network Dependency:** Every core workflow must respond instantaneously from local storage whether the device is online or in airplane mode.
2. **Physical Fidelity:** Digital representations—box proportions, millimeter sleeve dimensions, and page numbers—must faithfully mirror the physical components on the shelf.
3. **Calm Low-Light Ergonomics:** The interface must remain comfortable to read during multi-hour evening sessions without washing out the artwork of the games themselves.
4. **One Clear Action Per Context:** Every screen, sheet, and empty state must make the primary task immediately obvious without visual clutter.

## Accessibility & Inclusion

- Minimum 4.5:1 contrast ratio for all body and secondary copy, and 3.0:1 for large titles, active controls, and status indicators (WCAG 2.1 AA).
- Minimum 44x44pt touch targets across all interactive controls on both mobile touchscreens and desktop pointers.
