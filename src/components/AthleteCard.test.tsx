import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AthleteCard, { type AthleteCardData } from "./AthleteCard";

afterEach(cleanup);

const base: AthleteCardData = {
  name: "Test Athlete",
  snatch: { attempts: [{}, {}, {}] },
  cleanAndJerk: { attempts: [{}, {}, {}] },
};

/** Text of the first cell whose label matches. */
const cellText = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll(".ac-cell")).find((c) =>
    c.querySelector(".ac-label")?.textContent === label,
  )?.textContent;

describe("AthleteCard", () => {
  it("shows the 20kg rule as entry total minus 20", () => {
    const { container } = render(<AthleteCard data={{ ...base, entryTotal: 275 }} />);
    expect(cellText(container, "20kg Rule")).toBe("20kg Rule255");
  });

  it("always shows the age group as Senior", () => {
    const { container } = render(<AthleteCard data={base} />);
    expect(cellText(container, "Age Group")).toBe("Age GroupSenior");
  });

  it("leaves the 20kg rule empty without an entry total", () => {
    const { container } = render(<AthleteCard data={base} />);
    expect(cellText(container, "20kg Rule")).toBe("20kg Rule");
  });

  it("shows the signature on the top field and the starting weight", () => {
    const data: AthleteCardData = {
      ...base,
      signature: "Fran.",
      snatch: { attempts: [{ declaration: 100, declarationSignature: "Holm." }, {}, {}] },
    };
    const { container } = render(<AthleteCard data={data} />);
    const sigs = Array.from(container.querySelectorAll(".ac-signature")).map((e) => e.textContent);
    expect(sigs).toContain("Fran.");
    expect(sigs).toContain("Holm.");
  });

  it("strikes no boxes while no final weight is chosen", () => {
    const { container } = render(<AthleteCard data={base} />);
    expect(container.querySelectorAll(".ac-struck")).toHaveLength(0);
  });

  it("strikes both unused change boxes and signatures after the declaration", () => {
    const data: AthleteCardData = {
      ...base,
      snatch: { attempts: [{ declaration: 100, final: 0 }, {}, {}] },
    };
    const { container } = render(<AthleteCard data={data} />);
    expect(container.querySelectorAll(".ac-struck")).toHaveLength(4);
  });

  it("strikes only change 2 after a final weight at change 1", () => {
    const data: AthleteCardData = {
      ...base,
      snatch: {
        attempts: [{ declaration: 100, change1: { weight: 98 }, final: 1 }, {}, {}],
      },
    };
    const { container } = render(<AthleteCard data={data} />);
    expect(container.querySelectorAll(".ac-struck")).toHaveLength(2);
  });

  it("strikes nothing when the final weight is change 2", () => {
    const data: AthleteCardData = {
      ...base,
      snatch: {
        attempts: [
          { declaration: 100, change1: { weight: 98 }, change2: { weight: 96 }, final: 2 },
          {},
          {},
        ],
      },
    };
    const { container } = render(<AthleteCard data={data} />);
    expect(container.querySelectorAll(".ac-struck")).toHaveLength(0);
    expect(container.querySelectorAll(".ac-circle")).toHaveLength(1);
  });
});

describe("results on the final weight", () => {
  const withResult = (result?: "good" | "no"): AthleteCardData => ({
    ...base,
    snatch: { attempts: [{ declaration: 100, change1: { weight: 104 }, final: 1, result }, {}, {}] },
  });

  it("circles the final weight after a good lift", () => {
    const { container } = render(<AthleteCard data={withResult("good")} />);
    expect(container.querySelectorAll(".ac-circle")).toHaveLength(1);
    expect(container.querySelectorAll(".ac-strike")).toHaveLength(0);
  });

  it("strikes the final weight instead of circling it after a no lift", () => {
    const { container } = render(<AthleteCard data={withResult("no")} />);
    expect(container.querySelectorAll(".ac-circle")).toHaveLength(0);
    expect(container.querySelectorAll(".ac-strike")).toHaveLength(1);
  });

  it("still circles the final weight when no result is given", () => {
    const { container } = render(<AthleteCard data={withResult()} />);
    expect(container.querySelectorAll(".ac-circle")).toHaveLength(1);
  });
});
