# Implementation Plan: Sistema de Design e Governança Visual Impeccable

**Branch**: `005-impeccable-ui-system` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-impeccable-ui-system/spec.md`

## Summary

Instalar e integrar o sistema de design e governança visual **Impeccable** ao VirtualStand para gerenciar toda a camada de UI do aplicativo. A abordagem técnica combina:
1. Instalação do pacote `impeccable` e criação dos documentos canônicos `PRODUCT.md` e `DESIGN.md` na raiz do projeto, definindo a direção estética autoral **"Tactile Tabletop Lounge"** (Obsidiana Quente, Marfim Editorial e Latão Âmbar) e eliminando clichês visuais de IA.
2. Criação de uma camada centralizada de design em `src/ui/` composta por tokens semânticos estritamente tipados (`src/ui/tokens.ts`), motor determinístico de auditoria de contraste WCAG AA e detecção de anti-padrões (`src/ui/audit.ts`), e primitivas de UI reutilizáveis (`Button`, `Card`, `Badge`, `Input`, `SectionHeader`, `EmptyState`, `ScreenContainer`).
3. Refatoração completa de todas as telas (`app/(tabs)/*`, `app/rulebook/[id].tsx`, `app/_layout.tsx`) e componentes de domínio (`GameDetailSheet`, `Rulebooks`, `PlayLog`, `PersonalRatingInput`, `ShelfScene` overlay) para consumir exclusivamente os tokens e primitivas do sistema de design.

## Technical Context

**Language/Version**: TypeScript 5.3+ (`strict: true`, zero `any`)

**Primary Dependencies**: React Native 0.76.7, Expo SDK 52, Expo Router ~4.0.0, React Native Web ~0.19.13, `impeccable` ^4.9.1

**Storage**: N/A (camada de apresentação e governança estática; preserva 100% do schema SQLite existente em `src/db/schema.ts`)

**Testing**: Jest 29 + `ts-jest` (testes determinísticos de contraste WCAG 2.1, invariantes de escala, área de toque e auditoria de conformidade de código em `tests/unit/impeccable-ui-system.test.ts`)

**Target Platform**: iOS, Android e Web Localhost (`react-native-web`)

**Project Type**: Mobile + Web Cross-Platform Application (Expo / React Native)

**Performance Goals**: 60 FPS estáveis na navegação entre abas, rolagem de listas e animações da Estante 3D; zero sobrecarga de runtime em folhas de estilo (`StyleSheet.create` pré-calculado)

**Constraints**: Offline-first (zero fontes remotas bloqueantes ou CDNs externas); relação de contraste mínima 4.5:1 para textos normais e 3.0:1 para textos grandes/status; área mínima de toque de 44x44pt; contenção de largura máxima (`920px`) no modo Web

**Scale/Scope**: 6 rotas de tela (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `collection.tsx`, `shelf.tsx`, `sleeves.tsx`, `settings.tsx`, `app/rulebook/[id].tsx`) e 11 componentes de UI em `src/components/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Research Check | Post-Design Check | Notes |
|-----------|--------------------|-------------------|-------|
| **I. Offline-First & Local Data Ownership** | ✅ PASS | ✅ PASS | Todos os tokens, estilos e primitivas são empacotados localmente sem dependência de CDNs ou fontes remotas. |
| **II. Procedural 3D Virtual Shelf & Real-Scale Immersion** | ✅ PASS | ✅ PASS | A geometria procedural 3D (`BookcaseMesh` e `GameBoxMesh`) permanece intacta; o fundo da cena e o badge flutuante harmonizam com os tokens `surface.canvas` e `surface.glassOverlay`. |
| **III. Resilient Asynchronous External Integrations** | ✅ PASS | ✅ PASS | Os indicadores visuais da fila HTTP 202 do BGG e progresso de download de PDFs passam a usar tokens semânticos de status (`warning`, `info`, `success`, `danger`). |
| **IV. Modular Layered Architecture & Separation of Concerns** | ✅ PASS | ✅ PASS | Isola toda a definição visual em `src/ui/` (tokens, auditoria e primitivas), mantendo componentes de domínio desacoplados de valores mágicos de estilo. |
| **V. Type Safety, Performance Budgets & Test Discipline** | ✅ PASS | ✅ PASS | Contratos 100% tipados sem `any`, `StyleSheet.create` estático e testes unitários determinísticos para validação matemática de contraste e conformidade. |

## Security & Verification Plan (Mandatory Secure Web Guidelines)

- **Framework-Native Escaping (XSS Prevention)**: Todos os textos nas primitivas (`Button`, `Badge`, `SectionHeader`, `EmptyState`, `Input`) e telas são renderizados exclusivamente via nós `<Text>` do React Native / React Native Web com auto-escape nativo do React. Nenhum uso de `dangerouslySetInnerHTML`, `innerHTML` ou `document.write`.
- **Safe UI Interactions**: Proibido o uso de diálogos bloqueantes nativos do navegador (`window.alert`, `window.confirm`, `window.prompt`); confirmações destrutivas e avisos utilizam componentes modais/inline da própria interface.
- **No Sensitive Storage or External Assets**: Nenhum token de autenticação é armazenado em `localStorage` e nenhum script/estilo externo é carregado via CDN.
- **Localhost Binding**: Servidores de desenvolvimento e verificação Web escutam estritamente em `localhost` (`127.0.0.1`).

## Project Structure

### Documentation (this feature)

```text
specs/005-impeccable-ui-system/
├── plan.md                        # Este arquivo (/speckit-plan)
├── research.md                    # Decisões de arquitetura e direção estética (Fase 0)
├── data-model.md                  # Modelo de dados de tokens, primitivas e auditoria (Fase 1)
├── quickstart.md                  # Guia de validação rápida (Fase 1)
├── contracts/
│   └── ui-system-contract.ts      # Contratos TypeScript de tokens, primitivas e auditoria (Fase 1)
└── tasks.md                       # Lista de tarefas de implementação (/speckit-tasks - Fase 2)
```

### Source Code (repository root)

```text
PRODUCT.md                         # Contexto canônico de produto exigido pelo Impeccable
DESIGN.md                          # Especificação completa do Design System Impeccable

src/
├── ui/
│   ├── index.ts                   # Barrel export do sistema de UI Impeccable
│   ├── tokens.ts                  # Catálogo central de tokens semânticos (Tactile Tabletop Lounge)
│   ├── audit.ts                   # Motor determinístico de cálculo de contraste WCAG e auditoria
│   └── primitives/
│       ├── button.tsx             # Botão padronizado (primary, secondary, ghost, danger; >=44pt)
│       ├── card.tsx               # Superfície/Cartão padronizado (default, elevated, outlined, subtle)
│       ├── badge.tsx              # Insígnia semântica (primary, neutral, success, warning, danger, info)
│       ├── input.tsx              # Campo de entrada padronizado com rótulo e estado de erro
│       ├── section-header.tsx     # Cabeçalho de seção com ação opcional
│       ├── empty-state.tsx        # Estado vazio padronizado com call-to-action
│       └── screen-container.tsx   # Contêiner responsivo com contenção maxContentWidth no Web
├── components/
│   ├── game-detail-sheet.tsx      # Refatorado para usar tokens e primitivas Impeccable
│   ├── personal-rating-input.tsx  # Refatorado para usar tokens Impeccable
│   ├── rulebooks/                 # Refatorado (rulebook-list, rulebook-import-sheet, annotations-panel, pdf-reader)
│   └── playlog/                   # Refatorado (play-stats-card, play-history, play-session-form, player-picker)
└── services/
    └── spine-generator.service.ts # Paleta de lombadas harmonizada com o tema

app/
├── _layout.tsx                    # Cabeçalho global e tela de carregamento com tokens Impeccable
├── (tabs)/
│   ├── _layout.tsx                # Barra de abas inferior/superior estilizada com tokens Impeccable
│   ├── collection.tsx             # Refatorada com ScreenContainer, Card, Badge, Input, EmptyState
│   ├── shelf.tsx                  # Refatorada com EmptyState, Button e badge glassOverlay
│   ├── sleeves.tsx                # Refatorada com ScreenContainer, Card, Button, Badge, Input
│   └── settings.tsx               # Refatorada com ScreenContainer, Card, Button, Input, Badge
└── rulebook/
    └── [id].tsx                   # Refatorada com tokens e primitivas Impeccable

tests/
└── unit/
    └── impeccable-ui-system.test.ts # Testes determinísticos de contraste WCAG, escalas e auditoria de código
```

**Structure Decision**: Arquitetura em camada dedicada `src/ui/` exportando tokens, auditor determinístico e primitivas reutilizáveis para `app/` e `src/components/`, acompanhada dos documentos raiz `PRODUCT.md` e `DESIGN.md` do Impeccable.

## Complexity Tracking

Nenhuma violação à Constituição do projeto. Todas as 5 diretrizes constitucionais são integralmente respeitadas.
