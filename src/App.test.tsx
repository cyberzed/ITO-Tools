import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it } from "vitest";
import App from "./App";
import { REPO_URL } from "./repo";
import { pageLink } from "./tools/pages";
import { tools } from "./tools/registry";

// jsdom has no matchMedia, which the theme toggle reads.
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

it("links to the source on GitHub from every page", () => {
  for (const path of ["/", "/weight-classes", "/athlete-cards/simulation"]) {
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
