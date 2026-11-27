import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import { technicalControllerPages } from "./pages";
import OutfitCheck from "./technical-controller/OutfitCheck";
import Rules from "./technical-controller/Rules";

/** The Technical Controller's work: the duties, and the outfit check. */
export default function TechnicalController() {
  return (
    <section>
      <h1>Technical Controller</h1>
      <SubNav toolId="technical-controller" title="Technical Controller" pages={technicalControllerPages} />
      <Routes>
        <Route index element={<Rules />} />
        <Route path="outfit-check" element={<OutfitCheck />} />
      </Routes>
    </section>
  );
}
