import { describe, expect, it } from "vitest";
import { bodyWeightRange, categoriesFor, categoryFor } from "./categories";

const labels = (g: "M" | "F") => categoriesFor(g).map((c) => c.label);

describe("categoriesFor", () => {
  it("lists the senior men categories in order", () => {
    expect(labels("M")).toEqual(["M60", "M65", "M70", "M75", "M85", "M95", "M110", "M+110"]);
  });

  it("lists the senior women categories in order", () => {
    expect(labels("F")).toEqual(["F49", "F53", "F57", "F61", "F69", "F77", "F86", "F+86"]);
  });
});

describe("categoryFor", () => {
  it("includes the upper limit in the category", () => {
    expect(categoryFor("M", 60).label).toBe("M60");
    expect(categoryFor("M", 60.01).label).toBe("M65");
    expect(categoryFor("F", 86).label).toBe("F86");
    expect(categoryFor("F", 86.01).label).toBe("F+86");
  });

  it("puts light athletes in the lowest category", () => {
    expect(categoryFor("M", 50).label).toBe("M60");
    expect(categoryFor("F", 40).label).toBe("F49");
  });

  it("puts the heaviest athletes in the open category", () => {
    expect(categoryFor("M", 150).label).toBe("M+110");
    expect(categoryFor("F", 120).label).toBe("F+86");
  });

  it("uses a different list for each gender", () => {
    expect(categoryFor("M", 56).label).toBe("M60");
    expect(categoryFor("F", 56).label).toBe("F57");
  });
});

describe("bodyWeightRange", () => {
  it("runs from 5 kg under the lowest category to 30 kg over the highest limit", () => {
    expect(bodyWeightRange("M")).toEqual({ min: 55, max: 140 });
    expect(bodyWeightRange("F")).toEqual({ min: 44, max: 116 });
  });
});
