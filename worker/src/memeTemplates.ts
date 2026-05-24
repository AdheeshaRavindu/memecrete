export type PromptStyle =
  | 'reject_vs_accept'
  | 'controversial_opinion'
  | 'decision_conflict'
  | 'trade_offer'
  | 'temptation'
  | 'four_panel_story'
  | 'false_equivalence'
  | 'market_disaster_coping'
  | 'brain_expansion'
  | 'reaction'
  | 'cause_and_effect'
  | 'status_comparison'
  | 'mutual_accusation'
  | 'npc_dialogue'
  | 'absurd_chart'
  | 'friend_visit';

export interface MemeTemplate {
  id: string;
  name: string;
  boxCount: number;
  promptStyle: PromptStyle;
  aliases: string[];
}

export interface ImgflipTemplate {
  id: string;
  name: string;
  box_count?: number;
}

export const CURATED_TEMPLATES: MemeTemplate[] = [
  {
    id: '181913649',
    name: 'Drake Hotline Bling',
    boxCount: 2,
    promptStyle: 'reject_vs_accept',
    aliases: ['Drake Hotline Bling', 'Drakeposting'],
  },
  {
    id: '129242436',
    name: 'Change My Mind',
    boxCount: 2,
    promptStyle: 'controversial_opinion',
    aliases: ['Change My Mind', 'Steven Crowder Change My Mind'],
  },
  {
    id: '87743020',
    name: 'Two Buttons',
    boxCount: 2,
    promptStyle: 'decision_conflict',
    aliases: ['Two Buttons', 'Left Exit 12 Off Ramp'],
  },
  {
    id: '309868304',
    name: 'Trade Offer',
    boxCount: 2,
    promptStyle: 'trade_offer',
    aliases: ['Trade Offer'],
  },
  {
    id: '112126428',
    name: 'Distracted Boyfriend',
    boxCount: 3,
    promptStyle: 'temptation',
    aliases: ['Distracted Boyfriend'],
  },
  {
    id: '131940431',
    name: 'Gru Presentation',
    boxCount: 4,
    promptStyle: 'four_panel_story',
    aliases: ["Gru's Plan", 'Gru Presentation'],
  },
  {
    id: '180190441',
    name: 'Corporate Wants You To Find Difference',
    boxCount: 2,
    promptStyle: 'false_equivalence',
    aliases: ["They're The Same Picture", 'Corporate Needs You To Find The Differences'],
  },
  {
    id: '55311130',
    name: 'This Is Fine',
    boxCount: 2,
    promptStyle: 'market_disaster_coping',
    aliases: ['This Is Fine'],
  },
  {
    id: '93895088',
    name: 'Expanding Brain',
    boxCount: 4,
    promptStyle: 'brain_expansion',
    aliases: ['Expanding Brain'],
  },
  {
    id: '155067746',
    name: 'Surprised Pikachu',
    boxCount: 2,
    promptStyle: 'reaction',
    aliases: ['Surprised Pikachu'],
  },
  {
    id: '217743513',
    name: 'Domino Effect',
    boxCount: 2,
    promptStyle: 'cause_and_effect',
    aliases: ['Domino Effect'],
  },
  {
    id: '102156234',
    name: 'Galaxy Brain',
    boxCount: 4,
    promptStyle: 'brain_expansion',
    aliases: ['Galaxy Brain'],
  },
  {
    id: '171305372',
    name: 'Virgin vs Chad',
    boxCount: 2,
    promptStyle: 'status_comparison',
    aliases: ['Virgin vs Chad', 'Virgin Chad'],
  },
  {
    id: '110133729',
    name: 'Spider-Man Pointing',
    boxCount: 3,
    promptStyle: 'mutual_accusation',
    aliases: ['Spider-Man Pointing', 'Spiderman Pointing At Spiderman'],
  },
  {
    id: '161865971',
    name: 'NPC Meme',
    boxCount: 2,
    promptStyle: 'npc_dialogue',
    aliases: ['NPC Meme', 'NPC Wojak'],
  },
  {
    id: '552253567',
    name: 'Family Guy Color Chart',
    boxCount: 4,
    promptStyle: 'absurd_chart',
    aliases: ['Family Guy Color Chart', 'Family Guy Skin Color Chart'],
  },
  {
    id: '427308417',
    name: 'Bro Visited Friend',
    boxCount: 2,
    promptStyle: 'friend_visit',
    aliases: ['Bro Visited Friend', 'Bro Visited His Friend'],
  },
];

export function normalizeTemplateName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function mergeImgflipTemplates(imgflipTemplates: ImgflipTemplate[]) {
  const byName = new Map(imgflipTemplates.map((template) => [normalizeTemplateName(template.name), template]));

  return CURATED_TEMPLATES.map((template) => {
    const remote = template.aliases
      .map((alias) => byName.get(normalizeTemplateName(alias)))
      .find((candidate): candidate is ImgflipTemplate => Boolean(candidate));

    return {
      ...template,
      id: remote?.id ?? template.id,
      boxCount: Math.max(1, Math.min(remote?.box_count ?? template.boxCount, 4)),
    };
  });
}
