import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import { weightClassPages } from "./pages";
import Overview from "./weight-classes/Overview";
import Training from "./weight-classes/Training";

export default function WeightClasses() {
  return (
    <section>
      <h1>Weight classes</h1>
      <SubNav toolId="weight-classes" title="Weight classes" pages={weightClassPages} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="training" element={<Training />} />
      </Routes>
    </section>
  );
}
