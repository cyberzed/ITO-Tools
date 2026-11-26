import { expect, it } from "vitest";
import { categoriesFor } from "./categories";
import { COSTUME_G, bodyweightG, generateCase, limitsOf, parseKg, verdictFor } from "./weighIn";

const men = categoriesFor("M");
const m85 = limitsOf(men, men.findIndex((c) => c.label === "M85"));

it("gives a category the limits between the previous limit and its own", () => {
  expect(m85).toEqual({ aboveG: 75000, maxG: 85000 });
  expect(limitsOf(men, 0)).toEqual({ aboveG: null, maxG: 60000 });
  expect(limitsOf(men, men.length - 1)).toEqual({ aboveG: 110000, maxG: null });
});

it("deducts 250 g for the costume", () => {
  expect(COSTUME_G).toBe(250);
  expect(bodyweightG(85210)).toBe(84960);
});

it("makes weight up to and including the upper limit, after the deduction", () => {
  expect(verdictFor(m85, 85250)).toBe("within"); // 85.00 after the deduction
  expect(verdictFor(m85, 85100)).toBe("within"); // over on the scale, under after it
  expect(verdictFor(m85, 85260)).toBe("heavy"); // 85.01
});

it("is too light at or below the limit of the category below", () => {
  expect(verdictFor(m85, 75250)).toBe("light"); // 75.00 belongs to M75
  expect(verdictFor(m85, 75260)).toBe("within"); // 75.01
});

it("has no lower limit for the lightest category and no upper one for the open category", () => {
  expect(verdictFor(limitsOf(men, 0), 40000)).toBe("within");
  expect(verdictFor(limitsOf(men, men.length - 1), 180000)).toBe("within");
  expect(verdictFor(limitsOf(men, men.length - 1), 110250)).toBe("light");
});

it("generates readings close to the limits, of every verdict, in 10 g steps", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    const c = generateCase();
    const bw = bodyweightG(c.scaleG);
    expect(c.scaleG % 10).toBe(0);
    const near = [c.limits.aboveG, c.limits.maxG].filter((x) => x !== null).some((l) => Math.abs(bw - l!) <= 1500);
    expect(near).toBe(true);
    seen.add(verdictFor(c.limits, c.scaleG));
    if (c.limits.maxG !== null && c.scaleG > c.limits.maxG && bw <= c.limits.maxG) seen.add("costume");
  }
  expect([...seen].sort()).toEqual(["costume", "heavy", "light", "within"]);
});

it("reads typed weights with a dot or a comma", () => {
  expect(parseKg("84.96")).toBe(84960);
  expect(parseKg(" 84,96 ")).toBe(84960);
  expect(parseKg("85")).toBe(85000);
  expect(parseKg("85.")).toBeNull();
  expect(parseKg("abc")).toBeNull();
  expect(parseKg("")).toBeNull();
});
