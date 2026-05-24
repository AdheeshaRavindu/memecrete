import { executeSpin } from './spinHandler';
import { getOpenRouterKeys } from './openRouter';
import type { Env } from './env';

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

async function handleSpin(env: Env): Promise<Response> {
  try {
    return json(await executeSpin(env));
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Spin failed',
      },
      { status: error instanceof Error && error.message.includes('templates') ? 502 : 500 },
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const openRouterKeys = getOpenRouterKeys(env);
      return json({
        ok: true,
        app: env.APP_NAME ?? 'Spincrete',
        imgflip: Boolean(env.IMGFLIP_USERNAME && env.IMGFLIP_PASSWORD),
        openRouter: openRouterKeys.length > 0,
        openRouterKeys: openRouterKeys.length,
      });
    }

    if (url.pathname === '/api/spin' && request.method === 'POST') {
      return handleSpin(env);
    }

    return env.ASSETS.fetch(request);
  },
};
