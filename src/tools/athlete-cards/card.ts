import type { AthleteCardData } from "../../components/AthleteCard";
import { categoryFor } from "../../lib/categories";
import type { SessionAthlete } from "../../lib/sessionAthlete";

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
