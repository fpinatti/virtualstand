# Quickstart & Validation Guide: Simplificação de Sleeves para Consulta Direta por Jogo

**Feature**: `007-per-game-sleeve-info`  
**Date**: 2026-11-16

---

## 1. Validação Automatizada

Execute:

```bash
npm run typecheck
npm test
npm run ui:audit
```

### Resultados Esperados
- `tsc --noEmit` conclui com **0 erros**.
- Todas as suítes de testes passam, validando o pré-preenchimento automático de sleeves por jogo (`tests/unit/sleeve-auto-matching.test.ts` e `tests/unit/game-sleeves.test.ts`) e a conformidade visual Impeccable (`tests/unit/impeccable-ui-system.test.ts`).

---

## 2. Validação Interativa

1. Abra o app (`npm run web`):
   - Verifique que a barra de navegação inferior possui apenas **3 abas**: **Coleção**, **Estante 3D** e **Configurações** (a aba "Sleeves" foi removida).
2. Clique em qualquer jogo na **Coleção** ou na **Estante 3D**:
   - Na ficha de detalhes do jogo (`GameDetailSheet`), role até a seção **Sleeves do Jogo**:
   - Verifique que os formatos necessários, medidas em milímetros (`largura x altura mm`) e a quantidade de cartas aparecem listados diretamente na ficha, sem checkboxes de "envelopado/pendente" nem listas de estoque.
