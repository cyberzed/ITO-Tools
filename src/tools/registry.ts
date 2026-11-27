import type { ComponentType } from "react";
import ChiefMarshal from "./ChiefMarshal";
import { chiefMarshalPages, technicalControllerPages, weighInPages, type ToolPage } from "./pages";
import TechnicalController from "./TechnicalController";
import WeighIn from "./WeighIn";

export interface Tool {
  /** URL slug, used as the route: /#/<id> */
  id: string;
  title: string;
  description: string;
  /** The pages of the tool, in menu order. The first one has an empty path and is the default. */
  pages: ToolPage[];
  component: ComponentType;
}

/** Add a new tool here and it shows up in the menu and the router automatically. */
export const tools: Tool[] = [
  {
    id: "weigh-in",
    title: "Weigh-in",
    description: "The weight classes, and checking that an athlete makes weight for theirs.",
    pages: weighInPages,
    component: WeighIn,
  },
  {
    id: "chief-marshal",
    title: "Chief Marshal",
    description: "The athlete cards, the calling order and the Marshals' table: the Chief Marshal's work.",
    pages: chiefMarshalPages,
    component: ChiefMarshal,
  },
  {
    id: "technical-controller",
    title: "Technical Controller",
    description: "The Technical Controller's duties, and checking an athlete's outfit.",
    pages: technicalControllerPages,
    component: TechnicalController,
  },
];
