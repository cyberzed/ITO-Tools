import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import ChiefMarshal from "./ChiefMarshal";

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/chief-marshal/*" element={<ChiefMarshal />} />
      </Routes>
    </MemoryRouter>,
  );

const active = () => screen.getAllByRole("link").filter((a) => a.className.includes("active")).map((a) => a.textContent);

it("has one menu with the athlete cards, the calling order and the Marshals' table", () => {
  at("/chief-marshal");
  const menu = screen.getByRole("navigation", { name: "Chief Marshal pages" });
  expect(Array.from(menu.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
    "Overview",
    "Initial card",
    "Card simulation",
    "Calling order",
    "Calling order practice",
    "Marshals' table",
  ]);
});

it("shows the Chief Marshal's job by default", () => {
  at("/chief-marshal");
  expect(screen.getByRole("heading", { name: "The job" })).toBeTruthy();
  expect(active()).toEqual(["Overview"]);
});

it("shows the initial card from the menu", () => {
  const { container } = at("/chief-marshal/initial-card");
  expect(container.querySelector(".ac")).not.toBeNull();
  expect(active()).toEqual(["Initial card"]);
});

it("shows the card simulation from the menu", () => {
  const { container } = at("/chief-marshal/card-simulation");
  expect(screen.getByRole("heading", { name: /^Snatch attempt 1:/ })).toBeTruthy();
  // The simulation has its own Restart button, and the Reset button belongs to the initial card.
  expect(screen.getByRole("button", { name: "Restart" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  expect(container.querySelector(".ac")).not.toBeNull();
  expect(active()).toEqual(["Card simulation"]);
});

it("shows the four factors and the rulebook's example on the calling order page", () => {
  at("/chief-marshal/calling-order");
  expect(screen.getByRole("heading", { name: "The four factors" })).toBeTruthy();
  expect(screen.getByText("(17)")).toBeTruthy();
  expect(active()).toEqual(["Calling order"]);
});

it("shows the calling order practice from the menu", () => {
  at("/chief-marshal/calling-order-practice");
  expect(screen.getByRole("table")).toBeTruthy();
  expect(active()).toEqual(["Calling order practice"]);
});

it("shows the Marshals' table from the menu", () => {
  const { container } = at("/chief-marshal/marshals-table");
  expect(container.querySelectorAll(".marshal-card")).toHaveLength(2);
  expect(active()).toEqual(["Marshals' table"]);
});
