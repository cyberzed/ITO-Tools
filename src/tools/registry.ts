import type { ComponentType } from "react";
import AthleteCards from "./AthleteCards";
import AttemptOrder from "./AttemptOrder";

export interface Tool {
  /** URL slug, used as the route: /#/<id> */
  id: string;
  title: string;
  description: string;
  component: ComponentType;
}

/** Add a new tool here and it shows up in the nav and router automatically. */
export const tools: Tool[] = [
  {
    id: "athlete-cards",
    title: "Athlete cards",
    description: "Learn how to fill in and read athlete cards.",
    component: AthleteCards,
  },
  {
    id: "attempt-order",
    title: "Attempt order",
    description: "Practice putting attempts in the correct lifting order.",
    component: AttemptOrder,
  },
];
