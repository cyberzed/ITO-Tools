import { expect, it } from "vitest";
import text from "../../public/.well-known/security.txt?raw";

/** The fields RFC 9116 asks for, and the address the site publishes. */
const fields = Object.fromEntries(
  text
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1).trim()]),
);

it("gives a contact address", () => {
  expect(fields.Contact).toBe("mailto:cyberzed@sleddog.dk");
});

it("has an expiry date that is a valid time", () => {
  expect(fields.Expires).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  expect(Number.isNaN(Date.parse(fields.Expires))).toBe(false);
});

it("names the address of the file on the site", () => {
  expect(fields.Canonical).toBe("https://itotraining.app/.well-known/security.txt");
});
