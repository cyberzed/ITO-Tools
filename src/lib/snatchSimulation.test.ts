import { describe, expect, it } from "vitest";
import {
  MIN_BAR_KG,
  automaticProgression,
  attemptsTaken,
  bestLift,
  call,
  change,
  close,
  lowestChange,
  declare,
  finalWeight,
  minWeight,
  phaseOf,
  record as recordCalled,
  requiredCleanAndJerk,
  start,
  total,
  withdrawnLift,
  type Result,
  type SimState,
  type Step,
} from "./snatchSimulation";

/** Call the attempt and record its result, as happens on the platform. */
const record = (s: SimState, r: Result): Step => {
  const called = call(s);
  return called.ok ? recordCalled(called.state, r) : called;
};

/** Unwrap a step that must succeed. */
const ok = (step: Step): SimState => {
  if (!step.ok) throw new Error(step.error);
  return step.state;
};

describe("phases", () => {
  it("starts with attempt 1 declared at the starting weight", () => {
    const s = start(100);
    expect(phaseOf(s)).toEqual({ type: "lift", attempt: 0 });
    expect(finalWeight(s.attempts[0])).toBe(100);
  });

  it("asks for a declaration after a result and ends after attempt 3", () => {
    let s = ok(record(start(100), "good"));
    expect(phaseOf(s)).toEqual({ type: "declare", attempt: 1 });
    s = ok(declare(s, 103, "M"));
    expect(phaseOf(s)).toEqual({ type: "lift", attempt: 1 });
    s = ok(record(s, "no"));
    s = ok(declare(s, 103, "M"));
    s = ok(record(s, "good"));
    expect(phaseOf(s)).toEqual({ type: "done" });
  });
});

describe("automatic progression", () => {
  it("adds 1 kg after a good lift", () => {
    const s = ok(record(start(100), "good"));
    expect(automaticProgression(s, 1)).toBe(101);
  });

  it("keeps the weight after a no lift", () => {
    const s = ok(record(start(100), "no"));
    expect(automaticProgression(s, 1)).toBe(100);
  });

  it("starts from the changed weight, not the declaration", () => {
    const s = ok(record(ok(change(start(100), 104, "M")), "good"));
    expect(automaticProgression(s, 1)).toBe(105);
  });

  it("is unknown before the result of the attempt before, and for attempt 1", () => {
    expect(automaticProgression(start(100), 0)).toBeUndefined();
    expect(automaticProgression(start(100), 1)).toBeUndefined();
  });
});

describe("declare", () => {
  const afterGood = () => ok(record(start(100), "good"));

  it("accepts the automatic progression and heavier weights", () => {
    expect(declare(afterGood(), 101, "M").ok).toBe(true);
    expect(declare(afterGood(), 110, "M").ok).toBe(true);
  });

  it("rejects a weight under the automatic progression", () => {
    const r = declare(afterGood(), 100, "M");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("automatic progression (101 kg)");
  });

  it("rejects fractions", () => {
    expect(declare(afterGood(), 101.5, "M").ok).toBe(false);
  });

  it("rejects a declaration while an attempt is waiting to be taken", () => {
    expect(declare(start(100), 105, "M").ok).toBe(false);
  });
});

describe("change", () => {
  it("allows two changes and then refuses", () => {
    let s = ok(change(start(100), 102, "M"));
    s = ok(change(s, 98, "M"));
    expect(s.attempts[0].changes).toEqual([102, 98]);
    expect(finalWeight(s.attempts[0])).toBe(98);
    const third = change(s, 105, "M");
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.error).toBe("Both changes are used.");
  });

  it("lets the first attempt go down to the empty bar for each gender", () => {
    expect(change(start(100), MIN_BAR_KG.M, "M").ok).toBe(true);
    expect(change(start(100), MIN_BAR_KG.M - 1, "M").ok).toBe(false);
    expect(change(start(100), MIN_BAR_KG.F, "F").ok).toBe(true);
    expect(change(start(100), MIN_BAR_KG.F - 1, "F").ok).toBe(false);
  });

  it("cannot go under the automatic progression on attempt 2", () => {
    const s = ok(declare(ok(record(start(100), "good")), 105, "M"));
    expect(change(s, 100, "M").ok).toBe(false);
    expect(change(s, 101, "M").ok).toBe(true);
  });

  it("rejects the weight already on the bar and fractions", () => {
    expect(change(start(100), 100, "M").ok).toBe(false);
    expect(change(start(100), 100.5, "M").ok).toBe(false);
  });

  it("starts again with two changes on the next attempt", () => {
    let s = ok(change(ok(change(start(100), 102, "M")), 104, "M"));
    s = ok(declare(ok(record(s, "good")), 110, "M"));
    expect(change(s, 108, "M").ok).toBe(true);
  });
});

describe("called weight", () => {
  const called = () => ok(call(start(100)));

  it("cannot be called twice", () => {
    expect(call(called()).ok).toBe(false);
  });

  it("can no longer go under what is loaded and called, but can go up", () => {
    const down = change(called(), 99, "M");
    expect(down.ok).toBe(false);
    if (!down.ok) expect(down.error).toContain("cannot go under what is on the bar (100 kg)");
    const up = ok(change(called(), 101, "M"));
    expect(finalWeight(up.attempts[0])).toBe(101);
  });

  it("raises the lowest change to 1 kg above the bar once called", () => {
    expect(lowestChange(start(100), 0, "M")).toBe(MIN_BAR_KG.M);
    expect(lowestChange(called(), 0, "M")).toBe(101);
  });

  it("keeps the limit of two changes after the call", () => {
    let s = ok(change(called(), 101, "M"));
    s = ok(change(s, 102, "M"));
    expect(change(s, 103, "M").ok).toBe(false);
  });

  it("lets a weight go down freely before the call", () => {
    expect(change(start(100), 90, "M").ok).toBe(true);
  });

  it("has no call after the last attempt", () => {
    let s = ok(record(start(100), "good"));
    s = ok(declare(s, 101, "M"));
    s = ok(record(s, "good"));
    s = ok(declare(s, 102, "M"));
    s = ok(record(s, "good"));
    expect(call(s).ok).toBe(false);
  });
});

describe("results", () => {
  it("cannot record twice for the same attempt", () => {
    const s = ok(record(start(100), "good"));
    expect(record(s, "no").ok).toBe(false);
  });

  it("needs the attempt to be called before a result is recorded", () => {
    const r = recordCalled(start(100), "good");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Call the attempt first.");
  });

  it("finds the best successful snatch", () => {
    let s = ok(record(start(100), "good"));
    s = ok(declare(s, 106, "M"));
    s = ok(record(s, "good"));
    s = ok(declare(s, 112, "M"));
    s = ok(record(s, "no"));
    expect(bestLift(s)).toBe(106);
  });

  it("has no best lift without a good attempt", () => {
    expect(bestLift(ok(record(start(100), "no")))).toBeUndefined();
  });
});

describe("required clean & jerk", () => {
  it("is unknown until the first attempt has a result", () => {
    expect(requiredCleanAndJerk(start(100), 224)).toBeUndefined();
  });

  it("is the 20kg Rule limit minus the first snatch attempt actually taken", () => {
    // Entry total 224: the starting weights must add up to at least 204.
    expect(requiredCleanAndJerk(ok(record(start(92), "good")), 224)).toBe(112);
    // A change to the first attempt counts, because that is the weight taken.
    expect(requiredCleanAndJerk(ok(record(ok(change(start(92), 96, "M")), "no")), 224)).toBe(108);
  });

  it("never goes below zero", () => {
    expect(requiredCleanAndJerk(ok(record(start(300), "good")), 224)).toBe(0);
  });
});

describe("first attempt minimum (20 kg Rule on the clean & jerk)", () => {
  it("raises the lowest first weight above the empty bar", () => {
    expect(minWeight(start(100), 0, "M", 120)).toBe(120);
    expect(minWeight(start(100), 0, "M", 10)).toBe(MIN_BAR_KG.M);
    expect(lowestChange(start(100), 0, "M", 120)).toBe(120);
  });

  it("refuses a change under the minimum with the 20 kg Rule message", () => {
    const r = change(start(130), 119, "M", 120);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("The 20 kg Rule requires at least 120 kg on the first attempt.");
    expect(change(start(130), 120, "M", 120).ok).toBe(true);
  });

  it("will not call a first attempt under the minimum, but calls it once it is raised", () => {
    const low = call(start(100), 120);
    expect(low.ok).toBe(false);
    if (!low.ok) expect(low.error).toContain("20 kg Rule");
    expect(call(ok(change(start(100), 120, "M", 120)), 120).ok).toBe(true);
    expect(call(start(125), 120).ok).toBe(true);
  });

  it("only limits the first attempt, not the later ones", () => {
    const s = ok(record(start(121), "good"));
    expect(minWeight(s, 1, "M", 120)).toBe(122);
  });
});

describe("total", () => {
  const lifted = (weights: [number, Result][]): SimState => {
    let s = start(weights[0][0]);
    weights.forEach(([w, r], i) => {
      if (i > 0) s = ok(declare(s, w, "M"));
      s = ok(record(s, r));
    });
    return s;
  };

  it("adds the best snatch and the best clean & jerk", () => {
    const snatch = lifted([[100, "good"], [101, "good"], [102, "no"]]);
    const cj = lifted([[130, "good"], [131, "no"], [131, "good"]]);
    expect(total(snatch, cj)).toBe(101 + 131);
  });

  it("has no total without a good lift in both", () => {
    const good = lifted([[100, "good"]]);
    const bad = lifted([[100, "no"]]);
    expect(total(good, bad)).toBeUndefined();
    expect(total(bad, good)).toBeUndefined();
  });
});

describe("giving up", () => {
  it("abstaining instead of declaring ends the lift", () => {
    const s = ok(close(ok(record(start(100), "good")), "abstain"));
    expect(phaseOf(s)).toEqual({ type: "done" });
    expect(s.closed).toBe("abstain");
    expect(attemptsTaken(s)).toBe(1);
    expect(bestLift(s)).toBe(100);
  });

  it("can give up a declared weight before it is called", () => {
    const s = ok(close(start(100), "abstain"));
    expect(phaseOf(s)).toEqual({ type: "done" });
    expect(attemptsTaken(s)).toBe(0);
  });

  it("cannot give up once the weight is loaded and called", () => {
    const r = close(ok(call(start(100))), "abstain");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("loaded and called");
  });

  it("has nothing to give up when the lift is over", () => {
    const s = ok(close(start(100), "withdraw"));
    expect(close(s, "abstain").ok).toBe(false);
  });

  it("takes no more steps after the lift is closed", () => {
    const s = ok(close(ok(record(start(100), "good")), "abstain"));
    expect(declare(s, 105, "M").ok).toBe(false);
    expect(call(s).ok).toBe(false);
    expect(change(s, 105, "M").ok).toBe(false);
  });

  it("keeps the kind of closing, abstain or withdraw", () => {
    expect(ok(close(start(100), "withdraw")).closed).toBe("withdraw");
  });

  it("a lift the athlete never started is already over and has no good lift", () => {
    const s = withdrawnLift();
    expect(phaseOf(s)).toEqual({ type: "done" });
    expect(bestLift(s)).toBeUndefined();
    expect(attemptsTaken(s)).toBe(0);
  });
});
