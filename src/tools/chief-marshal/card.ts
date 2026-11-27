import type { AthleteCardData, Attempt } from "../../components/AthleteCard";
import { categoryFor } from "../../lib/categories";
import type { MarshalAthlete } from "../../lib/marshal";
import type { SessionAthlete } from "../../lib/sessionAthlete";
import { attemptsTaken, automaticProgression, finalWeight, type SimState } from "../../lib/snatchSimulation";

/** The card as it looks at weigh-in: printed data and the starting weights, nothing else. */
export function cardFor(athlete: SessionAthlete): AthleteCardData {
  return {
    startNumber: 1,
    name: athlete.name,
    gender: athlete.gender,
    lot: athlete.lot,
    bodyWeight: athlete.bodyWeight,
    category: categoryFor(athlete.gender, athlete.bodyWeight).label,
    birthDate: athlete.birthDate,
    entryTotal: athlete.entryTotal,
    signature: athlete.signature,
    snatch: {
      attempts: [{ declaration: athlete.snatchStart, declarationSignature: athlete.signature }, {}, {}],
    },
    cleanAndJerk: {
      attempts: [{ declaration: athlete.cleanAndJerkStart, declarationSignature: athlete.signature }, {}, {}],
    },
  };
}

/** The three attempts of a lift as the card shows them. */
export function cardAttempts(state: SimState, signature: string, startingWeight: number): [Attempt, Attempt, Attempt] {
  const out: Attempt[] = [0, 1, 2].map((i) => {
    const a = state.attempts[i];
    // Attempts the athlete gave up are crossed out and carry a signed note.
    const given =
      state.closed && i >= attemptsTaken(state)
        ? ({ withdrawn: state.closed, withdrawnSignature: signature } as const)
        : {};
    // Not declared yet, but the automatic progression is already printed once the attempt before has a result.
    if (!a) {
      // The starting weight was declared and signed at weigh-in, so it is on the card even if the lift never starts.
      const weighIn = i === 0 ? { declaration: startingWeight, declarationSignature: signature } : {};
      return { autoProgression: automaticProgression(state, i), ...weighIn, ...given };
    }
    return {
      ...given,
      autoProgression: automaticProgression(state, i),
      declaration: a.declaration,
      declarationSignature: signature,
      change1: a.changes[0] !== undefined ? { weight: a.changes[0], signature } : undefined,
      change2: a.changes[1] !== undefined ? { weight: a.changes[1], signature } : undefined,
      // A good lift circles the final weight and a no lift strikes it. Unused change boxes are struck too.
      final: a.result ? (a.changes.length as 0 | 1 | 2) : undefined,
      result: a.result,
    };
  });
  return out as [Attempt, Attempt, Attempt];
}

/** The athlete's card as the Marshal sees it: printed data, and the snatch with the entries so far. */
export function cardOfAthlete(a: MarshalAthlete): AthleteCardData {
  return {
    startNumber: a.start,
    name: a.name,
    gender: a.gender,
    lot: a.lot,
    bodyWeight: a.bodyWeight,
    category: a.category,
    birthDate: a.birthDate,
    entryTotal: a.entryTotal,
    signature: a.signature,
    snatch: { attempts: cardAttempts(a.lift, a.signature, a.lift.attempts[0].declaration) },
    cleanAndJerk: { attempts: [{}, {}, {}] },
  };
}
