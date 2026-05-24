import type { Env } from '../../worker/src/env';
import { pickRandom, CRYPTO_CONTEXTS, CONCRETE_CONTEXTS, EMOTIONS } from '../../worker/src/memeContexts';
import { generateMemeText } from '../../worker/src/openRouter';
import { getCuratedTemplates, renderMeme } from '../../worker/src/imgflip';
import { readRecentSpins, writeRecentSpin } from '../../worker/src/history';

export interface SpinMemeResponse {
  memeUrl: string;
  caption: string;
  xPost: string;
  template: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const templates = await getCuratedTemplates();
  const template = templates[Math.floor(Math.random() * templates.length)];
  const recent = await readRecentSpins(env);
  const cryptoContext = pickRandom(CRYPTO_CONTEXTS);
  const concreteContext = pickRandom(CONCRETE_CONTEXTS);
  const emotion = pickRandom(EMOTIONS);
  const generatedText = await generateMemeText(env, {
    template,
    cryptoContext,
    concreteContext,
    emotion,
    recent,
  });
  const memeUrl = await renderMeme(env, template, generatedText);
  const createdAt = new Date().toISOString();
  const jokeFingerprint = `${template.promptStyle}:${[generatedText.text0, generatedText.text1, generatedText.text2, generatedText.text3]
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, ' ')
    .trim()}`;

  await writeRecentSpin(env, {
    template: template.name,
    caption: generatedText.caption,
    xPost: generatedText.xPost,
    jokeFingerprint,
    createdAt,
    id: crypto.randomUUID(),
    templateId: template.id,
    promptStyle: template.promptStyle,
    memeUrl,
    textJson: JSON.stringify(generatedText),
    cryptoContext,
    concreteContext,
    emotion,
  });

  return new Response(JSON.stringify({
    memeUrl,
    caption: generatedText.caption,
    xPost: generatedText.xPost,
    template: template.name,
  }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};