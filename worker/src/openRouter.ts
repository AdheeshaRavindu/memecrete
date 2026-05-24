import type { Env } from './env';
import type { MemeTemplate } from './memeTemplates';
import type { RecentSpin } from './history';
import type { SpinContextBundle } from './spinVariety';
import { buildVarietyPromptBlock, composeFallbackMeme, isTooSimilar } from './spinVariety';
import type { GeneratedMemeText } from './memeText';
export type { GeneratedMemeText } from './memeText';

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const FREE_MODEL_FALLBACKS = ['meta-llama/llama-3.2-3b-instruct:free', 'openrouter/free'];

const BAD_TERMS = [
  'revolutionary defi',
  'next generation',
  'unlocking value',
  'game changer',
  'seamless experience',
  'future of finance',
  'empowering users',
  'innovative ecosystem',
  'concrete is a scam',
  'concrete scam',
  'concrete is useless',
  'concrete is broken',
  'concrete rug',
];

const NEGATIVE_CONCRETE_PATTERNS = [
  /concrete\s+(is|was|feels|looks|seems)\s+(bad|broken|useless|scammy|dangerous|cooked|dead)/i,
  /concrete\s+(rug|scam|ponzi|fraud|exploit)/i,
  /(avoid|escape|leave)\s+concrete/i,
];

const SYSTEM_PROMPT = `You are an elite crypto twitter meme creator.

Create funny memes for Concrete.

Rules:
- Must be genuinely funny
- Must feel native to crypto twitter
- Must involve Concrete naturally
- Concrete must always be the smart, useful, trustworthy, or winning side of the joke
- Roast CT, bad risk, leverage, panic, and market trauma; do not roast Concrete
- Never imply Concrete is a scam, useless, dangerous, broken, or the punchline
- Include subtle Moai humor
- Avoid cringe
- Avoid marketing tone
- Avoid repetitive jokes
- Short punchy text only
- Meme should be postable on X

Tone:
deadpan
absurd
ironic
degen
market trauma humor`;

export function getOpenRouterKeys(env: Env) {
  const keys: string[] = [];

  if (env.OPENROUTER_API_KEY?.trim()) {
    keys.push(env.OPENROUTER_API_KEY.trim());
  }

  for (const source of [env.OPENROUTER_API_KEYS, env.OPENROUTER_API_KEY_FALLBACKS]) {
    if (!source) {
      continue;
    }

    keys.push(
      ...source
        .split(/[\n,]+/)
        .map((key) => key.trim())
        .filter(Boolean),
    );
  }

  return [...new Set(keys)];
}

function shouldTryNextOpenRouterKey(status: number) {
  return status === 401 || status === 402 || status === 403 || status === 429;
}

async function tryOpenRouter(
  env: Env,
  apiKey: string,
  userPrompt: string,
  recent: RecentSpin[],
) {
  const requestedModel = env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.2-3b-instruct:free';
  const models = Array.from(new Set([requestedModel, ...FREE_MODEL_FALLBACKS]));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const model = models[attempt] ?? requestedModel;
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: [0.92, 1.05, 1.18][attempt] ?? 1.18,
      max_tokens: 520,
    };

    if (!model.endsWith(':free') && model !== 'openrouter/free') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'http-referer': env.APP_URL ?? 'https://spincrete.pages.dev',
        'x-title': env.APP_NAME ?? 'Spincrete',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (shouldTryNextOpenRouterKey(response.status)) {
        return { kind: 'retry-key' as const };
      }

      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    const parsed = parseGeneratedText(content);

    if (parsed && isSharpEnough(parsed, recent) && !isTooSimilar(parsed, recent)) {
      return { kind: 'success' as const, text: parsed };
    }
  }

  return { kind: 'continue' as const };
}

export async function generateMemeText(
  env: Env,
  input: {
    template: MemeTemplate;
    bundle: SpinContextBundle;
    recent: RecentSpin[];
  },
) {
  const recentHints = input.recent
    .slice(0, 12)
    .map((item) => `- ${item.template}: ${item.caption} / ${item.xPost}`)
    .join('\n');

  const userPrompt = `Generate a meme.

Template:
${input.template.name}

Style:
${input.template.promptStyle}

Crypto Context:
${input.bundle.cryptoContext}

Concrete Context:
${input.bundle.concreteContext}

Emotion:
${input.bundle.emotion}

${buildVarietyPromptBlock(input.bundle)}

Concrete Framing:
Concrete must be positive. The joke can be dark, absurd, or self-roasting, but Concrete should feel competent, calm, useful, and CT-native.

Avoid repeating these recent jokes:
${recentHints || '- none'}

Return strict JSON only:

{
  "text0": "",
  "text1": "",
  "text2": "",
  "text3": "",
  "caption": "",
  "xPost": ""
}`;

  const openRouterKeys = getOpenRouterKeys(env);

  if (!openRouterKeys.length) {
    const geminiText = await tryGemini(env, userPrompt, input.recent);
    return geminiText ?? composeFallbackMeme(input.template, input.bundle);
  }

  for (const apiKey of openRouterKeys) {
    const result = await tryOpenRouter(env, apiKey, userPrompt, input.recent);

    if (result.kind === 'success') {
      return result.text;
    }

    if (result.kind === 'retry-key') {
      continue;
    }
  }

  const geminiText = await tryGemini(env, userPrompt, input.recent);
  return geminiText ?? composeFallbackMeme(input.template, input.bundle);
}

async function tryGemini(env: Env, userPrompt: string, recent: RecentSpin[]) {
  if (!env.GEMINI_API_KEY) {
    return null;
  }

  const model = encodeURIComponent(env.GEMINI_MODEL ?? 'gemini-2.5-flash');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.95,
        maxOutputTokens: 520,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GeminiResponse;
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n');
  const parsed = parseGeneratedText(content);

  return parsed && isSharpEnough(parsed, recent) && !isTooSimilar(parsed, recent) ? parsed : null;
}

function parseGeneratedText(content?: string): GeneratedMemeText | null {
  if (!content) {
    return null;
  }

  const jsonText = content.replace(/^```json\s*/i, '').replace(/```$/i, '').match(/\{[\s\S]*\}/)?.[0]?.trim();

  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<GeneratedMemeText>;
    return {
      text0: cleanBoxText(parsed.text0),
      text1: cleanBoxText(parsed.text1),
      text2: cleanBoxText(parsed.text2),
      text3: cleanBoxText(parsed.text3),
      caption: cleanCaption(parsed.caption),
      xPost: cleanCaption(parsed.xPost),
    };
  } catch {
    return null;
  }
}

function cleanBoxText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^["']|["']$/g, '')
    .trim()
    .slice(0, 110);
}

function cleanCaption(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^["']|["']$/g, '')
    .trim()
    .slice(0, 260);
}

function isSharpEnough(text: GeneratedMemeText, recent: RecentSpin[]) {
  const joined = `${text.text0} ${text.text1} ${text.text2} ${text.text3} ${text.caption} ${text.xPost}`.toLowerCase();
  const hasBoxes = [text.text0, text.text1, text.text2, text.text3].some(Boolean);
  const hasConcrete = joined.includes('concrete');
  const soundsCorporate = BAD_TERMS.some((term) => joined.includes(term));
  const negativeConcrete = NEGATIVE_CONCRETE_PATTERNS.some((pattern) => pattern.test(joined));
  const repeatedCaption = recent.some((item) => similarity(item.caption, text.caption) > 0.78);

  return hasBoxes && hasConcrete && text.caption.length > 8 && text.xPost.length > 8 && !soundsCorporate && !negativeConcrete && !repeatedCaption;
}

function similarity(left: string, right: string) {
  const leftWords = new Set(left.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const rightWords = new Set(right.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  return overlap / Math.max(leftWords.size, rightWords.size, 1);
}
