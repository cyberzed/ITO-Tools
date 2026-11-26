import { REPO_URL } from "../repo";

const PROFILE_URL = "https://github.com/cyberzed";

export default function About() {
  return (
    <section className="about">
      <h1>About</h1>

      <h2>What this is</h2>
      <p>
        ITO training tools are small browser tools for training weightlifting technical officials,
        whether you are an NTO (National Technical Official) or an ITO (International Technical
        Official). The goal is to practise the parts of the job that are easier to learn by doing
        than by reading.
      </p>
      <p>
        The tools are meant for training. They are no substitute for the official rulebook and
        they are not a reference for a real competition. Check the current IWF Technical and
        Competition Rules &amp; Regulations when it matters.
      </p>

      <h2>The rules used</h2>
      <p>
        The tools follow the IWF Technical and Competition Rules &amp; Regulations 2026 and cover
        senior athletes only. Where the rulebook does not settle a detail, the tools make a
        simple choice, and the project notes on GitHub say which.
      </p>

      <h2>Not affiliated</h2>
      <p>This is an independent, personal project, made without affiliation to any federation.</p>

      <h2>About me</h2>
      <p>
        I am Stefan Daugaard Poulsen, an IWF Category 2 ITO, and I made this site as a personal
        project. You can find me on <a href={PROFILE_URL}>GitHub</a>.
      </p>

      <h2>Feedback</h2>
      <p>
        Found a mistake, or have an idea? Open an issue on{" "}
        <a href={`${REPO_URL}/issues`}>GitHub</a>. The source code is open for anyone to read.
      </p>

      <h2>Privacy</h2>
      <p>
        The site has no accounts and no tracking, and it sends nothing about you anywhere. Your
        browser stores your light or dark choice, and the random athlete for the current visit.
      </p>
    </section>
  );
}
