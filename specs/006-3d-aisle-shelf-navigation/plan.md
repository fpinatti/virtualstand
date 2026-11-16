# Implementation Plan: Corredor 3D de Estantes Paralelas e Navegação em Primeira Pessoa

**Branch**: `[006-3d-aisle-shelf-navigation]` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-3d-aisle-shelf-navigation/spec.md`

## Summary

Transformar a seção **Estante 3D** de uma estante frontal única em um **corredor tridimensional de biblioteca/ludoteca** com duas estantes paralelas frente a frente (`LEFT` e `RIGHT`), passarela central iluminada e câmera em primeira pessoa. O usuário caminha para frente e para trás pelo corredor deslizando o dedo verticalmente (ou usando o scroll no Web), pode clicar em qualquer lado da estante para girar a câmera suavemente na direção escolhida (`Esquerda` ou `Direita`), retornar à **Visão Central** padrão com um toque, e extrair/inspecionar caixas de ambos os lados do corredor.

## Technical Context

**Language/Version**: TypeScript 5.3+ (`strict: true`) sobre React Native 0.76.7 / Expo SDK 52  
**Primary Dependencies**: `@react-three/fiber` (`^8.18.0`), `three` (`^0.168.0`), `expo-gl` (`~15.0.3`), `@/ui` (Impeccable Design System)  
**Storage**: SQLite local existente (`games`, `collection_items`, `box_dimensions` via Drizzle ORM) — sem alteração de schema  
**Testing**: Jest + `ts-jest` (`npm test` e `npm run ui:audit`)  
**Target Platform**: iOS, Android e Web Localhost (`react-native-web`)  
**Project Type**: Mobile + Web Cross-Platform App (Expo Router)  
**Performance Goals**: 60 FPS estáveis durante a interpolação de caminhada (`Z`) e rotação lateral (`yaw`) da câmera  
**Constraints**: 100% offline-first, geometria 3D 100% procedural (zero `.glb`/`.gltf`), conformidade estrita com tokens e primitivas do sistema Impeccable (`@/ui`)  
**Scale/Scope**: Suporta coleções de 1 a 500+ jogos com extensão longitudinal dinâmica do corredor (`cols >= 3` seções por parede, `rows = 4` andares por parede)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Offline-First & Local Data Ownership**: ✅ Aprovado. Toda a geração do corredor 3D consome exclusivamente os dados locais do SQLite (`useShelfCollection`), funcionando 100% offline.
- **II. Procedural 3D Virtual Shelf & Real-Scale Immersion**: ✅ Aprovado. As duas estantes paralelas, o piso do corredor, as luminárias de teto e as caixas dos jogos são gerados proceduralmente em escala física real (`1 unidade = 10 cm`) com texturas dinâmicas de lombada (`SpineGeneratorService`).
- **III. Resilient Asynchronous External Integrations**: ✅ Aprovado. Nenhuma chamada de rede adicional é introduzida na renderização da cena 3D.
- **IV. Modular Layered Architecture & Separation of Concerns**: ✅ Aprovado. A matemática de empacotamento bilateral (`ShelfLayoutEngine.calculateAisleLayout`) e a cinemática de câmera (`aisleCameraController`) ficam isoladas em `src/services/`, desacopladas dos componentes React Three Fiber em `src/components/shelf-3d/`.
- **V. Type Safety, Performance Budgets & Test Discipline**: ✅ Aprovado. Contratos estritos em TypeScript (`aisle-shelf-contract.ts`), interpolação `lerp` em `useFrame` sem re-renderizações React por frame e testes unitários completos.

## Project Structure

### Documentation (this feature)

```text
specs/006-3d-aisle-shelf-navigation/
├── plan.md              # Este plano de implementação
├── research.md          # Decisões arquiteturais e cinemáticas (Fase 0)
├── data-model.md        # Entidades espaciais do corredor e estados de câmera (Fase 1)
├── quickstart.md        # Guia de validação automatizada e interativa (Fase 1)
├── contracts/
│   └── aisle-shelf-contract.ts
└── tasks.md             # Lista de tarefas ordenada (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
└── (tabs)/
    └── shelf.tsx                              # Tela da Estante 3D com controles HUD Impeccable (Esq / Centro / Dir)

src/
├── components/
│   └── shelf-3d/
│       ├── types.ts                           # Re-exporta contratos de estante e corredor 3D
│       ├── bookcase-mesh.tsx                  # Malha procedural das estantes paralelas (LEFT/RIGHT), piso, teto e luzes
│       ├── game-box-mesh.tsx                  # Malha procedural das caixas com rotação base lateral e extração p/ o corredor
│       └── shelf-scene.tsx                    # Cena 3D com câmera em primeira pessoa, gestos de caminhada e clique lateral
└── services/
    ├── shelf-layout.service.ts                # Cálculo do layout bilateral do corredor (calculateAisleLayout)
    └── aisle-camera.service.ts                # Controlador puro de caminhada (eixo Z), foco lateral (yaw/X) e detecção de arraste

tests/
└── unit/
    └── aisle-shelf-navigation.test.ts         # Suíte de testes unitários para layout bilateral e navegação no corredor
```

**Structure Decision**: Mantém a arquitetura modular existente do VirtualStand, adicionando `src/services/aisle-camera.service.ts` para a matemática pura de navegação no corredor e evoluindo `src/services/shelf-layout.service.ts` e `src/components/shelf-3d/*` sem quebrar a retrocompatibilidade com os testes existentes.

## Complexity Tracking

Nenhuma violação da Constituição. Tabela de desvios não aplicável.
