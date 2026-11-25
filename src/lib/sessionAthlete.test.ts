import { beforeEach, describe, expect, it } from "vitest";
import { bodyWeightRange } from "./categories";
import { MAX_LOT, SNATCH_JITTER, SNATCH_RATIO, firstNames, getSessionAthlete, newSessionAthlete, signatureOf } from "./sessionAthlete";

beforeEach(() => sessionStorage.clear());

/** Generate a fresh athlete each time by using a new storage key. */
const many = (n = 300) => Array.from({ length: n }, (_, i) => getSessionAthlete(`a${i}`));

describe("getSessionAthlete", () => {
  it("returns the same athlete for the whole session", () => {
    const first = getSessionAthlete();
    expect(getSessionAthlete()).toEqual(first);
  });

  it("replaces the session athlete when a new one is requested", () => {
    const first = getSessionAthlete();
    const next = newSessionAthlete();
    expect(next).not.toEqual(first);
    expect(getSessionAthlete()).toEqual(next);
  });

  it("builds a first name that matches the gender", () => {
    for (const a of many()) {
      const first = a.name.split(" ")[0];
      expect(firstNames[a.gender]).toContain(first);
    }
  });

  it("produces both genders", () => {
    const genders = new Set(many().map((a) => a.gender));
    expect(genders).toEqual(new Set(["M", "F"]));
  });

  it("formats the birth date as a real dd.mm.yyyy date", () => {
    for (const a of many()) {
      expect(a.birthDate).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
      const [d, m, y] = a.birthDate.split(".").map(Number);
      const date = new Date(y, m - 1, d);
      expect([date.getDate(), date.getMonth() + 1, date.getFullYear()]).toEqual([d, m, y]);
    }
  });

  it("makes the birth year 17 to 30 years before the current year", () => {
    const year = new Date().getFullYear();
    for (const a of many()) {
      const birthYear = Number(a.birthDate.slice(-4));
      expect(birthYear).toBeGreaterThanOrEqual(year - 30);
      expect(birthYear).toBeLessThanOrEqual(year - 17);
    }
  });

  it("draws a bodyweight with two decimals inside the range for the gender", () => {
    const weights = many().map((a) => a.bodyWeight);
    for (const a of many()) {
      const { min, max } = bodyWeightRange(a.gender);
      expect(a.bodyWeight).toBeGreaterThanOrEqual(min);
      expect(a.bodyWeight).toBeLessThanOrEqual(max);
      expect(Math.round(a.bodyWeight * 100) / 100).toBe(a.bodyWeight);
    }
    expect(new Set(weights).size).toBeGreaterThan(1);
  });

  it("starts the snatch at about 1.5 times bodyweight, in whole kg", () => {
    const ratios = new Set<number>();
    for (const a of many()) {
      expect(Number.isInteger(a.snatchStart)).toBe(true);
      // Allow half a kg for rounding to a whole number.
      expect(a.snatchStart).toBeGreaterThanOrEqual(a.bodyWeight * SNATCH_RATIO * (1 - SNATCH_JITTER) - 0.5);
      expect(a.snatchStart).toBeLessThanOrEqual(a.bodyWeight * SNATCH_RATIO * (1 + SNATCH_JITTER) + 0.5);
      ratios.add(Math.round((a.snatchStart / a.bodyWeight) * 100));
    }
    expect(ratios.size).toBeGreaterThan(1); // the jitter varies
  });

  it("draws a whole-number lot from 1 to the maximum", () => {
    const lots = many().map((a) => a.lot);
    for (const lot of lots) {
      expect(Number.isInteger(lot)).toBe(true);
      expect(lot).toBeGreaterThanOrEqual(1);
      expect(lot).toBeLessThanOrEqual(MAX_LOT);
    }
    expect(new Set(lots).size).toBeGreaterThan(1);
  });

  it("signs as either the athlete or the coach", () => {
    for (const a of many()) {
      expect([signatureOf(a.name), signatureOf(a.coach)]).toContain(a.signature);
    }
  });

  it("shortens a name to the first four letters of the last name", () => {
    expect(signatureOf("Julian Frank")).toBe("Fran.");
    expect(signatureOf("Ida Holm")).toBe("Holm.");
  });

  it("replaces a saved athlete that lacks the newer fields", () => {
    sessionStorage.setItem("athlete", JSON.stringify({ name: "Old Entry", birthDate: "01.01.2000", gender: "M" }));
    const a = getSessionAthlete();
    expect(a.coach).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("athlete")!)).toEqual(a);
  });
});
