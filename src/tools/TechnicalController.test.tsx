import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import { tools } from "./registry";
import TechnicalController from "./TechnicalController";

afterEach(cleanup);

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/technical-controller/*" element={<TechnicalController />} />
      </Routes>
    </MemoryRouter>,
  );

const active = () => screen.getAllByRole("link").filter((a) => a.className.includes("active")).map((a) => a.textContent);

it("is the third tool, in the registry", () => {
  expect(tools.map((t) => t.id)).toEqual(["weigh-in", "chief-marshal", "technical-controller"]);
});

it("has a menu with the rules and the outfit check", () => {
  at("/technical-controller");
  const menu = screen.getByRole("navigation", { name: "Technical Controller pages" });
  expect(Array.from(menu.querySelectorAll("a")).map((a) => a.textContent)).toEqual(["Rules", "Outfit check"]);
});

it("shows the duties and the outfit rules by default", () => {
  at("/technical-controller");
  expect(screen.getByRole("heading", { name: "The job" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "The outfit (TCRR 4)" })).toBeTruthy();
  expect(screen.getByText(/monitor and enforce the 20 kg Rule/)).toBeTruthy();
  expect(screen.getByText(/at most 12 cm wide/)).toBeTruthy();
  expect(active()).toEqual(["Rules"]);
});

it("shows the outfit check from the menu", () => {
  at("/technical-controller/outfit-check");
  expect(screen.getByRole("img")).toBeTruthy();
  expect(screen.getByRole("radio", { name: "Passes" })).toBeTruthy();
  expect(active()).toEqual(["Outfit check"]);
});
