import { useState } from "react";
import { categoriesFor, type Gender } from "../../lib/categories";
import { generateRound, isValidClass, scoreRound } from "../../lib/classGame";

const genderName: Record<Gender, string> = { M: "men", F: "women" };

export default function Game() {
  const [gender, setGender] = useState<Gender>("M");
  const [board, setBoard] = useState(() => generateRound("M"));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"playing" | "checked" | "revealed">("playing");

  function newRound(g: Gender) {
    setGender(g);
    setBoard(generateRound(g));
    setSelected(new Set());
    setMode("playing");
  }

  function toggle(code: string) {
    if (mode !== "playing") return;
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  }

  const total = categoriesFor(gender).length;
  const over = mode !== "playing";
  const score = mode === "checked" ? scoreRound(gender, board, selected) : null;

  const stateOf = (code: string): string => {
    const on = selected.has(code);
    if (!over) return on ? "on" : "";
    const valid = isValidClass(gender, code);
    if (on) return valid ? "correct" : "wrong";
    // Revealed answers show as plain correct ones, checked answers show what was missed.
    if (valid) return mode === "revealed" ? "correct" : "missed";
    return "";
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
        <button className="small-button primary" onClick={() => setMode("checked")} disabled={over}>
          Check answers
        </button>
        <button className="small-button" onClick={() => setMode("revealed")} disabled={over}>
          Reveal answers
        </button>
        <span className="muted" aria-live="polite">
          Selected: {selected.size}
        </span>
      </div>

      {mode === "revealed" && (
        <p className="game-result" role="status">
          The correct classes are highlighted. Start a new round to try again.
        </p>
      )}

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
            disabled={over}
            onClick={() => toggle(code)}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
