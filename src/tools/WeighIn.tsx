import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import { weighInPages } from "./pages";
import ClassTraining from "./weigh-in/ClassTraining";
import Classes from "./weigh-in/Classes";
import Practice from "./weigh-in/Practice";
import Rules from "./weigh-in/Rules";

export default function WeighIn() {
  return (
    <section>
      <h1>Weigh-in</h1>
      <SubNav toolId="weigh-in" title="Weigh-in" pages={weighInPages} />
      <Routes>
        <Route index element={<Rules />} />
        <Route path="classes" element={<Classes />} />
        <Route path="practice" element={<Practice />} />
        <Route path="class-training" element={<ClassTraining />} />
      </Routes>
    </section>
  );
}
