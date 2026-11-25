import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import { tools } from "./tools/registry";

export default function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          ITO training tools
        </NavLink>
        <nav aria-label="Tools">
          {tools.map((t) => (
            <NavLink key={t.id} to={`/${t.id}`}>
              {t.title}
            </NavLink>
          ))}
        </nav>
        <ThemeToggle />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {tools.map((t) => (
            <Route key={t.id} path={`/${t.id}/*`} element={<t.component />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  return (
    <section>
      <h1>ITO training tools</h1>
      <p className="muted">Tools for weightlifting ITO training. Pick one to start.</p>
      <div className="cards">
        {tools.map((t) => (
          <NavLink key={t.id} to={`/${t.id}`} className="card">
            <h2>{t.title}</h2>
            <p>{t.description}</p>
          </NavLink>
        ))}
      </div>
    </section>
  );
}
