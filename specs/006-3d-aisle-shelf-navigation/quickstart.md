# Quickstart & Validation Guide: Corredor 3D de Estantes Paralelas e Navegação em Primeira Pessoa

**Feature**: `006-3d-aisle-shelf-navigation`  
**Date**: 2026-11-16

---

## Pré-requisitos

- Dependências instaladas (`npm install`)
- Coleção sincronizada do BGG na aba **Configurações**

---

## 1. Validação Automatizada (Testes Unitários, Tipagem e Auditoria UI)

Execute a suíte de validação completa:

```bash
npm run typecheck
npm test
npm run ui:audit
```

### Resultados Esperados
- `tsc --noEmit` finaliza com **0 erros**.
- `tests/unit/aisle-shelf-navigation.test.ts` valida:
  - Distribuição bilateral equilibrada de jogos entre `LEFT` e `RIGHT` com lombadas voltadas para o centro do corredor (`+Math.PI / 2` e `-Math.PI / 2`).
  - Extração de caixas da parede esquerda (`+X`) e da parede direita (`-X`) apontando para o interior do corredor.
  - Caminhada ao longo do eixo `Z` via `applyWalkDelta` respeitando `minZ` e `maxZ`.
  - Giro angular (`computeCameraPose`) para `LEFT`, `RIGHT` e restauração exata para `CENTER`.
  - Diferenciação determinística entre gesto de arraste (`isDragGesture`) e clique simples.
- `npm run ui:audit` aprova 100% dos arquivos em `app/` e `src/components/` nas regras do sistema de design Impeccable.

---

## 2. Validação Interativa (Web Localhost / Expo Mobile)

1. Inicie o servidor Web:
   ```bash
   npm run web
   ```
2. Abra a aba **Estante 3D** (`/shelf`):
   - **Cenário 1 (Perspectiva de Corredor e Caminhada)**: Verifique as duas estantes paralelas frente a frente com iluminação no teto e tapete central. Arraste verticalmente para cima/baixo (ou use o scroll do mouse) para caminhar para frente e para trás pelo corredor.
   - **Cenário 2 (Virar para um Lado e Voltar ao Centro)**: Clique em qualquer prateleira da esquerda ou da direita (ou nos botões `◀ Esq.` / `Dir. ▶` na barra inferior) para virar a câmera para aquele lado. Em seguida, clique em **`Visão Central`** para alinhar novamente a câmera ao centro do corredor.
   - **Cenário 3 (Inspeção de Caixas)**: Clique em um jogo para puxá-lo para fora da prateleira em direção ao corredor; clique novamente sobre a caixa destacada para abrir a ficha completa do jogo (`GameDetailSheet`).
