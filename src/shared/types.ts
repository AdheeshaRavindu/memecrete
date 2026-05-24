export interface SpinMemeResponse {
  memeUrl: string;
  caption: string;
  xPost: string;
  template: string;
}

export type HumorStyleId =
  | 'absurd'
  | 'deadpan'
  | 'irony'
  | 'self_roast'
  | 'pain_humor'
  | 'sigma'
  | 'ct_sarcasm'
  | 'anti_degen'
  | 'overconfidence'
  | 'dark_market';

export type MemeLayoutId =
  | 'comparison'
  | 'choice'
  | 'stacked'
  | 'presentation'
  | 'chart'
  | 'reveal'
  | 'pointing'
  | 'drift'
  | 'panel_story'
  | 'reaction';

export type TextAlign = 'left' | 'center' | 'right';

export interface TemplateTextRegion {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  align: TextAlign;
  maxLines: number;
  fontScale: number;
  emphasis?: 'primary' | 'secondary' | 'accent';
}

export interface TemplateDefinition {
  id: string;
  name: string;
  format: string;
  family: string;
  layout: MemeLayoutId;
  imageKey: string;
  jokeStructure: string;
  compatibleHumorStyles: HumorStyleId[];
  compatibilityWeights: Partial<Record<HumorStyleId, number>>;
  captionTone: string;
  regionTemplate: string;
  trendBias: number;
}

export interface ExpandedTemplate extends TemplateDefinition {
  variantKey: string;
  textRegions: TemplateTextRegion[];
  palette: {
    surface: string;
    edge: string;
    accent: string;
    glow: string;
    text: string;
  };
}

export interface DatasetItem {
  id: string;
  phrase: string;
  tags: string[];
  tone: string;
  weight: number;
}

export interface ExpandedPhrase extends DatasetItem {
  variantKey: string;
  label: string;
}

export interface MemeLibrary {
  templates: ExpandedTemplate[];
  crypto: ExpandedPhrase[];
  concrete: ExpandedPhrase[];
  emotions: ExpandedPhrase[];
  moai: DatasetItem[];
  humorStyles: {
    id: HumorStyleId;
    label: string;
    weight: number;
  }[];
  twists: DatasetItem[];
  xOpeners: string[];
  ctaFragments: string[];
}

export interface RecentGeneration {
  id: string;
  templateId: string;
  family: string;
  fingerprint: string;
  tokenSet: string[];
  createdAt: string;
  score: number;
}

export interface MemeRenderSpec {
  width: number;
  height: number;
  template: ExpandedTemplate;
  title: string;
  caption: string;
  xPost: string;
  blocks: RenderBlock[];
  accents: string[];
}

export interface RenderBlock {
  key: string;
  kind: 'label' | 'panel' | 'caption' | 'accent' | 'stat';
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  align?: TextAlign;
  fontScale?: number;
  color?: string;
  radius?: number;
}

export interface MemeResult {
  id: string;
  createdAt: string;
  score: number;
  noveltyScore: number;
  template: ExpandedTemplate;
  caption: string;
  xPost: string;
  fingerprint: string;
  render: MemeRenderSpec;
  notes: {
    crypto: string;
    concrete: string;
    emotion: string;
    moai: string;
    humorStyle: HumorStyleId;
    twist: string;
  };
}

export interface TrendingTemplate {
  templateId: string;
  templateName: string;
  family: string;
  generationCount: number;
  avgScore: string;
}
