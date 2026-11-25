/**
 * Competition rules shared by the tools.
 * Source: IWF TCRR 2026 (reference/IWF-TCRR-2026.pdf).
 */

/** 20 kg Rule (6.6.5): the first attempts must add up to at least the Entry Total minus this. */
export const TWENTY_KG_RULE = 20;

/** The 20kg Rule box on the card: the lowest allowed sum of the two starting weights. */
export const twentyKgRuleLimit = (entryTotal: number): number => entryTotal - TWENTY_KG_RULE;

/** True when the starting weights in the snatch and the clean & jerk respect the 20 kg Rule. */
export const meetsTwentyKgRule = (
  entryTotal: number,
  snatchStart: number,
  cleanAndJerkStart: number,
): boolean => snatchStart + cleanAndJerkStart >= twentyKgRuleLimit(entryTotal);
