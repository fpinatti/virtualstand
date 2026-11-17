import {
  AiConnectionStatus,
  AiError,
  AiPromptRequest,
  AiPromptResponse,
  GeminiClientConfig,
  GeminiModel,
  IGeminiClient,
} from './gemini-types';

const DEFAULT_MODEL: GeminiModel =
  process.env.EXPO_PUBLIC_GEMINI_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-3.8-flash';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_PING_TIMEOUT_MS = 5000;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiClient implements IGeminiClient {
  private configApiKey?: string;
  private defaultModel: GeminiModel;
  private defaultTimeoutMs: number;

  constructor(config?: GeminiClientConfig) {
    this.configApiKey = config?.apiKey;
    this.defaultModel = config?.defaultModel || DEFAULT_MODEL;
    this.defaultTimeoutMs = config?.defaultTimeoutMs || DEFAULT_TIMEOUT_MS;
  }

  /**
   * Resolves the active Gemini API key from explicit config or environment variables.
   */
  public getApiKey(): string {
    return (
      this.configApiKey ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();
  }

  /**
   * Updates or overrides the runtime API key.
   */
  public setApiKey(apiKey: string): void {
    this.configApiKey = apiKey;
  }

  /**
   * Performs a lightweight ping to verify that the API key is active and the remote API responds.
   */
  public async checkConnection(timeoutMs = DEFAULT_PING_TIMEOUT_MS): Promise<AiConnectionStatus> {
    const apiKey = this.getApiKey();
    const model = this.defaultModel;

    if (!apiKey) {
      return {
        configured: false,
        connected: false,
        model,
        error: {
          code: 'MISSING_API_KEY',
          message: 'Gemini API key is not configured in environment variables or client config.',
        },
      };
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
        signal: controller.signal,
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          // Response body was not JSON
        }

        const aiError = this.mapHttpStatusToAiError(response.status, errorData);
        return {
          configured: true,
          connected: false,
          model,
          latencyMs,
          error: aiError,
        };
      }

      return {
        configured: true,
        connected: true,
        model,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const isAbort = err?.name === 'AbortError' || controller.signal.aborted;
      return {
        configured: true,
        connected: false,
        model,
        latencyMs,
        error: {
          code: 'OFFLINE_NETWORK_ERROR',
          message: isAbort
            ? `Connection test timed out after ${timeoutMs}ms.`
            : `Network connectivity failure: ${err?.message || 'Offline'}`,
          rawDetails: err,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generates a text or structured response from Gemini.
   */
  public async generateContent<T = unknown>(
    request: AiPromptRequest
  ): Promise<AiPromptResponse<T>> {
    const startTime = performance.now();
    const model = request.model || this.defaultModel;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        ok: false,
        text: '',
        model,
        durationMs: 0,
        error: {
          code: 'MISSING_API_KEY',
          message: 'Gemini API key is not configured. AI capabilities are offline.',
        },
      };
    }

    const timeoutMs = request.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      // Build payload matching Gemini v1beta specification
      const contents = [
        {
          role: 'user',
          parts: [{ text: request.prompt }],
        },
      ];

      const body: Record<string, any> = { contents };

      if (request.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: request.systemInstruction }],
        };
      }

      const generationConfig: Record<string, any> = {};
      if (typeof request.temperature === 'number') {
        generationConfig.temperature = request.temperature;
      }
      if (typeof request.maxOutputTokens === 'number') {
        generationConfig.maxOutputTokens = request.maxOutputTokens;
      }
      if (request.responseMimeType) {
        generationConfig.responseMimeType = request.responseMimeType;
      }

      if (Object.keys(generationConfig).length > 0) {
        body.generationConfig = generationConfig;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const durationMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          // ignore parsing error
        }

        // Self-healing: if model is deprecated or not found (404), check if Google suggested a newer model
        if (response.status === 404 && !(request as any)._isRetry) {
          const suggestedModel =
            this.extractSuggestedModel(errorData?.error?.message) ||
            (model !== 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-1.5-flash');

          if (suggestedModel && suggestedModel !== model) {
            this.defaultModel = suggestedModel;
            return this.generateContent({
              ...request,
              model: suggestedModel,
              _isRetry: true,
            } as any);
          }
        }

        const aiError = this.mapHttpStatusToAiError(response.status, errorData);
        return {
          ok: false,
          text: '',
          model,
          durationMs,
          error: aiError,
        };
      }

      const responseJson = await response.json();

      // Check for promptFeedback block (e.g., safety block before generation)
      if (responseJson.promptFeedback?.blockReason) {
        return {
          ok: false,
          text: '',
          model,
          durationMs,
          error: {
            code: 'SAFETY_REFUSAL',
            message: `Generation was blocked by safety filters: ${responseJson.promptFeedback.blockReason}`,
            rawDetails: responseJson.promptFeedback,
          },
        };
      }

      const candidate = responseJson.candidates?.[0];
      if (!candidate) {
        return {
          ok: false,
          text: '',
          model,
          durationMs,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'No candidates returned from Gemini API response.',
            rawDetails: responseJson,
          },
        };
      }

      // Check candidate finishReason
      if (candidate.finishReason === 'SAFETY') {
        return {
          ok: false,
          text: '',
          model,
          durationMs,
          error: {
            code: 'SAFETY_REFUSAL',
            message: 'Candidate generation was blocked by safety filters.',
            rawDetails: candidate,
          },
        };
      }

      const rawText = candidate.content?.parts?.map((p: any) => p.text || '').join('') || '';

      // If structured JSON was requested, parse the payload
      if (request.responseMimeType === 'application/json') {
        const parsedResult = this.parseJsonSafely<T>(rawText);
        if (!parsedResult.ok) {
          return {
            ok: false,
            text: rawText,
            model,
            durationMs,
            error: {
              code: 'PARSE_ERROR',
              message: `Failed to parse structured JSON response: ${parsedResult.error}`,
              rawDetails: rawText,
            },
          };
        }

        return {
          ok: true,
          text: rawText,
          data: parsedResult.data,
          model,
          durationMs,
        };
      }

      return {
        ok: true,
        text: rawText,
        model,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const isAbort = err?.name === 'AbortError' || controller.signal.aborted;

      return {
        ok: false,
        text: '',
        model,
        durationMs,
        error: {
          code: 'OFFLINE_NETWORK_ERROR',
          message: isAbort
            ? `Request timed out after ${timeoutMs}ms.`
            : `Network connection offline or unavailable: ${err?.message || 'Offline'}`,
          rawDetails: err,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Robust JSON parser with fallback to strip markdown code blocks.
   */
  private parseJsonSafely<T>(text: string): { ok: true; data: T } | { ok: false; error: string } {
    const trimmed = text.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return { ok: true, data: parsed as T };
    } catch (directErr: any) {
      // Fallback: strip ```json ... ``` or ``` ... ``` wrappers
      const stripped = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      try {
        const parsed = JSON.parse(stripped);
        return { ok: true, data: parsed as T };
      } catch (fallbackErr: any) {
        return { ok: false, error: directErr?.message || 'Invalid JSON' };
      }
    }
  }

  /**
   * Maps HTTP response status codes and Gemini API errors into strongly-typed AiError.
   */
  private mapHttpStatusToAiError(status: number, errorData?: any): AiError {
    const geminiMessage = errorData?.error?.message;

    if (status === 400 || status === 401 || status === 403) {
      return {
        code: 'AUTH_INVALID_KEY',
        message: geminiMessage || `Authentication or authorization failed (HTTP ${status}). Check API key.`,
        statusCode: status,
        rawDetails: errorData,
      };
    }

    if (status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: geminiMessage || 'Gemini API rate limit exceeded. Please retry later.',
        statusCode: 429,
        rawDetails: errorData,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: geminiMessage || `Gemini API returned HTTP status ${status}.`,
      statusCode: status,
      rawDetails: errorData,
    };
  }

  /**
   * Parses potential newer model recommendations from Google error messages.
   */
  private extractSuggestedModel(message?: string): string | null {
    if (!message) return null;
    const match = message.match(/models\/([a-zA-Z0-9.\-_]+)/);
    return match ? match[1] : null;
  }
}
