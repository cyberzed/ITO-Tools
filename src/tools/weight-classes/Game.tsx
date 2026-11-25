import { useState } from "react";
import { categoriesFor, type Gender } from "../../lib/categories";
import { generateRound, isValidClass, scoreRound } from "../../lib/classGame";

const genderName: Record<Gender, string> = { M: "men", F: "women" };

export default function Game() {
  const [gender, setGender] = useState<Gender>("M");
  const [board, setBoard] = useState(() => generateRound("M"));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);

  function newRound(g: Gender) {
    setGender(g);
    setBoard(generateRound(g));
    setSelected(new Set());
    setChecked(false);
  }

  function toggle(code: string) {
    if (checked) return;
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  }

  const total = categoriesFor(gender).length;
  const score = checked ? scoreRound(gender, board, selected) : null;

  const stateOf = (code: string): string => {
    const on = selected.has(code);
    if (!checked) return on ? "on" : "";
    const valid = isValidClass(gender, code);
    if (on) return valid ? "correct" : "wrong";
    return valid ? "missed" : "";
  };

  return (
    <div className="game">
      <p className="muted">
        Select every valid senior weight class for {genderName[gender]}. There are {total} in the
        grid.
      </p>

      <div className="game-controls">
        <div className="segmented" role="group" aria-label="Gender">
          {(["M", "F"] as const).map((g) => (
            <button key={g} aria-pressed={gender === g} onClick={() => newRound(g)}>
              {g === "M" ? "Men" : "Women"}
            </button>
          ))}
        </div>
        <button className="small-button" onClick={() => newRound(gender)}>
          New round
        </button>
        <button className="small-button primary" onClick={() => setChecked(true)} disabled={checked}>
          Check answers
        </button>
        <span className="muted" aria-live="polite">
          Selected: {selected.size}
        </span>
      </div>

      {score && (
        <p className="game-result" role="status">
          You found {score.correct.length} of {total}
          {score.wrong.length > 0 && `, with ${score.wrong.length} wrong`}
          {score.missed.length > 0 && `, and missed ${score.missed.length}`}.
        </p>
      )}

      <div className="game-grid">
        {board.map((code) => (
          <button
            key={code}
            className={`tile ${stateOf(code)}`}
            aria-pressed={selected.has(code)}
            disabled={checked}
            onClick={() => toggle(code)}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
