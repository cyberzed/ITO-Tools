/**
 * The Chief Marshal's table: two to four athletes in a snatch, a clock that runs for the athlete who is
 * called, and coaches who hand in changes of weight. The Marshal accepts or declines each one.
 *
 * Source: IWF TCRR 2026, 7.9 and the Regulation to 7.9 (Chief Marshal), 6.6.1 to 6.6.3, 6.6.7,
 * 6.6.8 and 6.6.10 to 6.6.15. The simulation is pure: every function returns a new state, and the
 * clock only moves when `advance` is called, so it can be tested without waiting.
 */
import { bodyWeightRange, categoryFor, type Gender } from "./categories";
import { ATTEMPTS, nextLifter, lastNamesForGroups, type Lifter } from "./liftingOrder";
import { pick, randBelow, randInt } from "./random";
import { MAX_LOT, firstNames, signatureOf } from "./sessionAthlete";
import {
  MAX_CHANGES,
  automaticProgression,
  call,
  change,
  declare,
  finalWeight,
  minWeight,
  phaseOf,
  record,
  start,
  type SimState,
} from "./snatchSimulation";

/** The group sizes to practise with. Two is the default, and three or four give a fuller table. */
export const GROUP_SIZES = [2, 3, 4] as const;
export type GroupSize = (typeof GROUP_SIZES)[number];
export const DEFAULT_SIZE: GroupSize = 2;

/**
 * How the answers are checked. In the exam every card is checked when the athlete raises the
 * bar. In learning mode the screen also shows the check of a card as soon as it is answered.
 * The simulation itself is the same in both, so the score does not depend on the mode.
 */
export const MODES = ["exam", "learning"] as const;
export type Mode = (typeof MODES)[number];
export const DEFAULT_MODE: Mode = "exam";
export const modeName: Record<Mode, string> = { exam: "Exam", learning: "Learning" };
/** An athlete has one minute, or two minutes for an attempt right after their own (6.6.7). */
export const ONE_MINUTE = 60;
export const TWO_MINUTES = 120;
/** The final call sounds this many seconds before the end of the time (6.6.11). */
export const FINAL_CALL_S = 30;
/** About this share of the attempts is a good lift. */
export const GOOD_PERCENT = 70;
/** How often an athlete does not lift the bar in time. */
export const TIMEOUT_PERCENT = 12;

/** Randomness, so tests can decide what happens. */
export interface Rng {
  int(min: number, max: number): number;
  chance(percent: number): boolean;
  pick<T>(list: readonly T[]): T;
}

export const defaultRng: Rng = {
  int: randInt,
  chance: (percent) => randBelow(100) < percent,
  pick,
};

/** Minutes and seconds, such as 1:05. */
export const formatClock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export interface MarshalAthlete {
  start: number;
  name: string;
  gender: Gender;
  lot: number;
  /** The athlete's signature, used for the entries on the card. */
  signature: string;
  birthDate: string;
  bodyWeight: number;
  category: string;
  entryTotal: number;
  lift: SimState;
  /** The calling order number of each attempt taken, in the order of the athlete's attempts. */
  orders: number[];
}

export interface Verdict {
  valid: boolean;
  /** Why the request is right or wrong to accept, in words. */
  why: string;
  rule: string;
}

export interface RequestFacts {
  from: number;
  to: number;
  /** How many changes the attempt already has. */
  changesUsed: number;
  /** The athlete is the one whose clock is running. */
  onClock: boolean;
  /** What the clock showed when the card was handed in. Only matters for the athlete on the clock. */
  secondsLeft: number;
}

/**
 * Whether the Marshal should accept a change. A change needs a whole number of kg (6.6.2) and a
 * free change out of two (6.6.12). Once the clock has started the weight cannot go down (6.6.1,
 * 6.6.10), and it can go up only before the final call (6.6.10, 6.6.11).
 */
export function judgeRequest(f: RequestFacts): Verdict {
  if (!Number.isInteger(f.to)) {
    return { valid: false, why: `${f.to} kg is not a whole number of kg. The weight of the barbell is always a multiple of 1 kg.`, rule: "TCRR 6.6.2" };
  }
  if (f.changesUsed >= MAX_CHANGES) {
    return { valid: false, why: "Both changes of this attempt are already used. A declaration enables only two changes.", rule: "TCRR 6.6.12" };
  }
  if (f.onClock && f.to < f.from) {
    return { valid: false, why: "The clock has started for this athlete, so the weight cannot be reduced any more.", rule: "TCRR 6.6.1, 6.6.10" };
  }
  if (f.onClock && f.secondsLeft <= FINAL_CALL_S) {
    return {
      valid: false,
      why: `The clock showed ${formatClock(f.secondsLeft)} when the card was handed in. The final call sounds at 0:30, and an increase must be signed before it.`,
      rule: "TCRR 6.6.10, 6.6.11",
    };
  }
  if (f.onClock) {
    return {
      valid: true,
      why: `The card was handed in with ${formatClock(f.secondsLeft)} left, before the final call at 0:30, and a change is still free.`,
      rule: "TCRR 6.6.10, 6.6.11",
    };
  }
  return {
    valid: true,
    why: "The clock has not started for this athlete, so the weight can still go up or down, and a change is still free.",
    rule: "TCRR 6.6.1, 6.6.10",
  };
}

export type Decision = "accept" | "decline";

export interface ChangeRequest {
  id: number;
  /** The start number of the athlete. */
  start: number;
  /** The attempt, 1 to 3. */
  attempt: number;
  from: number;
  to: number;
  changesUsed: number;
  onClock: boolean;
  /** The clock reading when the card was handed in, for the athlete on the clock. */
  secondsLeft: number;
  verdict: Verdict;
  decision?: Decision;
}

export interface Round {
  /** The athlete who is called. */
  start: number;
  /** The attempt, 1 to 3. */
  attempt: number;
  allocated: number;
  elapsed: number;
  /** When the athlete raises the bar, in seconds on the clock. Null when the time runs out first. */
  liftAt: number | null;
  /** The moments, in seconds, when a coach hands in a card. Taken off the front as they happen. */
  arrivals: number[];
  requests: ChangeRequest[];
}

export type Outcome = "right" | "wrong" | "missed";

export interface ReportItem {
  request: ChangeRequest;
  outcome: Outcome;
  text: string;
}

export interface Report {
  start: number;
  name: string;
  attempt: number;
  weight: number;
  result: "good" | "no" | "timeout";
  /** Seconds left on the clock when the athlete raised the bar. */
  secondsLeft: number;
  items: ReportItem[];
}

export interface Sim {
  gender: Gender;
  athletes: MarshalAthlete[];
  round: Round | null;
  /** The check of the Marshal's decisions, shown when the athlete raises the bar. */
  report: Report | null;
  /** The number of attempts taken so far, which is also the next calling order number minus one. */
  taken: number;
  /** The athlete who lifted last, for the two minutes of an athlete who lifts twice in a row. */
  lastStart: number | null;
  nextId: number;
  score: { right: number; total: number };
  done: boolean;
}

/** The athletes as the calling order sees them. */
export function lifters(sim: Sim): Lifter[] {
  return sim.athletes.map((a) => {
    const phase = phaseOf(a.lift);
    const open = phase.type === "lift" ? a.lift.attempts[phase.attempt] : undefined;
    return {
      start: a.start,
      lot: a.lot,
      name: a.name,
      next: open ? finalWeight(open) : null,
      attempts: a.lift.attempts
        .filter((x) => x.result)
        .map((x, i) => ({ weight: finalWeight(x), good: x.result === "good", order: a.orders[i] })),
      changes: open ? open.changes.length : 0,
    };
  });
}

/** The attempt an athlete has open, with its index, or undefined when there is none. */
export function openAttempt(a: MarshalAthlete): { index: number; weight: number; changes: number } | undefined {
  const phase = phaseOf(a.lift);
  if (phase.type !== "lift") return undefined;
  const attempt = a.lift.attempts[phase.attempt];
  return { index: phase.attempt, weight: finalWeight(attempt), changes: attempt.changes.length };
}

const pad = (n: number) => String(n).padStart(2, "0");

function birthDate(rng: Rng): string {
  return `${pad(rng.int(1, 28))}.${pad(rng.int(1, 12))}.${rng.int(1990, 2008)}`;
}

/** A new group in the snatch, with the first athlete called and the clock stopped at its start. */
export function createSim(
  rng: Rng = defaultRng,
  gender: Gender = rng.pick(["M", "F"] as const),
  size: GroupSize = DEFAULT_SIZE,
): Sim {
  const base = gender === "M" ? rng.int(100, 140) : rng.int(70, 100);
  // A few starting weights for the whole group, so athletes share one and the later factors of the calling order come up.
  const weights = [base + rng.int(-5, 5), base + rng.int(-5, 5)];
  const lots: number[] = [];
  while (lots.length < size) {
    const lot = rng.int(1, MAX_LOT);
    if (!lots.includes(lot)) lots.push(lot);
  }
  lots.sort((a, b) => a - b);
  const lastNames = [...lastNamesForGroups];
  const range = bodyWeightRange(gender);

  const athletes: MarshalAthlete[] = lots.map((lot, i) => {
    const last = lastNames.splice(rng.int(0, lastNames.length - 1), 1)[0];
    const name = `${rng.pick(firstNames[gender])} ${last}`;
    const bodyWeight = rng.int(range.min * 100, range.max * 100) / 100;
    const first = rng.pick(weights);
    return {
      start: i + 1,
      name,
      gender,
      lot,
      signature: signatureOf(name),
      birthDate: birthDate(rng),
      bodyWeight,
      category: categoryFor(gender, bodyWeight).label,
      entryTotal: first + Math.round(first * 1.25) + rng.int(5, 15),
      lift: start(first),
      orders: [],
    };
  });

  // Before the group starts, some coaches have already changed the first attempt once or twice.
  const used = rng.int(0, size - 1);
  const other = (used + rng.int(1, size - 1)) % size;
  const raised = athletes.map((a, i) => {
    const times = i === used ? 2 : i === other && rng.chance(60) ? 1 : 0;
    let lift = a.lift;
    for (let n = 0; n < times; n++) {
      const step = change(lift, finalWeight(lift.attempts[0]) + rng.int(1, 3), gender);
      if (step.ok) lift = step.state;
    }
    return { ...a, lift };
  });

  const sim: Sim = {
    gender,
    athletes: raised,
    round: null,
    report: null,
    taken: 0,
    lastStart: null,
    nextId: 1,
    score: { right: 0, total: 0 },
    done: false,
  };
  return startRound(sim, rng);
}

/** The arrival moment must not fall exactly on the final call, where the rule would be arguable. */
const awayFromFinalCall = (at: number, allocated: number) => (allocated - at === FINAL_CALL_S ? at + 1 : at);

/** Call the next athlete by the calling order: the weight is loaded and the clock starts. */
export function startRound(sim: Sim, rng: Rng = defaultRng): Sim {
  const due = nextLifter(lifters(sim));
  if (!due) return { ...sim, round: null, done: true };
  const athlete = sim.athletes.find((a) => a.start === due.start)!;
  const called = call(athlete.lift);
  if (!called.ok) throw new Error(called.error);

  const allocated = sim.lastStart === due.start ? TWO_MINUTES : ONE_MINUTE;
  const timedOut = rng.chance(TIMEOUT_PERCENT);
  const liftAt = timedOut ? null : rng.int(Math.round(allocated * 0.3), allocated - 6);
  const limit = (liftAt ?? allocated) - 1;
  const count = rng.int(1, 3);
  const arrivals = Array.from({ length: count }, () => awayFromFinalCall(rng.int(3, limit - 1), allocated)).sort((a, b) => a - b);

  const attempt = phaseOf(athlete.lift);
  return {
    ...sim,
    athletes: sim.athletes.map((a) => (a === athlete ? { ...a, lift: called.state } : a)),
    round: {
      start: due.start,
      attempt: (attempt.type === "lift" ? attempt.attempt : 0) + 1,
      allocated,
      elapsed: 0,
      liftAt,
      arrivals,
      requests: [],
    },
  };
}

/** The seconds left on the clock, rounded up like a clock that counts down. */
export const secondsLeft = (round: Round): number => Math.ceil(round.allocated - round.elapsed);

/** A coach hands in a card. It goes to an athlete with an open attempt and no card waiting. */
function makeRequest(sim: Sim, round: Round, at: number, rng: Rng): ChangeRequest | null {
  const waiting = new Set(round.requests.filter((r) => !r.decision).map((r) => r.start));
  const candidates = sim.athletes.filter((a) => openAttempt(a) && !waiting.has(a.start));
  if (!candidates.length) return null;
  // The athlete on the clock is the one the coaches worry about most.
  const onClock = candidates.find((a) => a.start === round.start);
  const athlete = onClock && rng.chance(45) ? onClock : rng.pick(candidates);
  const open = openAttempt(athlete)!;
  const lowest = minWeight(athlete.lift, open.index, athlete.gender);

  const canLower = open.weight - 1 >= lowest;
  const roll = rng.int(1, 100);
  const to =
    roll <= 6
      ? open.weight + 0.5
      : roll <= 50 || !canLower
        ? open.weight + rng.int(1, 4)
        : rng.int(Math.max(lowest, open.weight - 4), open.weight - 1);

  const facts: RequestFacts = {
    from: open.weight,
    to,
    changesUsed: open.changes,
    onClock: athlete.start === round.start,
    secondsLeft: Math.ceil(round.allocated - at),
  };
  return {
    id: sim.nextId,
    start: athlete.start,
    attempt: open.index + 1,
    from: facts.from,
    to,
    changesUsed: facts.changesUsed,
    onClock: facts.onClock,
    secondsLeft: facts.secondsLeft,
    verdict: judgeRequest(facts),
  };
}

/** Let the clock run for `dt` seconds. Coaches hand in cards on the way, and the athlete raises the bar at the end. */
export function advance(sim: Sim, dt: number, rng: Rng = defaultRng): Sim {
  if (!sim.round || sim.report || sim.done) return sim;
  let s = sim;
  const end = s.round!.liftAt ?? s.round!.allocated;
  const target = Math.min(s.round!.elapsed + dt, end);
  while (s.round!.arrivals.length && s.round!.arrivals[0] <= target) {
    const [at, ...rest] = s.round!.arrivals;
    const request = makeRequest(s, s.round!, at, rng);
    s = {
      ...s,
      nextId: request ? s.nextId + 1 : s.nextId,
      round: { ...s.round!, arrivals: rest, requests: request ? [...s.round!.requests, request] : s.round!.requests },
    };
  }
  s = { ...s, round: { ...s.round!, elapsed: target } };
  return target >= end ? finishRound(s, rng) : s;
}

/** The Marshal accepts or declines a card. An accepted change that is right goes on the athlete's card. */
export function decide(sim: Sim, id: number, decision: Decision): Sim {
  const round = sim.round;
  const request = round?.requests.find((r) => r.id === id);
  if (!round || !request || request.decision || sim.report) return sim;
  let athletes = sim.athletes;
  if (decision === "accept" && request.verdict.valid) {
    athletes = athletes.map((a) => {
      if (a.start !== request.start) return a;
      const step = change(a.lift, request.to, a.gender);
      return step.ok ? { ...a, lift: step.state } : a;
    });
  }
  return {
    ...sim,
    athletes,
    round: { ...round, requests: round.requests.map((r) => (r.id === id ? { ...r, decision } : r)) },
  };
}

/** How one decision turned out, once the athlete has raised the bar. */
export function outcomeOf(r: ChangeRequest): { outcome: Outcome; text: string } {
  const v = r.verdict;
  const tail = `${v.why} (${v.rule})`;
  if (!r.decision) {
    return {
      outcome: "missed",
      text: v.valid
        ? `You did not answer. The change should have been accepted, so the athlete lifts the old weight. ${tail}`
        : `You did not answer. The change should have been declined. ${tail}`,
    };
  }
  if (r.decision === "accept") {
    return v.valid
      ? { outcome: "right", text: `Accepted, which is right. ${tail}` }
      : { outcome: "wrong", text: `You accepted it, but it should have been declined. ${tail}` };
  }
  return v.valid
    ? { outcome: "wrong", text: `You declined it, but it should have been accepted. ${tail}` }
    : { outcome: "right", text: `Declined, which is right. ${tail}` };
}

/** The athlete raises the bar, or the time runs out. Check every card of the round and record the attempt. */
function finishRound(sim: Sim, rng: Rng): Sim {
  const round = sim.round!;
  const athlete = sim.athletes.find((a) => a.start === round.start)!;
  const open = openAttempt(athlete)!;
  const items = round.requests.map((request) => ({ request, ...outcomeOf(request) }));
  const timedOut = round.liftAt === null;
  const good = !timedOut && rng.chance(GOOD_PERCENT);

  const recorded = record(athlete.lift, good ? "good" : "no");
  if (!recorded.ok) throw new Error(recorded.error);
  let lift = recorded.state;
  // The coach declares the next attempt as the automatic progression.
  const next = phaseOf(lift);
  if (next.type === "declare") {
    const declared = declare(lift, automaticProgression(lift, next.attempt)!, athlete.gender);
    if (declared.ok) lift = declared.state;
  }
  const order = sim.taken + 1;
  const athletes = sim.athletes.map((a) => (a === athlete ? { ...a, lift, orders: [...a.orders, order] } : a));
  const right = items.filter((i) => i.outcome === "right").length;

  const after: Sim = { ...sim, athletes, taken: order, lastStart: athlete.start };
  const finished = !nextLifter(lifters(after));
  return {
    ...after,
    round: null,
    done: finished,
    score: { right: sim.score.right + right, total: sim.score.total + items.length },
    report: {
      start: athlete.start,
      name: athlete.name,
      attempt: round.attempt,
      weight: open.weight,
      result: timedOut ? "timeout" : good ? "good" : "no",
      secondsLeft: Math.max(0, Math.ceil(round.allocated - round.elapsed)),
      items,
    },
  };
}

/** Close the report and call the next athlete. */
export function next(sim: Sim, rng: Rng = defaultRng): Sim {
  if (!sim.report) return sim;
  const cleared = { ...sim, report: null };
  return sim.done ? cleared : startRound(cleared, rng);
}

/** Every athlete takes three attempts. */
export const totalAttempts = (sim: Sim): number => sim.athletes.length * ATTEMPTS;
