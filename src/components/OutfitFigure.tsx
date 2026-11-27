import { useId } from "react";
import {
  ELBOW_AREA,
  ELBOW_CM,
  KNEE_CM,
  PX_PER_CM,
  describeScene,
  faultById,
  type ArmWrap,
  type Colour,
  type FaultId,
  type FigureScene,
} from "../lib/outfit";

/**
 * A front view of an athlete, drawn from a sample. 1 cm is PX_PER_CM pixels. It is always on a
 * light panel, like the athlete card, so it looks the same in both themes.
 */

const CX = 180;
const SHOULDER_Y = 76;
const CROTCH_Y = 190;
const KNEE_Y = CROTCH_Y + KNEE_CM * PX_PER_CM;
const ANKLE_Y = KNEE_Y + KNEE_CM * PX_PER_CM;
const ARM_X = { left: 124, right: 236 } as const;
const ARM_W = 18;
const LEG_X = { left: 160, right: 200 } as const;

const armY = (cm: number) => SHOULDER_Y + cm * PX_PER_CM;
const legY = (cm: number) => CROTCH_Y + cm * PX_PER_CM;

const SKIN = "#e3b48f";
const SKIN_SHADE = "#c99a78";
const costumeColour: Record<Colour, string> = {
  red: "#c0392b",
  blue: "#1f4fa8",
  green: "#1f7a4a",
  black: "#25282e",
  yellow: "#d4a017",
};

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const arms = ["left", "right"] as const;

/** Where to draw the red outline of each fault. */
function boxesFor(id: FaultId, s: FigureScene): Box[] {
  const elbowZone = (): Box[] =>
    arms.map((a) => ({ x: ARM_X[a] - 16, y: armY(ELBOW_AREA.from - 4), w: 32, h: (ELBOW_AREA.to - ELBOW_AREA.from + 8) * PX_PER_CM }));
  const wrapBoxes = (material: ArmWrap["material"]): Box[] =>
    s.wraps
      .filter((w) => w.material === material)
      .map((w) => ({ x: ARM_X[w.arm] - 15, y: armY(w.fromCm) - 3, w: 30, h: (w.toCm - w.fromCm) * PX_PER_CM + 6 }));
  const kneeBoxes = (): Box[] => arms.map((a) => ({ x: LEG_X[a] - 20, y: KNEE_Y - 24, w: 40, h: 48 }));
  switch (id) {
    case "barefoot":
      return [{ x: 132, y: ANKLE_Y - 2, w: 96, h: 28 }];
    case "twoPiece":
      return [{ x: 128, y: 60, w: 104, h: 144 }];
    case "costumeCollar":
      return [{ x: 160, y: 46, w: 40, h: 30 }];
    case "costumeElbows":
    case "shirtElbows":
      return elbowZone();
    case "costumeKnees":
    case "kneeStrapped":
      return kneeBoxes();
    case "beltWide": {
      const h = (s.beltCm ?? 12) * PX_PER_CM;
      return [{ x: 138, y: 152 - h / 2 - 4, w: 84, h: h + 8 }];
    }
    case "unitardPattern": {
      if (!s.unitard) return [];
      if (s.unitard.sleeveCm > s.costume.sleeveCm) {
        return arms.map((a) => ({ x: ARM_X[a] - 14, y: armY(s.costume.sleeveCm), w: 28, h: armY(s.unitard!.sleeveCm) - armY(s.costume.sleeveCm) }));
      }
      return [{ x: 138, y: legY(s.costume.legCm), w: 84, h: legY(s.unitard.legCm) - legY(s.costume.legCm) }];
    }
    case "shortsLonger":
    case "shortsKnees": {
      const from = legY(s.costume.legCm);
      return [{ x: 138, y: from - 2, w: 84, h: legY(s.shortsCm ?? 0) - from + 4 }];
    }
    case "trunkBandage":
      return [{ x: 140, y: 98, w: 80, h: 40 }];
    case "bandageElbow":
      return wrapBoxes("bandage");
    case "tapeElbow":
      return wrapBoxes("tape");
    default:
      return [];
  }
}

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <pattern id={`${uid}stripe`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#3a3f4b" />
        <rect width="3" height="8" fill="#e8e8e8" />
      </pattern>
      <pattern id={`${uid}wrap`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <rect width="6" height="6" fill="#ead9b2" />
        <rect width="1.6" height="6" fill="#c8b27a" />
      </pattern>
    </defs>
  );
}

function Wrap({ w, uid }: { w: ArmWrap; uid: string }) {
  const x = ARM_X[w.arm] - 10;
  const y = armY(w.fromCm);
  const h = (w.toCm - w.fromCm) * PX_PER_CM;
  return w.material === "bandage" ? (
    <rect x={x} y={y} width={20} height={h} rx={3} fill={`url(#${uid}wrap)`} stroke="#b59d63" strokeWidth={1} />
  ) : (
    <g>
      <rect x={x} y={y} width={20} height={h} rx={2} fill="#2d7fd3" stroke="#1c5ea3" strokeWidth={1} />
      <rect x={x + 3} y={y + 2} width={3} height={Math.max(0, h - 4)} fill="#ffffff" opacity={0.35} />
    </g>
  );
}

function Highlight({ box, label }: { box: Box; label?: string }) {
  const above = box.y > 22;
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={4} fill="rgba(214,40,40,0.14)" stroke="#d62828" strokeWidth={2} strokeDasharray="5 3" />
      {label && (
        <text
          x={box.x + box.w / 2}
          y={above ? box.y - 5 : box.y + box.h + 13}
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

export default function OutfitFigure({
  scene,
  highlight = [],
  showMeasurements = false,
}: {
  scene: FigureScene;
  highlight?: FaultId[];
  showMeasurements?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = scene;
  const costume = s.clothing === "costume";
  const main = costumeColour[s.colour];
  const shadeMain = "rgba(0,0,0,0.18)";

  // The torso, as one shape: shoulders, waist and hips.
  const torso = "M138 74 Q180 62 222 74 L216 150 L216 192 L144 192 L144 150 Z";
  const sleeveCm = costume ? s.costume.sleeveCm : 10;
  const legCm = costume ? s.costume.legCm : 20;

  return (
    <svg viewBox="0 0 360 396" role="img" aria-label={describeScene(s)} className="outfit-svg">
      <Defs uid={uid} />
      <rect width="360" height="396" fill="#f4f6fa" />
      <ellipse cx={CX} cy={ANKLE_Y + 28} rx={86} ry={7} fill="rgba(0,0,0,0.08)" />

      {/* Body: arms, hands, legs, head */}
      {arms.map((a) => (
        <g key={a}>
          <rect x={ARM_X[a] - ARM_W / 2} y={SHOULDER_Y - 4} width={ARM_W} height={110} rx={9} fill={SKIN} />
          <ellipse cx={ARM_X[a]} cy={armY(58)} rx={10} ry={12} fill={SKIN} />
          <rect x={LEG_X[a] - 16} y={CROTCH_Y - 4} width={32} height={KNEE_Y - CROTCH_Y + 8} rx={12} fill={SKIN} />
          <rect x={LEG_X[a] - 12} y={KNEE_Y - 4} width={24} height={ANKLE_Y - KNEE_Y + 4} rx={10} fill={SKIN} />
        </g>
      ))}
      {arms.map((a) => (
        <path
          key={a}
          d={`M${ARM_X[a] - 6} ${armY(ELBOW_CM)} Q${ARM_X[a]} ${armY(ELBOW_CM) + 6} ${ARM_X[a] + 6} ${armY(ELBOW_CM)}`}
          stroke={SKIN_SHADE}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <rect x={172} y={52} width={16} height={22} rx={6} fill={SKIN_SHADE} />
      <path d={torso} fill={SKIN} />
      <circle cx={CX} cy={34} r={22} fill={SKIN} />
      <path d="M158 30 Q160 10 180 10 Q200 10 202 30 Q190 20 180 20 Q168 20 158 30 Z" fill="#4a3b2f" />
      <circle cx={172} cy={36} r={2} fill="#4a3b2f" />
      <circle cx={188} cy={36} r={2} fill="#4a3b2f" />
      <path d="M174 45 Q180 49 186 45" stroke="#9b6b4b" strokeWidth={1.6} fill="none" strokeLinecap="round" />

      {/* Under the costume: unitard, T-shirt, shorts */}
      {costume && s.unitard && (
        <g fill={s.unitard.pattern ? `url(#${uid}stripe)` : "#3a3f4b"}>
          {s.unitard.sleeveCm > 0 &&
            arms.map((a) => (
              <rect key={a} x={ARM_X[a] - ARM_W / 2} y={SHOULDER_Y - 4} width={ARM_W} height={s.unitard!.sleeveCm * PX_PER_CM + 4} rx={8} />
            ))}
          {s.unitard.legCm > 0 &&
            arms.map((a) => (
              <rect key={a} x={LEG_X[a] - 16} y={CROTCH_Y - 4} width={32} height={s.unitard!.legCm * PX_PER_CM + 4} rx={12} />
            ))}
        </g>
      )}
      {costume && s.shirtSleeveCm !== null &&
        arms.map((a) => (
          <rect key={a} x={ARM_X[a] - 13} y={SHOULDER_Y - 4} width={26} height={s.shirtSleeveCm! * PX_PER_CM + 4} rx={8} fill="#e9edf3" stroke="#c4cbd6" />
        ))}
      {costume && s.shortsCm !== null &&
        arms.map((a) => (
          <rect key={a} x={LEG_X[a] - 16.5} y={CROTCH_Y - 4} width={33} height={s.shortsCm! * PX_PER_CM + 4} rx={10} fill="#46506a" stroke="#2f3750" />
        ))}

      {/* The costume, or a T-shirt and shorts instead of one */}
      {costume ? (
        <g>
          {arms.map((a) => (
            <rect key={a} x={LEG_X[a] - 17} y={CROTCH_Y - 4} width={34} height={legCm * PX_PER_CM + 4} rx={10} fill={main} />
          ))}
          {sleeveCm > 0 &&
            arms.map((a) => (
              <rect key={a} x={ARM_X[a] - 11} y={SHOULDER_Y - 6} width={22} height={sleeveCm * PX_PER_CM + 6} rx={8} fill={main} />
            ))}
          <path d={torso} fill={main} />
          <path d="M150 192 L210 192" stroke={shadeMain} strokeWidth={2} />
          {/* The neckline: a scoop without a collar, or a standing collar */}
          {s.costume.collar ? (
            <g>
              <path d="M163 74 L168 54 L192 54 L197 74 L180 84 Z" fill={main} stroke="rgba(0,0,0,0.45)" strokeWidth={1.6} />
              <path d="M180 84 L180 62" stroke="rgba(0,0,0,0.45)" strokeWidth={1.2} />
            </g>
          ) : (
            <path d="M162 72 Q180 96 198 72 Q180 66 162 72 Z" fill={SKIN} />
          )}
        </g>
      ) : (
        <g>
          {arms.map((a) => (
            <rect key={a} x={LEG_X[a] - 17} y={CROTCH_Y - 4} width={34} height={legCm * PX_PER_CM + 4} rx={10} fill="#46506a" />
          ))}
          {arms.map((a) => (
            <rect key={a} x={ARM_X[a] - 12} y={SHOULDER_Y - 6} width={24} height={sleeveCm * PX_PER_CM + 6} rx={8} fill={main} />
          ))}
          <path d="M138 74 Q180 62 222 74 L216 150 L216 168 L144 168 L144 150 Z" fill={main} />
          <path d="M144 166 L216 166 L216 196 L144 196 Z" fill="#46506a" />
          <path d="M162 72 Q180 90 198 72 Q180 66 162 72 Z" fill={SKIN} />
          <path d="M162 72 Q180 90 198 72" stroke="rgba(0,0,0,0.3)" strokeWidth={2} fill="none" />
          <path d="M144 167 H216" stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
        </g>
      )}

      {/* A bandage on the trunk, worn over the costume */}
      {s.trunkBandage && (
        <g>
          <rect x={144} y={102} width={72} height={32} rx={4} fill={`url(#${uid}wrap)`} stroke="#b59d63" />
        </g>
      )}

      {/* Belt */}
      {s.beltCm !== null && (
        <g>
          <rect x={142} y={152 - (s.beltCm * PX_PER_CM) / 2} width={76} height={s.beltCm * PX_PER_CM} rx={3} fill="#5a3a1e" stroke="#3b2411" />
          <rect x={CX - 9} y={152 - (s.beltCm * PX_PER_CM) / 2 + 3} width={18} height={s.beltCm * PX_PER_CM - 6} rx={2} fill="#d0d0d0" stroke="#8a8a8a" />
          <rect x={CX - 4} y={152 - 4} width={8} height={8} rx={1} fill="#8a8a8a" />
        </g>
      )}

      {/* Knee supports */}
      {s.kneeSupport &&
        arms.map((a) => (
          <g key={a}>
            <rect x={LEG_X[a] - 17} y={KNEE_Y - 17} width={34} height={34} rx={9} fill="#2b2b2b" stroke="#111" />
            <path d={`M${LEG_X[a] - 12} ${KNEE_Y - 9} H${LEG_X[a] + 12} M${LEG_X[a] - 12} ${KNEE_Y + 9} H${LEG_X[a] + 12}`} stroke="#555" strokeWidth={1.4} />
            {s.kneeSupport === "strapped" && (
              <g>
                <rect x={LEG_X[a] - 20} y={KNEE_Y - 8} width={40} height={6} fill="#9a9a9a" stroke="#555" />
                <rect x={LEG_X[a] - 20} y={KNEE_Y + 4} width={40} height={6} fill="#9a9a9a" stroke="#555" />
                <rect x={LEG_X[a] + 12} y={KNEE_Y - 10} width={9} height={22} rx={1} fill="#d6d6d6" stroke="#555" />
              </g>
            )}
          </g>
        ))}

      {/* Bandages and tape on the arms */}
      {s.wraps.map((w, i) => (
        <Wrap key={i} w={w} uid={uid} />
      ))}

      {/* Feet: sport shoes, or bare */}
      {arms.map((a) => (
        <g key={a}>
          {s.footwear ? (
            <g>
              <path
                d={`M${LEG_X[a] - 14} ${ANKLE_Y - 4} L${LEG_X[a] + 14} ${ANKLE_Y - 4} L${LEG_X[a] + 22} ${ANKLE_Y + 16} L${LEG_X[a] - 20} ${ANKLE_Y + 16} Z`}
                fill="#f2f2f2"
                stroke="#8a8f99"
                strokeWidth={1.4}
              />
              <rect x={LEG_X[a] - 22} y={ANKLE_Y + 14} width={46} height={6} rx={3} fill="#6a707c" />
              <path d={`M${LEG_X[a] - 8} ${ANKLE_Y + 2} H${LEG_X[a] + 8} M${LEG_X[a] - 9} ${ANKLE_Y + 8} H${LEG_X[a] + 10}`} stroke="#8a8f99" strokeWidth={1.4} />
            </g>
          ) : (
            <g>
              <path
                d={`M${LEG_X[a] - 12} ${ANKLE_Y - 2} L${LEG_X[a] + 12} ${ANKLE_Y - 2} L${LEG_X[a] + 20} ${ANKLE_Y + 18} L${LEG_X[a] - 18} ${ANKLE_Y + 18} Z`}
                fill={SKIN}
                stroke={SKIN_SHADE}
              />
              <path
                d={`M${LEG_X[a] - 11} ${ANKLE_Y + 15} V${ANKLE_Y + 18} M${LEG_X[a] - 4} ${ANKLE_Y + 16} V${ANKLE_Y + 18} M${LEG_X[a] + 3} ${ANKLE_Y + 16} V${ANKLE_Y + 18} M${LEG_X[a] + 10} ${ANKLE_Y + 15} V${ANKLE_Y + 18}`}
                stroke={SKIN_SHADE}
                strokeWidth={1.6}
              />
            </g>
          )}
        </g>
      ))}

      {/* A training aid: the elbow areas and the belt width */}
      {showMeasurements && (
        <g fontSize={11} fill="#1c5ea3" fontWeight={600}>
          {arms.map((a) => (
            <g key={a}>
              <rect
                x={ARM_X[a] - 15}
                y={armY(ELBOW_AREA.from)}
                width={30}
                height={(ELBOW_AREA.to - ELBOW_AREA.from) * PX_PER_CM}
                fill="rgba(45,127,211,0.12)"
                stroke="#2d7fd3"
                strokeWidth={1.4}
                strokeDasharray="4 3"
              />
              <text x={a === "left" ? ARM_X.left - 20 : ARM_X.right + 20} y={armY(ELBOW_CM) + 4} textAnchor={a === "left" ? "end" : "start"}>
                10 cm
              </text>
            </g>
          ))}
          {s.beltCm !== null && (
            <g stroke="#1c5ea3" strokeWidth={1.4}>
              <path d={`M104 ${152 - (s.beltCm * PX_PER_CM) / 2} V${152 + (s.beltCm * PX_PER_CM) / 2} M100 ${152 - (s.beltCm * PX_PER_CM) / 2} H108 M100 ${152 + (s.beltCm * PX_PER_CM) / 2} H108`} fill="none" />
              <text x={96} y={157} textAnchor="end" stroke="none">
                {s.beltCm} cm
              </text>
            </g>
          )}
        </g>
      )}

      {/* The faults, after the answer */}
      {highlight.flatMap((id) =>
        boxesFor(id, s).map((box, i) => <Highlight key={`${id}${i}`} box={box} label={i === 0 ? faultById(id).short : undefined} />),
      )}
    </svg>
  );
}
