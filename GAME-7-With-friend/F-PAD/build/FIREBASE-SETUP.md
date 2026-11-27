# Setting up Firebase for Play with a friend (Phase 1)

Done once, by the owner, in their own Google account. About 20 minutes. Everything stays on the free
**Spark** plan: never upgrade to Blaze, and no card is needed.

The games are served from GitHub Pages at `https://ragchamp.github.io/GAMES/`.

## 1. Create the project
1. Open <https://console.firebase.google.com> signed in with your Google account.
2. **Create a project**, named for example `ragchamp-games`. Turn **Google Analytics off**. Create.

## 2. The database
1. Left menu: **Databases & Storage > Realtime Database > Create Database** (not Firestore).
2. Pick the location closest to you and your friends. Choose **Start in locked mode**.
3. Open the **Rules** tab, replace everything with the contents of `database.rules.json` (next to this file),
   and press **Publish**.

## 3. Google sign-in
1. **Security > Authentication > Get started > Sign-in method > Google**: switch it on, pick your support email,
   set the public-facing name to `RAG Champ Games`, and **Save**. (The Android "SHA-1" note doesn't apply.)
2. **Authentication > Settings > Authorized domains > Add domain**: `ragchamp.github.io`
   (`localhost` is already there, for testing).

## 4. The web app's settings
1. **Settings > General > Your apps**: press the **web** button (`</>`), nickname
   `games`. Don't tick Firebase Hosting. **Register app**.
2. It shows a `firebaseConfig` with `apiKey`, `authDomain`, `databaseURL`, `projectId` and `appId`. Send these
   five values to Claude, or paste them into the `FIREBASE` block at the top of `../../online.js`. They are
   public web settings, safe to have in the GitHub repo. If `databaseURL` is missing, copy it from the top of the
   Realtime Database page (it looks like `https://ragchamp-games-default-rtdb.<region>.firebasedatabase.app`).

## 5. App Check (only pages from GitHub Pages may use the database)
1. Open <https://www.google.com/recaptcha/admin/create>. Label `ragchamp-games`, type **Score based (v3)**,
   domains `ragchamp.github.io` and `localhost`, Google Cloud project **ragchamp-games**. Submit. Of the two keys
   it shows, only the **site key** is needed (it goes in `APP_CHECK_SITE_KEY` in `online.js`).
2. Open <https://console.firebase.google.com/project/ragchamp-games/appcheck/apps> (**Security > App Check > Apps**),
   choose the `games` web app, and register it with **Fraud Defense (formerly reCAPTCHA Enterprise)**, pasting the
   **site key**. Token time to live: 1 hour. Save. (The plain "reCAPTCHA" choice is retired and greyed out; that is
   why `online.js` uses `ReCaptchaEnterpriseProvider`.)
3. **Don't press Enforce yet.** Enforcing comes after the first test on GitHub Pages works, so a mistake can't
   lock everyone out. Then: **App Check > APIs > Realtime Database > Enforce**.
4. Testing on `localhost`: the page prints an **App Check debug token** in the browser console. Add it under
   **App Check > Apps > (the ⋮ menu) > Manage debug tokens**.

Done on 26 Nov 2026 (steps 1 to 5; Enforce still off).

## 6. Check it
Open `https://ragchamp.github.io/GAMES/GAME-7-With-friend/ping-test.html` in two browsers (or one normal window
and one private window), signed in with two Google accounts. Create a room in one, join it with the code in the
other, and send pings both ways.
