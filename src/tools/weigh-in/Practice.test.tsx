import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { categoriesFor } from "../../lib/categories";
import * as weighIn from "../../lib/weighIn";
import Practice, { rangeText } from "./Practice";

const men = categoriesFor("M");
const i85 = men.findIndex((c) => c.label === "M85");
const caseAt = (scaleG: number): weighIn.WeighInCase => ({
  gender: "M",
  category: men[i85],
  limits: weighIn.limitsOf(men, i85),
  scaleG,
});

beforeEach(() => {
  vi.spyOn(weighIn, "generateCase").mockReturnValueOnce(caseAt(85210)).mockReturnValueOnce(caseAt(75250));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const answer = (kg: string, decision: string) => {
  fireEvent.change(screen.getByLabelText(/Bodyweight after the deduction/), { target: { value: kg } });
  fireEvent.click(screen.getByLabelText(decision));
  fireEvent.click(screen.getByRole("button", { name: "Check" }));
};

it("shows the entered category and the scale reading", () => {
  render(<Practice />);
  expect(screen.getByText("M85")).toBeTruthy();
  expect(screen.getByText("85.21 kg")).toBeTruthy();
});

it("waits for both answers before it can check", () => {
  render(<Practice />);
  const check = screen.getByRole("button", { name: "Check" }) as HTMLButtonElement;
  expect(check.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText(/Bodyweight after the deduction/), { target: { value: "84,96" } });
  expect(check.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText("Makes weight"));
  expect(check.disabled).toBe(false);
});

it("accepts the right answer and explains the costume deduction", () => {
  render(<Practice />);
  answer("84,96", "Makes weight");
  expect(screen.getByRole("status").textContent).toContain("Correct.");
  expect(screen.getByText("85.21 − 0.25 for the costume = 84.96 kg.")).toBeTruthy();
  expect(screen.getByText(/the costume deduction brings the athlete under the limit/)).toBeTruthy();
  expect(screen.getByText("Correct: 1 of 1")).toBeTruthy();
});

it("gives the right answer after a wrong one", () => {
  render(<Practice />);
  answer("85.21", "Too heavy: must lose weight");
  const status = screen.getByRole("status").textContent!;
  expect(status).toContain("The bodyweight is 84.96 kg.");
  expect(status).toContain("The athlete makes weight.");
  expect(screen.getByText("Correct: 0 of 1")).toBeTruthy();
});

it("moves on to the next athlete with a clean form", () => {
  render(<Practice />);
  answer("84.96", "Makes weight");
  fireEvent.click(screen.getByRole("button", { name: "Next athlete" }));
  expect(screen.getByText("75.25 kg")).toBeTruthy();
  expect((screen.getByLabelText(/Bodyweight after the deduction/) as HTMLInputElement).value).toBe("");
  answer("75.00", "Too light: must gain weight");
  expect(screen.getByText(/must gain at least 0.01 kg, to 75.01 kg/)).toBeTruthy();
  expect(screen.getByText("Correct: 2 of 2")).toBeTruthy();
});

it("writes the category ranges like the weight class overview", () => {
  expect(rangeText({ aboveG: 75000, maxG: 85000 })).toBe("75.01–85.00 kg");
  expect(rangeText({ aboveG: null, maxG: 60000 })).toBe("up to 60.00 kg");
  expect(rangeText({ aboveG: 110000, maxG: null })).toBe("over 110.00 kg");
});
