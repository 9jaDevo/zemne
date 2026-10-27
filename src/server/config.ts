/**
 * Backend runtime configuration. Values come only from the server environment
 * (Render secure env / ignored local env). Never expose them to the client.
 */
export interface GemmaConfig {
  /** OpenAI-compatible base URL, e.g. https://generativelanguage.googleapis.com/v1beta/openai */
  baseUrl: string;
  modelId: string;
  apiKey: string | null;
}

export interface ServerConfig {
  mongodbUri: string | null;
  /** HMAC key material for sessions and IP hashing; >= 32 chars. */
  sessionSecret: string | null;
  /** Controls the `__Host-` cookie name and the Secure attribute. */
  production: boolean;
  gemmaConfigured: boolean;
  gemma: GemmaConfig | null;
}

export const MIN_SESSION_SECRET_LENGTH = 32;

export function readConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const secret = env.SESSION_SECRET?.trim() ?? "";
  const baseUrl = env.GEMMA_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "";
  const modelId = env.GEMMA_MODEL_ID?.trim() ?? "";
  const gemma = baseUrl && modelId ? { baseUrl, modelId, apiKey: env.GEMMA_API_KEY?.trim() || null } : null;
  return {
    mongodbUri: env.MONGODB_URI?.trim() || null,
    sessionSecret: secret.length >= MIN_SESSION_SECRET_LENGTH ? secret : null,
    production: env.NODE_ENV === "production",
    gemmaConfigured: gemma !== null,
    gemma,
  };
}
