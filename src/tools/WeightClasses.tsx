import { NavLink, Route, Routes } from "react-router-dom";
import Game from "./weight-classes/Game";
import Overview from "./weight-classes/Overview";

export default function WeightClasses() {
  return (
    <section>
      <h1>Weight classes</h1>
      <nav className="subnav" aria-label="Weight class pages">
        <NavLink to="/weight-classes" end>
          Overview
        </NavLink>
        <NavLink to="/weight-classes/game">Game</NavLink>
      </nav>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="game" element={<Game />} />
      </Routes>
    </section>
  );
}
