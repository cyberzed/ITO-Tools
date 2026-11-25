import { useState } from "react";
import AthleteCard, { type AthleteCardData } from "../components/AthleteCard";
import { categoryFor } from "../lib/categories";
import { getSessionAthlete, newSessionAthlete, type SessionAthlete } from "../lib/sessionAthlete";

/** Printed card data only: no handwriting, no progression, no marks. */
function cardFor(athlete: SessionAthlete): AthleteCardData {
  return {
    startNumber: 1,
    name: athlete.name,
    gender: athlete.gender,
    lot: athlete.lot,
    bodyWeight: athlete.bodyWeight,
    category: categoryFor(athlete.gender, athlete.bodyWeight).label,
    birthDate: athlete.birthDate,
    entryTotal: 275,
    signature: athlete.signature,
    snatch: {
      attempts: [{ declaration: 112, declarationSignature: athlete.signature }, {}, {}],
    },
    cleanAndJerk: {
      attempts: [{ declaration: 144, declarationSignature: athlete.signature }, {}, {}],
    },
  };
}

export default function AthleteCards() {
  const [athlete, setAthlete] = useState(() => getSessionAthlete());

  return (
    <section>
      <div className="tool-header">
        <h1>Athlete cards</h1>
        <button
          className="small-button"
          onClick={() => setAthlete(newSessionAthlete())}
          title="Clear the card and generate a new athlete"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v6h-6" />
          </svg>
          Reset
        </button>
      </div>
      <AthleteCard data={cardFor(athlete)} />
    </section>
  );
}
