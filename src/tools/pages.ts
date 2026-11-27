/** A page inside a tool. It shows in the tool's own menu and in the drop down in the top bar. */
export interface ToolPage {
  /** Path under the tool, without a leading slash. Empty for the first page, which is the default. */
  path: string;
  title: string;
  description: string;
}

export const weighInPages: ToolPage[] = [
  { path: "", title: "Overview", description: "The weigh-in rules in short, with the 250 g for the costume." },
  {
    path: "practice",
    title: "Practice",
    description: "Read the scale and decide whether the athlete makes weight.",
  },
  { path: "classes", title: "Weight classes", description: "The senior bodyweight classes and their ranges." },
  {
    path: "class-training",
    title: "Class training",
    description: "Pick the valid classes for a gender from a grid of tiles.",
  },
];

export const chiefMarshalPages: ToolPage[] = [
  { path: "", title: "Overview", description: "What the Chief Marshal checks on every card, and the rules behind it." },
  { path: "initial-card", title: "Initial card", description: "The athlete card at weigh-in, for a random athlete." },
  {
    path: "card-simulation",
    title: "Card simulation",
    description: "Take an athlete through the snatch and the clean & jerk, step by step.",
  },
  {
    path: "calling-order",
    title: "Calling order",
    description: "The four factors of the calling order, with the rulebook's example.",
  },
  {
    path: "calling-order-practice",
    title: "Calling order practice",
    description: "Call a group of athletes in the right order, attempt by attempt.",
  },
  {
    path: "marshals-table",
    title: "Marshals' table",
    description: "Run the table for two to four athletes, with a clock and cards handed in.",
  },
];

/** The link to a page of a tool. */
export const pageLink = (toolId: string, page: ToolPage): string => `/${toolId}${page.path ? `/${page.path}` : ""}`;
