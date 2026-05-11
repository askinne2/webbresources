# Knox-Recipes Website

Static HTML site for **Webb School of Knoxville** student resources (“Knoxville Renowned Recipes”): schedules, handbooks, athletics, food/cafe, directories, and related pages.

## Filesystem layout

```
.
├── CNAME
├── LICENSE
├── README.md
├── .gitignore
│
├── css/
│   ├── app.css
│   ├── foundation.css
│   └── foundation.min.css
│
├── img/
│   ├── knox-recipes-logo-blue.svg
│   └── knox-recipes-logo-white.svg
│
├── js/
│   ├── app.js
│   ├── site-search-index.js
│   ├── site-search.js
│   └── vendor/
│       ├── foundation.js
│       ├── foundation.min.js
│       ├── jquery.js
│       └── what-input.js
│
├── templates/
│   ├── footer.html
│   └── header.html
│
├── 2026-2027schedule.html
├── High School copy.html
├── Middle School.html
├── accessibility.html
├── agroup.html
├── athletic.html
├── bgroup.html
├── cafe.html
├── cgroup.html
├── contactinformation.html
├── curriculumguide.html
├── currentschedule.html
├── directory.html
├── food.html
├── handbook.html
├── highlightsection.html
├── index.html
├── make-ups.html
├── moreinformation.html
├── sample.html
├── school.html
├── sourcesandcopyright.html
├── sports.html
├── story.html
├── studentworklog.html
└── tsaforms.html
```

`.git/` is omitted above; it holds Git metadata only.

## Stack

- HTML pages at the repo root share **Foundation** CSS/JS (`css/`, `js/vendor/`) and site scripts in `js/`.
- **Site search** is implemented with `js/site-search.js` and `js/site-search-index.js`.
- **Reusable chrome** lives in `templates/` (`header.html`, `footer.html`).

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

## License

See `LICENSE`.

## Deployment

`CNAME` is present for custom-domain hosting (e.g. GitHub Pages).
