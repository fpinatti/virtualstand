/**
 * Contract: Gemini API Foundation & AI Integration Architecture (Feature 010)
 */

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-1.5-flash' | string;

export type AiErrorCode =
  | 'MISSING_API_KEY'
  | 'AUTH_INVALID_KEY'
  | 'RATE_LIMITED'
  | 'OFFLINE_NETWORK_ERROR'
  | 'SAFETY_REFUSAL'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AiError {
  code: AiErrorCode;
  message: string;
  statusCode?: number;
  rawDetails?: unknown;
}

export interface AiPromptRequest {
  prompt: string;
  systemInstruction?: string;
  model?: GeminiModel;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
  timeoutMs?: number;
}

export interface AiPromptResponse<T = unknown> {
  ok: boolean;
  text: string;
  data?: T;
  model: string;
  durationMs: number;
  error?: AiError;
}

export interface AiConnectionStatus {
  configured: boolean;
  connected: boolean;
  model: string;
  latencyMs?: number;
  error?: AiError;
}

export interface IGeminiClient {
  /**
   * Performs a lightweight ping to verify that the API key is active and the remote API responds.
   */
  checkConnection(timeoutMs?: number): Promise<AiConnectionStatus>;

  /**
   * Generates a text or structured response from Gemini.
   */
  generateContent<T = unknown>(request: AiPromptRequest): Promise<AiPromptResponse<T>>;
}
