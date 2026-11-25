import { beforeEach, describe, expect, it } from "vitest";
import { firstNames, getSessionAthlete, signatureOf } from "./sessionAthlete";

beforeEach(() => sessionStorage.clear());

/** Generate a fresh athlete each time by using a new storage key. */
const many = (n = 300) => Array.from({ length: n }, (_, i) => getSessionAthlete(`a${i}`));

describe("getSessionAthlete", () => {
  it("returns the same athlete for the whole session", () => {
    const first = getSessionAthlete();
    expect(getSessionAthlete()).toEqual(first);
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

  it("signs each signature as either the athlete or the coach", () => {
    for (const a of many()) {
      const allowed = [signatureOf(a.name), signatureOf(a.coach)];
      for (const sig of Object.values(a.signatures)) expect(allowed).toContain(sig);
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
