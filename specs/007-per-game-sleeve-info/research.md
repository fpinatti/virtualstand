# Phase 0 Research: Simplificação de Sleeves para Consulta Direta por Jogo

**Feature**: `007-per-game-sleeve-info`  
**Date**: 2026-11-16

---

## 1. Remoção da Aba Global "Sleeves" (`app/(tabs)/sleeves.tsx`)

- **Decision**: Remover a rota `sleeves` de `app/(tabs)/_layout.tsx` e excluir os arquivos de UI dedicados ao estoque pessoal e lista de compras (`app/(tabs)/sleeves.tsx`, `src/components/sleeves/shopping-list-view.tsx`, `src/components/sleeves/inventory-list.tsx` e `src/hooks/use-sleeves.ts`).
- **Rationale**: No Expo Router, qualquer arquivo `.tsx` presente dentro de `app/(tabs)/` é registrado como uma rota de aba. Remover `app/(tabs)/sleeves.tsx` e sua entrada em `app/(tabs)/_layout.tsx` garante que a barra de navegação exiba exclusivamente **Coleção**, **Estante 3D** e **Configurações**.
- **Alternatives considered**:
  - *Apenas ocultar a aba com `href: null`*: Deixaria código morto e componentes de estoque não utilizados no projeto.

---

## 2. Exibição Direta (Inline) na Ficha do Jogo (`GameDetailSheet`)

- **Decision**: Substituir o antigo botão + modal secundário (`GameSleeveManagerModal`) por uma seção inline `GameSleeveInfoSection` (`src/components/sleeves/game-sleeve-info.tsx`) renderizada diretamente dentro de `GameDetailSheet`.
- **Rationale**:
  - O usuário vê imediatamente, ao abrir qualquer jogo na **Coleção** ou na **Estante 3D**, quais formatos de sleeves (`formatName`), medidas em milímetros (`widthMm x heightMm mm`) e quantidade de cartas (`cardCount`) cada baralho do jogo exige, além do total de sleeves do jogo.
  - Elimina checkboxes de controle de estoque ("Envelopado / Pendente") que o usuário informou não precisar, mantendo apenas um botão discreto `+ Adicionar formato` caso deseje registrar medidas de um jogo que não esteja no catálogo automático.
- **Alternatives considered**:
  - *Manter um modal separado apenas para leitura*: Exigiria um clique extra desnecessário para consultar uma informação concisa que cabe perfeitamente na própria ficha do jogo.
