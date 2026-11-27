import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import Overview from "./chief-marshal/Overview";
import Practice from "./chief-marshal/Practice";
import { chiefMarshalPages } from "./pages";

export default function ChiefMarshal() {
  return (
    <section>
      <h1>Chief Marshal</h1>
      <SubNav toolId="chief-marshal" title="Chief Marshal" pages={chiefMarshalPages} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="practice" element={<Practice />} />
      </Routes>
    </section>
  );
}
