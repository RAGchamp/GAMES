# RAG Champ Games

Games written with Claude Code, linked from the portal page `index.html`. Each game has a build plan and a
"how it works" explainer in `info/`.

| Game | Folder | Info pages |
|---|---|---|
| Game 1: Car Race | `GAME1-CAR-RACE/` | `info/CAR-RACE-PLAN.html`, `info/HOW-CAR-RACE-WORKS.html` |
| Game 2: Chintu | `GAME-2-Chintu/` | `info/CHINTU-GAME-PLAN.html`, `info/HOW-CHINTU-WORKS.html` |
| Game 3: Javelin | `GAME-3-Javelin/` | `info/JAVELIN-GAME-PLAN.html`, `info/HOW-JAVELIN-WORKS.html` |
| Game 4: Golf | `GAME-4-Golf/` | `info/GOLF-PLAN.html`, `info/HOW-GOLF-WORKS.html` |
| Game 5: Billiards | `GAME-5-Billiards/` | `info/BILLIARDS-GAME-PLAN.html`, `info/HOW-BILLIARDS-WORKS.html` |
| Game 6: Snooker | `GAME-6-Snooker/` | `info/SNOOKER-GAME-PLAN.html`, `info/HOW-SNOOKER-WORKS.html` |

Javelin's tower physics is Matter.js 0.19.0 (MIT), pasted as one long line in the last `<script id="matter">` of
`javelin.html`; edit the `sim` and `game-ui` scripts above it, not that line. The `sim` script has no DOM code so
levels can be tested in Node. The demos in `HOW-JAVELIN-WORKS.html` copy the flight constants and formulas from the
`sim` script (release point, speeds, drag, wind, javelin types, material strengths); change them there too if those change.

Golf (`golf.html`) has the same split: a `sim` script (course data, clubs, ball flight, bounce and roll; no DOM, so
holes can be played in Node) and a `game-ui` script (side and top-down views, Willy, sound, menus). It uses no library.
The demos in `HOW-GOLF-WORKS.html` copy constants from its `sim` script (G, DRAG, the CLUBS table, the fairway and
green surfaces, CUP_R and the cup rule); change them there too if those change.

Billiards (`billiards.html`, English billiards with white, yellow and red balls) has the same split: a `sim` script
(table in real sizes but balls at twice real size (`SIZE = 2`) so they show on a phone, pockets at 1.6x (`POCKET`) so potting stays a little hard, pockets with jaws, sliding/rolling ball physics with exact hit times; no DOM) and a `game-ui`
script, plus an `eye3d` script that draws the Eye view in 3D with three.js r160 (MIT). three.js is pasted as one long
line of plain text in the last `<script type="text/plain" id="three-src">` of `billiards.html` and run only when the Eye
view is first opened; edit the scripts above it, not that line. If WebGL is missing the game falls back to the
hand-drawn Eye view in `game-ui`. The Top view uses no library. Build it phase by phase from its plan, whose decisions
(section 11) are agreed: computer opponent only, you play the white, 50 up by default, no pro
rules, Top view plus an Eye view (3D, three.js).

**Billiards players (23 Nov 2026).** The computer opponent (yellow) is now called **Marker** (he was Rusty; the
plan and the explainer's timeline keep the old name as history, and the save keeps `stats.rustyBest`). The first
screen asks you to choose your player from 10 cartoon portraits drawn in code (`AVATARS` in `game-ui`): Archie,
Kumar, Lee, Jordan, Marcos, Linda, Maya, Zen, Rene, Maria (names at most 6 letters). The choice is saved
(`save.avatar`), used as your name everywhere in the game, and can be changed from the title (Change player).

**Billiards Phase 5 dropped (23 Nov 2026).** Phase 5 was built (Archie and Rusty drawn from above at the table,
walking in and cueing, see-through over the cloth; a turning mark on the balls; a slow shot replay with ball paths;
applause for a big break) and then removed before it was committed: the owner tested it and found the players seen
from above confusing, as if they were walking on the table, so it was not practical. Do not add players at the
table again unless the owner asks. The portraits beside the table (Top view, in a game) stay. Phase 6 (the full
portal card and `info/HOW-BILLIARDS-WORKS.html`) is done. The explainer's demos copy constants and the referee from
the `sim` script of `billiards.html` (friction, bounce, cushion grip, VMAX, TIP_MAX, ball size, level wobbles); change
them there too if those change.

**Snooker (`GAME-6-Snooker/snooker.html`, started 24 Nov 2026).** Built phase by phase from its plan, whose
decisions (section 11) are agreed: a full 15-red frame by default (10 and 6 reds in the menu), one frame by default
(best of 3 and 5 in the menu), computer opponent Marker only, the first colour hit counts as the chosen colour, no
"foul and a miss" rule, Top view plus the 3D Eye view. It started as a copy of `billiards.html` and has the same split
(`sim` with no DOM, `eye3d`, `game-ui`, three.js as the last plain-text `three-src` line; edit the scripts above it).
Balls are 1.8x real size (`SIZE`; 2x does not fit the pack between the pink and the black; they were 1.6x until
the first phone test on 25 Nov 2026) and pockets 1.6x (`POCKET`, tuned so careful pots go in about as often as in
Billiards). Text drawn on the canvas has a smallest on-screen size (`TX`, set in `resize`), and on short screens the
drawn wooden frame is narrower (`FRAME`). Reds are `red1`..`red15` in the sim. The
pack is racked with a 0.1 mm gap (`RACK_GAP`) so the break-off is the same every time; `V_SEP` and `MAX_HITS` keep
clusters of touching balls from making thousands of tiny hits. Phases 1 (the Practice table) and 2 (the rules,
frames, foul choice, free ball, respotted black, and a stand-in Marker in `cpuChoose`, which Phase 4 replaces) are
done. Players in a match are `'you'` and `'cpu'`; `m.on` is `'red'`, `'colour'` or a colour's name. Both phases were
made by `GAME-6-Snooker/S-PAD/build/make-snooker.js` (it copies `billiards.html` and swaps in the parts in
`build/parts/`). Phase 3 (Snooker school: `DRILLS`, `drillBalls`, `drillCheck` in the sim, and a timed clearance;
"Numbers on balls") was edited into `snooker.html` directly, and so should everything after it. Node tests are in
`GAME-6-Snooker/S-PAD/tests/` (git-ignored): `node phase1.test.js ../../snooker.html`, and the same for phase2 and
phase3; `school.js` and `match.js` drive the page in headless Chrome (`node cdp.js school.js`). If a drill set-up is
changed, rerun phase3 (it checks every drill can still be made).
Phase 4 (Marker's shot search, `cpuPlanner` / `cpuPlannedShot` in the sim, levels in `LEVELS`) is done; the Phase 2
stand-in `cpuChoose` / `cpuShot` stays as a quick fallback and for the phase2 frame tests. Marker's planning calls
the same `simulate` and `applyShot` as the game, so any physics or rule change changes him too. `advance` reuses its
ball lists and skips still pairs for speed; keep results identical (`S-PAD/tests/same.js` compares against the
Phase 2 sim). `node phase4.test.js ../../snooker.html hard easy 6 6 1` plays level against level.
Phase 5 (sounds, pop-ups, phone layouts) is done. Decided 24 Nov 2026: on a phone held upright the table stays the
same way round, as in Billiards (it does not turn on its side). The portraits beside the table are left out when the
game area is under 600 px wide (`playersShown`), and on short screens (sideways phones) the game area uses nearly the
whole height. Browser checks: `S-PAD/tests/phase5.js` and `phones5.js` (run through `cdp.js` with W, H, DPR, MOBILE).
Tested on a real phone by the owner on 25 Nov 2026: the first try led to 1.8x balls and readable text; the second
was all good.
Phase 6 (the portal card and `info/HOW-SNOOKER-WORKS.html`) is done, so all six phases are built. The explainer's
demos copy numbers and rules from the `sim` script of `snooker.html` (the table and spots, `SIZE`, `R`, `RACK_GAP`,
`E_BALL`, `V_SEP`, `VALUE`, the referee's foul values, the aim wobbles in `LEVELS`); change them there too if those
change, along with its quoted test results.

**Game 7: Play with a friend (`GAME-7-With-friend/`, started 26 Nov 2026).** Online Billiards and Snooker against a
friend, built from the plan `info/PLAY-WITH-A-FRIEND.html`, whose decisions (section 10) are agreed: Firebase
(Realtime Database, Google sign-in, App Check) in the owner's own Google account on the free plan, hosted on GitHub
Pages (`https://ragchamp.github.io/GAMES/`), Billiards first. `billiards-friend.html` and `snooker-friend.html` are
copies of the originals. Their `sim` and `eye3d` scripts and the three.js line are copied in by
`F-PAD/build/make-friend.js`: make physics and rule fixes in the original game, then run `node make-friend.js`
(`--check` reports drift); never edit those three parts in the friend pages. Their `game-ui` belongs to them. All
talk with Firebase goes through `online.js` (shared by both pages; `?fake` swaps in a stand-in that passes moves
between tabs of one browser, `?as=NAME` fixes a tab's player, `?grace=N` shortens the 30 s grace time). The
database rules are in `F-PAD/build/database.rules.json` (paste into the Firebase console after changing them), and
setup steps are in `F-PAD/build/FIREBASE-SETUP.md`. `ping-test.html` is the Phase 1 test page (not linked).
Tests are in `F-PAD/tests/` (git-ignored): `node phase1.js` (headless Chrome, several tabs, `?fake`).
Phase 2 (Billiards with a friend) is done in `billiards-friend.html`'s `game-ui`. A game is a list of moves in the room,
applied in order by both pages (`netApply`): `toss` (creator: match number, who breaks, target), `shot` (striker:
white's place, aim, power, spin), `result` (striker: the whole match after `applyShot`; the striker's page has the
final say and the friend's page slides its balls to it), `concede`, `rematch` (both ask, the creator tosses again and
the other player breaks). A page skips the echo of its own shot and result (by id); after a reload the moves rebuild the
game without animations. The creator is `'white'`, the friend `'yellow'` (`NET.me`), so the sim is unchanged. Saves
go under `friend.save.v1` (shared with Snooker; `store()` keeps only its own fields). `node phase2.js` plays two pages
against each other (200 shots, a reload, give up, rematch, a full 50-up game; `SHOTS=20` for a short run).

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
