import { NavLink } from "react-router-dom";
import { pageLink, type ToolPage } from "../tools/pages";

/** The menu under a tool's heading, built from the tool's pages. */
export default function SubNav({ toolId, title, pages }: { toolId: string; title: string; pages: ToolPage[] }) {
  return (
    <nav className="subnav" aria-label={`${title} pages`}>
      {pages.map((page) => (
        <NavLink key={page.path} to={pageLink(toolId, page)} end={page.path === ""}>
          {page.title}
        </NavLink>
      ))}
    </nav>
  );
}
