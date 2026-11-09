# Citrino Intelligence

Inteligencia de mercado inmobiliario para Bolivia (Santa Cruz `SCZ`, La Paz `LPZ`, Cochabamba `CBB`).

El proyecto tiene dos mitades independientes que solo se comunican a través de Supabase (PostgreSQL):

1. **`pipeline/`** — ETL en Python: Google Sheets → transformación → Supabase. Corre cada 6 horas en GitHub Actions.
2. **`frontend/`** — Panel web en React 19 + TypeScript + Vite que lee Supabase directamente desde el navegador.

---

## Base de datos (`citrino_db` — 41 tablas) y Modelo "Diamond"

La plataforma se conecta al proyecto de Supabase **`citrino_db`** (`https://ixistkrftmebvefnqqkq.supabase.co`), que concentra **41 tablas** del esquema `public`:

### 1. Oferta Nueva (`6 tablas oferta_*` — Modelo "Diamond")
El pipeline (`pipeline/sync.py`) carga directamente seis tablas con prefijo `oferta_` que alimentan los **Capítulos 1.1 y 1.2**:

| Tabla | Contenido | Relación |
|---|---|---|
| `oferta_proyectos` | Un registro por proyecto inmobiliario (ubicación, zona, desarrollador, fechas) | — |
| `oferta_indicadores_censo` | Foto (snapshot) del proyecto en cada censo: unidades, ventas, stock, ritmo | `proyecto_id` → `oferta_proyectos` |
| `oferta_tipologias` | Cada tipología de unidad (dormitorios, m², precio) de un censo | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_avg_tipologias` | Promedios por tipo de dormitorios de cada censo | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_condiciones_financieras` | Condiciones de pago del censo | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_amenidades` | Amenidades de cada proyecto | `proyecto_id` → `oferta_proyectos` |

Los identificadores son UUID **deterministas** (derivados del nombre del proyecto y la ciudad), por lo que volver a ejecutar el pipeline no duplica datos: el volcado es un `upsert`.

### 2. Marketplace, Indicadores ASFI/Macro y Encuestas (`35 tablas anu_*`, `ind_*` y `enc_*`)
Alimentan en vivo los **Capítulos 1.3 a 5.1**:
- **Oferta de Particulares (`3 tablas anu_*` + `ind_oferta_inmuebles`):** `ind_oferta_inmuebles` (6.761 anuncios), `anu_anuncios`, `anu_anuncio_rentabilidad`, `anu_tc_diario` (Cap. 1.3).
- **Bienes Adjudicados, Sistema Financiero ASFI y Ciclo (`10 tablas ind_*` adicionales):** `ind_bienes_adjudicados`, `ind_remates_judiciales` (Cap. 1.4); `ind_consolidado_carteras`, `ind_consolidado_hipotecaria_vivienda`, `ind_consolidado_credito_construccion`, `ind_cartera_construccion`, `ind_mora_hipotecaria_bancos` (Cap. 3.1 y 3.2); `ind_alquileres`, `ind_ipc`, `ind_precios_latam` (Cap. 5.1).
- **Encuestas de Demanda y Endeudamiento Hipotecario (`21 tablas enc_*`):** 16 tablas `enc_*` de demanda residencial/inversión (Cap. 2.1, 2.2 y 2.3) y 5 tablas `enc_credito_*` de prestatarios hipotecarios (Cap. 4.1, 4.2 y 4.3).

Los scripts SQL están en `supabase/` y se ejecutan **manualmente**, en orden, en el SQL Editor de Supabase:

1. `001_diamond_tables.sql` — crea las seis tablas `oferta_*`.
2. `002_rls_public_read.sql` — habilita lectura pública (rol `anon`) con seguridad por filas (RLS) en las **41 tablas** de `citrino_db`.
3. `003_auth_config.sql` — configuración de autenticación.

---

## Pipeline (`pipeline/`)

Cada ciudad tiene un Google Sheet con tres pestañas: `Datos & Margenes`, `Tipología & Precios` y `Amenidades` (9 fuentes en total). Sus identificadores están en `pipeline/config.py`.

Flujo de `pipeline/sync.py`:

1. **Extraer** las pestañas con `sheets_client.py` (Google Sheets API v4, cuenta de servicio, solo lectura).
2. **Transformar** con `transform.py` (`DiamondTransformer`): normaliza encabezados, números en formato boliviano (`utils.py`) y asigna zonas por coordenadas con los polígonos de `datakmz/*.kmz` (`geospatial.py`).
3. **Cargar** con `supabase_client.py` en orden seguro para las claves foráneas: `proyectos`, `indicadores_censo`, `tipologias`, `avg_tipologias`, `condiciones_financieras`, `amenidades`.

Si falla cualquier extracción o carga, el proceso termina con código 1 a propósito, para no dejar una sincronización parcial.

### Parámetros (variables de entorno)

| Variable | Valores | Efecto |
|---|---|---|
| `SYNC_CITY` | `ALL` (defecto), `SCZ`, `LPZ`, `CBB` | Ciudades a extraer |
| `SYNC_TAB` | `ALL` (defecto), `datos_margenes`, `tipologia_precios`, `amenidades` | Carga solo las tablas derivadas de esa pestaña. `datos_margenes` se extrae siempre, porque las otras pestañas dependen de ella |
| `SYNC_MODE` | `incremental` (defecto), `full` | Solo se registra en el log: el `upsert` es idempotente, así que ambos modos escriben lo mismo |

Un valor inválido termina con error antes de leer o escribir nada.

### Variables necesarias

Copia `.env.example` a `.env` y completa:

- `GOOGLE_APPLICATION_CREDENTIALS`: ruta al JSON de la cuenta de servicio.
- `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`: dashboard de Supabase → Settings → API (`service_role`).

En GitHub Actions se usan los secretos `GOOGLE_CREDENTIALS`, `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`.

### Ejecutar

```bash
pip install -r requirements.txt
python -m pipeline.sync
```

Con parámetros (Bash):

```bash
SYNC_CITY=SCZ SYNC_TAB=amenidades python -m pipeline.sync
```

Con parámetros (PowerShell):

```powershell
$env:SYNC_CITY = "SCZ"; $env:SYNC_TAB = "amenidades"; python -m pipeline.sync
```

En GitHub: *Actions → "📊 Sync: Sheets → Supabase" → Run workflow* (permite elegir ciudad, pestaña y modo). También corre cada 6 horas y al subir cambios en `pipeline/`, `supabase/` o `requirements.txt`.

---

## Frontend (`frontend/`)

Panel "Workspace OS": React 19 + TypeScript + Vite, gráficos con ECharts y mapas con Leaflet. Consulta en vivo las **41 tablas** de `citrino_db` desde el navegador (`src/lib/supabase.ts`) para alimentar las 5 secciones y 13 capítulos (`1.1` a `5.1`), filtrando dinámicamente por ciudad (`SCZ`, `LPZ`, `CBB`, `ALL`) y por la barra inferior (`FilterBar`).

Necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `frontend/.env`.

```bash
cd frontend
npm install
npm run dev       # servidor de desarrollo
npm run build     # tsc -b && vite build (un error de tipos rompe el build)
npm run lint      # oxlint
```

No hay suite de pruebas automatizadas en ninguna de las dos mitades.

Despliegue: Vercel (`vercel.json`) o Netlify (`netlify.toml`), ambos con reescritura de rutas a `index.html`.

---

## Estructura

```
.
├── .github/workflows/sync-pipeline.yml   # GitHub Actions: sincronización cada 6 h
├── datakmz/                              # Polígonos de zonas (KMZ) por ciudad
├── pipeline/
│   ├── config.py          # Hojas de cálculo, pestañas, mapeo de columnas
│   ├── sheets_client.py   # Google Sheets API v4
│   ├── transform.py       # Limpieza y modelo Diamond
│   ├── geospatial.py      # Asignación de zonas por polígonos KMZ
│   ├── supabase_client.py # Upsert por lotes a Supabase
│   ├── sync.py            # Orquestador
│   └── utils.py           # Parseo de números y fechas bolivianos
├── supabase/              # Scripts SQL (se ejecutan a mano)
├── frontend/              # Panel web (React + Vite)
├── docs/                  # Documentación histórica de Workspace OS
└── .agents/skills/        # Guías para agentes de IA
```
