# Quickstart: Gemini API Foundation & AI Integration Architecture

## Validation Scenarios

### Scenario 1: Missing API Key Detection
1. Ensure `EXPO_PUBLIC_GEMINI_API_KEY` is empty or unset.
2. Call `geminiClient.checkConnection()`.
3. **Verification**:
   - `status.configured` is `false`.
   - `status.connected` is `false`.
   - `status.error.code` is `'MISSING_API_KEY'`.
   - No unhandled exceptions thrown.

### Scenario 2: Live Connectivity Check with Valid Key
1. Set `EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...` in `.env`.
2. Call `geminiClient.checkConnection()`.
3. **Verification**:
   - `status.configured` is `true`.
   - `status.connected` is `true`.
   - `status.latencyMs` is a positive number (typically <2000ms).
   - `status.model` is `'gemini-2.0-flash'`.

### Scenario 3: Structured JSON Prompt Execution
1. Send a request with `responseMimeType: 'application/json'` asking for a list of mechanics.
2. Call `geminiClient.generateContent<{ mechanics: string[] }>(...)`.
3. **Verification**:
   - `res.ok` is `true`.
   - `res.data` is an object with an array of mechanics.

### Scenario 4: Offline / Network Timeout Handling
1. Disconnect network or provide an unreachable host.
2. Call `geminiClient.generateContent({ prompt: 'Test', timeoutMs: 1000 })`.
3. **Verification**:
   - Fails fast and returns `res.ok === false`.
   - `res.error.code` is `'OFFLINE_NETWORK_ERROR'`.
   - Application remains fully responsive.

## Automated Verification Commands

```bash
# 1. Typecheck validation
npm run typecheck

# 2. Unit and contract test suite
npm test tests/unit/gemini-client.test.ts

# 3. Impeccable design system audit
npm run ui:audit
```
