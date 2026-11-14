# Quickstart & Validation Guide: Sistema de Design Impeccable (`005-impeccable-ui-system`)

**Date**: 2026-11-14
**Feature**: [spec.md](./spec.md) | **Data Model**: [data-model.md](./data-model.md) | **Contract**: [ui-system-contract.ts](./contracts/ui-system-contract.ts)

## Pré-requisitos

- Node.js 18+ e dependências instaladas (`npm install`)
- Ambiente Expo configurado (Mobile ou Web Localhost)

## Cenário 1: Verificar Documentação Canônica e Habilidades Impeccable

1. Confirme a existência dos artefatos de governança na raiz do projeto:
   - `PRODUCT.md` (Visão do produto, público-alvo colecionador, contexto de uso em mesa de jogo e voz da interface)
   - `DESIGN.md` (Direção estética *Tactile Tabletop Lounge*, tokens semânticos, escala tipográfica, regras de componentes e anti-padrões proibidos)
2. Confirme a presença das habilidades do Impeccable instaladas para o agente e o pacote `impeccable` registrado no `package.json`.

## Cenário 2: Executar Auditoria Determinística de Tokens, Contraste e Conformidade Visual

Execute a suíte de validação automatizada e checagem de tipos:

```bash
npm run typecheck
npm test
```

**Resultado Esperado**:
- `tsc --noEmit` finaliza com **0 erros**.
- Os testes unitários de auditoria visual (`tests/unit/impeccable-ui-system.test.ts`) validam:
  - Relação de contraste WCAG AA (`>= 4.5:1` para textos normais e `>= 3.0:1` para elementos gráficos/status) em todos os pares semânticos de `DesignTokens`.
  - Escala de espaçamento estritamente monotônica e alvo mínimo de toque de `44pt`.
  - Ausência da paleta clichê antiga (`#0f172a` / `#6366f1`) nas telas e componentes migrados para o sistema de design.

## Cenário 3: Inspeção Visual no Modo Web Localhost e Mobile

Inicie o servidor em modo Web Localhost:

```bash
npm run web
```

1. Acesse `http://localhost:8083/collection`:
   - Verifique o fundo Obsidiana Quente (`#121316`), cartões em `#1B1D22`, títulos em Marfim Editorial (`#F5F2EB`) e destaques em Latão Âmbar (`#E5A93C`), além da contenção centralizada (`maxWidth: 920`) em telas largas.
2. Navegue para **Estante 3D** (`/shelf`), **Sleeves** (`/sleeves`) e **Configurações** (`/settings`):
   - Confirme que todas as abas, cabeçalhos, insígnias (`Badge`), botões (`Button`), campos (`Input`) e estados vazios (`EmptyState`) utilizam as primitivas unificadas de `src/ui/`.
3. Clique em um jogo para abrir a **Ficha de Detalhes (`GameDetailSheet`)** e o **Leitor de Manuais (`/rulebook/[id]`)**:
   - Verifique a hierarquia clara com no máximo 1 botão primário por seção ativa e distinção imediata para ações destrutivas.
