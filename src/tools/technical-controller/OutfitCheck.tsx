import { useState } from "react";
import HandFigure from "../../components/HandFigure";
import OutfitFigure from "../../components/OutfitFigure";
import {
  faultById,
  faultsForKind,
  faultsOf,
  generateScene,
  lookAlikeById,
  lookAlikesOf,
  type FaultId,
  type OutfitScene,
} from "../../lib/outfit";

type Decision = "pass" | "fail";

const sameSet = (a: FaultId[], b: FaultId[]) => a.length === b.length && a.every((x) => b.includes(x));

export default function OutfitCheck() {
  const [scene, setScene] = useState<OutfitScene>(() => generateScene());
  const [decision, setDecision] = useState<Decision | null>(null);
  const [ticked, setTicked] = useState<FaultId[]>([]);
  const [checked, setChecked] = useState(false);
  const [measure, setMeasure] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const truth = faultsOf(scene);
  const truthDecision: Decision = truth.length ? "fail" : "pass";
  const answered = decision === "fail" ? ticked : [];
  const verdictRight = decision === truthDecision;
  const allRight = verdictRight && sameSet(answered, truth);
  const ready = decision === "pass" || (decision === "fail" && ticked.length > 0);

  const list = faultsForKind(scene.kind);
  const groups = [...new Set(list.map((f) => f.group))];
  const looksAllowed = lookAlikesOf(scene);

  function check() {
    setChecked(true);
    setScore((s) => ({ right: s.right + (allRight ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setScene(generateScene(undefined, scene));
    setDecision(null);
    setTicked([]);
    setChecked(false);
  }

  const toggle = (id: FaultId) => setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const highlight = checked ? truth : [];
  const showMeasurements = measure || checked;

  return (
    <div className="weigh-in outfit">
      <p className="muted">
        You inspect the outfit before the athlete goes on the platform. Look at the picture and decide
        whether it passes. If it does not, tick every fault you see.
      </p>

      <div className="outfit-panel">
        {scene.kind === "figure" ? (
          <OutfitFigure scene={scene} highlight={highlight} showMeasurements={showMeasurements} />
        ) : (
          <HandFigure scene={scene} highlight={highlight} showMeasurements={showMeasurements} />
        )}
      </div>

      <label className="outfit-measure">
        <input type="checkbox" checked={measure} onChange={(e) => setMeasure(e.target.checked)} /> Show measurements
      </label>

      <form
        className="weigh-in-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checked) check();
          else next();
        }}
      >
        <fieldset disabled={checked}>
          <legend>Decision</legend>
          {(
            [
              ["pass", "Passes"],
              ["fail", "Does not pass"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={checked && value === truthDecision ? "answer" : undefined}>
              <input type="radio" name="decision" value={value} checked={decision === value} onChange={() => setDecision(value)} />{" "}
              {label}
            </label>
          ))}
        </fieldset>

        {decision === "fail" && (
          <fieldset disabled={checked} className="outfit-faults">
            <legend>The faults you see</legend>
            {groups.map((group) => (
              <div key={group} className="outfit-group">
                <strong>{group}</strong>
                {list
                  .filter((f) => f.group === group)
                  .map((f) => {
                    const isFault = truth.includes(f.id);
                    const isTicked = ticked.includes(f.id);
                    const className = checked ? (isFault ? "answer" : isTicked ? "wrong" : undefined) : undefined;
                    return (
                      <label key={f.id} className={className}>
                        <input type="checkbox" checked={isTicked} onChange={() => toggle(f.id)} /> {f.label}
                      </label>
                    );
                  })}
              </div>
            ))}
          </fieldset>
        )}

        <div className="training-controls">
          {checked ? (
            <button type="submit" className="small-button primary">
              Next sample
            </button>
          ) : (
            <button type="submit" className="small-button primary" disabled={!ready}>
              Check
            </button>
          )}
          <span className="muted" aria-live="polite">
            Correct: {score.right} of {score.total}
          </span>
        </div>
      </form>

      {checked && (
        <div className={`weigh-in-result ${allRight ? "ok" : "bad"}`} role="status">
          <p className="training-result">
            {allRight
              ? "Correct."
              : !verdictRight
                ? truth.length
                  ? "This sample does not pass."
                  : "This sample passes."
                : "It does not pass, but not for those reasons."}
          </p>
          {truth.length > 0 ? (
            <>
              <p className="outfit-sub">The {truth.length === 1 ? "fault" : "faults"} in this sample:</p>
              <ul>
                {truth.map((id) => (
                  <li key={id}>
                    {faultById(id).label} ({faultById(id).rule}).{!answered.includes(id) && decision === "fail" ? " You missed this." : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>There is no fault in this sample, so it passes.</p>
          )}
          {answered.filter((id) => !truth.includes(id)).length > 0 && (
            <>
              <p className="outfit-sub">You ticked these, but they are not a fault here:</p>
              <ul>
                {answered
                  .filter((id) => !truth.includes(id))
                  .map((id) => (
                    <li key={id}>{faultById(id).label}</li>
                  ))}
              </ul>
            </>
          )}
          {looksAllowed.length > 0 && (
            <>
              <p className="outfit-sub">Looks suspicious, but is allowed:</p>
              <ul>
                {looksAllowed.map((id) => (
                  <li key={id}>
                    {lookAlikeById(id).label} ({lookAlikeById(id).rule}).
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
