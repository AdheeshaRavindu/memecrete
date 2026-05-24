import type { Env } from '../../worker/src/env';
import { executeSpin } from '../../worker/src/spinHandler';

export interface SpinMemeResponse {
  memeUrl: string;
  caption: string;
  xPost: string;
  template: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  try {
    const response = await executeSpin(env);
    return new Response(JSON.stringify(response), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Spin failed',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  }
};
