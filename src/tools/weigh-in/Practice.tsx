import { useState } from "react";
import {
  COSTUME_G,
  bodyweightG,
  formatKg,
  generateCase,
  parseKg,
  verdictFor,
  type CategoryLimits,
  type Verdict,
  type WeighInCase,
} from "../../lib/weighIn";

const choices: { value: Verdict; label: string }[] = [
  { value: "within", label: "Makes weight" },
  { value: "heavy", label: "Too heavy: must lose weight" },
  { value: "light", label: "Too light: must gain weight" },
];

const genderName = { M: "Men", F: "Women" } as const;

/** The category's range written like the Weight classes overview. */
export function rangeText({ aboveG, maxG }: CategoryLimits): string {
  if (maxG === null) return `over ${formatKg(aboveG!)} kg`;
  if (aboveG === null) return `up to ${formatKg(maxG)} kg`;
  return `${formatKg(aboveG + 10)}–${formatKg(maxG)} kg`;
}

/** Why the answer is what it is, step by step. */
function explain(c: WeighInCase): string[] {
  const bw = bodyweightG(c.scaleG);
  const { aboveG, maxG } = c.limits;
  const label = c.category.label;
  const lines = [
    `${formatKg(c.scaleG)} − ${formatKg(COSTUME_G)} for the costume = ${formatKg(bw)} kg.`,
    `${label} is ${rangeText(c.limits)}.`,
  ];
  switch (verdictFor(c.limits, c.scaleG)) {
    case "within":
      if (maxG !== null && c.scaleG > maxG)
        lines.push(`The scale is over ${formatKg(maxG)} kg, but the costume deduction brings the athlete under the limit.`);
      lines.push("The athlete makes weight and is weighed only once.");
      break;
    case "heavy":
      lines.push(
        `The athlete is ${formatKg(bw - maxG!)} kg over the limit and must lose at least that much.`,
        "They may come back to the scale as many times as needed. If they do not make weight before the weigh-in ends, they are out of the competition.",
      );
      break;
    case "light":
      lines.push(
        `${formatKg(bw)} kg is in the category below, so the athlete must gain at least ${formatKg(aboveG! + 10 - bw)} kg, to ${formatKg(aboveG! + 10)} kg.`,
        "They may come back to the scale as many times as needed. If they do not make weight before the weigh-in ends, they are out of the competition.",
      );
      break;
  }
  return lines;
}

export default function Practice() {
  const [current, setCurrent] = useState<WeighInCase>(() => generateCase());
  const [typed, setTyped] = useState("");
  const [choice, setChoice] = useState<Verdict | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const typedG = parseKg(typed);
  const bw = bodyweightG(current.scaleG);
  const verdict = verdictFor(current.limits, current.scaleG);
  const bwRight = typedG === bw;
  const verdictRight = choice === verdict;

  function check() {
    setChecked(true);
    setScore((s) => ({ right: s.right + (bwRight && verdictRight ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setCurrent(generateCase());
    setTyped("");
    setChoice(null);
    setChecked(false);
  }

  return (
    <div className="weigh-in">
      <p className="muted">
        Work out the athlete's bodyweight after the costume deduction, and decide whether they make
        weight for the category they are entered in.
      </p>

      <div className="scale-panel">
        <dl>
          <div>
            <dt>Gender</dt>
            <dd>{genderName[current.gender]}</dd>
          </div>
          <div>
            <dt>Entered category</dt>
            <dd>{current.category.label}</dd>
          </div>
        </dl>
        <div className="scale-display" aria-label="The scale shows">
          <span className="muted">The scale shows</span>
          <strong>{formatKg(current.scaleG)} kg</strong>
        </div>
      </div>

      <form
        className="weigh-in-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!checked) check();
          else next();
        }}
      >
        <label className="bodyweight-input">
          Bodyweight after the deduction
          <span>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={typed}
              disabled={checked}
              onChange={(e) => setTyped(e.target.value)}
              aria-invalid={checked && !bwRight}
            />{" "}
            kg
          </span>
        </label>

        <fieldset disabled={checked}>
          <legend>Decision</legend>
          {choices.map((c) => (
            <label key={c.value} className={checked && c.value === verdict ? "answer" : undefined}>
              <input
                type="radio"
                name="verdict"
                value={c.value}
                checked={choice === c.value}
                onChange={() => setChoice(c.value)}
              />{" "}
              {c.label}
            </label>
          ))}
        </fieldset>

        <div className="training-controls">
          {checked ? (
            <button type="submit" className="small-button primary">
              Next athlete
            </button>
          ) : (
            <button type="submit" className="small-button primary" disabled={typedG === null || choice === null}>
              Check
            </button>
          )}
          <span className="muted" aria-live="polite">
            Correct: {score.right} of {score.total}
          </span>
        </div>
      </form>

      {checked && (
        <div className={`weigh-in-result ${bwRight && verdictRight ? "ok" : "bad"}`} role="status">
          <p className="training-result">
            {bwRight && verdictRight
              ? "Correct."
              : [!bwRight && `The bodyweight is ${formatKg(bw)} kg.`, !verdictRight && `The athlete ${verdictText[verdict]}.`]
                  .filter(Boolean)
                  .join(" ")}
          </p>
          <ul>
            {explain(current).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const verdictText: Record<Verdict, string> = {
  within: "makes weight",
  heavy: "is too heavy",
  light: "is too light",
};
