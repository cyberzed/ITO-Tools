import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { releases } from "../version";
import WhatsNew from "./WhatsNew";

afterEach(cleanup);

it("shows every release, newest first, with its date and items", () => {
  render(<WhatsNew />);
  const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(headings.map((h) => h!.match(/Version (\S+)/)![1])).toEqual(releases.map((r) => r.version));
  for (const r of releases) {
    for (const item of r.sections.flatMap((s) => s.items)) expect(screen.getByText(item)).toBeTruthy();
  }
});
