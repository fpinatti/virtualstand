# Feature Specification: Mecanismo de Deploy e Execução para Expo Go (Padrão Piupiu U)

**Feature Branch**: `[008-expo-go-deploy]`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "quero configurar o mecanismo de deploy para o expo go conforme esse projeto funciona https://github.com/fpinatti/piapiupiu"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configuração Dinâmica de Deploy OTA (`EAS Update`) e Ambiente (Priority: P1)

Como desenvolvedor e proprietário do projeto VirtualStand, quero configurar o mecanismo de deploy para o **Expo Go** exatamente como no projeto de referência (`fpinatti/piapiupiu`), utilizando `app.config.js` com leitura automática de `.env` (`EAS_PROJECT_ID`, `EXPO_OWNER`, `EXPO_PUBLIC_BGG_API_TOKEN`), política de versão `runtimeVersion: { policy: "sdkVersion" }` e scripts de publicação `update:preview` e `update:prod`, para publicar atualizações remotas acessíveis via QR Code no aplicativo Expo Go sem expor IDs ou chaves sensíveis no código-fonte.

**Why this priority**: Permite publicar o aplicativo nos canais `preview` e `production` do Expo (`u.expo.dev`) com um único comando (`npm run update:preview` / `npm run update:prod`), viabilizando o acesso imediato pelo aplicativo Expo Go em smartphones Android e iOS.

**Independent Test**: Configurar um `.env` de teste com `EAS_PROJECT_ID` e `EXPO_OWNER`, avaliar a configuração gerada por `app.config.js` e verificar que `owner`, `extra.eas.projectId`, `updates.url` (`https://u.expo.dev/<projectId>`) e `runtimeVersion: { policy: "sdkVersion" }` são injetados corretamente.

**Acceptance Scenarios**:

1. **Given** que o arquivo `.env` contém `EAS_PROJECT_ID` e `EXPO_OWNER` (seguindo o modelo `.env.example`), **When** o Expo ou o EAS CLI carrega a configuração do projeto (`app.config.js` + `app.json`), **Then** o sistema injeta dinamicamente `owner`, `extra.eas.projectId` e `updates.url` (`https://u.expo.dev/${projectId}`) mantendo `runtimeVersion` com política `"sdkVersion"`.
2. **Given** que o arquivo `.env` não existe (por exemplo, em um clone limpo do repositório), **When** o projeto é inicializado localmente, **Then** `app.config.js` carrega a configuração base de `app.json` sem falhar e sem expor credenciais fixas no repositório.
3. **Given** que o desenvolvedor deseja publicar uma versão para teste no celular via Expo Go, **When** ele executa `npm run update:preview` ou `npm run update:prod`, **Then** o comando aciona a publicação automática no branch correspondente (`preview` ou `production`).

---

### User Story 2 - Inicialização via Túnel para Expo Go e Compatibilidade de Runtime (Priority: P1)

Como usuário testando o VirtualStand diretamente pelo aplicativo gratuito **Expo Go** no celular (Android ou iOS), quero iniciar o servidor de desenvolvimento com `npm run start:go` (`expo start --go --tunnel -c`) ou abrir o link publicado via EAS Update sem que o aplicativo sofra falhas por módulos nativos exclusivos de builds customizadas.

**Why this priority**: Garante que o aplicativo não apenas tenha os scripts de deploy do `piapiupiu`, mas também abra e funcione sem erros de inicialização dentro do cliente oficial **Expo Go** (isolando módulos nativos não presentes no binário padrão do Expo Go, como `react-native-pdf`).

**Independent Test**: Executar `npm run start:go` ou abrir o bundle no cliente Expo Go e verificar que todas as abas (**Coleção**, **Estante 3D** e **Configurações**) e o leitor de manuais funcionam sem erro de módulo nativo ausente (`TurboModuleRegistry` / `RNPDFPdfView`).

**Acceptance Scenarios**:

1. **Given** que o desenvolvedor executa `npm run start:go`, **When** o bundler é iniciado, **Then** o Expo inicia no modo `--go --tunnel -c` gerando o QR Code compatível com o aplicativo Expo Go em qualquer rede.
2. **Given** que o usuário abre o VirtualStand dentro do aplicativo **Expo Go** no Android ou iOS, **When** o bundle JavaScript é carregado, **Then** nenhum módulo nativo incompatível com o Expo Go é carregado de forma bloqueante na inicialização, garantindo que o app abra normalmente.

---

### Edge Cases

- **Ausência de arquivo `.env` no ambiente local ou CI**: A função `loadDotEnv()` em `app.config.js` deve ignorar silenciosamente a ausência do arquivo `.env` e respeitar variáveis já definidas em `process.env`.
- **Valores com aspas ou comentários no `.env`**: O parser de `.env` em `app.config.js` deve ignorar linhas em branco ou iniciadas por `#` e remover aspas simples ou duplas ao redor dos valores.
- **Execução no cliente Expo Go vs. Build Nativa (`expo-dev-client`)**: Quando executado dentro do Expo Go (onde o módulo nativo `react-native-pdf` não está compilado no binário), o leitor de manuais deve usar fallback seguro (permitindo gerenciar marcadores/notas por página como no modo Web) sem derrubar o app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE incluir o arquivo `app.config.js` na raiz do repositório implementando o carregamento automático de `.env` (`loadDotEnv`) e injetando dinamicamente `owner` (`EXPO_OWNER`), `extra.eas.projectId` (`EAS_PROJECT_ID` ou `EXPO_PUBLIC_EAS_PROJECT_ID`) e `updates.url` (`https://u.expo.dev/${projectId}`), idêntico ao mecanismo do projeto `fpinatti/piapiupiu`.
- **FR-002**: O arquivo `app.json` DEVE definir `"runtimeVersion": { "policy": "sdkVersion" }` e `"web": { "bundler": "metro" }` para compatibilidade com EAS Update no Expo Go.
- **FR-003**: O arquivo `package.json` DEVE disponibilizar os scripts padronizados do `piapiupiu`:
  - `"start:go": "expo start --go --tunnel -c"`
  - `"update:preview": "npx eas-cli update --branch preview --auto"`
  - `"update:prod": "npx eas-cli update --branch production --auto"`
- **FR-004**: O projeto DEVE incluir a dependência `expo-updates` compatível com a versão atual do Expo SDK em `package.json`.
- **FR-005**: O repositório DEVE conter o arquivo `.env.example` documentando as variáveis `EAS_PROJECT_ID`, `EXPO_OWNER` e `EXPO_PUBLIC_BGG_API_TOKEN`, mantendo `.env` ignorado no `.gitignore`.
- **FR-006**: O componente de leitura de PDF (`src/components/rulebooks/pdf-reader.tsx`) DEVE carregar o módulo nativo `react-native-pdf` de forma condicional/segura para que a execução dentro do cliente padrão **Expo Go** não falhe com erro de módulo nativo ausente.

### Key Entities

- **ExpoGoDeployConfig (Configuração Dinâmica de Deploy Expo Go)**: Estrutura resolvida por `app.config.js` combinando `app.json` e variáveis de ambiente (`EAS_PROJECT_ID`, `EXPO_OWNER`) para configurar `extra.eas.projectId`, `updates.url` e `runtimeVersion`.

## Success Criteria *(mandatory)*

- **SC-001**: `app.config.js` resolve corretamente `owner`, `extra.eas.projectId` e `updates.url` a partir de variáveis de ambiente ou `.env`, e preserva a configuração base quando nenhuma variável está definida (100% validado por testes unitários).
- **SC-002**: Os scripts `start:go`, `update:preview` e `update:prod` estão configurados em `package.json` exatamente no padrão do repositório `fpinatti/piapiupiu`.
- **SC-003**: O bundle do aplicativo carrega sem erros no cliente **Expo Go** (0 crashes de `TurboModuleRegistry` / módulos nativos ausentes) e passa em 100% dos testes (`npm run typecheck`, `npm test` e `npm run ui:audit`).

## Assumptions

- O usuário utilizará sua conta Expo (`EXPO_OWNER`) e o `EAS_PROJECT_ID` do projeto registrado no painel do Expo (`expo.dev`) definidos localmente no arquivo `.env` (não versionado no Git).
