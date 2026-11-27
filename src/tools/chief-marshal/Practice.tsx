import { useEffect, useState, type CSSProperties } from "react";
import AthleteCard from "../../components/AthleteCard";
import {
  DEFAULT_SIZE,
  FINAL_CALL_S,
  GROUP_SIZES,
  advance,
  createSim,
  decide,
  defaultRng,
  formatClock,
  next,
  secondsLeft,
  totalAttempts,
  type ChangeRequest,
  type Decision,
  type GroupSize,
  type Report,
  type Sim,
} from "../../lib/marshal";
import { cardOfAthlete } from "./card";

const TICK_MS = 100;
const SPEEDS = [1, 2, 4];

const resultText = { good: "Good lift", no: "No lift", timeout: "No lift: the time ran out" } as const;
const outcomeText = { right: "Right", wrong: "Wrong", missed: "Missed" } as const;

function RequestRow({ r, name, onDecide }: { r: ChangeRequest; name: string; onDecide: (d: Decision) => void }) {
  const direction = r.to > r.from ? "up" : "down";
  return (
    <li className="marshal-request">
      <div>
        <strong>
          #{r.start} {name}
        </strong>
        , attempt {r.attempt}, change {r.changesUsed + 1}
        <div className="marshal-change">
          {r.from} kg → {r.to} kg <span className="muted">({direction})</span>
        </div>
        <span className="muted">
          {r.onClock ? `Handed in with ${formatClock(r.secondsLeft)} on the clock` : "Not the athlete on the clock"}
        </span>
      </div>
      {r.decision ? (
        <span className="marshal-decided">{r.decision === "accept" ? "Accepted" : "Declined"}</span>
      ) : (
        <div className="sim-row">
          <button className="small-button primary" onClick={() => onDecide("accept")}>
            Accept
          </button>
          <button className="small-button" onClick={() => onDecide("decline")}>
            Decline
          </button>
        </div>
      )}
    </li>
  );
}

function ReportPanel({ report, done, onNext }: { report: Report; done: boolean; onNext: () => void }) {
  return (
    <div className="weigh-in-result marshal-report" role="status">
      <p className="training-result">
        {report.result === "timeout"
          ? `The time ran out. ${report.name} did not lift the bar.`
          : `${report.name} raises the bar with ${formatClock(report.secondsLeft)} left.`}
      </p>
      <p>
        Attempt {report.attempt}, {report.weight} kg: <strong>{resultText[report.result]}</strong>.
      </p>
      {report.items.length === 0 ? (
        <p className="muted">No card was handed in for this attempt.</p>
      ) : (
        <ul className="marshal-items">
          {report.items.map(({ request, outcome, text }) => (
            <li key={request.id} className={`marshal-item ${outcome}`}>
              <strong>{outcomeText[outcome]}.</strong> #{request.start}, {request.from} → {request.to} kg. {text}
            </li>
          ))}
        </ul>
      )}
      <button className="small-button primary" onClick={onNext}>
        {done ? "Finish" : "Next athlete"}
      </button>
    </div>
  );
}

export default function Practice() {
  const [size, setSize] = useState<GroupSize>(DEFAULT_SIZE);
  const [sim, setSim] = useState<Sim>(() => createSim(defaultRng, undefined, DEFAULT_SIZE));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);

  const active = running && !!sim.round && !sim.report;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setSim((s) => advance(s, (TICK_MS / 1000) * speed, defaultRng)), TICK_MS);
    return () => clearInterval(timer);
  }, [active, speed]);

  const round = sim.round;
  const left = round ? secondsLeft(round) : 0;
  const called = round ? sim.athletes.find((a) => a.start === round.start)! : undefined;
  const nameOf = (start: number) => sim.athletes.find((a) => a.start === start)!.name;
  const finished = sim.done && !sim.report && !sim.round;

  function restart(newSize: GroupSize = size) {
    setSize(newSize);
    setSim(createSim(defaultRng, undefined, newSize));
    setRunning(false);
  }

  return (
    <div className="marshal">
      <p className="muted">
        You are the Chief Marshal. Start with two lifters, or pick four for a fuller table. Coaches hand in cards while the clock runs. Accept or decline each
        one. When the athlete raises the bar, your decisions are checked.
      </p>

      <div className="sim-row">
        <button className="small-button primary" onClick={() => setRunning((r) => !r)} disabled={!round}>
          {running ? "Pause" : sim.taken === 0 && round?.elapsed === 0 ? "Start" : "Resume"}
        </button>
        <label className="marshal-speed">
          Speed{" "}
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </label>
        <label className="marshal-speed">
          Lifters{" "}
          <select value={size} onChange={(e) => restart(Number(e.target.value) as GroupSize)}>
            {GROUP_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button className="small-button" onClick={() => restart()}>
          New group
        </button>
        <span className="muted" aria-live="polite">
          Correct: {sim.score.right} of {sim.score.total}
        </span>
      </div>

      {round && called && (
        <div className={`scale-panel marshal-clock ${left <= FINAL_CALL_S ? "final-call" : ""}`}>
          <div>
            <div className="muted">On the clock</div>
            <strong>
              #{called.start} {called.name}
            </strong>
            <div>
              Attempt {round.attempt} of 3 ({sim.taken + 1} of {totalAttempts(sim)}), {round.allocated} seconds
              {round.allocated > 60 ? ", two attempts in a row" : ""}
            </div>
            {!running && <div className="muted">Press Start. The clock is stopped.</div>}
          </div>
          <div className="scale-display" aria-label="The timing clock">
            <span className="muted">{left <= FINAL_CALL_S ? "Final call" : "Clock"}</span>
            <strong>{formatClock(left)}</strong>
          </div>
        </div>
      )}

      {round && (
        <>
          <h2 className="marshal-h">Cards handed in</h2>
          {round.requests.length === 0 ? (
            <p className="muted">{running ? "Waiting for the coaches." : "None yet."}</p>
          ) : (
            <ul className="marshal-requests">
              {[...round.requests].reverse().map((r) => (
                <RequestRow
                  key={r.id}
                  r={r}
                  name={nameOf(r.start)}
                  onDecide={(d) => setSim((s) => decide(s, r.id, d))}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {sim.report && (
        <ReportPanel
          report={sim.report}
          done={sim.done}
          onNext={() => setSim((s) => next(s, defaultRng))}
        />
      )}

      {finished && (
        <div className="weigh-in-result ok marshal-report" role="status">
          <p className="training-result">
            The snatch is over. You answered {sim.score.right} of {sim.score.total} cards right.
          </p>
          <button className="small-button primary" onClick={() => restart()}>
            New group
          </button>
        </div>
      )}

      <h2 className="marshal-h">Athlete cards</h2>
      <div className="marshal-cards-wrap">
      <div className="marshal-cards" style={{ "--cols": sim.athletes.length } as CSSProperties}>
        {sim.athletes.map((a) => (
          <div key={a.start} className={`marshal-card ${round?.start === a.start ? "on-clock" : ""}`}>
            <AthleteCard data={cardOfAthlete(a)} snatchOnly />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
