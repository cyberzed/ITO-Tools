import { useState } from "react";
import AthleteCard, { type AthleteCardData, type Attempt } from "../../components/AthleteCard";
import {
  MAX_CHANGES,
  automaticProgression,
  bestLift,
  call,
  change,
  declare,
  finalWeight,
  lowestChange,
  minWeight,
  phaseOf,
  record,
  requiredCleanAndJerk,
  start,
  type Result,
  type SimState,
  type Step,
} from "../../lib/snatchSimulation";
import { getSessionAthlete } from "../../lib/sessionAthlete";
import { cardFor } from "./card";

const resultText: Record<Result, string> = { good: "Good lift", no: "No lift" };

/** The three snatch attempts as the card shows them. */
function snatchAttempts(state: SimState, signature: string): [Attempt, Attempt, Attempt] {
  const out: Attempt[] = [0, 1, 2].map((i) => {
    const a = state.attempts[i];
    // Not declared yet, but the automatic progression is already printed once the attempt before has a result.
    if (!a) return { autoProgression: automaticProgression(state, i) };
    return {
      autoProgression: automaticProgression(state, i),
      declaration: a.declaration,
      declarationSignature: signature,
      change1: a.changes[0] !== undefined ? { weight: a.changes[0], signature } : undefined,
      change2: a.changes[1] !== undefined ? { weight: a.changes[1], signature } : undefined,
      // The circle and the strikes appear once the attempt is taken and the weight is final.
      final: a.result ? (a.changes.length as 0 | 1 | 2) : undefined,
    };
  });
  return out as [Attempt, Attempt, Attempt];
}

export default function Simulation() {
  const [athlete] = useState(() => getSessionAthlete());
  const [state, setState] = useState(() => start(athlete.snatchStart));
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const phase = phaseOf(state);
  const best = bestLift(state);

  const card: AthleteCardData = {
    ...cardFor(athlete),
    requiredCJ: requiredCleanAndJerk(state, athlete.entryTotal),
  };
  card.snatch = { attempts: snatchAttempts(state, athlete.signature) };

  /** Apply a step. On success go to the next state and fill in a sensible default weight. */
  function apply(step: Step, nextValue: (s: SimState) => string) {
    if (!step.ok) {
      setError(step.error);
      return;
    }
    setError("");
    setState(step.state);
    setValue(nextValue(step.state));
  }

  const defaultDeclaration = (s: SimState) => {
    const p = phaseOf(s);
    return p.type === "declare" ? String(automaticProgression(s, p.attempt)) : "";
  };

  const weight = Number(value);
  const hasWeight = value.trim() !== "" && Number.isFinite(weight);

  function restart() {
    setState(start(athlete.snatchStart));
    setValue("");
    setError("");
  }

  const current = phase.type === "lift" ? state.attempts[phase.attempt] : undefined;

  return (
    <div className="simulation">
      <p className="muted">
        Take the athlete through the three snatch attempts. Declare the next weight, change it if
        needed and record each result. The card fills in as you go.
      </p>

      <div className="sim-panel">
        {phase.type === "lift" && current && (
          <>
            <h2>
              Attempt {phase.attempt + 1}: {finalWeight(current)} kg
            </h2>
            <p className="muted">
              {current.called
                ? "The weight is loaded and called. It can only go up now."
                : "Declared. Change the weight, or call the attempt."}
            </p>
            <div className="sim-row">
              {current.called ? (
                <>
                  <button className="small-button primary" onClick={() => apply(record(state, "good"), defaultDeclaration)}>
                    Good lift
                  </button>
                  <button className="small-button" onClick={() => apply(record(state, "no"), defaultDeclaration)}>
                    No lift
                  </button>
                </>
              ) : (
                <button className="small-button primary" onClick={() => apply(call(state), () => "")}>
                  Call attempt
                </button>
              )}
            </div>
            <form
              className="sim-row"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (hasWeight) apply(change(state, weight, athlete.gender), () => "");
              }}
            >
              <label>
                New weight (kg)
                <input
                  type="number"
                  inputMode="numeric"
                  step={1}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <button className="small-button" type="submit" disabled={!hasWeight || current.changes.length >= MAX_CHANGES}>
                Change weight
              </button>
              <span className="muted">
                Changes left: {MAX_CHANGES - current.changes.length}. Lowest weight:{" "}
                {lowestChange(state, phase.attempt, athlete.gender)} kg.
              </span>
            </form>
          </>
        )}

        {phase.type === "declare" && (
          <>
            <h2>Declare attempt {phase.attempt + 1}</h2>
            <p className="muted">
              The automatic progression is {automaticProgression(state, phase.attempt)} kg: 1 kg more
              after a good lift, the same weight after a no lift.
            </p>
            <form
              className="sim-row"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (hasWeight) apply(declare(state, weight, athlete.gender), () => "");
              }}
            >
              <label>
                Declared weight (kg)
                <input
                  type="number"
                  inputMode="numeric"
                  step={1}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <button className="small-button primary" type="submit" disabled={!hasWeight}>
                Declare
              </button>
            </form>
          </>
        )}

        {phase.type === "done" && (
          <>
            <h2>Snatch finished</h2>
            <p>{best === undefined ? "No good snatch." : `Best snatch: ${best} kg.`}</p>
          </>
        )}

        {error && (
          <p className="sim-error" role="alert">
            {error}
          </p>
        )}

        <ol className="sim-results" aria-label="Results">
          {state.attempts.map((a, i) => (
            <li key={i} className={a.result ?? ""}>
              Attempt {i + 1}: {finalWeight(a)} kg{a.result ? `, ${resultText[a.result]}` : ""}
            </li>
          ))}
        </ol>

        <button className="small-button" onClick={restart}>
          Restart
        </button>
      </div>

      <AthleteCard data={card} />
    </div>
  );
}
