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
  phaseOf,
  record,
  requiredCleanAndJerk,
  start,
  total,
  type Result,
  type SimState,
  type Step,
} from "../../lib/snatchSimulation";
import { getSessionAthlete } from "../../lib/sessionAthlete";
import { cardFor } from "./card";

type Lift = "snatch" | "cj";
const liftName: Record<Lift, string> = { snatch: "Snatch", cj: "Clean & Jerk" };
const resultText: Record<Result, string> = { good: "Good lift", no: "No lift" };

/** The three attempts of a lift as the card shows them. */
function cardAttempts(state: SimState, signature: string): [Attempt, Attempt, Attempt] {
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
      // A good lift circles the final weight and a no lift strikes it. Unused change boxes are struck too.
      final: a.result ? (a.changes.length as 0 | 1 | 2) : undefined,
      result: a.result,
    };
  });
  return out as [Attempt, Attempt, Attempt];
}

export default function Simulation() {
  const [athlete] = useState(() => getSessionAthlete());
  const [snatch, setSnatch] = useState(() => start(athlete.snatchStart));
  const [cj, setCj] = useState<SimState | undefined>();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const lift: Lift = cj ? "cj" : "snatch";
  const state = cj ?? snatch;
  const setState = cj ? setCj : setSnatch;
  const name = liftName[lift];

  // The 20 kg Rule counts the first snatch attempt actually taken. It limits the first clean & jerk attempt.
  const required = requiredCleanAndJerk(snatch, athlete.entryTotal);
  const firstMin = lift === "cj" ? (required ?? 0) : 0;

  const phase = phaseOf(state);
  const current = phase.type === "lift" ? state.attempts[phase.attempt] : undefined;
  const breaksRule = lift === "cj" && phase.type === "lift" && phase.attempt === 0 && !!current && finalWeight(current) < firstMin;
  const finished = cj && phase.type === "done" ? total(snatch, cj) : undefined;

  const card: AthleteCardData = {
    ...cardFor(athlete),
    requiredCJ: required,
    total: cj && phase.type === "done" ? finished : undefined,
  };
  card.snatch = { attempts: cardAttempts(snatch, athlete.signature) };
  if (cj) card.cleanAndJerk = { attempts: cardAttempts(cj, athlete.signature) };

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

  function startCleanAndJerk() {
    setCj(start(athlete.cleanAndJerkStart));
    setValue("");
    setError("");
  }

  function restart() {
    setSnatch(start(athlete.snatchStart));
    setCj(undefined);
    setValue("");
    setError("");
  }

  const rows: { lift: Lift; state: SimState }[] = cj
    ? [
        { lift: "snatch", state: snatch },
        { lift: "cj", state: cj },
      ]
    : [{ lift: "snatch", state: snatch }];

  return (
    <div className="simulation">
      <p className="muted">
        Take the athlete through the snatch and then the clean &amp; jerk. Declare the next weight,
        change it if needed, call the attempt and record each result. The card fills in as you go.
      </p>

      <div className="sim-panel">
        {phase.type === "lift" && current && (
          <>
            <h2>
              {name} attempt {phase.attempt + 1}: {finalWeight(current)} kg
            </h2>
            <p className="muted">
              {current.called
                ? "The weight is loaded and called. It can only go up now."
                : "Declared. Change the weight, or call the attempt."}
            </p>
            {breaksRule && (
              <p className="sim-warning" role="status">
                20 kg Rule: the first starting weights must add up to at least the entry total minus
                20 kg. The first clean &amp; jerk attempt must be at least {firstMin} kg. Change it
                before it is called.
              </p>
            )}
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
                <button
                  className="small-button primary"
                  disabled={breaksRule}
                  onClick={() => apply(call(state, firstMin), () => "")}
                >
                  Call attempt
                </button>
              )}
            </div>
            <form
              className="sim-row"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (hasWeight) apply(change(state, weight, athlete.gender, firstMin), () => "");
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
                {lowestChange(state, phase.attempt, athlete.gender, firstMin)} kg.
              </span>
            </form>
          </>
        )}

        {phase.type === "declare" && (
          <>
            <h2>
              Declare {name.toLowerCase()} attempt {phase.attempt + 1}
            </h2>
            <p className="muted">
              The automatic progression is {automaticProgression(state, phase.attempt)} kg: 1 kg more
              after a good lift, the same weight after a no lift.
            </p>
            <form
              className="sim-row"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (hasWeight) apply(declare(state, weight, athlete.gender, firstMin), () => "");
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

        {phase.type === "done" && lift === "snatch" && (
          <>
            <h2>Snatch finished</h2>
            <p>{bestLift(snatch) === undefined ? "No good snatch." : `Best snatch: ${bestLift(snatch)} kg.`}</p>
            <div className="sim-row">
              <button className="small-button primary" onClick={startCleanAndJerk}>
                Start clean &amp; jerk
              </button>
            </div>
          </>
        )}

        {phase.type === "done" && cj && (
          <>
            <h2>Clean &amp; Jerk finished</h2>
            <p>
              Best snatch: {bestLift(snatch) ?? "none"}
              {bestLift(snatch) !== undefined && " kg"}. Best clean &amp; jerk: {bestLift(cj) ?? "none"}
              {bestLift(cj) !== undefined && " kg"}.{" "}
              {finished === undefined ? "No total." : `Total: ${finished} kg.`}
            </p>
          </>
        )}

        {error && (
          <p className="sim-error" role="alert">
            {error}
          </p>
        )}

        <ol className="sim-results" aria-label="Results">
          {rows.flatMap((r) =>
            r.state.attempts.map((a, i) => (
              <li key={`${r.lift}${i}`} className={a.result ?? ""}>
                {liftName[r.lift]} {i + 1}: {finalWeight(a)} kg{a.result ? `, ${resultText[a.result]}` : ""}
              </li>
            )),
          )}
        </ol>

        <button className="small-button" onClick={restart}>
          Restart
        </button>
      </div>

      <AthleteCard data={card} />
    </div>
  );
}
