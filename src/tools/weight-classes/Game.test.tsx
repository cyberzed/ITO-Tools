import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { categoriesFor } from "../../lib/categories";
import { isValidClass } from "../../lib/classGame";
import Game from "./Game";

afterEach(cleanup);

const tiles = (container: HTMLElement) => container.querySelectorAll<HTMLButtonElement>(".tile");

it("shows a 10 by 10 board", () => {
  const { container } = render(<Game />);
  expect(tiles(container)).toHaveLength(100);
});

it("scores a perfect round when every valid class is selected", () => {
  const { container } = render(<Game />);
  for (const c of categoriesFor("M")) fireEvent.click(screen.getByRole("button", { name: c.label }));
  fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
  expect(screen.getByRole("status").textContent).toBe("You found 8 of 8.");
  expect(container.querySelectorAll(".tile.correct")).toHaveLength(8);
  expect(container.querySelectorAll(".tile.wrong, .tile.missed")).toHaveLength(0);
});

it("marks wrong and missed tiles", () => {
  const { container } = render(<Game />);
  const decoy = Array.from(tiles(container)).find((t) => !isValidClass("M", t.textContent!))!;
  fireEvent.click(decoy);
  fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
  expect(container.querySelectorAll(".tile.wrong")).toHaveLength(1);
  expect(container.querySelectorAll(".tile.missed")).toHaveLength(8);
  expect(screen.getByRole("status").textContent).toBe("You found 0 of 8, with 1 wrong, and missed 8.");
});

it("switches to the women's classes and starts over", () => {
  const { container } = render(<Game />);
  fireEvent.click(screen.getByRole("button", { name: "Women" }));
  for (const t of tiles(container)) expect(t.textContent!.startsWith("F")).toBe(true);
  for (const c of categoriesFor("F")) expect(screen.getByRole("button", { name: c.label })).toBeTruthy();
  expect(screen.getByText(/Selected: 0/)).toBeTruthy();
});

it("reveals the correct classes without scoring", () => {
  const { container } = render(<Game />);
  fireEvent.click(screen.getByRole("button", { name: "Reveal answers" }));
  const highlighted = Array.from(container.querySelectorAll(".tile.correct")).map((t) => t.textContent);
  expect(highlighted.sort()).toEqual(categoriesFor("M").map((c) => c.label).sort());
  expect(screen.getByRole("status").textContent).toContain("correct classes are highlighted");
  expect(screen.getByRole("status").textContent).not.toContain("You found");
  expect(screen.getByRole("button", { name: "Check answers" }).hasAttribute("disabled")).toBe(true);
});

it("keeps a wrong pick marked when the answers are revealed", () => {
  const { container } = render(<Game />);
  const decoy = Array.from(tiles(container)).find((t) => !isValidClass("M", t.textContent!))!;
  fireEvent.click(decoy);
  fireEvent.click(screen.getByRole("button", { name: "Reveal answers" }));
  expect(container.querySelectorAll(".tile.wrong")).toHaveLength(1);
  expect(container.querySelectorAll(".tile.correct")).toHaveLength(8);
});

it("starts a clean round after revealing", () => {
  const { container } = render(<Game />);
  fireEvent.click(screen.getByRole("button", { name: "Reveal answers" }));
  fireEvent.click(screen.getByRole("button", { name: "New round" }));
  expect(container.querySelectorAll(".tile.correct")).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Reveal answers" }).hasAttribute("disabled")).toBe(false);
});
