import { Route, Routes } from "react-router-dom";
import SubNav from "../components/SubNav";
import CallingOrder from "./chief-marshal/CallingOrder";
import CallingOrderPractice from "./chief-marshal/CallingOrderPractice";
import CardSimulation from "./chief-marshal/CardSimulation";
import InitialCard from "./chief-marshal/InitialCard";
import MarshalsTable from "./chief-marshal/MarshalsTable";
import Rules from "./chief-marshal/Rules";
import { chiefMarshalPages } from "./pages";

/** The Chief Marshal's work: the athlete card, the calling order and the Marshals' table. */
export default function ChiefMarshal() {
  return (
    <section>
      <h1>Chief Marshal</h1>
      <SubNav toolId="chief-marshal" title="Chief Marshal" pages={chiefMarshalPages} />
      <Routes>
        <Route index element={<Rules />} />
        <Route path="initial-card" element={<InitialCard />} />
        <Route path="card-simulation" element={<CardSimulation />} />
        <Route path="calling-order" element={<CallingOrder />} />
        <Route path="calling-order-practice" element={<CallingOrderPractice />} />
        <Route path="marshals-table" element={<MarshalsTable />} />
      </Routes>
    </section>
  );
}
