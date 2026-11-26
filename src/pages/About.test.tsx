import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { REPO_URL } from "../repo";
import { tools } from "../tools/registry";
import About from "./About";

afterEach(cleanup);

it("describes the intention of the site", () => {
  render(<About />);
  expect(screen.getByRole("heading", { name: "What this is" })).toBeTruthy();
  expect(screen.getByText(/practise the parts of the job/)).toBeTruthy();
});

it("says plainly that it has no affiliation to any federation", () => {
  render(<About />);
  expect(screen.getByRole("heading", { name: "Not affiliated" })).toBeTruthy();
  expect(screen.getByText(/made without affiliation to any federation/)).toBeTruthy();
});

it("says the tools are for training and not for real competitions", () => {
  render(<About />);
  expect(screen.getByText(/no substitute for the official rulebook/)).toBeTruthy();
});

it("links to the author's GitHub profile and the issue tracker", () => {
  render(<About />);
  const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
  expect(links).toContain("https://github.com/cyberzed");
  expect(links).toContain(`${REPO_URL}/issues`);
});

it("does not list the tools, so it cannot drift as tools are added", () => {
  const { container } = render(<About />);
  const text = container.textContent!.toLowerCase();
  for (const t of tools) expect(text).not.toContain(t.title.toLowerCase());
  expect(container.querySelectorAll("li")).toHaveLength(0);
});
