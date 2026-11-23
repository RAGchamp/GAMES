"""Phone Simulator (Flask): test the RAG Champ games at phone size on the laptop.

Run:  python app.py      then open  http://127.0.0.1:5050

The simulator page and the games come from this one server, so they share an origin. That lets the page
keep a game's own "Full screen" inside the phone frame (a real full screen would cover the whole laptop).
Only one phone (Landscape or Portrait) is loaded at a time, which keeps it fast.

Games are found automatically: every GAME* folder next to this app's folder, and the .html files in it.
This is a testing tool for the owner only; it is not part of the public site.
"""
import re
from pathlib import Path

from flask import Flask, abort, render_template, send_from_directory

APP_DIR = Path(__file__).resolve().parent
GAMES_DIR = APP_DIR.parent          # C:\Daya\RAGchamp\GAMES
PORT = 5050

app = Flask(__name__)


def find_games():
    """[{name, path}] for each game page, in game-number order, then the portal."""
    games = []
    for folder in GAMES_DIR.iterdir():
        m = re.fullmatch(r"GAME-?(\d+)-(.+)", folder.name, re.IGNORECASE)
        if not (folder.is_dir() and m):
            continue
        num, title = int(m.group(1)), m.group(2).replace("-", " ").title()
        pages = sorted(folder.glob("*.html"))
        for page in pages:
            name = f"Game {num}: {title}" + (f" ({page.name})" if len(pages) > 1 else "")
            games.append((num, name, f"{folder.name}/{page.name}"))
    games.sort()
    out = [{"name": n, "path": p} for _, n, p in games]
    if (GAMES_DIR / "index.html").exists():
        out.append({"name": "Portal (index.html)", "path": "index.html"})
    return out


@app.route("/")
def simulator():
    return render_template("simulator.html", games=find_games())


@app.route("/games/<path:path>")
def game_file(path):
    """The GAMES folder's files (pages, sounds, images). Never the archive or the app itself."""
    first = path.split("/", 1)[0]
    if first in ("ABANDONED-IDEAS", APP_DIR.name) or first.startswith("."):
        abort(404)
    # max_age=0: an edited game shows up on the next Reload, with no stale copy from the cache
    return send_from_directory(GAMES_DIR, path, max_age=0)


if __name__ == "__main__":
    print(f"Phone Simulator: http://127.0.0.1:{PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False)
