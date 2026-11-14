<!--
SYNC IMPACT REPORT
- Version Change: Uninitialized ([CONSTITUTION_VERSION]) -> 1.0.0 (Initial Ratification)
- Principles Defined:
  * [PRINCIPLE_1_NAME] -> I. Offline-First & Local Data Ownership
  * [PRINCIPLE_2_NAME] -> II. Procedural 3D Virtual Shelf & Real-Scale Immersion
  * [PRINCIPLE_3_NAME] -> III. Resilient Asynchronous External Integrations
  * [PRINCIPLE_4_NAME] -> IV. Modular Layered Architecture & Separation of Concerns
  * [PRINCIPLE_5_NAME] -> V. Type Safety, Performance Budgets & Test Discipline
- Added Sections:
  * Technology Stack & Technical Constraints (replacing [SECTION_2_NAME])
  * Development Workflow & Quality Gates (replacing [SECTION_3_NAME])
- Removed Sections: None
- Templates Requiring Updates:
  * .specify/templates/plan-template.md: ✅ Aligned with mobile/Expo/3D architecture
  * .specify/templates/spec-template.md: ✅ Aligned with requirement & priority structure
  * .specify/templates/tasks-template.md: ✅ Aligned with phased TDD delivery
- Runtime Documentation Updates:
  * README.md: ✅ Updated with project overview and constitution link
- Follow-up TODOs: None (all core template tokens resolved)
-->

# VirtualStand Constitution

## Core Principles

### I. Offline-First & Local Data Ownership
The application MUST store all user collection data, ratings, game metadata, manual paths, and sleeve records locally using SQLite (`expo-sqlite` with Drizzle ORM). The user MUST be able to browse their collection, view game details, inspect sleeves, read manuals, and interact with the 3D shelf entirely offline without active network connectivity. Remote data synchronization (such as with BoardGameGeek) MUST act as an upstream sync provider reconciling into local state via idempotent diffs (keyed by BGG item ID and user collection ID `collid`), never as a blocking runtime dependency for core application operations.
*Rationale: Board game sessions frequently take place in venues with poor or absent network connectivity. The application must remain fully functional and resilient regardless of remote service availability, API latency, or rate limits.*

### II. Procedural 3D Virtual Shelf & Real-Scale Immersion
3D board game boxes MUST be generated procedurally at runtime using real-world physical dimensions (width, height, depth) obtained from BGG physical version metadata (`<item type="boardgameversion">`) or sensible default fallbacks. Pre-modeled static 3D meshes (.glb/.gltf) per individual game title are forbidden for collection display. Boxes MUST use a multi-material approach: front face rendered with high-quality box cover art, and spine/sides rendered procedurally using dominant color extraction and dynamically drawn game titles (Canvas/Skia) when lateral cover art is unavailable. 3D scene interactions (selecting, pulling out a box, rotating, inspection) MUST use efficient raycasting and run on the native gesture/animation thread (`react-native-gesture-handler` + `react-native-reanimated`) without stalling the JavaScript event loop.
*Rationale: Physical board game collections vary in scale and edition. Procedural generation scales to thousands of titles with zero per-game modeling overhead, while real-scale rendering preserves authentic shelf visual hierarchy (e.g., Kallax dimensions).*

### III. Resilient Asynchronous External Integrations
All external API communications (specifically BoardGameGeek XMLAPI2) MUST implement resilient asynchronous patterns:
- Handling BGG's HTTP 202 Accepted background queue responses using deterministic polling with exponential backoff and jitter.
- Enforcing strict client-side rate limiting and request queueing to respect external service limits.
- Graceful caching and schema normalization before persisting to the local database.
Third-party data limitations (such as card sleeve specs missing from official BGG endpoints) MUST be resolved via community datasets or proxy catalogs, stored locally, and editable by the user.
*Rationale: The BGG XMLAPI2 is asynchronous and susceptible to rate-limiting; naive, unthrottled requests cause application freezes, timeouts, or sync failures.*

### IV. Modular Layered Architecture & Separation of Concerns
The codebase MUST strictly separate presentation (UI components, 3D scenes via `@react-three/fiber/native` + `expo-gl`), animation/gestures, domain business logic, and persistence/sync services:
- 3D presentation components MUST NOT execute direct database queries or raw network requests; state and mutations must flow through dedicated typed hooks, repositories, or stores.
- Application logic and domain models MUST remain decoupled from platform-specific APIs where practical, enabling cross-platform code sharing (Mobile and Web).
- Heavy CPU workloads (XML parsing, image color extraction, complex geometry calculations) MUST be offloaded from the UI/render loop.
*Rationale: 3D render pipelines are computationally sensitive. Keeping data management and heavy business logic outside the render loop prevents frame drops and bridge congestion.*

### V. Type Safety, Performance Budgets & Test Discipline
The entire codebase MUST use strict TypeScript with zero untyped `any` allowances. Database schemas, API responses, and 3D mesh parameters MUST be strictly typed with end-to-end type inference (Drizzle ORM + Zod/TypeScript contracts).
- **Performance Budget**: The 3D viewport MUST target a stable 60 FPS on standard modern mobile devices. Collections exceeding visible bounds MUST employ frustum culling, level-of-detail (LOD) degradation, or lazy-instanced meshes to prevent GPU memory saturation.
- **Memory Discipline**: In-memory texture dimensions must be bounded (maximum 1024x1024 per face) and disposed properly when scenes unmount to prevent native heap exhaustion.
- **Test Discipline**: Core business logic—XML parsers, backoff algorithms, unit conversion (inches to scene units), sleeve inventory math, and database migrations—MUST have comprehensive automated unit and contract tests before implementation.
*Rationale: High-performance mobile 3D requires strict memory and CPU discipline. Strong types and automated tests ensure stability across iOS, Android, and Web platforms.*

## Technology Stack & Technical Constraints

The system architecture is standardized on the following stack:
- **Core Mobile Framework**: React Native + Expo (current SDK) with TypeScript in Strict Mode.
- **Routing & Navigation**: Expo Router (file-based navigation).
- **3D Graphics & Rendering**: `@react-three/fiber/native`, `three`, and `expo-gl`.
- **Gestures & Animations**: `react-native-gesture-handler` and `react-native-reanimated` running on the UI thread.
- **Local Persistence**: `expo-sqlite` managed via `Drizzle ORM` for migrations and typed queries.
- **Document & Asset Storage**: `expo-file-system` for local PDF rules storage; `react-native-pdf` for offline rulebook viewing.
- **External Data Providers**: BoardGameGeek XMLAPI2 client with resilient 202 polling; community sleeve dataset (e.g. Sleeve Size GeekList 164572 / open mapping) mapped to `bgg_id`.
- **Optional Edge Proxy**: Lightweight worker (Cloudflare Workers / Node) dedicated exclusively to proxying/caching BGG XML responses and consolidating sleeve catalogs.

## Development Workflow & Quality Gates

Every feature implementation and pull request MUST satisfy the following quality gates:
1. **Architecture & Compliance Gate**: Verify feature alignment with Core Principles (offline-first capability, procedural 3D box generation, layered architecture).
2. **Typecheck & Linting Gate**: Zero TypeScript compiler errors with `strict: true`, zero ESLint errors or warnings.
3. **Automated Testing Gate**: 100% test pass rate for all unit and integration tests covering parsers, converters, database migrations, and sync logic.
4. **Performance & Memory Gate**: No memory leaks in Three.js scenes, proper disposal of geometries and textures, and verified 60 FPS rendering under collection scrolling.
5. **Offline Verification Gate**: Every feature interacting with remote services MUST demonstrate functional fallback behavior when network connectivity is disabled.

## Governance

This constitution defines the non-negotiable architectural invariants and quality constraints for VirtualStand. It supersedes informal agreements, conventions, or ad-hoc design choices.

1. **Compliance Review**: All feature specifications (`spec.md`), implementation plans (`plan.md`), and pull requests MUST include a Constitution Compliance review prior to implementation and merge. Any complexity or deviation from these principles must be explicitly justified and documented.
2. **Amendment Procedure**: Amendments to this constitution require a documented rationale, an evaluation of impact across mobile and 3D subsystems, and consensus among core project maintainers.
3. **Versioning Policy**: This constitution is versioned using Semantic Versioning (SemVer):
   - **MAJOR**: Incompatible governance changes, removal or fundamental redefinition of core principles or architectural foundations.
   - **MINOR**: Addition of new principles, new quality gates, or materially expanded architectural guidance.
   - **PATCH**: Clarifications, non-semantic wording improvements, and typo corrections.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
