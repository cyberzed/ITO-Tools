# ITO training tools

Small browser tools for training weightlifting ITOs (International Technical Officials).
It is a static site with no backend. Everything runs in the browser.

The project covers **senior** athletes only. Rules come from the IWF Technical and
Competition Rules & Regulations 2026 (TCRR). A copy is in
[`reference/IWF-TCRR-2026.pdf`](reference/IWF-TCRR-2026.pdf).

## Tools

- **Weight classes**
  - *Overview*: the senior men's and women's bodyweight classes with their ranges.
  - *Training*: pick the valid classes for a gender from a grid of tiles with decoys.
    The grid is 5 x 5 to 10 x 10 (7 x 7 by default). **Check answers** scores the round and
    **Reveal answers** highlights the correct classes.
- **Athlete cards**
  - *Initial card*: a blank athlete card with a random athlete. The name, gender, birth date,
    lot, bodyweight, category, starting weights, entry total and signature are generated and
    kept for the browser session. **Reset** creates a new athlete.
  - *Simulation*: take the athlete through the snatch and then the clean & jerk, step by step.
    Declare the next weight, make up to two changes, call the attempt and record good lift or
    no lift. The automatic progression is +1 kg after a good lift and the same weight after a no
    lift. Once a weight is loaded and called it can only go up. A good lift circles the final
    weight on the card and a no lift strikes it. *Required C&J* is filled in once the first
    snatch attempt is recorded, and the first clean & jerk attempt cannot be called under it
    (the 20 kg Rule). The *Total* (best snatch plus best clean & jerk) is filled in as soon as both lifts have a good lift. Before a weight is called the athlete
    can **abstain** from the rest of the current lift or **withdraw**, which completes the
    competition for them. Given-up attempts are crossed out on the card with a signed note.

The generated starting weights never break the 20 kg Rule (TCRR 6.6.5).

## Development

Requires Node.js 22 or newer.

```sh
npm install
npm run dev      # start the dev server
npm test         # run the unit tests once
npm run build    # type-check and build to dist/
npm run preview  # serve the built site
```

## Project layout

```
src/
  App.tsx                  App shell: top bar, theme toggle, routes
  tools/registry.ts        List of tools: the menu and routes come from here
  tools/                   One folder or file for each tool
  components/AthleteCard   The athlete card
  lib/categories.ts        Senior bodyweight classes and category lookup
  lib/rules.ts             The 20 kg Rule
  lib/sessionAthlete.ts    Random athlete, kept in session storage
  lib/classTraining.ts     Board generation and scoring for the training
  lib/random.ts            Random helpers using Web Crypto
reference/                 Rulebook PDF
```

### Add a tool

1. Create the component in `src/tools/`.
2. Add one entry to the list in `src/tools/registry.ts`.

The menu entry, the home page card and the route (`/#/<id>`) follow from that entry. A tool
can have its own sub pages by using nested routes, as *Weight classes* does.

## Notes

- The site uses hash routes such as `/#/weight-classes/training`, so any static host works
  without rewrite rules.
- The theme follows the operating system by default. The toggle in the top bar saves a
  different choice in the browser.
- Random values use `crypto.getRandomValues`, not `Math.random()`, because CodeQL flags it.

## Deployment

Every push to `main` builds the site and publishes `dist/` to GitHub Pages through
`.github/workflows/deploy.yml`. Pull requests run the tests and a build
(`.github/workflows/ci.yml`). CodeQL scans the code (`.github/workflows/codeql.yml`) and
Dependabot keeps the dependencies up to date.

## Licence

See [LICENSE](LICENSE).
