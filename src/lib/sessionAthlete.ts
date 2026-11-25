export type Gender = "M" | "F";

export const firstNames: Record<Gender, string[]> = {
  M: ["Julian", "Lukas", "Mikkel", "Oskar", "Emil", "Anton", "Jonas", "Marek"],
  F: ["Sofia", "Emma", "Clara", "Nina", "Freja", "Hanna", "Ida", "Lena"],
};
const lastNames = [
  "Frank", "Nielsen", "Larsen", "Berg", "Kowalski", "Novak", "Weber", "Moreau",
  "Lindgren", "Haas", "Petrov", "Bauer", "Jensen", "Rossi", "Holm", "Vogel",
];

/** Uniform random integer in [0, n) from the Web Crypto API (rejection sampling avoids modulo bias). */
function randBelow(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

const pick = <T,>(list: T[]): T => list[randBelow(list.length)];
const randInt = (min: number, max: number) => min + randBelow(max - min + 1);

export interface SessionAthlete {
  name: string;
  /** Needed later to pick the right weight category. */
  gender: Gender;
  /** dd.mm.yyyy */
  birthDate: string;
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** A random day of the current year, moved back 17-30 years. */
function randomBirthDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const daysInYear = isLeap(year) ? 366 : 365;
  const day = new Date(year, 0, 1 + randInt(0, daysInYear - 1));
  const birthYear = year - randInt(17, 30);

  let date = day.getDate();
  const month = day.getMonth();
  if (month === 1 && date === 29 && !isLeap(birthYear)) date = 28;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date)}.${pad(month + 1)}.${birthYear}`;
}

function generate(): SessionAthlete {
  const gender: Gender = pick<Gender>(["M", "F"]);
  return {
    name: `${pick(firstNames[gender])} ${pick(lastNames)}`,
    gender,
    birthDate: randomBirthDate(),
  };
}

let fallback: SessionAthlete | undefined;

/**
 * A random athlete that stays the same for the browser session
 * (it survives navigation and reloads, but not closing the tab).
 */
export function getSessionAthlete(key = "athlete"): SessionAthlete {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<SessionAthlete>;
      if (parsed.name && parsed.birthDate && (parsed.gender === "M" || parsed.gender === "F")) return parsed as SessionAthlete;
    }
    const athlete = generate();
    sessionStorage.setItem(key, JSON.stringify(athlete));
    return athlete;
  } catch {
    // Storage unavailable: keep one athlete for as long as the page stays loaded.
    return (fallback ??= generate());
  }
}
