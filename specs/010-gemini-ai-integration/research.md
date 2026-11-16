# Phase 0 Research: Gemini API Foundation & AI Integration Architecture

## Research Findings & Architectural Decisions

### 1. Direct REST Client vs Heavy SDK in React Native

- **Context**: VirtualStand runs on Expo SDK 58 across Android (Expo Go / Standalone), iOS, and Web.
- **Decision**:
  - Implement a dedicated, lightweight `GeminiClient` using standard platform `fetch` and `AbortController` against Google's Gemini v1beta REST endpoints (`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`).
- **Rationale**:
  - Zero heavy third-party SDK dependencies (keeps mobile bundle lean and prevents Hermes/Node polyfill collisions).
  - 100% cross-platform compatibility across Expo Go, standalone Android/iOS builds, React Native Web, and Jest test runner.
  - Granular control over timeouts (`AbortSignal`), headers, JSON schema constraints, and error classification.
- **Alternatives Considered**:
  - `@google/genai` or `@google/generative-ai`: Evaluated, but adds transitive dependencies and potential native stream polyfill issues in React Native Hermes runtime. Standard HTTP `fetch` is robust, transparent, and simpler to mock in tests.

---

### 2. Default Model Selection & Parameter Optimization

- **Context**: Future features will include rulebook Q&A, board game recommendations, and component analysis.
- **Decision**:
  - Default model: `gemini-2.0-flash` (with configurable fallback to `gemini-1.5-flash`).
  - Standard endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`.
  - Structured output support via `generationConfig.responseMimeType = "application/json"`.
- **Rationale**:
  - `gemini-2.0-flash` provides sub-second latency, high instruction fidelity, and generous free-tier quotas ideal for mobile tabletop companion use.

---

### 3. API Key Management & Environment Resolution

- **Context**: VirtualStand uses `.env` with `loadDotEnv()` in `app.config.js` and Expo's built-in `EXPO_PUBLIC_` prefix for client-side environment exposure.
- **Decision**:
  - Resolve the key through `process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY`.
  - Update `.env.example` to document `EXPO_PUBLIC_GEMINI_API_KEY`.
  - Allow runtime key override in `GeminiClient` constructor or methods.

---

### 4. Offline-First Resilience & Error Governance (Constitution Principle I)

- **Context**: VirtualStand is an offline-first app. AI features must never degrade core local catalog, sleeve inspection, or 3D shelf operations.
- **Decision**:
  - Fast timeout (default 15 seconds, ping timeout 5 seconds).
  - Clear error categorization:
    - `MISSING_API_KEY`: Key not provided.
    - `AUTH_INVALID_KEY`: HTTP 400/401/403 with invalid credentials.
    - `RATE_LIMITED`: HTTP 429 quota exhaustion.
    - `OFFLINE_NETWORK_ERROR`: Network offline or request timed out.
    - `SAFETY_REFUSAL`: Content blocked by Google safety filters.
    - `PARSE_ERROR`: Response failed schema parsing.
  - Core app features never wait on or require Gemini responses to function.
