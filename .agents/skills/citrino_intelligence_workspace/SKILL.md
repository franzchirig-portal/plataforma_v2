---
name: citrino-intelligence-workspace
description: >
  Mapa actual de la plataforma Citrino Intelligence: qué partes existen, cómo fluyen
  los datos desde Google Sheets hasta la pantalla, qué pestañas y capítulos hay y
  dónde está cada cosa en el código. Usar al empezar cualquier cambio para ubicarse.
tags:
  - intelligence-platform
  - real-estate-analytics
  - react-vite
  - supabase-postgresql
  - echarts
  - leaflet-gis
  - bolivia-market
---

# Mapa de la plataforma Citrino Intelligence

Plataforma de inteligencia de mercado inmobiliario para Bolivia. Ciudades: Santa Cruz (`SCZ`), La Paz (`LPZ`) y Cochabamba (`CBB`).

Fuente de verdad: `CLAUDE.md` en la raíz del repositorio y el código. Si este documento contradice al código, manda el código.

## 1. Dos mitades conectadas solo por Supabase

| Mitad | Carpeta | Qué hace |
|---|---|---|
| Pipeline de datos | `pipeline/` | Lee Google Sheets, limpia y carga en Supabase (Python) |
| Dashboard | `frontend/` | React 19 + TypeScript + Vite. Lee Supabase desde el navegador |

El pipeline corre cada 6 horas en GitHub Actions (`.github/workflows/sync-pipeline.yml`). Ver la skill `sheets-supabase-pipeline`.

## 2. Modelo de datos actual ("Diamond")

Seis tablas `oferta_*` cargadas directamente, sin capas intermedias:

- `oferta_proyectos`
- `oferta_indicadores_censo`
- `oferta_tipologias`
- `oferta_avg_tipologias`
- `oferta_condiciones_financieras`
- `oferta_amenidades`

Los nombres y el orden de carga están en `pipeline/config.py` (`DIAMOND_TABLES`) y en `supabase/00*.sql`.

Nota: los capítulos 1.2, 1.3, 1.4, 2.x, 3.x, 4.x y 5.1 NO leen Supabase. Leen un archivo fijo: `frontend/src/data/citrinoDataStudioData.ts`.

## 3. Pantalla: cómo está organizada

- **Barra superior (`SubHeader`):** pestañas del capítulo 1.1 (Resumen General, Stock en Ventas, Ritmo de Ventas, Análisis de Producto, Comparación de Proyectos, Proyectos, Tipologías, Mapa).
- **Barra izquierda (`LeftAnalyticsBar`):** capítulos organizados en 5 secciones.
- **Filtros (`FilterBar`):** ciudad (`SCZ`, `LPZ`, `CBB`, `ALL`).
- **Panel central:** el panel del capítulo elegido.
- **Lateral derecho:** `ChatPanel` (asistente) y `AnalysisPanel` (análisis y diagnóstico).
- **Tema:** claro u oscuro. Se guarda en el navegador con la clave `citrino_theme_v2`. Si no hay selección guardada, sigue el sistema.

### Capítulos (menú izquierdo)

| Sección | Capítulos |
|---|---|
| 1. Análisis de Mercado | 1.1 Cuantificación de la Oferta Nueva · 1.2 Evolución de la Oferta Nueva · 1.3 Oferta de Particulares (Marketplace) · 1.4 Bienes Adjudicados y Remates |
| 2. Análisis de la Demanda | 2.1 Composición Económica y Voluntad de Compra · 2.2 Compra como Inversión · 2.3 Compra Vivienda Propia |
| 3. Análisis Financiero | 3.1 Financiamiento al Sector Inmobiliario · 3.2 Evolución de la Mora del Inmobiliario |
| 4. Endeudamiento Hipotecario | 4.1 Perfil del Consumidor de Crédito · 4.2 Estado de la Cartera Hipotecaria · 4.3 Perspectivas del Comprador |
| 5. Indicadores Inmobiliarios | 5.1 Ciclo Inmobiliario Físico |

Cada capítulo de los paneles con pestañas muestra sus pestañas arriba (componente `TopTabBar`). Dentro de un panel no hay botones de capítulo: se cambia de capítulo desde el menú izquierdo. Ver la skill `crear-panel-pestanas`.

## 4. Tecnologías

- **Gráficos:** ECharts (`echarts-for-react`). El tema lo da `useChartTheme` (`src/lib/chartTheme.ts`).
- **Mapas:** Leaflet en `GeoespacialPanel`. Los polígonos vienen de `pipeline/datakmz/*.kmz`.
- **Estilos:** CSS plano con tokens en `src/index.css`. Sin framework de CSS.
- **Publicación:** Vercel (`vercel.json`) o Netlify (`netlify.toml`), con reescritura a `index.html`.

## 5. Dónde mirar antes de cambiar algo

| Quiero cambiar... | Mirar |
|---|---|
| Un número o una tabla que sale de Supabase | `frontend/src/lib/supabase.ts` |
| Datos fijos de un capítulo del Data Studio | `frontend/src/data/citrinoDataStudioData.ts` |
| Un panel | `frontend/src/components/<Nombre>Panel.tsx` |
| Qué capítulo abre qué panel | `frontend/src/App.tsx` (bloque de `activeChapter`) |
| Los títulos del menú izquierdo | `frontend/src/components/LeftAnalyticsBar.tsx` |
| Cómo se leen las columnas de las hojas | `pipeline/config.py` |
