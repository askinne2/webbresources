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
