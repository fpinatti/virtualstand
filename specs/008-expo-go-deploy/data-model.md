# Phase 1 Data Model: Mecanismo de Deploy e Execução para Expo Go (Padrão Piupiu U)

**Feature**: `008-expo-go-deploy`  
**Date**: 2026-11-16

---

## 1. Variáveis de Ambiente de Deploy (`.env` / `.env.example`)

| Variável | Obrigatória para Deploy EAS | Descrição |
|---|---|---|
| `EAS_PROJECT_ID` | Sim (para `update:preview` / `update:prod`) | UUID do projeto registrado no painel do Expo (`expo.dev`) |
| `EXPO_OWNER` | Opcional / Recomendado | Nome de usuário ou organização proprietária da conta no Expo |
| `EXPO_PUBLIC_BGG_API_TOKEN` | Opcional | Bearer Token padrão da XMLAPI2 do BoardGameGeek |

---

## 2. Estrutura de Configuração Resolvida (`ExpoConfigResolved`)

Gerada em tempo de execução por `app.config.js` a partir da base `app.json`:

| Caminho na Configuração | Origem | Valor Resolvido |
|---|---|---|
| `expo.owner` | `process.env.EXPO_OWNER` | `<owner>` (omitido se vazio) |
| `expo.extra.eas.projectId` | `process.env.EAS_PROJECT_ID \|\| process.env.EXPO_PUBLIC_EAS_PROJECT_ID` | `<projectId>` (omitido se vazio) |
| `expo.updates.url` | `process.env.EAS_PROJECT_ID` | `https://u.expo.dev/<projectId>` (omitido se vazio) |
| `expo.runtimeVersion` | `app.json` | `{ "policy": "sdkVersion" }` |
| `expo.web.bundler` | `app.json` | `"metro"` |
