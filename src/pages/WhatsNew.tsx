import { REPO_URL } from "../repo";
import { releases } from "../version";

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function WhatsNew() {
  return (
    <section className="whats-new">
      <h1>What's new</h1>
      <p className="muted">
        Every version of the site and what it added, newest first. The full history is on{" "}
        <a href={`${REPO_URL}/commits/main`} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
      {releases.map((r) => (
        <article key={r.version} className="release" aria-labelledby={`v${r.version}`}>
          <h2 id={`v${r.version}`}>
            Version {r.version} <time dateTime={r.date}>{formatDate(r.date)}</time>
          </h2>
          {r.sections.map((s) => (
            <div key={s.title}>
              <h3>{s.title}</h3>
              <ul>
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </article>
      ))}
    </section>
  );
}
