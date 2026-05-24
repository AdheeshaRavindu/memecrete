import type { MemeTemplate, PromptStyle } from './memeTemplates';
import type { GeneratedMemeText } from './memeText';
import type { RecentSpin } from './history';
import { CRYPTO_CONTEXTS, CONCRETE_CONTEXTS, EMOTIONS, SPIN_ANGLES, CT_HOOKS, MOAI_BITS } from './memeContexts';

export interface SpinContextBundle {
  cryptoContext: string;
  concreteContext: string;
  emotion: string;
  angle: string;
  hook: string;
  moaiBit: string;
  spinNonce: string;
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickAvoidingRecent(items: string[], recentValues: string[]) {
  const blocked = new Set(recentValues.filter(Boolean));
  const fresh = items.filter((item) => !blocked.has(item));
  const pool = fresh.length ? fresh : items;
  return pickRandom(pool);
}

function shorten(text: string, max = 72) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) {
    return cleaned;
  }

  const cut = cleaned.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function similarity(left: string, right: string) {
  const leftWords = new Set(left.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const rightWords = new Set(right.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  return overlap / Math.max(leftWords.size, rightWords.size, 1);
}

export function isTooSimilar(text: GeneratedMemeText, recent: RecentSpin[]) {
  const fingerprint = jokeFingerprint(text);
  const joined = `${text.caption} ${text.xPost} ${text.text0} ${text.text1}`.toLowerCase();

  return recent.some((item) => {
    if (item.jokeFingerprint === fingerprint) {
      return true;
    }

    return similarity(item.caption, text.caption) > 0.72 || similarity(item.xPost, text.xPost) > 0.68;
  });
}

export function jokeFingerprint(text: Pick<GeneratedMemeText, 'text0' | 'text1' | 'text2' | 'text3'>) {
  return [text.text0, text.text1, text.text2, text.text3]
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, ' ')
    .trim();
}

export function chooseTemplate(templates: MemeTemplate[], recent: RecentSpin[]) {
  const recentTemplates = recent.map((item) => item.template);
  const blocked = new Set(recentTemplates.slice(0, Math.min(10, templates.length - 1)));
  const weights = templates.map((template) => {
    const recentIndex = recentTemplates.indexOf(template.name);
    if (blocked.has(template.name)) {
      return 0;
    }

    if (recentIndex === -1) {
      return 3;
    }

    return Math.max(0.35, 2.4 - recentIndex * 0.35);
  });

  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = Math.random() * total;

  for (let index = 0; index < templates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) {
      return templates[index];
    }
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

export function buildSpinContext(recent: RecentSpin[]): SpinContextBundle {
  return {
    cryptoContext: pickAvoidingRecent(
      CRYPTO_CONTEXTS,
      recent.map((item) => item.cryptoContext ?? ''),
    ),
    concreteContext: pickAvoidingRecent(
      CONCRETE_CONTEXTS,
      recent.map((item) => item.concreteContext ?? ''),
    ),
    emotion: pickAvoidingRecent(
      EMOTIONS,
      recent.map((item) => item.emotion ?? ''),
    ),
    angle: pickRandom(SPIN_ANGLES),
    hook: pickRandom(CT_HOOKS),
    moaiBit: pickRandom(MOAI_BITS),
    spinNonce: crypto.randomUUID(),
  };
}

export function buildVarietyPromptBlock(bundle: SpinContextBundle) {
  return `Freshness directives:
- Mandatory angle: ${bundle.angle}
- Scene hook: ${bundle.hook}
- Moai flavor: ${bundle.moaiBit}
- Spin nonce: ${bundle.spinNonce}
- This spin must feel completely new. Do not reuse phrasing, setups, or punchlines from recent jokes.`;
}

export function composeFallbackMeme(template: MemeTemplate, bundle: SpinContextBundle): GeneratedMemeText {
  const crypto = shorten(bundle.cryptoContext, 64);
  const concrete = shorten(bundle.concreteContext, 64);
  const emotion = shorten(bundle.emotion, 48);
  const hook = shorten(bundle.hook, 56);
  const angle = shorten(bundle.angle, 56);
  const moai = bundle.moaiBit;

  const builders: Record<PromptStyle, () => GeneratedMemeText> = {
    reject_vs_accept: () => ({
      text0: shorten(`${hook}`, 58),
      text1: shorten(`${concrete}`, 58),
      text2: '',
      text3: '',
      caption: `${crypto} loses again. ${concrete} stays poured.`,
      xPost: `${angle}. ${moai}`,
    }),
    controversial_opinion: () => ({
      text0: shorten(`${angle}`, 58),
      text1: shorten(`${concrete} while CT stays ${emotion}`, 58),
      text2: '',
      text3: '',
      caption: `Hot take: ${crypto}`,
      xPost: `${hook} — Concrete still calm. ${moai}`,
    }),
    decision_conflict: () => ({
      text0: shorten(`panic about ${hook}`, 52),
      text1: shorten(`open Concrete and breathe`, 52),
      text2: '',
      text3: '',
      caption: `${emotion}, two buttons, one adult choice.`,
      xPost: `${angle}. ${concrete}`,
    }),
    trade_offer: () => ({
      text0: shorten(`I receive: ${concrete}`, 52),
      text1: shorten(`You receive: less ${hook}`, 52),
      text2: '',
      text3: '',
      caption: `Rare CT trade offer with standards.`,
      xPost: `${crypto} offered chaos. Concrete countered. ${moai}`,
    }),
    temptation: () => ({
      text0: 'me',
      text1: shorten(`${hook}`, 52),
      text2: shorten(`${concrete}`, 52),
      text3: '',
      caption: `${emotion} vs discipline.`,
      xPost: `${angle}. ${moai}`,
    }),
    four_panel_story: () => ({
      text0: shorten(`CT discovers ${hook}`, 48),
      text1: shorten(`${emotion} intensifies`, 48),
      text2: shorten(`${concrete} enters`, 48),
      text3: shorten(`timeline asks for notes`, 48),
      caption: `Four panels, one lesson.`,
      xPost: `${crypto} → ${concrete}. ${moai}`,
    }),
    false_equivalence: () => ({
      text0: shorten(`${concrete}`, 52),
      text1: shorten(`${crypto}`, 52),
      text2: '',
      text3: '',
      caption: `Corporate says these are the same picture.`,
      xPost: `${angle}. ${hook}`,
    }),
    market_disaster_coping: () => ({
      text0: shorten(`${crypto}`, 52),
      text1: shorten(`${concrete} tab still open`, 52),
      text2: '',
      text3: '',
      caption: `${emotion}, but controls exist.`,
      xPost: `${hook}. ${moai}`,
    }),
    brain_expansion: () => ({
      text0: shorten(`chase ${hook}`, 44),
      text1: shorten(`call it alpha`, 44),
      text2: shorten(`use ${concrete}`, 44),
      text3: shorten(`${moai} nods once`, 44),
      caption: `Final form: fewer tabs.`,
      xPost: `${angle}. ${crypto}`,
    }),
    reaction: () => ({
      text0: shorten(`${hook} happens`, 52),
      text1: shorten(`Concrete users: expected`, 52),
      text2: '',
      text3: '',
      caption: `${emotion} on main timeline.`,
      xPost: `${concrete} > ${crypto}. ${moai}`,
    }),
    cause_and_effect: () => ({
      text0: shorten(`one tweet says ${hook}`, 48),
      text1: shorten(`${concrete} gets bookmarked`, 48),
      text2: '',
      text3: '',
      caption: `Small cause, loud effect.`,
      xPost: `${angle}. ${emotion}`,
    }),
    status_comparison: () => ({
      text0: shorten(`virgin: ${hook}`, 48),
      text1: shorten(`chad: ${concrete}`, 48),
      text2: '',
      text3: '',
      caption: `${crypto} vs standards.`,
      xPost: `${moai} approves the boring side.`,
    }),
    mutual_accusation: () => ({
      text0: 'CT',
      text1: shorten(`my ${hook}`, 44),
      text2: shorten(`${concrete}`, 44),
      text3: '',
      caption: `Everyone pointing, nobody reading docs.`,
      xPost: `${angle}. ${emotion}`,
    }),
    npc_dialogue: () => ({
      text0: shorten(`${hook}?`, 52),
      text1: shorten(`${concrete}: define risk`, 52),
      text2: '',
      text3: '',
      caption: `NPC loop broken by one follow-up.`,
      xPost: `${crypto}. ${moai}`,
    }),
    absurd_chart: () => ({
      text0: shorten(`green: genius`, 40),
      text1: shorten(`red: macro`, 40),
      text2: shorten(`flat: spiritual`, 40),
      text3: shorten(`${concrete}: adult`, 40),
      caption: `${emotion} as chart analysis.`,
      xPost: `${hook}. ${angle}`,
    }),
    friend_visit: () => ({
      text0: shorten(`bro saw ${concrete}`, 52),
      text1: shorten(`returned asking what ${hook} means`, 52),
      text2: '',
      text3: '',
      caption: `One visit, new standards.`,
      xPost: `${crypto}. ${moai}`,
    }),
  };

  return builders[template.promptStyle]?.() ?? {
    text0: shorten(crypto, 52),
    text1: shorten(concrete, 52),
    text2: shorten(moai, 40),
    text3: '',
    caption: `${angle}: ${hook}`,
    xPost: `${emotion}. Concrete stays CT-native.`,
  };
}
