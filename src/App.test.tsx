import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it } from "vitest";
import App from "./App";
import { REPO_URL } from "./repo";
import { pageLink } from "./tools/pages";
import { tools } from "./tools/registry";
import { VERSION } from "./version";

// jsdom has no matchMedia, which the theme toggle reads.
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

it("links to the source on GitHub from every page", () => {
  for (const path of ["/", "/weigh-in/classes", "/chief-marshal/card-simulation"]) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Source on GitHub" });
    expect(link.getAttribute("href")).toBe(REPO_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    cleanup();
  }
});

it("points at the repository", () => {
  expect(REPO_URL).toBe("https://github.com/cyberzed/ITO-Tools");
});

it("has an About link in the top bar that opens the about page", () => {
  render(
    <MemoryRouter initialEntries={["/about"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "About" }).className).toContain("active");
  expect(screen.getByRole("heading", { name: "About", level: 1 })).toBeTruthy();
});

it("lists every page of every tool on the front page, straight from the registry", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
  for (const tool of tools) {
    const card = screen.getByRole("heading", { name: tool.title, level: 2 }).closest("article")!;
    expect(within(card).getByText(tool.description)).toBeTruthy();
    for (const page of tool.pages) {
      const link = within(card).getByRole("link", { name: page.title });
      expect(link.getAttribute("href")).toBe(pageLink(tool.id, page));
      expect(within(card).getByText(page.description)).toBeTruthy();
    }
  }
});

it("gives the front page an intro and a link to the about page", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText(/whether you are an NTO or an ITO/)).toBeTruthy();
  const about = screen.getAllByRole("link", { name: /about/i }).map((a) => a.getAttribute("href"));
  expect(about).toContain("/about");
});

it("has the same pages in a tool's own menu as on the front page", () => {
  for (const tool of tools) {
    render(
      <MemoryRouter initialEntries={[`/${tool.id}`]}>
        <App />
      </MemoryRouter>,
    );
    const menu = screen.getByRole("navigation", { name: `${tool.title} pages` });
    expect(Array.from(menu.querySelectorAll("a")).map((a) => a.textContent)).toEqual(tool.pages.map((p) => p.title));
    cleanup();
  }
});

it("shows the version in the corner, linking to What's new", () => {
  renderAt("/");
  expect(screen.getByRole("link", { name: `v${VERSION}` }).getAttribute("href")).toBe("/whats-new");
});

it("shows no New marker on a first visit", () => {
  renderAt("/");
  expect(screen.queryByText("New")).toBeNull();
  expect(localStorage.getItem("seenVersion")).toBe(VERSION);
});

it("shows a New marker after an update until What's new is opened", () => {
  localStorage.setItem("seenVersion", "0.0.1");
  renderAt("/");
  expect(screen.getByRole("link", { name: /What's new/ }).textContent).toContain("New");
  cleanup();

  renderAt("/whats-new");
  expect(screen.getByRole("heading", { name: "What's new", level: 1 })).toBeTruthy();
  expect(screen.queryByText("New")).toBeNull();
  expect(localStorage.getItem("seenVersion")).toBe(VERSION);
});

it("sends the old weight classes links to the Weigh-in tool", () => {
  const first = renderAt("/weight-classes");
  expect(screen.getByRole("heading", { name: "Men" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Weight classes" }).className).toContain("active");
  first.unmount();
  const second = renderAt("/weight-classes/training");
  expect(second.container.querySelectorAll(".tile")).toHaveLength(49);
  expect(screen.getByRole("link", { name: "Class training" }).className).toContain("active");
});

it("has Weigh-in in the top bar, with the weight classes in its menu instead of a tool of their own", () => {
  renderAt("/");
  const bar = within(screen.getByRole("navigation", { name: "Tools" }));
  expect(bar.getByRole("link", { name: "Weigh-in" })).toBeTruthy();
  expect(bar.queryByRole("link", { name: "Weight classes" })).toBeNull();
});

it("sends every old link to its new page", () => {
  const moved: [string, string][] = [
    ["/athlete-cards", "Initial card"],
    ["/athlete-cards/simulation", "Card simulation"],
    ["/lifting-order", "Calling order"],
    ["/lifting-order/practice", "Calling order practice"],
    ["/chief-marshal/practice", "Marshals' table"],
  ];
  for (const [path, tab] of moved) {
    renderAt(path);
    const menu = screen.getByRole("navigation", { name: "Chief Marshal pages" });
    expect(within(menu).getByRole("link", { name: tab }).className, path).toContain("active");
    cleanup();
  }
});

it("has two tools in the top bar: Weigh-in and Chief Marshal", () => {
  renderAt("/");
  const bar = within(screen.getByRole("navigation", { name: "Tools" }));
  expect(bar.getAllByRole("link").map((a) => a.textContent)).toEqual(["Weigh-in", "Chief Marshal"]);
});
