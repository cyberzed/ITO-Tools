import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as order from "../../lib/liftingOrder";
import Practice from "./Practice";

const group = (): order.Lifter[] => [
  { start: 1, lot: 3, name: "Anna", next: 80, attempts: [], changes: 0 },
  { start: 2, lot: 9, name: "Bea", next: 78, attempts: [], changes: 0 },
  { start: 3, lot: 14, name: "Cleo", next: 80, attempts: [], changes: 0 },
];

beforeEach(() => {
  vi.spyOn(order, "generateGroup").mockImplementation(group);
  vi.spyOn(order, "randomResult").mockReturnValue(true);
  vi.spyOn(order, "randomChange").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const callButton = (name: string) => screen.getByRole("button", { name });

it("shows the group with the declared weights", () => {
  render(<Practice />);
  const row = screen.getByRole("rowheader", { name: "Bea" }).closest("tr")!;
  expect(within(row).getByText("78")).toBeTruthy();
  expect(screen.getByText("not loaded yet")).toBeTruthy();
});

it("explains the deciding factor after a wrong call, and does not move on", () => {
  render(<Practice />);
  fireEvent.click(callButton("Anna"));
  expect(screen.getByRole("status").textContent).toContain("Not Anna yet. Bea asks for 78 kg and Anna for 80 kg.");
  expect(screen.getByText("not loaded yet")).toBeTruthy();
});

it("takes the attempt after a right call and logs it", () => {
  render(<Practice />);
  fireEvent.click(callButton("Bea"));
  expect(screen.getByRole("status").textContent).toBe("Correct: Bea.");
  expect(screen.getByText("78 kg")).toBeTruthy();
  expect(screen.getByText("#1 Bea: 78 kg, attempt 1, good lift.")).toBeTruthy();
  expect(screen.getByText("Right first time: 1 of 1")).toBeTruthy();
});

it("uses the start number when weight and attempt are the same", () => {
  render(<Practice />);
  fireEvent.click(callButton("Bea")); // Bea now asks 79
  fireEvent.click(callButton("Anna")); // 79 before 80
  expect(screen.getByRole("status").textContent).toContain("Not Anna yet.");
  fireEvent.click(callButton("Bea"));
  fireEvent.click(callButton("Cleo"));
  expect(screen.getByRole("status").textContent).toContain("start number 1");
  expect(screen.getByText("Right first time: 1 of 2")).toBeTruthy();
});

it("can show who is next, which does not count as right", () => {
  render(<Practice />);
  fireEvent.click(screen.getByRole("button", { name: "Show who is next" }));
  expect(screen.getByRole("status").textContent).toBe("Bea was next.");
  expect(screen.getByText("Right first time: 0 of 1")).toBeTruthy();
});

it("ends the lift when nobody has attempts left", () => {
  render(<Practice />);
  for (let i = 0; i < 9; i++) fireEvent.click(screen.getByRole("button", { name: "Show who is next" }));
  expect(screen.getByText(/The snatch is over/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Show who is next" })).toBeNull();
});
