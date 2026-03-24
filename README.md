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

## License

See `LICENSE`.

## Deployment

`CNAME` is present for custom-domain hosting (e.g. GitHub Pages).
