# RAG Champ Games

Games written with Claude Code, linked from the portal page `index.html`. Each game has a build plan and a
"how it works" explainer in `info/`.

| Game | Folder | Info pages |
|---|---|---|
| Game 1: Car Race | `GAME1-CAR-RACE/` | `info/CAR-RACE-PLAN.html`, `info/HOW-CAR-RACE-WORKS.html` |
| Game 2: Chintu | `GAME-2-Chintu/` | `info/CHINTU-GAME-PLAN.html`, `info/HOW-CHINTU-WORKS.html` |
| Game 3: Javelin | `GAME-3-Javelin/` | `info/JAVELIN-GAME-PLAN.html` (explainer `HOW-JAVELIN-WORKS.html` not written yet) |

Javelin's tower physics is Matter.js 0.19.0 (MIT), pasted as one long line in the last `<script id="matter">` of
`javelin.html`; edit the `sim` and `game-ui` scripts above it, not that line. The `sim` script has no DOM code so
levels can be tested in Node.

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
