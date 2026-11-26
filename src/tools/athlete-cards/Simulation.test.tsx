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
const results = () => Array.from(screen.getByRole("list", { name: "Results" }).children).map((e) => e.textContent);

it("starts at attempt 1 with the starting weight on the bar", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  expect(screen.getByRole("heading", { name: `Attempt 1: ${a.snatchStart} kg` })).toBeTruthy();
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
  expect(screen.getByRole("heading", { name: `Attempt 1: ${a.snatchStart} kg` })).toBeTruthy();
  type(/new weight/i, String(a.snatchStart + 1));
  click("Change weight");
  expect(screen.getByRole("heading", { name: `Attempt 1: ${a.snatchStart + 1} kg` })).toBeTruthy();
});

it("lets the weight go down before the attempt is called", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  type(/new weight/i, String(a.snatchStart - 2));
  click("Change weight");
  expect(screen.getByRole("heading", { name: `Attempt 1: ${a.snatchStart - 2} kg` })).toBeTruthy();
});

it("changes the weight twice, then blocks a third change", () => {
  const a = getSessionAthlete();
  const { container } = render(<Simulation />);
  type(/new weight/i, String(a.snatchStart + 2));
  click("Change weight");
  type(/new weight/i, String(a.snatchStart + 4));
  click("Change weight");
  expect(screen.getByRole("heading", { name: `Attempt 1: ${a.snatchStart + 4} kg` })).toBeTruthy();
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
  expect(screen.getByRole("heading", { name: "Declare attempt 2" })).toBeTruthy();
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

it("runs all three attempts, shows the best snatch and restarts", () => {
  const a = getSessionAthlete();
  render(<Simulation />);
  lift("Good lift");
  click("Declare");
  lift("No lift");
  click("Declare");
  lift("Good lift");
  expect(screen.getByRole("heading", { name: "Snatch finished" })).toBeTruthy();
  // Attempt 2 was declared at the automatic progression and failed. Attempt 3 repeats that weight.
  expect(results()).toEqual([
    `Attempt 1: ${a.snatchStart} kg, Good lift`,
    `Attempt 2: ${a.snatchStart + 1} kg, No lift`,
    `Attempt 3: ${a.snatchStart + 1} kg, Good lift`,
  ]);
  expect(screen.getByText(`Best snatch: ${a.snatchStart + 1} kg.`)).toBeTruthy();

  click("Restart");
  expect(screen.getByRole("heading", { name: `Attempt 1: ${a.snatchStart} kg` })).toBeTruthy();
  expect(results()).toEqual([`Attempt 1: ${a.snatchStart} kg`]);
});
