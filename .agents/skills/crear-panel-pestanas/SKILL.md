---
name: crear-panel-pestanas
description: >
  Cómo crear o ajustar un panel de la plataforma con pestañas superiores (mismo estilo
  que la barra principal), sin encabezado, con colores del tema y tamaños de letra fijos.
  Usar al agregar un capítulo, rediseñar un panel o mover contenido entre pestañas.
tags:
  - frontend
  - react
  - layout
  - ui-standard
---

# Crear o ajustar un panel con pestañas superiores

## Regla base

Cada panel de capítulo empieza con la barra de pestañas. No lleva encabezado (sin "Módulo", sin título grande, sin subtítulo, sin "badge" de muestra).

## Pasos

1. **Leer el panel actual.** Anotar cada bloque: KPI, gráfico, tabla y sub-selector (pills).
2. **Definir las pestañas con el nombre que pidió el usuario.** Si el usuario no da nombres, pedirlos antes de escribir código.
3. **Agrupar el contenido por pestaña.** Un gráfico o tabla va en una sola pestaña. Si una sección tiene dos bloques, separarlos en dos pestañas. No duplicar código: mover el JSX existente.
4. **Usar el componente común.** Importar `TopTabBar` desde `src/components/TopTabBar.tsx`:

```tsx
import TopTabBar from './TopTabBar'

<TopTabBar
  tabs={[
    { label: 'Nombre de la pestaña', active: tab === 'uno', onClick: () => setTab('uno') },
    { label: 'Otra pestaña', active: tab === 'dos', onClick: () => setTab('dos') },
  ]}
/>
```

5. **Estado de la pestaña.** Un `useState` por panel. Si el panel sirve a varios capítulos (por ejemplo 2.1, 2.2 y 2.3), mostrar la barra solo para el capítulo activo: `{activeChapter === '2.1' && <TopTabBar ... />}`.
6. **Quitar los botones de capítulo internos.** La navegación entre capítulos la hace el menú izquierdo (`LeftAnalyticsBar`). El estado de capítulo pasa a ser solo lectura (`const [activeChapter] = useState(initialChapter)`).
7. **Quitar filas de pestañas repetidas.** Si una fila de sub-botones repite lo que ya hace la barra superior, borrarla.
8. **Textos en lenguaje de negocio.** Seguir la skill `textos-para-analista`.

## Estilos: qué sí y qué no

- Usar tokens de color (`var(--text-muted)`, `var(--citrino-sky)`) y no colores fijos nuevos. La barra usa `#002857` a propósito: es igual a la barra principal.
- Tamaños de letra: solo 11, 13, 16 y 22 px, en CSS con `var(--fs-etiqueta|cuerpo|subtitulo|titulo)`. Dentro de ECharts, números directos (11, 13, 16, 22).
- Los estilos de la barra están en `TopTabs.css`. No duplicarlos en otro archivo.
- Margen negativo de la barra: `-18px -24px 16px` en escritorio y `-12px -14px 16px` en móvil (≤ 900px). Ya está en `TopTabs.css`.

## Revisión antes de entregar

- [ ] No queda ningún `citrino-panel-header` ni `citrino-nav-pills` en el panel.
- [ ] Cada pestaña muestra su contenido y la pestaña inicial es la primera de la lista (o la que pidió el usuario).
- [ ] En móvil (375 px) no hay scroll horizontal: revisar `document.documentElement.scrollWidth - innerWidth` = 0.
- [ ] Gráficos legibles en tema claro y oscuro.
- [ ] `npm run build` y `npm run lint` pasan en `frontend/`.

## Errores comunes

- Dejar un `setActiveChapter` sin usar: el build avisa. Cambiarlo por `const [activeChapter] = useState(...)`.
- Olvidar importar `TopTabBar`: el build falla con "not defined".
- Pestaña sin contenido: si un dato no existe, mostrar un aviso claro en la pestaña y decirlo al usuario. No inventar datos.
