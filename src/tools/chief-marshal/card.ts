import type { AthleteCardData } from "../../components/AthleteCard";
import type { MarshalAthlete } from "../../lib/marshal";
import { cardAttempts } from "../athlete-cards/card";

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
