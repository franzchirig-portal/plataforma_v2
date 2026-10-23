import { useSyncExternalStore } from 'react'

export interface ChartTheme {
  /** Texto de ejes, leyendas y etiquetas secundarias */
  muted: string
  /** Texto de énfasis (etiquetas de datos, nombres de serie) */
  text: string
  /** Líneas de la grilla (splitLine) */
  grid: string
  /** Líneas de ejes y bordes de elementos */
  axisLine: string
}

const DARK: ChartTheme = {
  muted: '#94a3b8',
  text: '#cbd5e1',
  grid: 'rgba(255,255,255,0.06)',
  axisLine: 'rgba(255,255,255,0.12)',
}

// Los textos coinciden con --text-muted / --text-secondary del tema claro (contraste AA sobre blanco)
const LIGHT: ChartTheme = {
  muted: '#475569',
  text: '#334155',
  grid: 'rgba(15,23,42,0.08)',
  axisLine: 'rgba(15,23,42,0.18)',
}

const isLight = () => document.documentElement.getAttribute('data-theme') === 'light'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/** Colores de ejes/leyendas de ECharts según el `data-theme` de <html>; re-renderiza al alternar el tema. */
export function useChartTheme(): ChartTheme {
  const light = useSyncExternalStore(subscribe, isLight, () => false)
  return light ? LIGHT : DARK
}
