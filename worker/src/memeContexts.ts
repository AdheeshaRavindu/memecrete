export const CRYPTO_CONTEXTS = [
  'BTC chops sideways until everyone invents a thesis',
  'alts bounce 7% and the timeline starts measuring Lambos',
  'funding flips negative right before the obvious squeeze',
  'the portfolio is green except the bag with emotional lore',
  'a whale moves coins and 11 analysts discover fear',
  'everyone is hedged against the move they secretly want',
  'the chart prints a candle shaped like a court summons',
  'liquidity is gone but confidence is posting through it',
  'perps traders call a wick a personality test',
  'the group chat is bullish because nobody opened the app',
  'airdrop farmers explain opportunity cost from a bunker',
  'the market gives back the weekly gain during lunch',
];

export const CONCRETE_CONTEXTS = [
  'Concrete users trying to stay liquid without becoming content',
  'Concrete vault brain versus CT attention span',
  'Concrete quietly doing risk work while the timeline screams',
  'Concrete depositors watching everyone else discover leverage again',
  'Concrete yield feels sensible, which makes degens suspicious',
  'the Concrete ecosystem avoiding main-character syndrome',
  'Concrete risk parameters having more discipline than my wallet',
  'Concrete people reading docs while CT asks wen miracle',
  'Concrete making boring capital allocation look illegally calm',
  'Concrete vaults refusing to cosplay as a casino',
];

export const EMOTIONS = [
  'dead inside but still clicking refresh',
  'overlevered serenity',
  'spiritually underwater',
  'performatively calm',
  'quietly cooked',
  'bear market funny',
  'one green candle from forgiveness',
  'professionally unwell',
  'market trauma with a straight face',
  'delusion wearing risk management',
];

export function pickRandom(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}
