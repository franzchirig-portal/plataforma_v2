# Citrino Intelligence

Inteligencia de mercado inmobiliario para Bolivia (Santa Cruz `SCZ`, La Paz `LPZ`, Cochabamba `CBB`).

El proyecto tiene dos mitades independientes que solo se comunican a través de Supabase (PostgreSQL):

1. **`pipeline/`** — ETL en Python: Google Sheets → transformación → Supabase. Corre cada 6 horas en GitHub Actions.
2. **`frontend/`** — Panel web en React 19 + TypeScript + Vite que lee Supabase directamente desde el navegador.

---

## Modelo de datos ("Diamond")

El pipeline carga directamente seis tablas del esquema `public`, todas con prefijo `oferta_`:

| Tabla | Contenido | Relación |
|---|---|---|
| `oferta_proyectos` | Un registro por proyecto inmobiliario (ubicación, zona, desarrollador, fechas) | — |
| `oferta_indicadores_censo` | Foto (snapshot) del proyecto en cada censo: unidades, ventas, stock, ritmo | `proyecto_id` → `oferta_proyectos` |
| `oferta_tipologias` | Cada tipología de unidad (dormitorios, m², precio) de un censo | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_avg_tipologias` | Promedios por tipo de dormitorios de cada censo | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_condiciones_financieras` | Condiciones de pago del censo | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_amenidades` | Amenidades de cada proyecto | `proyecto_id` → `oferta_proyectos` |

Los identificadores son UUID **deterministas** (derivados del nombre del proyecto y la ciudad), por lo que volver a ejecutar el pipeline no duplica datos: el volcado es un `upsert`.

Los scripts SQL están en `supabase/` y se ejecutan **manualmente**, en orden, en el SQL Editor de Supabase:

1. `001_diamond_tables.sql` — crea las seis tablas.
2. `002_rls_public_read.sql` — habilita lectura pública (rol `anon`) con seguridad por filas.
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

Panel "Workspace OS": React 19 + TypeScript + Vite, gráficos con ECharts y mapas con Leaflet. Lee `oferta_proyectos` y `oferta_indicadores_censo` desde el navegador (`src/lib/supabase.ts`) y los une en JavaScript.

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
