/**
 * Weigh-in checks. Source: IWF TCRR 2026, Regulation to 6.4 (Weigh-in), points 10, 14 and 15.
 *
 * Weights are whole grams so the limits compare exactly.
 */
import { categoriesFor, type Category, type Gender } from "./categories";
import { pick, randInt } from "./random";

/** Deducted from the scale reading for the weight of the costume (point 10). */
export const COSTUME_G = 250;

export type Verdict = "within" | "heavy" | "light";

export interface CategoryLimits {
  /** The bodyweight must be above this. Null for the lightest category. */
  aboveG: number | null;
  /** The bodyweight must be at most this. Null for the open "+" category. */
  maxG: number | null;
}

export const toGrams = (kg: number) => Math.round(kg * 1000);
export const formatKg = (g: number) => (g / 1000).toFixed(2);

/** The limits of the category at `index` in the list: above the previous limit, up to its own. */
export function limitsOf(list: Category[], index: number): CategoryLimits {
  const max = list[index].maxKg;
  const below = index > 0 ? list[index - 1].maxKg : null;
  return { aboveG: below === null ? null : toGrams(below), maxG: max === null ? null : toGrams(max) };
}

/** The bodyweight after the costume deduction. */
export const bodyweightG = (scaleG: number) => scaleG - COSTUME_G;

/** Whether a scale reading makes weight for the category, after the costume deduction. */
export function verdictFor(limits: CategoryLimits, scaleG: number): Verdict {
  const bw = bodyweightG(scaleG);
  if (limits.maxG !== null && bw > limits.maxG) return "heavy";
  if (limits.aboveG !== null && bw <= limits.aboveG) return "light";
  return "within";
}

export interface WeighInCase {
  gender: Gender;
  category: Category;
  limits: CategoryLimits;
  /** What the scale shows, in grams, to 10 g like a scale that shows two decimals. */
  scaleG: number;
}

/** The kinds of case to practise. "costume" makes weight only because of the 250 g. */
type Kind = "within" | "costume" | "atLimit" | "heavy" | "light" | "atLower";

/** A random multiple of 10 g in [min, max]. */
const tens = (min: number, max: number) => randInt(Math.ceil(min / 10), Math.floor(max / 10)) * 10;

/**
 * A random athlete at the scale. The readings sit close to the limits, where the decision
 * is hard, and include readings that only make weight because of the costume deduction.
 */
export function generateCase(gender: Gender = pick(["M", "F"] as const)): WeighInCase {
  const list = categoriesFor(gender);
  const index = randInt(0, list.length - 1);
  const limits = limitsOf(list, index);
  const { aboveG, maxG } = limits;

  const kinds: Kind[] = ["within"];
  if (maxG !== null) kinds.push("costume", "atLimit", "heavy", "heavy");
  if (aboveG !== null) kinds.push("light", "light", "atLower");

  let bw: number;
  switch (pick(kinds)) {
    case "within": {
      // Within 1.5 kg of a limit, and above the lower one.
      const lo = aboveG === null ? maxG! - 4000 : aboveG + 10;
      const hi = maxG === null ? aboveG! + 20000 : maxG;
      const nearTop = maxG !== null && (aboveG === null || randInt(0, 1) === 0);
      bw = nearTop ? tens(Math.max(lo, hi - 1500), hi) : tens(lo, Math.min(hi, lo + 1490));
      break;
    }
    case "costume": // The scale is over the limit, but by no more than the costume.
      return { gender, category: list[index], limits, scaleG: tens(maxG! + 10, maxG! + COSTUME_G) };
    case "atLimit":
      bw = maxG!;
      break;
    case "heavy":
      bw = tens(maxG! + 10, maxG! + 1500);
      break;
    case "light":
      bw = tens(aboveG! - 1500, aboveG! - 10);
      break;
    case "atLower": // Exactly the limit of the category below, so it belongs there.
      bw = aboveG!;
      break;
  }
  return { gender, category: list[index], limits, scaleG: bw + COSTUME_G };
}

/** Reads a typed weight such as "84.96" or "84,96" as grams. Null when it is not a number. */
export function parseKg(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(t)) return null;
  return toGrams(Number(t));
}
