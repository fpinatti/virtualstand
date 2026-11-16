# Data Model: Gemini API Foundation & AI Integration Architecture

## Entities & Type Definitions

Defined in `specs/010-gemini-ai-integration/contracts/gemini-ai-contract.ts` and `src/services/ai/gemini-types.ts`.

### 1. `AiPromptRequest` (Input Model)

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | The user or application prompt text |
| `systemInstruction` | `string` | No | Persona or guidelines for the model |
| `model` | `string` | No | Target model (default: `gemini-2.0-flash`) |
| `temperature` | `number` | No | Sampling temperature (0.0 to 2.0, default: 0.7) |
| `maxOutputTokens` | `number` | No | Maximum token cap for generated response |
| `responseMimeType` | `'text/plain' \| 'application/json'` | No | Explicit format constraint |
| `timeoutMs` | `number` | No | Request timeout in milliseconds (default: 15000) |

---

### 2. `AiPromptResponse<T>` (Output Model)

| Field | Type | Description |
|---|---|---|
| `ok` | `boolean` | True if response was generated and parsed without errors |
| `text` | `string` | Raw text returned by Gemini |
| `data` | `T \| undefined` | Parsed object when `responseMimeType === 'application/json'` |
| `model` | `string` | Name of model that produced the answer |
| `durationMs` | `number` | Round-trip request duration in milliseconds |
| `error` | `AiError \| undefined` | Structured error details if request failed |

---

### 3. `AiConnectionStatus` (Health Check Model)

| Field | Type | Description |
|---|---|---|
| `configured` | `boolean` | True if an API key is detected in environment |
| `connected` | `boolean` | True if live test request succeeded |
| `model` | `string` | Tested model name |
| `latencyMs` | `number \| undefined` | Ping latency in milliseconds |
| `error` | `AiError \| undefined` | Detailed error if check failed |

---

### 4. Database Persistence

*Note: The Gemini API foundation is a pure stateless network integration client. It does not introduce new SQLite tables. Future features consuming this client (e.g. cached AI suggestions, rulebook summaries) will store their domain entities in SQLite via existing migration conventions.*
