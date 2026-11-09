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
npm run build     # tsc -b && vite build (a type error fails the build)
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

* `src/lib/supabase.ts` is the whole data layer connected to the **`citrino_db`** Supabase project (`https://ixistkrftmebvefnqqkq.supabase.co`, 33 tables):
  * **6 `oferta_*` tables** (`oferta_proyectos`, `oferta_indicadores_censo`, `oferta_tipologias`, `oferta_avg_tipologias`, `oferta_condiciones_financieras`, `oferta_amenidades`) power Chapters 1.1 and 1.2 (`EvolutivoOfertaPanel`).
  * **27 `anu_*`, `enc_*`, and `ind_*` tables** (`fetchMarketplaceLive`, `fetchBienesAdjudicadosLive`, `fetchDemandaLive`, `fetchSistemaFinancieroLive`, `fetchEndeudamientoLive`, `fetchCicloInmobiliarioLive`) power Chapters 1.3 through 5.1, using `src/data/citrinoDataStudioData.ts` only as a fallback when a specific table or sub-question has no rows.
* `src/App.tsx` owns session/auth state (Supabase auth or guest mode via `AuthScreen`), the city filter (`SCZ|LPZ|CBB|ALL`), the theme (saved in `localStorage` key `citrino_theme_v2`; without a saved choice it follows the system `prefers-color-scheme`) and the shell: `SubHeader` (top tabs), `LeftAnalyticsBar` (chapter navigation), `FilterBar`, the active panel wrapped in an `ErrorBoundary`, and `ChatPanel`/`AnalysisPanel` on the right.
* Each tab is a large panel component in `src/components/`: `WorkspacePanel` (main dashboard), `AnalysisPanel`, `TipologiasPanel`, `AnalisisProductoPanel`, `ComparacionProyectosPanel`, `GeoespacialPanel`, `EvolutivoOfertaPanel`, `MarketplaceParticularesPanel`, `BienesAdjudicadosPanel`, `AnalisisDemandaPanel`, `SistemaFinancieroPanel`, `CicloInmobiliarioPanel`, `EndeudamientoHipotecarioPanel`, and `HipotecarioPanel`. Charts use ECharts (`echarts-for-react`); `useChartTheme` (`src/lib/chartTheme.ts`) gives them axis/legend colors for the current theme.
* Styling is plain CSS in `src/index.css` (design tokens in `:root`, light theme in `[data-theme="light"]`), `src/mobile.css` and one CSS file per large component; there is no CSS framework. Text uses only four sizes, defined as tokens: `--fs-etiqueta` (11px), `--fs-cuerpo` (13px), `--fs-subtitulo` (16px) and `--fs-titulo` (22px) — use `var(--fs-...)` in CSS and inline styles, and plain numbers 11/13/16/22 inside ECharts options (which cannot use CSS variables).

## Deployment

Frontend deploys via Vercel (`vercel.json`: builds in `frontend/`, output `frontend/dist`) or Netlify (`netlify.toml`), both with SPA rewrite to `index.html`.

