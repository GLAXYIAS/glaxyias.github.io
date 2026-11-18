// Removes duplicate game entries and every GitLab game from JS/main.js.
// Usage: node tools/fix-mainjs.cjs <input.js> <output.js>
const fs = require('fs');

const src = fs.readFileSync(process.argv[2], 'utf8');
let s = src;

// Scan forward from an opening bracket, skipping strings and comments.
function matchBracket(text, openIdx) {
  const pairs = { '[': ']', '{': '}' };
  const stack = [];
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === quote) break;
        i++;
      }
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (ch === '/' && text[i + 1] === '*') { i = text.indexOf('*/', i + 2); if (i < 0) return -1; i++; continue; }
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (ch === ']' || ch === '}') {
      if (stack.pop() !== ch) throw new Error('unbalanced bracket at ' + i);
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

// Drop a whole `(function name() { ... })();` block.
function removeIife(text, name) {
  const marker = '(function ' + name + '()';
  const at = text.indexOf(marker);
  if (at < 0) return text;
  const brace = text.indexOf('{', at);
  const endBrace = matchBracket(text, brace);
  const tail = text.indexOf('})();', endBrace);
  if (endBrace < 0 || tail < 0) throw new Error('could not remove ' + name);
  let end = tail + '})();'.length;
  while (text[end] === '\n') end++;
  return text.slice(0, at) + text.slice(end);
}

s = removeIife(s, 'mergeGitlabGames');
s = removeIife(s, 'addNewJGames');

const arrStart = s.indexOf('let _0xData = [');
if (arrStart < 0) throw new Error('_0xData not found');
const openIdx = s.indexOf('[', arrStart);
const closeIdx = matchBracket(s, openIdx);
const body = s.slice(openIdx + 1, closeIdx);

// Collect top-level object literals.
const entries = [];
let i = 0;
while (i < body.length) {
  if (body[i] === '{') {
    const end = matchBracket(body, i);
    const text = body.slice(i, end + 1);
    const id = (text.match(/\bid\s*:\s*["']([^"']+)["']/) || [])[1] || '';
    const title = (text.match(/\btitle\s*:\s*["']((?:[^"'\\]|\\.)*)["']/) || [])[1] || '';
    const url = (text.match(/\burl\s*:\s*["']([^"']+)["']/) || [])[1] || '';
    entries.push({ id, title, url, text });
    i = end + 1;
  } else i++;
}

const normTitle = (t) => t.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\(gitlab\)\s*/g, '').trim();
const normUrl = (u) => u.trim().replace(/[?#].*$/, '').replace(/^https?:\/\/[^/]+/i, '')
  .replace(/\/index\.html?$/i, '').replace(/\/[A-Za-z0-9_.-]+\.html?$/i, '')
  .replace(/\/+$/, '').toLowerCase();
const isLocal = (e) => e.url.startsWith('../Games/');

const drop = new Map(); // index -> reason

// GitLab games first.
entries.forEach((e, idx) => {
  if (/gitlab/i.test(e.title) || /gitlab/i.test(e.url)) drop.set(idx, 'gitlab');
});

// Exact URL duplicates: keep a local copy when one exists, otherwise the first.
const byUrl = new Map();
entries.forEach((e, idx) => {
  if (drop.has(idx)) return;
  const key = normUrl(e.url);
  if (!key) return;
  if (!byUrl.has(key)) { byUrl.set(key, [idx]); return; }
  const group = byUrl.get(key);
  group.push(idx);
});
for (const [, group] of byUrl) {
  if (group.length < 2) continue;
  const keep = group.find((idx) => isLocal(entries[idx])) ?? group[0];
  for (const idx of group) if (idx !== keep) drop.set(idx, 'duplicate url');
}

// Same title: keep a local copy when one exists, otherwise the first.
const byTitle = new Map();
entries.forEach((e, idx) => {
  if (drop.has(idx)) return;
  const key = normTitle(e.title);
  if (!key) return;
  if (!byTitle.has(key)) { byTitle.set(key, [idx]); return; }
  byTitle.get(key).push(idx);
});
for (const [key, group] of byTitle) {
  if (group.length < 2) continue;
  const keep = group.find((idx) => isLocal(entries[idx])) ?? group[0];
  for (const idx of group) if (idx !== keep) {
    if (!drop.has(idx)) drop.set(idx, 'duplicate title: ' + key);
  }
}

const kept = entries.filter((_, idx) => !drop.has(idx));
console.log('entries before:', entries.length, 'after:', kept.length, 'removed:', drop.size);
for (const [idx] of drop) {
  const e = entries[idx];
  console.log(' -', drop.get(idx), '|', e.id, '|', e.title, '|', e.url);
}

s = s.slice(0, openIdx + 1) + '\n  ' + kept.map((e) => e.text).join(',\n  ') + '\n' + s.slice(closeIdx);
fs.writeFileSync(process.argv[3], s);
console.log('wrote', process.argv[3], s.length, 'bytes');
