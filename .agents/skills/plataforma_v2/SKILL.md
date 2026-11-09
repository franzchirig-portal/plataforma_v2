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
| 1.2 Evolución de la Oferta Nueva | `EvolutivoOfertaPanel` | Supabase (`oferta_proyectos`, `oferta_indicadores_censo`, `oferta_avg_tipologias`, `oferta_condiciones_financieras`) |
| 1.3 Oferta de Particulares (Marketplace) | `MarketplaceParticularesPanel` | Supabase (`ind_oferta_inmuebles` — 6.761 anuncios, `anu_*`) |
| 1.4 Bienes Adjudicados y Remates | `BienesAdjudicadosPanel` | Supabase (`ind_bienes_adjudicados` — 158 cortes, `ind_remates_judiciales` — 11.575 remates) |
| 2.1 Composición Económica y Voluntad de Compra | `AnalisisDemandaPanel` | Supabase (`enc_encuestados` — 300 hogares, `enc_perfil_intencion` — 300 filas) |
| 2.2 Compra como Inversión | `AnalisisDemandaPanel` | Supabase (`enc_inversion` — 153 encuestados) |
| 2.3 Compra Vivienda Propia | `AnalisisDemandaPanel` | Supabase (`enc_vivienda` — 147 filas y 5 tablas `enc_vivienda_*`) |
| 3.1 Financiamiento al Sector Inmobiliario | `SistemaFinancieroPanel` | Supabase (`ind_consolidado_hipotecaria_vivienda` — 422 filas, `ind_consolidado_credito_construccion` — 160 filas) |
| 3.2 Evolución de la Mora del Inmobiliario | `SistemaFinancieroPanel` | Supabase (`ind_mora_hipotecaria_bancos` — 1.722 filas, `ind_cartera_construccion` — 196 filas) |
| 4.1 Perfil del Consumidor de Crédito | `EndeudamientoHipotecarioPanel` | Supabase (`enc_credito_encuestados` y `enc_credito_perfil_consumidor` — 796 prestatarios) |
| 4.2 Estado de la Cartera Hipotecaria | `EndeudamientoHipotecarioPanel` | Supabase (`enc_credito_hipotecario` — 796 filas, `enc_credito_creditos_adicionales` — 490 filas) |
| 4.3 Perspectivas del Comprador | `EndeudamientoHipotecarioPanel` | Supabase (`enc_credito_*` con respaldo en archivo fijo para preguntas de percepción) |
| 5.1 Ciclo Inmobiliario Físico | `CicloInmobiliarioPanel` | Supabase (`ind_alquileres` — 315 cortes, `ind_ipc` — 105 cortes) |

Cada uno de estos paneles muestra sus pestañas arriba con el componente `TopTabBar` (ver la skill `crear-panel-pestanas`).

### Otros paneles

- **Hipotecario:** `HipotecarioPanel`. Hoy es un aviso de "Próximamente", sin datos.
- **Dossier de capítulo:** `ChapterDossierPanel`. Texto fijo por capítulo, guardado en `CHAPTER_REGISTRY` dentro del mismo archivo.

## 4. De dónde sale cada dato (Base de datos `citrino_db`)

Toda la plataforma se conecta al proyecto de Supabase **`citrino_db`** (`https://ixistkrftmebvefnqqkq.supabase.co`), que contiene **33 tablas** organizadas en cuatro grupos:

1. **Oferta Nueva — 6 tablas `oferta_*`** (sincronizadas desde Google Sheets por `pipeline/sync.py`, alimentan los Capítulos 1.1 y 1.2):
   - `oferta_proyectos`
   - `oferta_indicadores_censo`
   - `oferta_tipologias`
   - `oferta_avg_tipologias`
   - `oferta_condiciones_financieras`
   - `oferta_amenidades`
2. **Oferta de Particulares — 3 tablas `anu_*` + `ind_oferta_inmuebles`** (alimentan el Capítulo 1.3):
   - `ind_oferta_inmuebles` (6.761 anuncios de reventa/particulares)
   - `anu_anuncios`, `anu_anuncio_rentabilidad`, `anu_tc_diario`
3. **Indicadores Macroeconómicos, ASFI y Ciclo — 11 tablas `ind_*`** (alimentan los Capítulos 1.4, 3.1, 3.2 y 5.1):
   - `ind_bienes_adjudicados`, `ind_remates_judiciales` (Cap. 1.4)
   - `ind_consolidado_carteras`, `ind_consolidado_hipotecaria_vivienda`, `ind_consolidado_credito_construccion`, `ind_cartera_construccion`, `ind_mora_hipotecaria_bancos` (Cap. 3.1 y 3.2)
   - `ind_alquileres`, `ind_ipc`, `ind_precios_latam` (Cap. 5.1)
4. **Encuestas de Demanda y Endeudamiento Hipotecario — 21 tablas `enc_*`** (alimentan los Capítulos 2.1–2.3 y 4.1–4.3):
   - Demanda (300 hogares): `enc_encuestados`, `enc_perfil_intencion`, `enc_inversion`, `enc_inversion_aspectos_decision`, `enc_inversion_zonas`, `enc_inversion_factores_zona`, `enc_inversion_amenidades`, `enc_vivienda`, `enc_vivienda_aspectos_decision`, `enc_vivienda_zonas`, `enc_vivienda_factores_zona`, `enc_vivienda_amenidades`, `enc_vivienda_casa_aspectos`, `enc_vivienda_depto_aspectos`, `enc_vivienda_detalle_casa`, `enc_vivienda_detalle_depto`
   - Crédito Hipotecario (796 prestatarios): `enc_credito_encuestados`, `enc_credito_perfil_consumidor`, `enc_credito_hipotecario`, `enc_credito_creditos_adicionales`, `enc_credito_percepcion_mercado`

- **Capa de consulta:** Todas las consultas a `citrino_db` están en `frontend/src/lib/supabase.ts` (`fetchIndicadores`, `fetchAllAvgTipologias`, `fetchAllCondicionesFinancieras`, `fetchMarketplaceLive`, `fetchBienesAdjudicadosLive`, `fetchDemandaLive`, `fetchSistemaFinancieroLive`, `fetchEndeudamientoLive`, `fetchCicloInmobiliarioLive`).
- **Archivo de respaldo:** `frontend/src/data/citrinoDataStudioData.ts` sirve únicamente como respaldo estático en caso de que alguna sub-pregunta histórica no tenga filas en `citrino_db`.
- **Asistente AI:** responde con reglas programadas que consultan los datos de `citrino_db` en Supabase. En el código no hay conexión a un modelo de IA externo.

Las políticas de lectura pública (`anon`) para las 41 tablas de `citrino_db` están en `supabase/002_rls_public_read.sql`.

## 5. Tecnologías

- **Gráficos:** ECharts (`echarts-for-react`). Colores del tema en `frontend/src/lib/chartTheme.ts`.
- **Mapas:** Leaflet en `GeoespacialPanel`. Polígonos de zonas en `pipeline/datakmz/*.kmz`.
- **Estilos:** CSS plano con tokens de color y tamaños en `frontend/src/index.css`. Sin framework de CSS.
- **Publicación:** Vercel (`vercel.json`) o Netlify (`netlify.toml`), con reescritura a `index.html`.

## 6. Pendientes conocidos

- Dashboard del capítulo 1.1 y Mapa, Tipologías, Análisis de Producto y Comparación todavía usan algunas palabras técnicas en pantalla.
- Hipotecario (`HipotecarioPanel`) sin datos.
- Bolivianos (Bs) en el selector de moneda: sin datos.
- Tablas `anu_anuncios`, `anu_anuncio_rentabilidad`, `anu_tc_diario` e `ind_precios_latam` creadas en `citrino_db` pero actualmente con 0 filas (Cap. 1.3 usa `ind_oferta_inmuebles` que sí tiene 6.761 filas).

## 7. Dónde mirar antes de cambiar algo

| Quiero cambiar... | Mirar |
|---|---|
| Un número o consulta que sale de `citrino_db` (Supabase) | `frontend/src/lib/supabase.ts` |
| Un dato de respaldo estático | `frontend/src/data/citrinoDataStudioData.ts` |
| El contenido de un panel | `frontend/src/components/<Nombre>Panel.tsx` |
| Qué capítulo abre qué panel | `frontend/src/App.tsx` (bloque de `activeChapter`) |
| Los títulos del menú izquierdo | `frontend/src/components/LeftAnalyticsBar.tsx` |
| Las pestañas del capítulo 1.1 | `frontend/src/components/SubHeader.tsx` |
| Los filtros | `frontend/src/components/FilterBar.tsx` |
| El Asistente AI | `frontend/src/components/ChatPanel.tsx` |
| Cómo se leen las columnas de las hojas | `pipeline/config.py` |
