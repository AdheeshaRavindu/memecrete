import templates from './data/templates.json';
import crypto from './data/crypto.json';
import concrete from './data/concrete.json';
import emotions from './data/emotions.json';
import moai from './data/moai.json';
import humor from './data/humor.json';
import type {
  DatasetItem,
  ExpandedPhrase,
  ExpandedTemplate,
  HumorStyleId,
  MemeLibrary,
  MemeLayoutId,
  TemplateDefinition,
  TemplateTextRegion,
} from './types';

const templateLayouts: Record<MemeLayoutId, TemplateTextRegion[]> = {
  comparison: [
    { key: 'left', x: 0.08, y: 0.08, w: 0.38, h: 0.2, align: 'center', maxLines: 3, fontScale: 0.88, emphasis: 'primary' },
    { key: 'right', x: 0.54, y: 0.08, w: 0.38, h: 0.2, align: 'center', maxLines: 3, fontScale: 0.88, emphasis: 'accent' },
    { key: 'footer', x: 0.12, y: 0.76, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.74, emphasis: 'secondary' },
  ],
  choice: [
    { key: 'choice-a', x: 0.12, y: 0.22, w: 0.3, h: 0.2, align: 'center', maxLines: 3, fontScale: 0.84, emphasis: 'primary' },
    { key: 'choice-b', x: 0.58, y: 0.22, w: 0.3, h: 0.2, align: 'center', maxLines: 3, fontScale: 0.84, emphasis: 'accent' },
    { key: 'panic-label', x: 0.18, y: 0.72, w: 0.64, h: 0.1, align: 'center', maxLines: 2, fontScale: 0.76, emphasis: 'secondary' },
  ],
  stacked: [
    { key: 'top', x: 0.12, y: 0.08, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.74, emphasis: 'secondary' },
    { key: 'mid-top', x: 0.12, y: 0.26, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.76, emphasis: 'primary' },
    { key: 'mid-bottom', x: 0.12, y: 0.46, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.8, emphasis: 'accent' },
    { key: 'bottom', x: 0.12, y: 0.68, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.84, emphasis: 'primary' },
  ],
  presentation: [
    { key: 'title', x: 0.08, y: 0.1, w: 0.84, h: 0.13, align: 'center', maxLines: 2, fontScale: 0.9, emphasis: 'primary' },
    { key: 'support', x: 0.12, y: 0.34, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.74, emphasis: 'secondary' },
    { key: 'reveal', x: 0.12, y: 0.58, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.86, emphasis: 'accent' },
  ],
  chart: [
    { key: 'chart-title', x: 0.12, y: 0.08, w: 0.76, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.84, emphasis: 'primary' },
    { key: 'chart-mid', x: 0.14, y: 0.42, w: 0.72, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.8, emphasis: 'accent' },
    { key: 'chart-bottom', x: 0.16, y: 0.72, w: 0.68, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.7, emphasis: 'secondary' },
  ],
  reveal: [
    { key: 'setup', x: 0.12, y: 0.1, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.76, emphasis: 'primary' },
    { key: 'mask', x: 0.14, y: 0.44, w: 0.72, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.82, emphasis: 'accent' },
    { key: 'punch', x: 0.16, y: 0.72, w: 0.68, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.7, emphasis: 'secondary' },
  ],
  pointing: [
    { key: 'subject-a', x: 0.08, y: 0.12, w: 0.34, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.76, emphasis: 'primary' },
    { key: 'subject-b', x: 0.58, y: 0.12, w: 0.34, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.76, emphasis: 'accent' },
    { key: 'point', x: 0.14, y: 0.72, w: 0.72, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.82, emphasis: 'secondary' },
  ],
  drift: [
    { key: 'drift-title', x: 0.14, y: 0.1, w: 0.72, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.82, emphasis: 'primary' },
    { key: 'drift-band', x: 0.12, y: 0.46, w: 0.76, h: 0.14, align: 'center', maxLines: 2, fontScale: 0.78, emphasis: 'accent' },
    { key: 'drift-punch', x: 0.16, y: 0.74, w: 0.68, h: 0.1, align: 'center', maxLines: 2, fontScale: 0.68, emphasis: 'secondary' },
  ],
  panel_story: [
    { key: 'scene-1', x: 0.12, y: 0.08, w: 0.76, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.74, emphasis: 'primary' },
    { key: 'scene-2', x: 0.12, y: 0.28, w: 0.76, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.76, emphasis: 'secondary' },
    { key: 'scene-3', x: 0.12, y: 0.5, w: 0.76, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.8, emphasis: 'accent' },
    { key: 'scene-4', x: 0.12, y: 0.72, w: 0.76, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.84, emphasis: 'primary' },
  ],
  reaction: [
    { key: 'header', x: 0.12, y: 0.08, w: 0.76, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.78, emphasis: 'secondary' },
    { key: 'face', x: 0.18, y: 0.36, w: 0.64, h: 0.18, align: 'center', maxLines: 3, fontScale: 0.94, emphasis: 'primary' },
    { key: 'footer', x: 0.16, y: 0.74, w: 0.68, h: 0.12, align: 'center', maxLines: 2, fontScale: 0.74, emphasis: 'accent' },
  ],
};

const palette = [
  ['#102018', '#22382d', '#20c997', '#74f0d7', '#f3efe8'],
  ['#13131b', '#2f2d42', '#8cf0da', '#f6a742', '#f3efe8'],
  ['#16121a', '#33253b', '#ffd68f', '#bb86fc', '#f3efe8'],
  ['#10161f', '#25364a', '#8fb7ff', '#20c997', '#f3efe8'],
  ['#17120f', '#3a2b20', '#f6a742', '#ffd68f', '#f3efe8'],
];

function expandTemplate(definition: TemplateDefinition): ExpandedTemplate[] {
  return palette.map((colors, index) => ({
    ...definition,
    variantKey: `${definition.id}-v${index + 1}`,
    textRegions: templateLayouts[definition.layout].map((region, regionIndex) => ({
      ...region,
      x: Math.max(0.04, Math.min(0.86, region.x + index * 0.004 - regionIndex * 0.002)),
      y: Math.max(0.04, Math.min(0.86, region.y + index * 0.003)),
    })),
    palette: {
      surface: colors[0],
      edge: colors[1],
      accent: colors[2],
      glow: colors[3],
      text: colors[4],
    },
  }));
}

function expandPhrasePool(items: DatasetItem[], prefix: string, modifiers: string[]): ExpandedPhrase[] {
  return items
    .flatMap((item) =>
      modifiers.map((modifier, modifierIndex) => ({
        ...item,
        variantKey: `${prefix}-${item.id}-${modifierIndex + 1}`,
        label: item.phrase,
        phrase: item.phrase,
      })),
    )
    .slice(0, items.length * modifiers.length);
}

const templateDefinitions = templates as TemplateDefinition[];
const cryptoBase = crypto as DatasetItem[];
const concreteBase = concrete as DatasetItem[];
const emotionBase = emotions as DatasetItem[];
const moaiBase = moai as DatasetItem[];
const humorBase = humor as { id: HumorStyleId; label: string; weight: number }[];

const cryptoModifiers = [
  'after a chain wobble around',
  'while CT is yelling about',
  'mid-thesis on',
  'right after surviving',
  'while pretending not to care about',
  'during another round of',
];

const concreteModifiers = [
  'because Concrete makes',
  'while the vault handles',
  'with zero manual',
  'as the system quietly solves',
  'instead of babysitting',
  'without ever thinking about',
];

const emotionModifiers = [
  'feels deeply',
  'looks aggressively',
  'goes full',
  'brings suspiciously',
  'surfaces extremely',
];

export function loadMemeLibrary(): MemeLibrary {
  const templatesExpanded = templateDefinitions.flatMap((definition) => expandTemplate(definition));
  const cryptoExpanded = expandPhrasePool(cryptoBase, 'crypto', cryptoModifiers);
  const concreteExpanded = expandPhrasePool(concreteBase, 'concrete', concreteModifiers);
  const emotionExpanded = expandPhrasePool(emotionBase, 'emotion', emotionModifiers);

  return {
    templates: templatesExpanded,
    crypto: cryptoExpanded,
    concrete: concreteExpanded,
    emotions: emotionExpanded,
    moai: moaiBase,
    humorStyles: humorBase,
    twists: [
      { id: 'grass', phrase: 'touching grass', tags: ['offline', 'reset'], tone: 'reset', weight: 1 },
      { id: 'cope', phrase: 'cope harder', tags: ['cope', 'pain'], tone: 'toxic', weight: 1 },
      { id: 'vault', phrase: 'the vault did it for him', tags: ['vault', 'passive'], tone: 'calm', weight: 1 },
      { id: 'stone', phrase: 'the stone stayed undefeated', tags: ['stone', 'win'], tone: 'serene', weight: 1 },
      { id: 'ct', phrase: 'CT noticed and kept scrolling', tags: ['ct', 'ignored'], tone: 'dry', weight: 1 },
      { id: 'yield', phrase: 'yield moved in silence', tags: ['yield', 'silence'], tone: 'quiet', weight: 1 },
      { id: 'barrier', phrase: 'the real barrier was manual effort', tags: ['manual', 'friction'], tone: 'technical', weight: 1 },
      { id: 'loop', phrase: 'the loop felt personal', tags: ['loop', 'emotional'], tone: 'dramatic', weight: 1 },
      { id: 'meme', phrase: 'even the meme became a strategy', tags: ['meme', 'strategy'], tone: 'ironic', weight: 1 },
      { id: 'sleep', phrase: 'sleep remained the highest APY', tags: ['sleep', 'yield'], tone: 'deadpan', weight: 1 },
    ],
    xOpeners: [
      'Some people actively manage 17 farms.',
      'Others let the vault do the annoying part.',
      'Concrete is for the people who got tired of pretending manual farming was fun.',
      'CT keeps chasing noise while the stone keeps compounding.',
      'A calm portfolio is sometimes the most violent flex.',
    ],
    ctaFragments: [
      'Press button. Get absurdly unique Concrete memes.',
      'Spin once. Repeat if your timeline can handle it.',
      'Less effort. More yield brain.',
      'Stone does the work. You get the joke.',
    ],
  };
}