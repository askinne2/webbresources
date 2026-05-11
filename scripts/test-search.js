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
