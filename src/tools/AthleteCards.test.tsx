import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import AthleteCards from "./AthleteCards";

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

it("generates a new athlete when Reset is clicked", () => {
  const { container } = render(<AthleteCards />);
  const before = sessionStorage.getItem("athlete");
  expect(before).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /reset/i }));

  const after = sessionStorage.getItem("athlete");
  expect(after).not.toBe(before);
  const name = JSON.parse(after!).name as string;
  expect(container.querySelector(".ac-name")?.textContent).toBe(name);
});
