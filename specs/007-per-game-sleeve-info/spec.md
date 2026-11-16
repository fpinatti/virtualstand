# Feature Specification: Simplificação de Sleeves para Consulta Direta por Jogo

**Feature Branch**: `[007-per-game-sleeve-navigation]`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "remova a secao sleeves, nao é necessario eu poder gerenciar meus sleeves. as informacoes de sleeves que preciso sao as que cada jogo precisa"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remoção da Aba Global de Estoque/Compras de Sleeves (Priority: P1)

Como usuário do VirtualStand, quero que a aba dedicada "Sleeves" (Central de Sleeves com controle de estoque pessoal e lista de compras global) seja removida da navegação principal do aplicativo, mantendo a barra de navegação focada apenas em **Coleção**, **Estante 3D** e **Configurações**.

**Why this priority**: Elimina complexidade desnecessária da navegação principal (gerenciamento de estoque de pacotes sobressalentes e cálculo de déficit de compras) conforme solicitado diretamente pelo usuário.

**Independent Test**: Abrir o aplicativo e verificar que a barra de abas inferior exibe exclusivamente as abas **Coleção**, **Estante 3D** e **Configurações**, sem exibir ou rotear para a antiga aba "Sleeves".

**Acceptance Scenarios**:

1. **Given** que o usuário abre o aplicativo em qualquer plataforma (iOS, Android ou Web Localhost), **When** a barra de navegação principal é renderizada, **Then** apenas as três abas essenciais (**Coleção**, **Estante 3D** e **Configurações**) são apresentadas.
2. **Given** que o usuário navega entre todas as abas do aplicativo, **When** ele inspeciona as telas disponíveis, **Then** nenhuma interface de gerenciamento de estoque de pacotes sobressalentes ("Meu Estoque") ou "Lista de Compras de Sleeves" é exibida.

---

### User Story 2 - Exibição Direta dos Sleeves Necessários na Ficha de Cada Jogo (Priority: P1)

Como colecionador consultando um jogo específico na minha coleção ou na Estante 3D, quero visualizar diretamente dentro da ficha de detalhes do jogo (`GameDetailSheet`) quais formatos de sleeves e quantas cartas aquele jogo precisa (por exemplo: nome do baralho, formato do sleeve, dimensões em milímetros `largura x altura mm` e quantidade de cartas), sem precisar abrir modais de controle de estoque.

**Why this priority**: Entrega exatamente a informação que o usuário precisa no contexto certo: saber imediatamente quais tamanhos e quantidades de sleeves comprar ou separar para proteger um jogo específico da sua coleção.

**Independent Test**: Tocar em um jogo na aba **Coleção** ou na **Estante 3D** para abrir sua ficha de detalhes e verificar que a seção "Sleeves Necessários" lista diretamente os formatos, medidas em milímetros e quantidades de cartas daquele jogo (incluindo o total de cartas/sleeves do jogo).

**Acceptance Scenarios**:

1. **Given** que o usuário abre a ficha de detalhes (`GameDetailSheet`) de um jogo que possui especificações de sleeves cadastradas no catálogo da comunidade ou salvas localmente, **When** a ficha é exibida, **Then** a seção de sleeves mostra diretamente na própria ficha cada conjunto de cartas do jogo com o nome do formato, medidas em milímetros (`widthMm x heightMm mm`) e a quantidade de cartas necessárias.
2. **Given** que um jogo possui mais de um tamanho ou conjunto de cartas (ex.: baralho principal + cartas mini), **When** o usuário visualiza a seção de sleeves na ficha do jogo, **Then** todos os formatos exigidos pelo jogo são listados de forma clara com a quantidade de cartas de cada formato.
3. **Given** que um jogo não utiliza cartas ou ainda não possui especificações de sleeves associadas, **When** o usuário abre a ficha de detalhes do jogo, **Then** a seção informa de maneira discreta que não há sleeves cadastrados para aquele título, permitindo adicionar ou remover manualmente uma especificação de formato/quantidade para o jogo caso o usuário deseje complementar o catálogo.

---

### Edge Cases

- **Jogos sem cartas no catálogo (ex.: jogos puramente de peças/tiles como *Carcassonne* ou *Azul*)**: A ficha do jogo deve exibir uma mensagem limpa informando que nenhum sleeve está registrado para o jogo, sem ocupar espaço excessivo na tela.
- **Jogos que ainda não receberam o pré-preenchimento do catálogo local**: Ao abrir a ficha de detalhes de um jogo cujo `bggId` consta no catálogo comunitário de sleeves (`sleeve-catalog.json`) mas ainda não foi gravado na tabela local `game_sleeves`, o sistema deve consultar/popular automaticamente as informações daquele jogo para que apareçam imediatamente na ficha.
- **Adição/edição manual de requisito de sleeve de um jogo**: Caso um jogo específico da coleção do usuário não esteja no catálogo padrão (ou tenha uma expansão), o usuário ainda pode adicionar/remover o tamanho e quantidade de cartas que aquele jogo precisa diretamente na ficha do jogo, porém sem checkboxes de "envelopado/pendente" nem vínculo com estoque pessoal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE remover a aba "Sleeves" (`Central de Sleeves`) da barra de navegação principal (`app/(tabs)/_layout.tsx`), deixando apenas as abas **Coleção**, **Estante 3D** e **Configurações**.
- **FR-002**: O sistema DEVE remover as telas e componentes de gerenciamento de estoque pessoal de pacotes de sleeves ("Meu Estoque") e de cálculo de déficit ("Lista de Compras de Sleeves") do fluxo de navegação do usuário.
- **FR-003**: A ficha de detalhes do jogo (`GameDetailSheet`) DEVE exibir diretamente (inline) a lista de sleeves necessários para o jogo selecionado, apresentando para cada conjunto de cartas: nome do baralho/conjunto, nome do formato do sleeve, dimensões em milímetros (`largura x altura mm`) e quantidade de cartas.
- **FR-004**: Quando o usuário abrir a ficha de detalhes de um jogo cujo `bggId` exista no catálogo local de sleeves (`src/data/sleeve-catalog.json`) e ainda não possua registros locais em `game_sleeves`, o sistema DEVE popular/exibir automaticamente os requisitos de sleeves daquele jogo.
- **FR-005**: A seção de sleeves dentro da ficha do jogo NÃO DEVE exigir controle de status "Envelopado / Pendente" nem controle de pacotes comprados, focando exclusivamente na informação técnica do que o jogo precisa (formato, dimensões em `mm` e quantidade de cartas).
- **FR-006**: O usuário DEVE poder adicionar ou remover manualmente uma especificação de sleeve (nome do conjunto, formato, largura em `mm`, altura em `mm` e quantidade de cartas) diretamente na seção do jogo caso deseje registrar as medidas de um jogo ausente do catálogo automático.
- **FR-007**: Toda a apresentação visual da seção de sleeves na ficha do jogo DEVE seguir estritamente os tokens semânticos e primitivas do sistema de design Impeccable (`@/ui`).

### Key Entities

- **GameSleeveRequirement (Requisito de Sleeve do Jogo)**: Representa a necessidade física de proteção de cartas de um jogo específico (`bggId`), composta por nome do conjunto de cartas (`cardSetName`), nome do formato comercial (`formatName`), largura em milímetros (`widthMm`), altura em milímetros (`heightMm`) e quantidade de cartas (`cardCount`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A navegação principal do aplicativo apresenta exatamente 3 abas (**Coleção**, **Estante 3D** e **Configurações**), com 0 referências visuais a estoque pessoal de sleeves ou lista de compras.
- **SC-002**: Ao abrir a ficha de detalhes (`GameDetailSheet`) de qualquer jogo presente no catálogo de sleeves, o usuário visualiza em 0 cliques adicionais (diretamente na ficha) os tamanhos em milímetros e as quantidades exatas de sleeves que aquele jogo precisa.
- **SC-003**: 100% das verificações de tipagem (`npm run typecheck`), testes automatizados (`npm test`) e auditoria visual Impeccable (`npm run ui:audit`) passam sem erros após a remoção da seção global de sleeves.

## Assumptions

- **Catálogo automático preservado**: O catálogo comunitário embutido (`src/data/sleeve-catalog.json`) e o preenchimento automático durante a sincronização com o BGG (e ao abrir a ficha do jogo) permanecem ativos, pois são a fonte que informa quais sleeves cada jogo precisa.
- **Preservação segura do schema SQLite**: A tabela `sleeve_inventory` pode permanecer no schema SQLite apenas para compatibilidade de migrações locais existentes, sem ser exposta em nenhuma tela ou fluxo de UI.
