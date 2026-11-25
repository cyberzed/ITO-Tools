import AthleteCard, { type AthleteCardData } from "../components/AthleteCard";
import { getSessionAthlete } from "../lib/sessionAthlete";

const athlete = getSessionAthlete();

/** Printed card data only: no handwriting, no progression, no marks. */
const card: AthleteCardData = {
  name: athlete.name,
  lot: 1,
  birthDate: athlete.birthDate,
  entryTotal: 275,
  snatch: { attempts: [{}, {}, {}] },
  cleanAndJerk: { attempts: [{ declaration: 144, declarationPrinted: true }, {}, {}] },
};

export default function AthleteCards() {
  return (
    <section>
      <h1>Athlete cards</h1>
      <AthleteCard data={card} />
    </section>
  );
}
