import type { ReactNode } from "react";
import { twentyKgRuleLimit } from "../lib/rules";

/** One handwritten change on the card. */
export interface Change {
  weight?: number;
  signature?: string;
}

export interface Attempt {
  /** Pre-printed automatic progression (attempts 2 and 3). */
  autoProgression?: number;
  /** Starting weight (attempt 1) or declaration (attempts 2 and 3). */
  declaration?: number;
  /** Declaration was typed on the card in black, not handwritten in blue. */
  declarationPrinted?: boolean;
  declarationSignature?: string;
  change1?: Change;
  change2?: Change;
  /**
   * Which entry is the final weight, shown with a red circle:
   * 0 = declaration, 1 = change 1, 2 = change 2.
   * Unused change boxes after it are struck through.
   */
  final?: 0 | 1 | 2;
  /** A no lift strikes the final weight through. Anything else circles it. */
  result?: "good" | "no";
  /** The attempt was given up: the boxes are crossed out and a signed note is written. */
  withdrawn?: "abstain" | "withdraw";
  withdrawnSignature?: string;
}

const noteText = { abstain: "Abstained", withdraw: "Withdrawn" } as const;

export interface Lift {
  attempts: [Attempt, Attempt, Attempt];
}

export interface AthleteCardData {
  startNumber?: number;
  name: string;
  /** Not printed on the card; used to work out the category. */
  gender?: "M" | "F";
  lot?: number;
  category?: string;
  birthDate?: string;
  entryTotal?: number;
  bodyWeight?: number;
  signature?: string;
  requiredCJ?: number;
  total?: number;
  snatch: Lift;
  cleanAndJerk: Lift;
}

function Cell({
  label,
  children,
  className = "",
  center = false,
  struck = false,
}: {
  label?: string;
  children?: ReactNode;
  className?: string;
  center?: boolean;
  struck?: boolean;
}) {
  return (
    <div className={`ac-cell ${center ? "ac-center" : ""} ${className}`}>
      {label && <span className="ac-label">{label}</span>}
      {children}
      {struck && <Struck />}
    </div>
  );
}

function Struck() {
  return (
    <span className="ac-struck">
      <i />
      <i />
    </span>
  );
}

function Ink({
  children,
  circled,
  struck,
  printed,
}: {
  children?: ReactNode;
  circled?: boolean;
  /** Crossed out with a pen line, for a no lift. */
  struck?: boolean;
  /** Black typed text instead of blue handwriting. */
  printed?: boolean;
}) {
  return (
    <span className={`ac-ink ${printed ? "ac-printed" : ""}`}>
      {children}
      {circled && <span className="ac-circle" />}
      {struck && <span className="ac-strike" />}
    </span>
  );
}

function SignatureCell({ value, struck }: { value?: string; struck?: boolean }) {
  return (
    <Cell label="Signature:" className="ac-sig" struck={struck}>
      <span className="ac-signature">{value}</span>
    </Cell>
  );
}

const isFinal = (a: Attempt, entry: 0 | 1 | 2) => a.final === entry;

function LiftSection({ title, lift, dark }: { title: string; lift: Lift; dark: boolean }) {
  const [a1, a2, a3] = lift.attempts;
  const attempts = [a1, a2, a3];

  return (
    <>
      <div className={`ac-title ${dark ? "ac-title-dark" : ""}`}>{title}</div>
      <div className="ac-grid">
        {[1, 2, 3].map((n) => (
          <Cell key={n} className="ac-number" center>
            {n}
          </Cell>
        ))}

        {attempts.map((a, i) =>
          i === 0 ? (
            <Cell key="auto0" className="ac-grey ac-cross" />
          ) : (
            <Cell key={`auto${i}`} label="Automatic Progression" className="ac-grey" center>
              <span className="ac-print-red">{a.autoProgression}</span>
            </Cell>
          ),
        )}

        {attempts.map((a, i) => (
          <Cell key={`decl${i}`} label={i === 0 ? "Starting Weight" : "Declaration"} center>
            <Ink
              circled={isFinal(a, 0) && a.result !== "no"}
              // A declared weight that was never taken is crossed out. The note below it stays readable.
              struck={(isFinal(a, 0) && a.result === "no") || (!!a.withdrawn && a.declaration !== undefined)}
              printed={a.declarationPrinted}
            >
              {a.declaration}
            </Ink>
            {a.withdrawn && <span className="ac-note">{noteText[a.withdrawn]}</span>}
          </Cell>
        ))}
        {attempts.map((a, i) => (
          // The signed note about giving up the attempt goes in the declaration signature box.
          <SignatureCell key={`decls${i}`} value={a.withdrawnSignature ?? a.declarationSignature} struck={false} />
        ))}

        {([1, 2] as const).map((changeNo) => {
          const key = changeNo === 1 ? "change1" : "change2";
          return [
            attempts.map((a, i) => {
              const c = a[key];
              const struck = !!a.withdrawn || (a.final !== undefined && a.final < changeNo && !c?.weight);
              return (
                <Cell key={`${key}${i}`} label={`Change ${changeNo}`} center struck={struck}>
                  <Ink circled={isFinal(a, changeNo) && a.result !== "no"} struck={isFinal(a, changeNo) && a.result === "no"}>
                    {c?.weight}
                  </Ink>
                </Cell>
              );
            }),
            attempts.map((a, i) => {
              const c = a[key];
              const struck = !!a.withdrawn || (a.final !== undefined && a.final < changeNo && !c?.weight);
              return <SignatureCell key={`${key}s${i}`} value={c?.signature} struck={struck} />;
            }),
          ];
        })}
      </div>
    </>
  );
}

export default function AthleteCard({ data }: { data: AthleteCardData }) {
  const d = data;
  return (
    <div className="ac">
      {/* Left page: Snatch */}
      <div className="ac-page">
        <div className="ac-head">
          <Cell label="Start #" className="ac-start">
            <span className="ac-start-number">{d.startNumber}</span>
          </Cell>
          <Cell className="ac-name">{d.name}</Cell>
        </div>
        <div className="ac-grid">
          <Cell label="Lot" center>
            <Ink printed>{d.lot}</Ink>
          </Cell>
          <Cell label="Category" center>
            <Ink printed>{d.category}</Ink>
          </Cell>
          <Cell label="Birth Date" center>
            <Ink printed>{d.birthDate}</Ink>
          </Cell>
          <Cell label="Entry Total" center>
            <Ink printed>{d.entryTotal}</Ink>
          </Cell>
          <Cell label="Body Weight" center>
            <Ink printed>{d.bodyWeight?.toFixed(2)}</Ink>
          </Cell>
          <Cell label="Signature:" className="ac-sig">
            <span className="ac-signature">{d.signature}</span>
          </Cell>
        </div>
        <LiftSection title="Snatch" lift={d.snatch} dark />
      </div>

      {/* Right page: Clean & Jerk */}
      <div className="ac-page">
        <div className="ac-head">
          <Cell label="Start #" className="ac-start">
            <span className="ac-start-number">{d.startNumber}</span>
          </Cell>
          <Cell className="ac-name">{d.name}</Cell>
        </div>
        <div className="ac-grid">
          <Cell label="Lot" center>
            <Ink printed>{d.lot}</Ink>
          </Cell>
          <Cell label="Age Group" center>
            <Ink printed>Senior</Ink>
          </Cell>
          <Cell label="Category" center>
            <Ink printed>{d.category}</Ink>
          </Cell>
          <Cell label="20kg Rule" center>
            <Ink printed>{d.entryTotal !== undefined ? twentyKgRuleLimit(d.entryTotal) : undefined}</Ink>
          </Cell>
          <Cell label="Required C&J" center>
            <Ink printed>{d.requiredCJ}</Ink>
          </Cell>
          <Cell label="Total" center>
            <Ink printed>{d.total}</Ink>
          </Cell>
        </div>
        <LiftSection title="Clean&Jerk" lift={d.cleanAndJerk} dark={false} />
      </div>
    </div>
  );
}
