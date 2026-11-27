/**
 * The outfit check of the Technical Controller. Source: IWF TCRR 2026, 4 (Athletes' outfit),
 * 2.4.7 (lubricants) and 7.8 (the Technical Controller).
 *
 * A sample is a plain parameter object. Its faults are computed from the parameters, one
 * function per rule, so the picture and the answer cannot disagree.
 *
 * The numbers in 4.5 are printed in a block above the text in the PDF, so the references
 * there follow the order of the paragraphs.
 */
import { defaultRng, type Rng } from "./marshal";

/** The figure is drawn at this scale, so a belt of 12 cm is 24 px thick. */
export const PX_PER_CM = 2;
/** The elbow, measured down the arm from the shoulder. */
export const ELBOW_CM = 28;
/** The elbow area: 5 cm above and 5 cm below the elbow (4.5.1.6, 4.5.3.5). */
export const ELBOW_AREA = { from: ELBOW_CM - 5, to: ELBOW_CM + 5 };
/** The knee, measured down the leg from the crotch. */
export const KNEE_CM = 40;
/** The widest belt (4.4.2). */
export const MAX_BELT_CM = 12;

export type Colour = "red" | "blue" | "green" | "black" | "yellow";
export const colours: Colour[] = ["red", "blue", "green", "black", "yellow"];

/** A bandage or tape on an arm, measured down the arm from the shoulder. */
export interface ArmWrap {
  material: "bandage" | "tape";
  arm: "left" | "right";
  fromCm: number;
  toCm: number;
}

export interface FigureScene {
  kind: "figure";
  footwear: boolean;
  /** A costume, or a T-shirt and shorts worn instead of one (4.7.4). */
  clothing: "costume" | "twoPiece";
  colour: Colour;
  /** Sleeves down the arm and legs down the leg, in cm from the shoulder and the crotch. */
  costume: { sleeveCm: number; legCm: number; collar: boolean };
  beltCm: number | null;
  /** The unitard under the costume. It shows where it goes beyond the costume. */
  unitard: { sleeveCm: number; legCm: number; pattern: boolean } | null;
  /** The sleeve of a T-shirt under the costume. */
  shirtSleeveCm: number | null;
  /** The legs of shorts under the costume. */
  shortsCm: number | null;
  kneeSupport: "elastic" | "strapped" | null;
  /** A bandage on the trunk, worn on the outside of the costume. */
  trunkBandage: boolean;
  wraps: ArmWrap[];
}

/** Gloves end before, at or after the first or second knuckle of the fingers. */
export type GloveReach = 0 | 1 | 2;

export interface FingerWrap {
  /** 0 index finger, 1 middle finger, 2 ring finger. */
  finger: 0 | 1 | 2;
  material: "tape" | "plaster";
  protrudes: boolean;
  /** Starts right where the glove ends, with no visible separation. */
  touchesGlove: boolean;
}

export interface HandScene {
  kind: "hand";
  /** 0: the glove stops at the palm, 1: it covers the first knuckle, 2: it goes past it. Null: no glove. */
  glove: GloveReach | null;
  wraps: FingerWrap[];
}

export type OutfitScene = FigureScene | HandScene;
export type SceneKind = OutfitScene["kind"];

export type FaultId =
  | "barefoot"
  | "twoPiece"
  | "costumeCollar"
  | "costumeElbows"
  | "costumeKnees"
  | "beltWide"
  | "unitardPattern"
  | "shirtElbows"
  | "shortsLonger"
  | "shortsKnees"
  | "kneeStrapped"
  | "trunkBandage"
  | "bandageElbow"
  | "tapeElbow"
  | "glovePast"
  | "plasterProtrudes"
  | "tapeProtrudes"
  | "noSeparation";

export type LookAlikeId =
  | "unitardLong"
  | "belt12"
  | "tapeClear"
  | "bandageClear"
  | "kneeElastic"
  | "shirtShort"
  | "gloveFirstKnuckle"
  | "gloveGap"
  | "wrapEndsBeforeTip";

export interface Fault {
  id: FaultId;
  kind: SceneKind;
  group: string;
  /** For the checklist. */
  label: string;
  /** A few words, drawn on the picture. */
  short: string;
  rule: string;
}

export interface LookAlike {
  id: LookAlikeId;
  kind: SceneKind;
  label: string;
  rule: string;
}

interface FaultDef<S> extends Fault {
  check(s: S): boolean;
  /** Change the sample so that the fault is there. */
  inject(s: S, rng: Rng): void;
}

interface LookAlikeDef<S> extends LookAlike {
  check(s: S): boolean;
  /** Change a sample so that the look-alike is there. Returns false when it does not fit. */
  apply(s: S, rng: Rng): boolean;
}

const overlapsElbowArea = (w: ArmWrap) => w.fromCm < ELBOW_AREA.to && w.toCm > ELBOW_AREA.from;
const hasCostume = (s: FigureScene) => s.clothing === "costume";

/** The unitard shows only where it reaches beyond the costume. */
const unitardShows = (s: FigureScene) =>
  !!s.unitard &&
  hasCostume(s) &&
  (s.unitard.sleeveCm > s.costume.sleeveCm || s.unitard.legCm > s.costume.legCm);

const freeArm = (s: FigureScene): "left" | "right" | null => {
  const used = s.wraps.map((w) => w.arm);
  return (["left", "right"] as const).find((a) => !used.includes(a)) ?? null;
};

const figureFaults: FaultDef<FigureScene>[] = [
  {
    id: "barefoot",
    kind: "figure",
    group: "Footwear",
    label: "No sport footwear",
    short: "No shoes",
    rule: "TCRR 4.1.1, 4.3.1",
    check: (s) => !s.footwear,
    inject: (s) => void (s.footwear = false),
  },
  {
    id: "twoPiece",
    kind: "figure",
    group: "Costume",
    label: "A T-shirt and shorts instead of a costume",
    short: "T-shirt and shorts",
    rule: "TCRR 4.2.1, 4.7.4",
    check: (s) => s.clothing === "twoPiece",
    inject: (s) => {
      s.clothing = "twoPiece";
      s.unitard = null;
      s.shirtSleeveCm = null;
      s.shortsCm = null;
    },
  },
  {
    id: "costumeCollar",
    kind: "figure",
    group: "Costume",
    label: "The costume has a collar",
    short: "Collar",
    rule: "TCRR 4.2.1",
    check: (s) => hasCostume(s) && s.costume.collar,
    inject: (s) => void (s.costume.collar = true),
  },
  {
    id: "costumeElbows",
    kind: "figure",
    group: "Costume",
    label: "The costume covers the elbows",
    short: "Covers elbows",
    rule: "TCRR 4.2.1",
    check: (s) => hasCostume(s) && s.costume.sleeveCm >= ELBOW_CM,
    inject: (s, rng) => void (s.costume.sleeveCm = rng.int(36, 54)),
  },
  {
    id: "costumeKnees",
    kind: "figure",
    group: "Costume",
    label: "The costume covers the knees",
    short: "Covers knees",
    rule: "TCRR 4.2.1",
    check: (s) => hasCostume(s) && s.costume.legCm >= KNEE_CM,
    inject: (s, rng) => void (s.costume.legCm = rng.int(46, 64)),
  },
  {
    id: "beltWide",
    kind: "figure",
    group: "Belt",
    label: "The belt is wider than 12 cm",
    short: "Belt too wide",
    rule: "TCRR 4.4.2",
    check: (s) => s.beltCm !== null && s.beltCm > MAX_BELT_CM,
    inject: (s, rng) => void (s.beltCm = rng.int(15, 18)),
  },
  {
    id: "unitardPattern",
    kind: "figure",
    group: "Under the costume",
    label: "The unitard has a pattern or design",
    short: "Patterned unitard",
    rule: "TCRR 4.7.1",
    check: (s) => unitardShows(s) && s.unitard!.pattern,
    inject: (s, rng) => {
      s.costume.sleeveCm = Math.min(s.costume.sleeveCm, 10);
      s.unitard = rng.chance(50) ? { sleeveCm: 54, legCm: 0, pattern: true } : { sleeveCm: 0, legCm: 80, pattern: true };
    },
  },
  {
    id: "shirtElbows",
    kind: "figure",
    group: "Under the costume",
    label: "The T-shirt under the costume covers the elbows",
    short: "T-shirt covers elbows",
    rule: "TCRR 4.7.2",
    check: (s) => hasCostume(s) && s.shirtSleeveCm !== null && s.shirtSleeveCm >= ELBOW_CM,
    inject: (s, rng) => {
      s.costume.sleeveCm = 0;
      s.unitard = null;
      s.shirtSleeveCm = rng.int(36, 48);
    },
  },
  {
    id: "shortsLonger",
    kind: "figure",
    group: "Under the costume",
    label: "The shorts under the costume are longer than the costume",
    short: "Shorts longer",
    rule: "TCRR 4.7.3",
    check: (s) => hasCostume(s) && s.shortsCm !== null && s.shortsCm > s.costume.legCm && s.shortsCm < KNEE_CM,
    inject: (s, rng) => {
      s.costume.legCm = Math.min(s.costume.legCm, 16);
      s.shortsCm = s.costume.legCm + rng.int(10, 16);
    },
  },
  {
    id: "shortsKnees",
    kind: "figure",
    group: "Under the costume",
    label: "The shorts under the costume cover the knees",
    short: "Shorts cover knees",
    rule: "TCRR 4.7.3",
    check: (s) => hasCostume(s) && s.shortsCm !== null && s.shortsCm >= KNEE_CM,
    inject: (s, rng) => {
      s.costume.legCm = Math.min(s.costume.legCm, 16);
      s.shortsCm = rng.int(46, 56);
    },
  },
  {
    id: "kneeStrapped",
    kind: "figure",
    group: "Supports and wraps",
    label: "A knee support with buckles or straps",
    short: "Buckles and straps",
    rule: "TCRR 4.5.1.2",
    check: (s) => s.kneeSupport === "strapped",
    inject: (s) => void (s.kneeSupport = "strapped"),
  },
  {
    id: "trunkBandage",
    kind: "figure",
    group: "Supports and wraps",
    label: "A bandage on the trunk, on the outside of the costume",
    short: "Bandage over costume",
    rule: "TCRR 4.5.1.5",
    check: (s) => hasCostume(s) && s.trunkBandage,
    inject: (s) => void (s.trunkBandage = true),
  },
  {
    id: "bandageElbow",
    kind: "figure",
    group: "Supports and wraps",
    label: "A bandage within 5 cm of the elbow",
    short: "Bandage at elbow",
    rule: "TCRR 4.5.1.6",
    check: (s) => s.wraps.some((w) => w.material === "bandage" && overlapsElbowArea(w)),
    inject: (s, rng) => injectElbowWrap(s, rng, "bandage"),
  },
  {
    id: "tapeElbow",
    kind: "figure",
    group: "Supports and wraps",
    label: "Tape within 5 cm of the elbow",
    short: "Tape at elbow",
    rule: "TCRR 4.5.3.4, 4.5.3.5",
    check: (s) => s.wraps.some((w) => w.material === "tape" && overlapsElbowArea(w)),
    inject: (s, rng) => injectElbowWrap(s, rng, "tape"),
  },
];

function injectElbowWrap(s: FigureScene, rng: Rng, material: ArmWrap["material"]): void {
  const arm = freeArm(s);
  if (!arm) return;
  const fromCm = rng.int(16, 26);
  s.wraps.push({ material, arm, fromCm, toCm: fromCm + rng.int(12, 20) });
}

const handFaults: FaultDef<HandScene>[] = [
  {
    id: "glovePast",
    kind: "hand",
    group: "Gloves",
    label: "The glove covers more than the first knuckle",
    short: "Glove too far",
    rule: "TCRR 4.6.2",
    check: (s) => s.glove === 2,
    inject: (s) => void (s.glove = 2),
  },
  {
    id: "plasterProtrudes",
    kind: "hand",
    group: "Plasters and tape",
    label: "A sticking plaster goes past the fingertip",
    short: "Plaster past tip",
    rule: "TCRR 4.5.2.2",
    check: (s) => s.wraps.some((w) => w.material === "plaster" && w.protrudes),
    inject: (s, rng) => injectFingerWrap(s, rng, "plaster", true),
  },
  {
    id: "tapeProtrudes",
    kind: "hand",
    group: "Plasters and tape",
    label: "Tape goes past the fingertip",
    short: "Tape past tip",
    rule: "TCRR 4.5.3.1",
    check: (s) => s.wraps.some((w) => w.material === "tape" && w.protrudes),
    inject: (s, rng) => injectFingerWrap(s, rng, "tape", true),
  },
  {
    id: "noSeparation",
    kind: "hand",
    group: "Gloves",
    label: "No visible gap between the glove and the plaster or tape",
    short: "No gap",
    rule: "TCRR 4.6.3",
    check: (s) => s.glove !== null && s.wraps.some((w) => w.touchesGlove),
    inject: (s, rng) => {
      s.glove ??= rng.pick([0, 1] as const);
      if (!s.wraps.length) injectFingerWrap(s, rng, rng.pick(["tape", "plaster"] as const), false);
      s.wraps[0].touchesGlove = true;
    },
  },
];

function injectFingerWrap(s: HandScene, rng: Rng, material: FingerWrap["material"], protrudes: boolean): void {
  const free = ([0, 1, 2] as const).filter((f) => !s.wraps.some((w) => w.finger === f));
  if (!free.length) return;
  s.wraps.push({ finger: rng.pick(free), material, protrudes, touchesGlove: false });
}

const figureLookAlikes: LookAlikeDef<FigureScene>[] = [
  {
    id: "unitardLong",
    kind: "figure",
    label: "A tight unitard under the costume that covers the elbows or the knees",
    rule: "TCRR 4.7.1",
    check: (s) => unitardShows(s) && !s.unitard!.pattern && (s.unitard!.sleeveCm >= ELBOW_CM || s.unitard!.legCm >= KNEE_CM),
    apply: (s, rng) => {
      if (!hasCostume(s) || s.shirtSleeveCm !== null || s.costume.sleeveCm >= ELBOW_CM) return false;
      s.costume.sleeveCm = Math.min(s.costume.sleeveCm, 10);
      s.unitard = rng.chance(50) ? { sleeveCm: 54, legCm: 0, pattern: false } : { sleeveCm: 0, legCm: 80, pattern: false };
      return true;
    },
  },
  {
    id: "belt12",
    kind: "figure",
    label: "A belt of 11 or 12 cm, on the outside of the costume",
    rule: "TCRR 4.4.1, 4.4.2",
    check: (s) => s.beltCm !== null && s.beltCm >= 11 && s.beltCm <= MAX_BELT_CM,
    apply: (s, rng) => {
      s.beltCm = rng.int(11, 12);
      return true;
    },
  },
  {
    id: "tapeClear",
    kind: "figure",
    label: "Tape that stops outside the elbow area",
    rule: "TCRR 4.5.3.4, 4.5.3.5",
    check: (s) => s.wraps.some((w) => w.material === "tape" && clearOfElbowArea(w)),
    apply: (s, rng) => applyClearWrap(s, rng, "tape"),
  },
  {
    id: "bandageClear",
    kind: "figure",
    label: "A bandage that stops outside the elbow area",
    rule: "TCRR 4.5.1.6",
    check: (s) => s.wraps.some((w) => w.material === "bandage" && clearOfElbowArea(w)),
    apply: (s, rng) => applyClearWrap(s, rng, "bandage"),
  },
  {
    id: "kneeElastic",
    kind: "figure",
    label: "A one-piece elastic knee support",
    rule: "TCRR 4.5.1.2",
    check: (s) => s.kneeSupport === "elastic",
    apply: (s) => {
      s.kneeSupport = "elastic";
      return true;
    },
  },
  {
    id: "shirtShort",
    kind: "figure",
    label: "A T-shirt under the costume with sleeves above the elbows",
    rule: "TCRR 4.7.2",
    check: (s) => hasCostume(s) && s.shirtSleeveCm !== null && s.shirtSleeveCm > s.costume.sleeveCm && s.shirtSleeveCm < ELBOW_CM,
    apply: (s, rng) => {
      if (!hasCostume(s) || s.unitard) return false;
      s.costume.sleeveCm = 0;
      s.shirtSleeveCm = rng.int(10, 14);
      return true;
    },
  },
];

/** A wrap that stops, or starts, between 1 and 8 cm from the elbow area, and so is legal. */
const clearOfElbowArea = (w: ArmWrap) =>
  (w.toCm <= ELBOW_AREA.from - 1 && w.toCm >= ELBOW_AREA.from - 8) ||
  (w.fromCm >= ELBOW_AREA.to + 1 && w.fromCm <= ELBOW_AREA.to + 8);

function applyClearWrap(s: FigureScene, rng: Rng, material: ArmWrap["material"]): boolean {
  const arm = freeArm(s);
  if (!arm) return false;
  // Above the elbow, ending 7 cm from the elbow, or below it, starting 8 cm from it.
  if (rng.chance(50)) {
    s.costume.sleeveCm = Math.min(s.costume.sleeveCm, 8);
    s.wraps.push({ material, arm, fromCm: 11, toCm: ELBOW_CM - 7 });
  } else {
    s.wraps.push({ material, arm, fromCm: ELBOW_CM + 8, toCm: ELBOW_CM + 8 + rng.int(10, 16) });
  }
  return true;
}

const handLookAlikes: LookAlikeDef<HandScene>[] = [
  {
    id: "gloveFirstKnuckle",
    kind: "hand",
    label: "A fingerless glove that covers up to the first knuckle",
    rule: "TCRR 4.6.1, 4.6.2",
    check: (s) => s.glove === 1,
    apply: (s) => {
      s.glove = 1;
      return true;
    },
  },
  {
    id: "gloveGap",
    kind: "hand",
    label: "Tape or a plaster with a visible gap to the glove",
    rule: "TCRR 4.6.3",
    check: (s) => s.glove !== null && s.wraps.some((w) => !w.touchesGlove),
    apply: (s, rng) => {
      s.glove ??= rng.pick([0, 1] as const);
      if (!s.wraps.length) injectFingerWrap(s, rng, rng.pick(["tape", "plaster"] as const), false);
      return s.wraps.length > 0;
    },
  },
  {
    id: "wrapEndsBeforeTip",
    kind: "hand",
    label: "Tape or a plaster on a finger that ends before the fingertip",
    rule: "TCRR 4.5.2.2, 4.5.3.1",
    check: (s) => s.wraps.some((w) => !w.protrudes),
    apply: (s, rng) => {
      if (!s.wraps.length) injectFingerWrap(s, rng, rng.pick(["tape", "plaster"] as const), false);
      return s.wraps.length > 0;
    },
  },
];

/** Every fault, for the checklist and the answer. */
export const faults: Fault[] = [...figureFaults, ...handFaults].map(({ check: _c, inject: _i, ...f }) => f);
export const lookAlikes: LookAlike[] = [...figureLookAlikes, ...handLookAlikes].map(({ check: _c, apply: _a, ...l }) => l);

export const faultById = (id: FaultId): Fault => faults.find((f) => f.id === id)!;
export const lookAlikeById = (id: LookAlikeId): LookAlike => lookAlikes.find((l) => l.id === id)!;
export const faultsForKind = (kind: SceneKind): Fault[] => faults.filter((f) => f.kind === kind);

/** The faults of a sample, computed from its parameters, in the order of the fault table. */
export function faultsOf(scene: OutfitScene): FaultId[] {
  const defs = scene.kind === "figure" ? figureFaults : handFaults;
  return (defs as FaultDef<OutfitScene>[]).filter((d) => d.check(scene)).map((d) => d.id);
}

/** The parts of the sample that look suspicious but are allowed. */
export function lookAlikesOf(scene: OutfitScene): LookAlikeId[] {
  const defs = scene.kind === "figure" ? figureLookAlikes : handLookAlikes;
  return (defs as LookAlikeDef<OutfitScene>[]).filter((d) => d.check(scene)).map((d) => d.id);
}

export const sceneKey = (scene: OutfitScene): string => JSON.stringify(scene);

const legalFigure = (rng: Rng): FigureScene => ({
  kind: "figure",
  footwear: true,
  clothing: "costume",
  colour: rng.pick(colours),
  costume: { sleeveCm: rng.pick([0, 0, 10]), legCm: rng.pick([12, 14, 16]), collar: false },
  beltCm: rng.chance(60) ? rng.int(8, 12) : null,
  unitard: null,
  shirtSleeveCm: null,
  shortsCm: null,
  kneeSupport: null,
  trunkBandage: false,
  wraps: [],
});

const legalHand = (): HandScene => ({ kind: "hand", glove: null, wraps: [] });

/**
 * A random sample: a passing one, or one with one or two faults. Passing samples often carry
 * look-alikes that are allowed, so the exercise does not teach that anything extra is wrong.
 */
export function generateScene(rng: Rng = defaultRng, last?: OutfitScene): OutfitScene {
  for (let attempt = 0; attempt < 200; attempt++) {
    const kind: SceneKind = rng.chance(70) ? "figure" : "hand";
    const faultCount = rng.chance(40) ? 0 : rng.chance(80) ? 1 : 2;
    const scene = kind === "figure" ? buildFigure(rng, faultCount) : buildHand(rng, faultCount);
    const found = faultsOf(scene).length;
    if (found !== faultCount) continue;
    if (last && sceneKey(last) === sceneKey(scene)) continue;
    return scene;
  }
  return legalFigure(rng);
}

/** A shuffled copy, using the injected random numbers. */
function shuffled<T>(list: readonly T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Look-alikes first, then the faults on top, so a fault is never hidden by a look-alike. */
function build<S extends OutfitScene>(
  start: S,
  lookAlikeDefs: LookAlikeDef<S>[],
  faultDefs: FaultDef<S>[],
  faultCount: number,
  rng: Rng,
): S {
  const s = start;
  const wanted = rng.int(0, faultCount === 0 ? 2 : 1);
  let done = 0;
  for (const l of shuffled(lookAlikeDefs, rng)) {
    if (done >= wanted) break;
    const copy = structuredClone(s);
    if (l.apply(copy, rng) && faultsOf(copy).length === 0) {
      Object.assign(s, copy);
      done++;
    }
  }
  for (const d of shuffled(faultDefs, rng).slice(0, faultCount)) d.inject(s, rng);
  return s;
}

const buildFigure = (rng: Rng, faultCount: number): FigureScene =>
  build(legalFigure(rng), figureLookAlikes, figureFaults, faultCount, rng);

const buildHand = (rng: Rng, faultCount: number): HandScene =>
  build(legalHand(), handLookAlikes, handFaults, faultCount, rng);

const colourName: Record<Colour, string> = {
  red: "red",
  blue: "blue",
  green: "green",
  black: "black",
  yellow: "yellow",
};

/** A neutral description for the picture. It says what is drawn, not whether it passes. */
export function describeScene(scene: OutfitScene): string {
  if (scene.kind === "hand") {
    const parts = ["Back of an athlete's hand and fingers"];
    parts.push(scene.glove === null ? "without a glove" : "with a fingerless glove");
    const words = ["no", "one", "two", "three"];
    const tape = scene.wraps.filter((w) => w.material === "tape").length;
    const plaster = scene.wraps.filter((w) => w.material === "plaster").length;
    if (tape) parts.push(`tape on ${words[tape]} finger${tape > 1 ? "s" : ""}`);
    if (plaster) parts.push(`a sticking plaster on ${words[plaster]} finger${plaster > 1 ? "s" : ""}`);
    return `${parts.join(", ")}.`;
  }
  const parts = [
    scene.clothing === "costume"
      ? `Front view of an athlete in a ${colourName[scene.colour]} one-piece costume`
      : `Front view of an athlete in a ${colourName[scene.colour]} T-shirt and shorts`,
  ];
  if (scene.beltCm !== null) parts.push("a belt");
  if (scene.unitard) parts.push("a unitard under the costume");
  if (scene.shirtSleeveCm !== null) parts.push("a T-shirt under the costume");
  if (scene.shortsCm !== null) parts.push("shorts under the costume");
  if (scene.kneeSupport) parts.push("knee supports");
  if (scene.trunkBandage) parts.push("a bandage on the trunk");
  if (scene.wraps.length) parts.push("bandage or tape on the arms");
  parts.push(scene.footwear ? "sport shoes" : "bare feet");
  return `${parts.join(", ")}.`;
}
