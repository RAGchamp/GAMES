// Keeps the two "with a friend" pages in step with the original games (plan: ../../../info/PLAY-WITH-A-FRIEND.html).
//
//   node make-friend.js           first run: copies billiards.html and snooker.html into GAME-7-With-friend/;
//                                 later runs: copies the sim and eye3d scripts and the three.js line from the
//                                 originals into the friend pages, and leaves everything else (game-ui, styles,
//                                 menus) as it is in the friend page.
//   node make-friend.js --check   changes nothing; exits with code 1 if a friend page is out of step.
//
// So a physics or rule fix is made once, in the original game, and this script brings it into the friend copy.
// Never edit the sim, eye3d or three-src scripts inside the friend pages: the next run would overwrite them.
const fs = require('fs'), path = require('path');
const GAMES = path.resolve(__dirname, '../../..');
const PAIRS = [
  { src: 'GAME-5-Billiards/billiards.html', out: 'GAME-7-With-friend/billiards-friend.html', name: 'Billiards' },
  { src: 'GAME-6-Snooker/snooker.html', out: 'GAME-7-With-friend/snooker-friend.html', name: 'Snooker' },
];
// The parts copied from the original: from the opening tag up to and including its </script>.
const BLOCKS = [
  { id: 'sim', open: '<script id="sim">' },
  { id: 'eye3d', open: '<script id="eye3d">' },
  { id: 'three-src', open: '<script type="text/plain" id="three-src">' },
];
const check = process.argv.includes('--check');

function find(h, open, file) {
  const i = h.indexOf(open);
  if (i < 0) throw new Error(file + ': ' + open + ' not found');
  if (h.indexOf(open, i + 1) >= 0) throw new Error(file + ': ' + open + ' found twice');
  const j = h.indexOf('</script>', i);
  if (j < 0) throw new Error(file + ': no </script> after ' + open);
  return [i, j + '</script>'.length];
}

// Edits made once, when a friend page is first copied. Each must match exactly once.
function firstCopy(h, p) {
  const once = (oldS, newS) => {
    const i = h.indexOf(oldS);
    if (i < 0 || h.indexOf(oldS, i + 1) >= 0) throw new Error(p.out + ': first-copy edit did not match once: ' + oldS.slice(0, 60));
    h = h.replace(oldS, () => newS);
  };
  once('<title>' + p.name + '</title>', '<title>' + p.name + ' with a Friend</title>\n<!--\n' +
    '  ' + p.name + ' with a friend · RAG Champ AI Games Portal · Game 7\n' +
    '  Plan: ../info/PLAY-WITH-A-FRIEND.html. Two people, each on their own device, play each other through an online\n' +
    '  room (online.js, next to this page) instead of playing Marker.\n\n' +
    '  Started as a copy of ../' + p.src + '. The "sim" and "eye3d" scripts and the three.js line are copied from\n' +
    '  there by F-PAD/build/make-friend.js: make physics and rule fixes in the original game and run that script; do\n' +
    '  not edit those three parts here. The "game-ui" script and the styles belong to this page.\n\n' +
    '  The comment below is the original game\'s own description.\n-->');
  return h;
}

let out = 0;
for (const p of PAIRS) {
  const srcFile = path.join(GAMES, p.src), outFile = path.join(GAMES, p.out);
  const src = fs.readFileSync(srcFile, 'utf8');
  if (!fs.existsSync(outFile)) {
    if (check) { console.log(p.out + ': missing'); out = 1; continue; }
    fs.writeFileSync(outFile, firstCopy(src, p));
    console.log(p.out + ': created from ' + p.src);
    continue;
  }
  let h = fs.readFileSync(outFile, 'utf8');
  const changed = [];
  for (const b of BLOCKS) {
    const [si, sj] = find(src, b.open, p.src), [oi, oj] = find(h, b.open, p.out);
    const want = src.slice(si, sj);
    if (h.slice(oi, oj) !== want) { changed.push(b.id); h = h.slice(0, oi) + want + h.slice(oj); }
  }
  if (!changed.length) { console.log(p.out + ': in step'); continue; }
  if (check) { console.log(p.out + ': out of step (' + changed.join(', ') + ')'); out = 1; continue; }
  fs.writeFileSync(outFile, h);
  console.log(p.out + ': updated ' + changed.join(', '));
}
process.exit(out);
