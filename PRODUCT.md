# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Desarrolladores inmobiliarios en Bolivia (Santa Cruz, La Paz, Cochabamba) que comparan su oferta contra la competencia por zona y tipología para decidir precio, mezcla de unidades y ubicación. Trabajan principalmente en escritorio. Otras audiencias posibles (equipo interno Citrino, comités de inversión que reciben dossiers PDF, invitados en modo guest) existen en el código pero no se confirmaron como primarias.

## Product Purpose

Citrino "Intelligence" / Workspace OS: inteligencia de mercado inmobiliario para Bolivia. Organizado en 5 secciones y 13 capítulos (`1.1` a `5.1`) que cubren: Oferta Residencial Nueva y su evolución, Oferta de Particulares (Marketplace), Bienes Adjudicados y Remates Judiciales, Análisis de Demanda (Inversión y Vivienda Propia), Sistema Financiero e Indicadores ASFI, Endeudamiento Hipotecario y Ciclo Inmobiliario. Éxito: que un desarrollador o analista tome decisiones de precio, producto y financiamiento respaldadas por datos reales de mercado.

## Positioning

Datos propios de oferta nueva (márgenes, tipologías, amenidades, snapshots por proyecto), anuncios de particulares, remates judiciales, series históricas ASFI y encuestas propias de demanda y crédito hipotecario en `citrino_db`, cruzados con capas geoespaciales (KMZ/QGIS, mapas de calor y burbujas) en un solo workspace. Un competidor sin ese relevamiento propio no puede copiarlo.

## Operating Context

- Base de datos central: Supabase **`citrino_db`** (`https://ixistkrftmebvefnqqkq.supabase.co`, **41 tablas** en total):
  - **6 tablas `oferta_*`** (modelo "Diamond"): Google Sheets (3 pestañas por ciudad) → pipeline Python (`pipeline/sync.py`) → Supabase, sincronizado cada 6 h.
  - **35 tablas `anu_*`, `ind_*` y `enc_*`**: anuncios de particulares, bienes adjudicados, remates judiciales, carteras y mora ASFI, encuestas de demanda (300 hogares), encuestas de crédito hipotecario (796 prestatarios), alquileres e IPC.
- Frontend React 19 + TypeScript + Vite lee `citrino_db` directo desde el navegador (`src/lib/supabase.ts`); estilo de shell tipo Antigravity IDE (menú lateral de capítulos, pestañas superiores `TopTabBar`, `FilterBar` inferior, paneles laterales de Análisis y Asistente AI).
- Filtro de ciudad transversal en todos los capítulos: Santa Cruz (`SCZ`), La Paz (`LPZ`), Cochabamba (`CBB`) o consolidado nacional (`ALL`).
- Reportes se imprimen a PDF en formato A4 para juntas directivas.

## Capabilities and Constraints

- 5 secciones y 13 capítulos (`1.1` a `5.1`): Censo de Oferta Nueva (con 8 vistas: Resumen, Stock, Ritmo, Producto, Comparador, Proyectos, Tipologías y Mapa GIS), Evolución de Oferta, Marketplace de Particulares, Bienes Adjudicados y Remates, Demanda (Composición, Inversión, Vivienda Propia), Sistema Financiero y Mora ASFI, Endeudamiento Hipotecario (Perfil, Cartera, Perspectivas) y Ciclo Inmobiliario.
- Acceso por Supabase Auth o modo invitado ("Acceso Rápido").
- UI y copy en español; moneda de referencia USD.
- Sin suite de tests automatizados; el build (`tsc -b && vite build`) verifica tipos estrictamente y falla ante cualquier error de TypeScript.

## Brand Commitments

Nombre Citrino. Tema claro u oscuro persistido en `localStorage` (`citrino_theme_v2`), siguiendo por defecto la preferencia del sistema operativo (`prefers-color-scheme`) cuando el usuario no ha elegido uno. Estética de shell tipo Antigravity IDE adoptada en el producto.

## Evidence on Hand

Datos reales en las 41 tablas de Supabase (`citrino_db`) y polígonos en `datakmz/`. Guía operativa en `docs/WORKSPACE_OS_GUIDE.md`. No hay testimonios, casos de éxito ni métricas de uso documentados; no inventarlos.

## Product Principles

1. El dato manda: cada cifra debe ser trazable a un proyecto, zona, encuesta o corte en `citrino_db`.
2. Comparar es la acción central: todo flujo debe facilitar contrastar ciudades, proyectos, zonas y tipologías.
3. Del análisis al documento: lo visto en pantalla debe poder exportarse limpio para comités y desarrolladores.
4. Escaneable en escritorio, denso pero legible.

## Accessibility & Inclusion

Sin estándar formal confirmado. Interfaz en español; debe funcionar bien en escritorio en tema claro y oscuro.
