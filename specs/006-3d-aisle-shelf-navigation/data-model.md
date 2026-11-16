# Phase 1 Data Model: Corredor 3D de Estantes Paralelas e Navegação em Primeira Pessoa

**Feature**: `006-3d-aisle-shelf-navigation`  
**Date**: 2026-11-16

---

## 1. Visão Geral

Esta feature opera sobre os dados locais já persistidos em SQLite (`games`, `collection_items`, `box_dimensions`) e introduz entidades espaciais e de estado de câmera em memória para renderizar o corredor 3D bilateral e controlar a navegação em primeira pessoa. Nenhuma migração de banco de dados SQLite é necessária.

---

## 2. Entidades Espaciais e de Estado

### 2.1 `AisleSide` e `CameraFocusSide`

- **`AisleSide`**: `'LEFT' | 'RIGHT'` — Identifica a qual das duas estantes paralelas do corredor um módulo ou caixa de jogo pertence.
- **`CameraFocusSide`**: `'CENTER' | 'LEFT' | 'RIGHT'` — Identifica para qual direção do corredor a câmera está orientada no momento.

### 2.2 `AisleShelfConfig`

Representa as dimensões físicas e geométricas do corredor 3D em unidades de cena Three.js (`1 unidade = 10 cm`):

| Campo | Tipo | Descrição | Invariantes |
|---|---|---|---|
| `rows` | `number` | Quantidade de andares (prateleiras verticais) em cada parede | `rows >= 4` |
| `cols` | `number` | Quantidade de módulos/seções ao longo da profundidade do corredor (`Z`) | `cols >= 3` |
| `cubbyWidth` | `number` | Largura de cada seção ao longo do corredor (eixo `Z`) | `3.35` (33,5 cm) |
| `cubbyHeight` | `number` | Altura livre de cada andar (eixo `Y`) | `2.45` (24,5 cm a 33,5 cm) |
| `cubbyDepth` | `number` | Profundidade da prateleira entrando na parede (eixo `X`) | `3.20` (32 cm) |
| `thickness` | `number` | Espessura das pranchas e divisórias | `0.18` (1,8 cm) |
| `aisleWidth` | `number` | Largura livre do corredor central entre as frentes das duas estantes | `3.80` (`X` de `-1.90` a `+1.90`) |
| `totalLength` | `number` | Comprimento total do corredor ao longo do eixo `Z` | `cols * cubbyWidth + (cols + 1) * thickness` |
| `totalHeight` | `number` | Altura total das estantes do piso ao teto | `rows * cubbyHeight + (rows + 1) * thickness` |

### 2.3 `PlacedAisleBox`

Estende `PlacedBoxCoords` com metadados bilaterais do corredor:

| Campo | Tipo | Descrição |
|---|---|---|
| `bggId` | `number` | Identificador único do jogo no BGG |
| `title` | `string` | Título do jogo exibido na lombada |
| `side` | `'LEFT' \| 'RIGHT'` | Parede do corredor onde a caixa está alocada |
| `size` | `[number, number, number]` | `[spineWidth, height, depth]` em unidades de cena |
| `position` | `[number, number, number]` | Posição `[x, y, z]` de repouso na prateleira |
| `extractedPosition` | `[number, number, number]` | Posição `[x, y, z]` extraída em direção ao centro do corredor |
| `baseRotationY` | `number` | Rotação base em radianos (`+Math.PI / 2` na esquerda, `-Math.PI / 2` na direita) |
| `cubbyIndex` | `number` | Índice do nicho no corredor |

### 2.4 `AisleCameraBounds` e `AisleCameraPose`

| Campo | Tipo | Descrição |
|---|---|---|
| `minZ` | `number` | Limite mais profundo do corredor até onde a câmera pode avançar |
| `maxZ` | `number` | Limite inicial (entrada do corredor) |
| `defaultZ` | `number` | Posição inicial padrão na entrada do corredor |
| `focusSide` | `CameraFocusSide` | Direção ativa da câmera (`'CENTER'`, `'LEFT'`, `'RIGHT'`) |
| `targetPosition` | `[number, number, number]` | Posição alvo `[x, y, z]` da câmera com recuo lateral automático quando virada para um lado |
| `targetYaw` | `number` | Ângulo horizontal alvo (em radianos) da câmera |

---

## 3. Transições de Estado da Câmera

```text
[Visão Central (CENTER, yaw = 0, x = 0)]
   ├── Deslizar p/ cima ou p/ baixo ──> Avança / recua ao longo de Z dentro de [minZ, maxZ]
   ├── Clicar na Estante Esquerda ────> [Foco Esquerdo (LEFT, yaw = +65°, x = +0.65)]
   └── Clicar na Estante Direita ─────> [Foco Direito (RIGHT, yaw = -65°, x = -0.65)]

[Foco Esquerdo (LEFT) ou Direito (RIGHT)]
   ├── Deslizar p/ cima ou p/ baixo ──> Continua caminhando ao longo de Z mantendo o olhar lateral
   ├── Clicar no lado oposto ─────────> Vira suavemente para o outro lado
   └── Clicar em "Visão Central" ─────> Retorna para [Visão Central (CENTER, yaw = 0, x = 0)]
```
