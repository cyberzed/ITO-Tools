/** Uniform random integer in [0, n) from the Web Crypto API (rejection sampling avoids modulo bias). */
export function randBelow(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

/** Random integer in [min, max], both included. */
export const randInt = (min: number, max: number): number => min + randBelow(max - min + 1);

export const pick = <T,>(list: readonly T[]): T => list[randBelow(list.length)];

/** A shuffled copy (Fisher-Yates). */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randBelow(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
