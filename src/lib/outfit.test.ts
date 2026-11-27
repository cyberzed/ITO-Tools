import { describe, expect, it } from "vitest";
import type { Rng } from "./marshal";
import {
  ELBOW_AREA,
  ELBOW_CM,
  KNEE_CM,
  MAX_BELT_CM,
  describeScene,
  faultById,
  faults,
  faultsForKind,
  faultsOf,
  generateScene,
  lookAlikeById,
  lookAlikes,
  lookAlikesOf,
  sceneKey,
  type FaultId,
  type FigureScene,
  type HandScene,
  type LookAlikeId,
  type OutfitScene,
} from "./outfit";

function seeded(seed: number): Rng {
  let s = seed >>> 0 || 1;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return {
    int: (min, max) => min + Math.floor(rand() * (max - min + 1)),
    chance: (percent) => rand() * 100 < percent,
    pick: (list) => list[Math.floor(rand() * list.length)],
  };
}

const figure = (over: Partial<FigureScene> = {}): FigureScene => ({
  kind: "figure",
  footwear: true,
  clothing: "costume",
  colour: "red",
  costume: { sleeveCm: 0, legCm: 14, collar: false },
  beltCm: 10,
  unitard: null,
  shirtSleeveCm: null,
  shortsCm: null,
  kneeSupport: null,
  trunkBandage: false,
  wraps: [],
  ...over,
});

const hand = (over: Partial<HandScene> = {}): HandScene => ({ kind: "hand", glove: null, wraps: [], ...over });

describe("the rules, one by one", () => {
  it("passes a plain costume with shoes and a belt", () => {
    expect(faultsOf(figure())).toEqual([]);
  });

  it("wants sport footwear (4.1.1, 4.3.1)", () => {
    expect(faultsOf(figure({ footwear: false }))).toEqual(["barefoot"]);
  });

  it("does not allow a T-shirt and shorts instead of a costume (4.7.4)", () => {
    expect(faultsOf(figure({ clothing: "twoPiece" }))).toEqual(["twoPiece"]);
  });

  it("wants a costume without a collar (4.2.1)", () => {
    expect(faultsOf(figure({ costume: { sleeveCm: 0, legCm: 14, collar: true } }))).toEqual(["costumeCollar"]);
  });

  it("does not let the costume cover the elbows or the knees (4.2.1)", () => {
    expect(faultsOf(figure({ costume: { sleeveCm: ELBOW_CM - 1, legCm: 14, collar: false } }))).toEqual([]);
    expect(faultsOf(figure({ costume: { sleeveCm: ELBOW_CM, legCm: 14, collar: false } }))).toEqual(["costumeElbows"]);
    expect(faultsOf(figure({ costume: { sleeveCm: 0, legCm: KNEE_CM - 1, collar: false } }))).toEqual([]);
    expect(faultsOf(figure({ costume: { sleeveCm: 0, legCm: KNEE_CM, collar: false } }))).toEqual(["costumeKnees"]);
  });

  it("allows a belt up to 12 cm and no wider (4.4.2)", () => {
    expect(MAX_BELT_CM).toBe(12);
    expect(faultsOf(figure({ beltCm: 12 }))).toEqual([]);
    expect(faultsOf(figure({ beltCm: 13 }))).toEqual(["beltWide"]);
    expect(faultsOf(figure({ beltCm: null }))).toEqual([]);
  });

  it("does not allow a pattern on a unitard that shows (4.7.1), and allows a long plain one", () => {
    const shows = { sleeveCm: 54, legCm: 0 };
    expect(faultsOf(figure({ unitard: { ...shows, pattern: true } }))).toEqual(["unitardPattern"]);
    expect(faultsOf(figure({ unitard: { ...shows, pattern: false } }))).toEqual([]);
    // Hidden under the costume, a pattern cannot be seen, so it is not judged.
    expect(faultsOf(figure({ costume: { sleeveCm: 12, legCm: 14, collar: false }, unitard: { sleeveCm: 10, legCm: 0, pattern: true } }))).toEqual([]);
  });

  it("does not let the T-shirt under the costume cover the elbows (4.7.2)", () => {
    expect(faultsOf(figure({ shirtSleeveCm: 12 }))).toEqual([]);
    expect(faultsOf(figure({ shirtSleeveCm: 40 }))).toEqual(["shirtElbows"]);
  });

  it("keeps shorts under the costume no longer than the costume and above the knees (4.7.3)", () => {
    expect(faultsOf(figure({ shortsCm: 14 }))).toEqual([]);
    expect(faultsOf(figure({ shortsCm: 15 }))).toEqual(["shortsLonger"]);
    expect(faultsOf(figure({ shortsCm: KNEE_CM - 1 }))).toEqual(["shortsLonger"]);
    expect(faultsOf(figure({ shortsCm: KNEE_CM }))).toEqual(["shortsKnees"]);
  });

  it("allows an elastic knee support but not buckles or straps (4.5.1.2)", () => {
    expect(faultsOf(figure({ kneeSupport: "elastic" }))).toEqual([]);
    expect(faultsOf(figure({ kneeSupport: "strapped" }))).toEqual(["kneeStrapped"]);
  });

  it("wants a bandage on the trunk under the costume (4.5.1.5)", () => {
    expect(faultsOf(figure({ trunkBandage: true }))).toEqual(["trunkBandage"]);
  });

  it("keeps bandages and tape out of the elbow area, 5 cm above and below the elbow", () => {
    expect(ELBOW_AREA).toEqual({ from: 23, to: 33 });
    const bandage = (fromCm: number, toCm: number) => figure({ wraps: [{ material: "bandage", arm: "left", fromCm, toCm }] });
    const tape = (fromCm: number, toCm: number) => figure({ wraps: [{ material: "tape", arm: "right", fromCm, toCm }] });
    // Ending at the edge of the area is outside it. A centimetre more is inside.
    expect(faultsOf(bandage(10, 23))).toEqual([]);
    expect(faultsOf(bandage(10, 24))).toEqual(["bandageElbow"]);
    expect(faultsOf(bandage(33, 50))).toEqual([]);
    expect(faultsOf(bandage(32, 50))).toEqual(["bandageElbow"]);
    expect(faultsOf(tape(10, 21))).toEqual([]);
    expect(faultsOf(tape(20, 36))).toEqual(["tapeElbow"]);
    // A bandage that covers the whole area is of course inside it.
    expect(faultsOf(bandage(15, 45))).toEqual(["bandageElbow"]);
  });

  it("can have two faults at once, in the order of the table", () => {
    expect(faultsOf(figure({ footwear: false, beltCm: 15 }))).toEqual(["barefoot", "beltWide"]);
  });

  it("covers the hand: glove, plaster, tape and the gap (4.5.2.2, 4.5.3.1, 4.6.2, 4.6.3)", () => {
    expect(faultsOf(hand())).toEqual([]);
    expect(faultsOf(hand({ glove: 0 }))).toEqual([]);
    expect(faultsOf(hand({ glove: 1 }))).toEqual([]);
    expect(faultsOf(hand({ glove: 2 }))).toEqual(["glovePast"]);
    const wrap = (material: "tape" | "plaster", protrudes: boolean, touchesGlove = false) => ({ finger: 1 as const, material, protrudes, touchesGlove });
    expect(faultsOf(hand({ wraps: [wrap("tape", true)] }))).toEqual(["tapeProtrudes"]);
    expect(faultsOf(hand({ wraps: [wrap("plaster", true)] }))).toEqual(["plasterProtrudes"]);
    expect(faultsOf(hand({ wraps: [wrap("plaster", false)] }))).toEqual([]);
    expect(faultsOf(hand({ glove: 1, wraps: [wrap("tape", false, true)] }))).toEqual(["noSeparation"]);
    // Without a glove there is nothing to be separated from.
    expect(faultsOf(hand({ wraps: [wrap("tape", false, true)] }))).toEqual([]);
    expect(faultsOf(hand({ glove: 2, wraps: [wrap("tape", true, true)] }))).toEqual(["glovePast", "tapeProtrudes", "noSeparation"]);
  });
});

describe("the tables", () => {
  it("has a unique id, a rule from section 4, and a label for every fault", () => {
    expect(new Set(faults.map((f) => f.id)).size).toBe(faults.length);
    for (const f of faults) {
      expect(f.rule, f.id).toMatch(/^TCRR 4\./);
      expect(f.label.length, f.id).toBeGreaterThan(5);
      expect(f.short.length, f.id).toBeGreaterThan(2);
    }
  });

  it("splits the faults into the figure and the hand", () => {
    expect(faultsForKind("figure").length + faultsForKind("hand").length).toBe(faults.length);
    expect(faultsForKind("hand").map((f) => f.id).sort()).toEqual(["glovePast", "noSeparation", "plasterProtrudes", "tapeProtrudes"]);
  });

  it("gives every look-alike a unique id and a rule", () => {
    expect(new Set(lookAlikes.map((l) => l.id)).size).toBe(lookAlikes.length);
    for (const l of lookAlikes) expect(l.rule, l.id).toMatch(/^TCRR 4\./);
  });

  it("pairs each rule that has a boundary with a legal look-alike that cites the same rule", () => {
    // The plain costume, the shoes and the shorts have no look-alike: the plain legal sample is the counterpart.
    const pairs: [FaultId, LookAlikeId][] = [
      ["beltWide", "belt12"],
      ["tapeElbow", "tapeClear"],
      ["bandageElbow", "bandageClear"],
      ["kneeStrapped", "kneeElastic"],
      ["unitardPattern", "unitardLong"],
      ["shirtElbows", "shirtShort"],
      ["glovePast", "gloveFirstKnuckle"],
      ["noSeparation", "gloveGap"],
      ["plasterProtrudes", "wrapEndsBeforeTip"],
      ["tapeProtrudes", "wrapEndsBeforeTip"],
    ];
    const numbers = (rule: string) => rule.replace("TCRR ", "").split(/,\s*|\s+and\s+/);
    for (const [fault, look] of pairs) {
      const shared = numbers(faultById(fault).rule).filter((n) => numbers(lookAlikeById(look).rule).includes(n));
      expect(shared.length, `${fault} and ${look}`).toBeGreaterThan(0);
    }
  });
});

describe("the look-alikes", () => {
  it("are recognised in samples that pass", () => {
    const withLongUnitard = figure({ unitard: { sleeveCm: 54, legCm: 0, pattern: false } });
    expect(lookAlikesOf(withLongUnitard)).toEqual(["unitardLong"]);
    expect(lookAlikesOf(figure({ beltCm: 11 }))).toEqual(["belt12"]);
    expect(lookAlikesOf(figure({ beltCm: 8 }))).toEqual([]);
    // Tape that stops 7 cm from the elbow.
    expect(lookAlikesOf(figure({ wraps: [{ material: "tape", arm: "left", fromCm: 11, toCm: 21 }] }))).toEqual(["tapeClear"]);
    expect(lookAlikesOf(figure({ kneeSupport: "elastic" }))).toEqual(["kneeElastic"]);
    expect(lookAlikesOf(hand({ glove: 1, wraps: [{ finger: 1, material: "tape", protrudes: false, touchesGlove: false }] })).sort()).toEqual([
      "gloveFirstKnuckle",
      "gloveGap",
      "wrapEndsBeforeTip",
    ]);
  });
});

describe("generateScene", () => {
  const many = (n: number) => {
    const out: OutfitScene[] = [];
    let last: OutfitScene | undefined;
    for (let i = 1; i <= n; i++) {
      const scene = generateScene(seeded(i), last);
      out.push(scene);
      last = scene;
    }
    return out;
  };

  it("has no more than two faults, and only faults that fit the kind of picture", () => {
    for (const scene of many(600)) {
      const ids = faultsOf(scene);
      expect(ids.length).toBeLessThanOrEqual(2);
      const fits = faultsForKind(scene.kind).map((f) => f.id);
      for (const id of ids) expect(fits).toContain(id);
    }
  });

  it("makes passing samples and samples with one and with two faults", () => {
    const counts = new Set(many(600).map((s) => faultsOf(s).length));
    expect(counts).toEqual(new Set([0, 1, 2]));
  });

  it("makes both pictures, the figure more often", () => {
    const scenes = many(600);
    const figures = scenes.filter((s) => s.kind === "figure").length;
    expect(figures).toBeGreaterThan(scenes.length - figures);
    expect(figures).toBeLessThan(scenes.length);
  });

  it("has a sample for every fault, and a passing sample for every look-alike", () => {
    const scenes = many(4000);
    const seenFaults = new Set(scenes.flatMap(faultsOf));
    for (const f of faults) expect(seenFaults.has(f.id), f.id).toBe(true);
    const passing = scenes.filter((s) => faultsOf(s).length === 0);
    const seenLook = new Set(passing.flatMap(lookAlikesOf));
    for (const l of lookAlikes) expect(seenLook.has(l.id), l.id).toBe(true);
  });

  it("never repeats the sample before it", () => {
    let last: OutfitScene | undefined;
    for (let i = 1; i <= 800; i++) {
      const scene = generateScene(seeded(i % 7), last);
      if (last) expect(sceneKey(scene)).not.toBe(sceneKey(last));
      last = scene;
    }
  });

  it("uses the injected random numbers, so one seed gives one sample", () => {
    expect(sceneKey(generateScene(seeded(5)))).toBe(sceneKey(generateScene(seeded(5))));
  });
});

describe("describeScene", () => {
  it("says what is drawn without giving the answer away", () => {
    for (const scene of Array.from({ length: 300 }, (_, i) => generateScene(seeded(i + 1)))) {
      const text = describeScene(scene);
      expect(text.length).toBeGreaterThan(20);
      // No numbers (they could be the hidden measurements) and no verdict words.
      expect(text, text).not.toMatch(/\d|fault|pass|illegal|wrong|allowed|too |wide|long|covers/i);
    }
  });

  it("says whether a glove, plaster or tape is drawn", () => {
    const text = describeScene(hand({ glove: 1, wraps: [{ finger: 0, material: "plaster", protrudes: true, touchesGlove: false }] }));
    expect(text).toMatch(/glove/);
    expect(text).toMatch(/plaster/);
  });
});
