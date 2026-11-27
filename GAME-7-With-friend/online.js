/* online.js · RAG Champ AI Games Portal · Game 7: Play with a friend
   The room code shared by billiards-friend.html and snooker-friend.html (plan: ../info/PLAY-WITH-A-FRIEND.html).
   All talk with the online service goes through this file, so the service could be swapped by changing only this file.

   Two back ends with the same functions:
   - Firebase (Realtime Database, Google sign-in, App Check), used when the page is opened from its web address.
   - A stand-in, used when the page address has ?fake: it passes moves between tabs of the same browser through
     localStorage (no internet, no sign-in), so most of the game can be tested without Firebase. Each tab is its own
     player; ?as=NAME gives a tab a fixed player ID (as if signed in to the same Google account again).

   Use (every function returns a Promise unless noted):
     Online.start()                   loads the back end; resolves with the signed-in user ({uid}) or null
     Online.signIn()                  Google sign-in (a pop-up); resolves with the user
     Online.signOut()
     Online.user                      the signed-in user or null (not a Promise)
     Online.peekRoom(code)            the room's game, settings, creator's portrait, and whether it is full or old
     Online.createRoom(game, settings, portrait)       resolves with {code, seat: 'a'}
     Online.joinRoom(code, game, portrait)             resolves with {code, seat, room}; seat 'a' or 'b'
                                      (signing in again with the same account gets the same seat back)
     Online.sendMove(kind, data)      adds a numbered move to the room; resolves with its number
     Online.onMove(fn)                fn(move) for every move in order, starting with move 1, including the moves
                                      made before this page joined (so a page that reloads catches up).
                                      move = {n, seat, k (kind), d (data), t (server time)}
     Online.sendLive(data)            the striker's aim and white (overwritten, at most 10 a second; not a Promise)
     Online.onLive(fn)                fn(data) when the friend's live data changes
     Online.onFriend(fn)              fn(status, portrait): 'none' (nobody has joined yet), 'here', 'slow' (away for
                                      less than GRACE seconds), 'left'
     Online.onSelf(fn)                fn(connected): this page's own connection to the service
     Online.leave()                   stops listening and marks this player as gone
     Online.link(code)                the address to send to a friend (not a Promise)
     Online.GRACE                     seconds away before a friend counts as 'left' (30; ?grace=N for tests)
   Errors are thrown as Error objects whose .code is one of: 'not-set-up', 'signed-out', 'no-room', 'old', 'full',
   'wrong-game', 'not-in-room', 'too-big'.
*/
(function () {
  'use strict';

  /* ---- Firebase settings. These are the project's public web settings, meant to be visible in a web page; the
     safety comes from the database rules (F-PAD/build/database.rules.json) and App Check. Filled in during Phase 1
     from the Firebase console (Project settings > Your apps > Web app). ---- */
  const FIREBASE = {
    apiKey: 'AIzaSyDCsXdBiu40nxDoGZj5zsjQGzeUaJkCRds',
    authDomain: 'ragchamp-games.firebaseapp.com',
    databaseURL: 'https://ragchamp-games-default-rtdb.firebaseio.com',
    projectId: 'ragchamp-games',
    appId: '1:267588089255:web:c657dd259f98656cf6f282',
  };
  const APP_CHECK_SITE_KEY = '6LdYrDQuAAAAACNkxNVQ5v-XjY-XqNS3phNg_BfS';   // reCAPTCHA (Fraud Defense / Enterprise) site key registered in Firebase App Check
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

  const q = new URLSearchParams(location.search);
  const FAKE = q.has('fake');
  const GRACE = q.has('grace') ? Math.max(0, +q.get('grace')) : 30;
  const DAY = 24 * 3600 * 1000;
  const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O or 1/I, so a code read out loud can't be mistaken
  const MAX_DATA = 12000, MAX_LIVE = 600;

  const err = (code, msg) => { const e = new Error(msg || code); e.code = code; return e; };
  const newCode = () => { let s = ''; const r = crypto.getRandomValues(new Uint32Array(6)); for (const v of r) s += CODE_ABC[v % CODE_ABC.length]; return s; };
  const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  /* ---- what both back ends share: the room we are in, ordered move delivery, the friend's status ---- */
  const st = {
    code: null, seat: null, room: null,
    moveFns: [], liveFns: [], friendFns: [], selfFns: [],
    nextN: 1, pending: new Map(), delivered: [],   // moves arrive in any order; handed on strictly 1, 2, 3, ...
    friend: 'none', friendPortrait: null, graceTimer: null,
    liveLast: 0, liveQueued: null, liveTimer: null,
  };
  const other = () => (st.seat === 'a' ? 'b' : 'a');

  function arrive(m) {   // one move from the back end; checked, then handed on in order
    if (!m || typeof m.n !== 'number' || m.n < st.nextN || st.pending.has(m.n)) return;
    if (m.seat !== 'a' && m.seat !== 'b') return;
    if (!st.room || !st.room.players || !st.room.players[m.seat]) return;
    st.pending.set(m.n, m);
    while (st.pending.has(st.nextN)) {
      const mv = st.pending.get(st.nextN); st.pending.delete(st.nextN); st.nextN++;
      let d = null; try { d = JSON.parse(mv.d); } catch (e) { continue; }
      const out = { n: mv.n, seat: mv.seat, k: mv.k, d, t: mv.t };
      st.delivered.push(out);
      for (const fn of st.moveFns) try { fn(out); } catch (e) { console.error(e); }
    }
  }
  function friendSeen(present, portrait) {   // the friend's raw presence; turned into here / slow / left
    if (portrait) st.friendPortrait = portrait;
    if (present === null) return setFriend('none');
    if (present) { clearTimeout(st.graceTimer); st.graceTimer = null; return setFriend('here'); }
    if (st.friend === 'none') return setFriend('left');   // joined earlier but isn't here now
    if (st.friend !== 'here') return;                      // already 'slow' (timer running) or 'left'
    setFriend('slow');
    st.graceTimer = setTimeout(() => { st.graceTimer = null; setFriend('left'); }, GRACE * 1000);
  }
  function setFriend(s) {
    if (s === st.friend) return;
    st.friend = s;
    for (const fn of st.friendFns) try { fn(s, st.friendPortrait); } catch (e) { console.error(e); }
  }
  function setSelf(c) { for (const fn of st.selfFns) try { fn(c); } catch (e) { console.error(e); } }
  function resetRoom() {
    clearTimeout(st.graceTimer); clearTimeout(st.liveTimer);
    Object.assign(st, { code: null, seat: null, room: null, nextN: 1, pending: new Map(), delivered: [], friend: 'none',
      friendPortrait: null, graceTimer: null, liveQueued: null, liveTimer: null });
  }
  function checkData(data, max) {
    const s = JSON.stringify(data === undefined ? null : data);
    if (s.length > max) throw err('too-big', 'move data is ' + s.length + ' characters (most is ' + max + ')');
    return s;
  }

  /* =====================================================================================================
     Back end 1: the stand-in for tests (?fake). The room lives in localStorage, which all tabs of the browser
     share; each tab polls it 20 times a second. Presence is a time stamp each tab renews every half second.
     ===================================================================================================== */
  function fakeBackEnd() {
    const K = 'friendfake.';
    const get = k => { try { return JSON.parse(localStorage.getItem(K + k)); } catch (e) { return null; } };
    const put = (k, v) => localStorage.setItem(K + k, JSON.stringify(v));
    let uid = q.get('as') || sessionStorage.getItem(K + 'uid');
    if (!uid) { uid = 'tab-' + Math.random().toString(36).slice(2, 8); }
    sessionStorage.setItem(K + 'uid', uid);
    let poll = null, beat = null, seenN = 0, liveT = 0;
    const AWAY = 2000;   // a tab whose time stamp is older than this has gone
    const SETTLE = 80;   // ms before a move written by a tab counts as final

    function listen() {
      stop();
      beat = setInterval(() => put('seen.' + st.code + '.' + st.seat, Date.now()), 500);
      put('seen.' + st.code + '.' + st.seat, Date.now());
      poll = setInterval(tick, 50); tick();
    }
    function tick() {
      if (!st.code) return;
      const room = get('room.' + st.code); if (!room) return;
      st.room = room;
      for (;;) {   // a move is read only once it has settled (see writeMove)
        const m = get('move.' + st.code + '.' + (seenN + 1));
        if (!m || Date.now() - m.t < SETTLE) break;
        seenN++; arrive(m);
      }
      const lv = get('live.' + st.code);
      if (lv && lv.seat !== st.seat && lv.t > liveT) { liveT = lv.t; let d = null; try { d = JSON.parse(lv.d); } catch (e) {}
        for (const fn of st.liveFns) try { fn(d); } catch (e) { console.error(e); } }
      const fp = room.players[other()];
      if (!fp) friendSeen(null);
      else friendSeen(Date.now() - (get('seen.' + st.code + '.' + other()) || 0) < AWAY, fp.portrait);
    }
    function stop() { clearInterval(poll); clearInterval(beat); poll = beat = null; seenN = 0; liveT = 0; }
    addEventListener('pagehide', () => { if (st.code) put('seen.' + st.code + '.' + st.seat, 0); });

    return {
      async start() { setTimeout(() => setSelf(true)); return { uid }; },
      async signIn() { return { uid }; },
      async signOut() {},
      user: () => ({ uid }),
      async peek(code) { return get('room.' + code); },
      async create(code, room) {
        for (const k of Object.keys(localStorage)) {   // the same clean-up as Firebase: rooms over a day old go
          const m = k.match(/^friendfake\.room\.(.+)$/); if (!m) continue;
          const r = get('room.' + m[1]);
          if (r && r.created < Date.now() - DAY) for (const k2 of Object.keys(localStorage)) if (k2.startsWith(K) && k2.includes('.' + m[1])) localStorage.removeItem(k2);
        }
        if (get('room.' + code)) return false;
        room.created = Date.now(); room.players.a.uid = uid;
        put('room.' + code, room); return true;
      },
      async claimB(code, player) {
        const room = get('room.' + code);
        if (!room || room.players.b) return false;
        room.players.b = Object.assign({ uid }, player); put('room.' + code, room); return true;
      },
      async setPortrait(seat, portrait) { const room = get('room.' + st.code); room.players[seat].portrait = portrait; put('room.' + st.code, room); },
      async writeMove(n, m) {   // localStorage has no "write only if empty" across tabs, so write, wait, and check it stuck
        const k = 'move.' + st.code + '.' + n;
        if (get(k)) return false;
        const tok = Math.random().toString(36).slice(2);
        put(k, Object.assign({ t: Date.now(), tok }, m));
        await new Promise(r => setTimeout(r, SETTLE / 2));
        const now = get(k); return !!now && now.tok === tok;
      },
      writeLive(d) { put('live.' + st.code, { seat: st.seat, d, t: Date.now() + Math.random() }); },
      listen, stop,
      serverNow: () => Date.now(),
      lastN: () => seenN,
    };
  }

  /* =====================================================================================================
     Back end 2: Firebase. Loaded from Google's servers only when the page is not in ?fake mode.
     Room layout (see the plan, section 5):
       roomIndex/CODE = created time      (lets old rooms be found and deleted)
       rooms/CODE = { game, settings (JSON text), created, players: { a: {uid, portrait, here}, b: {...} },
                      live: {seat, d, t}, moves: { 1: {n, seat, k, d (JSON text), t}, 2: ... } }
     ===================================================================================================== */
  function firebaseBackEnd() {
    let fb, db, auth, offset = 0, refs = [];
    const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = SDK + src; s.onload = res; s.onerror = () => rej(new Error('could not load ' + src)); document.head.appendChild(s); });
    const TS = () => fb.database.ServerValue.TIMESTAMP;
    const R = p => db.ref(p);

    async function start() {
      if (!FIREBASE.apiKey) throw err('not-set-up', 'Firebase settings are not filled in yet (top of online.js)');
      for (const f of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-database-compat.js', 'firebase-app-check-compat.js']) await load(f);
      fb = window.firebase;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;   // prints a debug token in the console, to register in App Check
      fb.initializeApp(FIREBASE);
      if (APP_CHECK_SITE_KEY) fb.appCheck().activate(new fb.appCheck.ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY), true);
      auth = fb.auth(); db = fb.database();
      R('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
      R('.info/connected').on('value', s => setSelf(!!s.val()));
      return new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u ? { uid: u.uid } : null); }); });
    }
    async function signIn() {
      const p = new fb.auth.GoogleAuthProvider();
      try { const r = await auth.signInWithPopup(p); return { uid: r.user.uid }; }
      catch (e) {
        if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') { await auth.signInWithRedirect(p); return null; }
        throw e;
      }
    }
    const user = () => (auth && auth.currentUser ? { uid: auth.currentUser.uid } : null);
    async function peek(code) { const s = await R('rooms/' + code).get(); return s.val(); }
    async function cleanUp() {   // delete rooms over a day old; the rules allow only this kind of delete
      try {
        const s = await R('roomIndex').orderByValue().endAt(Date.now() + offset - DAY - 60000).limitToFirst(10).get();
        const up = {}; s.forEach(c => { up['rooms/' + c.key] = null; up['roomIndex/' + c.key] = null; });
        if (Object.keys(up).length) await R('/').update(up);
      } catch (e) { console.warn('old rooms not cleaned up:', e.message); }
    }
    async function create(code, room) {
      await cleanUp();
      room.created = TS(); room.players.a.uid = user().uid;
      try { await R('/').update({ ['rooms/' + code]: room, ['roomIndex/' + code]: TS() }); return true; }
      catch (e) { if (/permission/i.test(e.message)) return false; throw e; }   // the code is taken
    }
    async function claimB(code, player) {
      try { await R('rooms/' + code + '/players/b').set(Object.assign({ uid: user().uid }, player)); return true; }
      catch (e) { if (/permission/i.test(e.message)) return false; throw e; }
    }
    async function setPortrait(seat, portrait) { await R('rooms/' + st.code + '/players/' + seat + '/portrait').set(portrait); }
    // Firebase shows our own write to us at once, before the server has accepted it. A move whose number the friend
    // took first is then taken back, so our own moves are handed on only once the server has accepted them.
    const inflight = new Set();
    async function writeMove(n, m) {
      inflight.add(n);
      try { await R('rooms/' + st.code + '/moves/' + n).set(Object.assign({ t: TS() }, m)); lastN = Math.max(lastN, n); arrive(Object.assign({ t: Date.now() }, m)); return true; }
      catch (e) { if (/permission/i.test(e.message)) return false; throw e; }   // number taken by the friend's move
      finally { inflight.delete(n); }
    }
    function writeLive(d) { R('rooms/' + st.code + '/live').set({ seat: st.seat, d, t: TS() }).catch(() => {}); }
    let lastN = 0;
    function listen() {
      stop();
      const base = 'rooms/' + st.code;
      const here = R(base + '/players/' + st.seat + '/here');
      const con = R('.info/connected');
      const onCon = s => { if (s.val()) { here.onDisconnect().set(false); here.set(true); } };
      con.on('value', onCon); refs.push([con, 'value', onCon]);
      const pl = R(base + '/players');
      const onPl = s => { const p = s.val() || {}; st.room = Object.assign({}, st.room, { players: p });
        const fp = p[other()];
        friendSeen(fp ? !!fp.here : null, fp && fp.portrait); };
      pl.on('value', onPl); refs.push([pl, 'value', onPl]);
      const mv = R(base + '/moves').orderByKey();
      const onMv = s => { const m = s.val(); if (!m || (m.seat === st.seat && inflight.has(m.n))) return; lastN = Math.max(lastN, m.n); arrive(m); };
      mv.on('child_added', onMv); refs.push([mv, 'child_added', onMv]);
      const lv = R(base + '/live');
      const onLv = s => { const v = s.val(); if (v && v.seat !== st.seat) { let d = null; try { d = JSON.parse(v.d); } catch (e) {}
        for (const fn of st.liveFns) try { fn(d); } catch (e) { console.error(e); } } };
      lv.on('value', onLv); refs.push([lv, 'value', onLv]);
    }
    function stop() {
      for (const [r, ev, fn] of refs) r.off(ev, fn);
      refs = []; lastN = 0;
      if (st.code && st.seat && db) { const here = R('rooms/' + st.code + '/players/' + st.seat + '/here'); here.onDisconnect().cancel(); here.set(false).catch(() => {}); }
    }
    return { start, signIn, signOut: () => auth.signOut(), user, peek, create, claimB, setPortrait, writeMove, writeLive, listen, stop,
      serverNow: () => Date.now() + offset, lastN: () => lastN };
  }

  /* =====================================================================================================
     The functions the game pages call. They are the same whichever back end is in use.
     ===================================================================================================== */
  const be = FAKE ? fakeBackEnd() : firebaseBackEnd();
  let started = null;
  const needUser = () => { if (!be.user()) throw err('signed-out', 'not signed in'); };

  const Online = {
    FAKE, GRACE,
    get user() { return started ? be.user() : null; },
    get code() { return st.code; },
    get seat() { return st.seat; },
    get room() { return st.room; },
    get friend() { return st.friend; },
    get moves() { return st.delivered.slice(); },
    start() { return started || (started = be.start()); },
    async signIn() { await Online.start(); return be.signIn(); },
    async signOut() { await Online.start(); Online.leave(); return be.signOut(); },

    async peekRoom(code) {
      await Online.start(); needUser();
      code = cleanCode(code);
      const r = await be.peek(code);
      if (!r) throw err('no-room', 'There is no game with the code ' + code + '.');
      const uid = be.user().uid, mine = (r.players.a && r.players.a.uid === uid) ? 'a' : (r.players.b && r.players.b.uid === uid) ? 'b' : null;
      let settings = null; try { settings = JSON.parse(r.settings); } catch (e) {}
      return { code, game: r.game, settings, creator: r.players.a && r.players.a.portrait,
        full: !!r.players.b && !mine, mine, old: be.serverNow() - r.created > DAY };
    },

    async createRoom(game, settings, portrait) {
      await Online.start(); needUser(); Online.leave();
      const room = { game: String(game), settings: checkData(settings, 400), players: { a: { portrait: String(portrait || ''), here: true } } };
      for (let tries = 0; tries < 8; tries++) {
        const code = newCode();
        if (await be.create(code, JSON.parse(JSON.stringify(room)))) {
          st.code = code; st.seat = 'a'; st.room = await be.peek(code);
          be.listen(); return { code, seat: 'a' };
        }
      }
      throw new Error('could not find a free room code');
    },

    async joinRoom(code, game, portrait) {
      await Online.start(); needUser(); Online.leave();
      const p = await Online.peekRoom(code);
      if (game && p.game !== game) throw err('wrong-game', 'That code is for a game of ' + p.game + '.');
      if (p.old && !p.mine) throw err('old', 'That game is more than a day old.');
      let seat = p.mine;
      if (!seat) {
        if (p.full || !(await be.claimB(p.code, { portrait: String(portrait || ''), here: true }))) throw err('full', 'Two players are already in that game.');
        seat = 'b';
      }
      st.code = p.code; st.seat = seat; st.room = await be.peek(p.code);
      if (portrait && st.room.players[seat].portrait !== portrait) await be.setPortrait(seat, String(portrait));
      be.listen();
      return { code: p.code, seat, room: st.room };
    },

    async sendMove(kind, data) {
      if (!st.code) throw err('not-in-room');
      const d = checkData(data, MAX_DATA);
      for (let tries = 0; tries < 20; tries++) {
        const n = Math.max(st.nextN + st.pending.size, be.lastN() + 1);
        if (await be.writeMove(n, { n, seat: st.seat, k: String(kind), d })) return n;
        await new Promise(r => setTimeout(r, 60 + Math.random() * 120));   // the friend took that number; wait for their move
      }
      throw new Error('could not send the move');
    },
    onMove(fn) { st.moveFns.push(fn); for (const m of st.delivered) fn(m); },

    sendLive(data) {   // at most 10 a second; the last one always goes
      if (!st.code) return;
      const d = checkData(data, MAX_LIVE);
      const go = () => { st.liveLast = Date.now(); st.liveTimer = null; be.writeLive(st.liveQueued); };
      st.liveQueued = d;
      if (st.liveTimer) return;
      const wait = 100 - (Date.now() - st.liveLast);
      if (wait <= 0) go(); else st.liveTimer = setTimeout(go, wait);
    },
    onLive(fn) { st.liveFns.push(fn); },
    onFriend(fn) { st.friendFns.push(fn); fn(st.friend, st.friendPortrait); },
    onSelf(fn) { st.selfFns.push(fn); },
    leave() { if (st.code) be.stop(); resetRoom(); },
    link(code) {
      const u = new URL(location.href);
      for (const k of [...u.searchParams.keys()]) if (k !== 'fake') u.searchParams.delete(k);
      u.searchParams.set('room', code || st.code); u.hash = '';
      return u.toString();
    },
  };
  window.Online = Online;
})();
