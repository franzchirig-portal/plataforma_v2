---
name: plataforma_v2
description: >
  Mapa completo de la plataforma Citrino Intelligence (Bolivia): cada área de la pantalla,
  cada capítulo y pestaña con su archivo, de dónde sale cada dato (base de datos o archivo
  fijo) y qué partes son provisionales. Usar al empezar cualquier cambio para ubicarse.
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

Plataforma de inteligencia de mercado inmobiliario en Bolivia. Ciudades: Santa Cruz (`SCZ`), La Paz (`LPZ`) y Cochabamba (`CBB`).

Fuente de verdad: `CLAUDE.md` en la raíz del repositorio y el código. Si esta guía contradice al código, manda el código.

## 1. Dos mitades conectadas solo por la base de datos

| Mitad | Carpeta | Qué hace |
|---|---|---|
| Pipeline de datos | `pipeline/` | Lee Google Sheets, limpia y carga en Supabase (Python). Corre cada 6 horas en GitHub Actions. |
| Dashboard | `frontend/` | React 19 + TypeScript + Vite. Lee Supabase directamente desde el navegador. |

Para cambiar la carga de datos, ver la skill `sheets-supabase-pipeline`.

## 2. Pantalla: qué hay en cada zona

- **Barra superior:** selector de ciudad (Santa Cruz, La Paz, Cochabamba, Bolivia), selector de periodo (fechas de corte), selector de moneda (USD; Bs aparece como "Próximamente"), botones "Análisis y Diagnóstico" (panel derecho) y "Asistente AI" (panel derecho), y acceso de usuario.
- **Menú izquierdo (`LeftAnalyticsBar`):** 5 secciones con 13 capítulos. Elegir un capítulo cambia todo el centro de la pantalla.
- **Barra de pestañas (`SubHeader`):** aparece solo en el capítulo 1.1. Tiene 8 pestañas (ver sección 3).
- **Filtros inferiores (`FilterBar`):** zona, subzona, tipo de inmueble, etapa, tipología y periodo. Vienen de Supabase.
- **Centro:** el panel del capítulo elegido.
- **Panel derecho:** "Asistente AI" (`ChatPanel`) y "Análisis y Diagnóstico" (`AnalysisPanel`). Se abren y cierran desde la barra superior.
- **Acceso:** inicio de sesión con correo (Supabase Auth) o "Acceso Rápido" en modo invitado.
- **Tema:** claro u oscuro. Se guarda en el navegador con la clave `citrino_theme_v2`. Sin selección guardada, sigue el sistema.

## 3. Capítulos y pestañas

### Capítulo 1.1 (barra de pestañas superior, 8 pestañas)

| Pestaña | Componente | Fuente de datos |
|---|---|---|
| Resumen General | `WorkspacePanel` | Supabase |
| Stock en Ventas | `WorkspacePanel` | Supabase |
| Ritmo de Ventas | `WorkspacePanel` | Supabase |
| Análisis de Producto | `AnalisisProductoPanel` | Supabase |
| Comparación de Proyectos | `ComparacionProyectosPanel` | Supabase |
| Proyectos | `WorkspacePanel` | Supabase |
| Tipologías | `TipologiasPanel` | Supabase |
| Mapa | `GeoespacialPanel` (Leaflet) | Supabase |

Nota: el código tiene pestañas internas adicionales (Stock en USD, Meses de Stock y Mercado) que usan `WorkspacePanel` y no aparecen en la barra.

### Capítulos 1.2 a 5.1 (menú izquierdo)

| Capítulo | Componente | Fuente de datos |
|---|---|---|
| 1.2 Evolución de la Oferta Nueva | `EvolutivoOfertaPanel` | Archivo fijo |
| 1.3 Oferta de Particulares (Marketplace) | `MarketplaceParticularesPanel` | Archivo fijo |
| 1.4 Bienes Adjudicados y Remates | `BienesAdjudicadosPanel` | Archivo fijo |
| 2.1 Composición Económica y Voluntad de Compra | `AnalisisDemandaPanel` | Archivo fijo |
| 2.2 Compra como Inversión | `AnalisisDemandaPanel` | Archivo fijo |
| 2.3 Compra Vivienda Propia | `AnalisisDemandaPanel` | Archivo fijo |
| 3.1 Financiamiento al Sector Inmobiliario | `SistemaFinancieroPanel` | Archivo fijo |
| 3.2 Evolución de la Mora del Inmobiliario | `SistemaFinancieroPanel` | Archivo fijo |
| 4.1 Perfil del Consumidor de Crédito | `EndeudamientoHipotecarioPanel` | Archivo fijo |
| 4.2 Estado de la Cartera Hipotecaria | `EndeudamientoHipotecarioPanel` | Archivo fijo |
| 4.3 Perspectivas del Comprador | `EndeudamientoHipotecarioPanel` | Archivo fijo |
| 5.1 Ciclo Inmobiliario Físico | `CicloInmobiliarioPanel` | Archivo fijo |

Cada uno de estos paneles muestra sus pestañas arriba con el componente `TopTabBar` (ver la skill `crear-panel-pestanas`).

Detalle por capítulo: el capítulo 1.2 ya tiene su propia skill, `capitulo-1-2-evolutivo-oferta`, con sus gráficas, sus cifras y sus cálculos. Para los demás capítulos, este mapa es el único índice por ahora.

### Otros paneles

- **Hipotecario:** `HipotecarioPanel`. Hoy es un aviso de "Próximamente", sin datos.
- **Dossier de capítulo:** `ChapterDossierPanel`. Texto fijo por capítulo, guardado en `CHAPTER_REGISTRY` dentro del mismo archivo.

## 4. De dónde sale cada dato

- **Base de datos (Supabase):** seis tablas `oferta_*` cargadas por el pipeline:
  - `oferta_proyectos`
  - `oferta_indicadores_censo`
  - `oferta_tipologias`
  - `oferta_avg_tipologias`
  - `oferta_condiciones_financieras`
  - `oferta_amenidades`

  Todas las consultas están en `frontend/src/lib/supabase.ts`. Ahí también están los tipos y los cálculos de métricas.
- **Archivo fijo:** `frontend/src/data/citrinoDataStudioData.ts`. Datos de los capítulos 1.2 a 5.1. No se actualizan solos: cambiarlos es editar ese archivo.
- **Asistente AI:** responde con reglas programadas que consultan los datos de Supabase. En el código no hay conexión a un modelo de IA externo.

Los nombres y el orden de carga de las tablas están en `pipeline/config.py` (`DIAMOND_TABLES`) y en `supabase/00*.sql`.

## 5. Tecnologías

- **Gráficos:** ECharts (`echarts-for-react`). Colores del tema en `frontend/src/lib/chartTheme.ts`.
- **Mapas:** Leaflet en `GeoespacialPanel`. Polígonos de zonas en `pipeline/datakmz/*.kmz`.
- **Estilos:** CSS plano con tokens de color y tamaños en `frontend/src/index.css`. Sin framework de CSS.
- **Publicación:** Vercel (`vercel.json`) o Netlify (`netlify.toml`), con reescritura a `index.html`.

## 6. Pendientes conocidos

- Dashboard del capítulo 1.1 y Mapa, Tipologías, Análisis de Producto y Comparación todavía usan palabras técnicas en pantalla.
- Hipotecario sin datos.
- Capítulo 3.1, pestaña "La Construcción y su Financiamiento": sin serie histórica cargada.
- Bolivianos (Bs) en el selector de moneda: sin datos.

## 7. Dónde mirar antes de cambiar algo

| Quiero cambiar... | Mirar |
|---|---|
| Un número que sale de Supabase | `frontend/src/lib/supabase.ts` |
| Un dato fijo de un capítulo 1.2 a 5.1 | `frontend/src/data/citrinoDataStudioData.ts` |
| El contenido de un panel | `frontend/src/components/<Nombre>Panel.tsx` |
| Qué capítulo abre qué panel | `frontend/src/App.tsx` (bloque de `activeChapter`) |
| Los títulos del menú izquierdo | `frontend/src/components/LeftAnalyticsBar.tsx` |
| Las pestañas del capítulo 1.1 | `frontend/src/components/SubHeader.tsx` |
| Los filtros | `frontend/src/components/FilterBar.tsx` |
| El Asistente AI | `frontend/src/components/ChatPanel.tsx` |
| Cómo se leen las columnas de las hojas | `pipeline/config.py` |
