import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import { liftingOrderPages } from "./pages";
import Overview from "./lifting-order/Overview";
import Practice from "./lifting-order/Practice";

export default function LiftingOrder() {
  return (
    <section>
      <h1>Lifting order</h1>
      <SubNav toolId="lifting-order" title="Lifting order" pages={liftingOrderPages} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="practice" element={<Practice />} />
      </Routes>
    </section>
  );
}
