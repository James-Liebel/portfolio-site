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

## Claim verification (portfolio copy)

Quantitative project claims on the homepage are meant to match committed artifacts on GitHub:

| Topic | Evidence path |
|-------|----------------|
| Fraud metrics & row counts | [Personal_Projects/.../fraud_detection_setup.ipynb](https://github.com/James-Liebel/Personal_Projects/blob/main/projects/machine_learning/fraud_detection_setup.ipynb) |
| VADER finance demo (15 simulated rows) | [stock_sentiment_analysis.ipynb](https://github.com/James-Liebel/Personal_Projects/blob/main/projects/machine_learning/stock_sentiment_analysis.ipynb) |
| TF-IDF classifier scaffold | [news_sentiment_analysis.ipynb](https://github.com/James-Liebel/Personal_Projects/blob/main/projects/machine_learning/news_sentiment_analysis.ipynb) |
| JimAI routers / file counts / timeouts | [JimAI/backend/main.py](https://github.com/James-Liebel/JimAI/blob/main/backend/main.py), [COMPLETION_REPORT.md](https://github.com/James-Liebel/JimAI/blob/main/COMPLETION_REPORT.md) |

**GitHub hygiene (manual):** Rename the typo repo `Porfolio-Watcher` → `Portfolio-Watcher`, add 1–2 sentence READMEs on each public repo, and pin `Personal_Projects`, `JimAI`, and this site.
