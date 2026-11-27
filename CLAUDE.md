# Working on this repo

Read the README first. It describes the layout and how to add a tool.

- Every change a visitor would notice adds a line to `CHANGELOG.md` in the same commit. The
  README's **Versions** section says when to start a new version. Keep `package.json` in step.
- Start a new branch and pull request for each piece of work. Never reuse a merged one.
- Run `npm test` and `npm run build` before committing.
- Use semantic git conventions (Conventional Commits) for commit messages and pull request
  titles: `feat:` for a new tool, page or feature, `fix:` for a fix, and `docs:`, `refactor:`,
  `test:`, `ci:` or `chore:` for the rest. An optional scope is fine, for example
  `feat(chief-marshal): ...`. Write the subject in lower case, in the imperative.
