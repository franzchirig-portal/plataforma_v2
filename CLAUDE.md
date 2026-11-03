# CLAUDE.md

## Lineamientos

- Usa lenguaje conciso pero explica didácticamente los conceptos técnicos porque soy principiante en desarrollo y datos.
- Trabaja siempre commiteando todos los archivos que tocas de forma organizada y concisa.
- Cuando escribas documentación o modifiques CLAUDE.md, recuerda que son documentos autocontenidos: no deben tener referencias específicas al chat actual porque un chat nuevo no las va a entender.

## 

## Overview

Citrino "Intelligence": real-estate market intelligence for Bolivia (Santa Cruz `SCZ`, La Paz `LPZ`, Cochabamba `CBB`). Two independent halves connected only through Supabase:

1. **`pipeline/`** — Python ETL: Google Sheets → transform → Supabase (Postgres).
2. **`frontend/`** — React 19 + TypeScript + Vite dashboard ("Workspace OS") that reads Supabase directly from the browser.

UI copy, docs and commit messages are in Spanish (commits use conventional-commit prefixes such as `feat(gis):`, `fix(build):`, `style:`).

Note: `README.md` and `.agents/skills/sheets\_supabase\_pipeline/SKILL.md` still describe the old Medallion (Bronze/Silver/Gold) design and files like `003\_gold\_views.sql`. The current code uses the **"Diamond" model** (see below); trust the code and `supabase/00\*.sql` over the README.

## Commands

Pipeline (run from repo root; needs `.env` — see `.env.example` — with `GOOGLE\_APPLICATION\_CREDENTIALS`, `SUPABASE\_URL`, `SUPABASE\_SERVICE\_KEY`):

```bash
pip install -r requirements.txt
python -m pipeline.sync
```

Frontend (run from `frontend/`; needs `VITE\_SUPABASE\_URL` and `VITE\_SUPABASE\_ANON\_KEY` in `frontend/.env\*`):

```bash
npm install
npm run dev       # vite dev server
npm run build     # vite build (no tsc step; type errors do not fail the build)
npm run lint      # oxlint
```

There is no test suite for either half.

## Pipeline architecture

`pipeline/sync.py` orchestrates: for each city in `config.SHEETS\_CONFIG` fetch 3 tabs (`datos\_margenes`, `tipologia\_precios`, `amenidades`) via `SheetsClient` → `DiamondTransformer.transform\_all(scz, lpz, cbb)` in `transform.py` → `SupabaseLoader.upsert\_batch` in FK-safe order: `proyectos`, `indicadores\_censo`, `tipologias`, `avg\_tipologias`, `condiciones\_financieras`, `amenidades`. Table names come from `config.DIAMOND\_TABLES` (Supabase tables are prefixed `oferta\_\*`). Any extraction or load failure calls `sys.exit(1)` deliberately, to avoid partial/false-positive syncs.

* `utils.py` parses Bolivian number formats; `config.py` maps sheet headers (with many spelling variants) to internal columns — add new header variants there.
* `geospatial.py` (`KMZMatcher`) loads polygons from `datakmz/\*.kmz` and does point-in-polygon matching to assign zones to projects by lat/lon.
* `.github/workflows/sync-pipeline.yml` runs the sync every 6h, on manual dispatch and on pushes touching `pipeline/\*\*`, `supabase/\*\*` or `requirements.txt`. Secrets: `GOOGLE\_CREDENTIALS`, `SUPABASE\_URL`, `SUPABASE\_SERVICE\_KEY`. `sync.py` reads `SYNC\_CITY` (ALL/SCZ/LPZ/CBB), `SYNC\_TAB` (ALL or one tab) and `SYNC\_MODE` (incremental/full) from the environment and fails on invalid values. `SYNC\_TAB` always extracts `datos\_margenes` too (the other tabs depend on it) and loads only the tables derived from the chosen tab (`TABLE\_SOURCE\_TAB` in `sync.py`). `SYNC\_MODE` is only logged, because the Supabase upsert is idempotent.
* `supabase/001–003\_\*.sql` are applied manually (schema, public-read RLS, auth config).

## Frontend architecture

* `src/lib/supabase.ts` is the whole data layer: Supabase client, types (`Proyecto`, `IndicadorCenso`, `AvgTipologia`, `IndicadorFull`), and fetchers with a 60s in-memory cache. It fetches `oferta\_proyectos` and `oferta\_indicadores\_censo` whole and **joins in JS** (`fetchIndicadores`); `getLatestPerProject` picks the newest snapshot per project. Metric helpers (`computeZonaMetrics`, `computeTipologiaBenchmarks`, `fetchKPIs`) live here too.
* `src/App.tsx` owns session/auth state (Supabase auth or guest mode via `AuthScreen`), the city filter (`SCZ|LPZ|CBB|ALL`), the top tab bar, and the Antigravity-IDE-style shell (`LeftSidebar`, `RightSidebar`/`ChatPanel`, `CommandPalette` on Ctrl/⌘+K).
* Each tab is a large panel component in `src/components/`: `WorkspaceOSPanel` (Mission Control, comparator, report generator — see `docs/WORKSPACE\_OS\_GUIDE.md`), `AnalysisPanel`, `TipologiasPanel`, `WorkspacePanel`, `GeoespacialPanel` (maps, heatmaps, bubble maps, QGIS layers). Charts use ECharts (`echarts-for-react`).
* Styling is plain CSS in `src/index.css` / `App.css` following an Antigravity IDE dark palette; there is no CSS framework.

## Deployment

Frontend deploys via Vercel (`vercel.json`: builds in `frontend/`, output `frontend/dist`) or Netlify (`netlify.toml`), both with SPA rewrite to `index.html`.

