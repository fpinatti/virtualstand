# Phase 0 Research: Corredor 3D de Estantes Paralelas e Navegação em Primeira Pessoa

**Feature**: `006-3d-aisle-shelf-navigation`  
**Date**: 2026-11-16

---

## 1. Geometria Espacial do Corredor de Estantes (Perspectiva de Biblioteca)

- **Decision**: Construir um corredor longitudinal ao longo do eixo `-Z` com duas estantes paralelas frente a frente (`LEFT` em `X = -2.35` e `RIGHT` em `X = +2.35`), piso acarpetado central, teto arquitetônico com luminárias lineares embutidas em série e painel de iluminação difusa ao fundo do corredor.
- **Rationale**: Reproduz fielmente a composição de perspectiva em ponto de fuga central da imagem de referência enviada pelo usuário (prateleiras contínuas dos dois lados, passarela central e fileira dupla de luminárias no teto conduzindo o olhar em profundidade), harmonizada com a paleta *Tactile Tabletop Lounge* do sistema Impeccable.
- **Alternatives considered**:
  - *Manter estante frontal única e apenas aproximar câmera*: Rejeitado porque não cria o corredor bilateral nem permite caminhar entre estantes paralelas.
  - *Carregar modelo `.glb` externo de biblioteca*: Proibido pelo Princípio II da Constituição (`Pre-modeled static 3D meshes (.glb/.gltf) are forbidden`); toda a geometria deve ser procedural em Three.js.

---

## 2. Distribuição Bilateral e Orientação de Caixas (`LEFT` vs `RIGHT`)

- **Decision**: Empacotar os jogos da coleção em nichos longitudinais (onde a largura do nicho corre ao longo do eixo `Z` do corredor e a profundidade entra na parede ao longo do eixo `X`), alternando o preenchimento entre a Estante Esquerda (`side: 'LEFT'`) e a Estante Direita (`side: 'RIGHT'`) da entrada para o fundo, com no mínimo 3 colunas de profundidade por lado (`rows = 4`, `cols >= 3`).
- **Rationale**:
  - Garante equilíbrio visual imediato nos dois lados do corredor mesmo em coleções pequenas.
  - Posiciona cada caixa com `baseRotationY = +Math.PI / 2` na parede esquerda e `baseRotationY = -Math.PI / 2` na parede direita, fazendo com que todas as lombadas fiquem voltadas para o centro do corredor (`X = 0`).
  - Ao extrair uma caixa selecionada, o deslocamento ocorre sempre em direção ao centro do corredor (`+X` para caixas da esquerda e `-X` para caixas da direita).
- **Alternatives considered**:
  - *Preencher toda a parede esquerda antes de iniciar a parede direita*: Deixaria um lado inteiro vazio em coleções pequenas ou médias, quebrando a simetria visual do corredor.

---

## 3. Locomoção Longitudinal por Gesto Vertical (Deslizar para Cima/Baixo)

- **Decision**: Implementar um controlador puro de câmera (`AisleCameraController`) que converte o delta vertical de toque/arraste (`PanResponder` / eventos de ponteiro no container e `onWheel` no Web) em deslocamento ao longo do eixo `Z` (`targetZ = clampCameraZ(targetZ + deltaZ, minZ, maxZ)`), interpolado a 60 FPS via `useFrame` (`THREE.MathUtils.lerp`).
- **Rationale**:
  - Atende exatamente ao pedido do usuário (*"quando deslizar o dedo para cima ou para baixo, move a camera para tras ou para frente, como se estivesse andando pelo corredor"*).
  - Funciona de forma idêntica em iOS, Android e Web Localhost sem depender de controles complexos de joystick.
  - Um limiar de deslocamento (`DRAG_THRESHOLD_PX = 8`) distingue um arraste vertical (caminhada) de um toque simples (selecionar caixa ou virar para um lado da estante).
- **Alternatives considered**:
  - *OrbitControls padrão do Three.js*: Gira a cena inteira ao redor de um pivô em vez de caminhar em primeira pessoa por dentro do corredor.

---

## 4. Rotação Lateral da Câmera (`LEFT` / `RIGHT`) e Retorno à Visão Central (`CENTER`)

- **Decision**: Modelar três estados direcionais de foco da câmera (`focusSide: 'CENTER' | 'LEFT' | 'RIGHT'`):
  - `'CENTER'`: `targetYaw = 0`, `targetX = 0` (olhando para o fundo do corredor).
  - `'LEFT'`: `targetYaw = +1.15 rad (~66°)`, `targetX = +0.65` (recua levemente para a direita do corredor e vira para contemplar a Estante Esquerda).
  - `'RIGHT'`: `targetYaw = -1.15 rad (~66°)`, `targetX = -0.65` (recua levemente para a esquerda do corredor e vira para contemplar a Estante Direita).
- **Rationale**:
  - Em um corredor estreito, girar apenas no próprio eixo (`X = 0`) deixa a estante muito próxima da lente; recuar `0.65` unidades em direção ao lado oposto amplia o campo de visão da estante selecionada sem colidir com a estante de trás.
  - O usuário pode acionar a virada clicando diretamente na estrutura da estante esquerda/direita, clicando em um jogo daquele lado, ou usando os botões rápidos da barra de navegação inferior (`◀ Lado Esquerdo`, `Visão Central`, `Lado Direito ▶`).
- **Alternatives considered**:
  - *Rotação de 90° sem recuo lateral*: Deixa a prateleira muito colada à câmera, exibindo poucos jogos por vez.
