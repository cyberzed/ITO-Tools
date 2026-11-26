import { useState } from "react";
import AthleteCard, { type AthleteCardData, type Attempt } from "../../components/AthleteCard";
import {
  MAX_CHANGES,
  attemptsTaken,
  automaticProgression,
  bestLift,
  call,
  change,
  close,
  declare,
  finalWeight,
  lowestChange,
  phaseOf,
  record,
  requiredCleanAndJerk,
  start,
  total,
  withdrawnLift,
  type Closed,
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
function cardAttempts(state: SimState, signature: string, startingWeight: number): [Attempt, Attempt, Attempt] {
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

const closedText: Record<Closed, string> = { abstain: "Abstained", withdraw: "Withdrawn" };

/** One badge for each attempt that was taken, is waiting, or was given up. */
function badges(lift: Lift, state: SimState): { text: string; className: string }[] {
  const out: { text: string; className: string }[] = [];
  const taken = attemptsTaken(state);
  for (let i = 0; i < 3; i++) {
    const a = state.attempts[i];
    if (a?.result) {
      out.push({ text: `${liftName[lift]} ${i + 1}: ${finalWeight(a)} kg, ${resultText[a.result]}`, className: a.result });
    } else if (state.closed && i >= taken) {
      out.push({ text: `${liftName[lift]} ${i + 1}: ${closedText[state.closed]}`, className: "out" });
    } else if (a) {
      out.push({ text: `${liftName[lift]} ${i + 1}: ${finalWeight(a)} kg`, className: "" });
    }
  }
  return out;
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
  // The total is the best snatch plus the best clean & jerk. It fills in as soon as both lifts have a good lift.
  const running = cj ? total(snatch, cj) : undefined;
  const finished = cj && phase.type === "done" ? running : undefined;
  const withdrew = snatch.closed === "withdraw" || cj?.closed === "withdraw";
  const canGiveUp = (phase.type === "lift" && !!current && !current.called) || phase.type === "declare";
  const giveUpButtons = canGiveUp && (
    <div className="sim-row">
      <button className="small-button" onClick={() => giveUp("abstain")}>
        Abstain from the rest of the {lift === "snatch" ? "snatch" : "clean & jerk"}
      </button>
      <button className="small-button" onClick={() => giveUp("withdraw")}>
        Withdraw from the competition
      </button>
    </div>
  );

  const card: AthleteCardData = {
    ...cardFor(athlete),
    requiredCJ: required,
    total: running,
  };
  card.snatch = { attempts: cardAttempts(snatch, athlete.signature, athlete.snatchStart) };
  if (cj) card.cleanAndJerk = { attempts: cardAttempts(cj, athlete.signature, athlete.cleanAndJerkStart) };

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

  /** The athlete signs off the rest of the lift, or withdraws, which ends the whole competition. */
  function giveUp(kind: Closed) {
    const step = close(state, kind);
    if (!step.ok) {
      setError(step.error);
      return;
    }
    setError("");
    setValue("");
    setState(step.state);
    if (kind === "withdraw" && lift === "snatch") setCj(withdrawnLift());
  }

  function withdrawBeforeCleanAndJerk() {
    setCj(withdrawnLift());
    setError("");
    setValue("");
  }

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
        Take the athlete through the snatch and then the clean &amp; jerk. For each attempt:
      </p>
      <ol className="sim-steps muted" aria-label="Steps for each attempt">
        <li>Declare the weight. The first attempt starts at the weight given at weigh-in.</li>
        <li>Change it if needed. There are two changes for each attempt.</li>
        <li>Call the attempt. The weight is loaded and can only go up from here.</li>
        <li>Record the result. The next attempt gets the automatic progression.</li>
      </ol>
      <p className="muted">
        Before a weight is called, the athlete can abstain from the rest of the lift or withdraw.
        The card fills in as you go.
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
            {giveUpButtons}
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
            {giveUpButtons}
          </>
        )}

        {phase.type === "done" && lift === "snatch" && (
          <>
            <h2>Snatch finished</h2>
            <p>
              {snatch.closed === "abstain" && "Abstained from the rest of the snatch. "}
              {bestLift(snatch) === undefined ? "No good snatch." : `Best snatch: ${bestLift(snatch)} kg.`}
            </p>
            <div className="sim-row">
              <button className="small-button primary" onClick={startCleanAndJerk}>
                Start clean &amp; jerk
              </button>
              <button className="small-button" onClick={withdrawBeforeCleanAndJerk}>
                Withdraw from the competition
              </button>
            </div>
          </>
        )}

        {phase.type === "done" && cj && (
          <>
            <h2>{withdrew ? "Athlete withdrawn" : "Clean & Jerk finished"}</h2>
            <p>
              {withdrew
                ? "The athlete withdrew, so the competition is complete for them. "
                : cj.closed === "abstain"
                  ? "Abstained from the rest of the clean & jerk. "
                  : ""}
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

        {/* A divider and a title keep the attempts apart from the buttons above them. */}
        <section className="sim-attempts" aria-labelledby="sim-attempts-title">
          <h3 id="sim-attempts-title" className="sim-subtitle">
            Attempts
          </h3>
          {/* One row for each lift, so the snatch and the clean & jerk never share a row. */}
          <div className="sim-results-rows">
            {rows.map((r) => (
              <ol key={r.lift} className="sim-results" aria-label={`${liftName[r.lift]} results`}>
                {badges(r.lift, r.state).map((b) => (
                  <li key={b.text} className={b.className}>
                    {b.text}
                  </li>
                ))}
              </ol>
            ))}
          </div>
        </section>

        <button className="small-button" onClick={restart}>
          Restart
        </button>
      </div>

      <AthleteCard data={card} />
    </div>
  );
}
