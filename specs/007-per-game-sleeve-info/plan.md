# Implementation Plan: Simplificação de Sleeves para Consulta Direta por Jogo

**Branch**: `[007-per-game-sleeve-info]` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-per-game-sleeve-info/spec.md`

## Summary

Remover a seção/aba dedicada **Sleeves** (`Central de Sleeves`, `Meu Estoque` e `Lista de Compras`) da navegação principal do aplicativo e exibir as informações de sleeves que cada jogo precisa (nome do baralho, formato, dimensões `largura x altura mm` e quantidade de cartas) diretamente dentro da ficha de detalhes do jogo (`GameDetailSheet`).

## Technical Context

**Language/Version**: TypeScript 5.3+ (`strict: true`) sobre React Native 0.76.7 / Expo SDK 52  
**Primary Dependencies**: `expo-router` (`~4.0.0`), `drizzle-orm` (`^0.36.4`), `@/ui` (Impeccable Design System)  
**Storage**: Tabela local `game_sleeves` em SQLite + catálogo embutido `src/data/sleeve-catalog.json`  
**Testing**: Jest + `ts-jest` (`npm test` e `npm run ui:audit`)  
**Target Platform**: iOS, Android e Web Localhost (`react-native-web`)  
**Project Type**: Mobile + Web Cross-Platform App (Expo Router)  
**Performance Goals**: Renderização instantânea (< 16ms) dos requisitos de sleeves ao abrir `GameDetailSheet`  
**Constraints**: Zero telas de estoque/compras de sleeves; 100% de conformidade com tokens e primitivas do sistema Impeccable (`@/ui`)  
**Scale/Scope**: Impacta o layout de abas (`app/(tabs)/_layout.tsx`), remove `app/(tabs)/sleeves.tsx` e componentes de estoque, e refatora a seção de sleeves em `src/components/game-detail-sheet.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Offline-First & Local Data Ownership**: ✅ Aprovado. Os requisitos de sleeves por jogo continuam 100% locais em SQLite e populados offline a partir de `src/data/sleeve-catalog.json`.
- **II. Procedural 3D Virtual Shelf & Real-Scale Immersion**: ✅ Aprovado. Ao abrir os detalhes de uma caixa a partir do corredor 3D, a ficha exibe diretamente os sleeves necessários do jogo.
- **III. Resilient Asynchronous External Integrations**: ✅ Aprovado. Mantém o catálogo comunitário local para suprir a ausência de dados de sleeves na API do BGG.
- **IV. Modular Layered Architecture & Separation of Concerns**: ✅ Aprovado. O componente inline `GameSleeveInfoSection` consome `sleeveManagerService` sem acoplamento com telas de estoque removidas.
- **V. Type Safety, Performance Budgets & Test Discipline**: ✅ Aprovado. Tipagem estrita e preservação das suítes de testes unitários.

## Project Structure

### Documentation (this feature)

```text
specs/007-per-game-sleeve-info/
├── plan.md              # Este plano de implementação
├── research.md          # Decisões técnicas (Fase 0)
├── data-model.md        # Modelo de dados por jogo (Fase 1)
├── quickstart.md        # Guia de validação (Fase 1)
├── contracts/
│   └── game-sleeve-info-contract.ts
└── tasks.md             # Lista de tarefas (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
└── (tabs)/
    ├── _layout.tsx                            # Remove a aba "sleeves", mantendo Coleção, Estante 3D e Configurações
    └── sleeves.tsx                            # [REMOVIDO] Antiga tela Central de Sleeves

src/
├── components/
│   ├── game-detail-sheet.tsx                  # Renderiza GameSleeveInfoSection diretamente inline na ficha do jogo
│   └── sleeves/
│       ├── game-sleeve-info.tsx               # [NOVO] Seção inline mostrando formatos, medidas (mm) e qtd de cartas do jogo
│       ├── game-sleeve-manager.tsx            # [REMOVIDO] Antigo modal separado com checkboxes de envelopamento
│       ├── inventory-list.tsx                 # [REMOVIDO] Antigo controle de estoque pessoal
│       └── shopping-list-view.tsx             # [REMOVIDO] Antiga lista de compras
└── hooks/
    └── use-sleeves.ts                         # [REMOVIDO] Antigo hook global de estoque/compras
```

**Structure Decision**: Simplifica a árvore de rotas e de componentes removendo os 4 arquivos dedicados ao gerenciamento de estoque/lista de compras e consolidando a visualização de sleeves por jogo no componente inline `src/components/sleeves/game-sleeve-info.tsx`.

## Complexity Tracking

Nenhuma violação da Constituição.
