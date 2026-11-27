import { describe, expect, it } from "vitest";
import {
  DEFAULT_SIZE,
  FINAL_CALL_S,
  GROUP_SIZES,
  ONE_MINUTE,
  TWO_MINUTES,
  advance,
  createSim,
  decide,
  formatClock,
  judgeRequest,
  lifters,
  next,
  openAttempt,
  outcomeOf,
  secondsLeft,
  totalAttempts,
  type ChangeRequest,
  type Rng,
  type RequestFacts,
  type Sim,
} from "./marshal";
import { nextLifter } from "./liftingOrder";
import { attemptsTaken, finalWeight } from "./snatchSimulation";

/** A small seeded generator, so every run of a test sees the same group. */
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

const facts = (over: Partial<RequestFacts>): RequestFacts => ({
  from: 100,
  to: 103,
  changesUsed: 0,
  onClock: false,
  secondsLeft: 45,
  ...over,
});

describe("judgeRequest", () => {
  it("accepts any change for an athlete whose clock has not started", () => {
    expect(judgeRequest(facts({ to: 103 })).valid).toBe(true);
    expect(judgeRequest(facts({ to: 97 })).valid).toBe(true);
  });

  it("accepts an increase for the athlete on the clock before the final call", () => {
    expect(judgeRequest(facts({ onClock: true, secondsLeft: 31 })).valid).toBe(true);
    expect(judgeRequest(facts({ onClock: true, secondsLeft: 58 })).valid).toBe(true);
  });

  it("declines an increase at or after the final call, 30 seconds before the end", () => {
    expect(FINAL_CALL_S).toBe(30);
    const v = judgeRequest(facts({ onClock: true, secondsLeft: 30 }));
    expect(v.valid).toBe(false);
    expect(v.why).toMatch(/0:30/);
    expect(judgeRequest(facts({ onClock: true, secondsLeft: 12 })).valid).toBe(false);
  });

  it("declines a decrease once the clock has started", () => {
    const v = judgeRequest(facts({ to: 98, onClock: true, secondsLeft: 50 }));
    expect(v.valid).toBe(false);
    expect(v.rule).toContain("6.6.1");
  });

  it("declines a third change", () => {
    const v = judgeRequest(facts({ changesUsed: 2 }));
    expect(v.valid).toBe(false);
    expect(v.rule).toBe("TCRR 6.6.12");
  });

  it("declines a weight that is not a whole number of kg", () => {
    const v = judgeRequest(facts({ to: 100.5 }));
    expect(v.valid).toBe(false);
    expect(v.rule).toBe("TCRR 6.6.2");
  });
});

describe("a new group", () => {
  it("has two athletes unless four are asked for", () => {
    expect(DEFAULT_SIZE).toBe(2);
    expect(GROUP_SIZES).toEqual([2, 3, 4]);
    expect(createSim(seeded(1), "M", 3).athletes).toHaveLength(3);
    expect(createSim(seeded(1)).athletes).toHaveLength(2);
    expect(createSim(seeded(1), "M", 4).athletes).toHaveLength(4);
    expect(createSim(seeded(1), "F", 2).athletes.every((a) => a.gender === "F")).toBe(true);
  });

  it("calls the first athlete by the calling order, with the clock at the start", () => {
    const sim = createSim(seeded(1), "M", 4);
    expect(sim.round).not.toBeNull();
    expect(sim.round!.start).toBe(nextLifter(lifters(sim))!.start);
    expect(sim.round!.allocated).toBe(ONE_MINUTE);
    expect(secondsLeft(sim.round!)).toBe(ONE_MINUTE);
    const called = sim.athletes.find((a) => a.start === sim.round!.start)!;
    expect(called.lift.attempts[0].called).toBe(true);
  });

  it("has used changes on some first attempts, never more than two", () => {
    for (const size of GROUP_SIZES) {
      for (let seed = 1; seed <= 40; seed++) {
        const sim = createSim(seeded(seed), "M", size);
        const used = sim.athletes.map((a) => a.lift.attempts[0].changes.length);
        expect(Math.max(...used)).toBe(2);
        for (const n of used) expect(n).toBeLessThanOrEqual(2);
      }
    }
  });

  it("hands in cards only at moments that are not exactly the final call", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = createSim(seeded(seed)).round!;
      expect(r.arrivals.length).toBeGreaterThan(0);
      for (const at of r.arrivals) {
        expect(r.allocated - at).not.toBe(FINAL_CALL_S);
        expect(at).toBeLessThan(r.liftAt ?? r.allocated);
      }
    }
  });
});

/** A round with a scripted set of cards, so the checks do not depend on chance. */
function withRequests(sim: Sim, make: (called: number, other: number) => Omit<ChangeRequest, "id" | "verdict">[]): Sim {
  const called = sim.round!.start;
  const other = sim.athletes.find((a) => a.start !== called)!.start;
  const requests = make(called, other).map((r, i) => ({
    ...r,
    id: i + 1,
    verdict: judgeRequest({ from: r.from, to: r.to, changesUsed: r.changesUsed, onClock: r.onClock, secondsLeft: r.secondsLeft }),
  }));
  return { ...sim, round: { ...sim.round!, arrivals: [], liftAt: 40, requests } };
}

const requestFor = (sim: Sim, start: number, to: number, over: Partial<ChangeRequest> = {}) => {
  const a = sim.athletes.find((x) => x.start === start)!;
  const open = openAttempt(a)!;
  return {
    start,
    attempt: open.index + 1,
    from: open.weight,
    to,
    changesUsed: open.changes,
    onClock: start === sim.round!.start,
    secondsLeft: 45,
    ...over,
  };
};

describe("the Marshal's decisions", () => {
  const base = () => createSim(seeded(7));

  it("writes an accepted valid change on the athlete's card", () => {
    let sim = base();
    const called = sim.round!.start;
    const open = openAttempt(sim.athletes.find((a) => a.start === called)!)!;
    // Only try when a change is still free, which the seed above gives the called athlete or not; pick a waiting athlete otherwise.
    const target = open.changes < 2 ? called : sim.athletes.find((a) => a.start !== called && openAttempt(a)!.changes < 2)!.start;
    sim = withRequests(sim, () => [requestFor(sim, target, openAttempt(sim.athletes.find((a) => a.start === target)!)!.weight + 2)]);
    const before = openAttempt(sim.athletes.find((a) => a.start === target)!)!;
    sim = decide(sim, 1, "accept");
    const after = openAttempt(sim.athletes.find((a) => a.start === target)!)!;
    expect(after.changes).toBe(before.changes + 1);
    expect(after.weight).toBe(before.weight + 2);
    expect(sim.round!.requests[0].decision).toBe("accept");
  });

  it("does not write a declined change, or a wrongly accepted one", () => {
    let sim = base();
    const called = sim.round!.start;
    sim = withRequests(sim, () => [
      requestFor(sim, called, openAttempt(sim.athletes.find((a) => a.start === called)!)!.weight - 2, { secondsLeft: 40 }),
    ]);
    const weight = openAttempt(sim.athletes.find((a) => a.start === called)!)!.weight;
    const accepted = decide(sim, 1, "accept"); // a decrease after the clock has started: wrong
    expect(openAttempt(accepted.athletes.find((a) => a.start === called)!)!.weight).toBe(weight);
    const declined = decide(sim, 1, "decline");
    expect(openAttempt(declined.athletes.find((a) => a.start === called)!)!.weight).toBe(weight);
  });

  it("answers a card only once", () => {
    let sim = withRequests(base(), (called) => [requestFor(base(), called, 999, { changesUsed: 2 })]);
    sim = decide(sim, 1, "decline");
    expect(decide(sim, 1, "accept").round!.requests[0].decision).toBe("decline");
  });

  it("rates every kind of answer", () => {
    const sim = base();
    const called = sim.round!.start;
    const valid = { ...requestFor(sim, called, 0), to: finalWeight(sim.athletes[0].lift.attempts[0]) + 1, changesUsed: 0, secondsLeft: 50 };
    const rate = (r: Partial<ChangeRequest>) => {
      const req = { id: 1, ...valid, ...r } as ChangeRequest;
      req.verdict = judgeRequest({ ...req });
      return outcomeOf(req).outcome;
    };
    expect(rate({ decision: "accept" })).toBe("right");
    expect(rate({ decision: "decline" })).toBe("wrong");
    expect(rate({})).toBe("missed");
    expect(rate({ changesUsed: 2, decision: "decline" })).toBe("right");
    expect(rate({ changesUsed: 2, decision: "accept" })).toBe("wrong");
    expect(rate({ changesUsed: 2 })).toBe("missed");
  });
});

describe("the athlete raises the bar", () => {
  it("checks the decisions, records the attempt and holds the clock", () => {
    let sim = createSim(seeded(11));
    const called = sim.round!.start;
    sim = withRequests(sim, () => [
      requestFor(sim, called, 500, { changesUsed: 2 }), // third change: decline
      requestFor(sim, sim.athletes.find((a) => a.start !== called)!.start, 999, { changesUsed: 0, onClock: false }), // valid: accept
    ]);
    sim = decide(sim, 1, "decline");
    sim = decide(sim, 2, "accept");
    sim = advance(sim, 100, seeded(1));
    expect(sim.round).toBeNull();
    expect(sim.report).not.toBeNull();
    expect(sim.report!.items.map((i) => i.outcome)).toEqual(["right", "right"]);
    expect(sim.score).toEqual({ right: 2, total: 2 });
    expect(sim.taken).toBe(1);
    const lifter = sim.athletes.find((a) => a.start === called)!;
    expect(attemptsTaken(lifter.lift)).toBe(1);
    expect(lifter.orders).toEqual([1]);
    // The clock is stopped: nothing moves until the Marshal continues.
    expect(advance(sim, 10, seeded(1))).toBe(sim);
  });

  it("counts a card that was left unanswered as missed", () => {
    let sim = createSim(seeded(12));
    sim = withRequests(sim, () => [requestFor(sim, sim.round!.start, 500, { changesUsed: 2 })]);
    sim = advance(sim, 100, seeded(1));
    expect(sim.report!.items[0].outcome).toBe("missed");
    expect(sim.score).toEqual({ right: 0, total: 1 });
  });

  it("calls the next athlete when the Marshal continues, with the calling order", () => {
    let sim = createSim(seeded(13));
    sim = advance(sim, 1000, seeded(2));
    const first = sim.report!.start;
    sim = next(sim, seeded(3));
    expect(sim.report).toBeNull();
    expect(sim.round).not.toBeNull();
    expect(sim.round!.start).toBe(nextLifter(lifters(sim))!.start);
    expect(sim.round!.attempt).toBeGreaterThanOrEqual(1);
    expect(typeof first).toBe("number");
  });

  it("gives two minutes to an athlete who lifts twice in a row", () => {
    // Search for a group where the same athlete is called again straight away.
    let found = false;
    for (let seed = 1; seed <= 400 && !found; seed++) {
      let sim = createSim(seeded(seed));
      sim = advance(sim, 1000, seeded(seed));
      const first = sim.report!.start;
      sim = next(sim, seeded(seed));
      if (sim.round && sim.round.start === first) {
        expect(sim.round.allocated).toBe(TWO_MINUTES);
        found = true;
      } else if (sim.round) {
        expect(sim.round.allocated).toBe(ONE_MINUTE);
      }
    }
    expect(found).toBe(true);
  });

  it("is a no lift when the time runs out", () => {
    let hit = false;
    for (let seed = 1; seed <= 300 && !hit; seed++) {
      const sim = createSim(seeded(seed));
      if (sim.round!.liftAt !== null) continue;
      const done = advance(sim, 1000, seeded(seed));
      expect(done.report!.result).toBe("timeout");
      expect(done.report!.secondsLeft).toBe(0);
      const a = done.athletes.find((x) => x.start === sim.round!.start)!;
      expect(a.lift.attempts[0].result).toBe("no");
      hit = true;
    }
    expect(hit).toBe(true);
  });
});

describe("a whole snatch", () => {
  it.each(GROUP_SIZES)("runs to the end with every athlete's three attempts in a group of %i, whatever the Marshal does", (size) => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = seeded(seed);
      let sim = createSim(rng, "M", size);
      let requests = 0;
      let guard = 0;
      while (!sim.done && guard++ < 5000) {
        if (sim.report) {
          requests += sim.report.items.length;
          sim = next(sim, rng);
          continue;
        }
        // Answer every card at random, and sometimes leave one.
        for (const r of sim.round!.requests) {
          if (!r.decision && rng.chance(70)) sim = decide(sim, r.id, rng.chance(50) ? "accept" : "decline");
        }
        sim = advance(sim, 1, rng);
      }
      requests += sim.report?.items.length ?? 0;
      expect(sim.done).toBe(true);
      expect(sim.taken).toBe(totalAttempts(sim));
      expect(sim.taken).toBe(size * 3);
      for (const a of sim.athletes) {
        expect(attemptsTaken(a.lift)).toBe(3);
        expect(a.orders).toEqual(a.orders.slice().sort((x, y) => x - y));
      }
      expect(sim.score.total).toBe(requests);
      expect(sim.score.right).toBeLessThanOrEqual(sim.score.total);
    }
  });

  it("only hands in cards whose verdict follows the rule", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = seeded(seed);
      let sim = createSim(rng, "F", GROUP_SIZES[seed % 3]);
      let guard = 0;
      while (!sim.done && guard++ < 5000) {
        if (sim.report) {
          for (const i of sim.report.items) {
            const r = i.request;
            expect(r.verdict).toEqual(
              judgeRequest({ from: r.from, to: r.to, changesUsed: r.changesUsed, onClock: r.onClock, secondsLeft: r.secondsLeft }),
            );
            expect(r.to).not.toBe(r.from);
          }
          sim = next(sim, rng);
        } else sim = advance(sim, 1, rng);
      }
    }
  });
});

it("formats the clock", () => {
  expect(formatClock(0)).toBe("0:00");
  expect(formatClock(65)).toBe("1:05");
  expect(formatClock(120)).toBe("2:00");
});
