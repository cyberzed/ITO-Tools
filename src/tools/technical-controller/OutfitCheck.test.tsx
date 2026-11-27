import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as outfit from "../../lib/outfit";
import type { FigureScene, HandScene, OutfitScene } from "../../lib/outfit";
import OutfitCheck from "./OutfitCheck";

const figure = (over: Partial<FigureScene> = {}): FigureScene => ({
  kind: "figure",
  footwear: true,
  clothing: "costume",
  colour: "red",
  costume: { sleeveCm: 0, legCm: 14, collar: false },
  beltCm: 10,
  unitard: null,
  shirtSleeveCm: null,
  shortsCm: null,
  kneeSupport: null,
  trunkBandage: false,
  wraps: [],
  ...over,
});
const hand = (over: Partial<HandScene> = {}): HandScene => ({ kind: "hand", glove: null, wraps: [], ...over });

const legal = figure({ beltCm: 12, unitard: { sleeveCm: 54, legCm: 0, pattern: false } });
const twoFaults = figure({ footwear: false, beltCm: 16 });
const oneFault = figure({ kneeSupport: "strapped" });

function show(...scenes: OutfitScene[]) {
  const spy = vi.spyOn(outfit, "generateScene");
  for (const s of scenes) spy.mockReturnValueOnce(s);
  return spy;
}

beforeEach(() => vi.restoreAllMocks());
afterEach(cleanup);

const decide = (label: "Passes" | "Does not pass") => fireEvent.click(screen.getByRole("radio", { name: label }));
const tick = (label: RegExp | string) => fireEvent.click(screen.getByRole("checkbox", { name: label }));
const check = () => fireEvent.click(screen.getByRole("button", { name: "Check" }));
const outlines = (container: HTMLElement) => container.querySelectorAll('rect[stroke-dasharray="5 3"]');

it("shows a picture, without any verdict, and waits for a decision", () => {
  show(oneFault);
  const { container } = render(<OutfitCheck />);
  expect(screen.getByRole("img")).toBeTruthy();
  expect((screen.getByRole("button", { name: "Check" }) as HTMLButtonElement).disabled).toBe(true);
  expect(outlines(container)).toHaveLength(0);
  expect(screen.queryByRole("status")).toBeNull();
  // The checklist only opens for "Does not pass".
  expect(screen.queryByRole("checkbox", { name: /knee support/ })).toBeNull();
});

it("needs a fault ticked before a sample that does not pass can be checked", () => {
  show(oneFault);
  render(<OutfitCheck />);
  decide("Does not pass");
  const button = screen.getByRole("button", { name: "Check" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  tick(/knee support/);
  expect(button.disabled).toBe(false);
});

it("can check a sample that passes with no fault ticked", () => {
  show(legal);
  render(<OutfitCheck />);
  decide("Passes");
  expect((screen.getByRole("button", { name: "Check" }) as HTMLButtonElement).disabled).toBe(false);
});

it("lists the faults of a figure, grouped, and not the faults of a hand", () => {
  show(oneFault);
  render(<OutfitCheck />);
  decide("Does not pass");
  expect(screen.getByRole("checkbox", { name: /No sport footwear/ })).toBeTruthy();
  expect(screen.getByText("Under the costume")).toBeTruthy();
  expect(screen.queryByRole("checkbox", { name: /glove covers more/ })).toBeNull();
});

it("lists the faults of a hand for a hand", () => {
  show(hand({ glove: 2 }));
  render(<OutfitCheck />);
  decide("Does not pass");
  expect(screen.getByRole("checkbox", { name: /glove covers more/ })).toBeTruthy();
  expect(screen.queryByRole("checkbox", { name: /No sport footwear/ })).toBeNull();
});

it("scores a sample that passes, and says what looked suspicious but is allowed", () => {
  show(legal);
  render(<OutfitCheck />);
  decide("Passes");
  check();
  expect(screen.getByText("Correct.")).toBeTruthy();
  expect(screen.getByText("Correct: 1 of 1")).toBeTruthy();
  expect(screen.getByText(/There is no fault in this sample/)).toBeTruthy();
  expect(screen.getByText("Looks suspicious, but is allowed:")).toBeTruthy();
  expect(screen.getByText(/unitard under the costume that covers the elbows/)).toBeTruthy();
  expect(screen.getByText(/TCRR 4\.7\.1/)).toBeTruthy();
});

it("scores a sample with two faults when both are ticked", () => {
  show(twoFaults);
  const { container } = render(<OutfitCheck />);
  decide("Does not pass");
  tick(/No sport footwear/);
  tick(/belt is wider/);
  check();
  expect(screen.getByText("Correct.")).toBeTruthy();
  expect(screen.getByText("Correct: 1 of 1")).toBeTruthy();
  expect(screen.getByText(/TCRR 4\.1\.1, 4\.3\.1/)).toBeTruthy();
  expect(screen.getByText(/TCRR 4\.4\.2/)).toBeTruthy();
  // The faults are outlined in the picture, after the answer.
  expect(outlines(container)).toHaveLength(2);
});

it("does not score a sample where a fault was missed, and says which", () => {
  show(twoFaults);
  render(<OutfitCheck />);
  decide("Does not pass");
  tick(/belt is wider/);
  check();
  expect(screen.getByText("It does not pass, but not for those reasons.")).toBeTruthy();
  expect(screen.getByText(/No sport footwear.*You missed this/)).toBeTruthy();
  expect(screen.getByText("Correct: 0 of 1")).toBeTruthy();
});

it("does not score a wrong fault, and says it is not a fault here", () => {
  show(oneFault);
  render(<OutfitCheck />);
  decide("Does not pass");
  tick(/knee support/);
  tick(/belt is wider/);
  check();
  expect(screen.getByText("You ticked these, but they are not a fault here:")).toBeTruthy();
  expect(within(screen.getByRole("status")).getByText("The belt is wider than 12 cm")).toBeTruthy();
  expect(screen.getByText("Correct: 0 of 1")).toBeTruthy();
});

it("says so when a sample that does not pass was passed", () => {
  show(oneFault);
  render(<OutfitCheck />);
  decide("Passes");
  check();
  expect(screen.getByText("This sample does not pass.")).toBeTruthy();
  expect(screen.getByText(/A knee support with buckles or straps/)).toBeTruthy();
  expect(screen.getByText("Correct: 0 of 1")).toBeTruthy();
});

it("says so when a sample that passes was failed", () => {
  show(legal);
  render(<OutfitCheck />);
  decide("Does not pass");
  tick(/belt is wider/);
  check();
  expect(screen.getByText("This sample passes.")).toBeTruthy();
  expect(screen.getByText("Correct: 0 of 1")).toBeTruthy();
});

it("shows the measurements only when the switch is on, and after the check", () => {
  show(legal);
  const { container } = render(<OutfitCheck />);
  expect(container.querySelector("svg")!.textContent).not.toContain("cm");
  fireEvent.click(screen.getByRole("checkbox", { name: "Show measurements" }));
  expect(container.querySelector("svg")!.textContent).toContain("12 cm");
  fireEvent.click(screen.getByRole("checkbox", { name: "Show measurements" }));
  expect(container.querySelector("svg")!.textContent).not.toContain("cm");
  decide("Passes");
  check();
  expect(container.querySelector("svg")!.textContent).toContain("12 cm");
});

it("moves on to the next sample, and gives the generator the one just shown", () => {
  const spy = show(oneFault, legal);
  render(<OutfitCheck />);
  decide("Does not pass");
  tick(/knee support/);
  check();
  fireEvent.click(screen.getByRole("button", { name: "Next sample" }));
  expect(spy).toHaveBeenLastCalledWith(undefined, oneFault);
  expect(screen.queryByRole("status")).toBeNull();
  expect((screen.getByRole("radio", { name: "Passes" }) as HTMLInputElement).checked).toBe(false);
  expect((screen.getByRole("radio", { name: "Does not pass" }) as HTMLInputElement).checked).toBe(false);
  // The score stays for the visit.
  expect(screen.getByText("Correct: 1 of 1")).toBeTruthy();
});

it("does not keep the ticks from one sample in the next", () => {
  show(oneFault, twoFaults);
  render(<OutfitCheck />);
  decide("Does not pass");
  tick(/knee support/);
  check();
  fireEvent.click(screen.getByRole("button", { name: "Next sample" }));
  decide("Does not pass");
  expect((screen.getByRole("checkbox", { name: /No sport footwear/ }) as HTMLInputElement).checked).toBe(false);
  expect((screen.getByRole("button", { name: "Check" }) as HTMLButtonElement).disabled).toBe(true);
});

it("locks the answer after the check", () => {
  show(oneFault);
  render(<OutfitCheck />);
  decide("Does not pass");
  tick(/knee support/);
  check();
  // The fieldset is disabled, which disables everything in it.
  expect(screen.getByRole("radio", { name: "Passes" }).matches(":disabled")).toBe(true);
  expect(screen.getByRole("checkbox", { name: /knee support/ }).matches(":disabled")).toBe(true);
});

it("works for the hand: a glove that goes too far", () => {
  show(hand({ glove: 2 }));
  const { container } = render(<OutfitCheck />);
  decide("Does not pass");
  tick(/glove covers more/);
  check();
  expect(screen.getByText("Correct.")).toBeTruthy();
  expect(screen.getByText(/TCRR 4\.6\.2/)).toBeTruthy();
  expect(outlines(container)).toHaveLength(1);
});
