import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import WeightClasses from "./WeightClasses";

afterEach(cleanup);

const rows = (title: string) => {
  render(<WeightClasses />);
  const heading = screen.getByRole("heading", { name: title });
  const table = heading.parentElement!.querySelector("table")!;
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((r) => Array.from(r.children).map((c) => c.textContent));
};

it("lists the men's classes with the rulebook's ranges", () => {
  expect(rows("Men")).toEqual([
    ["M60", "≤ 60.00 kg"],
    ["M65", "60.01–65.00 kg"],
    ["M70", "65.01–70.00 kg"],
    ["M75", "70.01–75.00 kg"],
    ["M85", "75.01–85.00 kg"],
    ["M95", "85.01–95.00 kg"],
    ["M110", "95.01–110.00 kg"],
    ["M+110", "> 110.00 kg"],
  ]);
});

it("lists the women's classes with the rulebook's ranges", () => {
  expect(rows("Women")).toEqual([
    ["F49", "≤ 49.00 kg"],
    ["F53", "49.01–53.00 kg"],
    ["F57", "53.01–57.00 kg"],
    ["F61", "57.01–61.00 kg"],
    ["F69", "61.01–69.00 kg"],
    ["F77", "69.01–77.00 kg"],
    ["F86", "77.01–86.00 kg"],
    ["F+86", "> 86.00 kg"],
  ]);
});
