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

it("orders the sections: what it is, the rules, not affiliated, about me, feedback, privacy", () => {
  render(<About />);
  const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual(["What this is", "The rules used", "Not affiliated", "About me", "Feedback", "Privacy"]);
});

it("says who made the site and that they are an IWF Category 2 ITO", () => {
  render(<About />);
  expect(screen.getByText(/Stefan Daugaard Poulsen, an IWF Category 2 ITO/)).toBeTruthy();
});

it("is for national as well as international technical officials", () => {
  render(<About />);
  expect(screen.getByText(/NTO \(National Technical Official\)/)).toBeTruthy();
  expect(screen.getByText(/ITO \(International Technical\s+Official\)/)).toBeTruthy();
});
