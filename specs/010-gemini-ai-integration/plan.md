# Implementation Plan: Gemini API Foundation & AI Integration Architecture

**Branch**: `specs/010-gemini-ai-integration` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-gemini-ai-integration/spec.md`

## Summary

Establish a lightweight, modular, and resilient Google Gemini API integration client (`src/services/ai/gemini-client.ts`) designed to power future AI capabilities (such as rulebook Q&A, smart game recommendations, and card sleeve assistants). Implemented using native cross-platform `fetch` with AbortController, structured JSON output support, environment API key resolution, connection diagnostics, and strict compliance with VirtualStand's Offline-First Constitution.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Strict Mode), Node.js 20+

**Primary Dependencies**: React Native 0.88, Expo SDK 58, Three.js 0.168, Drizzle ORM 0.36

**Storage**: Stateless client; `.env` configuration (`EXPO_PUBLIC_GEMINI_API_KEY`)

**Testing**: Jest 29 + ts-jest, mock network tests, contract tests

**Target Platform**: Android (Expo Go / Standalone), iOS, Web

**Project Type**: Mobile Application Infrastructure (Expo / React Native)

**Performance Goals**: Connection check latency <2s; offline failure response <1s; zero bundle bloat

**Constraints**: 100% Offline-First compliant (Constitution Principle I: AI failures never block core features); zero unhandled exceptions

**Scale/Scope**: Foundation client serving all upcoming AI feature implementations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Offline-First & Local Data Ownership**: Gemini API is an auxiliary, optional service. All calls are non-blocking with explicit timeouts and offline error fallbacks. Core collection, 3D shelf, and manual reader work 100% without Gemini.
- [x] **Principle II: Procedural 3D Virtual Shelf & Real-Scale Immersion**: No impact on 3D procedural shelf rendering.
- [x] **Principle III: Resilient Asynchronous External Integrations**: Implements timeout aborts, typed error taxonomy, and rate-limiting protections.
- [x] **Principle IV: Modular Layered Architecture**: Encapsulated in `src/services/ai/` and decoupled from UI components.
- [x] **Principle V: Type Safety, Performance Budgets & Test Discipline**: Strict TypeScript contracts (`contracts/gemini-ai-contract.ts`), comprehensive unit tests, zero untyped `any`.

## Project Structure

### Documentation (this feature)

```text
specs/010-gemini-ai-integration/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Architectural research & decisions
├── data-model.md        # Entities and schemas
├── quickstart.md        # Validation scenarios
├── contracts/           # TypeScript contract definitions
│   └── gemini-ai-contract.ts
└── checklists/          # Quality checklists
    └── requirements.md
```

### Source Code Layout

```text
src/
└── services/
    └── ai/
        ├── gemini-types.ts      # Re-exported types and error codes
        └── gemini-client.ts     # Lightweight HTTP Gemini API client

tests/
└── unit/
    └── gemini-client.test.ts    # Comprehensive unit and contract tests

.env.example                     # Updated with EXPO_PUBLIC_GEMINI_API_KEY
```

## Structure Decision

Organized under `src/services/ai/` to isolate AI concerns, leaving domain features free to import `geminiClient` cleanly.

## Complexity Tracking

*No constitution violations. Pure stateless HTTP service without heavyweight dependencies.*
