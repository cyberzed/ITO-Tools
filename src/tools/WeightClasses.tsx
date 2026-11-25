import { NavLink, Route, Routes } from "react-router-dom";
import Overview from "./weight-classes/Overview";
import Training from "./weight-classes/Training";

export default function WeightClasses() {
  return (
    <section>
      <h1>Weight classes</h1>
      <nav className="subnav" aria-label="Weight class pages">
        <NavLink to="/weight-classes" end>
          Overview
        </NavLink>
        <NavLink to="/weight-classes/training">Training</NavLink>
      </nav>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="training" element={<Training />} />
      </Routes>
    </section>
  );
}
