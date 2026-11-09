# Beyond the Classroom — Mukesh Ravichandran

Portfolio website documenting 23 intramural sports podium finishes at East Texas A&M University
across 5 semesters (Fall 2024 – Fall 2026), backed by a reproducible Python/DuckDB analytics pipeline.

**Live site:** https://pushpullleg.github.io/btc-portfolio/

## What this is

A static single-page application with four sections:

| Section | Contents |
|---|---|
| Overview | KPI tiles and embedded Tableau dashboard |
| Explorer | Filterable achievement grid with evidence attribution |
| Journey | Semester-by-semester expandable timeline |
| Engineering | Pipeline architecture, validation strategy, and design decisions |

## Technology

TypeScript · Vite · PapaParse · Tableau Embedding API v3 · GitHub Actions · GitHub Pages

## Data

The five CSV files in `public/data/` are reviewed exports from a private DuckDB pipeline (M2).
They contain only public-safe fields. Three private tracking fields (`evidence_id`,
`placement_source`, `record_source`) are excluded from all public exports by the pipeline's
export layer.

The raw source data (IMLeagues PDF records, evidence manifest, DuckDB database) is kept in a
separate private workspace and is not part of this repository.

## Running locally

```bash
npm install
npm run dev        # dev server at http://localhost:5173/btc-portfolio/
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`),
which builds the site and deploys it to GitHub Pages. No secrets are required beyond the
automatically provided `GITHUB_TOKEN`.

## Copyright

© Mukesh Ravichandran. All rights reserved.
