# Portfolio Site

Standalone site repo extracted from the larger `Personal_Projects` workspace.

## Contents

- `index.html`: main portfolio page
- `projects/web/`: site scripts, vendored browser libraries, Power BI config, and visualization pages
- `intro/`, `globe/`, `rockets/`, `servers/`: poster and sequence image assets used by the homepage
- `server.js`: simple local static server

## Local Run

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Notes

- `npm install` runs `scripts/copy-vendor.mjs` to refresh `projects/web/vendor/`.
- This repo intentionally excludes the rest of the machine learning and notebook content from the parent workspace.
