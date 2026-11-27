import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import WeighIn from "./WeighIn";

afterEach(cleanup);

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/weigh-in/*" element={<WeighIn />} />
      </Routes>
    </MemoryRouter>,
  );

it("shows the rules by default, with the 250 g and the time limit", () => {
  at("/weigh-in");
  expect(screen.getByRole("heading", { name: "The 250 g for the costume" })).toBeTruthy();
  expect(screen.getByText(/starts three hours before the group starts and lasts one hour/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Rules" }).className).toContain("active");
});

it("shows the practice from the sub menu", () => {
  at("/weigh-in/practice");
  expect(screen.getByText("The scale shows")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Practice" }).className).toContain("active");
});

it("has the weigh-in pages and the weight classes pages in one menu", () => {
  at("/weigh-in");
  const menu = screen.getByRole("navigation", { name: "Weigh-in pages" });
  expect(Array.from(menu.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
    "Rules",
    "Weight classes",
    "Practice",
    "Class quiz",
  ]);
});

it("shows the weight classes from the sub menu", () => {
  at("/weigh-in/classes");
  expect(screen.getByRole("heading", { name: "Men" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Weight classes" }).className).toContain("active");
  expect(screen.getByRole("link", { name: "Rules" }).className).not.toContain("active");
});

it("shows the class quiz from the sub menu", () => {
  const { container } = at("/weigh-in/class-quiz");
  expect(container.querySelectorAll(".tile")).toHaveLength(49);
  expect(screen.getByRole("link", { name: "Class quiz" }).className).toContain("active");
  expect(screen.getByRole("link", { name: "Weight classes" }).className).not.toContain("active");
});
