import AthleteCard, { type AthleteCardData } from "../components/AthleteCard";
import { getSessionAthlete } from "../lib/sessionAthlete";

const athlete = getSessionAthlete();

/** Printed card data only: no handwriting, no progression, no marks. */
const card: AthleteCardData = {
  name: athlete.name,
  gender: athlete.gender,
  startNumber: 1,
  lot: athlete.lot,
  birthDate: athlete.birthDate,
  entryTotal: 275,
  signature: athlete.signature,
  snatch: {
    attempts: [{ declaration: 112, declarationSignature: athlete.signature }, {}, {}],
  },
  cleanAndJerk: {
    attempts: [
      { declaration: 144, declarationSignature: athlete.signature },
      {},
      {},
    ],
  },
};

export default function AthleteCards() {
  return (
    <section>
      <h1>Athlete cards</h1>
      <AthleteCard data={card} />
    </section>
  );
}
