/**
 * IWF bodyweight categories and age groups.
 * Source: IWF Technical and Competition Rules & Regulations 2026
 * (reference/IWF-TCRR-2026.pdf), articles 1.1 and 1.2 and the Regulation to 1.2.
 */

export type Gender = "M" | "F";
export type AgeGroup = "youth" | "junior" | "senior";

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

const juniorSeniorMen = toCategories([60, 65, 70, 75, 85, 95, 110]); // 1.2.1
const juniorSeniorWomen = toCategories([49, 53, 57, 61, 69, 77, 86]); // 1.2.2
const youthMen = toCategories([55, 60, 65, 70, 75, 85, 95]); // 1.2.3
const youthWomen = toCategories([45, 49, 53, 57, 61, 69, 77]); // 1.2.4

/** Categories in competition order for a gender and age group. */
export function categoriesFor(gender: Gender, ageGroup: AgeGroup): Category[] {
  if (ageGroup === "youth") return gender === "M" ? youthMen : youthWomen;
  return gender === "M" ? juniorSeniorMen : juniorSeniorWomen;
}

/**
 * Age groups an athlete may compete in (1.1.2). Age is the calendar year minus
 * the year of birth: youth 13-17, junior 15-20, senior 15+. The groups overlap.
 */
export function ageGroupsFor(birthYear: number, year: number): AgeGroup[] {
  const age = year - birthYear;
  const groups: AgeGroup[] = [];
  if (age >= 13 && age <= 17) groups.push("youth");
  if (age >= 15 && age <= 20) groups.push("junior");
  if (age >= 15) groups.push("senior");
  return groups;
}

/**
 * The category a bodyweight falls in. A category includes its upper limit,
 * so 60.00 kg is "60 kg" and 60.01 kg is "65 kg".
 */
export function categoryFor(gender: Gender, ageGroup: AgeGroup, bodyWeightKg: number): Category {
  const list = categoriesFor(gender, ageGroup);
  return list.find((c) => c.maxKg === null || bodyWeightKg <= c.maxKg)!;
}
