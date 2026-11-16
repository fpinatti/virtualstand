# Phase 1 Data Model: Simplificação de Sleeves para Consulta Direta por Jogo

**Feature**: `007-per-game-sleeve-info`  
**Date**: 2026-11-16

---

## 1. Entidade de Domínio: `GameSleeveRequirement`

Representa as especificações físicas de sleeves exigidas por um jogo específico (`bggId`), armazenadas na tabela local `game_sleeves` e pré-populadas a partir de `src/data/sleeve-catalog.json`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `number \| undefined` | Identificador local do registro em `game_sleeves` |
| `bggId` | `number` | ID do jogo no BoardGameGeek |
| `cardSetName` | `string` | Nome do baralho/conjunto de cartas (ex.: `"Baralho Principal"`, `"Cartas de Objetivo"`) |
| `formatName` | `string` | Nome comercial do formato de sleeve (ex.: `"Standard (Padrão)"`, `"Mini Euro"`) |
| `widthMm` | `number` | Largura da carta/sleeve em milímetros (ex.: `63.5`) |
| `heightMm` | `number` | Altura da carta/sleeve em milímetros (ex.: `88.0`) |
| `cardCount` | `number` | Quantidade de cartas daquele formato no jogo (ex.: `110`) |

---

## 2. Resumo Agregado por Jogo (`GameSleeveSummary`)

Calculado em memória para exibição no cabeçalho da seção de sleeves dentro de `GameDetailSheet`:

- `totalCards`: Soma de `cardCount` de todos os conjuntos de cartas do jogo (`tabular-nums`).
- `distinctFormats`: Quantidade de tamanhos distintos (`widthMm x heightMm`) exigidos pelo jogo.
