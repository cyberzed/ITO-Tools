import { useId } from "react";
import { describeScene, faultById, type FaultId, type FingerWrap, type HandScene } from "../lib/outfit";

/** The back of a hand and the fingers, drawn from a sample. Always on a light panel. */

const SKIN = "#e3b48f";
const SKIN_SHADE = "#c99a78";
const BASE_Y = 196; // the first knuckle of each finger
const WRIST_Y = 300;

const FINGERS = [
  { x: 112, len: 104 }, // index
  { x: 146, len: 118 }, // middle
  { x: 180, len: 108 }, // ring
  { x: 212, len: 88 }, // little
] as const;

const tipY = (f: number) => BASE_Y - FINGERS[f].len;
/** The second knuckle sits about half way up the finger. */
const secondY = (f: number) => BASE_Y - FINGERS[f].len * 0.5;

/** Where each finger of the glove ends, from the glove setting. */
function gloveEnd(finger: number, reach: 0 | 1 | 2): number {
  if (reach === 0) return BASE_Y + 8;
  if (reach === 1) return BASE_Y - 22;
  return secondY(finger) - 12;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The part of a finger a wrap covers: from where it starts at the base to the end at the tip. */
function wrapSpan(w: FingerWrap, glove: HandScene["glove"]): { from: number; to: number } {
  const tip = tipY(w.finger);
  const to = w.protrudes ? tip - 14 : tip + 7;
  const from =
    glove === null
      ? BASE_Y - FINGERS[w.finger].len * 0.28
      : gloveEnd(w.finger, glove) - (w.touchesGlove ? 0 : 11);
  return { from, to };
}

function boxesFor(id: FaultId, s: HandScene): Box[] {
  switch (id) {
    case "glovePast":
      return [{ x: 92, y: secondY(0) - 22, w: 148, h: 40 }];
    case "plasterProtrudes":
    case "tapeProtrudes": {
      const material = id === "plasterProtrudes" ? "plaster" : "tape";
      return s.wraps
        .filter((w) => w.material === material && w.protrudes)
        .map((w) => ({ x: FINGERS[w.finger].x - 22, y: tipY(w.finger) - 22, w: 44, h: 38 }));
    }
    case "noSeparation":
      return s.wraps
        .filter((w) => w.touchesGlove)
        .map((w) => ({ x: FINGERS[w.finger].x - 22, y: gloveEnd(w.finger, s.glove ?? 0) - 14, w: 44, h: 28 }));
    default:
      return [];
  }
}

function Highlight({ box, label }: { box: Box; label?: string }) {
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={4} fill="rgba(214,40,40,0.14)" stroke="#d62828" strokeWidth={2} strokeDasharray="5 3" />
      {label && (
        <text
          x={box.x + box.w / 2}
          y={box.y > 24 ? box.y - 5 : box.y + box.h + 13}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="#b00020"
          stroke="#f4f6fa"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function HandFigure({
  scene,
  highlight = [],
  showMeasurements = false,
}: {
  scene: HandScene;
  highlight?: FaultId[];
  showMeasurements?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = scene;
  return (
    <svg viewBox="0 0 320 350" role="img" aria-label={describeScene(s)} className="outfit-svg">
      <defs>
        <pattern id={`${uid}pad`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f0d9b8" />
          <circle cx="3" cy="3" r="0.9" fill="#d9bd94" />
        </pattern>
      </defs>
      <rect width="320" height="350" fill="#f4f6fa" />

      {/* The hand */}
      <rect x={118} y={WRIST_Y - 6} width={84} height={50} rx={10} fill={SKIN} />
      <ellipse cx={88} cy={250} rx={17} ry={48} transform="rotate(-28 88 250)" fill={SKIN} stroke={SKIN_SHADE} />
      <rect x={96} y={BASE_Y - 10} width={128} height={WRIST_Y - BASE_Y + 16} rx={26} fill={SKIN} />
      {FINGERS.map((f, i) => (
        <g key={i}>
          <rect x={f.x - 14} y={BASE_Y - f.len} width={28} height={f.len + 14} rx={14} fill={SKIN} stroke={SKIN_SHADE} />
          <rect x={f.x - 8} y={BASE_Y - f.len + 4} width={16} height={13} rx={6} fill="#f1d4bd" />
          <path d={`M${f.x - 10} ${BASE_Y - f.len * 0.5} Q${f.x} ${BASE_Y - f.len * 0.5 + 5} ${f.x + 10} ${BASE_Y - f.len * 0.5}`} stroke={SKIN_SHADE} strokeWidth={1.4} fill="none" />
          <path d={`M${f.x - 10} ${BASE_Y - f.len * 0.8} Q${f.x} ${BASE_Y - f.len * 0.8 + 4} ${f.x + 10} ${BASE_Y - f.len * 0.8}`} stroke={SKIN_SHADE} strokeWidth={1.2} fill="none" />
          <path d={`M${f.x - 11} ${BASE_Y} Q${f.x} ${BASE_Y + 6} ${f.x + 11} ${BASE_Y}`} stroke={SKIN_SHADE} strokeWidth={1.6} fill="none" />
        </g>
      ))}

      {/* The fingerless glove: the back of the hand, and a cap on each finger up to where it ends */}
      {s.glove !== null && (
        <g>
          <rect x={90} y={BASE_Y + 8} width={140} height={WRIST_Y - BASE_Y - 2} rx={16} fill="#2b3340" stroke="#161b24" />
          {FINGERS.map((f, i) => {
            const end = gloveEnd(i, s.glove!);
            return end < BASE_Y + 8 ? (
              <rect key={i} x={f.x - 15} y={end} width={30} height={BASE_Y + 12 - end} rx={9} fill="#2b3340" stroke="#161b24" />
            ) : null;
          })}
          <path d="M104 286 H216" stroke="#566176" strokeWidth={2} strokeDasharray="4 3" />
        </g>
      )}

      {/* Tape and sticking plasters on the fingers */}
      {s.wraps.map((w, i) => {
        const { from, to } = wrapSpan(w, s.glove);
        const x = FINGERS[w.finger].x - 15;
        const h = Math.max(6, from - to);
        return w.material === "tape" ? (
          <g key={i}>
            <rect x={x} y={to} width={30} height={h} rx={5} fill="#2d7fd3" stroke="#1c5ea3" />
            <rect x={x + 4} y={to + 2} width={4} height={Math.max(0, h - 4)} fill="#ffffff" opacity={0.35} />
          </g>
        ) : (
          <g key={i}>
            <rect x={x} y={to} width={30} height={h} rx={5} fill="#efd2ae" stroke="#c9a074" />
            <rect x={x + 5} y={to + h / 2 - 7} width={20} height={14} rx={2} fill={`url(#${uid}pad)`} stroke="#d4b98e" />
          </g>
        );
      })}

      {/* A training aid: the first and the second knuckle */}
      {showMeasurements && (
        <g fontSize={11} fill="#1c5ea3" fontWeight={600} stroke="#2d7fd3" strokeWidth={1.2}>
          <path d={`M90 ${BASE_Y} H236`} strokeDasharray="4 3" fill="none" />
          <text x={242} y={BASE_Y + 4} stroke="none">
            1st knuckle
          </text>
          <path d={`M90 ${secondY(1)} H236`} strokeDasharray="4 3" fill="none" />
          <text x={242} y={secondY(1) + 4} stroke="none">
            2nd knuckle
          </text>
        </g>
      )}

      {highlight.flatMap((id) =>
        boxesFor(id, s).map((box, i) => <Highlight key={`${id}${i}`} box={box} label={i === 0 ? faultById(id).short : undefined} />),
      )}
    </svg>
  );
}
