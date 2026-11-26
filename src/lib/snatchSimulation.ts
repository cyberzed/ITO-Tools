/**
 * The three snatch attempts, one step at a time.
 * Rules: IWF TCRR 2026 (reference/IWF-TCRR-2026.pdf), 6.6.2-6.6.4, 6.6.10 and 6.6.12.
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

export interface SimState {
  attempts: SimAttempt[];
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
export function minWeight(state: SimState, attempt: number, gender: Gender): number {
  return automaticProgression(state, attempt) ?? MIN_BAR_KG[gender];
}

/**
 * The lowest weight a change can have now. Before the attempt is called it is the minimum
 * weight. Once the weight is loaded and called it cannot go under what is on the bar (6.6.10).
 */
export function lowestChange(state: SimState, attempt: number, gender: Gender): number {
  const a = state.attempts[attempt];
  return a?.called ? finalWeight(a) + 1 : minWeight(state, attempt, gender);
}

function checkWeight(state: SimState, attempt: number, weight: number, gender: Gender): string | undefined {
  if (!Number.isInteger(weight)) return "The weight must be a whole number of kg (6.6.2).";
  const min = minWeight(state, attempt, gender);
  if (weight < min) {
    return attempt === 0
      ? `The weight cannot be lighter than the empty bar (${min} kg).`
      : `The weight cannot be lower than the automatic progression (${min} kg).`;
  }
  return undefined;
}

/** Declare the next attempt (attempts 2 and 3). */
export function declare(state: SimState, weight: number, gender: Gender): Step {
  const phase = phaseOf(state);
  if (phase.type !== "declare") return { ok: false, error: "There is nothing to declare now." };
  const error = checkWeight(state, phase.attempt, weight, gender);
  if (error) return { ok: false, error };
  return { ok: true, state: { attempts: [...state.attempts, { declaration: weight, changes: [] }] } };
}

/** Change the weight of the attempt that is about to be taken. */
export function change(state: SimState, weight: number, gender: Gender): Step {
  const phase = phaseOf(state);
  if (phase.type !== "lift") return { ok: false, error: "There is no attempt to change now." };
  const current = state.attempts[phase.attempt];
  if (current.changes.length >= MAX_CHANGES) return { ok: false, error: "Both changes are used." };
  const error = checkWeight(state, phase.attempt, weight, gender);
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
export function call(state: SimState): Step {
  const phase = phaseOf(state);
  if (phase.type !== "lift") return { ok: false, error: "There is no attempt to call now." };
  if (state.attempts[phase.attempt].called) return { ok: false, error: "The attempt is already called." };
  const attempts = state.attempts.map((a, i) => (i === phase.attempt ? { ...a, called: true } : a));
  return { ok: true, state: { attempts } };
}

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
