import { describe, expect, it } from "vitest";
import { categoriesFor } from "./categories";
import { DEFAULT_GRID, MAX_GRID, MIN_GRID, MIN_PLUS_WEIGHT, generateRound, isValidClass, scoreRound } from "./classTraining";

const sizes = Array.from({ length: MAX_GRID - MIN_GRID + 1 }, (_, i) => MIN_GRID + i);

describe("generateRound", () => {
  it("covers the sizes from 5 x 5 to 10 x 10", () => {
    expect([MIN_GRID, MAX_GRID]).toEqual([5, 10]);
  });

  it.each(sizes.flatMap((n) => [["M", n], ["F", n]] as const))(
    "builds a unique %s board with every valid class at size %i",
    (g, n) => {
      for (let i = 0; i < 30; i++) {
        const board = generateRound(g, n);
        expect(board).toHaveLength(n * n);
        expect(new Set(board).size).toBe(n * n);
        for (const c of categoriesFor(g)) expect(board).toContain(c.label);
        expect(board.filter((c) => isValidClass(g, c))).toHaveLength(categoriesFor(g).length);
        for (const code of board) expect(code.startsWith(g)).toBe(true);
      }
    },
  );

  it("defaults to a 7 x 7 board", () => {
    expect(DEFAULT_GRID).toBe(7);
    expect(generateRound("M")).toHaveLength(49);
  });

  it.each(sizes.flatMap((n) => [["M", n], ["F", n]] as const))(
    "only uses '+' classes from the minimum weight, and always some, for %s at size %i",
    (g, n) => {
      for (let i = 0; i < 30; i++) {
        const plus = generateRound(g, n).filter((c) => c.includes("+"));
        expect(plus.length).toBeGreaterThanOrEqual(3); // the real "+" class and at least 2 decoys
        for (const code of plus) {
          expect(Number(code.split("+")[1])).toBeGreaterThanOrEqual(MIN_PLUS_WEIGHT[g]);
        }
      }
    },
  );

  it("shuffles the tiles between rounds", () => {
    expect(generateRound("M")).not.toEqual(generateRound("M"));
  });
});

describe("isValidClass", () => {
  it("accepts only senior classes of the chosen gender", () => {
    expect(isValidClass("M", "M95")).toBe(true);
    expect(isValidClass("M", "M+110")).toBe(true);
    expect(isValidClass("M", "F77")).toBe(false); // other gender
    expect(isValidClass("M", "M55")).toBe(false); // youth only
    expect(isValidClass("F", "F45")).toBe(false); // youth only
    expect(isValidClass("F", "F77")).toBe(true);
  });
});

describe("scoreRound", () => {
  const board = ["M60", "M65", "F49", "M80", "M+110"];
  it("splits the selection into correct, wrong and missed", () => {
    const s = scoreRound("M", board, new Set(["M60", "F49", "M80"]));
    expect(s.correct).toEqual(["M60"]);
    expect(s.wrong).toEqual(["F49", "M80"]);
    expect(s.missed).toEqual(["M65", "M+110"]);
  });
});
