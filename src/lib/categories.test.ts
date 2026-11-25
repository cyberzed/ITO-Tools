import { describe, expect, it } from "vitest";
import { categoriesFor, categoryFor } from "./categories";

const labels = (g: "M" | "F") => categoriesFor(g).map((c) => c.label);

describe("categoriesFor", () => {
  it("lists the senior men categories in order", () => {
    expect(labels("M")).toEqual(["60 kg", "65 kg", "70 kg", "75 kg", "85 kg", "95 kg", "110 kg", "+110 kg"]);
  });

  it("lists the senior women categories in order", () => {
    expect(labels("F")).toEqual(["49 kg", "53 kg", "57 kg", "61 kg", "69 kg", "77 kg", "86 kg", "+86 kg"]);
  });
});

describe("categoryFor", () => {
  it("includes the upper limit in the category", () => {
    expect(categoryFor("M", 60).label).toBe("60 kg");
    expect(categoryFor("M", 60.01).label).toBe("65 kg");
    expect(categoryFor("F", 86).label).toBe("86 kg");
    expect(categoryFor("F", 86.01).label).toBe("+86 kg");
  });

  it("puts light athletes in the lowest category", () => {
    expect(categoryFor("M", 50).label).toBe("60 kg");
    expect(categoryFor("F", 40).label).toBe("49 kg");
  });

  it("puts the heaviest athletes in the open category", () => {
    expect(categoryFor("M", 150).label).toBe("+110 kg");
    expect(categoryFor("F", 120).label).toBe("+86 kg");
  });

  it("uses a different list for each gender", () => {
    expect(categoryFor("M", 56).label).toBe("60 kg");
    expect(categoryFor("F", 56).label).toBe("57 kg");
  });
});
