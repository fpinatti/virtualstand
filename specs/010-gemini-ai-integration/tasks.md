---
description: "Task list for Gemini API Foundation & AI Integration Architecture"
---

# Tasks: Gemini API Foundation & AI Integration Architecture

**Input**: Design documents from `specs/010-gemini-ai-integration/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/gemini-ai-contract.ts`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3])
- Exact file paths included in every task description

---

## Phase 1: Setup & Environment Configuration

**Purpose**: Configure environment definitions and create service directories.

- [x] T001 Update .env.example with EXPO_PUBLIC_GEMINI_API_KEY documentation in .env.example
- [x] T002 [P] Create AI service directory structure in src/services/ai/

---

## Phase 2: Foundational Prerequisites

**Purpose**: Core types, contract mapping, and test scaffolding.

- [x] T003 [P] Define and export Gemini AI types and contracts in src/services/ai/gemini-types.ts
- [x] T004 Create unit test suite scaffolding in tests/unit/gemini-client.test.ts

---

## Phase 3: User Story 1 - Secure Gemini API Configuration & Connectivity Verification (Priority: P1) 🎯 MVP

**Goal**: Enable loading the Gemini API key securely from environment variables, resolving active configuration, and verifying live connectivity with latency reporting.

**Independent Test**: Call `geminiClient.checkConnection()` with valid, missing, and invalid keys. Verify accurate connection status without uncaught exceptions.

### Tests for User Story 1
- [x] T005 [P] [US1] Add unit tests for API key resolution and connectivity checking in tests/unit/gemini-client.test.ts

### Implementation for User Story 1
- [x] T006 [US1] Implement GeminiClient class and checkConnection() method with latency tracking in src/services/ai/gemini-client.ts
- [x] T007 [US1] Export default singleton geminiClient and public interfaces in src/services/ai/index.ts

**Checkpoint**: User Story 1 is functional. The system can verify Gemini API connectivity and detect missing or invalid keys.

---

## Phase 4: User Story 2 - Standardized Client for Text Generation & Structured Data (Priority: P1)

**Goal**: Provide a typed `generateContent()` method supporting text prompts, system instructions, token budgeting, temperature controls, and automatic JSON response parsing.

**Independent Test**: Send a structured JSON request and verify typed parsed data is returned.

### Tests for User Story 2
- [x] T008 [P] [US2] Add unit tests for generateContent (text and structured JSON mode) in tests/unit/gemini-client.test.ts

### Implementation for User Story 2
- [x] T009 [US2] Implement generateContent() request formatting, system instruction support, and execution in src/services/ai/gemini-client.ts
- [x] T010 [US2] Implement JSON schema response extraction and type-safe payload parsing in src/services/ai/gemini-client.ts

**Checkpoint**: User Story 2 is functional. Developers can request text or structured JSON from Gemini with full TypeScript typing.

---

## Phase 5: User Story 3 - Offline Resilience & Graceful Error Handling (Priority: P2)

**Goal**: Ensure all AI requests fail fast during network drops or timeouts without blocking the UI, adhering strictly to Constitution Principle I (Offline-First).

**Independent Test**: Simulate offline network failure and rate-limiting (HTTP 429). Verify typed error classification and immediate return without UI freezing.

### Tests for User Story 3
- [x] T011 [P] [US3] Add unit tests for timeouts, offline detection, rate-limiting, and safety blocks in tests/unit/gemini-client.test.ts

### Implementation for User Story 3
- [x] T012 [US3] Implement AbortController timeout handling and network offline classification in src/services/ai/gemini-client.ts
- [x] T013 [US3] Implement Google safety block detection and rate-limit retry-after mapping in src/services/ai/gemini-client.ts

**Checkpoint**: User Story 3 is complete. AI operations are resilient and never disrupt offline local capabilities.

---

## Phase 6: Polish, Verification & Quality Gates

**Purpose**: Cross-cutting verification, TypeScript compilation, full regression testing, and design system audit.

- [x] T014 Run full test suite with Jest across all 30 test suites to guarantee zero regression
- [x] T015 Run TypeScript compiler check via npm run typecheck with strict mode
- [x] T016 Run Impeccable design system audit via npm run ui:audit to verify contrast and token adherence

---

## Dependencies & Completion Order

```text
Phase 1 (Setup) ──> Phase 2 (Foundational) ──┬──> Phase 3 (US1: Connectivity Check) 🎯 MVP
                                             └──> Phase 4 (US2: Text & Structured JSON)
                                                          │
                                                          ▼
                                             Phase 5 (US3: Offline Resilience)
                                                          │
                                                          ▼
                                             Phase 6 (Polish & Quality Gates)
```

## Parallel Execution Opportunities

- T001 and T002 can execute in parallel.
- T005, T008, and T011 test suites can be prepared in parallel.
- T003 and T004 can be created concurrently.

## MVP Implementation Strategy

1. **MVP Scope (Phase 1 to Phase 3)**: Complete environment configuration, API key resolution, and `checkConnection()` diagnostics.
2. **Increment 2 (Phase 4)**: Enable `generateContent()` for text prompts and structured JSON data.
3. **Increment 3 (Phase 5 & 6)**: Solidify timeout/offline protection and complete all quality gates.
