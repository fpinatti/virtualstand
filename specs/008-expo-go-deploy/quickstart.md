# Quickstart & Guia de Deploy para Expo Go (Padrão Piupiu U)

**Feature**: `008-expo-go-deploy`  
**Date**: 2026-11-16

---

## 1. Configuração Inicial do Ambiente (`.env`)

1. Copie o arquivo de exemplo na raiz do projeto:
   ```bash
   cp .env.example .env
   ```
2. Preencha no seu `.env` os valores da sua conta Expo (`expo.dev`):
   ```env
   EAS_PROJECT_ID=seu-uuid-do-projeto-eas
   EXPO_OWNER=seu-usuario-expo
   EXPO_PUBLIC_BGG_API_TOKEN=seu-bearer-token-bgg
   ```

---

## 2. Rodar Localmente no Celular via Expo Go (Modo Túnel)

Para abrir o aplicativo imediatamente no **Expo Go** do seu celular (mesmo em redes Wi-Fi diferentes ou 4G/5G):

```bash
npm run start:go
```

Escaneie o QR Code exibido no terminal com o aplicativo **Expo Go** (Android) ou com a câmera do iPhone (iOS).

---

## 3. Publicar Atualização Remota (EAS Update) para o Expo Go

Para publicar o bundle nos servidores do Expo (`u.expo.dev`) exatamente como no `piapiupiu`:

```bash
# Publicar no canal de preview:
npm run update:preview

# Publicar no canal de produção:
npm run update:prod
```

---

## 4. Validação Automatizada

```bash
npm run typecheck
npm test
npm run ui:audit
```
