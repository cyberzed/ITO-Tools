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

  it("leaves the 20kg rule empty without an entry total", () => {
    const { container } = render(<AthleteCard data={base} />);
    expect(cellText(container, "20kg Rule")).toBe("20kg Rule");
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
