# Phase 0 Research: Mecanismo de Deploy e Execução para Expo Go (Padrão Piupiu U)

**Feature**: `008-expo-go-deploy`  
**Date**: 2026-11-16

---

## 1. Resolução Dinâmica de Configuração (`app.config.js` + `.env`)

- **Decision**: Adotar exatamente o mesmo padrão de `app.config.js` do projeto `fpinatti/piapiupiu`:
  - Implementar `loadDotEnv()` usando `node:fs` e `node:path` (zero dependências externas como `dotenv`) que lê o arquivo `.env` na raiz do projeto e popula `process.env[key]` quando a chave ainda não está definida.
  - Exportar `({ config }) => { ... }` que lê `EAS_PROJECT_ID` (ou `EXPO_PUBLIC_EAS_PROJECT_ID`) e `EXPO_OWNER` e injeta dinamicamente:
    - `owner`: `process.env.EXPO_OWNER`
    - `extra.eas.projectId`: `projectId`
    - `updates.url`: `https://u.expo.dev/${projectId}`
- **Rationale**:
  - Tanto o `expo start` quanto o `npx eas-cli update` executam `app.config.js` em Node.js antes de empacotar ou publicar o projeto.
  - Carregar o `.env` diretamente dentro de `app.config.js` garante que `npx eas-cli update --branch preview --auto` sempre encontre `extra.eas.projectId` e `updates.url`, sem precisar commitar IDs de conta do Expo no repositório público.
- **Alternatives considered**:
  - *Hardcode de `projectId` em `app.json`*: Rejeitado porque expõe o UUID da conta EAS diretamente no versionamento e dificulta forks/ambientes.

---

## 2. Política de Versão de Runtime para Expo Go (`runtimeVersion: { policy: "sdkVersion" }`)

- **Decision**: Definir `"runtimeVersion": { "policy": "sdkVersion" }` e `"web": { "bundler": "metro" }` em `app.json`, além de adicionar `expo-updates` (`~0.26.9` compatível com Expo SDK 52) em `package.json`.
- **Rationale**: O aplicativo **Expo Go** exige que bundles publicados via EAS Update (`u.expo.dev`) utilizem a política `sdkVersion` (que resolve para `exposdk:52.0.0`), pois o binário do Expo Go valida a compatibilidade do bundle OTA através do `runtimeVersion` do SDK.
- **Alternatives considered**:
  - *Política `appVersion` ou `fingerprint`*: Incompatível com o cliente **Expo Go** padrão (funciona apenas em builds standalone EAS Build).

---

## 3. Proteção de Módulos Nativos Customizados no Cliente Expo Go (`react-native-pdf`)

- **Decision**: No arquivo `src/components/rulebooks/pdf-reader.tsx`, substituir o import estático de topo `import Pdf from 'react-native-pdf'` por resolução condicional segura (`getNativePdfComponent()`), verificando se o ambiente de execução é o cliente **Expo Go** (`Constants.appOwnership === 'expo'` ou `Constants.executionEnvironment === 'storeClient'`). Quando executado no Expo Go, exibir a interface completa de barra de páginas, marcadores e notas com aviso informativo (sem tentar instanciar o TurboModule nativo `RNPDFPdfView`, que não existe no binário padrão do Expo Go).
- **Rationale**:
  - `react-native-pdf` e `react-native-blob-util` são módulos nativos de terceiros que só existem em Development Builds (`expo run:android` / `expo-dev-client`).
  - Se `import Pdf from 'react-native-pdf'` for executado no topo do bundle ao abrir o app no **Expo Go**, `TurboModuleRegistry.getEnforcing('RNPDFPdfView')` lança uma exceção fatal antes mesmo da primeira tela abrir.
  - Carregando sob demanda apenas quando não estiver no cliente `storeClient` (Expo Go), o aplicativo inteiro abre e funciona perfeitamente no Expo Go!
