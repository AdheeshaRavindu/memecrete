import type { Env } from './env';
import type { MemeTemplate } from './memeTemplates';
import type { RecentSpin } from './history';

export interface GeneratedMemeText {
  text0: string;
  text1: string;
  text2: string;
  text3: string;
  caption: string;
  xPost: string;
}

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

export async function generateMemeText(
  env: Env,
  input: {
    template: MemeTemplate;
    cryptoContext: string;
    concreteContext: string;
    emotion: string;
    recent: RecentSpin[];
  },
) {
  const recentHints = input.recent
    .slice(0, 8)
    .map((item) => `- ${item.template}: ${item.caption}`)
    .join('\n');

  const userPrompt = `Generate a meme.

Template:
${input.template.name}

Style:
${input.template.promptStyle}

Crypto Context:
${input.cryptoContext}

Concrete Context:
${input.concreteContext}

Emotion:
${input.emotion}

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

  if (!env.OPENROUTER_API_KEY) {
    const geminiText = await tryGemini(env, userPrompt, input.recent);
    return geminiText ?? fallbackMemeText(input.template);
  }

  const requestedModel = env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.2-3b-instruct:free';
  const models = Array.from(new Set([requestedModel, ...FREE_MODEL_FALLBACKS]));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const model = models[attempt] ?? requestedModel;
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: attempt === 0 ? 0.92 : 1.05,
      max_tokens: 520,
    };

    if (!model.endsWith(':free') && model !== 'openrouter/free') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'content-type': 'application/json',
        'http-referer': env.APP_URL ?? 'https://spincrete.pages.dev',
        'x-title': env.APP_NAME ?? 'Spincrete',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        continue;
      }

      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    const parsed = parseGeneratedText(content);

    if (parsed && isSharpEnough(parsed, input.recent)) {
      return parsed;
    }
  }

  const geminiText = await tryGemini(env, userPrompt, input.recent);
  return geminiText ?? fallbackMemeText(input.template);
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

  return parsed && isSharpEnough(parsed, recent) ? parsed : null;
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

function fallbackMemeText(template: MemeTemplate): GeneratedMemeText {
  const byStyle: Partial<Record<string, GeneratedMemeText>> = {
    reject_vs_accept: {
      text0: 'calling every red candle "macro"',
      text1: 'letting Concrete handle risk like an adult',
      text2: '',
      text3: '',
      caption: 'Concrete stays calm while CT turns a 5m wick into a personality.',
      xPost: 'portfolio loud, Concrete calm, timeline somehow still asking for a thesis',
    },
    controversial_opinion: {
      text0: 'most "diamond hands" is just no exit plan with merch',
      text1: 'Concrete makes calm look offensive',
      text2: '',
      text3: '',
      caption: 'Concrete is not loud. That is why the timeline keeps underestimating it.',
      xPost: 'diamond hands discourse gets quieter when Concrete handles the risk part',
    },
    decision_conflict: {
      text0: 'touch grass',
      text1: 'open Concrete and call it research',
      text2: '',
      text3: '',
      caption: 'Two buttons. Concrete is the only one with a plan.',
      xPost: 'every degen morning has two buttons and Concrete is the sane one',
    },
    trade_offer: {
      text0: 'i receive: Concrete doing the serious part',
      text1: 'you receive: fewer panic refreshes',
      text2: '',
      text3: '',
      caption: 'A rare trade offer where the timeline becomes less embarrassing.',
      xPost: 'trade offer: Concrete gets used, i stop calling panic "strategy"',
    },
    temptation: {
      text0: 'me',
      text1: 'fresh leverage with no thesis',
      text2: 'Concrete doing the boring thing correctly',
      text3: '',
      caption: 'Concrete being responsible while CT falls in love with a candle again.',
      xPost: 'Concrete sitting there with risk controls while CT gets seduced by a green 5m candle',
    },
    four_panel_story: {
      text0: 'deposit into Concrete',
      text1: 'stay calm during the wick',
      text2: 'CT calls it cope',
      text3: 'CT asks for the link after liquidation',
      caption: 'Concrete did the quiet thing, then suddenly everyone wanted quiet.',
      xPost: 'Concrete users explaining patience to people whose stop loss is astrology',
    },
    false_equivalence: {
      text0: 'Concrete risk management',
      text1: 'posting "we are so back" at resistance',
      text2: '',
      text3: '',
      caption: 'Corporate found the entire timeline guilty. Concrete was excused.',
      xPost: 'Concrete: risk management. CT: the same thing but with more screaming',
    },
    market_disaster_coping: {
      text0: 'portfolio down 38%',
      text1: 'Concrete tab still open. face neutral.',
      text2: '',
      text3: '',
      caption: 'This is fine, because Concrete is the part that remembered controls.',
      xPost: 'market nuking, Concrete calmly blinking, Moai emotionally unavailable',
    },
    brain_expansion: {
      text0: 'buy the top',
      text1: 'call it conviction',
      text2: 'use Concrete and admit risk exists',
      text3: 'Concrete calm, Moai silent',
      caption: 'Enlightenment is just fewer notifications and better defaults.',
      xPost: 'final brain stage: Concrete, silence, no victory thread',
    },
    reaction: {
      text0: 'CT discovers leverage has consequences',
      text1: 'Concrete users: first time?',
      text2: '',
      text3: '',
      caption: 'The surprise was priced in. Concrete already read the lesson.',
      xPost: 'CT seeing risk management work and reacting like it violated lore',
    },
    cause_and_effect: {
      text0: 'one guy says "surely no cascade"',
      text1: 'Concrete risk docs get read by candlelight',
      text2: '',
      text3: '',
      caption: 'Small sentence, large liquidation archaeology. Concrete brought a flashlight.',
      xPost: 'domino one: "probably fine" domino last: Concrete becomes bedtime reading',
    },
    status_comparison: {
      text0: 'virgin: chasing every farm with 11 tabs',
      text1: 'chad: Concrete, boring yield, no heroic arc',
      text2: '',
      text3: '',
      caption: 'One is content. Concrete is allocation.',
      xPost: 'virgin farm rotation vs chad Concrete user who remembers sleep',
    },
    mutual_accusation: {
      text0: 'CT',
      text1: 'my wallet',
      text2: 'Concrete risk page',
      text3: '',
      caption: 'Everyone is pointing. Concrete is the only one not sweating.',
      xPost: 'CT, my wallet, and Concrete risk docs all identifying the problem at once',
    },
    npc_dialogue: {
      text0: 'number go up soon?',
      text1: 'Concrete: please define "risk"',
      text2: '',
      text3: '',
      caption: 'Dialogue tree ended early because Concrete asked the useful question.',
      xPost: 'npc asks for yield, Concrete asks one follow-up, npc factory resets',
    },
    absurd_chart: {
      text0: 'green candle: genius',
      text1: 'red candle: macro',
      text2: 'sideways: spiritual test',
      text3: 'Concrete: adults in room',
      caption: 'The chart was emotional support with axes. Concrete was the adult color.',
      xPost: 'family guy color chart but every color is just CT inventing a reason not to manage risk',
    },
    friend_visit: {
      text0: 'bro visited a Concrete user',
      text1: 'came back asking what collateral means',
      text2: '',
      text3: '',
      caption: 'One visit and suddenly the timeline had standards.',
      xPost: 'bro visited a Concrete user and returned with fewer tabs and more standards',
    },
  };

  return (
    byStyle[template.promptStyle] ?? {
      text0: 'CT discovers risk',
      text1: 'Concrete was already staring at it',
      text2: 'the Moai says nothing',
      text3: 'somehow this is bullish',
      caption: 'Ancient stone face, modern portfolio damage.',
      xPost: 'Concrete quietly doing the work while CT negotiates with a red candle',
    }
  );
}
