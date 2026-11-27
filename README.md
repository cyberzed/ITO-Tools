# ITO training tools

Small browser tools for training weightlifting technical officials, whether national (NTO)
or international (ITO). Live at **https://itotraining.app**.

It is a static site with no backend. Everything runs in the browser. It is an independent,
personal project, made without affiliation to any federation.

The project covers **senior** athletes only. Rules come from the IWF Technical and
Competition Rules & Regulations 2026 (TCRR). A copy is in
[`reference/IWF-TCRR-2026.pdf`](reference/IWF-TCRR-2026.pdf).

## Tools

### Weigh-in

The weight classes and the weigh-in share one tool and one menu, because the weigh-in is where
the classes are used.

- **Rules**: the weigh-in rules in short, with references to the Regulation to TCRR 6.4.
- **Weight classes**: the senior men's and women's bodyweight classes with their ranges.
- **Practice**: an athlete of a random gender and category steps on the scale. Work out the
  bodyweight after the 250 g costume deduction, and decide whether the athlete makes weight,
  is too heavy or is too light. The answer comes with the working.
  - The readings sit within 1.5 kg of a limit. Some are over the limit on the scale but make
    weight after the deduction, and some are exactly on a limit.
  - The score counts rounds with both answers right, for the visit only.
- **Class training**: pick the valid classes for a gender from a grid of tiles with decoys.
  - The grid is 5 x 5 to 10 x 10 (7 x 7 by default).
  - **Check answers** scores the round. **Reveal answers** highlights the correct classes.

The old addresses `/#/weight-classes` and `/#/weight-classes/training` still work. They send the
visitor to the new pages.

### Chief Marshal

The Chief Marshal's work is one tool with one menu: the athlete cards, the calling order and the
Marshals' table. Each page can be used on its own.

- **Overview**: the Chief Marshal's job (TCRR 7.9) and what to check on every card: whole kg, two
  changes for each declaration, no reduction once the clock has started, and an increase before
  the final call at 30 seconds before the end of the time.
- **Marshals' table**: the practice at the Marshals' table for a snatch with two athletes, or three or four if you
  choose **Lifters** (which starts a new group).
  - The athlete cards (the snatch page) sit side by side, wider than the page if needed and with
    a sideways scroll on a narrow screen. The athletes are called in the calling order. A clock runs for the athlete who is called: one minute, or two minutes for
    an athlete who lifts twice in a row. The speed can be 1x, 2x or 4x.
  - Coaches hand in cards at random moments, for the athlete on the clock and for the ones
    waiting: a raise, a reduction or an odd weight. Some athletes have used their changes
    already. Press **Accept** or **Decline** for each card.
  - You get no feedback while the clock runs. When the athlete raises the bar (or the time runs
    out), the clock stops and each card is checked against the rules, with the rule reference.
    A card you accepted rightly is written on the athlete's card, and the attempt gets a result.
    A card you left unanswered counts as missed.
  - The time that counts for a card is the clock reading when it was handed in, shown on the
    card, not the moment you answer.
  - The score counts the cards answered right, for the visit only.

- **Initial card**: the athlete card at weigh-in, for a random athlete.
  - The name, gender, birth date, lot, bodyweight, category, starting weights, entry total
    and signature are generated and kept for the browser session.
  - **Reset** creates a new athlete.
  - The generated starting weights never break the 20 kg Rule (TCRR 6.6.5).
- **Card simulation**: take the athlete through the snatch and then the clean & jerk, step by step.
  For each attempt:
  1. Declare the weight. The first attempt starts at the weight given at weigh-in.
  2. Change it if needed. There are two changes for each attempt.
  3. Call the attempt. Once a weight is loaded and called it can only go up.
  4. Record good lift or no lift. The next attempt gets the automatic progression: +1 kg after
     a good lift, the same weight after a no lift.

  On the card, a good lift circles the final weight and a no lift strikes it. Unused change
  boxes are crossed out.

  - **Required C&J** is filled in once the first snatch attempt is recorded. The first clean &
    jerk attempt cannot be called under it (the 20 kg Rule).
  - **Total** (best snatch plus best clean & jerk) is filled in once the athlete has no more
    clean & jerk attempts, and only if both lifts have a good lift.
  - Before a weight is called, the athlete can **abstain** from the rest of the current lift
    or **withdraw**, which completes the competition for them. Given-up attempts are crossed
    out on the card with a signed note. The clean & jerk starting weight from weigh-in stays
    on the card.

Not modelled in the Card simulation: time limits and the final call, and the break between the
lifts. The Marshals' table runs the clock and the final call for a group.

- **Calling order**: the four factors of the calling order (TCRR 6.6.6) and the rules around it, with
  group B's snatch from the rulebook's example (Regulation to 6.6.6).
- **Calling order practice**: a random group of 6, 8 or 10 men or women, for the snatch or the clean & jerk.
  The board shows each athlete's attempts with their calling order number, and the weight
  they ask for next. Pick the athlete to call:
  - A right call takes the attempt: a good lift about seven times in ten, then the automatic
    progression. Sometimes a coach raises an athlete's next weight, using one of the two
    changes.
  - A wrong call says which of the four factors puts the right athlete first, and waits for
    another pick. **Show who is next** gives the answer.
  - The score counts the calls that were right first time.

  The starting weights cluster so that ties, and so the later factors, come up often.

The old addresses `/#/athlete-cards`, `/#/athlete-cards/simulation`, `/#/lifting-order`,
`/#/lifting-order/practice` and `/#/chief-marshal/practice` still work. They send the visitor to
the new pages.

### Other pages

- **Top bar**: a link for each tool, with an arrow next to it that opens a list of the tool's
  pages (it also opens when a mouse rests on the tool). Escape, a click outside or moving the
  focus away closes it. It is built from the same page list as the tool's own menu (`ToolMenu`
  component). The tool is not marked as selected while you are on one of its pages. The
  current page is marked in the tool's own menu and in the drop down.
- **Front page**: what the site is for and how it works. It does not list the tools or their
  pages, because the top bar and its drop down lists do that.
- **About**: the intention of the site, the rules used, the no affiliation notice, who made it,
  where to give feedback and a privacy note. It does not list the tools, so it cannot drift as
  tools are added. A test checks that.
- **What's new**: every version of the site and what it added, built from
  [`CHANGELOG.md`](CHANGELOG.md). The top bar shows a **New** marker to returning visitors
  until they open it.
- **Source on GitHub**: a small label in the bottom right corner of every page, next to the
  version number.

## Development

CI uses Node.js 22.

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
  App.tsx                      App shell: top bar, front page, routes, source label
  repo.ts                      The repository address
  pages/About.tsx              The About page
  pages/WhatsNew.tsx           The What's new page
  version.ts                   The version and the New marker, from CHANGELOG.md
  lib/changelog.ts             Reads CHANGELOG.md
  tools/registry.ts            List of tools: the menu and the routes come from here
  tools/pages.ts               The pages of each tool: its menu and the top bar drop down use them
  tools/WeighIn.tsx            Weigh-in: sub menu
  tools/weigh-in/              Its pages (Rules, Classes, Practice, ClassTraining)
  tools/ChiefMarshal.tsx       Chief Marshal: sub menu
  tools/chief-marshal/         Its pages (Overview, InitialCard, CardSimulation, CallingOrder,
                               CallingOrderPractice, MarshalsTable) and the card builder
  components/AthleteCard.tsx   The athlete card
  components/SubNav.tsx        The menu under a tool's heading
  components/ToolMenu.tsx      A tool in the top bar, with its drop down list of pages
  components/ThemeToggle.tsx   Light and dark mode button
  lib/categories.ts            Senior bodyweight classes and category lookup
  lib/rules.ts                 The 20 kg Rule
  lib/sessionAthlete.ts        Random athlete, kept in session storage
  lib/classTraining.ts         Board generation and scoring for the class training
  lib/snatchSimulation.ts      Attempt logic for one lift (also used for the clean & jerk)
  lib/weighIn.ts               Category limits, the costume deduction and weigh-in cases
  lib/liftingOrder.ts          Calling order, attempts and random groups
  lib/liftingOrderExample.ts   The rulebook's calling order example, also used as a test
  lib/marshal.ts               The Marshals' table: clock, cards handed in, and the check of the decisions
  lib/random.ts                Random helpers using Web Crypto
reference/                     Rulebook PDF
```

### Add a tool

1. Create the component in `src/tools/`.
2. List its pages in `src/tools/pages.ts` (a title, a short description and a path for each).
3. Add one entry to the list in `src/tools/registry.ts`.

The menu entry, its drop down list and the route (`/#/<id>`) follow from that entry. The tool's own menu comes from the same page list through the `SubNav` component.

## Notes

- The site uses hash routes such as `/#/weigh-in/class-training`, so any static host works
  without rewrite rules.
- The theme follows the operating system by default. The toggle in the top bar saves a
  different choice in the browser.
- `public/.well-known/security.txt` says where to report a security problem (RFC 9116). Its
  `Expires` date is one year ahead at most, so renew it before it passes. Vite copies the file
  to `dist/` as it is.
- Random values use `crypto.getRandomValues`, not `Math.random()`, because CodeQL flags it.
- The rulebook does not say that a declaration or change cannot go under the automatic
  progression. The simulation assumes it. The first attempt of a lift can go down to the
  empty bar (26 kg for men, 21 kg for women, TCRR 6.6.4).
- The calling order practice only ever raises a weight when a coach makes a change, so the
  barbell never has to come down. Lowering a weight before the clock starts (TCRR 6.6.10) is
  rare in practice and is mostly about timing, so it is part of the Marshals' table.
- The Marshals' table uses the order of the paragraphs in TCRR 6.6.10 to 6.6.15 for the
  rule numbers, because the PDF prints those numbers in a block above the text. It never hands in
  a reduction below the automatic progression or the empty bar, because the rulebook does not
  say what happens below it. The clock keeps running while an accepted increase is loaded,
  although the rulebook stops it while a heavier weight is set up (6.6.15).
- The weigh-in practice treats a bodyweight at or below the limit of the category below as too
  light, because a category includes its upper limit. The rulebook's wording for the too light
  case (Regulation to 6.4, point 10) is less clear than for the too heavy case.

## Versions

The site has a version such as `0.2.0`, and [`CHANGELOG.md`](CHANGELOG.md) says what each
version added. Visitors see it on the What's new page.

Every change a visitor would notice gets a line in `CHANGELOG.md`, in the same commit:

- A branch or pull request with visible changes starts one new version, dated the day it is
  made, above the others. Further commits on the same branch add lines to that version.
- Set the same version in `package.json` (`npm version <x.y.z> --no-git-tag-version` updates
  the lock file too).
- Raise the minor number for a new tool, page or feature, and the patch number for fixes and
  wording.
- Never add lines to a version that is already tagged: it is live, and visitors would not see
  the New marker.

Each version gets a git tag such as `v0.2.0`. The deploy workflow adds it to the commit that
first takes that version live, so nobody tags by hand.

Refactors, tests and changes to the build need no line. The tests fail if the newest version
in `CHANGELOG.md` and `package.json` differ, or if the file does not follow the format.

## Deployment

Every push to `main` builds the site and publishes `dist/` to GitHub Pages through
`.github/workflows/deploy.yml`. Pull requests run the tests and a build
(`.github/workflows/ci.yml`). CodeQL scans the code (`.github/workflows/codeql.yml`) and
Dependabot keeps the dependencies up to date.

The site is served on `itotraining.app`. The domain and its DNS are at Cloudflare. The
records for GitHub Pages are set to DNS only, and HTTPS is enforced in the repo's Pages
settings.

### Previews

Cloudflare Pages builds every branch and pull request (`npm run build`, output `dist`,
Node.js 22). Its bot comments on the pull request with a preview link and updates the comment
on each push, so a change can be tried, on a phone too, before it is merged. The live site
stays on GitHub Pages. Previews are public to anyone with the link.

## Licence

See [LICENSE](LICENSE).
