import { expect, it } from "vitest";
import real from "../../CHANGELOG.md?raw";
import pkgText from "../../package.json?raw";
import { compareVersions, parseChangelog } from "./changelog";

const pkg = JSON.parse(pkgText);

it("parses releases, sections and items, and skips the intro", () => {
  const text = [
    "# Changelog",
    "",
    "Some intro.",
    "",
    "## 1.1.0 - 2026-02-01",
    "",
    "### Added",
    "- One",
    "- Two that goes",
    "  over two lines",
    "",
    "### Fixed",
    "- Three",
    "",
    "## 1.0.0 - 2026-01-01",
    "### Added",
    "- First",
  ].join("\n");
  expect(parseChangelog(text)).toEqual([
    {
      version: "1.1.0",
      date: "2026-02-01",
      sections: [
        { title: "Added", items: ["One", "Two that goes over two lines"] },
        { title: "Fixed", items: ["Three"] },
      ],
    },
    { version: "1.0.0", date: "2026-01-01", sections: [{ title: "Added", items: ["First"] }] },
  ]);
});

it("rejects a malformed release heading, an unknown section and a stray line", () => {
  expect(() => parseChangelog("## 1.0 - 2026-01-01")).toThrow(/line 1/);
  expect(() => parseChangelog("## 1.0.0 - 2026-01-01\n### Improved\n- x")).toThrow(/line 2.*Added/);
  expect(() => parseChangelog("## 1.0.0 - 2026-01-01\n### Added\nloose text")).toThrow(/line 3/);
  expect(() => parseChangelog("## 1.0.0 - 2026-01-01\n- no section")).toThrow(/section heading/);
});

it("compares versions by number, not as text", () => {
  expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
  expect(compareVersions("1.0.0", "1.0.1")).toBeLessThan(0);
  expect(compareVersions("2.3.4", "2.3.4")).toBe(0);
});

it("CHANGELOG.md: the newest release is the version in package.json", () => {
  expect(parseChangelog(real)[0].version).toBe(pkg.version);
});

it("CHANGELOG.md: versions go strictly down and dates never go up", () => {
  const releases = parseChangelog(real);
  for (let i = 1; i < releases.length; i++) {
    expect(compareVersions(releases[i - 1].version, releases[i].version)).toBeGreaterThan(0);
    expect(releases[i - 1].date >= releases[i].date).toBe(true);
  }
});

it("CHANGELOG.md: every release has a real date and at least one item", () => {
  for (const r of parseChangelog(real)) {
    expect(new Date(`${r.date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(r.date);
    expect(r.sections.flatMap((s) => s.items).length).toBeGreaterThan(0);
  }
});
