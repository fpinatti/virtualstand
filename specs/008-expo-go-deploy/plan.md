# Implementation Plan: Mecanismo de Deploy e Execução para Expo Go (Padrão Piupiu U)

**Branch**: `[008-expo-go-deploy]` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-expo-go-deploy/spec.md`

## Summary

Configurar no **VirtualStand** o mesmo mecanismo de execução e deploy para o **Expo Go** utilizado no projeto [`fpinatti/piapiupiu`](https://github.com/fpinatti/piapiupiu): criação do `app.config.js` com carregamento automático de `.env` (`EAS_PROJECT_ID`, `EXPO_OWNER`, `EXPO_PUBLIC_BGG_API_TOKEN`), template `.env.example`, configuração de `runtimeVersion: { policy: "sdkVersion" }` e `web: { bundler: "metro" }` em `app.json`, adição dos scripts `start:go`, `update:preview` e `update:prod` em `package.json`, e proteção de runtime no leitor de PDF para que o bundle rode sem falhas de módulos nativos dentro do cliente oficial **Expo Go**.

## Technical Context

**Language/Version**: TypeScript 5.3+ (`strict: true`) & Node.js CommonJS (`app.config.js`) sobre Expo SDK 52  
**Primary Dependencies**: `expo` (`~52.0.0`), `expo-updates` (`~0.26.9`), `expo-constants` (`~17.0.5`)  
**Storage**: N/A (configuração de build/deploy e variáveis de ambiente `.env`)  
**Testing**: Jest + `ts-jest` (`tests/unit/expo-go-deploy.test.ts`)  
**Target Platform**: Cliente oficial **Expo Go** (Android & iOS), EAS Update (`u.expo.dev`) e Web Localhost  
**Project Type**: Mobile + Web Cross-Platform App (Expo Router)  
**Performance Goals**: Resolução instantânea de `app.config.js` (< 5ms) e zero crashes de módulos nativos no cliente Expo Go  
**Constraints**: Nunca versionar `.env` com credenciais reais; manter compatibilidade total com `tsc --noEmit` e `npm test`  
**Scale/Scope**: Arquivos de configuração na raiz (`app.config.js`, `app.json`, `.env.example`, `package.json`), proteção em `src/components/rulebooks/pdf-reader.tsx` e suíte de testes unitários

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Offline-First & Local Data Ownership**: ✅ Aprovado. No Expo Go, `expo-sqlite` e `expo-file-system` são módulos nativos incluídos por padrão no cliente Expo Go, mantendo toda a persistência offline funcionando normalmente.
- **II. Procedural 3D Virtual Shelf & Real-Scale Immersion**: ✅ Aprovado. `expo-gl` e `three` são suportados nativamente pelo cliente Expo Go.
- **III. Resilient Asynchronous External Integrations**: ✅ Aprovado. Permite configurar `EXPO_PUBLIC_BGG_API_TOKEN` via `.env` ou pela tela de Configurações.
- **IV. Modular Layered Architecture & Separation of Concerns**: ✅ Aprovado. Isola o módulo nativo opcional `react-native-pdf` quando rodando dentro do container `storeClient` (Expo Go).
- **V. Type Safety, Performance Budgets & Test Discipline**: ✅ Aprovado. Inclui testes unitários dedicados para `app.config.js`, `app.json` e `package.json`.

## Project Structure

### Documentation (this feature)

```text
specs/008-expo-go-deploy/
├── plan.md              # Este plano de implementação
├── research.md          # Decisões técnicas (Fase 0)
├── data-model.md        # Modelo de configuração e variáveis (Fase 1)
├── quickstart.md        # Guia rápido de uso e deploy no Expo Go (Fase 1)
├── contracts/
│   └── expo-go-deploy-contract.ts
└── tasks.md             # Lista de tarefas (/speckit-tasks)
```

### Source Code (repository root)

```text
.env.example                                   # Template de variáveis (EAS_PROJECT_ID, EXPO_OWNER, EXPO_PUBLIC_BGG_API_TOKEN)
app.config.js                                  # Loader de .env e injetor dinâmico de owner, extra.eas.projectId e updates.url
app.json                                       # Adiciona runtimeVersion (policy: "sdkVersion") e web (bundler: "metro")
package.json                                   # Adiciona scripts start:go, update:preview, update:prod e expo-updates
src/
└── components/
    └── rulebooks/
        └── pdf-reader.tsx                     # Guarda condicional para evitar crash de TurboModule no cliente Expo Go
tests/
└── unit/
    └── expo-go-deploy.test.ts                 # Testes unitários validando app.config.js, app.json e scripts do package.json
```

**Structure Decision**: Replica fielmente a estrutura de deploy do `piapiupiu` na raiz do repositório, adicionando a proteção necessária para `react-native-pdf` no Expo Go.

## Complexity Tracking

Nenhuma violação da Constituição.
