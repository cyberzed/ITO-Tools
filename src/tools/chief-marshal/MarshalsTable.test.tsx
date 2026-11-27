import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as marshal from "../../lib/marshal";
import { openAttempt, type Rng, type Sim } from "../../lib/marshal";
import Practice from "./MarshalsTable";

function seeded(seed: number): Rng {
  let s = seed;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return {
    int: (min, max) => min + Math.floor(rand() * (max - min + 1)),
    chance: (p) => rand() * 100 < p,
    pick: (list) => list[Math.floor(rand() * list.length)],
  };
}

/** A group where the called athlete lifts at 40 seconds, with one valid card for a waiting athlete. */
function scripted(): { sim: Sim; waiting: number } {
  const sim = marshal.createSim(seeded(21), "M", 4);
  const called = sim.round!.start;
  const waiting = sim.athletes.find((a) => a.start !== called && openAttempt(a)!.changes < 2)!;
  const open = openAttempt(waiting)!;
  const facts = { from: open.weight, to: open.weight + 2, changesUsed: open.changes, onClock: false, secondsLeft: 50 };
  const request = {
    id: 1,
    start: waiting.start,
    attempt: open.index + 1,
    ...facts,
    verdict: marshal.judgeRequest(facts),
  };
  return { sim: { ...sim, round: { ...sim.round!, arrivals: [], liftAt: 40, requests: [request] } }, waiting: waiting.start };
}

const realCreate = marshal.createSim;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const run = (seconds: number) => act(() => void vi.advanceTimersByTime(seconds * 1000));
const clock = () => screen.getByLabelText("The timing clock").textContent ?? "";

it("shows two athlete cards and a clock that waits for Start", () => {
  vi.spyOn(marshal, "createSim").mockReturnValue(marshal.createSim(seeded(5)));
  const { container } = render(<Practice />);
  expect(container.querySelectorAll(".marshal-card")).toHaveLength(2);
  expect(container.querySelectorAll(".marshal-card.on-clock")).toHaveLength(1);
  expect(container.querySelectorAll(".ac-page")).toHaveLength(2); // the snatch page only
  expect(clock()).toContain("1:00");
  expect(screen.getByText(/Press Start/)).toBeTruthy();
  run(10);
  expect(clock()).toContain("1:00");
});

it("counts the clock down after Start, and stops it on Pause", () => {
  vi.spyOn(marshal, "createSim").mockReturnValue(marshal.createSim(seeded(5)));
  render(<Practice />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  run(5);
  expect(clock()).toMatch(/0:5[0-5]/);
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  const stopped = clock();
  run(10);
  expect(clock()).toBe(stopped);
});

it("runs faster at 4x", () => {
  vi.spyOn(marshal, "createSim").mockReturnValue(marshal.createSim(seeded(5)));
  render(<Practice />);
  fireEvent.change(screen.getByLabelText(/Speed/), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  run(5);
  expect(clock()).toMatch(/0:(3[5-9]|4[0-1])/);
});

it("checks the cards when the athlete raises the bar, and then calls the next athlete", () => {
  vi.spyOn(marshal, "createSim").mockReturnValue(scripted().sim);
  render(<Practice />);
  expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  expect(screen.getByText("Accepted")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  run(45);
  expect(screen.getByText(/raises the bar with/)).toBeTruthy();
  expect(screen.getByText(/Accepted, which is right/)).toBeTruthy();
  expect(screen.getByText("Correct: 1 of 1")).toBeTruthy();
  expect(screen.getByText("Right.")).toBeTruthy();
  // The clock is held while the report is open.
  run(20);
  fireEvent.click(screen.getByRole("button", { name: "Next athlete" }));
  expect(screen.queryByText(/raises the bar with/)).toBeNull();
  expect(screen.getByText("On the clock")).toBeTruthy();
});

it("marks a card that was left unanswered as missed", () => {
  vi.spyOn(marshal, "createSim").mockReturnValue(scripted().sim);
  render(<Practice />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  run(45);
  expect(screen.getByText("Missed.")).toBeTruthy();
  expect(screen.getByText("Correct: 0 of 1")).toBeTruthy();
});

it("expands the group to three or four lifters, side by side, and back to two", () => {
  const spy = vi.spyOn(marshal, "createSim").mockImplementation((_rng, _gender, size) => realCreate(seeded(8), "M", size));
  const { container } = render(<Practice />);
  expect(container.querySelectorAll(".marshal-card")).toHaveLength(2);
  fireEvent.change(screen.getByLabelText(/Lifters/), { target: { value: "4" } });
  expect(spy).toHaveBeenLastCalledWith(expect.anything(), undefined, 4);
  expect(container.querySelectorAll(".marshal-card")).toHaveLength(4);
  expect((container.querySelector(".marshal-cards") as HTMLElement).style.getPropertyValue("--cols")).toBe("4");
  fireEvent.change(screen.getByLabelText(/Lifters/), { target: { value: "3" } });
  expect(container.querySelectorAll(".marshal-card")).toHaveLength(3);
  expect((container.querySelector(".marshal-cards") as HTMLElement).style.getPropertyValue("--cols")).toBe("3");
  fireEvent.change(screen.getByLabelText(/Lifters/), { target: { value: "2" } });
  expect(container.querySelectorAll(".marshal-card")).toHaveLength(2);
});

it("stops the clock when the group size changes", () => {
  vi.spyOn(marshal, "createSim").mockImplementation((_rng, _gender, size) => realCreate(seeded(8), "M", size));
  render(<Practice />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.change(screen.getByLabelText(/Lifters/), { target: { value: "4" } });
  expect(screen.getByRole("button", { name: "Start" })).toBeTruthy();
  expect(clock()).toContain("1:00");
});

it("starts a new group", () => {
  const first = marshal.createSim(seeded(5));
  const second = marshal.createSim(seeded(6));
  vi.spyOn(marshal, "createSim").mockReturnValueOnce(first).mockReturnValueOnce(second);
  const { container } = render(<Practice />);
  const before = container.querySelector(".marshal-card")!.textContent;
  fireEvent.click(screen.getByRole("button", { name: "New group" }));
  expect(container.querySelector(".marshal-card")!.textContent).not.toBe(before);
});
