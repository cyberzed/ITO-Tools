import { categoriesFor, type Gender } from "./categories";
import { shuffle } from "./random";

/** The game board is 10 x 10. */
export const GRID_SIZE = 100;

/** Youth classes without the open "+" ones (TCRR 1.2.3 and 1.2.4). They are not senior classes, so they make good decoys. */
const youth: Record<Gender, string[]> = {
  M: "M55 M60 M65 M70 M75 M85 M95".split(" "),
  F: "F45 F49 F53 F57 F61 F69 F77".split(" "),
};

/** Weights the random decoys can use. */
const weights = Array.from({ length: 126 - 40 }, (_, i) => 40 + i);

/** A "+" class only makes sense for heavy athletes, so decoys use it from this weight up. */
export const MIN_PLUS_WEIGHT: Record<Gender, number> = { M: 100, F: 80 };

/** How many "+" decoys a board always gets, so they stay part of the game. */
const GUARANTEED_PLUS = 10;

/** Is this a senior class for the gender? */
export const isValidClass = (gender: Gender, code: string): boolean =>
  categoriesFor(gender).some((c) => c.label === code);

/**
 * The board for one round: all the senior classes for the gender, mixed with
 * decoys, in random order. Every tile uses the gender's own letter. Decoys are
 * youth classes, random weights and "+" classes with a wrong limit.
 */
export function generateRound(gender: Gender): string[] {
  const valid = categoriesFor(gender).map((c) => c.label);
  const plain = weights.map((w) => `${gender}${w}`);
  const open = weights.filter((w) => w >= MIN_PLUS_WEIGHT[gender]).map((w) => `${gender}+${w}`);

  const plusFirst = shuffle(open);
  const chosen = new Set<string>(valid);
  // Youth classes first, a few "+" classes, then plain weights, then any "+" classes still needed.
  const order = [
    ...shuffle(youth[gender]),
    ...plusFirst.slice(0, GUARANTEED_PLUS),
    ...shuffle(plain),
    ...plusFirst.slice(GUARANTEED_PLUS),
  ];
  for (const code of order) {
    if (chosen.size >= GRID_SIZE) break;
    chosen.add(code);
  }
  return shuffle([...chosen]);
}

export interface RoundScore {
  /** Valid classes the player selected. */
  correct: string[];
  /** Selected tiles that are not valid classes. */
  wrong: string[];
  /** Valid classes the player did not select. */
  missed: string[];
}

export function scoreRound(gender: Gender, board: readonly string[], selected: ReadonlySet<string>): RoundScore {
  return {
    correct: board.filter((c) => selected.has(c) && isValidClass(gender, c)),
    wrong: board.filter((c) => selected.has(c) && !isValidClass(gender, c)),
    missed: board.filter((c) => !selected.has(c) && isValidClass(gender, c)),
  };
}

