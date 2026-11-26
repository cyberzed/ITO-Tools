/**
 * The worked example in the Regulation to TCRR 6.6.6 (Calling order): men's 60 kg, groups B
 * and A. Each attempt is the weight taken and its number in the calling order. Null means the
 * athlete took no attempt.
 */
export interface ExampleAthlete {
  lot: number;
  start: number;
  name: string;
  snatch: ([number, number] | null)[];
  cleanAndJerk: ([number, number] | null)[];
}

export const exampleGroups: { group: string; athletes: ExampleAthlete[] }[] = [
  {
    group: "B",
    athletes: [
      { lot: 3, start: 1, name: "A", snatch: [[100, 4], [100, 9], [100, 11]], cleanAndJerk: [[120, 6], [120, 9], [120, 12]] },
      { lot: 20, start: 2, name: "B", snatch: [[95, 3], [100, 8], null], cleanAndJerk: [null, null, null] },
      { lot: 102, start: 3, name: "C", snatch: [[100, 5], [100, 10], [105, 15]], cleanAndJerk: [[120, 7], [120, 10], [125, 14]] },
      { lot: 199, start: 4, name: "D", snatch: [[90, 1], [100, 7], [105, 14]], cleanAndJerk: [[115, 2], [115, 4], [115, 5]] },
      { lot: 251, start: 5, name: "E", snatch: [[94, 2], [101, 12], [105, 16]], cleanAndJerk: [[110, 1], [115, 3], [120, 11]] },
      { lot: 289, start: 6, name: "F", snatch: [[100, 6], [101, 13], [105, 17]], cleanAndJerk: [[120, 8], [125, 13], [125, 15]] },
    ],
  },
  {
    group: "A",
    athletes: [
      { lot: 1, start: 1, name: "G", snatch: [[91, 3], [95, 6], [100, 12]], cleanAndJerk: [[115, 3], [116, 8], [120, 12]] },
      { lot: 4, start: 2, name: "H", snatch: [[100, 7], [100, 10], [105, 16]], cleanAndJerk: [[115, 4], [120, 10], [125, 14]] },
      { lot: 133, start: 3, name: "I", snatch: [[90, 2], [95, 5], [105, 15]], cleanAndJerk: [[114, 2], [115, 6], [115, 7]] },
      { lot: 198, start: 4, name: "J", snatch: [[85, 1], [94, 4], [105, 14]], cleanAndJerk: [null, null, null] },
      { lot: 204, start: 5, name: "K", snatch: [[100, 8], [100, 11], [105, 17]], cleanAndJerk: [[110, 1], [115, 5], [120, 11]] },
      { lot: 246, start: 6, name: "L", snatch: [[100, 9], [103, 13], [105, 18]], cleanAndJerk: [[120, 9], [125, 13], [125, 15]] },
    ],
  },
];
