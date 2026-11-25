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

it("shows the progression page from the top menu", () => {
  const { container } = at("/athlete-cards/progression");
  expect(screen.getByRole("heading", { name: "Progression", level: 2 })).toBeTruthy();
  expect(container.querySelector(".ac")).toBeNull();
  expect(screen.getByRole("link", { name: "Progression" }).className).toContain("active");
});
