# Student Webbresources Bundle — Feature Branch Merge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the verbatim Google Drive site bundle into `/Users/andrewskinner/Local Sites/webb-resources` on a dedicated feature branch, then make **one** follow-up commit that only updates site search keywords so club names added as visible HTML are discoverable again.

**Architecture:** Use `rsync` from the iCloud Downloads folder into the Git working tree while excluding repo-only paths (`.git`, `.gitignore`, `.cursor`, `.DS_Store`). First commit captures the student drop exactly (including known issues: missing `href` on “More Information” parent links, `.centered-large-text { font-sixe: ... }` typo). Second commit touches **only** `js/site-search-index.js` to extend `keywords` for `agroup.html`, `bgroup.html`, and `cgroup.html` so the existing client-side matcher (`site-search.js`) can find representative club/sponsor queries. No other “mentor fixes” in this branch per product owner request.

**Tech Stack:** Static HTML/CSS/JS, jQuery site search (`js/site-search.js` + `window.SITE_SEARCH_INDEX` in `js/site-search-index.js`), Git, `rsync`, shell verification (`node -e`, `rg`).

---

## File map

| Path | Role |
|------|------|
| `/Users/andrewskinner/Library/Mobile Documents/com~apple~CloudDocs/Downloads/webbresources/` | Source of truth for student export (read-only during import). |
| `/Users/andrewskinner/Local Sites/webb-resources/` | Git repo root; receives synced files. |
| `.git/`, `.gitignore` | Preserved; never overwritten by rsync. |
| `.cursor/` (if present) | Excluded from rsync delete; keep local tooling. |
| `js/site-search-index.js` | Only file modified in the **second** commit (keyword expansion). |

---

### Task 1: Create feature branch from default branch

**Files:** None (Git metadata only).

**Test:** Branch exists and points at same commit as `main` (or `master`) before import.

- [ ] **Step 1: Discover default branch name**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git rev-parse --is-inside-work-tree
git branch --show-current
git remote -v
```

Expected: `true`, current branch name (often `main` or `master`), `origin` → `https://github.com/askinne2/webbresources.git`.

- [ ] **Step 2: Update local default and create feature branch**

Replace `<DEFAULT>` below with `main` or `master` from `git symbolic-ref refs/remotes/origin/HEAD` output:

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git fetch origin
DEFAULT=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
echo "DEFAULT=$DEFAULT"
git checkout "$DEFAULT"
git pull origin "$DEFAULT"
git checkout -b feature/student-webbresources-2026-05-10
```

Expected: checkout succeeds; `git branch --show-current` prints `feature/student-webbresources-2026-05-10`.

- [ ] **Step 3: Commit**

No commit in Task 1 (branch only).

---

### Task 2: Sync student bundle into working tree (verbatim)

**Files:** All site assets under repo root that exist in the Downloads bundle (HTML, `css/`, `js/` except index behavior, `img/`, `templates/`, etc.) are replaced or added by rsync. **Excluded from overwrite:** `.git`, `.gitignore`, `.cursor`, `.DS_Store`.

**Test:** `git status` shows many modified/new files under the site root; `js/site-search.js` unchanged vs pre-sync (byte match optional); `.git` directory still present.

- [ ] **Step 1: Dry-run rsync and review**

`--delete` removes destination files absent from the source; the student zip has no `docs/` tree, so **protect** repo-only paths (this plan lives under `docs/`).

```bash
SRC="/Users/andrewskinner/Library/Mobile Documents/com~apple~CloudDocs/Downloads/webbresources"
DST="/Users/andrewskinner/Local Sites/webb-resources"
rsync -avn --delete \
  --filter='P /docs/' \
  --filter='P /.cursor/' \
  --filter='P /.gitignore' \
  --filter='P /HANDOFF.md' \
  --exclude '.git/' \
  --exclude '.gitignore' \
  --exclude '.cursor/' \
  --exclude '.DS_Store' \
  "$SRC/" "$DST/"
```

Expected: Listed paths are only under the static site (no `.git`). Note any “deleting” lines — none should remove `docs/` or `.cursor/`.

- [ ] **Step 2: Execute rsync**

```bash
SRC="/Users/andrewskinner/Library/Mobile Documents/com~apple~CloudDocs/Downloads/webbresources"
DST="/Users/andrewskinner/Local Sites/webb-resources"
rsync -av --delete \
  --filter='P /docs/' \
  --filter='P /.cursor/' \
  --filter='P /.gitignore' \
  --filter='P /HANDOFF.md' \
  --exclude '.git/' \
  --exclude '.gitignore' \
  --exclude '.cursor/' \
  --exclude '.DS_Store' \
  "$SRC/" "$DST/"
```

Expected: rsync completes with exit code 0.

- [ ] **Step 3: Verify critical paths**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
test -d .git && echo "OK: .git preserved"
test -f .gitignore && echo "OK: .gitignore preserved"
rg -n '<a>More Information</a>' index.html agroup.html | head
rg -n 'font-sixe' css/app.css
```

Expected: `.git` and `.gitignore` exist; first `rg` shows student nav pattern (preserved intentionally); second `rg` shows the CSS typo line (preserved).

- [ ] **Step 4: Commit (verbatim import only)**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git add -A
git status
git commit -m "chore: import student webbresources bundle (2026-05-10, verbatim)

Source: iCloud Downloads/webbresources (Google Drive).
Intentionally includes student HTML/CSS as submitted (nav + CSS quirks preserved for review)."
```

Expected: `git log -1 --oneline` shows the new commit; second parent is not required (single parent).

---

### Task 3: Expand site search keywords (A/B/C club pages only)

**Files:**

- Modify: `/Users/andrewskinner/Local Sites/webb-resources/js/site-search-index.js` (replace only the three `{ url: 'agroup.html' ... }`, `{ url: 'bgroup.html' ... }`, `{ url: 'cgroup.html' ... }` lines with the versions below; leave all other index entries unchanged).

**Test:** After editing, `node` substring checks pass; manual spot-check in browser optional.

- [ ] **Step 1: Replace three index rows**

Open `js/site-search-index.js` and replace lines 11–13 (the `agroup`, `bgroup`, `cgroup` objects) with:

```javascript
    { url: 'agroup.html', title: 'A Group', keywords: 'a group clubs meetings wow network bright webb lifestyle medicine interact french ukrainian apiary sports bowl mahjong model robotics team deca entrepreneurship tabletop games creative writing read latte card outdoor sign language multimedia art sponsors ic us sci library multipurpose visualization lab baily' },
    { url: 'bgroup.html', title: 'B Group', keywords: 'b group clubs meetings hot sauce current events chess strategy fashion spartans political fca latin sadd hosa math thrive volunteer flag football student voices ai asian tsa technology student association thrift ic us sci turf gym visualization' },
    { url: 'cgroup.html', title: 'C Group', keywords: 'c group clubs meetings philanthropic environmental fly fishing performance film baking great webb career spanish gsa orchestra science olympiad drone architecture agriculture shakespeare multicultural ethics mindfulness sponsors ic us sci bishop college counseling chorus' },
```

Leave the rest of the file exactly as it was (including the IIFE wrapper and other URLs).

- [ ] **Step 2: Run substring verification (no test framework in repo)**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
node -e "
const fs = require('fs');
const s = fs.readFileSync('js/site-search-index.js','utf8');
const need = ['robotics', 'deca', 'technology student association', 'science olympiad', 'drone'];
for (const w of need) {
  if (!s.includes(w)) { console.error('MISSING', w); process.exit(1); }
}
console.log('OK: keyword substrings present');
"
```

Expected: prints `OK: keyword substrings present` and exit code 0.

- [ ] **Step 3: Commit**

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
git add js/site-search-index.js
git commit -m "fix(search): extend A/B/C group keywords for club text content

Club listings are plain text in HTML; search still uses title+keywords only.
Adds sponsor/club tokens from student agroup, bgroup, cgroup pages."
```

Expected: `git log -2 --oneline` shows two commits: verbatim import, then search fix.

---

### Task 4: Manual browser verification (recommended)

**Files:** None.

**Test:** Human confirms search behavior matches expectations.

- [ ] **Step 1: Open local site**

Serve the folder with any static server, e.g.:

```bash
cd "/Users/andrewskinner/Local Sites/webb-resources"
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/index.html` in a browser.

- [ ] **Step 2: Exercise site search**

In the home page search box:

1. Type `robotics` → expect status text to include `1 page` (or more) and a link titled **A Group** pointing to `agroup.html`.
2. Type `technology student` → expect **B Group** / `bgroup.html`.
3. Type `drone` → expect **C Group** / `cgroup.html`.

Expected: All three return at least one result with correct title and `href`.

- [ ] **Step 3: Stop local server**

Ctrl+C in the terminal running `http.server`.

---

## Self-review

**1. Spec coverage**

| Requirement | Task |
|-------------|------|
| Feature branch on `webb-resources` | Task 1 |
| Surgical merge from iCloud Downloads path | Task 2 (`rsync` + excludes) |
| Preserve student mistakes (no mentor fix commits) | Task 2 only imports verbatim; Task 3 does not touch HTML/CSS |
| One allowed follow-up: search functionality | Task 3 (`site-search-index.js` only) |

**2. Placeholder scan**

No TBD/TODO/similar placeholders in this document.

**3. Type consistency**

N/A (plain objects in JS index file; no TypeScript).

---

## Execution handoff

**Plan complete and saved to** `docs/superpowers/plans/2026-05-11-student-webbresources-merge.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.

2. **Inline Execution** — Execute tasks in this session using checkpoints. **REQUIRED SUB-SKILL:** superpowers:executing-plans.

**Which approach?**
