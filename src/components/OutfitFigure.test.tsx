import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { describeScene, faultsOf, type FigureScene, type HandScene } from "../lib/outfit";
import HandFigure from "./HandFigure";
import OutfitFigure from "./OutfitFigure";

afterEach(cleanup);

const figure = (over: Partial<FigureScene> = {}): FigureScene => ({
  kind: "figure",
  footwear: true,
  clothing: "costume",
  colour: "blue",
  costume: { sleeveCm: 0, legCm: 14, collar: false },
  beltCm: 10,
  unitard: null,
  shirtSleeveCm: null,
  shortsCm: null,
  kneeSupport: null,
  trunkBandage: false,
  wraps: [],
  ...over,
});

const hand = (over: Partial<HandScene> = {}): HandScene => ({ kind: "hand", glove: 1, wraps: [], ...over });

const outlines = (container: HTMLElement) => container.querySelectorAll('rect[stroke-dasharray="5 3"]');

it("draws the figure as a picture with a neutral description", () => {
  const scene = figure({ beltCm: 14 });
  render(<OutfitFigure scene={scene} />);
  const svg = screen.getByRole("img");
  expect(svg.tagName.toLowerCase()).toBe("svg");
  expect(svg.getAttribute("aria-label")).toBe(describeScene(scene));
  // The description does not give the 14 cm belt, or the fault, away.
  expect(svg.getAttribute("aria-label")).not.toMatch(/14|wide|fault/);
});

it("draws the hand as a picture with a neutral description", () => {
  const scene = hand();
  render(<HandFigure scene={scene} />);
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe(describeScene(scene));
});

it("shows no outline and no measurement until it is asked to", () => {
  const { container } = render(<OutfitFigure scene={figure()} />);
  expect(outlines(container)).toHaveLength(0);
  expect(container.textContent).not.toContain("cm");
});

it("outlines each fault with a label", () => {
  const scene = figure({ footwear: false, beltCm: 16 });
  const { container } = render(<OutfitFigure scene={scene} highlight={faultsOf(scene)} />);
  expect(outlines(container).length).toBeGreaterThanOrEqual(2);
  expect(container.textContent).toContain("No shoes");
  expect(container.textContent).toContain("Belt too wide");
});

it("outlines both elbows for a costume that covers them, and the knees for one that covers them", () => {
  const elbows = figure({ costume: { sleeveCm: 44, legCm: 14, collar: false } });
  const a = render(<OutfitFigure scene={elbows} highlight={faultsOf(elbows)} />);
  expect(outlines(a.container)).toHaveLength(2);
  cleanup();
  const knees = figure({ costume: { sleeveCm: 0, legCm: 52, collar: false } });
  const b = render(<OutfitFigure scene={knees} highlight={faultsOf(knees)} />);
  expect(outlines(b.container)).toHaveLength(2);
});

it("outlines a wrap near the elbow, and only the wraps that are the fault", () => {
  const scene = figure({
    wraps: [
      { material: "tape", arm: "left", fromCm: 20, toCm: 36 },
      { material: "bandage", arm: "right", fromCm: 36, toCm: 52 },
    ],
  });
  expect(faultsOf(scene)).toEqual(["tapeElbow"]);
  const { container } = render(<OutfitFigure scene={scene} highlight={faultsOf(scene)} />);
  expect(outlines(container)).toHaveLength(1);
  expect(container.textContent).toContain("Tape at elbow");
});

it("draws the measurements when asked: the elbow areas and the belt width", () => {
  const { container } = render(<OutfitFigure scene={figure({ beltCm: 14 })} showMeasurements />);
  expect(container.textContent).toContain("14 cm");
  expect(container.textContent?.match(/10 cm/g)).toHaveLength(2);
});

it("draws no belt width when there is no belt", () => {
  const { container } = render(<OutfitFigure scene={figure({ beltCm: null })} showMeasurements />);
  expect(container.textContent?.match(/cm/g)).toHaveLength(2);
});

it("draws a T-shirt and shorts, a collar, a patterned unitard and a strapped knee support", () => {
  for (const scene of [
    figure({ clothing: "twoPiece" }),
    figure({ costume: { sleeveCm: 0, legCm: 14, collar: true } }),
    figure({ unitard: { sleeveCm: 54, legCm: 0, pattern: true } }),
    figure({ kneeSupport: "strapped", trunkBandage: true }),
    figure({ footwear: false, shirtSleeveCm: 40, shortsCm: 30 }),
  ]) {
    const { container, unmount } = render(<OutfitFigure scene={scene} />);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    unmount();
  }
});

it("outlines the glove, the plaster and the gap on the hand", () => {
  const scene = hand({
    glove: 2,
    wraps: [
      { finger: 0, material: "plaster", protrudes: true, touchesGlove: false },
      { finger: 2, material: "tape", protrudes: false, touchesGlove: true },
    ],
  });
  const ids = faultsOf(scene);
  expect(ids).toEqual(["glovePast", "plasterProtrudes", "noSeparation"]);
  const { container } = render(<HandFigure scene={scene} highlight={ids} />);
  expect(outlines(container)).toHaveLength(3);
  expect(container.textContent).toContain("Glove too far");
  expect(container.textContent).toContain("Plaster past tip");
  expect(container.textContent).toContain("No gap");
});

it("draws the knuckle lines on the hand when asked", () => {
  const { container } = render(<HandFigure scene={hand()} showMeasurements />);
  expect(container.textContent).toContain("1st knuckle");
  expect(container.textContent).toContain("2nd knuckle");
});

it("draws no knuckle lines and no outlines on the hand by default", () => {
  const { container } = render(<HandFigure scene={hand()} />);
  expect(container.textContent).not.toContain("knuckle");
  expect(outlines(container)).toHaveLength(0);
});
