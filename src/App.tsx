import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import ToolMenu from "./components/ToolMenu";
import About from "./pages/About";
import WhatsNew from "./pages/WhatsNew";
import { REPO_URL } from "./repo";
import { pageLink } from "./tools/pages";
import { tools } from "./tools/registry";
import { VERSION, hasUnseenChanges, markChangesSeen } from "./version";

/** Old addresses and where their pages are now. */
const movedPages: [from: string, to: string][] = [
  ["/weight-classes", "/weigh-in/classes"],
  ["/weight-classes/training", "/weigh-in/class-quiz"],
  ["/athlete-cards", "/chief-marshal/initial-card"],
  ["/athlete-cards/simulation", "/chief-marshal/card-simulation"],
  ["/lifting-order", "/chief-marshal/calling-order"],
  ["/lifting-order/practice", "/chief-marshal/calling-order-practice"],
  ["/chief-marshal/practice", "/chief-marshal/marshals-table"],
];

export default function App() {
  const { pathname } = useLocation();
  const [unseen, setUnseen] = useState(hasUnseenChanges);

  // Opening What's new counts as having seen the current version.
  useEffect(() => {
    if (pathname === "/whats-new") {
      markChangesSeen();
      setUnseen(false);
    }
  }, [pathname]);

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          ITO training tools
        </NavLink>
        <nav aria-label="Tools">
          {tools.map((t) => (
            <ToolMenu key={t.id} tool={t} />
          ))}
        </nav>
        <nav aria-label="Site" className="site-nav">
          <NavLink to="/whats-new">
            What's new
            {unseen && <span className="new-badge">New</span>}
          </NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <ThemeToggle />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/whats-new" element={<WhatsNew />} />
          {/* Tools that moved into a bigger tool. Keep the old links working. */}
          {movedPages.map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          {tools.map((t) => (
            <Route key={t.id} path={`/${t.id}/*`} element={<t.component />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <NavLink to="/whats-new" title="What's new in this version">
          v{VERSION}
        </NavLink>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}

function Home() {
  return (
    <section className="home">
      <h1>ITO training tools</h1>
      <p className="lead">
        Small browser tools for training weightlifting technical officials, whether you are an NTO or
        an ITO. Pick a tool to practise the parts of the job that are easier to learn by doing than
        by reading.
      </p>
      <div className="cards">
        {tools.map((t) => (
          <article key={t.id} className="card">
            <h2>
              <NavLink to={`/${t.id}`}>{t.title}</NavLink>
            </h2>
            <p>{t.description}</p>
            <ul>
              {t.pages.map((page) => (
                <li key={page.path}>
                  <NavLink to={pageLink(t.id, page)}>{page.title}</NavLink>
                  <span>{page.description}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="muted home-note">
        Nothing to sign up for: everything runs in your browser. <NavLink to="/about">Read more about the project.</NavLink>
      </p>
    </section>
  );
}
