# RAG Champ Games

Games written with Claude Code, linked from the portal page `index.html`. Each game has a build plan and a
"how it works" explainer in `info/`.

| Game | Folder | Info pages |
|---|---|---|
| Game 1: Car Race | `GAME1-CAR-RACE/` | `info/CAR-RACE-PLAN.html`, `info/HOW-CAR-RACE-WORKS.html` |
| Game 2: Chintu | `GAME-2-Chintu/` | `info/CHINTU-GAME-PLAN.html`, `info/HOW-CHINTU-WORKS.html` |
| Game 3: Javelin | `GAME-3-Javelin/` | `info/JAVELIN-GAME-PLAN.html`, `info/HOW-JAVELIN-WORKS.html` |
| Game 4: Golf | `GAME-4-Golf/` | `info/GOLF-PLAN.html` (explainer `HOW-GOLF-WORKS.html` not written yet) |
| Game 5: Billiards | `GAME-5-Billiards/` | `info/BILLIARDS-GAME-PLAN.html` (in progress: Phases 1–3 built; on the portal as a simple card, full description in Phase 6) |

Javelin's tower physics is Matter.js 0.19.0 (MIT), pasted as one long line in the last `<script id="matter">` of
`javelin.html`; edit the `sim` and `game-ui` scripts above it, not that line. The `sim` script has no DOM code so
levels can be tested in Node. The demos in `HOW-JAVELIN-WORKS.html` copy the flight constants and formulas from the
`sim` script (release point, speeds, drag, wind, javelin types, material strengths); change them there too if those change.

Golf (`golf.html`) has the same split: a `sim` script (course data, clubs, ball flight, bounce and roll; no DOM, so
holes can be played in Node) and a `game-ui` script (side and top-down views, Willy, sound, menus). It uses no library.

Billiards (`billiards.html`, English billiards with white, yellow and red balls) has the same split: a `sim` script
(table in real sizes but balls at twice real size (`SIZE = 2`) so they show on a phone, pockets at 1.6x (`POCKET`) so potting stays a little hard, pockets with jaws, sliding/rolling ball physics with exact hit times; no DOM) and a `game-ui`
script, plus an `eye3d` script that draws the Eye view in 3D with three.js r160 (MIT). three.js is pasted as one long
line of plain text in the last `<script type="text/plain" id="three-src">` of `billiards.html` and run only when the Eye
view is first opened; edit the scripts above it, not that line. If WebGL is missing the game falls back to the
hand-drawn Eye view in `game-ui`. The Top view uses no library. Build it phase by phase from its plan, whose decisions
(section 11) are agreed: computer opponent only (Rusty, yellow), you are Archie (white), 50 up by default, no pro
rules, Top view plus an Eye view (3D, three.js).

## Abandoned: Geography game (22 Nov 2026)

A Geography game was started on 22 Nov 2026: a plan and a poster-style world map (`WORLD-MAP.html` with its
data and build tools). The owner decided it was too complicated and **abandoned geography-based games**.
Both were moved out of the live site into `ABANDONED-IDEAS/`, as an archive only:

- `ABANDONED-IDEAS/GEOGRAPHY-MAP-PLAN.html` (was `info/GEOGRAPHY-MAP-PLAN.html`)
- `ABANDONED-IDEAS/GAME-3-Geography.zip` (was the `GAME-3-Geography/` folder)

They were never linked from the portal. The plan's links (to `../index.html`, `../logo.svg` and the map)
no longer work from its new place, which is expected.

- Treat `ABANDONED-IDEAS/` as an archive: do not link it from the portal, unpack it, restore it or build on it.
- Do not recreate or refer to the Geography game.
- Do not suggest geography-based games unless the owner asks for one again.
- The name "Game 3" now belongs to Javelin.
