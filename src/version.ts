import changelogText from "../CHANGELOG.md?raw";
import { parseChangelog } from "./lib/changelog";

/** Every release, newest first, from CHANGELOG.md. */
export const releases = parseChangelog(changelogText);

/** The version of the site, the newest release in CHANGELOG.md. A test checks it matches package.json. */
export const VERSION = releases[0].version;

const SEEN_KEY = "seenVersion";

/**
 * True when the visitor has been here before an earlier version. A first visit counts as
 * having seen everything, so new visitors get no New marker.
 */
export function hasUnseenChanges(): boolean {
  try {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen === null) {
      localStorage.setItem(SEEN_KEY, VERSION);
      return false;
    }
    return seen !== VERSION;
  } catch {
    return false;
  }
}

export function markChangesSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, VERSION);
  } catch {
    /* storage unavailable; the marker goes away for this visit only */
  }
}
