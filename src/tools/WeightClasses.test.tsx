import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import WeightClasses from "./WeightClasses";

afterEach(cleanup);

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/weight-classes/*" element={<WeightClasses />} />
      </Routes>
    </MemoryRouter>,
  );

it("shows the overview by default", () => {
  at("/weight-classes");
  expect(screen.getByRole("heading", { name: "Men" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Overview" }).className).toContain("active");
});

it("shows the training from the sub menu", () => {
  const { container } = at("/weight-classes/training");
  expect(container.querySelectorAll(".tile")).toHaveLength(100);
  expect(screen.getByRole("link", { name: "Training" }).className).toContain("active");
});
