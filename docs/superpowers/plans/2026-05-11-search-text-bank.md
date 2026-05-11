# Site Search Text Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the home page site search so visitors can find any visible text on any indexed page — full club names ("Chess and Strategy Games"), teacher names ("McCray"), and meeting locations ("Sci Room 225") — by indexing the actual page body text with a one-off Node script, plus teaching the matcher to ignore filler words like "and" / "the".

**Architecture:** Add a dependency-free Node build script (`scripts/build-search-index.js`) that reads each indexed HTML file from the repo root, strips chrome (head/header/footer/script/style) and HTML tags, and writes a regenerated `js/site-search-index.js` whose entries now carry a `text` field alongside `title` and `keywords`. Update `js/site-search.js` to include `text` in the haystack and to drop a tiny stopword list (`and`, `the`, `of`, `for`, `a`, `an`, `to`, `in`, `on`, `with`, `&`) from the user query so multi-word natural phrases match. Add a `scripts/test-search.js` smoke harness (Node, no framework) that mirrors the matcher and asserts a fixed list of `(query → expected URL)` cases — keeping the repo's existing "no build system, no npm" posture.

**Tech Stack:** Static HTML + jQuery, custom client-side site search (`js/site-search.js` consuming `window.SITE_SEARCH_INDEX` from `js/site-search-index.js`), Node ≥ 14 (only for the local build + test scripts; not required to serve the site), Git.

---

## File map

| Path | Role |
|------|------|
| `scripts/build-search-index.js` | **New.** Node script. Reads each HTML file in `PAGES`, extracts visible body text, writes regenerated `js/site-search-index.js`. Dependency-free. |
| `scripts/test-search.js` | **New.** Node script. Loads the generated index, runs query → result assertions, exits non-zero on failure. Mirrors `js/site-search.js`'s matcher contract. |
| `js/site-search.js` | **Modify.** Two small changes: include `item.text` in `haystackFor()`; drop stopwords in `matchesQuery()`. |
| `js/site-search-index.js` | **Regenerate.** Becomes the build script's output. Adds `text:` per entry. Existing `keywords:` values preserved verbatim from the current file (the build script carries them as seed data). |
| `README.md` | **Modify.** Add a short "Site search" section explaining the build step. |
| `bgroup.html`, `agroup.html`, `cgroup.html`, `sports.html`, every other indexed `*.html` | **Read-only.** Source of the extracted text. Never modified by this plan. |

**Out of scope:** No npm/`package.json`, no pre-commit hooks, no HTML edits, no nav/CSS fixes (the verbatim student quirks stay in this branch as already decided).

---

### Task 1: Add test harness with intentionally failing cases

**Files:**
- Create: `scripts/test-search.js`

**Test:** Running `node scripts/test-search.js` produces output that prints OK for sanity cases (`robotics`, `drone`, `handbook`) and FAIL for the new cases (`Chess and Strategy Games`, `McCray`, `Sci Room 225`, etc.) — then exits with code 1.

- [ ] **Step 1: Create the `scripts/` directory**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
mkdir -p scripts
```

Expected: directory exists; no output.

- [ ] **Step 2: Write `scripts/test-search.js`**

Create file `scripts/test-search.js` with the following exact contents:

```javascript
#!/usr/bin/env node
/**
 * Smoke test for the site search index + matcher.
 *
 * Loads js/site-search-index.js into a fake window, then runs a fixed
 * list of (query → expected URLs) assertions using a matcher that MUST
 * mirror js/site-search.js. Exits non-zero on any failure.
 *
 * NOTE: If you change the matcher in js/site-search.js (normalize,
 * haystackFor, matchesQuery, STOPWORDS), update the mirrored copy below.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'js/site-search-index.js');

const indexSrc = fs.readFileSync(INDEX_PATH, 'utf8');
const loader = new Function('window', indexSrc + '\nreturn window.SITE_SEARCH_INDEX;');
const INDEX = loader({});

// ---- Mirrored matcher (keep in sync with js/site-search.js) ----
const STOPWORDS = {
  and: 1, '&': 1, the: 1, of: 1, for: 1,
  a: 1, an: 1, to: 1, in: 1, on: 1, with: 1
};

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function haystackFor(item) {
  return normalize(
    (item.title || '') + ' ' +
    (item.keywords || '') + ' ' +
    (item.text || '')
  );
}

function matchesQuery(haystack, queryNorm) {
  if (!queryNorm) return false;
  const words = queryNorm.split(' ').filter(function (w) {
    return w && !STOPWORDS[w];
  });
  if (!words.length) return false;
  for (let i = 0; i < words.length; i++) {
    if (haystack.indexOf(words[i]) === -1) return false;
  }
  return true;
}

function search(q) {
  const qn = normalize(q);
  return INDEX
    .filter(function (item) { return matchesQuery(haystackFor(item), qn); })
    .map(function (item) { return item.url; });
}

// ---- Assertions ----
const cases = [
  // Sanity: behavior that already works today must keep working.
  { q: 'robotics', mustInclude: ['agroup.html'] },
  { q: 'drone', mustInclude: ['cgroup.html'] },
  { q: 'handbook', mustInclude: ['handbook.html'] },
  { q: 'curriculum', mustInclude: ['curriculumguide.html'] },

  // New: full club names match.
  { q: 'Chess and Strategy Games', mustInclude: ['bgroup.html'] },
  { q: 'Fashion for a Cause', mustInclude: ['bgroup.html'] },
  { q: 'Webb MD', mustInclude: ['bgroup.html'] },

  // New: teacher / coach names match.
  { q: 'McCray', mustInclude: ['bgroup.html'] },
  { q: 'Carroll', mustInclude: ['bgroup.html'] },
  { q: 'Quarles', mustInclude: ['sports.html'] },

  // New: meeting locations match.
  { q: 'Sci Room 225', mustInclude: ['bgroup.html'] },
  { q: 'Turf Field', mustInclude: ['bgroup.html'] }
];

let failed = 0;
for (const c of cases) {
  const got = search(c.q);
  const missing = c.mustInclude.filter(function (u) { return got.indexOf(u) === -1; });
  if (missing.length) {
    console.error('FAIL  ' + JSON.stringify(c.q) +
      ' -> missing ' + missing.join(', ') +
      ' (got: ' + (got.join(', ') || '<none>') + ')');
    failed++;
  } else {
    console.log('OK    ' + JSON.stringify(c.q) + ' -> ' + got.join(', '));
  }
}

if (failed) {
  console.error('\n' + failed + ' assertion(s) failed (out of ' + cases.length + ').');
  process.exit(1);
}
console.log('\nAll ' + cases.length + ' assertions passed.');
```

- [ ] **Step 3: Run the harness against current code to confirm it fails as expected**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node scripts/test-search.js; echo "exit=$?"
```

Expected: 4 OK lines (`robotics`, `drone`, `handbook`, `curriculum`) followed by 8 FAIL lines for the new cases, ending with `8 assertion(s) failed (out of 12).` and `exit=1`.

If a *sanity* case fails, stop and investigate — that means the mirrored matcher disagrees with current expectations.

- [ ] **Step 4: Commit**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git add scripts/test-search.js
git commit -m "test(search): add Node smoke harness with failing cases for full-text search

12 query-to-URL assertions: 4 pass today (sanity), 8 fail until the
matcher consumes a 'text' field and ignores common stopwords.

Run: node scripts/test-search.js"
```

Expected: `git log -1 --oneline` shows the new commit.

---

### Task 2: Teach the matcher to use a `text` field and ignore stopwords

**Files:**
- Modify: `js/site-search.js` (add `STOPWORDS` near the top of the IIFE; update `haystackFor`; update `matchesQuery`)

**Test:** `node scripts/test-search.js` still fails (because `text` is empty on every entry), but the *production* matcher is now ready to consume `text` and to skip stopwords. The browser site is not broken in any visible way — sanity queries still work.

- [ ] **Step 1: Add `STOPWORDS` constant**

In `js/site-search.js`, replace the block at lines 1–4 (the IIFE opener and `DEBOUNCE_MS`):

**Old:**

```javascript
(function ($) {
  'use strict';

  var DEBOUNCE_MS = 200;
```

**New:**

```javascript
(function ($) {
  'use strict';

  var DEBOUNCE_MS = 200;

  // Filler words dropped from the user's query so natural phrases like
  // "Chess and Strategy Games" or "Fashion for a Cause" still match.
  // Kept tiny on purpose; nothing here is content-bearing.
  var STOPWORDS = {
    and: 1, '&': 1, the: 1, of: 1, 'for': 1,
    a: 1, an: 1, to: 1, 'in': 1, on: 1, 'with': 1
  };
```

- [ ] **Step 2: Update `haystackFor` to include `item.text`**

Replace lines 10–12 of `js/site-search.js`:

**Old:**

```javascript
  function haystackFor(item) {
    return normalize(item.title + ' ' + (item.keywords || ''));
  }
```

**New:**

```javascript
  function haystackFor(item) {
    return normalize(
      (item.title || '') + ' ' +
      (item.keywords || '') + ' ' +
      (item.text || '')
    );
  }
```

- [ ] **Step 3: Update `matchesQuery` to drop stopwords**

Replace the function body at lines 14–22 of `js/site-search.js`:

**Old:**

```javascript
  function matchesQuery(haystack, queryNorm) {
    if (!queryNorm) return false;
    var words = queryNorm.split(' ').filter(Boolean);
    if (!words.length) return false;
    for (var i = 0; i < words.length; i++) {
      if (haystack.indexOf(words[i]) === -1) return false;
    }
    return true;
  }
```

**New:**

```javascript
  function matchesQuery(haystack, queryNorm) {
    if (!queryNorm) return false;
    var words = queryNorm.split(' ').filter(function (w) {
      return w && !STOPWORDS[w];
    });
    if (!words.length) return false;
    for (var i = 0; i < words.length; i++) {
      if (haystack.indexOf(words[i]) === -1) return false;
    }
    return true;
  }
```

- [ ] **Step 4: Sanity-check the file still parses**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node --check js/site-search.js && echo "OK: parses"
```

Expected: `OK: parses`.

- [ ] **Step 5: Re-run the test harness**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node scripts/test-search.js; echo "exit=$?"
```

Expected: still 4 OK + 8 FAIL — the matcher is upgraded but the index has no `text` yet, so the new cases keep failing. This is intentional and proves the test is correctly gated on data, not just on logic.

- [ ] **Step 6: Commit**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git add js/site-search.js
git commit -m "feat(search): include text field in haystack; ignore filler stopwords

Adds STOPWORDS list (and, the, of, for, a, an, to, in, on, with, &)
so multi-word natural queries like 'Chess and Strategy Games' work.

No behavior change yet: site-search-index.js still ships with no
text field. The follow-up commit regenerates the index from page
content via scripts/build-search-index.js."
```

Expected: `git log --oneline -3` shows the test commit, then this commit.

---

### Task 3: Build the extraction script and regenerate the index

**Files:**
- Create: `scripts/build-search-index.js`
- Overwrite: `js/site-search-index.js` (regenerated)

**Test:** After running the script, `node scripts/test-search.js` exits 0 with all 12 assertions passing. Critical pages' `text:` fields contain expected terms (e.g. `McCray`, `Quarles`).

- [ ] **Step 1: Write `scripts/build-search-index.js`**

Create file `scripts/build-search-index.js` with the following exact contents:

```javascript
#!/usr/bin/env node
/**
 * Regenerates js/site-search-index.js from the static HTML files at the
 * repo root. Run after editing any page that affects search results:
 *
 *   node scripts/build-search-index.js
 *
 * The PAGES list below is the source of truth for what gets indexed
 * (URL, title, curated keywords). Page body text is extracted by
 * stripping <head>, <header>, <footer>, <script>, <style>, all other
 * tags, and decoding a small set of HTML entities.
 *
 * Zero npm dependencies on purpose — keeps the repo build-step-free.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'js/site-search-index.js');

// ---- Source of truth: pages to index. Keep in alphabetical-ish nav order. ----
const PAGES = [
  { url: 'index.html',              title: 'Home',                  keywords: 'home portal start main welcome' },
  { url: 'currentschedule.html',    title: 'Current Schedule',      keywords: 'schedule calendar 2025 2026 year classes' },
  { url: '2026-2027schedule.html',  title: '2026 - 2027 Schedule',  keywords: 'schedule next year future calendar' },
  { url: 'make-ups.html',           title: 'Make-Ups',              keywords: 'makeup make-ups absences tests' },
  { url: 'agroup.html',             title: 'A Group',               keywords: 'a group clubs meetings wow network bright webb lifestyle medicine interact french ukrainian apiary sports bowl mahjong model robotics team deca entrepreneurship tabletop games creative writing read latte card outdoor sign language multimedia art sponsors ic us sci library multipurpose visualization lab baily' },
  { url: 'bgroup.html',             title: 'B Group',               keywords: 'b group clubs meetings hot sauce current events chess strategy fashion spartans political fca latin sadd hosa math thrive volunteer flag football student voices ai asian tsa technology student association thrift ic us sci turf gym visualization' },
  { url: 'cgroup.html',             title: 'C Group',               keywords: 'c group clubs meetings philanthropic environmental fly fishing performance film baking great webb career spanish gsa orchestra science olympiad drone architecture agriculture shakespeare multicultural ethics mindfulness sponsors ic us sci bishop college counseling chorus' },
  { url: 'sports.html',             title: 'Sports',                keywords: 'sports athletics teams games coaches' },
  { url: 'school.html',             title: 'School Calendar',       keywords: 'school calendar academic dates calender' },
  { url: 'athletic.html',           title: 'Athletic Calendar',     keywords: 'athletic athletics sports calendar calender' },
  { url: 'curriculumguide.html',    title: 'Curriculum Guide',      keywords: 'curriculum classes courses electives registration' },
  { url: 'handbook.html',           title: 'Handbook',              keywords: 'handbook rules policies procedures student' },
  { url: 'moreinformation.html',    title: 'More Information',      keywords: 'more information links resources hub' },
  { url: 'highlightsection.html',   title: 'Highlight Section',     keywords: 'highlights spotlight featured resources' },
  { url: 'directory.html',          title: 'Directory',             keywords: 'directory staff faculty contact people' },
  { url: 'contactinformation.html', title: 'Contact Information',   keywords: 'contact email phone office reach' },
  { url: 'sourcesandcopyright.html',title: 'Sources & Copyright',   keywords: 'sources copyright credits reference referance' },
  { url: 'studentworklog.html',     title: 'Student Work Log',      keywords: 'work log student process documentation' }
];

// ---- HTML → plain text ----
function extractText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&copy;/gi, '(c)')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildEntry(page) {
  const file = path.join(ROOT, page.url);
  if (!fs.existsSync(file)) {
    throw new Error('Missing HTML file referenced in PAGES: ' + page.url);
  }
  const html = fs.readFileSync(file, 'utf8');
  const text = extractText(html);
  return { url: page.url, title: page.title, keywords: page.keywords, text: text };
}

function render(entries) {
  const lines = entries.map(function (e) { return '    ' + JSON.stringify(e) + ','; });
  return [
    '/**',
    ' * AUTOGENERATED by scripts/build-search-index.js — do not edit by hand.',
    ' * Run `node scripts/build-search-index.js` after editing any indexed HTML.',
    ' * Pages and curated keywords live in the PAGES array of that script.',
    ' */',
    '(function (window) {',
    '  window.SITE_SEARCH_INDEX = [',
    lines.join('\n'),
    '  ];',
    '})(window);',
    ''
  ].join('\n');
}

function main() {
  const entries = PAGES.map(buildEntry);
  fs.writeFileSync(OUT_PATH, render(entries), 'utf8');
  console.log('Wrote ' + path.relative(ROOT, OUT_PATH) + ' (' + entries.length + ' entries).');
}

main();
```

- [ ] **Step 2: Run the script and write the new index**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node scripts/build-search-index.js
```

Expected: prints `Wrote js/site-search-index.js (18 entries).` and exits 0.

- [ ] **Step 3: Spot-check the generated index has expected text**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node --check js/site-search-index.js && echo "OK: parses"
node -e "
const fs = require('fs');
const src = fs.readFileSync('js/site-search-index.js', 'utf8');
const loader = new Function('window', src + '\nreturn window.SITE_SEARCH_INDEX;');
const idx = loader({});
const b = idx.find(x => x.url === 'bgroup.html');
const c = idx.find(x => x.url === 'sports.html');
const need = [
  ['bgroup.html McCray',    b.text.toLowerCase().includes('mccray')],
  ['bgroup.html Sci Room',  b.text.toLowerCase().includes('sci room')],
  ['bgroup.html Carroll',   b.text.toLowerCase().includes('carroll')],
  ['sports.html Quarles',   c.text.toLowerCase().includes('quarles')],
];
let bad = 0;
for (const [label, ok] of need) {
  console.log((ok ? 'OK   ' : 'MISS ') + label);
  if (!ok) bad++;
}
if (bad) process.exit(1);
"
```

Expected: `OK: parses` then four `OK   …` lines and exit 0.

- [ ] **Step 4: Run the full test harness**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node scripts/test-search.js; echo "exit=$?"
```

Expected: 12 OK lines, `All 12 assertions passed.`, `exit=0`.

- [ ] **Step 5: Manual browser sanity check (optional but recommended)**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/index.html` and type each of:
1. `Chess and Strategy Games` → expect result link **B Group**.
2. `McCray` → expect **B Group**.
3. `Quarles` → expect **Sports**.
4. `Sci Room 225` → expect **B Group**.

Ctrl+C the server when done.

- [ ] **Step 6: Commit**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git add scripts/build-search-index.js js/site-search-index.js
git commit -m "feat(search): index page body text via scripts/build-search-index.js

Generates js/site-search-index.js from each indexed HTML file at the
repo root by stripping nav/footer/scripts/styles and decoding a small
set of HTML entities. Adds a text field per entry alongside the
existing curated title/keywords.

All 12 cases in scripts/test-search.js now pass, including full club
names, teacher / coach names, and meeting locations."
```

Expected: `git log --oneline -4` shows test → matcher → build commits on top of the existing two on this branch.

---

### Task 4: Document the build step in README

**Files:**
- Modify: `README.md` (append a "Site search" section before the License section)

**Test:** Section renders as Markdown; commands shown match the scripts on disk.

- [ ] **Step 1: Read the current README to find the right insertion point**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
grep -n '^## ' README.md
```

Expected: lists section headings, including `## License` and `## Deployment`. Insert the new section directly before `## License`.

- [ ] **Step 2: Insert the new "Site search" section**

In `README.md`, immediately before the `## License` line, insert this block (preceded and followed by a blank line):

```markdown
## Site search

The home page search is a tiny client-side matcher in `js/site-search.js` that filters a static index at `js/site-search-index.js`.

`js/site-search-index.js` is **generated**. Do not edit it by hand. To refresh it after changing any page content (club lists, coach names, room numbers, etc.):

```bash
node scripts/build-search-index.js
```

That reads each HTML file listed in the `PAGES` array of `scripts/build-search-index.js`, strips chrome (head/header/footer/scripts/styles) and HTML tags, and writes the regenerated index.

To verify the search behaves correctly:

```bash
node scripts/test-search.js
```

The harness exits non-zero on any failed `(query → expected page)` assertion. Add new assertions there when you add new searchable content.
```

- [ ] **Step 3: Verify the README still reads cleanly**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
head -120 README.md
```

Expected: the new section appears between the existing site-structure description and the License section, with no broken fence blocks.

- [ ] **Step 4: Final end-to-end re-verification**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node scripts/build-search-index.js
node scripts/test-search.js
```

Expected: build prints `Wrote js/site-search-index.js (18 entries).`; test prints `All 12 assertions passed.`

- [ ] **Step 5: Commit**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git add README.md
git commit -m "docs: document scripts/build-search-index.js and scripts/test-search.js"
```

- [ ] **Step 6: Push branch so the open PR's Cloudflare Pages preview rebuilds**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git push origin feature/student-webbresources-2026-05-10
```

Expected: GitHub accepts the push; PR #1 picks up three new commits; Cloudflare Pages builds a fresh preview URL within ~1 minute.

---

## Self-review

**1. Spec coverage**

| Requirement | Task |
|-------------|------|
| Search finds full club names like "Chess and Strategy Games" | Task 2 (stopword filter) + Task 3 (text extraction) |
| Search finds teacher / coach names like "McCray", "Quarles" | Task 3 (text extraction populates `text` field) |
| Search finds meeting places like "Sci Room 225" | Task 3 |
| Works for all indexed pages, not just A/B/C | Task 3 (`PAGES` array covers 18 pages) |
| Generation is a script, not hand maintenance | Task 3 (`scripts/build-search-index.js`) |
| Existing single-word searches keep working (`drone`, `robotics`, `handbook`) | Task 1 (sanity assertions) + Task 2 (matcher backward-compatible) |
| No new runtime dependencies / npm | Tasks 1 + 3 are dependency-free Node |
| No HTML edits (preserve student work verbatim) | All tasks read `.html` files; none modify them |

**2. Placeholder scan**

No TBD/TODO/"add error handling"/"similar to Task N" placeholders. Every code step contains the exact code to write. Every command shows the exact expected output.

**3. Type consistency**

- `STOPWORDS` keys: same set in `scripts/test-search.js` (Task 1) and `js/site-search.js` (Task 2).
- `haystackFor`: same signature and `text` field name in test harness and production matcher.
- Index entry shape: `{ url, title, keywords, text }` consistently in test loader, `buildEntry`, and production `haystackFor`.
- Page count: 18 entries in `PAGES` (counted manually); both `Wrote …(18 entries).` and the matching assertion list reference that count without contradiction.

---

## Execution handoff

**Plan complete and saved to** `docs/superpowers/plans/2026-05-11-search-text-bank.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks. **REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.

2. **Inline Execution** — Execute tasks in this session with checkpoints. **REQUIRED SUB-SKILL:** superpowers:executing-plans.

**Which approach?**
