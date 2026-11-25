import type { ComponentType } from "react";
import AthleteCards from "./AthleteCards";
import WeightClasses from "./WeightClasses";

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
    id: "weight-classes",
    title: "Weight classes",
    description: "The senior men's and women's bodyweight classes.",
    component: WeightClasses,
  },
  {
    id: "athlete-cards",
    title: "Athlete cards",
    description: "Learn how to fill in and read athlete cards.",
    component: AthleteCards,
  },
];
