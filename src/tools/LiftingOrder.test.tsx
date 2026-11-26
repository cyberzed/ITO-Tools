import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import LiftingOrder from "./LiftingOrder";

afterEach(cleanup);

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lifting-order/*" element={<LiftingOrder />} />
      </Routes>
    </MemoryRouter>,
  );

it("shows the four factors and the rulebook's example by default", () => {
  at("/lifting-order");
  expect(screen.getByRole("heading", { name: "The four factors" })).toBeTruthy();
  expect(screen.getAllByRole("listitem").length).toBeGreaterThan(4);
  expect(screen.getByText("(17)")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Overview" }).className).toContain("active");
});

it("shows the practice from the sub menu", () => {
  at("/lifting-order/practice");
  expect(screen.getByRole("table")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Practice" }).className).toContain("active");
});
