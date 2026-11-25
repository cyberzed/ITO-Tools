import { bodyWeightRange, type Gender } from "./categories";
import { pick, randInt } from "./random";
import { TWENTY_KG_RULE } from "./rules";

export type { Gender };

export const firstNames: Record<Gender, string[]> = {
  M: ["Julian", "Lukas", "Mikkel", "Oskar", "Emil", "Anton", "Jonas", "Marek"],
  F: ["Sofia", "Emma", "Clara", "Nina", "Freja", "Hanna", "Ida", "Lena"],
};
const lastNames = [
  "Frank", "Nielsen", "Larsen", "Berg", "Kowalski", "Novak", "Weber", "Moreau",
  "Lindgren", "Haas", "Petrov", "Bauer", "Jensen", "Rossi", "Holm", "Vogel",
];

export interface SessionAthlete {
  name: string;
  /** Needed later to pick the right weight category. */
  gender: Gender;
  /** dd.mm.yyyy */
  birthDate: string;
  coach: string;
  /** Bodyweight in kg with two decimals, within bodyWeightRange(gender). */
  bodyWeight: number;
  /** Snatch starting weight in whole kg, about SNATCH_RATIO times bodyweight. */
  snatchStart: number;
  /** Clean & jerk starting weight in whole kg, about CLEAN_AND_JERK_RATIO times bodyweight. */
  cleanAndJerkStart: number;
  /** Entry total in whole kg. Never more than 20 kg above the two starting weights added up. */
  entryTotal: number;
  /** Lot number, 1 to MAX_LOT. */
  lot: number;
  /** Short handwritten-style signature, from the athlete or the coach. Used in every field. */
  signature: string;
}

export const MAX_LOT = 30;
/** Starting weights are about this many times bodyweight, give or take START_JITTER. */
export const SNATCH_RATIO = 1.5;
export const CLEAN_AND_JERK_RATIO = 2.0;
export const START_JITTER = 0.05;
/** The entry total is the starting weights added up plus this much, so the 20 kg Rule always holds. */
export const ENTRY_TOTAL_EXTRA = { min: 5, max: TWENTY_KG_RULE };

/** Whole-kg starting weight: bodyweight times a ratio, with random jitter. */
const startingWeight = (bodyWeight: number, ratio: number): number =>
  Math.round(bodyWeight * ratio * (1 + randInt(-START_JITTER * 1000, START_JITTER * 1000) / 1000));

/** "Julian Frank" -> "Fran." */
export const signatureOf = (name: string): string => `${name.split(" ").pop()!.slice(0, 4)}.`;

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** A random day of the current year, moved back 17-30 years. */
function randomBirthDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const daysInYear = isLeap(year) ? 366 : 365;
  const day = new Date(year, 0, 1 + randInt(0, daysInYear - 1));
  const birthYear = year - randInt(17, 30);

  let date = day.getDate();
  const month = day.getMonth();
  if (month === 1 && date === 29 && !isLeap(birthYear)) date = 28;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date)}.${pad(month + 1)}.${birthYear}`;
}

function generate(): SessionAthlete {
  const gender: Gender = pick<Gender>(["M", "F"]);
  const name = `${pick(firstNames[gender])} ${pick(lastNames)}`;
  const range = bodyWeightRange(gender);
  const bodyWeight = randInt(range.min * 100, range.max * 100) / 100;
  const snatchStart = startingWeight(bodyWeight, SNATCH_RATIO);
  const cleanAndJerkStart = startingWeight(bodyWeight, CLEAN_AND_JERK_RATIO);
  const coach = `${pick(firstNames[pick<Gender>(["M", "F"])])} ${pick(lastNames)}`;
  return {
    name,
    gender,
    birthDate: randomBirthDate(),
    coach,
    bodyWeight,
    snatchStart,
    cleanAndJerkStart,
    entryTotal: snatchStart + cleanAndJerkStart + randInt(ENTRY_TOTAL_EXTRA.min, ENTRY_TOTAL_EXTRA.max),
    lot: randInt(1, MAX_LOT),
    signature: signatureOf(pick([name, coach])),
  };
}

let fallback: SessionAthlete | undefined;

/** Create a new random athlete and make it the session's athlete. */
export function newSessionAthlete(key = "athlete"): SessionAthlete {
  const athlete = generate();
  fallback = athlete;
  try {
    sessionStorage.setItem(key, JSON.stringify(athlete));
  } catch {
    /* storage unavailable: the athlete lasts while the page stays loaded */
  }
  return athlete;
}

/**
 * The session's athlete, created on first use. It stays the same for the browser
 * session (it survives navigation and reloads, but not closing the tab).
 */
export function getSessionAthlete(key = "athlete"): SessionAthlete {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<SessionAthlete>;
      if (
        parsed.name &&
        parsed.birthDate &&
        parsed.coach &&
        parsed.bodyWeight &&
        parsed.snatchStart &&
        parsed.cleanAndJerkStart &&
        parsed.entryTotal &&
        parsed.lot &&
        parsed.signature &&
        (parsed.gender === "M" || parsed.gender === "F")
      ) {
        return parsed as SessionAthlete;
      }
    }
    return newSessionAthlete(key);
  } catch {
    // Storage unavailable: keep one athlete for as long as the page stays loaded.
    return (fallback ??= generate());
  }
}
