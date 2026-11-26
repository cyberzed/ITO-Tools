import type { ComponentType } from "react";
import AthleteCards from "./AthleteCards";
import LiftingOrder from "./LiftingOrder";
import { athleteCardPages, liftingOrderPages, weighInPages, weightClassPages, type ToolPage } from "./pages";
import WeighIn from "./WeighIn";
import WeightClasses from "./WeightClasses";

export interface Tool {
  /** URL slug, used as the route: /#/<id> */
  id: string;
  title: string;
  description: string;
  /** The pages of the tool, in menu order. The first one has an empty path and is the default. */
  pages: ToolPage[];
  component: ComponentType;
}

/** Add a new tool here and it shows up in the menu, the router and the front page automatically. */
export const tools: Tool[] = [
  {
    id: "weight-classes",
    title: "Weight classes",
    description: "The senior men's and women's bodyweight classes.",
    pages: weightClassPages,
    component: WeightClasses,
  },
  {
    id: "weigh-in",
    title: "Weigh-in",
    description: "Check that an athlete makes weight for their category.",
    pages: weighInPages,
    component: WeighIn,
  },
  {
    id: "athlete-cards",
    title: "Athlete cards",
    description: "Learn how to fill in and read athlete cards.",
    pages: athleteCardPages,
    component: AthleteCards,
  },
  {
    id: "lifting-order",
    title: "Lifting order",
    description: "Call the athletes of a group in the right order.",
    pages: liftingOrderPages,
    component: LiftingOrder,
  },
];
