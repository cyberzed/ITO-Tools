/**
 * The three attempts of one lift (snatch or clean & jerk), one step at a time.
 * Rules: IWF TCRR 2026 (reference/IWF-TCRR-2026.pdf), 6.6.2-6.6.5, 6.6.10 and 6.6.12.
 *
 * `firstMin` is a lowest weight for the first attempt on top of the empty bar. The clean & jerk
 * uses it for the 20 kg Rule.
 */
import type { Gender } from "./categories";
import { twentyKgRuleLimit } from "./rules";

export type Result = "good" | "no";

export interface SimAttempt {
  /** Starting weight (attempt 1) or the declaration (attempts 2 and 3). */
  declaration: number;
  /** Weight changes after the declaration, oldest first. At most MAX_CHANGES. */
  changes: number[];
  /** The weight is loaded and called: the clock has started, so the weight can only go up (6.6.10). */
  called?: boolean;
  result?: Result;
}

/** How a lift ended early: the rest of this lift is given up, or the athlete is out of the competition. */
export type Closed = "abstain" | "withdraw";

export interface SimState {
  attempts: SimAttempt[];
  /** Set when the athlete gave up the rest of the lift. No more attempts are taken. */
  closed?: Closed;
}

/** A declaration enables two changes (6.6.12). */
export const MAX_CHANGES = 2;

/** The lightest weight that can be lifted: the empty bar with collars and two 0.5 kg discs (6.6.4). */
export const MIN_BAR_KG: Record<Gender, number> = { M: 26, F: 21 };

export type Phase =
  | { type: "lift"; attempt: number } // the weight is declared: change it or take the lift
  | { type: "declare"; attempt: number } // the next weight must be declared
  | { type: "done" };

export type Step = { ok: true; state: SimState } | { ok: false; error: string };

/** Attempt 1 starts with the starting weight given at weigh-in. */
export const start = (startingWeight: number): SimState => ({
  attempts: [{ declaration: startingWeight, changes: [] }],
});

/** The weight on the bar: the latest change, or the declaration if nothing changed. */
export const finalWeight = (a: SimAttempt): number => a.changes[a.changes.length - 1] ?? a.declaration;

export function phaseOf(state: SimState): Phase {
  if (state.closed) return { type: "done" };
  const last = state.attempts[state.attempts.length - 1];
  if (!last.result) return { type: "lift", attempt: state.attempts.length - 1 };
  if (state.attempts.length === 3) return { type: "done" };
  return { type: "declare", attempt: state.attempts.length };
}

/**
 * The weight an athlete gets with no declaration: 1 kg more after a good lift,
 * the same weight after a no lift (6.6.3). Only known once the attempt before has a result.
 */
export function automaticProgression(state: SimState, attempt: number): number | undefined {
  const prev = state.attempts[attempt - 1];
  if (attempt < 1 || !prev?.result) return undefined;
  return finalWeight(prev) + (prev.result === "good" ? 1 : 0);
}

/**
 * The lowest weight allowed for the attempt. Assumption: a declaration or change cannot go
 * below the automatic progression. The first attempt can go down to the empty bar.
 */
export function minWeight(state: SimState, attempt: number, gender: Gender, firstMin = 0): number {
  return automaticProgression(state, attempt) ?? Math.max(MIN_BAR_KG[gender], firstMin);
}

/**
 * The lowest weight a change can have now. Before the attempt is called it is the minimum
 * weight. Once the weight is loaded and called it cannot go under what is on the bar (6.6.10).
 */
export function lowestChange(state: SimState, attempt: number, gender: Gender, firstMin = 0): number {
  const a = state.attempts[attempt];
  return a?.called ? finalWeight(a) + 1 : minWeight(state, attempt, gender, firstMin);
}

function checkWeight(
  state: SimState,
  attempt: number,
  weight: number,
  gender: Gender,
  firstMin: number,
): string | undefined {
  if (!Number.isInteger(weight)) return "The weight must be a whole number of kg (6.6.2).";
  const min = minWeight(state, attempt, gender, firstMin);
  if (weight < min) {
    if (attempt > 0) return `The weight cannot be lower than the automatic progression (${min} kg).`;
    if (firstMin > MIN_BAR_KG[gender]) return `The 20 kg Rule requires at least ${min} kg on the first attempt.`;
    return `The weight cannot be lighter than the empty bar (${min} kg).`;
  }
  return undefined;
}

/** Declare the next attempt (attempts 2 and 3). */
export function declare(state: SimState, weight: number, gender: Gender, firstMin = 0): Step {
  const phase = phaseOf(state);
  if (phase.type !== "declare") return { ok: false, error: "There is nothing to declare now." };
  const error = checkWeight(state, phase.attempt, weight, gender, firstMin);
  if (error) return { ok: false, error };
  return { ok: true, state: { attempts: [...state.attempts, { declaration: weight, changes: [] }] } };
}

/** Change the weight of the attempt that is about to be taken. */
export function change(state: SimState, weight: number, gender: Gender, firstMin = 0): Step {
  const phase = phaseOf(state);
  if (phase.type !== "lift") return { ok: false, error: "There is no attempt to change now." };
  const current = state.attempts[phase.attempt];
  if (current.changes.length >= MAX_CHANGES) return { ok: false, error: "Both changes are used." };
  const error = checkWeight(state, phase.attempt, weight, gender, firstMin);
  if (error) return { ok: false, error };
  if (weight === finalWeight(current)) return { ok: false, error: "That is already the weight on the bar." };
  if (current.called && weight < finalWeight(current)) {
    return {
      ok: false,
      error: `The weight is loaded and called, so it cannot go under what is on the bar (${finalWeight(current)} kg).`,
    };
  }
  const attempts = state.attempts.map((a, i) => (i === phase.attempt ? { ...a, changes: [...a.changes, weight] } : a));
  return { ok: true, state: { attempts } };
}

/** The Speaker calls the weight, it is loaded and the clock starts. Changes can only go up from here. */
export function call(state: SimState, firstMin = 0): Step {
  const phase = phaseOf(state);
  if (phase.type !== "lift") return { ok: false, error: "There is no attempt to call now." };
  const current = state.attempts[phase.attempt];
  if (current.called) return { ok: false, error: "The attempt is already called." };
  if (phase.attempt === 0 && finalWeight(current) < firstMin) {
    return { ok: false, error: `The 20 kg Rule requires at least ${firstMin} kg on the first attempt.` };
  }
  const attempts = state.attempts.map((a, i) => (i === phase.attempt ? { ...a, called: true } : a));
  return { ok: true, state: { attempts } };
}

/** How many attempts were taken, which is also the first column that is given up when the lift is closed. */
export const attemptsTaken = (state: SimState): number => state.attempts.filter((a) => a.result).length;

/**
 * The athlete signs the card to give up the rest of the lift (6.6.14). It works instead of a
 * declaration, or before the declared weight is called. Once a weight is called it has to be taken.
 */
export function close(state: SimState, kind: Closed): Step {
  const phase = phaseOf(state);
  if (phase.type === "done") return { ok: false, error: "There is nothing left to give up." };
  if (phase.type === "lift" && state.attempts[phase.attempt].called) {
    return { ok: false, error: "The weight is loaded and called, so the attempt has to be taken." };
  }
  return { ok: true, state: { ...state, closed: kind } };
}

/** The state of a lift the athlete never started, because they withdrew from the competition. */
export const withdrawnLift = (): SimState => ({ attempts: [], closed: "withdraw" });

/** Record the result of the attempt that is about to be taken. It must be called first. */
export function record(state: SimState, result: Result): Step {
  const phase = phaseOf(state);
  if (phase.type !== "lift") return { ok: false, error: "There is no attempt to record now." };
  if (!state.attempts[phase.attempt].called) return { ok: false, error: "Call the attempt first." };
  const attempts = state.attempts.map((a, i) => (i === phase.attempt ? { ...a, result } : a));
  return { ok: true, state: { attempts } };
}

/** The best successful snatch, if any. */
export function bestLift(state: SimState): number | undefined {
  const good = state.attempts.filter((a) => a.result === "good").map(finalWeight);
  return good.length ? Math.max(...good) : undefined;
}

/**
 * The lowest clean & jerk first attempt that respects the 20 kg Rule (6.6.5), which counts the
 * first attempts actually taken. Known once the first snatch attempt has a result.
 */
export function requiredCleanAndJerk(state: SimState, entryTotal: number): number | undefined {
  const first = state.attempts[0];
  if (!first.result) return undefined;
  return Math.max(0, twentyKgRuleLimit(entryTotal) - finalWeight(first));
}

/** Best snatch plus best clean & jerk. Needs a good lift in both, otherwise there is no total. */
export function total(snatch: SimState, cleanAndJerk: SimState): number | undefined {
  const s = bestLift(snatch);
  const c = bestLift(cleanAndJerk);
  return s !== undefined && c !== undefined ? s + c : undefined;
}
