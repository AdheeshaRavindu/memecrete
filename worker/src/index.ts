import type { SpinMemeResponse } from '../../src/shared/types';
import { pickRandom, CRYPTO_CONTEXTS, CONCRETE_CONTEXTS, EMOTIONS } from './memeContexts';
import { readRecentSpins, writeRecentSpin } from './history';
import { renderMeme, getCuratedTemplates } from './imgflip';
import { generateMemeText, type GeneratedMemeText } from './openRouter';
import type { Env } from './env';
import type { MemeTemplate } from './memeTemplates';

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
      ...init?.headers,
    },
  });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

function chooseTemplate(templates: MemeTemplate[], recentTemplates: string[]) {
  const blocked = new Set(recentTemplates.slice(0, Math.min(4, templates.length - 1)));
  const pool = templates.filter((template) => !blocked.has(template.name));
  return pool[Math.floor(Math.random() * pool.length)] ?? templates[Math.floor(Math.random() * templates.length)];
}

function addMoaiTouch(text: GeneratedMemeText) {
  if (Math.random() > 0.28) {
    return text;
  }

  const moai = '\uD83D\uDDFF';
  const xPost = text.xPost.includes(moai) ? text.xPost : `${text.xPost} ${moai}`;

  return {
    ...text,
    xPost: xPost.slice(0, 260),
  };
}

function fingerprint(template: MemeTemplate, text: GeneratedMemeText) {
  return `${template.promptStyle}:${[text.text0, text.text1, text.text2, text.text3]
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, ' ')
    .trim()}`;
}

async function handleSpin(env: Env): Promise<Response> {
  const recent = await readRecentSpins(env);
  const templates = await getCuratedTemplates();

  if (!templates.length) {
    return json({ error: 'No curated Imgflip templates are available' }, { status: 502 });
  }

  const template = chooseTemplate(
    templates,
    recent.map((item) => item.template),
  );
  const cryptoContext = pickRandom(CRYPTO_CONTEXTS);
  const concreteContext = pickRandom(CONCRETE_CONTEXTS);
  const emotion = pickRandom(EMOTIONS);
  const generated = addMoaiTouch(
    await generateMemeText(env, {
      template,
      cryptoContext,
      concreteContext,
      emotion,
      recent,
    }),
  );
  const memeUrl = await renderMeme(env, template, generated);
  const createdAt = new Date().toISOString();
  const jokeFingerprint = fingerprint(template, generated);

  const response: SpinMemeResponse = {
    memeUrl,
    caption: generated.caption,
    xPost: generated.xPost,
    template: template.name,
  };

  await writeRecentSpin(env, {
    id: crypto.randomUUID(),
    template: template.name,
    templateId: template.id,
    promptStyle: template.promptStyle,
    caption: response.caption,
    xPost: response.xPost,
    memeUrl,
    textJson: JSON.stringify(generated),
    jokeFingerprint,
    cryptoContext,
    concreteContext,
    emotion,
    createdAt,
  });

  return json(response);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        app: env.APP_NAME ?? 'Spincrete',
        imgflip: Boolean(env.IMGFLIP_USERNAME && env.IMGFLIP_PASSWORD),
        openRouter: Boolean(env.OPENROUTER_API_KEY),
      });
    }

    if (url.pathname === '/api/spin' && request.method === 'POST') {
      try {
        return await handleSpin(env);
      } catch (error) {
        return json(
          {
            error: error instanceof Error ? error.message : 'Spin failed',
          },
          { status: 500 },
        );
      }
    }

    return json({ error: 'Not found' }, { status: 404 });
  },
};
