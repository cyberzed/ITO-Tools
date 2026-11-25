import { describe, expect, it } from "vitest";
import { categoriesFor } from "./categories";
import { GRID_SIZE, generateRound, isValidClass, scoreRound } from "./classGame";

describe("generateRound", () => {
  it.each(["M", "F"] as const)("builds a board of 100 unique tiles with every valid %s class", (g) => {
    for (let i = 0; i < 50; i++) {
      const board = generateRound(g);
      expect(board).toHaveLength(GRID_SIZE);
      expect(new Set(board).size).toBe(GRID_SIZE);
      for (const c of categoriesFor(g)) expect(board).toContain(c.label);
      expect(board.filter((c) => isValidClass(g, c))).toHaveLength(categoriesFor(g).length);
    }
  });

  it("includes decoys from the other gender", () => {
    const board = generateRound("M");
    expect(board.filter((c) => c.startsWith("F")).length).toBeGreaterThan(8);
  });

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
