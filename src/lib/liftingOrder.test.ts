import { expect, it } from "vitest";
import {
  changeWeight,
  compareLifters,
  generateGroup,
  nextLifter,
  takeAttempt,
  whyFirst,
  type Lifter,
} from "./liftingOrder";
import { exampleGroups } from "./liftingOrderExample";

const lifter = (start: number, next: number, attempts: [number, number][] = []): Lifter => ({
  start,
  lot: start,
  name: `S${start}`,
  next,
  attempts: attempts.map(([weight, order]) => ({ weight, order, good: true })),
  changes: 0,
});

it("reproduces every calling order number in the rulebook's example", () => {
  for (const { group, athletes } of exampleGroups) {
    for (const lift of ["snatch", "cleanAndJerk"] as const) {
      // Replay the lift: everyone asks for the weight they took next, and we call who the rules say.
      let lifters: Lifter[] = athletes.map((a) => ({
        start: a.start,
        lot: a.lot,
        name: a.name,
        next: a[lift][0]?.[0] ?? null,
        attempts: [],
        changes: 0,
      }));
      const called: string[] = [];
      for (let n = nextLifter(lifters); n; n = nextLifter(lifters)) {
        called.push(n.name);
        lifters = takeAttempt(lifters, n.start, true);
        lifters = lifters.map((l) => {
          const a = athletes.find((x) => x.start === l.start)!;
          return { ...l, next: l.attempts.length < 3 ? (a[lift][l.attempts.length]?.[0] ?? null) : null };
        });
      }
      const expected = athletes
        .flatMap((a) => a[lift].flatMap((x) => (x ? [{ name: a.name, order: x[1] }] : [])))
        .sort((p, q) => p.order - q.order)
        .map((p) => p.name);
      expect(called, `group ${group}, ${lift}`).toEqual(expected);
    }
  }
});

it("puts the lighter weight first, whatever else", () => {
  expect(compareLifters(lifter(5, 99, [[99, 1]]), lifter(1, 100))).toBeLessThan(0);
});

it("at the same weight, puts the lower attempt number first", () => {
  expect(compareLifters(lifter(1, 100, [[100, 1]]), lifter(5, 100))).toBeGreaterThan(0);
});

it("at the same weight and attempt, puts whoever lifted earlier first", () => {
  expect(compareLifters(lifter(1, 100, [[95, 4]]), lifter(5, 100, [[96, 2]]))).toBeGreaterThan(0);
});

it("otherwise puts the lower start number first", () => {
  expect(compareLifters(lifter(2, 100), lifter(3, 100))).toBeLessThan(0);
});

it("names the factor that decides", () => {
  expect(whyFirst(lifter(5, 99), lifter(1, 100)).factor).toBe(1);
  expect(whyFirst(lifter(5, 100), lifter(1, 100, [[100, 1]])).factor).toBe(2);
  expect(whyFirst(lifter(5, 100, [[96, 2]]), lifter(1, 100, [[95, 4]])).factor).toBe(3);
  const why = whyFirst(lifter(2, 100), lifter(3, 100));
  expect(why.factor).toBe(4);
  expect(why.text).toContain("start number 2");
});

it("adds 1 kg after a good lift and keeps the weight after a no lift", () => {
  let ls = [lifter(1, 100), lifter(2, 101)];
  ls = takeAttempt(ls, 1, true);
  expect(ls[0].next).toBe(101);
  expect(ls[0].attempts).toEqual([{ weight: 100, good: true, order: 1 }]);
  ls = takeAttempt(ls, 2, false);
  expect(ls[1].next).toBe(101);
  expect(ls[1].attempts[0].order).toBe(2);
});

it("has nothing left after three attempts", () => {
  let ls = [lifter(1, 100)];
  for (let i = 0; i < 3; i++) ls = takeAttempt(ls, 1, false);
  expect(ls[0].next).toBeNull();
  expect(nextLifter(ls)).toBeNull();
});

it("counts the changes and resets them after the attempt", () => {
  let ls = changeWeight([lifter(1, 100)], 1, 103);
  expect(ls[0]).toMatchObject({ next: 103, changes: 1 });
  ls = takeAttempt(ls, 1, true);
  expect(ls[0].changes).toBe(0);
});

it("generates a group with start numbers in lot order and shared starting weights", () => {
  for (let i = 0; i < 200; i++) {
    const g = generateGroup(i % 2 ? "M" : "F", 8, "snatch");
    expect(g.map((l) => l.start)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(g.map((l) => l.lot)).toEqual([...g.map((l) => l.lot)].sort((a, b) => a - b));
    expect(new Set(g.map((l) => l.lot)).size).toBe(8);
    expect(new Set(g.map((l) => l.name.split(" ")[1])).size).toBe(8);
    expect(new Set(g.map((l) => l.next)).size).toBeLessThan(8);
  }
});
