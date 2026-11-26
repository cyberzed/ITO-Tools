import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import AthleteCards from "./AthleteCards";

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/athlete-cards/*" element={<AthleteCards />} />
      </Routes>
    </MemoryRouter>,
  );

it("shows the initial card by default", () => {
  const { container } = at("/athlete-cards");
  expect(container.querySelector(".ac")).not.toBeNull();
  expect(screen.getByRole("link", { name: "Initial card" }).className).toContain("active");
});

it("shows the simulation page from the top menu", () => {
  const { container } = at("/athlete-cards/simulation");
  expect(screen.getByRole("heading", { name: /^Snatch attempt 1:/ })).toBeTruthy();
  // The simulation has its own Restart button, and the Reset button belongs to the initial card.
  expect(screen.getByRole("button", { name: "Restart" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  expect(container.querySelector(".ac")).not.toBeNull();
  expect(screen.getByRole("link", { name: "Simulation" }).className).toContain("active");
});
