# Feature Specification: Corredor 3D de Estantes Paralelas e Navegação em Primeira Pessoa

**Feature Branch**: `[006-3d-aisle-shelf-navigation]`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "na secao de estante 3d, eu quero que seja algo mais parecido com a imagem de referencia. e quando deslizar o dedo para cima ou para baixo, move a camera para tras ou para frente, como se estivesse andando pelo corredor. Ao clicar em algum lado da estante, a camera pode virar para o lado selcionado tambem, com a opcao de voltar para a visualizacao default central."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corredor 3D de Estantes Paralelas e Caminhada pelo Corredor (Priority: P1)

Como colecionador de jogos de tabuleiro, quero visualizar minha coleção disposta em um corredor 3D com estantes paralelas dos dois lados (esquerda e direita) — semelhante a um corredor de biblioteca ou ludoteca — e poder deslizar o dedo para cima ou para baixo para caminhar para frente ou para trás ao longo do corredor, explorando minhas prateleiras em profundidade.

**Why this priority**: Substitui a visualização estática frontal única pela experiência espacial central solicitada pelo usuário (perspectiva de corredor em profundidade com locomoção contínua para frente e para trás), constituindo o MVP indispensável da nova Estante 3D.

**Independent Test**: Abrir a aba "Estante 3D" com uma coleção sincronizada, verificar que os jogos estão organizados em estantes paralelas à esquerda e à direita de um corredor central iluminado, e deslizar verticalmente na tela (ou usar o scroll no Web) constatando que a câmera avança e recua suavemente pelo corredor respeitando os limites de início e fim.

**Acceptance Scenarios**:

1. **Given** que o usuário possui jogos sincronizados na coleção e acessa a aba "Estante 3D", **When** a cena 3D é carregada, **Then** o sistema exibe a perspectiva central padrão olhando ao longo do corredor com prateleiras à esquerda e à direita, piso central e iluminação superior em profundidade.
2. **Given** que o usuário está na visualização da Estante 3D, **When** ele desliza o dedo verticalmente (para cima ou para baixo na tela, ou utiliza a rolagem vertical no navegador Web), **Then** a câmera se move suavemente para frente ou para trás ao longo do eixo longitudinal do corredor, simulando o caminhar entre as estantes.
3. **Given** que o usuário caminha até o início ou até o final do corredor, **When** ele continua deslizando além da extensão das estantes, **Then** a posição da câmera é limitada suavemente às extremidades válidas do corredor sem atravessar paredes ou perder as estantes de vista.

---

### User Story 2 - Giro Lateral da Câmera para Focar um Lado da Estante e Retorno à Visão Central (Priority: P2)

Como usuário explorando o corredor 3D, quero poder clicar/tocar em um dos lados da estante (esquerdo ou direito) para que a câmera vire suavemente em direção ao lado selecionado facilitando a visualização das caixas daquela parede, contando sempre com uma opção visível para retornar à visualização central padrão do corredor.

**Why this priority**: Na perspectiva em profundidade de um corredor, as lombadas das estantes laterais ficam em ângulo oblíquo; permitir virar a câmera para o lado esquerdo ou direito (e voltar ao centro com um toque) torna a leitura e seleção das caixas ergonômica e intuitiva.

**Independent Test**: Clicar/tocar na estante da esquerda (ou da direita) e verificar que a câmera gira suavemente para encarar aquele lado e exibe o botão de retorno; em seguida, acionar "Voltar à Visão Central" e verificar que a câmera retorna suavemente ao alinhamento padrão do corredor.

**Acceptance Scenarios**:

1. **Given** que a câmera está na visualização central padrão do corredor, **When** o usuário clica/toca na estante do lado esquerdo (ou do lado direito), **Then** a câmera gira suavemente o seu ângulo de visão em direção ao lado selecionado (`Esquerda` ou `Direita`) mantendo a posição longitudinal atual no corredor.
2. **Given** que a câmera está virada para um dos lados (`Esquerda` ou `Direita`) ou deslocada da posição inicial, **When** a interface exibe o controle de retorno e o usuário aciona a opção de voltar para a visualização padrão central, **Then** a câmera gira de volta para o centro do corredor (`Centro`).
3. **Given** que a câmera está virada para o lado esquerdo ou direito da estante, **When** o usuário desliza verticalmente para cima ou para baixo, **Then** a câmera continua permitindo o deslocamento longitudinal ao longo do corredor (caminhar lateralmente acompanhando a prateleira) sem perder o foco no lado selecionado.

---

### User Story 3 - Extração e Inspeção de Caixas nas Estantes Esquerda e Direita (Priority: P3)

Como usuário diante de uma das estantes do corredor, quero clicar em uma caixa de jogo (tanto na parede esquerda quanto na parede direita) para puxá-la em direção ao centro do corredor, inspecioná-la em 3D e abrir sua ficha completa de detalhes.

**Why this priority**: Preserva e adapta a funcionalidade de inspeção tátil de caixas e abertura da ficha de detalhes (`GameDetailSheet`) para a nova geometria bilateral do corredor, garantindo que as caixas de ambos os lados saiam na direção correta (para dentro do corredor, e não para dentro da parede).

**Independent Test**: Selecionar um jogo na estante esquerda e verificar que ele desliza para fora em direção ao centro do corredor; selecionar um jogo na estante direita e verificar que ele também desliza na direção oposta rumo ao centro do corredor; clicar novamente na caixa extraída e confirmar a abertura da ficha de detalhes do jogo.

**Acceptance Scenarios**:

1. **Given** que o usuário visualiza uma caixa na estante da esquerda ou da direita, **When** ele toca/clica sobre a caixa pela primeira vez, **Then** a caixa desliza suavemente para fora do nicho em direção ao centro do corredor e a câmera orienta o foco para o lado correspondente caso ainda esteja na visão central.
2. **Given** que uma caixa está extraída para fora da prateleira no corredor, **When** o usuário toca/clica novamente sobre a caixa selecionada, **Then** a ficha de detalhes do jogo (`GameDetailSheet`) é aberta com todas as informações, manuais, sleeves e partidas daquele título.
3. **Given** que uma caixa está extraída, **When** o usuário toca em uma área vazia do corredor ou seleciona outra caixa, **Then** a caixa anterior retorna suavemente à sua posição original na prateleira.

---

### Edge Cases

- **Coleções pequenas (ex.: 1 a 4 jogos)**: O corredor deve manter uma extensão mínima elegante (pelo menos um módulo de estante de cada lado do corredor) para preservar a sensação arquitetônica de corredor mesmo quando poucos jogos estão cadastrados.
- **Coleções grandes (ex.: 50 a 500+ jogos)**: O comprimento do corredor (quantidade de módulos/colunas ao longo da profundidade) deve crescer dinamicamente conforme o número de jogos, ajustando automaticamente o limite máximo de caminhada da câmera até o último módulo.
- **Distinção entre gesto de deslizar (caminhar) e toque simples (virar câmera / selecionar caixa)**: Um movimento de arraste vertical (deslocamento acima do limiar de arraste) deve apenas mover a câmera pelo corredor, sem disparar acidentalmente a seleção de uma caixa ou a troca de lado ao soltar o dedo.
- **Interação simultânea entre rotação de caixa extraída e caminhada pelo corredor**: Quando uma caixa está selecionada e o usuário arrasta diretamente sobre ela para girá-la, o gesto gira a caixa; quando o usuário desliza fora da caixa (no corredor/estantes), o gesto move a câmera pelo corredor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE renderizar a Estante 3D como um corredor tridimensional composto por duas estantes paralelas frente a frente (Estante Esquerda e Estante Direita), separadas por um piso central de circulação e iluminação superior em série ao longo da profundidade, inspirado na composição espacial da imagem de referência.
- **FR-002**: O sistema DEVE distribuir os jogos da coleção do usuário em escala física real entre as prateleiras das estantes esquerda e direita, posicionando as lombadas voltadas para o interior do corredor central.
- **FR-003**: O sistema DEVE calcular automaticamente a extensão longitudinal do corredor (quantidade de seções em profundidade) de acordo com o volume de jogos da coleção, garantindo um comprimento mínimo de corredor mesmo para coleções pequenas.
- **FR-004**: O sistema DEVE permitir que o usuário mova a câmera para frente e para trás ao longo do corredor ao deslizar o dedo verticalmente (para cima ou para baixo) em telas sensíveis ao toque, bem como via arraste vertical do ponteiro ou rolagem (scroll wheel) no modo Web.
- **FR-005**: O movimento de caminhada da câmera ao longo do corredor DEVE utilizar interpolação suave e respeitar limites mínimo (entrada do corredor) e máximo (fundo do corredor), impedindo que a câmera ultrapasse a geometria da cena.
- **FR-006**: O sistema DEVE permitir que o usuário clique ou toque no lado esquerdo ou no lado direito da estante (ou em controles rápidos de direção) para girar suavemente o ângulo horizontal da câmera em direção ao lado selecionado (`LEFT` ou `RIGHT`).
- **FR-007**: O sistema DEVE exibir um botão claro e acessível na interface (seguindo o sistema de design Impeccable) para retornar à visualização central padrão do corredor (`CENTER`) sempre que a câmera estiver virada para um dos lados ou deslocada da posição inicial.
- **FR-008**: Quando o usuário selecionar uma caixa na estante esquerda ou na estante direita, a caixa DEVE ser extraída perpendicularmente em direção ao centro do corredor (sentido interno do corredor) para permitir inspeção visual sem colidir com a estrutura da estante.
- **FR-009**: O sistema DEVE diferenciar gestos de arraste vertical (caminhada pelo corredor) de toques curtos (virar para um lado da estante ou selecionar uma caixa), evitando ativações acidentais durante a navegação pelo corredor.
- **FR-010**: Todos os controles flutuantes de navegação da Estante 3D (indicador de quantidade de jogos, estado do foco lateral e botão de retorno à visão central) DEVEM utilizar exclusivamente os tokens semânticos e primitivas do sistema de design Impeccable (`@/ui`), respeitando alvos de toque mínimos de 44x44pt e contraste WCAG 2.1 AA.

### Key Entities

- **AisleShelfLayout (Layout do Corredor de Estantes)**: Representa a geometria completa do corredor 3D, incluindo largura do corredor, número de prateleiras verticais (andares), número de seções em profundidade, dimensões das estantes esquerda e direita (`leftWall`, `rightWall`) e limites de deslocamento da câmera (`minZ`, `maxZ`).
- **AisleCameraState (Estado da Câmera no Corredor)**: Representa a posição longitudinal atual do usuário ao longo do corredor (`currentZ`, `targetZ`), a direção de olhar selecionada (`focusSide`: `'CENTER' | 'LEFT' | 'RIGHT'`) e o ângulo de rotação horizontal correspondente (`currentYaw`, `targetYaw`).
- **PlacedAisleBox (Caixa Posicionada no Corredor)**: Representa uma caixa de jogo posicionada em uma das paredes do corredor (`side`: `'LEFT' | 'RIGHT'`), contendo coordenadas de repouso, coordenadas de extração voltadas para o centro do corredor, orientação da lombada e dimensões em escala real.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos jogos com posse ativa na coleção são dispostos sem sobreposição entre as estantes esquerda e direita do corredor, com lombadas voltadas para o corredor central e extração direcionada para o interior do corredor.
- **SC-002**: O usuário consegue percorrer toda a extensão do corredor do início ao fim utilizando gestos verticais (deslizar para cima/baixo ou scroll) mantendo taxa de quadros fluida (60 FPS em dispositivos móveis e Web modernos) e parada suave nos limites do corredor.
- **SC-003**: Ao tocar em qualquer lado da estante (esquerdo ou direito), a câmera completa a transição angular para o lado selecionado em até 0,6 segundo, e o acionamento do botão de retorno restaura a visão central padrão em 100% das tentativas.
- **SC-004**: 100% das funções matemáticas de layout bilateral do corredor, cálculo de limites de caminhada da câmera e estados de rotação lateral possuem cobertura de testes unitários automatizados e passam sem erros na auditoria visual Impeccable (`npm run ui:audit`).

## Assumptions

- **Mapeamento natural do gesto de caminhada**: Deslizar o dedo verticalmente na tela move o observador para frente e para trás ao longo do corredor com sensibilidade calibrada e amortecimento suave (lerp), funcionando tanto em dispositivos móveis (iOS/Android) quanto no navegador Web (arraste do mouse ou roda de rolagem).
- **Ângulo de visão lateral**: Quando o usuário clica em um lado da estante (`Esquerda` ou `Direita`), a câmera gira em ângulo confortável (aproximadamente 55° a 75° em direção à respectiva estante e recua levemente para o lado oposto do corredor) para enquadrar uma seção ampla de prateleiras sem perder a noção espacial do corredor.
- **Preservação dos dados locais**: A mudança de layout para corredor 3D é puramente espacial e visual, preservando intactos todos os dados sincronizados do BGG, dimensões físicas customizadas, manuais PDF, sleeves e registros de partidas.
