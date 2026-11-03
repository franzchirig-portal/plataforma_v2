---
name: sheets-supabase-pipeline
description: >
  Pipeline ETL que sincroniza datos del mercado inmobiliario boliviano desde
  Google Sheets (API v4) hacia Supabase con el modelo "Diamond": seis tablas
  oferta_* cargadas directamente, sin capas intermedias. Corre cada 6 horas en
  GitHub Actions o a demanda. Consolida 3 ciudades (SCZ, LPZ, CBB) x 3 pestañas.
  Usar al modificar pipeline/, supabase/ o el workflow de sincronización.
tags:
  - etl
  - google-sheets
  - supabase
  - github-actions
  - diamond-model
  - real-estate
  - bolivia
---

# Skill: Pipeline Google Sheets → Supabase (modelo Diamond)

Documento autocontenido para trabajar en `pipeline/`. La visión general del
proyecto está en el `README.md` de la raíz.

---

## Arquitectura

```
Google Sheets API v4  (cuenta de servicio, solo lectura)
    ↓
GitHub Actions (cron cada 6 h, dispatch manual o push a pipeline/**)
    ↓
pipeline/sync.py  ← orquestador
    ├── sheets_client.py    ← extrae cada pestaña
    ├── transform.py        ← DiamondTransformer: limpia y construye las 6 tablas
    │     └── geospatial.py ← asigna zona/subzona por coordenadas (datakmz/*.kmz)
    └── supabase_client.py  ← upsert por lotes de 500 vía REST
```

No existen capas Bronze/Silver/Gold, vistas materializadas ni funciones SQL de
monitoreo: esa fue una versión anterior y fue reemplazada.

---

## Fuentes de datos

Cada ciudad (`SCZ`, `LPZ`, `CBB`) tiene un Google Sheet con tres pestañas. Los
identificadores de los Sheets y los nombres exactos de las pestañas están en
`SHEETS_CONFIG` de `pipeline/config.py`:

| Clave interna | Pestaña del Sheet | Alimenta |
|---|---|---|
| `datos_margenes` | `Datos & Margenes` | `proyectos`, `indicadores_censo`, `condiciones_financieras` |
| `tipologia_precios` | `Tipología & Precios` | `tipologias`, `avg_tipologias` |
| `amenidades` | `Amenidades` | `amenidades` |

Las pestañas **dependen entre sí**: `tipologia_precios` y `amenidades` descartan
las filas cuyo proyecto no salió de `datos_margenes` en la misma corrida.

---

## Tablas destino (esquema `public`)

Definidas en `supabase/001_diamond_tables.sql`. Los nombres reales los da
`DIAMOND_TABLES` en `pipeline/config.py`.

| Tabla | Clave primaria | Referencia |
|---|---|---|
| `oferta_proyectos` | `proyecto_id` | — |
| `oferta_indicadores_censo` | `indicador_censo_id` | `proyecto_id` → `oferta_proyectos` |
| `oferta_tipologias` | `tipologia_id` | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_avg_tipologias` | (`indicador_censo_id`, `avg_tipologia`) | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_condiciones_financieras` | `condicion_financiera_id` | `indicador_censo_id` → `oferta_indicadores_censo` |
| `oferta_amenidades` | `amenidad_id` | `proyecto_id` → `oferta_proyectos` |

El orden de carga en `sync.py` respeta las claves foráneas: `proyectos`,
`indicadores_censo`, `tipologias`, `avg_tipologias`, `condiciones_financieras`,
`amenidades`.

---

## Idempotencia

Los identificadores se generan con `make_uuid(...)` (`transform.py`): un UUID v5
**determinista** a partir de textos normalizados (por ejemplo, proyecto + ciudad).
El mismo dato produce siempre el mismo id y el volcado es un `upsert` con
`on_conflict` sobre la clave primaria. Ejecutar el pipeline N veces no duplica
datos.

---

## Configuración inicial (una sola vez)

### 1. Cuenta de servicio de Google

1. En Google Cloud Console: crear o elegir un proyecto y habilitar *Google Sheets API*.
2. Credenciales → crear cuenta de servicio (sin roles de GCP) y descargar su clave JSON.
3. Compartir cada Google Sheet con el correo de la cuenta de servicio, permiso *Lector*.

### 2. Secretos de GitHub

Repositorio → Settings → Secrets and variables → Actions:

| Secreto | Valor |
|---|---|
| `GOOGLE_CREDENTIALS` | Contenido completo del JSON de la cuenta de servicio |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → clave `service_role` |

### 3. Esquema de Supabase

Ejecutar **manualmente y en orden** en el SQL Editor de Supabase:

1. `supabase/001_diamond_tables.sql` — crea las seis tablas.
2. `supabase/002_rls_public_read.sql` — lectura pública (rol `anon`) con RLS.
3. `supabase/003_auth_config.sql` — configuración de autenticación.

---

## Ejecución

Los parámetros se pasan con **variables de entorno** (no hay opciones de línea de comandos).

| Variable | Valores | Efecto |
|---|---|---|
| `SYNC_CITY` | `ALL` (defecto), `SCZ`, `LPZ`, `CBB` | Ciudades a extraer |
| `SYNC_TAB` | `ALL` (defecto), `datos_margenes`, `tipologia_precios`, `amenidades` | Carga solo las tablas derivadas de esa pestaña; `datos_margenes` se extrae siempre por la dependencia |
| `SYNC_MODE` | `incremental` (defecto), `full` | Solo se registra en el log: el upsert es idempotente |

Un valor inválido termina con error (código 1) antes de leer o escribir.

```bash
# Local: copiar .env.example a .env y completar las credenciales
pip install -r requirements.txt
python -m pipeline.sync                                   # todo
SYNC_CITY=LPZ python -m pipeline.sync                     # una ciudad (Bash)
SYNC_CITY=LPZ SYNC_TAB=tipologia_precios python -m pipeline.sync
```

```powershell
$env:SYNC_CITY = "LPZ"; $env:SYNC_TAB = "tipologia_precios"; python -m pipeline.sync
```

En GitHub: *Actions → "📊 Sync: Sheets → Supabase" → Run workflow* con los mismos
parámetros (`city`, `tab`, `mode`). Cualquier fallo de extracción o carga hace
`sys.exit(1)` a propósito, para evitar sincronizaciones parciales.

---

## Agregar una ciudad o una pestaña

1. `pipeline/config.py`: agregar la entrada en `SHEETS_CONFIG` (`spreadsheet_id` y pestañas) y, si hay columnas nuevas, las variantes de encabezado en el mapeo de columnas (el Sheet tiene muchas variantes de escritura).
2. `pipeline/sync.py`: agregar la ciudad a `VALID_CITIES`, o la pestaña a `VALID_TABS` y sus tablas a `TABLE_SOURCE_TAB`; si hay tabla nueva, incluirla también en `tables_to_load` respetando el orden de claves foráneas.
3. `pipeline/transform.py`: si la ciudad o pestaña tiene estructura distinta, agregar su lógica (por ejemplo, SCZ usa columnas de zona propias).
4. Si hay tabla nueva: script SQL en `supabase/` y política de lectura pública equivalente a la de `002_rls_public_read.sql`.
5. Para zonas nuevas, agregar el archivo `.kmz` en `datakmz/`.

---

## Formato boliviano de números y fechas

Los Sheets usan punto para miles y coma para decimales. Las conversiones están
en `pipeline/utils.py`:

- `"1.234.567,89"` → `1234567.89`
- `"78,05%"` → `0.7805`
- `"15/07/2023"` → `date(2023, 7, 15)`
- `"-17.377, -66.166"` → `lat=-17.377, lng=-66.166`

---

## Verificación y monitoreo

- Estado de la última corrida: pestaña *Actions* de GitHub (los logs indican filas obtenidas por ciudad y pestaña, y el error si hubo fallo).
- Conteos en Supabase:

```sql
SELECT ciudad, count(*) FROM public.oferta_proyectos GROUP BY ciudad;
SELECT count(*) FROM public.oferta_indicadores_censo;
SELECT count(*) FROM public.oferta_tipologias;
```
