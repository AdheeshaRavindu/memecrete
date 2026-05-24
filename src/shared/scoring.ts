import type { ExpandedTemplate, RecentGeneration } from './types';

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function jaccard(left: Set<string>, right: Set<string>) {
  const intersection = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size || 1;
  return intersection / union;
}

export function fingerprint(parts: string[]) {
  const normalized = parts.map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, '-')).join('|');
  let hash = 0;
  for (const char of normalized) {
    hash = (hash * 33 + char.charCodeAt(0)) % 2147483647;
  }
  return `sp-${hash.toString(36)}`;
}

export function scoreCandidate(args: {
  template: ExpandedTemplate;
  humorStyle: string;
  crypto: string;
  concrete: string;
  emotion: string;
  moai: string;
  twist: string;
  caption: string;
  recent: RecentGeneration[];
}) {
  const baseCompatibility = args.template.compatibilityWeights[args.humorStyle as keyof typeof args.template.compatibilityWeights] ?? 0.78;
  const styleCompatibility = args.template.compatibleHumorStyles.includes(args.humorStyle as never) ? 1 : 0.72;
  const tokenSet = new Set(tokenize([args.crypto, args.concrete, args.emotion, args.moai, args.twist, args.caption].join(' ')));

  let novelty = 0.75;
  let repeatPenalty = 0;
  let familyPenalty = 0;
  let lexicalPenalty = 0;

  for (const recentGeneration of args.recent.slice(0, 10)) {
    if (recentGeneration.templateId === args.template.id) {
      repeatPenalty += 14;
    }

    if (recentGeneration.family === args.template.family) {
      familyPenalty += 4;
    }

    const overlap = jaccard(tokenSet, new Set(recentGeneration.tokenSet));
    novelty = Math.min(novelty, 1 - overlap);
    lexicalPenalty += overlap * 18;
  }

  const contextFit = 8 + args.template.trendBias * 6 + (args.template.regionTemplate.length % 7) * 0.6;
  const humorFit = baseCompatibility * 21 + styleCompatibility * 11;
  const twistFit = 10 + (args.twist.length % 6) * 1.1;
  const varietyBonus = 12 + (args.template.variantKey.endsWith('v5') ? 2 : 0);
  const score = contextFit + humorFit + twistFit + varietyBonus - repeatPenalty - familyPenalty - lexicalPenalty + novelty * 18;

  return {
    score: clampScore(score),
    noveltyScore: clampScore(novelty * 100),
    tokenSet: [...tokenSet],
  };
}

export function isDuplicateFingerprint(candidateFingerprint: string, recent: RecentGeneration[]) {
  return recent.some((generation) => generation.fingerprint === candidateFingerprint);
}

export function buildRecentSummary(recent: RecentGeneration[]) {
  return recent.slice(0, 8).map((generation) => generation.tokenSet.join(' '));
}