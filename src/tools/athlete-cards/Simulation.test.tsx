import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { getSessionAthlete } from "../../lib/sessionAthlete";
import Simulation from "./Simulation";

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
/** Call the attempt, then record the result. */
const lift = (result: string) => {
  click("Call attempt");
  click(result);
};
const results = () => Array.from(document.querySelectorAll(".sim-results li")).map((e) => e.textContent);

it("starts at attempt 1 with the starting weight on the bar", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  expect(screen.getByRole("heading", { name: `Snatch attempt 1: ${a.snatchStart} kg` })).toBeTruthy();
});

it("only shows the lift buttons once the attempt is called", () => {
  render(<Simulation />);
  expect(screen.queryByRole("button", { name: "Good lift" })).toBeNull();
  click("Call attempt");
  expect(screen.getByRole("button", { name: "Good lift" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Call attempt" })).toBeNull();
});

it("cannot lower the weight once it is loaded and called, but can raise it", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  click("Call attempt");
  type(/new weight/i, String(a.snatchStart - 1));
  click("Change weight");
  expect(screen.getByRole("alert").textContent).toContain("loaded and called");
  expect(screen.getByRole("heading", { name: `Snatch attempt 1: ${a.snatchStart} kg` })).toBeTruthy();
  type(/new weight/i, String(a.snatchStart + 1));
  click("Change weight");
  expect(screen.getByRole("heading", { name: `Snatch attempt 1: ${a.snatchStart + 1} kg` })).toBeTruthy();
});

it("lets the weight go down before the attempt is called", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  type(/new weight/i, String(a.snatchStart - 2));
  click("Change weight");
  expect(screen.getByRole("heading", { name: `Snatch attempt 1: ${a.snatchStart - 2} kg` })).toBeTruthy();
});

it("changes the weight twice, then blocks a third change", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  type(/new weight/i, String(a.snatchStart + 2));
  click("Change weight");
  type(/new weight/i, String(a.snatchStart + 4));
  click("Change weight");
  expect(screen.getByRole("heading", { name: `Snatch attempt 1: ${a.snatchStart + 4} kg` })).toBeTruthy();
  expect(screen.getByText(/Changes left: 0/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Change weight" }).hasAttribute("disabled")).toBe(true);
  // Before the result there is no circle yet.
  expect(container.querySelectorAll(".ac-circle")).toHaveLength(0);
});

it("circles the final weight and strikes the unused change boxes after the result", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  type(/new weight/i, String(a.snatchStart + 3));
  click("Change weight");
  lift("Good lift");
  expect(container.querySelectorAll(".ac-circle")).toHaveLength(1);
  // Change 2 is unused on attempt 1: its weight box and its signature box are struck.
  expect(container.querySelectorAll(".ac-struck")).toHaveLength(2);
});

it("strikes the final weight instead of circling it after a no lift", () => {
  const { container } = render(<Simulation />);
  lift("No lift");
  expect(container.querySelectorAll(".ac-circle")).toHaveLength(0);
  expect(container.querySelectorAll(".ac-strike")).toHaveLength(1);
});

it("offers 1 kg more after a good lift and the same weight after a no lift", () => {
  const a = getSessionAthlete();
  const { unmount } = render(<Simulation />);
  lift("Good lift");
  expect((screen.getByLabelText(/declared weight/i) as HTMLInputElement).value).toBe(String(a.snatchStart + 1));
  unmount();

  render(<Simulation />);
  lift("No lift");
  expect((screen.getByLabelText(/declared weight/i) as HTMLInputElement).value).toBe(String(a.snatchStart));
});

it("rejects a declaration under the automatic progression", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  lift("Good lift");
  type(/declared weight/i, String(a.snatchStart));
  click("Declare");
  expect(screen.getByRole("alert").textContent).toContain("automatic progression");
  expect(screen.getByRole("heading", { name: "Declare snatch attempt 2" })).toBeTruthy();
});

it("fills in Required C&J once the first attempt is taken", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  const required = () =>
    Array.from(container.querySelectorAll(".ac-cell")).find((c) => c.querySelector(".ac-label")?.textContent === "Required C&J")
      ?.textContent;
  expect(required()).toBe("Required C&J");
  // The 20kg Rule box is filled from the entry total right away.
  const ruleBox = Array.from(container.querySelectorAll(".ac-cell")).find(
    (c) => c.querySelector(".ac-label")?.textContent === "20kg Rule",
  );
  expect(ruleBox?.textContent).toBe(`20kg Rule${a.entryTotal - 20}`);
  // Changing and calling the first attempt is not enough: it has to be recorded.
  click("Call attempt");
  expect(required()).toBe("Required C&J");
  click("Good lift");
  expect(required()).toBe(`Required C&J${Math.max(0, a.entryTotal - 20 - a.snatchStart)}`);
});

/** Play the three snatch attempts: good, no, good, always declaring the automatic progression. */
const playSnatch = () => {
  lift("Good lift");
  click("Declare");
  lift("No lift");
  click("Declare");
  lift("Good lift");
};

it("runs all three snatch attempts and shows the best snatch", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  playSnatch();
  expect(screen.getByRole("heading", { name: "Snatch finished" })).toBeTruthy();
  // Attempt 2 was declared at the automatic progression and failed. Attempt 3 repeats that weight.
  expect(results()).toEqual([
    `Snatch 1: ${a.snatchStart} kg, Good lift`,
    `Snatch 2: ${a.snatchStart + 1} kg, No lift`,
    `Snatch 3: ${a.snatchStart + 1} kg, Good lift`,
  ]);
  expect(screen.getByText(`Best snatch: ${a.snatchStart + 1} kg.`)).toBeTruthy();
});

it("restarts from attempt 1", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  playSnatch();
  click("Restart");
  expect(screen.getByRole("heading", { name: `Snatch attempt 1: ${a.snatchStart} kg` })).toBeTruthy();
  expect(results()).toEqual([`Snatch 1: ${a.snatchStart} kg`]);
});

const cell = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll(".ac-cell")).find((c) => c.querySelector(".ac-label")?.textContent === label)
    ?.textContent;

it("goes on to the clean & jerk at the starting weight and plays it through to a total", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  playSnatch();
  click(/start clean/i);
  expect(screen.getByRole("heading", { name: `Clean & Jerk attempt 1: ${a.cleanAndJerkStart} kg` })).toBeTruthy();
  // Good, good, no: best C&J is the second attempt's weight.
  lift("Good lift");
  click("Declare");
  lift("Good lift");
  click("Declare");
  lift("No lift");
  expect(screen.getByRole("heading", { name: "Clean & Jerk finished" })).toBeTruthy();
  const bestCj = a.cleanAndJerkStart + 1;
  const bestSnatch = a.snatchStart + 1;
  expect(screen.getByText(new RegExp(`Total: ${bestSnatch + bestCj} kg`))).toBeTruthy();
  expect(cell(container, "Total")).toBe(`Total${bestSnatch + bestCj}`);
  expect(results()).toHaveLength(6);
});

it("has no total when the clean & jerk has no good lift", () => {
  const { container } = render(<Simulation />);
  playSnatch();
  click(/start clean/i);
  lift("No lift");
  click("Declare");
  lift("No lift");
  click("Declare");
  lift("No lift");
  expect(screen.getByText(/No total/)).toBeTruthy();
  expect(cell(container, "Total")).toBe("Total");
});

it("keeps the total off the card until the clean & jerk is finished", () => {
  const { container } = render(<Simulation />);
  playSnatch();
  click(/start clean/i);
  lift("Good lift");
  expect(cell(container, "Total")).toBe("Total");
});

it("blocks the first clean & jerk attempt while it breaks the 20 kg Rule", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  // Take a lighter first snatch than the starting weight. That raises Required C&J by 16 kg, which
  // is more than the room the starting weights ever have (at most 15 kg).
  type(/new weight/i, String(a.snatchStart - 16));
  click("Change weight");
  lift("Good lift");
  click("Declare");
  lift("Good lift");
  click("Declare");
  lift("Good lift");
  click(/start clean/i);

  const required = Math.max(0, a.entryTotal - 20 - (a.snatchStart - 16));
  expect(required).toBeGreaterThan(a.cleanAndJerkStart);
  expect(screen.getByRole("status").textContent).toContain(`at least ${required} kg`);
  expect(screen.getByRole("button", { name: "Call attempt" }).hasAttribute("disabled")).toBe(true);

  // A change below the requirement is refused, one at the requirement is accepted and can be called.
  type(/new weight/i, String(required - 1));
  click("Change weight");
  expect(screen.getByRole("alert").textContent).toContain("20 kg Rule");
  type(/new weight/i, String(required));
  click("Change weight");
  expect(screen.getByRole("button", { name: "Call attempt" }).hasAttribute("disabled")).toBe(false);
  expect(screen.queryByRole("status")).toBeNull();
});

it("does not hold a clean & jerk that already respects the 20 kg Rule", () => {
  render(<Simulation />);
  playSnatch();
  click(/start clean/i);
  expect(screen.getByRole("button", { name: "Call attempt" }).hasAttribute("disabled")).toBe(false);
});

it("shows the snatch and the clean & jerk results in two separate rows", () => {
  const { container } = render(<Simulation />);
  expect(container.querySelectorAll(".sim-results")).toHaveLength(1);
  expect(screen.getByRole("list", { name: "Snatch results" })).toBeTruthy();
  playSnatch();
  click(/start clean/i);
  lift("Good lift");
  const snatchRow = screen.getByRole("list", { name: "Snatch results" });
  const cjRow = screen.getByRole("list", { name: "Clean & Jerk results" });
  expect(snatchRow).not.toBe(cjRow);
  expect(Array.from(snatchRow.children).map((e) => e.textContent)).toEqual([
    expect.stringMatching(/^Snatch 1:/),
    expect.stringMatching(/^Snatch 2:/),
    expect.stringMatching(/^Snatch 3:/),
  ]);
  expect(Array.from(cjRow.children).map((e) => e.textContent)).toEqual([expect.stringMatching(/^Clean & Jerk 1:.*Good lift$/)]);
});

const notes = (container: HTMLElement) => Array.from(container.querySelectorAll(".ac-note")).map((e) => e.textContent);
const rowOf = (name: string) => Array.from(screen.getByRole("list", { name }).children).map((e) => e.textContent);

it("abstains from the rest of the snatch and carries on to the clean & jerk", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  lift("Good lift");
  click("Abstain from the rest of the snatch");
  expect(screen.getByRole("heading", { name: "Snatch finished" })).toBeTruthy();
  expect(screen.getByText(/Abstained from the rest of the snatch/)).toBeTruthy();
  expect(rowOf("Snatch results")).toEqual([`Snatch 1: ${a.snatchStart} kg, Good lift`, "Snatch 2: Abstained", "Snatch 3: Abstained"]);
  expect(notes(container)).toEqual(["Abstained", "Abstained"]);
  // The clean & jerk is still open.
  click(/start clean/i);
  expect(screen.getByRole("heading", { name: `Clean & Jerk attempt 1: ${a.cleanAndJerkStart} kg` })).toBeTruthy();
});

it("abstains from the rest of the clean & jerk and still gets a total", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  playSnatch();
  click(/start clean/i);
  lift("Good lift");
  click("Abstain from the rest of the clean & jerk");
  expect(screen.getByRole("heading", { name: "Clean & Jerk finished" })).toBeTruthy();
  expect(screen.getByText(/Abstained from the rest of the clean & jerk/)).toBeTruthy();
  expect(screen.getByText(new RegExp(`Total: ${a.snatchStart + 1 + a.cleanAndJerkStart} kg`))).toBeTruthy();
  expect(rowOf("Clean & Jerk results")).toEqual([
    `Clean & Jerk 1: ${a.cleanAndJerkStart} kg, Good lift`,
    "Clean & Jerk 2: Abstained",
    "Clean & Jerk 3: Abstained",
  ]);
  expect(notes(container)).toEqual(["Abstained", "Abstained"]);
});

it("withdrawing during the snatch completes the competition for the athlete", () => {
  const { container } = render(<Simulation />);
  lift("Good lift");
  click("Withdraw from the competition");
  expect(screen.getByRole("heading", { name: "Athlete withdrawn" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /start clean/i })).toBeNull();
  expect(rowOf("Snatch results")[1]).toBe("Snatch 2: Withdrawn");
  expect(rowOf("Clean & Jerk results")).toEqual(["Clean & Jerk 1: Withdrawn", "Clean & Jerk 2: Withdrawn", "Clean & Jerk 3: Withdrawn"]);
  // Two snatch columns and all three clean & jerk columns carry the note.
  expect(notes(container)).toEqual(["Withdrawn", "Withdrawn", "Withdrawn", "Withdrawn", "Withdrawn"]);
  expect(screen.getByText(/No total/)).toBeTruthy();
});

it("withdrawing from the finished snatch skips the whole clean & jerk", () => {
  render(<Simulation />);
  playSnatch();
  click("Withdraw from the competition");
  expect(screen.getByRole("heading", { name: "Athlete withdrawn" })).toBeTruthy();
  expect(rowOf("Clean & Jerk results")).toHaveLength(3);
});

it("withdrawing in the clean & jerk keeps the earlier results and the total", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  playSnatch();
  click(/start clean/i);
  lift("Good lift");
  click("Declare");
  lift("Good lift");
  click("Withdraw from the competition");
  expect(screen.getByRole("heading", { name: "Athlete withdrawn" })).toBeTruthy();
  expect(screen.getByText(new RegExp(`Total: ${a.snatchStart + 1 + a.cleanAndJerkStart + 1} kg`))).toBeTruthy();
});

it("only offers to give up before the weight is called", () => {
  render(<Simulation />);
  expect(screen.getByRole("button", { name: "Withdraw from the competition" })).toBeTruthy();
  click("Call attempt");
  expect(screen.queryByRole("button", { name: "Withdraw from the competition" })).toBeNull();
  expect(screen.queryByRole("button", { name: /abstain/i })).toBeNull();
});

it("can abstain before the first attempt is called, which crosses out the starting weight", () => {
  const { container } = render(<Simulation />);
  click("Abstain from the rest of the snatch");
  expect(rowOf("Snatch results")).toEqual(["Snatch 1: Abstained", "Snatch 2: Abstained", "Snatch 3: Abstained"]);
  expect(notes(container)).toEqual(["Abstained", "Abstained", "Abstained"]);
});

it("offers to give up when declaring too", () => {
  render(<Simulation />);
  lift("Good lift");
  expect(screen.getByRole("button", { name: "Abstain from the rest of the snatch" })).toBeTruthy();
});

it("titles the attempts so they stay apart from the buttons", () => {
  render(<Simulation />);
  const title = screen.getByRole("heading", { name: "Attempts" });
  const section = title.closest("section")!;
  expect(section.querySelector(".sim-results")).not.toBeNull();
  // The give up buttons are outside the attempts section.
  expect(section.contains(screen.getByRole("button", { name: "Withdraw from the competition" }))).toBe(false);
});

const pageCells = (container: HTMLElement, page: number, label: string) =>
  Array.from(container.querySelectorAll(".ac-page")[page].querySelectorAll(".ac-cell")).filter(
    (c) => c.querySelector(".ac-label")?.textContent === label,
  );

it("keeps the weigh-in starting weight on the clean & jerk page when the athlete withdraws first", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  click("Abstain from the rest of the snatch");
  click("Withdraw from the competition");
  const [first] = pageCells(container, 1, "Starting Weight");
  expect(first.textContent).toContain(String(a.cleanAndJerkStart));
  expect(first.textContent).toContain("Withdrawn");
  // The weight is crossed out because the attempt was never taken, and it keeps its signature.
  expect(first.querySelectorAll(".ac-strike")).toHaveLength(1);
  const sigs = Array.from(container.querySelectorAll(".ac-page")[1].querySelectorAll(".ac-signature")).map((e) => e.textContent);
  expect(sigs).toContain(a.signature);
});

it("keeps the clean & jerk starting weight when the athlete withdraws after the snatch", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  playSnatch();
  click("Withdraw from the competition");
  expect(pageCells(container, 1, "Starting Weight")[0].textContent).toContain(String(a.cleanAndJerkStart));
});

it("gives every declaration box the same tall minimum height on both pages", () => {
  const { container } = render(<Simulation />);
  const decl = [...pageCells(container, 0, "Starting Weight"), ...pageCells(container, 0, "Declaration"), ...pageCells(container, 1, "Starting Weight"), ...pageCells(container, 1, "Declaration")];
  expect(decl).toHaveLength(6);
  for (const c of decl) expect(c.classList.contains("ac-decl")).toBe(true);
});

it("explains the steps for each attempt as a list", () => {
  render(<Simulation />);
  const steps = screen.getByRole("list", { name: "Steps for each attempt" });
  expect(Array.from(steps.children).map((e) => e.textContent?.split(".")[0])).toEqual([
    "Declare the weight",
    "Change it if needed",
    "Call the attempt",
    "Record the result",
  ]);
});
