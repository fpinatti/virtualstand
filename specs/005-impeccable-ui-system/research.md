# Phase 0 Research: Sistema de Design e Governança Visual Impeccable (`005-impeccable-ui-system`)

**Date**: 2026-11-14
**Feature**: [spec.md](./spec.md)

## 1. Integração do Pacote e Habilidades `impeccable`

- **Decision**: Instalar o pacote oficial `impeccable` (`^4.9.1`) no projeto, disponibilizar suas diretrizes e habilidades de design em `.agents/skills/` e estruturar os documentos canônicos `PRODUCT.md` e `DESIGN.md` na raiz do repositório, acompanhados de um validador determinístico local (`src/ui/audit.ts` + suíte Jest).
- **Rationale**: O `impeccable` (criado por Paul Bakaus) atua em duas frentes complementares: (1) diretrizes estruturadas (`PRODUCT.md`, `DESIGN.md` e skills do agente) que impedem a geração de "AI slop" (gradientes roxo/azul clichês, falta de hierarquia, espaçamentos arbitrários) e (2) auditoria determinística de código e tokens. Como o VirtualStand é um app universal React Native + Expo Web (`StyleSheet.create`), combinar o `impeccable` com um motor de tokens tipado em `src/ui/` garante governança tanto para o agente quanto em tempo de compilação e testes automatizados.
- **Alternatives Considered**:
  - *Apenas instalar uma biblioteca de terceiros como Tamagui ou NativeWind*: Rejeitado porque adiciona sobrecarga pesada de compilação Babel/Metro sem resolver as diretrizes de design de produto (`PRODUCT.md` / `DESIGN.md`) nem a auditoria de anti-padrões do Impeccable.
  - *Manter `StyleSheet.create` isolado em cada tela sem tokens centrais*: Rejeitado pois já gerou dezenas de cores hexadecimais duplicadas (`#0f172a`, `#1e293b`, `#6366f1`) e espaçamentos inconsistentes entre as Features 001 a 004.

## 2. Direção Estética Anti-"AI Slop" (Paleta Tabletop Lounge)

- **Decision**: Adotar a direção estética **"Tactile Tabletop Lounge"** (Obsidiana Quente, Marfim Editorial e Latão Âmbar), substituindo a combinação clichê de `slate-900` (`#0f172a`) + `indigo-500` (`#6366f1`) — explicitamente apontada pelo Impeccable como padrão genérico de IA — por uma paleta autoral inspirada em componentes nobres de jogos de tabuleiro modernos (madeira escura, fichas de metal/latão, linho marfim e feltro de mesa):
  - **Superfícies (`surface`)**:
    - `canvas`: `#121316` (Obsidiana profunda para fundo de tela)
    - `card`: `#1B1D22` (Superfície elevada de cartões e listas)
    - `elevated`: `#24272E` (Modais, painéis flutuantes e campos de entrada)
    - `interactive`: `#2E323B` (Controles secundários e áreas de toque ativas)
    - `glassOverlay`: `rgba(18, 19, 22, 0.88)` (Badges flutuantes sobre o Canvas 3D)
  - **Textos (`text`)**:
    - `primary`: `#F5F2EB` (Marfim editorial quente — contraste 15.8:1 sobre `canvas` e 13.7:1 sobre `card`)
    - `secondary`: `#B5B0A4` (Pedra aquecida — contraste 7.9:1 sobre `canvas` e 6.8:1 sobre `card`)
    - `muted`: `#8A857A` (Cinza pergaminho — contraste 4.6:1 sobre `canvas`, cumprindo WCAG AA >= 4.5:1)
    - `inverse`: `#121316` (Texto escuro sobre botões primários em âmbar dourado — contraste 9.4:1)
  - **Acentos e Estados (`accent` & `status`)**:
    - `primary`: `#E5A93C` (Latão Âmbar / Ouro Tabletop — destaque principal com texto `inverse` `#121316`)
    - `primarySubtle`: `rgba(229, 169, 60, 0.16)` (Fundo sutil para abas e filtros selecionados)
    - `secondary`: `#4DB6AC` (Verde-azulado Meeple para indicadores informativos)
    - `success`: `#4ADE80` (Verde Esmeralda — vitórias, itens completos, sincronizado)
    - `warning`: `#FBBF24` (Âmbar alerta — dimensões estimadas, fila BGG 202)
    - `danger`: `#F87171` (Coral intenso — exclusão, déficit de sleeves, falha)
- **Rationale**: A estética de jogos de tabuleiro pede aconchego tátil e excelente legibilidade sob luz indireta. O contraste de texto marfim (`#F5F2EB`) sobre obsidiana (`#121316`) elimina o brilho azulado frio e destaca as cores reais das caixas 3D na estante.
- **Alternatives Considered**:
  - *Manter o tema Indigo/Slate padrão*: Rejeitado por violar diretamente a regra primordial do Impeccable contra paletas genéricas de IA.
  - *Tema claro puro*: Rejeitado como padrão porque causa ofuscamento em salas de jogo com iluminação aconchegante e reduz o destaque visual da estante 3D.

## 3. Arquitetura de Tokens e Escala Espacial/Tipográfica

- **Decision**: Centralizar todos os tokens em `src/ui/tokens.ts` com tipagem estrita (`as const` e contratos TypeScript):
  - **Ritmo Espacial (Base 4pt)**: `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `xxl: 24`, `section: 32`, `hero: 48`.
  - **Escala Tipográfica**:
    - `display`: `26pt` / `lineHeight: 32` / `weight: '700'`
    - `h1`: `22pt` / `lineHeight: 28` / `weight: '700'`
    - `h2`: `18pt` / `lineHeight: 24` / `weight: '700'`
    - `h3`: `16pt` / `lineHeight: 22` / `weight: '600'`
    - `body`: `15pt` / `lineHeight: 22` / `weight: '400'`
    - `bodyStrong`: `15pt` / `lineHeight: 22` / `weight: '600'`
    - `caption`: `13pt` / `lineHeight: 18` / `weight: '500'`
    - `micro`: `11pt` / `lineHeight: 15` / `weight: '600'`
  - **Metas de Toque e Layout Responsivo (Mobile + Web)**:
    - `minTouchTarget: 44` (todos os botões, abas e ações interativas possuem `minHeight: 44` e `minWidth: 44`).
    - `maxContentWidth: 920` (no modo Web desktop, listas e formulários ficam centralizados e contidos para evitar linhas ilegíveis de ponta a ponta).
- **Rationale**: Garante consistência matemática entre telas móveis e o modo Web Localhost recém-habilitado.
- **Alternatives Considered**:
  - *Unidades relativas em string (`rem`/`em`)*: Rejeitado porque `StyleSheet` do React Native opera com números em pontos independentes de densidade (`dp`/`pt`).

## 4. Primitivas de Interface (`src/ui/primitives/`)

- **Decision**: Construir um conjunto enxuto, sem dependências externas pesadas, de primitivas em `src/ui/primitives/`:
  1. `Button`: Variantes `primary`, `secondary`, `ghost`, `danger`; tamanhos `md` (altura mínima 44pt) e `sm` (com `hitSlop` garantindo 44pt de área de toque); suporte a `loading` e `disabled`.
  2. `Card`: Variantes `default`, `elevated`, `outlined`, `subtle` com preenchimento e borda semânticos.
  3. `Badge`: Tons `primary`, `neutral`, `success`, `warning`, `danger`, `info` para status de sleeves, tipos de manual e resultados de partida.
  4. `Input`: Rótulo tipográfico integrado, borda de foco/erro semântica, altura mínima de 44pt e suporte a multilinhas.
  5. `SectionHeader`: Título de seção com subtítulo/contador opcional e slot para ação secundária alinhada.
  6. `EmptyState`: Layout padronizado para listas vazias com ícone/símbolo, título, descrição curta e ação principal opcional.
  7. `ScreenContainer`: Contêiner de tela que aplica fundo `surface.canvas` e centralização responsiva (`maxContentWidth`) no modo Web.
- **Rationale**: Cobrir 100% dos padrões repetidos nas 4 abas, na `GameDetailSheet` e no `PdfReader` com código limpo, testável e compatível com iOS, Android e Web.
- **Alternatives Considered**:
  - *Criar wrappers para cada elemento nativo sem valor semântico*: Rejeitado; focamos apenas nas 7 primitivas que carregam regras reais do Impeccable (hierarquia de botões, área de toque, contraste e contenção espacial).
