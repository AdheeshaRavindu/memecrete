import type { Env } from './env';

export interface RecentSpin {
  template: string;
  caption: string;
  xPost: string;
  jokeFingerprint: string;
  createdAt: string;
  cryptoContext?: string;
  concreteContext?: string;
  emotion?: string;
}

const memoryRecent: RecentSpin[] = [];
const RECENT_LIMIT = 64;

export function readMemoryRecent() {
  return memoryRecent.slice(0, RECENT_LIMIT);
}

export function rememberInMemory(spin: RecentSpin) {
  memoryRecent.unshift(spin);
  memoryRecent.splice(RECENT_LIMIT);
}

export async function readRecentSpins(env: Env) {
  const memory = readMemoryRecent();

  if (!env.SPINCRETE_DB) {
    return memory;
  }

  try {
    const query = await env.SPINCRETE_DB.prepare(
      `SELECT template_name as template, caption, x_post as xPost, joke_fingerprint as jokeFingerprint, created_at as createdAt
       FROM meme_generations
       ORDER BY created_at DESC
       LIMIT 64`,
    ).all<RecentSpin>();

    return [...(query.results ?? []), ...memory].slice(0, RECENT_LIMIT);
  } catch {
    return memory;
  }
}

export async function writeRecentSpin(
  env: Env,
  spin: RecentSpin & {
    id: string;
    templateId: string;
    promptStyle: string;
    memeUrl: string;
    textJson: string;
    cryptoContext: string;
    concreteContext: string;
    emotion: string;
  },
) {
  rememberInMemory(spin);

  if (!env.SPINCRETE_DB) {
    return;
  }

  try {
    await env.SPINCRETE_DB.prepare(
      `INSERT INTO meme_generations (
        id,
        template_id,
        template_name,
        prompt_style,
        caption,
        x_post,
        text_json,
        joke_fingerprint,
        meme_url,
        crypto_context,
        concrete_context,
        emotion,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        spin.id,
        spin.templateId,
        spin.template,
        spin.promptStyle,
        spin.caption,
        spin.xPost,
        spin.textJson,
        spin.jokeFingerprint,
        spin.memeUrl,
        spin.cryptoContext,
        spin.concreteContext,
        spin.emotion,
        spin.createdAt,
      )
      .run();
  } catch {
    // D1 is optional for local/dev deployments. In-memory history still prevents hot-loop repeats.
  }
}
