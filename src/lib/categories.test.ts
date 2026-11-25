import { describe, expect, it } from "vitest";
import { ageGroupsFor, categoriesFor, categoryFor } from "./categories";

const labels = (g: "M" | "F", a: "youth" | "junior" | "senior") =>
  categoriesFor(g, a).map((c) => c.label);

describe("categoriesFor", () => {
  it("lists the senior and junior men categories", () => {
    expect(labels("M", "senior")).toEqual(["60 kg", "65 kg", "70 kg", "75 kg", "85 kg", "95 kg", "110 kg", "+110 kg"]);
    expect(labels("M", "junior")).toEqual(labels("M", "senior"));
  });

  it("lists the senior and junior women categories", () => {
    expect(labels("F", "senior")).toEqual(["49 kg", "53 kg", "57 kg", "61 kg", "69 kg", "77 kg", "86 kg", "+86 kg"]);
    expect(labels("F", "junior")).toEqual(labels("F", "senior"));
  });

  it("lists the youth categories", () => {
    expect(labels("M", "youth")).toEqual(["55 kg", "60 kg", "65 kg", "70 kg", "75 kg", "85 kg", "95 kg", "+95 kg"]);
    expect(labels("F", "youth")).toEqual(["45 kg", "49 kg", "53 kg", "57 kg", "61 kg", "69 kg", "77 kg", "+77 kg"]);
  });

  it("has eight categories in every list", () => {
    for (const g of ["M", "F"] as const)
      for (const a of ["youth", "junior", "senior"] as const) expect(categoriesFor(g, a)).toHaveLength(8);
  });
});

describe("categoryFor", () => {
  it("includes the upper limit in the category", () => {
    expect(categoryFor("M", "senior", 60).label).toBe("60 kg");
    expect(categoryFor("M", "senior", 60.01).label).toBe("65 kg");
    expect(categoryFor("F", "senior", 86).label).toBe("86 kg");
    expect(categoryFor("F", "senior", 86.01).label).toBe("+86 kg");
  });

  it("puts light athletes in the lowest category", () => {
    expect(categoryFor("M", "senior", 50).label).toBe("60 kg");
    expect(categoryFor("F", "youth", 40).label).toBe("45 kg");
  });

  it("puts the heaviest athletes in the open category", () => {
    expect(categoryFor("M", "senior", 150).label).toBe("+110 kg");
    expect(categoryFor("M", "youth", 100).label).toBe("+95 kg");
    expect(categoryFor("F", "youth", 80).label).toBe("+77 kg");
  });

  it("uses different limits for youth and senior", () => {
    expect(categoryFor("M", "youth", 56).label).toBe("60 kg");
    expect(categoryFor("M", "senior", 56).label).toBe("60 kg");
    expect(categoryFor("M", "youth", 97).label).toBe("+95 kg");
    expect(categoryFor("M", "senior", 97).label).toBe("110 kg");
  });
});

describe("ageGroupsFor", () => {
  const year = 2026;
  it("counts age as the year minus the year of birth", () => {
    expect(ageGroupsFor(2013, year)).toEqual(["youth"]); // 13
    expect(ageGroupsFor(2011, year)).toEqual(["youth", "junior", "senior"]); // 15
    expect(ageGroupsFor(2009, year)).toEqual(["youth", "junior", "senior"]); // 17
    expect(ageGroupsFor(2008, year)).toEqual(["junior", "senior"]); // 18
    expect(ageGroupsFor(2006, year)).toEqual(["junior", "senior"]); // 20
    expect(ageGroupsFor(2005, year)).toEqual(["senior"]); // 21
  });

  it("allows no group below 13", () => {
    expect(ageGroupsFor(2014, year)).toEqual([]);
  });
});
