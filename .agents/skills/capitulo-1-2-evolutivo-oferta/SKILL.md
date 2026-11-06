---
name: capitulo-1-2-evolutivo-oferta
description: >
  Cómo se ve el capítulo 1.2 "Evolución de la Oferta Nueva" de Citrino Intelligence: sus tres
  pestañas, cada gráfica y tabla, de dónde salen las cifras y cómo se calculan. Usar al tocar
  ese capítulo, al explicar una cifra suya o al revisar si un número está bien.
tags:
  - intelligence-platform
  - oferta-nueva
  - bolivia-market
  - echarts
---

# Capítulo 1.2: Evolución de la Oferta Nueva

## Qué pregunta responde

¿Cuánta oferta nueva de departamentos y casas hay en Santa Cruz, cuántas unidades siguen sin vender, a qué ritmo se venden y cómo se compara el precio oficial con el paralelo?

El panel no recibe la ciudad como dato: el selector de ciudad de la barra superior no cambia sus cifras. Los datos tampoco indican a qué ciudad corresponden.

## Dónde vive

- Panel: `frontend/src/components/EvolutivoOfertaPanel.tsx`. Se abre desde `frontend/src/App.tsx` cuando el capítulo activo es `1.2`.
- Datos: `frontend/src/data/citrinoDataStudioData.ts`, con tres constantes (ver sección "De dónde sale cada dato").
- Estilos: `CitrinoInstitutionalPanels.css` y `TopTabs.css` (la barra de pestañas).
- Colores de las gráficas: `frontend/src/lib/chartTheme.ts`, con el hook `useChartTheme`.

## De dónde sale cada dato

Este capítulo **no lee Supabase**. Lee un archivo fijo con cifras copiadas a mano. El origen declarado por el usuario es la base de datos de Supabase `citrino_db`, pero el código no indica qué tabla ni qué columnas se usaron. Esa trazabilidad está pendiente (ver al final).

| Constante del archivo | Qué contiene | Cuántas filas |
|---|---|---|
| `EVOLUTIVO_OFERTA_SNAPSHOTS` | Un corte de la oferta por año: proyectos, unidades, stock en US$ millones, % vendido, % por vender, meses para vender, precio por m² oficial y paralelo | 6 cortes: 2016, 2018, 2020, 2022, 2024, 2026 |
| `RITMO_VENTAS_HISTORICO_MENSUAL` | Ritmo de venta mensual, en % (el archivo no define la base del porcentaje) | 14 puntos, de feb-2021 a sep-2026 |
| `ETAPAS_COMERCIALES_EVOLUTIVO` | Proyectos, unidades y % por etapa comercial (2026) | 3 etapas |

Importante: los cortes son cada 2 años, aunque el título diga "anual".

## Pestañas

El capítulo tiene tres pestañas arriba. La primera que se abre es "Cuantificación Evolutiva de la Oferta".

### Pestaña 1: Cuantificación Evolutiva de la Oferta

Sub-selector "Ver:" con dos opciones. Se abre en **"Promedios y proporciones"**.

**Cuatro tarjetas de resumen (cifras de 2026):**

| Tarjeta | Valor | Cómo se obtiene |
|---|---|---|
| Proyectos censados activos | 117 | Campo `proyectosCensados` del corte 2026. La nota "Pico censal: 193 en 2022" está escrita a mano. |
| Unidades promedio por proyecto | 78,9 | Campo `undPromedio` del corte 2026 |
| Stock promedio por proyecto | US$ 5,84 M | Campo `stockPromedioUsd`. La nota muestra el stock total: US$ 683 M |
| Vendido vs por vender | 68% / 32% | Campos `pctVendido` y `pctPorVender`. La nota da los meses para vender el stock: 9,4 |

**Vista "Promedios y proporciones":** una tabla "Resumen anual de la oferta (2016 - 2026)" con una fila por corte. Columnas: año, proyectos, unidades totales, unidades promedio, stock total (US$ M), stock promedio (US$ M), % vendido, % por vender y meses para vender.

**Vista "Totales":** una gráfica combinada por año.
- Barras naranjas: unidades totales (eje izquierdo).
- Línea celeste: stock total en US$ millones (eje derecho).

**Bloque "Stock por vender":** un segundo sub-selector con "Unidades por vender" y "Capital por vender (US$ M)". Hoy, el selector solo cambia el título. La tabla muestra siempre las tres columnas: unidades por vender, capital por vender y % por vender.

**Bloque "Distribución por etapa comercial (2026)":**
- Gráfica de dona con los proyectos por etapa: Preventa 41 (35%), En Construcción 56 (48%), Entrega Inmediata 20 (17%).
- Tabla "Detalle de Etapas" con participación, proyectos y unidades: 3.230, 4.435 y 1.575 unidades. Suman 9.240, igual que el total del corte 2026.

### Pestaña 2: Evolutivo Precio & Ritmo de Venta

Sub-selector "Ver:" con **"Gráfico"** (por defecto) y **"Tabla"**.

**Tres tarjetas fijas (texto escrito a mano en el componente, no leído del archivo):**
- Ritmo de venta actual: 3,4% por mes (corte sep-2026).
- Mínimo histórico: 1,1% por mes (valle nov-2025).
- Ritmo promedio histórico: 2,2% por mes (feb-2021 a sep-2026).

Lectura para un analista: el 2,2% es un promedio simple de los 14 puntos. No pondera por el tiempo entre puntos, porque los meses no están espaciados igual.

**Gráfica o tabla de ritmo mensual:**
- Gráfica de línea con área verde. Eje vertical de 0% a 4,5%, con el tope fijo en el código.
- Las etiquetas del mínimo ("Valle Nov-2025") y del máximo ("Pico 2026") están escritas a mano.
- La tabla muestra periodo, ritmo y una barra que indica el nivel relativo (ritmo ÷ 4,5%).

**Gráfica de brecha cambiaria (siempre visible, debajo):**
- Línea sólida: precio por m² oficial (US$/m²), de `precioM2Oficial`.
- Línea punteada: precio por m² paralelo (US$/m²), de `precioM2Paralelo`.
- Eje de 600 a 1.500 US$/m².
- Cifras por año: en 2026 el oficial es 1.310 y el paralelo 925. Diferencia: 385 US$/m². Desde 2024 las dos líneas se separan; antes eran iguales.
- El título menciona los tipos de cambio 6,96 (oficial) y 9,90 o más (paralelo). Esos tipos de cambio no están en el archivo de datos.

### Pestaña 3: Evolutivo por Proyectos

Una tabla "Condiciones comerciales por proyecto" con un buscador. El buscador filtra por nombre o zona, sin distinguir mayúsculas.

Columnas: proyecto, zona, cuota inicial, financiamiento ofrecido, descuento al contado y ritmo de venta (unidades por mes).

**Importante:** esta tabla tiene 6 proyectos escritos a mano dentro del componente (`proyectosMuestra`). No viene de Supabase ni del archivo de datos, y no está conectada a la tabla `oferta_proyectos`.

## Cálculos y cruces

Todos los cálculos están en el componente, no en el archivo de datos:

- **Unidades por vender** = unidades totales × % por vender ÷ 100. Ejemplo 2026: 9.240 × 32% ≈ 2.957 unidades.
- **Capital por vender** (US$ M) = stock total × % por vender ÷ 100. Ejemplo 2026: 683 × 32% ≈ 219 M. El código redondea a entero.
- **Unidades promedio** y **stock promedio por proyecto** ya vienen calculados en el archivo fijo. Revisión: 9.240 ÷ 117 ≈ 78,9 y 683 ÷ 117 ≈ 5,84.
- **Cruce entre corte y etapas:** la suma de proyectos por etapa (41 + 56 + 20 = 117) y de unidades (3.230 + 4.435 + 1.575 = 9.240) coincide con el corte 2026.

No hay cruce con otras tablas de Supabase en este capítulo.

## Pendientes y datos provisionales

- **Trazabilidad:** falta indicar qué tabla y columnas de Supabase `citrino_db` alimentan estas cifras. Hasta resolverlo, las cifras son copias fijas.
- **Título "Resumen anual (2016 - 2026)":** los datos son cortes cada 2 años. Pendiente de tratar; no se ha cambiado.
- **Datos escritos a mano en el componente:** tabla de 6 proyectos, textos de las tarjetas, etiquetas de máximo y mínimo, y tope de 4,5% del eje. Si cambian las cifras del archivo, estos textos no se actualizan solos.
- **Sub-selector de stock:** solo cambia el título. Decidir si debe cambiar también la tabla.
- **Tipos de cambio:** 6,96 y 9,90 están en el título, no en los datos.
- **Ciudad:** el panel no recibe la ciudad. Falta confirmar si estas cifras son de Santa Cruz, de las tres ciudades o del total.
- **Base del ritmo de venta:** falta confirmar qué mide el porcentaje mensual (sobre el stock, sobre las unidades, u otra base).
- **Objetivo de la plataforma:** reemplazar esta presentación de Looker Studio por gráficas más potentes. Pasar del archivo fijo a la base de datos es parte de ese trabajo.
