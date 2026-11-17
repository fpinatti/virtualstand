import { GeminiClient } from '@/services/ai/gemini-client';

describe('GeminiClient - AI Integration Architecture (Feature 010)', () => {
  const originalEnv = process.env;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('User Story 1: API Key Resolution & checkConnection()', () => {
    it('detects missing API key when no env var or config key is provided', async () => {
      const client = new GeminiClient();
      expect(client.getApiKey()).toBe('');

      const status = await client.checkConnection();
      expect(status.configured).toBe(false);
      expect(status.connected).toBe(false);
      expect(status.error?.code).toBe('MISSING_API_KEY');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resolves EXPO_PUBLIC_GEMINI_API_KEY from process.env', async () => {
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'expo-public-key-123';
      const client = new GeminiClient();
      expect(client.getApiKey()).toBe('expo-public-key-123');
    });

    it('resolves GEMINI_API_KEY from process.env as secondary fallback', async () => {
      process.env.GEMINI_API_KEY = 'secondary-gemini-key-456';
      const client = new GeminiClient();
      expect(client.getApiKey()).toBe('secondary-gemini-key-456');
    });

    it('prefers explicit constructor config key over environment variables', async () => {
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'env-key';
      const client = new GeminiClient({ apiKey: 'explicit-client-key' });
      expect(client.getApiKey()).toBe('explicit-client-key');
    });

    it('allows updating runtime key via setApiKey()', () => {
      const client = new GeminiClient();
      expect(client.getApiKey()).toBe('');
      client.setApiKey('runtime-injected-key');
      expect(client.getApiKey()).toBe('runtime-injected-key');
    });

    it('verifies live connectivity successfully and records latency', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'pong' }] } }],
        }),
      });

      const client = new GeminiClient({ apiKey: 'valid-test-key' });
      const status = await client.checkConnection();

      expect(status.configured).toBe(true);
      expect(status.connected).toBe(true);
      expect(status.model).toBe('gemini-3.8-flash');
      expect(typeof status.latencyMs).toBe('number');
      expect(status.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('key=valid-test-key');
    });

    it('maps HTTP 400/401/403 to AUTH_INVALID_KEY during checkConnection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: 'API key not valid. Please pass a valid API key.' },
        }),
      });

      const client = new GeminiClient({ apiKey: 'invalid-key' });
      const status = await client.checkConnection();

      expect(status.configured).toBe(true);
      expect(status.connected).toBe(false);
      expect(status.error?.code).toBe('AUTH_INVALID_KEY');
      expect(status.error?.statusCode).toBe(403);
      expect(status.error?.message).toContain('API key not valid');
    });
  });

  describe('User Story 2: Text Generation & Structured Data Parsing', () => {
    it('generates text content with default model and custom temperature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Scythe foi criado por Jamey Stegmaier.' }],
              },
            },
          ],
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({
        prompt: 'Quem criou o jogo Scythe?',
        systemInstruction: 'Você é um especialista em jogos de tabuleiro.',
        temperature: 0.2,
      });

      expect(response.ok).toBe(true);
      expect(response.text).toBe('Scythe foi criado por Jamey Stegmaier.');
      expect(response.model).toBe('gemini-3.8-flash');
      expect(response.durationMs).toBeGreaterThanOrEqual(0);

      // Verify request payload
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('gemini-3.8-flash:generateContent');
      const body = JSON.parse(options.body);
      expect(body.contents[0].parts[0].text).toBe('Quem criou o jogo Scythe?');
      expect(body.systemInstruction.parts[0].text).toBe('Você é um especialista em jogos de tabuleiro.');
      expect(body.generationConfig.temperature).toBe(0.2);
    });

    it('handles structured JSON requests and parses typed output', async () => {
      interface RuleSummary {
        playerCount: string;
        playTime: string;
        mechanisms: string[];
      }

      const mockJsonPayload: RuleSummary = {
        playerCount: '1-5',
        playTime: '90-115 min',
        mechanisms: ['Engine Building', 'Area Control'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockJsonPayload) }],
              },
            },
          ],
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent<RuleSummary>({
        prompt: 'Resuma o jogo Scythe em JSON.',
        responseMimeType: 'application/json',
      });

      expect(response.ok).toBe(true);
      expect(response.data).toEqual(mockJsonPayload);
      expect(response.data?.mechanisms).toContain('Engine Building');
    });

    it('strips markdown code blocks when parsing structured JSON response', async () => {
      interface SleeveRecommendation {
        size: string;
        count: number;
      }

      const rawJson = '```json\n{"size": "57x89mm", "count": 110}\n```';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: rawJson }],
              },
            },
          ],
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent<SleeveRecommendation>({
        prompt: 'Quantos sleeves para o jogo?',
        responseMimeType: 'application/json',
      });

      expect(response.ok).toBe(true);
      expect(response.data).toEqual({ size: '57x89mm', count: 110 });
    });

    it('returns PARSE_ERROR if model returns invalid JSON when application/json requested', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Definitely Not A Valid JSON' }],
              },
            },
          ],
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({
        prompt: 'Gere JSON.',
        responseMimeType: 'application/json',
      });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('PARSE_ERROR');
      expect(response.text).toBe('Definitely Not A Valid JSON');
    });
  });

  describe('User Story 3: Offline Resilience, Rate Limiting & Safety Refusals', () => {
    it('returns MISSING_API_KEY without network attempt when generating content without a key', async () => {
      const client = new GeminiClient();
      const response = await client.generateContent({ prompt: 'Olá' });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('MISSING_API_KEY');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('classifies network disconnection as OFFLINE_NETWORK_ERROR', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({ prompt: 'Olá' });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('OFFLINE_NETWORK_ERROR');
      expect(response.error?.message).toContain('Network connection offline');
    });

    it('classifies timeouts as OFFLINE_NETWORK_ERROR', async () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({
        prompt: 'Prompt longo',
        timeoutMs: 1000,
      });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('OFFLINE_NETWORK_ERROR');
      expect(response.error?.message).toContain('timed out after 1000ms');
    });

    it('maps HTTP 429 quota exhaustion to RATE_LIMITED error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: 'Resource has been exhausted (e.g. check quota).' },
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({ prompt: 'Pergunta' });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('RATE_LIMITED');
      expect(response.error?.statusCode).toBe(429);
    });

    it('detects SAFETY_REFUSAL when candidate finishReason is SAFETY', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              finishReason: 'SAFETY',
              content: { parts: [] },
            },
          ],
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({ prompt: 'Conteúdo restrito' });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('SAFETY_REFUSAL');
      expect(response.error?.message).toContain('safety filters');
    });

    it('detects promptFeedback blockReason as SAFETY_REFUSAL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          promptFeedback: {
            blockReason: 'SAFETY',
          },
        }),
      });

      const client = new GeminiClient({ apiKey: 'test-key' });
      const response = await client.generateContent({ prompt: 'Conteúdo bloqueado' });

      expect(response.ok).toBe(false);
      expect(response.error?.code).toBe('SAFETY_REFUSAL');
      expect(response.error?.message).toContain('blocked by safety filters: SAFETY');
    });
  });
});
