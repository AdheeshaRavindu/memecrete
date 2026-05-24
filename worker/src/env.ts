export interface Env {
  ASSETS: Fetcher;
  SPINCRETE_DB?: D1Database;
  SPINCRETE_ASSETS?: R2Bucket;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_API_KEYS?: string;
  OPENROUTER_API_KEY_FALLBACKS?: string;
  OPENROUTER_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  IMGFLIP_USERNAME?: string;
  IMGFLIP_PASSWORD?: string;
  APP_NAME?: string;
  APP_URL?: string;
}
