/**
 * IWF senior bodyweight categories. This project only covers senior athletes.
 * Source: IWF Technical and Competition Rules & Regulations 2026
 * (reference/IWF-TCRR-2026.pdf), articles 1.1.2 and 1.2.1-1.2.2 and the Regulation to 1.2.
 */

export type Gender = "M" | "F";

export interface Category {
  /** Display name as on the card, for example "60 kg" or "+110 kg". */
  label: string;
  /** Highest bodyweight in kg that belongs to the category (inclusive). Null for the open "+" category. */
  maxKg: number | null;
}

const toCategories = (limits: number[]): Category[] => [
  ...limits.map((kg) => ({ label: `${kg} kg`, maxKg: kg })),
  { label: `+${limits[limits.length - 1]} kg`, maxKg: null },
];

const men = toCategories([60, 65, 70, 75, 85, 95, 110]); // 1.2.1
const women = toCategories([49, 53, 57, 61, 69, 77, 86]); // 1.2.2

/** Senior categories in competition order. */
export function categoriesFor(gender: Gender): Category[] {
  return gender === "M" ? men : women;
}

/**
 * The category a bodyweight falls in. A category includes its upper limit,
 * so 60.00 kg is "60 kg" and 60.01 kg is "65 kg".
 */
export function categoryFor(gender: Gender, bodyWeightKg: number): Category {
  return categoriesFor(gender).find((c) => c.maxKg === null || bodyWeightKg <= c.maxKg)!;
}

/** Generated athletes weigh from 5 kg under the lowest category to 30 kg over the highest limit. */
export function bodyWeightRange(gender: Gender): { min: number; max: number } {
  const limits = categoriesFor(gender).flatMap((c) => (c.maxKg === null ? [] : [c.maxKg]));
  return { min: limits[0] - 5, max: limits[limits.length - 1] + 30 };
}
