import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { pageLink } from "../tools/pages";
import type { Tool } from "../tools/registry";

/**
 * A tool in the top bar. The link opens the tool. The arrow, or the mouse resting on the tool,
 * opens a list of its pages, so a page can be reached directly.
 */
export default function ToolMenu({ tool }: { tool: Tool }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const { pathname } = useLocation();

  // Going to a page closes the list.
  useEffect(() => setOpen(false), [pathname]);

  // While the list is open, Escape or a press outside closes it.
  useEffect(() => {
    if (!open) return;
    const onPress = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPress);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPress);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="tool-menu"
      // Only a mouse opens the list by resting on it. A touch tap would open and close it at once.
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <NavLink to={`/${tool.id}`}>{tool.title}</NavLink>
      <button
        type="button"
        className="menu-toggle"
        aria-label={`${tool.title} pages`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul id={listId} className="menu-list">
          {tool.pages.map((page) => (
            <li key={page.path}>
              <NavLink to={pageLink(tool.id, page)} end={page.path === ""}>
                {page.title}
                <span>{page.description}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
