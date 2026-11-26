import { useState } from "react";
import {
  ATTEMPTS,
  generateGroup,
  nextLifter,
  randomChange,
  randomResult,
  takeAttempt,
  whyFirst,
  type Lifter,
} from "../../lib/liftingOrder";
import type { Gender } from "../../lib/sessionAthlete";

type Lift = "snatch" | "cleanAndJerk";
const liftName: Record<Lift, string> = { snatch: "Snatch", cleanAndJerk: "Clean & jerk" };
const SIZES = [6, 8, 10];

interface Feedback {
  ok: boolean;
  text: string;
}

export default function Practice() {
  const [gender, setGender] = useState<Gender>("M");
  const [size, setSize] = useState(6);
  const [lift, setLift] = useState<Lift>("snatch");
  const [lifters, setLifters] = useState(() => generateGroup("M", 6, "snatch"));
  const [log, setLog] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState({ right: 0, calls: 0 });

  function restart(g = gender, n = size, l = lift) {
    setGender(g);
    setSize(n);
    setLift(l);
    setLifters(generateGroup(g, n, l));
    setLog([]);
    setFeedback(null);
    setMissed(false);
    setScore({ right: 0, calls: 0 });
  }

  const due = nextLifter(lifters);
  const taken = lifters.reduce((n, l) => n + l.attempts.length, 0);
  const lastWeight = taken ? Math.max(...lifters.flatMap((l) => l.attempts.map((a) => a.weight))) : null;

  function call(start: number, shown = false) {
    if (!due) return;
    if (start !== due.start) {
      const chosen = lifters.find((l) => l.start === start)!;
      setFeedback({ ok: false, text: `Not ${chosen.name} yet. ${whyFirst(due, chosen).text}` });
      setMissed(true);
      return;
    }
    const good = randomResult();
    let next = takeAttempt(lifters, start, good);
    const attempt = due.attempts.length + 1;
    const lines = [`#${taken + 1} ${due.name}: ${due.next} kg, attempt ${attempt}, ${good ? "good lift" : "no lift"}.`];
    const change = randomChange(next);
    if (change) {
      next = change.lifters;
      const who = next.find((l) => l.start === change.start)!;
      lines.unshift(`${who.name}'s coach changes the next attempt to ${change.weight} kg.`);
    }
    const firstTime = !missed && !shown;
    setScore((s) => ({ right: s.right + (firstTime ? 1 : 0), calls: s.calls + 1 }));
    setFeedback(shown ? { ok: false, text: `${due.name} was next.` } : { ok: true, text: `Correct: ${due.name}.` });
    setMissed(false);
    setLifters(next);
    setLog((old) => [...lines, ...old]);
  }

  return (
    <div className="lifting-order">
      <p className="muted">
        Call the athletes in the right order. The board shows the weight each athlete asks for
        next. Pick the athlete you would call.
      </p>

      <div className="training-controls">
        <div className="segmented" role="group" aria-label="Gender">
          {(["M", "F"] as const).map((g) => (
            <button key={g} aria-pressed={gender === g} onClick={() => restart(g)}>
              {g === "M" ? "Men" : "Women"}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Lift">
          {(["snatch", "cleanAndJerk"] as const).map((l) => (
            <button key={l} aria-pressed={lift === l} onClick={() => restart(gender, size, l)}>
              {liftName[l]}
            </button>
          ))}
        </div>
        <label className="grid-size">
          Athletes
          <select value={size} onChange={(e) => restart(gender, Number(e.target.value))}>
            {SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button className="small-button" onClick={() => restart()}>
          New group
        </button>
      </div>

      <div className="bar-status">
        <span>
          On the bar: <strong>{lastWeight === null ? "not loaded yet" : `${lastWeight} kg`}</strong>
        </span>
        <span className="muted" aria-live="polite">
          Right first time: {score.right} of {score.calls}
        </span>
      </div>

      {feedback && (
        <p className={`order-feedback ${feedback.ok ? "ok" : "bad"}`} role="status">
          {feedback.text}
        </p>
      )}

      {!due && (
        <p className="training-result">
          The {liftName[lift].toLowerCase()} is over. You called {score.right} of {score.calls} right first
          time.
        </p>
      )}

      <div className="board-wrap">
        <table className="order-board">
          <caption>{liftName[lift]}</caption>
          <thead>
            <tr>
              <th scope="col">Start</th>
              <th scope="col">Lot</th>
              <th scope="col">Name</th>
              {Array.from({ length: ATTEMPTS }, (_, i) => (
                <th key={i} scope="col">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lifters.map((l) => (
              <tr key={l.start}>
                <td>{l.start}</td>
                <td>{l.lot}</td>
                <th scope="row">
                  {l.next === null || !due ? (
                    l.name
                  ) : (
                    <button className="call-button" onClick={() => call(l.start)}>
                      {l.name}
                    </button>
                  )}
                </th>
                {Array.from({ length: ATTEMPTS }, (_, i) => (
                  <AttemptCell key={i} lifter={l} index={i} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {due && (
        <div className="training-controls">
          <button className="small-button" onClick={() => call(due.start, true)}>
            Show who is next
          </button>
        </div>
      )}

      {log.length > 0 && (
        <>
          <h2 className="log-title">What happened</h2>
          <ol className="order-log" reversed>
            {log.map((line, i) => (
              <li key={log.length - i}>{line}</li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function AttemptCell({ lifter, index }: { lifter: Lifter; index: number }) {
  const a = lifter.attempts[index];
  if (a)
    return (
      <td className={a.good ? "good" : "no-lift"}>
        <span className="weight">{a.weight}</span>
        <span className="order-no">({a.order})</span>
        <span className="sr-only">{a.good ? "good lift" : "no lift"}</span>
      </td>
    );
  if (index === lifter.attempts.length && lifter.next !== null)
    return (
      <td className="declared">
        <span className="weight">{lifter.next}</span>
        {lifter.changes > 0 && <span className="order-no">{lifter.changes === 1 ? "1 change" : "2 changes"}</span>}
      </td>
    );
  return <td />;
}
