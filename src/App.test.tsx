import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it } from "vitest";
import App, { REPO_URL } from "./App";

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
