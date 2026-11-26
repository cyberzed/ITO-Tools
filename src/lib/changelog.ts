export const SECTIONS = ["Added", "Changed", "Fixed", "Removed"] as const;
export type Section = (typeof SECTIONS)[number];

export interface Release {
  version: string;
  /** YYYY-MM-DD */
  date: string;
  sections: { title: Section; items: string[] }[];
}

const RELEASE = /^## (\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})\s*$/;
const SECTION = /^### (.+?)\s*$/;
const ITEM = /^- (.+)$/;

/**
 * Reads CHANGELOG.md. Text before the first release is the intro and is skipped.
 * A line indented under an item continues it. Anything else in a release is an error,
 * so a typo breaks the tests instead of silently dropping a line from the site.
 */
export function parseChangelog(text: string): Release[] {
  const releases: Release[] = [];
  let release: Release | undefined;
  let section: Release["sections"][number] | undefined;

  text.split(/\r?\n/).forEach((line, i) => {
    const fail = (why: string) => {
      throw new Error(`CHANGELOG.md line ${i + 1}: ${why}: ${line}`);
    };
    let m: RegExpMatchArray | null;
    if ((m = line.match(RELEASE))) {
      release = { version: m[1], date: m[2], sections: [] };
      section = undefined;
      releases.push(release);
    } else if (line.startsWith("## ")) {
      fail("a release heading must look like ## 1.2.3 - 2026-01-31");
    } else if (!release || line.trim() === "") {
      // The intro, or a blank line.
    } else if ((m = line.match(SECTION))) {
      if (!SECTIONS.includes(m[1] as Section)) fail(`the section must be one of ${SECTIONS.join(", ")}`);
      section = { title: m[1] as Section, items: [] };
      release.sections.push(section);
    } else if ((m = line.match(ITEM))) {
      if (!section) fail("an item needs a section heading above it");
      section!.items.push(m[1].trim());
    } else if (/^\s+\S/.test(line) && section?.items.length) {
      section.items[section.items.length - 1] += ` ${line.trim()}`;
    } else {
      fail("expected a ### section, a - item or a blank line");
    }
  });
  return releases;
}

/** Compares two MAJOR.MINOR.PATCH versions: negative when a is older than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}
