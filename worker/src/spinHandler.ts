import type { SpinMemeResponse } from '../../src/shared/types';
import type { Env } from './env';
import { readRecentSpins, writeRecentSpin } from './history';
import { getCuratedTemplates, renderMeme } from './imgflip';
import { generateMemeText } from './openRouter';
import type { GeneratedMemeText } from './memeText';
import {
  buildSpinContext,
  chooseTemplate,
  composeFallbackMeme,
  isTooSimilar,
  jokeFingerprint,
} from './spinVariety';

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

const MAX_SPIN_ATTEMPTS = 4;

export async function executeSpin(env: Env): Promise<SpinMemeResponse> {
  const recent = await readRecentSpins(env);
  const templates = await getCuratedTemplates();

  if (!templates.length) {
    throw new Error('No curated Imgflip templates are available');
  }

  for (let attempt = 0; attempt < MAX_SPIN_ATTEMPTS; attempt += 1) {
    const template = chooseTemplate(templates, recent);
    const bundle = buildSpinContext(recent);
    let generated = addMoaiTouch(
      await generateMemeText(env, {
        template,
        bundle,
        recent,
      }),
    );

    if (isTooSimilar(generated, recent)) {
      generated = composeFallbackMeme(template, {
        ...bundle,
        spinNonce: crypto.randomUUID(),
      });
      generated = addMoaiTouch(generated);
    }

    if (isTooSimilar(generated, recent)) {
      continue;
    }

    const memeUrl = await renderMeme(env, template, generated);
    const createdAt = new Date().toISOString();
    const fp = `${template.promptStyle}:${jokeFingerprint(generated)}`;

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
      jokeFingerprint: fp,
      cryptoContext: bundle.cryptoContext,
      concreteContext: bundle.concreteContext,
      emotion: bundle.emotion,
      createdAt,
    });

    return response;
  }

  throw new Error('Could not generate a fresh meme after several attempts');
}
