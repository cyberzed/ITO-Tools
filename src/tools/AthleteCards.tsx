import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import InitialCard from "./athlete-cards/InitialCard";
import Simulation from "./athlete-cards/Simulation";
import { athleteCardPages } from "./pages";

/** The athlete card tool: a menu with one page per step. The first page is the default. */
export default function AthleteCards() {
  return (
    <section>
      <h1>Athlete cards</h1>
      <SubNav toolId="athlete-cards" title="Athlete cards" pages={athleteCardPages} />
      <Routes>
        <Route index element={<InitialCard />} />
        <Route path="simulation" element={<Simulation />} />
      </Routes>
    </section>
  );
}
