import AthleteCard, { type AthleteCardData } from "../components/AthleteCard";
import { getSessionAthlete } from "../lib/sessionAthlete";

const athlete = getSessionAthlete();

/** Printed card data only: no handwriting, no progression, no marks. */
const card: AthleteCardData = {
  name: athlete.name,
  gender: athlete.gender,
  lot: 1,
  birthDate: athlete.birthDate,
  entryTotal: 275,
  signature: athlete.signatures.weighIn,
  snatch: {
    attempts: [{ declaration: 112, declarationSignature: athlete.signatures.snatchStart }, {}, {}],
  },
  cleanAndJerk: {
    attempts: [
      { declaration: 144, declarationSignature: athlete.signatures.cleanAndJerkStart },
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
