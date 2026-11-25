import { categoriesFor, type Gender } from "./categories";
import { shuffle } from "./random";

/** The game board is 10 x 10. */
export const GRID_SIZE = 100;

/** Youth classes (TCRR 1.2.3 and 1.2.4). They are not senior classes, so they make good decoys. */
const youth = [
  ..."M55 M60 M65 M70 M75 M85 M95 M+95".split(" "),
  ..."F45 F49 F53 F57 F61 F69 F77 F+77".split(" "),
];

/** Every weight a decoy could use, for both letters. */
const weights = Array.from({ length: 126 - 40 }, (_, i) => 40 + i);
const anyCode = (letter: Gender) => weights.map((w) => `${letter}${w}`);

/** Is this a senior class for the gender? */
export const isValidClass = (gender: Gender, code: string): boolean =>
  categoriesFor(gender).some((c) => c.label === code);

/**
 * The board for one round: all the senior classes for the gender, mixed with
 * decoys, in random order. Decoys are the other gender's classes, youth classes,
 * "+" classes with a wrong limit and random weights with either letter.
 */
export function generateRound(gender: Gender): string[] {
  const valid = categoriesFor(gender).map((c) => c.label);
  const other: Gender = gender === "M" ? "F" : "M";

  const nearMisses = [
    ...categoriesFor(other).map((c) => c.label),
    ...youth,
    ...[45, 49, 55, 60, 75, 77, 86, 95, 110].flatMap((w) => [`M+${w}`, `F+${w}`]),
  ];
  const chosen = new Set<string>(valid);
  for (const code of shuffle(nearMisses)) {
    if (chosen.size >= valid.length + 30) break;
    chosen.add(code);
  }
  for (const code of shuffle([...anyCode("M"), ...anyCode("F")])) {
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

