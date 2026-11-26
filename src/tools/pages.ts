/** A page inside a tool. It shows in the tool's own menu and on the front page. */
export interface ToolPage {
  /** Path under the tool, without a leading slash. Empty for the first page, which is the default. */
  path: string;
  title: string;
  description: string;
}

export const weightClassPages: ToolPage[] = [
  { path: "", title: "Overview", description: "The senior bodyweight classes and their ranges." },
  { path: "training", title: "Training", description: "Pick the valid classes for a gender from a grid of tiles." },
];

export const weighInPages: ToolPage[] = [
  { path: "", title: "Overview", description: "The weigh-in rules in short, with the 250 g for the costume." },
  {
    path: "practice",
    title: "Practice",
    description: "Read the scale and decide whether the athlete makes weight.",
  },
];

export const athleteCardPages: ToolPage[] = [
  { path: "", title: "Initial card", description: "The athlete card at weigh-in, for a random athlete." },
  {
    path: "simulation",
    title: "Simulation",
    description: "Take an athlete through the snatch and the clean & jerk, step by step.",
  },
];

export const liftingOrderPages: ToolPage[] = [
  { path: "", title: "Overview", description: "The four factors of the calling order, with the rulebook's example." },
  { path: "practice", title: "Practice", description: "Call a group of athletes in the right order, attempt by attempt." },
];

/** The link to a page of a tool. */
export const pageLink = (toolId: string, page: ToolPage): string => `/${toolId}${page.path ? `/${page.path}` : ""}`;
