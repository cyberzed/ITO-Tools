import { useState } from "react";
import AthleteCard from "../../components/AthleteCard";
import { getSessionAthlete, newSessionAthlete } from "../../lib/sessionAthlete";
import { cardFor } from "./card";

export default function InitialCard() {
  const [athlete, setAthlete] = useState(() => getSessionAthlete());

  return (
    <div>
      <div className="toolbar">
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
    </div>
  );
}
