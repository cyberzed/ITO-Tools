import { NavLink, Route, Routes } from "react-router-dom";
import InitialCard from "./athlete-cards/InitialCard";
import Progression from "./athlete-cards/Progression";

/** The athlete card tool: a top menu with one page per step. The first page is the default. */
export default function AthleteCards() {
  return (
    <section>
      <h1>Athlete cards</h1>
      <nav className="subnav" aria-label="Athlete card pages">
        <NavLink to="/athlete-cards" end>
          Initial card
        </NavLink>
        <NavLink to="/athlete-cards/progression">Progression</NavLink>
      </nav>
      <Routes>
        <Route index element={<InitialCard />} />
        <Route path="progression" element={<Progression />} />
      </Routes>
    </section>
  );
}
