import { GeminiClient } from './gemini-client';

export * from './gemini-types';
export * from './gemini-client';

/**
 * Default singleton instance configured from application environment variables.
 */
export const geminiClient = new GeminiClient();
