# Phone Simulator (Flask app)

A testing tool for the owner: shows a RAG Champ game at a phone's screen size on the laptop. Not for players and
not linked from the portal. Only one phone (Landscape or Portrait) is loaded at a time, which keeps it fast.

## Run

```
pip install -r requirements.txt
python app.py
```

Then open <http://127.0.0.1:5050>.

## Use

- **Game**: every `GAME*` folder's `.html` page is listed automatically, plus the portal.
- **Display mode**: Landscape or Portrait.
- **Phone**: the screen size (CSS pixels) of a few common phones.
- **Query**: added to the game's address, e.g. `?practice` (Billiards) or `?debug`.
- **Browser bars**: takes off the height a phone browser's bars usually use.
- **Zoom**: "Fit window" makes the phone as big as the window allows; 100% is the fastest.
- **Full screen** (or F): full screen for the simulator itself. The game's own Full screen button fills just the
  phone's screen, as on a real phone.

The app serves the `GAMES` folder under `/games/` with no caching, so after editing a game press **Reload**.
It does not simulate touch, the phone's pixel ratio or its real browser bars.
