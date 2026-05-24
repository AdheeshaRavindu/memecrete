import { loadMemeLibrary } from './library';
import { buildRecentSummary, fingerprint, isDuplicateFingerprint, scoreCandidate } from './scoring';
import type { ExpandedTemplate, MemeLibrary, MemeRenderSpec, MemeResult, RecentGeneration, RenderBlock } from './types';

type MemeStyleKey = 'concrete' | 'deadpan' | 'absurd' | 'sigma' | 'reaction' | 'default';

interface MemeStyleProfile {
  key: MemeStyleKey;
  label: string;
  preferredFamilies: string[];
  preferredHumorStyles: string[];
  patterns: string[];
}

function seededRandom(seed: string) {
  let value = 0;
  for (const char of seed) {
    value = (value * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return () => {
    value = (value * 48271) % 2147483647;
    return (value & 2147483647) / 2147483647;
  };
}

function pickWeighted<T>(items: T[], random: () => number, getWeight: (item: T) => number = () => 1): T {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= getWeight(item);
    if (cursor <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

function normalizeStyleHint(styleHint?: string): string {
  return styleHint?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ') ?? '';
}

function resolveStyleProfile(styleHint?: string): MemeStyleProfile {
  const normalized = normalizeStyleHint(styleHint);

  if (normalized.includes('concrete') || normalized.includes('bauhaus') || normalized.includes('stone')) {
    return {
      key: 'concrete',
      label: 'Concrete',
      preferredFamilies: ['comparison', 'choice', 'hero', 'presentation'],
      preferredHumorStyles: ['deadpan', 'ct_sarcasm', 'anti_degen', 'sigma'],
      patterns: [
        `When ${'{crypto}'} gets loud,\n${'{concrete}'} stays poured.`,
        `${'{moai}'} chose ${'{concrete}'}\nover ${'{crypto}'}.`,
        `No babysitting.\nJust ${'{concrete}'}.`,
        `${'{concrete}'} > ${'{crypto}'}`,
      ],
    };
  }

  if (normalized.includes('deadpan') || normalized.includes('dry') || normalized.includes('minimal')) {
    return {
      key: 'deadpan',
      label: 'Deadpan',
      preferredFamilies: ['comparison', 'reaction', 'offer', 'chart'],
      preferredHumorStyles: ['deadpan', 'ct_sarcasm', 'irony'],
      patterns: [
        `${'{crypto}'} happened.\n${'{concrete}'} responded.`,
        `I prefer\n${'{concrete}'}.`,
        `Problem: ${'{crypto}'}.\nSolution: ${'{concrete}'}.`,
        `That was it.\nThat was the joke.`,
      ],
    };
  }

  if (normalized.includes('sigma') || normalized.includes('chad') || normalized.includes('elite')) {
    return {
      key: 'sigma',
      label: 'Sigma',
      preferredFamilies: ['hero', 'presentation', 'comparison'],
      preferredHumorStyles: ['sigma', 'overconfidence', 'anti_degen'],
      patterns: [
        `${'{moai}'} does not chase.\n${'{concrete}'} compounds.`,
        `Silent wins.\nLoud loses.`,
        `${'{concrete}'} first.\nEverything else later.`,
        `The room got louder.\n${'{moai}'} got calmer.`,
      ],
    };
  }

  if (normalized.includes('reaction') || normalized.includes('pain') || normalized.includes('wojak')) {
    return {
      key: 'reaction',
      label: 'Reaction',
      preferredFamilies: ['reaction', 'story', 'chain'],
      preferredHumorStyles: ['pain_humor', 'self_roast', 'dark_market'],
      patterns: [
        `Me: ${'{crypto}'}?\nAlso me: ${'{concrete}'}.`,
        `This should have been simple.\nIt was not.`,
        `The chart broke first.\nI broke after.`,
        `When the room tilted,\n${'{moai}'} stayed still.`,
      ],
    };
  }

  if (normalized.includes('absurd') || normalized.includes('chaos') || normalized.includes('random')) {
    return {
      key: 'absurd',
      label: 'Absurd',
      preferredFamilies: ['escalation', 'reaction', 'chart', 'story'],
      preferredHumorStyles: ['absurd', 'dark_market', 'pain_humor'],
      patterns: [
        `I asked for yield.\n${'{concrete}'} brought a wall.`,
        `Somehow this worked.\nDo not ask how.`,
        `${'{moai}'} stared.\nThe market apologized.`,
        `A normal day ended.\n${'{concrete}'} began.`,
      ],
    };
  }

  return {
    key: 'default',
    label: 'Concrete',
    preferredFamilies: ['comparison', 'choice', 'hero', 'presentation'],
    preferredHumorStyles: ['deadpan', 'ct_sarcasm', 'anti_degen', 'irony'],
    patterns: [
      `When ${'{crypto}'} gets loud,\n${'{concrete}'} gets poured.`,
      `${'{moai}'} chose ${'{concrete}'}\nover ${'{crypto}'}.`,
      `No babysitting.\nJust ${'{concrete}'}.`,
      `The stone stayed calm.\nThe timeline did not.`,
    ],
  };
}

function applyStylePattern(pattern: string, parts: { crypto: string; concrete: string; emotion: string; moai: string; twist: string }) {
  return pattern
    .replaceAll('{crypto}', parts.crypto)
    .replaceAll('{concrete}', parts.concrete)
    .replaceAll('{emotion}', parts.emotion)
    .replaceAll('{moai}', parts.moai)
    .replaceAll('{twist}', parts.twist);
}

function weightedPhrase(item: { tone: string; weight?: number }, profile: MemeStyleProfile, group: 'crypto' | 'concrete' | 'emotion' | 'moai' | 'twist') {
  let bonus = 0;

  if (profile.key === 'concrete') {
    if (group === 'concrete') {
      if (['calm', 'easy', 'technical', 'professional', 'quiet', 'serene', 'practical', 'trusted', 'simple', 'steady', 'level', 'peaceful', 'reserved'].includes(item.tone)) {
        bonus += 1.1;
      }

      if (['annoyed', 'ached', 'tired', 'grim', 'chaotic', 'sore', 'busy', 'melodramatic'].includes(item.tone)) {
        bonus -= 0.35;
      }
    }

    if (group === 'crypto' && ['grim', 'panic', 'wary', 'tired', 'chaotic', 'fearful', 'uneasy', 'annoyed', 'rushed', 'stormy', 'sneaky'].includes(item.tone)) {
      bonus += 0.75;
    }

    if (group === 'moai' && ['calm', 'timeless', 'cool', 'reserved'].includes(item.tone)) {
      bonus += 0.75;
    }
  }

  return Math.max(0.2, (item.weight ?? 1) + bonus);
}

function createCaption(parts: { crypto: string; concrete: string; emotion: string; moai: string; twist: string }, styleHint?: string) {
  const style = resolveStyleProfile(styleHint);
  const patterns = style.patterns.length ? style.patterns : resolveStyleProfile().patterns;
  const pattern = patterns[(parts.twist.length + parts.concrete.length) % patterns.length];
  return applyStylePattern(pattern, parts);
}

function createXPost(openers: string[], caption: string, crypto: string, concrete: string, twist: string) {
  const opener = openers[caption.length % openers.length];
  return `${opener}\n\n${caption}\n\n${concrete} > ${crypto} ${twist}`;
}

function buildRenderSpec(template: ExpandedTemplate, title: string, caption: string, xPost: string): MemeRenderSpec {
  const blocks: RenderBlock[] = template.textRegions.map((region, index) => ({
    key: region.key,
    kind: index === 0 ? 'caption' : 'panel',
    x: region.x,
    y: region.y,
    w: region.w,
    h: region.h,
    text: index === 0 ? title : index === template.textRegions.length - 1 ? caption : `${template.name}`,
    align: region.align,
    fontScale: region.fontScale,
    color: index === template.textRegions.length - 1 ? template.palette.accent : template.palette.text,
    radius: 28,
  }));

  return {
    width: 1024,
    height: 1024,
    template,
    title,
    caption,
    xPost,
    blocks,
    accents: [template.palette.accent, template.palette.glow, template.palette.surface],
  };
}

function createCandidate(library: MemeLibrary, random: () => number, recent: RecentGeneration[], styleHint?: string) {
  const style = resolveStyleProfile(styleHint);
  const template = pickWeighted(library.templates, random, (item) => {
    const familyBonus = style.preferredFamilies.includes(item.family) ? 1.75 : 0;
    return 1 + item.trendBias + familyBonus;
  });
  const crypto = pickWeighted(library.crypto, random, (item) => weightedPhrase(item, style, 'crypto'));
  const concrete = pickWeighted(library.concrete, random, (item) => weightedPhrase(item, style, 'concrete'));
  const emotion = pickWeighted(library.emotions, random, (item) => weightedPhrase(item, style, 'emotion'));
  const moai = pickWeighted(library.moai, random, (item) => weightedPhrase(item, style, 'moai'));
  const humor = pickWeighted(library.humorStyles, random, (item) => {
    const styleBonus = style.preferredHumorStyles.includes(item.id) ? 1.5 : 0;
    return (item.weight ?? 1) + styleBonus;
  });
  const twist = pickWeighted(library.twists, random, (item) => weightedPhrase(item, style, 'twist'));

  const caption = createCaption({
    crypto: crypto.label,
    concrete: concrete.label,
    emotion: emotion.label,
    moai: moai.phrase,
    twist: twist.phrase,
  }, styleHint);

  const xPost = createXPost(library.xOpeners, caption, crypto.label, concrete.label, twist.phrase);
  const candidateFingerprint = fingerprint([template.id, crypto.id, concrete.id, emotion.id, moai.id, humor.id, twist.id, caption]);
  const score = scoreCandidate({
    template,
    humorStyle: humor.id,
    crypto: crypto.label,
    concrete: concrete.label,
    emotion: emotion.label,
    moai: moai.phrase,
    twist: twist.phrase,
    caption,
    recent,
  });

  return {
    template,
    crypto,
    concrete,
    emotion,
    moai,
    humor,
    twist,
    caption,
    xPost,
    fingerprint: candidateFingerprint,
    score: score.score,
    noveltyScore: score.noveltyScore,
    tokenSet: score.tokenSet,
  };
}

export async function generateMemeResult(input: { recent: RecentGeneration[]; seed?: string; styleHint?: string }): Promise<MemeResult> {
  const library = loadMemeLibrary();
  const random = seededRandom(input.seed ?? `${Date.now()}-${Math.random()}`);
  const fallbackRecent = input.recent ?? [];
  const candidates = Array.from({ length: 14 }, () => createCandidate(library, random, fallbackRecent, input.styleHint));
  const filtered = candidates.filter((candidate) => candidate.score >= 68 && !isDuplicateFingerprint(candidate.fingerprint, fallbackRecent));
  const chosen = (filtered.length ? filtered : candidates).sort((left, right) => right.score - left.score || right.noveltyScore - left.noveltyScore)[0];

  const id = fingerprint([chosen.template.id, chosen.fingerprint, String(Date.now())]);
  const createdAt = new Date().toISOString();
  const title = `${chosen.template.name} / ${chosen.humor.label}`;
  const render = buildRenderSpec(chosen.template, title, chosen.caption, chosen.xPost);

  return {
    id,
    createdAt,
    score: chosen.score,
    noveltyScore: chosen.noveltyScore,
    template: chosen.template,
    caption: chosen.caption,
    xPost: chosen.xPost,
    fingerprint: chosen.fingerprint,
    render,
    notes: {
      crypto: chosen.crypto.label,
      concrete: chosen.concrete.label,
      emotion: chosen.emotion.label,
      moai: chosen.moai.phrase,
      humorStyle: chosen.humor.id,
      twist: chosen.twist.phrase,
    },
  };
}

export async function getTrendingTemplates(generationRows: { templateId: string; templateName: string; family: string; score: number }[]) {
  const grouped = new Map<string, { templateId: string; templateName: string; family: string; generationCount: number; scoreTotal: number }>();

  for (const row of generationRows) {
    const existing = grouped.get(row.templateId) ?? {
      templateId: row.templateId,
      templateName: row.templateName,
      family: row.family,
      generationCount: 0,
      scoreTotal: 0,
    };
    existing.generationCount += 1;
    existing.scoreTotal += row.score;
    grouped.set(row.templateId, existing);
  }

  return [...grouped.values()]
    .sort((left, right) => right.generationCount - left.generationCount || right.scoreTotal - left.scoreTotal)
    .slice(0, 6)
    .map((item) => ({
      templateId: item.templateId,
      templateName: item.templateName,
      family: item.family,
      generationCount: item.generationCount,
      avgScore: (item.scoreTotal / item.generationCount).toFixed(1),
    }));
}

export function summarizeRecent(recent: RecentGeneration[]) {
  return buildRecentSummary(recent);
}