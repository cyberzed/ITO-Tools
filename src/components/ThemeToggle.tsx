import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const query = "(prefers-color-scheme: dark)";
const osTheme = (): Theme => (matchMedia(query).matches ? "dark" : "light");

function hasOverride(): boolean {
  try {
    return localStorage.getItem("theme") !== null;
  } catch {
    return false;
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) || "light",
  );

  // With no saved choice, follow the OS setting live.
  useEffect(() => {
    const mq = matchMedia(query);
    const onChange = () => {
      if (hasOverride()) return;
      const t = osTheme();
      document.documentElement.dataset.theme = t;
      setTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      // Choosing the OS theme goes back to following the OS.
      if (next === osTheme()) localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable; the choice lasts for this visit only */
    }
    setTheme(next);
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {theme === "light" ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
