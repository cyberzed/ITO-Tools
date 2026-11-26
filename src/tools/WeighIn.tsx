import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import { weighInPages } from "./pages";
import Overview from "./weigh-in/Overview";
import Practice from "./weigh-in/Practice";

export default function WeighIn() {
  return (
    <section>
      <h1>Weigh-in</h1>
      <SubNav toolId="weigh-in" title="Weigh-in" pages={weighInPages} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="practice" element={<Practice />} />
      </Routes>
    </section>
  );
}
