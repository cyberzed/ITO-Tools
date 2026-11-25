import { describe, expect, it } from "vitest";
import { meetsTwentyKgRule, twentyKgRuleLimit } from "./rules";

describe("20 kg Rule", () => {
  it("is the entry total minus 20", () => {
    expect(twentyKgRuleLimit(200)).toBe(180);
  });

  it("accepts the combinations from the rulebook example (entry total 200)", () => {
    expect(meetsTwentyKgRule(200, 80, 100)).toBe(true);
    expect(meetsTwentyKgRule(200, 77, 103)).toBe(true);
  });

  it("accepts a sum exactly on the limit and rejects one kg below", () => {
    expect(meetsTwentyKgRule(200, 80, 100)).toBe(true);
    expect(meetsTwentyKgRule(200, 80, 99)).toBe(false);
  });
});
