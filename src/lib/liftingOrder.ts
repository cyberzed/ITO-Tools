/**
 * The calling order of a group. Source: IWF TCRR 2026, 6.6.1-6.6.3, 6.6.6 and the
 * Regulation to 6.6.6 (Calling order).
 */
import { firstNames, type Gender } from "./sessionAthlete";
import { MAX_LOT } from "./sessionAthlete";
import { pick, randBelow, randInt, shuffle } from "./random";

export const ATTEMPTS = 3;
/** Changes allowed for each attempt after it is declared (TCRR 6.6.12). */
export const CHANGES = 2;

export interface Attempt {
  weight: number;
  good: boolean;
  /** Its place in the calling order of the lift: 1 for the first attempt taken, and so on. */
  order: number;
}

export interface Lifter {
  start: number;
  lot: number;
  name: string;
  /** The declared weight of the next attempt. Null when the athlete has no attempts left. */
  next: number | null;
  attempts: Attempt[];
  /** Changes used for the next attempt. */
  changes: number;
}

const lastOrder = (l: Lifter) => (l.attempts.length ? l.attempts[l.attempts.length - 1].order : 0);

/**
 * Negative when `a` is called before `b`. The four factors of TCRR 6.6.6, in priority:
 * the weight, the attempt number, who took the previous attempt earlier, the start number.
 */
export function compareLifters(a: Lifter, b: Lifter): number {
  return a.next! - b.next! || a.attempts.length - b.attempts.length || lastOrder(a) - lastOrder(b) || a.start - b.start;
}

export const waiting = (lifters: Lifter[]) => lifters.filter((l) => l.next !== null);

/** The athlete to call next, or null when the lift is over. */
export function nextLifter(lifters: Lifter[]): Lifter | null {
  const left = waiting(lifters);
  return left.length ? [...left].sort(compareLifters)[0] : null;
}

export type Factor = 1 | 2 | 3 | 4;

export const factorNames: Record<Factor, string> = {
  1: "the weight of the barbell",
  2: "the number of the attempt",
  3: "the order of the previous attempt",
  4: "the start number",
};

/** Which of the four factors puts `first` before `other`, and why, in words. */
export function whyFirst(first: Lifter, other: Lifter): { factor: Factor; text: string } {
  const a = (l: Lifter) => l.attempts.length + 1;
  if (first.next !== other.next)
    return { factor: 1, text: `${first.name} asks for ${first.next} kg and ${other.name} for ${other.next} kg. The lighter weight goes first.` };
  if (a(first) !== a(other))
    return {
      factor: 2,
      text: `Both ask for ${first.next} kg. ${first.name} is on attempt ${a(first)} and ${other.name} on attempt ${a(other)}. The lower attempt number goes first.`,
    };
  if (lastOrder(first) !== lastOrder(other))
    return {
      factor: 3,
      text: `Both ask for ${first.next} kg on attempt ${a(first)}. ${first.name} took the previous attempt as number ${lastOrder(first)} and ${other.name} as number ${lastOrder(other)}. Whoever lifted earlier goes first.`,
    };
  return {
    factor: 4,
    text: `Both ask for ${first.next} kg on attempt ${a(first)}${a(first) === 1 ? "" : " and lifted the previous attempt at the same point"}. ${first.name} has start number ${first.start} and ${other.name} ${other.start}. The lower start number goes first.`,
  };
}

/** The lifters after `start` takes the attempt. A good lift adds 1 kg, a no lift keeps the weight (6.6.3). */
export function takeAttempt(lifters: Lifter[], start: number, good: boolean): Lifter[] {
  const order = lifters.reduce((n, l) => n + l.attempts.length, 0) + 1;
  return lifters.map((l) => {
    if (l.start !== start) return l;
    const attempts = [...l.attempts, { weight: l.next!, good, order }];
    const next = attempts.length === ATTEMPTS ? null : good ? l.next! + 1 : l.next!;
    return { ...l, attempts, next, changes: 0 };
  });
}

/** The lifters after `start` changes the next attempt to `weight`. */
export const changeWeight = (lifters: Lifter[], start: number, weight: number): Lifter[] =>
  lifters.map((l) => (l.start === start ? { ...l, next: weight, changes: l.changes + 1 } : l));

export const lastNamesForGroups = [
  "Frank", "Nielsen", "Larsen", "Berg", "Kowalski", "Novak", "Weber", "Moreau",
  "Lindgren", "Haas", "Petrov", "Bauer", "Jensen", "Rossi", "Holm", "Vogel",
];

/**
 * A random group. Lots are drawn and start numbers follow the lot order (Regulation to 6.4,
 * point 21). The first attempts sit within a few kilos of each other, so ties are common.
 */
export function generateGroup(gender: Gender, size: number, lift: "snatch" | "cleanAndJerk"): Lifter[] {
  const base = gender === "M" ? randInt(100, 140) : randInt(70, 100);
  const around = lift === "snatch" ? base : Math.round(base * 1.22);
  const lots = shuffle(Array.from({ length: MAX_LOT }, (_, i) => i + 1)).slice(0, size).sort((a, b) => a - b);
  // Every athlete gets a different last name, so the feedback is easy to follow.
  const list = shuffle(lastNamesForGroups)
    .slice(0, size)
    .map((last) => `${pick(firstNames[gender])} ${last}`);
  // A handful of starting weights for the whole group, so several athletes share one.
  const weights = Array.from({ length: Math.max(2, Math.ceil(size / 2)) }, () => around + randInt(-5, 5));
  return lots.map((lot, i) => ({ start: i + 1, lot, name: list[i], next: pick(weights), attempts: [], changes: 0 }));
}

/** A good lift about seven times in ten. */
export const randomResult = () => randBelow(10) < 7;

/**
 * Sometimes a coach raises the next attempt of an athlete who still has changes left.
 * Only raises, so the barbell never has to come down.
 */
export function randomChange(lifters: Lifter[]): { lifters: Lifter[]; start: number; weight: number } | null {
  if (randBelow(100) >= 35) return null;
  const can = waiting(lifters).filter((l) => l.changes < CHANGES);
  if (!can.length) return null;
  const l = pick(can);
  const weight = l.next! + randInt(1, 3);
  return { lifters: changeWeight(lifters, l.start, weight), start: l.start, weight };
}
