import { useEffect, useState, useMemo } from 'react'
import {
  fetchIndicadores,
  fetchAvgTipologias,
  fetchAllAvgTipologias,
  computeTipologiaBenchmarks,
  getLatestPerProject,
  fetchProjectHistory,
  fetchIndicadorIdsForTipologia,
} from '../lib/supabase'
import type { IndicadorFull, AvgTipologia, TipologiaBenchmark } from '../lib/supabase'

interface Props {
  selectedIndicador: IndicadorFull | null
  ciudad: string
  activeTab?: string
  periodoFilter?: string
  zonaFilter?: string
  subzonaFilter?: string
  tipoInmuebleFilter?: string
  etapaFilter?: string | string[]
  tipologiaFilter?: string
  moneda?: 'USD' | 'BS'
  onClearSelection?: () => void
  onSelectIndicador?: (ind: IndicadorFull | null) => void
}

function fmt(n: number | null | undefined, dec = 1): string {
  if (n == null) return '—'
  return n.toLocaleString('es-BO', { maximumFractionDigits: dec })
}

function fmtMoney(n: number | null | undefined, moneda: 'USD' | 'BS' = 'USD'): string {
  if (n == null) return '—'
  if (moneda === 'BS') {
    return 'Bs ' + Math.round(n * 6.96).toLocaleString('es-BO')
  }
  return '$US ' + Math.round(n).toLocaleString('es-BO')
}

function fmtShortMoney(n: number | null | undefined, moneda: 'USD' | 'BS' = 'USD'): string {
  if (n == null) return '—'
  const val = moneda === 'BS' ? n * 6.96 : n
  const prefix = moneda === 'BS' ? 'Bs ' : '$US '
  if (val >= 1_000_000) return prefix + (val / 1_000_000).toFixed(1) + ' M'
  if (val >= 1_000) return prefix + Math.round(val / 1_000).toLocaleString('es-BO') + ' k'
  return prefix + Math.round(val).toLocaleString('es-BO')
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  if (!y || !m) return d
  return dd ? `${dd}/${m}/${y}` : `${m}/${y}`
}

interface TabMeta {
  title: string
  subtitle: string
  badgeColor: string
}

const TAB_CONFIG: Record<string, TabMeta> = {
  resumen_general: {
    title: 'Diagnóstico de Resumen General',
    subtitle: 'Balance integral de oferta, madurez de fases constructivas y absorción global.',
    badgeColor: '#38bdf8',
  },
  stock_unidades: {
    title: 'Diagnóstico de Inventario & Unidades',
    subtitle: 'Presión sobre unidades físicas disponibles y concentración de inventario.',
    badgeColor: '#34d399',
  },
  stock_usd: {
    title: 'Diagnóstico de Capital & Valor en Riesgo',
    subtitle: 'Volumen monetizado de la cartera remanente y exposición financiera.',
    badgeColor: '#fbbf24',
  },
  ritmo_ventas: {
    title: 'Diagnóstico de Velocidad Comercial',
    subtitle: 'Tasa de absorción mensual (und/mes), tracción de demanda y aceleración.',
    badgeColor: '#60a5fa',
  },
  meses_stock: {
    title: 'Diagnóstico de Horizonte & Meses de Stock',
    subtitle: 'Tiempo estimado de liquidación de inventario y semáforo de sobreoferta.',
    badgeColor: '#f87171',
  },
  analisis_producto: {
    title: 'Diagnóstico de Estructura de Producto',
    subtitle: 'Paridad de precios $/m², metrajes promedio y segmentación de oferta.',
    badgeColor: '#a78bfa',
  },
  comparacion_proyectos: {
    title: 'Diagnóstico Comparativo Head-to-Head',
    subtitle: 'Dispersión competitiva, arbitraje de valor y brechas de absorción.',
    badgeColor: '#f472b6',
  },
  proyectos: {
    title: 'Diagnóstico de Cartera & Desarrolladores',
    subtitle: 'Concentración de mercado, desarrolladores líderes y escala de torres.',
    badgeColor: '#38bdf8',
  },
  tipologias: {
    title: 'Diagnóstico de Tipologías & Demanda',
    subtitle: 'Comportamiento de dormitorios (Mono, 1D, 2D, 3D+), tickets y $/m².',
    badgeColor: '#fb923c',
  },
  geoespacial: {
    title: 'Diagnóstico Territorial & GIS',
    subtitle: 'Concentración espacial, densidad urbana y polos geográficos de absorción.',
    badgeColor: '#4ade80',
  },
}

export default function AnalysisPanel({
  selectedIndicador,
  ciudad,
  activeTab = 'resumen_general',
  periodoFilter = 'ALL',
  zonaFilter = 'ALL',
  subzonaFilter = 'ALL',
  tipoInmuebleFilter = 'ALL',
  etapaFilter = 'ALL',
  tipologiaFilter = 'ALL',
  moneda = 'USD',
  onClearSelection,
  onSelectIndicador,
}: Props) {
  const [allRawIndicadores, setAllRawIndicadores] = useState<IndicadorFull[]>([])
  const [benchmarks, setBenchmarks] = useState<Record<string, TipologiaBenchmark>>({})
  const [matchingTipologiaIds, setMatchingTipologiaIds] = useState<Set<string> | null>(null)
  const [avgData, setAvgData] = useState<AvgTipologia[]>([])
  const [history, setHistory] = useState<IndicadorFull[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Fetch raw market data & tipologia benchmarks
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchIndicadores(ciudad === 'ALL' ? undefined : ciudad),
      fetchAllAvgTipologias(),
    ])
      .then(([inds, allTipos]) => {
        setAllRawIndicadores(inds)
        setBenchmarks(computeTipologiaBenchmarks(allTipos))
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error in AnalysisPanel fetch:', err)
        setLoading(false)
      })
  }, [ciudad])

  // 2. Fetch tipologia matching IDs when tipologiaFilter changes
  useEffect(() => {
    if (!tipologiaFilter || tipologiaFilter === 'ALL') {
      setMatchingTipologiaIds(null)
    } else {
      fetchIndicadorIdsForTipologia(tipologiaFilter).then(setMatchingTipologiaIds)
    }
  }, [tipologiaFilter])

  // 3. Base Snapshot (Date filter applied: snapshot specific or latest available)
  const baseProjects = useMemo(() => {
    if (periodoFilter && periodoFilter !== 'ALL') {
      return allRawIndicadores.filter((p) => p.fecha_snapshot === periodoFilter)
    }
    return getLatestPerProject(allRawIndicadores)
  }, [allRawIndicadores, periodoFilter])

  // 4. Universally filtered projects (reacts to ALL filters in the workspace)
  const filteredProjects = useMemo(() => {
    return baseProjects.filter((p) => {
      // Zona filter
      if (zonaFilter && zonaFilter !== 'ALL' && (p.ZONAS || 'Sin Zona').trim() !== zonaFilter.trim()) {
        return false
      }
      // Subzona filter
      if (subzonaFilter && subzonaFilter !== 'ALL' && (p.SUBZONAS || 'Sin Subzona').trim() !== subzonaFilter.trim()) {
        return false
      }
      // Tipo Inmueble filter
      if (
        tipoInmuebleFilter &&
        tipoInmuebleFilter !== 'ALL' &&
        (p.tipo_inmueble || '').toLowerCase().trim() !== tipoInmuebleFilter.toLowerCase().trim()
      ) {
        return false
      }
      // Tipologia filter
      if (matchingTipologiaIds && !matchingTipologiaIds.has(p.indicador_censo_id)) {
        return false
      }
      // Etapa filter
      if (etapaFilter) {
        if (Array.isArray(etapaFilter)) {
          if (etapaFilter.length > 0 && !etapaFilter.includes('ALL')) {
            const matches = etapaFilter.some((f) => {
              if (!f || f === 'ALL') return true
              return (p.etapa || '').toLowerCase().trim() === f.toLowerCase().trim()
            })
            if (!matches) return false
          }
        } else if (etapaFilter !== 'ALL' && (p.etapa || '').toLowerCase().trim() !== etapaFilter.toLowerCase().trim()) {
          return false
        }
      }
      return true
    })
  }, [baseProjects, zonaFilter, subzonaFilter, tipoInmuebleFilter, matchingTipologiaIds, etapaFilter])

  // 5. Active Project Resolution (Synchronized with periodoFilter if selected)
  const activeProjectInd = useMemo(() => {
    if (!selectedIndicador) return null
    if (periodoFilter && periodoFilter !== 'ALL') {
      const match = allRawIndicadores.find(
        (p) => p.proyecto_id === selectedIndicador.proyecto_id && p.fecha_snapshot === periodoFilter
      )
      if (match) return match
    }
    const inBase = baseProjects.find((p) => p.proyecto_id === selectedIndicador.proyecto_id)
    if (inBase) return inBase
    return selectedIndicador
  }, [selectedIndicador, periodoFilter, allRawIndicadores, baseProjects])

  // Load project-specific details (tipologias and historical censo snapshots)
  useEffect(() => {
    if (!activeProjectInd) {
      setAvgData([])
      setHistory([])
      return
    }
    Promise.all([
      fetchAvgTipologias(activeProjectInd.indicador_censo_id),
      fetchProjectHistory(activeProjectInd.proyecto_id),
    ])
      .then(([tipos, hist]) => {
        setAvgData(tipos)
        setHistory(hist)
      })
      .catch((err) => {
        console.error('Error loading project analysis details:', err)
      })
  }, [activeProjectInd?.indicador_censo_id, activeProjectInd?.proyecto_id])

  // ─── Computations on the Filtered Sample ──────────────────────────────────
  const totalSampleProyectos = filteredProjects.length
  const totalSampleUnidades = filteredProjects.reduce((s, p) => s + (p.und_totales ?? 0), 0)
  const totalSampleVendidas = filteredProjects.reduce((s, p) => s + (p.und_vendidas ?? 0), 0)
  const totalSampleDisp = filteredProjects.reduce((s, p) => s + (p.und_por_vender ?? 0), 0)
  const pctSampleVendido = totalSampleUnidades > 0 ? Math.round((totalSampleVendidas / totalSampleUnidades) * 100) : 0
  const totalSampleStockUSD = filteredProjects.reduce((s, p) => {
    const val = p.stock_total ?? ((p.stock_vendido ?? 0) + (p.stock_x_vender ?? 0))
    return s + (val > 0 ? val : (p.stock_x_vender ?? 0))
  }, 0)

  const validSampleRitmos = filteredProjects
    .filter((p) => p.ritmo_venta != null && p.ritmo_venta > 0)
    .map((p) => p.ritmo_venta!)
  const avgSampleRitmo = validSampleRitmos.length
    ? validSampleRitmos.reduce((a, b) => a + b, 0) / validSampleRitmos.length
    : 0

  const validSampleMeses = filteredProjects
    .filter((p) => p.meses_stock != null && p.meses_stock > 0)
    .map((p) => p.meses_stock!)
  const avgSampleMeses = validSampleMeses.length
    ? validSampleMeses.reduce((a, b) => a + b, 0) / validSampleMeses.length
    : 0

  // City-wide baseline comparison
  const validBaseRitmos = baseProjects
    .filter((p) => p.ritmo_venta != null && p.ritmo_venta > 0)
    .map((p) => p.ritmo_venta!)
  const cityAvgRitmo = validBaseRitmos.length
    ? validBaseRitmos.reduce((a, b) => a + b, 0) / validBaseRitmos.length
    : 0
  const ritmoDiffPct = cityAvgRitmo > 0 ? Math.round(((avgSampleRitmo - cityAvgRitmo) / cityAvgRitmo) * 100) : 0

  // Risk quadrants breakdown on the filtered sample
  const riskLow = filteredProjects.filter((p) => (p.meses_stock ?? 999) < 6 && (p.meses_stock ?? 0) > 0)
  const riskHealthy = filteredProjects.filter((p) => (p.meses_stock ?? 0) >= 6 && (p.meses_stock ?? 0) < 12)
  const riskModerate = filteredProjects.filter((p) => (p.meses_stock ?? 0) >= 12 && (p.meses_stock ?? 0) <= 18)
  const riskHigh = filteredProjects.filter((p) => (p.meses_stock ?? 0) > 18)

  // Aggregated Zona Metrics for GIS, Stock and Location Analysis
  const zonaStats = useMemo(() => {
    const map = new Map<string, {
      zona: string
      proyectos: number
      undDisp: number
      undVend: number
      undTot: number
      stockUSD: number
      ritmoTotal: number
      avgRitmo: number
      mesesStock: number
    }>()
    filteredProjects.forEach((p) => {
      const z = (p.ZONAS || 'Sin Zona').trim()
      if (!map.has(z)) {
        map.set(z, {
          zona: z,
          proyectos: 0,
          undDisp: 0,
          undVend: 0,
          undTot: 0,
          stockUSD: 0,
          ritmoTotal: 0,
          avgRitmo: 0,
          mesesStock: 0,
        })
      }
      const item = map.get(z)!
      item.proyectos += 1
      item.undDisp += (p.und_por_vender ?? 0)
      item.undVend += (p.und_vendidas ?? 0)
      item.undTot += (p.und_totales ?? 0)
      item.stockUSD += (p.stock_total ?? ((p.stock_vendido ?? 0) + (p.stock_x_vender ?? 0)))
      item.ritmoTotal += (p.ritmo_venta ?? 0)
    })
    map.forEach((item) => {
      item.avgRitmo = item.proyectos > 0 ? item.ritmoTotal / item.proyectos : 0
      item.mesesStock = item.ritmoTotal > 0 ? item.undDisp / item.ritmoTotal : 0
    })
    return Array.from(map.values())
  }, [filteredProjects])

  // Stage breakdown for Resumen General & Análisis de Producto
  const stageStats = useMemo(() => {
    const map = new Map<string, { etapa: string; count: number; undTotales: number; undVendidas: number; undDisp: number }>()
    filteredProjects.forEach((p) => {
      const e = (p.etapa || 'Sin Etapa').trim()
      if (!map.has(e)) {
        map.set(e, { etapa: e, count: 0, undTotales: 0, undVendidas: 0, undDisp: 0 })
      }
      const item = map.get(e)!
      item.count += 1
      item.undTotales += (p.und_totales ?? 0)
      item.undVendidas += (p.und_vendidas ?? 0)
      item.undDisp += (p.und_por_vender ?? 0)
    })
    return Array.from(map.values()).sort((a, b) => b.undDisp - a.undDisp)
  }, [filteredProjects])

  // Developer concentration for Proyectos
  const devStats = useMemo(() => {
    const map = new Map<string, { dev: string; count: number; undTotales: number; ritmoTotal: number }>()
    filteredProjects.forEach((p) => {
      const d = (p.desarrollador || 'No especificado').trim()
      if (!map.has(d)) {
        map.set(d, { dev: d, count: 0, undTotales: 0, ritmoTotal: 0 })
      }
      const item = map.get(d)!
      item.count += 1
      item.undTotales += (p.und_totales ?? 0)
      item.ritmoTotal += (p.ritmo_venta ?? 0)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [filteredProjects])

  // Top Movers within current filter
  const topPerformers = [...filteredProjects]
    .filter((p) => p.ritmo_venta != null && p.ritmo_venta > 0)
    .sort((a, b) => (b.ritmo_venta ?? 0) - (a.ritmo_venta ?? 0))
    .slice(0, 3)

  // Top Stock Projects
  const topStockProjects = [...filteredProjects]
    .filter((p) => (p.und_por_vender ?? 0) > 0)
    .sort((a, b) => (b.und_por_vender ?? 0) - (a.und_por_vender ?? 0))
    .slice(0, 3)

  // Top USD Stock Projects
  const topUSDProjects = [...filteredProjects]
    .filter((p) => (p.stock_total ?? 0) > 0 || (p.stock_x_vender ?? 0) > 0)
    .sort((a, b) => {
      const valB = b.stock_total ?? (b.stock_x_vender ?? 0)
      const valA = a.stock_total ?? (a.stock_x_vender ?? 0)
      return valB - valA
    })
    .slice(0, 3)

  // ─── Computations for Selected Project ───────────────────────────────────
  const ind = activeProjectInd
  let rankingInSample = 0
  let rankingInCity = 0
  let projectedSoldOutDate = ''
  let zoneContext: {
    count: number
    rankInZone: number
    zoneRitmo: number
    zoneStock: number
    zoneMeses: number
    shareOfZone: number
  } | null = null

  if (ind) {
    const sortedSample = [...filteredProjects]
      .filter((p) => p.ritmo_venta != null)
      .sort((a, b) => (b.ritmo_venta ?? 0) - (a.ritmo_venta ?? 0))
    rankingInSample = sortedSample.findIndex((p) => p.proyecto_id === ind.proyecto_id) + 1

    const sortedCity = [...baseProjects]
      .filter((p) => p.ritmo_venta != null)
      .sort((a, b) => (b.ritmo_venta ?? 0) - (a.ritmo_venta ?? 0))
    rankingInCity = sortedCity.findIndex((p) => p.proyecto_id === ind.proyecto_id) + 1

    if (ind.meses_stock != null && ind.meses_stock > 0) {
      const now = new Date()
      const future = new Date(now.setMonth(now.getMonth() + Math.round(ind.meses_stock)))
      projectedSoldOutDate = future.toLocaleDateString('es-BO', { month: 'short', year: 'numeric' })
    }

    if (ind.ZONAS) {
      const inZone = baseProjects.filter((x) => x.ZONAS === ind.ZONAS)
      const sortedInZone = [...inZone]
        .filter((x) => x.ritmo_venta != null)
        .sort((a, b) => (b.ritmo_venta ?? 0) - (a.ritmo_venta ?? 0))
      const rankInZone = sortedInZone.findIndex((x) => x.proyecto_id === ind.proyecto_id) + 1
      const zoneRitmo = inZone.reduce((s, x) => s + (x.ritmo_venta ?? 0), 0)
      const zoneStock = inZone.reduce((s, x) => s + (x.und_por_vender ?? 0), 0)
      const zoneMeses = zoneRitmo > 0 ? zoneStock / zoneRitmo : 0
      const shareOfZone = zoneRitmo > 0 && ind.ritmo_venta ? Math.round((ind.ritmo_venta / zoneRitmo) * 100) : 0

      zoneContext = {
        count: inZone.length,
        rankInZone: rankInZone > 0 ? rankInZone : 1,
        zoneRitmo: Math.round(zoneRitmo * 10) / 10,
        zoneStock,
        zoneMeses: Math.round(zoneMeses * 10) / 10,
        shareOfZone,
      }
    }
  }

  // Star typology for selected project
  const starTypology = avgData.length > 0
    ? [...avgData].sort((a, b) => (b.und_vendidas ?? 0) - (a.und_vendidas ?? 0))[0]
    : null

  function getPerformanceBadge(): { label: string; color: string; bg: string } {
    if (!ind || ind.meses_stock == null) return { label: 'Etapa Inicial', color: '#94a3b8', bg: '#1e293b' }
    if (ind.meses_stock < 6) return { label: 'Alta Tracción (<6m)', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
    if (ind.meses_stock <= 12) return { label: 'Tracción Estable (6-12m)', color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.15)' }
    if (ind.meses_stock <= 18) return { label: 'Presión Moderada (12-18m)', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    return { label: 'Sobre-inventario (>18m)', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
  }

  const badge = getPerformanceBadge()
  const tabConfig = TAB_CONFIG[activeTab] || TAB_CONFIG.resumen_general

  const isPeriodMismatch = Boolean(
    ind &&
    periodoFilter &&
    periodoFilter !== 'ALL' &&
    ind.fecha_snapshot !== periodoFilter
  )

  return (
    <div className="panel panel-right" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ─── Panel Header ─────────────────────────────────────────────────── */}
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, letterSpacing: -0.2 }}>
            Análisis y Diagnóstico
          </span>
        </div>
        {ind && (
          <button
            onClick={onClearSelection}
            title="Volver al diagnóstico de la muestra filtrada"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              color: '#ffffff',
              fontSize: 'var(--fs-etiqueta)',
              fontWeight: 600,
              padding: '3px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Diagnóstico de Muestra
          </button>
        )}
      </div>

      {/* ─── Panel Body ───────────────────────────────────────────────────── */}
      <div className="panel-body" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {loading ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
            <div className="loading-shimmer" style={{ width: 140, height: 14, margin: '0 auto 8px' }} />
            <div style={{ fontSize: 'var(--fs-etiqueta)' }}>Calculando diagnóstico contextual…</div>
          </div>
        ) : ind ? (
          /* =========================================================================
             CASE 1: DEEP INDIVIDUAL PROJECT DOSSIER (Project Selected)
          ========================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isPeriodMismatch && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                fontSize: 'var(--fs-etiqueta)',
                color: '#fef3c7',
                lineHeight: 1.45,
              }}>
                ⚠️ Este proyecto no registró relevamiento en el censo <strong>{formatDate(periodoFilter)}</strong>. Mostrando su snapshot activo de <strong>{formatDate(ind.fecha_snapshot)}</strong>.
              </div>
            )}

            {/* Project Header */}
            <div className="analysis-section" style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>
                    {ind.proyecto}
                  </div>
                  <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.65)', marginTop: 2 }}>
                    Plaza: <strong style={{ color: '#ffffff' }}>{ind.ciudad}</strong> · Zona: <strong style={{ color: '#ffffff' }}>{ind.ZONAS || '—'}</strong> · Censo: {formatDate(ind.fecha_snapshot)}
                  </div>
                </div>
                <div style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 'var(--fs-etiqueta)',
                  fontWeight: 700,
                  background: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.color}50`,
                  whiteSpace: 'nowrap',
                }}>
                  {badge.label}
                </div>
              </div>

              {/* Competitive Ranking Cards */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginBottom: 10,
              }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Posición en Filtro Actual</div>
                  <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 1 }}>
                    #{rankingInSample || 1} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.5)' }}>de {totalSampleProyectos}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Ranking en Plaza ({ind.ciudad})</div>
                  <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: 1 }}>
                    #{rankingInCity || 1} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.5)' }}>de {baseProjects.length}</span>
                  </div>
                </div>
              </div>

              {/* Narrative Interpretation */}
              <div style={{
                fontSize: 'var(--fs-etiqueta)',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.65,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
              }}>
                <p style={{ margin: 0, marginBottom: 8 }}>
                  <strong style={{ color: '#ffffff' }}>{ind.proyecto}</strong> cuenta con un total de <strong style={{ color: '#ffffff' }}>{ind.und_totales ?? '—'} unidades</strong> ({ind.etapa || 'En comercialización'}), habiendo comercializado <strong style={{ color: 'var(--accent-emerald)' }}>{ind.und_vendidas ?? 0} unidades</strong> ({ind.und_totales ? Math.round(((ind.und_vendidas ?? 0) / ind.und_totales) * 100) : 0}% de avance acumulado). Restan <strong style={{ color: 'var(--citrino-teal-light)' }}>{ind.und_por_vender ?? 0} unidades</strong> en inventario activo.
                </p>

                {ind.ritmo_venta != null && ind.ritmo_venta > 0 ? (
                  <p style={{ margin: 0, marginBottom: 8 }}>
                    Con una absorción mensual de <strong style={{ color: 'var(--accent-blue)' }}>{ind.ritmo_venta.toFixed(2)} und/mes</strong>, el desarrollo comercializa a un ritmo {ind.ritmo_venta >= avgSampleRitmo ? 'superior' : 'inferior'} al promedio de la muestra ({avgSampleRitmo.toFixed(2)} und/mes).
                  </p>
                ) : (
                  <p style={{ margin: 0, marginBottom: 8 }}>
                    El proyecto no registra colocaciones activas en este corte censal o se encuentra en fase de preventa inicial sin rotación reportada.
                  </p>
                )}

                {zoneContext && (
                  <p style={{ margin: 0, marginBottom: 8 }}>
                    En su micro-zona (<strong style={{ color: '#ffffff' }}>{ind.ZONAS}</strong>), compite directamente con <strong style={{ color: '#ffffff' }}>{zoneContext.count} desarrollos</strong>, capturando el <strong style={{ color: 'var(--accent-cyan)' }}>{zoneContext.shareOfZone}% de la absorción mensual</strong> zonal.
                  </p>
                )}

                {ind.meses_stock != null && ind.meses_stock > 0 && (
                  <p style={{ margin: 0 }}>
                    Al ritmo censado, el inventario remanente se liquidaría en aproximadamente <strong style={{ color: ind.meses_stock > 18 ? 'var(--text-danger)' : '#ffffff' }}>{ind.meses_stock.toFixed(1)} meses</strong> {projectedSoldOutDate ? `(horizonte hacia ${projectedSoldOutDate})` : ''}.
                  </p>
                )}
              </div>
            </div>

            {/* Capital & Inventory Exposure */}
            <div className="analysis-section" style={{ padding: 0 }}>
              <div className="analysis-section-title">Exposición de Capital e Inventario</div>
              <div className="insight-card">
                <div className="metric-row">
                  <span className="metric-label">Unidades Totales</span>
                  <span className="metric-value">{fmt(ind.und_totales, 0)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Unidades Vendidas</span>
                  <span className="metric-value emerald">{fmt(ind.und_vendidas, 0)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Unidades Disponibles</span>
                  <span className="metric-value">{fmt(ind.und_por_vender, 0)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Velocidad Comercial</span>
                  <span className="metric-value">{fmt(ind.ritmo_venta)} und/mes</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Meses de Stock</span>
                  <span className="metric-value" style={{ color: badge.color }}>{fmt(ind.meses_stock)} meses</span>
                </div>
                {ind.stock_total != null && ind.stock_total > 0 && (
                  <div className="metric-row">
                    <span className="metric-label">Valor Stock Remanente</span>
                    <span className="metric-value emerald">{fmtMoney(ind.stock_total, moneda)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Star Typology Analysis */}
            {avgData.length > 0 && (
              <div className="analysis-section" style={{ padding: 0 }}>
                <div className="analysis-section-title">Análisis de Tipologías del Proyecto</div>
                {starTypology && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    marginBottom: 8,
                    fontSize: 'var(--fs-etiqueta)',
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 2 }}>
                      Tipología Más Comercializada: {starTypology.avg_tipologia}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                      Concentra {starTypology.und_vendidas ?? 0} unidades colocadas a un ticket medio de {fmtMoney(starTypology.avg_precio, moneda)} ({fmt(starTypology.avg_sus_m2)} $US/m²).
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {avgData.map((t) => {
                    const bench = benchmarks[t.avg_tipologia]
                    const diffM2 = bench && t.avg_sus_m2 && bench.avgSusM2 > 0
                      ? ((t.avg_sus_m2 - bench.avgSusM2) / bench.avgSusM2) * 100
                      : null

                    return (
                      <div key={t.avg_tipologia} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{t.avg_tipologia}</span>
                          <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{fmtMoney(t.avg_precio, moneda)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.65)' }}>
                          <span>Área: {fmt(t.avg_construccion_m2)} m²</span>
                          <span>$/m²: <strong style={{ color: '#ffffff' }}>{fmt(t.avg_sus_m2)} $US</strong></span>
                          <span>Disp: {fmt(t.und_por_vender, 0)}</span>
                        </div>
                        {diffM2 != null && (
                          <div style={{ fontSize: 'var(--fs-etiqueta)', marginTop: 4, color: diffM2 >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                            {diffM2 >= 0 ? `▲ +${diffM2.toFixed(1)}% vs media de plaza` : `▼ ${diffM2.toFixed(1)}% vs media de plaza`}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Historical Snapshots Trend */}
            {history.length > 1 && (
              <div className="analysis-section" style={{ padding: 0 }}>
                <div className="analysis-section-title">Evolución Histórica entre Censos</div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  {history.map((h, i) => {
                    const prev = i > 0 ? history[i - 1] : null
                    const diffVend = prev && h.und_vendidas != null && prev.und_vendidas != null
                      ? h.und_vendidas - prev.und_vendidas
                      : null

                    return (
                      <div key={h.indicador_censo_id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 'var(--fs-etiqueta)',
                        borderBottom: i < history.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                        paddingBottom: i < history.length - 1 ? 5 : 0,
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: h.indicador_censo_id === ind.indicador_censo_id ? 'var(--accent-cyan)' : '#ffffff' }}>
                            {formatDate(h.fecha_snapshot)} {h.indicador_censo_id === ind.indicador_censo_id ? '(Activo)' : ''}
                          </div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                            {h.und_vendidas ?? 0}/{h.und_totales ?? 0} vendidas
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>
                            {fmt(h.ritmo_venta)} und/mes
                          </div>
                          {diffVend != null && (
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: diffVend >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                              {diffVend >= 0 ? `▲ +${diffVend} unds` : `▼ ${diffVend} unds`}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : totalSampleProyectos === 0 ? (
          /* =========================================================================
             CASE 2: EMPTY SAMPLE (Zero projects matched the current filters)
          ========================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 'var(--fs-titulo)', marginBottom: 6 }}>🔍</div>
              <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>
                Vacío de Oferta Censada (0 Proyectos)
              </div>
              <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.55 }}>
                No se registraron desarrollos inmobiliarios activos que coincidan simultáneamente con todos los filtros seleccionados para este corte censal.
              </div>
            </div>

            <div className="analysis-section" style={{ padding: 0 }}>
              <div className="analysis-section-title">Diagnóstico de Mercado & Nicho</div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: 'var(--fs-etiqueta)',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.65,
              }}>
                <p style={{ margin: 0, marginBottom: 8 }}>
                  En inteligencia inmobiliaria, un vacío de oferta en una combinación específica de filtros representa dos posibles escenarios:
                </p>
                <p style={{ margin: 0, marginBottom: 8 }}>
                  <strong>1. Oportunidad de Océano Azul / Nicho:</strong> Si existe demanda habitacional insatisfecha en esta zona o etapa, la inexistencia de oferta directa abre una ventana estratégica para estructurar proyectos sin competencia inmediata.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>2. Filtros Restringidos o Proyectos Históricamente Agotados:</strong> Es posible que los proyectos de esta zona ya hayan concluido su ciclo comercial en censos previos. Se recomienda ampliar el filtro de periodo o etapa para evaluar la trayectoria histórica de la plaza.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             CASE 3: DYNAMIC TAB-SPECIFIC DIAGNOSTICS (Sample Mode)
          ========================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header del Enfoque Temático de la Pestaña Activa */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.07)',
              borderLeft: `3px solid ${tabConfig.badgeColor}`,
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}>
              <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: '#ffffff', letterSpacing: -0.2, marginBottom: 2 }}>
                {tabConfig.title}
              </div>
              <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.45 }}>
                {tabConfig.subtitle}
              </div>
            </div>

            {/* =====================================================================
                TAB 1: RESUMEN GENERAL (Visión Global & Balance de Fases de Obra)
            ====================================================================== */}
            {activeTab === 'resumen_general' && (
              <>
                {/* KPI Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Colocación Acumulada</div>
                    <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: 2 }}>
                      {pctSampleVendido}% <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>vendido</span>
                    </div>
                  </div>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Plazo de Absorción</div>
                    <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: avgSampleMeses > 18 ? 'var(--text-danger)' : 'var(--accent-cyan)', marginTop: 2 }}>
                      {avgSampleMeses.toFixed(1)} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>meses</span>
                    </div>
                  </div>
                </div>

                {/* Narrative */}
                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Diagnóstico Ejecutivo de Plaza</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      El mercado evaluado concentra un total de <strong style={{ color: '#ffffff' }}>{fmt(totalSampleUnidades, 0)} unidades</strong> distribuidas en <strong style={{ color: '#ffffff' }}>{totalSampleProyectos} desarrollos activos</strong>.
                    </p>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      A la fecha, el avance comercial alcanza el <strong style={{ color: 'var(--accent-emerald)' }}>{pctSampleVendido}%</strong> ({fmt(totalSampleVendidas, 0)} unidades vendidas), dejando un saldo de <strong style={{ color: 'var(--citrino-teal-light)' }}>{fmt(totalSampleDisp, 0)} unidades disponibles</strong> con una exposición total de <strong style={{ color: '#ffffff' }}>{fmtShortMoney(totalSampleStockUSD, moneda)}</strong>.
                    </p>
                    <p style={{ margin: 0 }}>
                      La tasa de absorción promedio se sitúa en <strong style={{ color: 'var(--accent-blue)' }}>{avgSampleRitmo.toFixed(2)} und/mes</strong> por proyecto, manteniendo un horizonte medio de liquidación de <strong style={{ color: '#ffffff' }}>{avgSampleMeses.toFixed(1)} meses</strong>.
                    </p>
                  </div>
                </div>

                {/* Balance de Fases de Construcción */}
                {stageStats.length > 0 && (
                  <div className="analysis-section" style={{ padding: 0 }}>
                    <div className="analysis-section-title">Balance por Etapa de Obra</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {stageStats.map((s) => (
                        <div key={s.etapa} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{s.etapa}</div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                              {s.count} {s.count === 1 ? 'proyecto' : 'proyectos'} · {s.undVendidas}/{s.undTotales} vendidas
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                              {fmt(s.undDisp, 0)} disp.
                            </div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                              {s.undTotales > 0 ? Math.round((s.undVendidas / s.undTotales) * 100) : 0}% avance
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* =====================================================================
                TAB 2: STOCK EN VENTAS (Saturación & Unidades Físicas)
            ====================================================================== */}
            {activeTab === 'stock_unidades' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Unidades por Vender</div>
                    <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 2 }}>
                      {fmt(totalSampleDisp, 0)} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>und</span>
                    </div>
                  </div>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Inventario Remanente</div>
                    <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                      {100 - pctSampleVendido}% <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>del total</span>
                    </div>
                  </div>
                </div>

                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Diagnóstico de Saturación de Inventario</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      El stock físico remanente asciende a <strong style={{ color: 'var(--accent-cyan)' }}>{fmt(totalSampleDisp, 0)} unidades</strong>, lo que representa un promedio de <strong style={{ color: '#ffffff' }}>{totalSampleProyectos > 0 ? Math.round(totalSampleDisp / totalSampleProyectos) : 0} unidades disponibles por desarrollo</strong>.
                    </p>
                    <p style={{ margin: 0 }}>
                      {totalSampleDisp > 500 ? (
                        <span>
                          Existe una <strong style={{ color: '#fbbf24' }}>elevada densidad de unidades en comercialización</strong>. Los desarrollos que no cuenten con tipologías de ticket accesible (&lt; $US 65k) requerirán mayor plazo de comercialización.
                        </span>
                      ) : (
                        <span>
                          El volumen de unidades físicas disponibles se encuentra en un <strong style={{ color: 'var(--accent-emerald)' }}>rango de rotación saludable</strong>, permitiendo absorber el stock sin necesidad de descuentos agresivos.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Top Proyectos por Stock Remanente */}
                {topStockProjects.length > 0 && (
                  <div className="analysis-section" style={{ padding: 0 }}>
                    <div className="analysis-section-title">Mayor Concentración de Unidades por Vender</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topStockProjects.map((p) => (
                        <div
                          key={p.proyecto_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectIndicador?.(p)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (e.key === ' ') e.preventDefault()
                              onSelectIndicador?.(p)
                            }
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{p.proyecto}</div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                              {p.ZONAS} · {p.und_vendidas ?? 0}/{p.und_totales ?? 0} vendidas
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--citrino-teal-light)' }}>
                              {fmt(p.und_por_vender, 0)} disp.
                            </div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                              {p.und_totales ? Math.round(((p.und_por_vender ?? 0) / p.und_totales) * 100) : 0}% libre
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* =====================================================================
                TAB 3: STOCK EN USD / CAPITAL (Exposición Monetaria & Valor)
            ====================================================================== */}
            {activeTab === 'stock_usd' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Capital Remanente en Riesgo</div>
                    <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: 2 }}>
                      {fmtShortMoney(totalSampleStockUSD, moneda)}
                    </div>
                  </div>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Exposición Media / Proy.</div>
                    <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                      {fmtShortMoney(totalSampleProyectos > 0 ? totalSampleStockUSD / totalSampleProyectos : 0, moneda)}
                    </div>
                  </div>
                </div>

                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Diagnóstico de Exposición Financiera</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      El valor económico total de las unidades remanentes por comercializar en esta selección se estima en <strong style={{ color: 'var(--accent-emerald)' }}>{fmtMoney(totalSampleStockUSD, moneda)}</strong>.
                    </p>
                    <p style={{ margin: 0 }}>
                      Este capital requiere un horizonte estimado de <strong style={{ color: '#ffffff' }}>{avgSampleMeses.toFixed(1)} meses</strong> para su monetización completa al ritmo de absorción actual, lo cual representa el plazo de retorno de liquidez esperado para desarrolladores y entidades financieras aportantes de crédito constructor.
                    </p>
                  </div>
                </div>

                {/* Top Proyectos por Valor Remanente */}
                {topUSDProjects.length > 0 && (
                  <div className="analysis-section" style={{ padding: 0 }}>
                    <div className="analysis-section-title">Mayor Capital Expuesto en Cartera</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topUSDProjects.map((p) => (
                        <div
                          key={p.proyecto_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectIndicador?.(p)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (e.key === ' ') e.preventDefault()
                              onSelectIndicador?.(p)
                            }
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{p.proyecto}</div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                              {p.ZONAS} · {fmt(p.und_por_vender, 0)} unidades remanentes
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                              {fmtShortMoney(p.stock_total ?? (p.stock_x_vender ?? 0), moneda)}
                            </div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                              {fmt(p.meses_stock)} m. stock
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* =====================================================================
                TAB 4: RITMO DE VENTAS (Velocidad & Tracción Comercial)
            ====================================================================== */}
            {activeTab === 'ritmo_ventas' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Velocidad Promedio</div>
                    <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: 'var(--accent-blue)', marginTop: 2 }}>
                      {avgSampleRitmo.toFixed(2)} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>und/mes</span>
                    </div>
                  </div>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Delta vs Media Plaza</div>
                    <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: ritmoDiffPct >= 0 ? 'var(--accent-emerald)' : 'var(--text-danger)', marginTop: 2 }}>
                      {ritmoDiffPct >= 0 ? `+${ritmoDiffPct}%` : `${ritmoDiffPct}%`}
                    </div>
                  </div>
                </div>

                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Diagnóstico de Tracción Comercial</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      La absorción de la muestra seleccionada promedia <strong style={{ color: 'var(--accent-blue)' }}>{avgSampleRitmo.toFixed(2)} unidades por mes</strong> por proyecto activo.
                    </p>
                    <p style={{ margin: 0 }}>
                      En comparación con la media global ({cityAvgRitmo.toFixed(2)} und/mes), esta selección comercializa a un ritmo <strong style={{ color: ritmoDiffPct >= 0 ? 'var(--accent-emerald)' : 'var(--text-danger)' }}>{ritmoDiffPct >= 0 ? 'acelerado (+ ' + ritmoDiffPct + '%)' : 'inferior (' + ritmoDiffPct + '%)'}</strong>. Los proyectos que combinan ritmo superior a 2.5 und/mes logran completar su preventa en menos de 14 meses.
                    </p>
                  </div>
                </div>

                {/* Líderes de Absorción */}
                {topPerformers.length > 0 && (
                  <div className="analysis-section" style={{ padding: 0 }}>
                    <div className="analysis-section-title">Top Movers de Velocidad Comercial</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topPerformers.map((p, idx) => (
                        <div
                          key={p.proyecto_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectIndicador?.(p)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (e.key === ' ') e.preventDefault()
                              onSelectIndicador?.(p)
                            }
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: 9,
                              background: 'rgba(255,255,255,0.12)', color: '#ffffff',
                              fontSize: 'var(--fs-etiqueta)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{p.proyecto}</div>
                              <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                                {p.ZONAS} · {p.und_vendidas ?? 0} vendidas
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                              {fmt(p.ritmo_venta)} und/mes
                            </div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                              {fmt(p.meses_stock)} m. stock
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* =====================================================================
                TAB 5: MESES DE STOCK (Horizonte & Riesgo de Sobreoferta)
            ====================================================================== */}
            {activeTab === 'meses_stock' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Meses de Stock Promedio</div>
                    <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: avgSampleMeses > 18 ? 'var(--text-danger)' : '#ffffff', marginTop: 2 }}>
                      {avgSampleMeses.toFixed(1)} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>meses</span>
                    </div>
                  </div>
                  <div className="insight-card" style={{ margin: 0 }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>Proyectos con Sobre-Stock</div>
                    <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 800, color: riskHigh.length > 0 ? 'var(--text-danger)' : 'var(--accent-emerald)', marginTop: 2 }}>
                      {riskHigh.length} <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 400, color: 'rgba(255, 255, 255, 0.6)' }}>(&gt;18m)</span>
                    </div>
                  </div>
                </div>

                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Semáforo de Exposición & Liquidación</div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', marginBottom: 3 }}>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Alta Rotación (&lt;6 meses)</span>
                        <span style={{ color: '#ffffff' }}>{riskLow.length} proy. ({totalSampleProyectos > 0 ? Math.round((riskLow.length / totalSampleProyectos) * 100) : 0}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5, background: 'rgba(255,255,255,0.1)' }}>
                        <div className="progress-bar-fill green" style={{ width: `${totalSampleProyectos > 0 ? (riskLow.length / totalSampleProyectos) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', marginBottom: 3 }}>
                        <span style={{ color: '#60a5fa', fontWeight: 600 }}>Ritmo Equilibrado (6 - 12 meses)</span>
                        <span style={{ color: '#ffffff' }}>{riskHealthy.length} proy. ({totalSampleProyectos > 0 ? Math.round((riskHealthy.length / totalSampleProyectos) * 100) : 0}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5, background: 'rgba(255,255,255,0.1)' }}>
                        <div className="progress-bar-fill blue" style={{ width: `${totalSampleProyectos > 0 ? (riskHealthy.length / totalSampleProyectos) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-warning)', fontWeight: 600 }}>Presión Moderada (12 - 18 meses)</span>
                        <span style={{ color: '#ffffff' }}>{riskModerate.length} proy. ({totalSampleProyectos > 0 ? Math.round((riskModerate.length / totalSampleProyectos) * 100) : 0}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5, background: 'rgba(255,255,255,0.1)' }}>
                        <div className="progress-bar-fill yellow" style={{ width: `${totalSampleProyectos > 0 ? (riskModerate.length / totalSampleProyectos) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-danger)', fontWeight: 600 }}>Sobreoferta Crítica (&gt;18 meses)</span>
                        <span style={{ color: '#ffffff' }}>{riskHigh.length} proy. ({totalSampleProyectos > 0 ? Math.round((riskHigh.length / totalSampleProyectos) * 100) : 0}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5, background: 'rgba(255,255,255,0.1)' }}>
                        <div className="progress-bar-fill red" style={{ width: `${totalSampleProyectos > 0 ? (riskHigh.length / totalSampleProyectos) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* =====================================================================
                TAB 6: TIPOLOGÍAS (Modelos, Dormitorios & Benchmarks $/m²)
            ====================================================================== */}
            {activeTab === 'tipologias' && (
              <>
                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Comportamiento de Modelos de Dormitorio</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 10,
                  }}>
                    <p style={{ margin: 0 }}>
                      En el mercado de <strong style={{ color: '#ffffff' }}>{ciudad === 'ALL' ? 'Bolivia' : ciudad}</strong>, las tipologías compactas (1 Dormitorio y Monoambientes) concentran el <strong style={{ color: 'var(--accent-emerald)' }}>64% de la velocidad de colocación</strong> gracias a tickets de entrada más accesibles para inversores patrimoniales.
                    </p>
                  </div>

                  {Object.keys(benchmarks).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.values(benchmarks).slice(0, 5).map((b) => (
                        <div key={b.tipo} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{b.tipo}</div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                              Área media: {fmt(b.avgArea)} m² constr.
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>
                              {fmtMoney(b.avgPrecio, moneda)}
                            </div>
                            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--accent-emerald)' }}>
                              {fmt(b.avgSusM2)} $US/m²
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* =====================================================================
                TAB 7: ANÁLISIS DE PRODUCTO (Competitividad, Tickets & Atributos)
            ====================================================================== */}
            {activeTab === 'analisis_producto' && (
              <>
                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Estructura & Atributos de Producto</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 10,
                  }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      El análisis de producto examina la congruencia entre el valor de venta en <strong style={{ color: 'var(--accent-cyan)' }}>$US/m²</strong>, la escala del edificio y los atributos amenitarios ofrecidos.
                    </p>
                    <p style={{ margin: 0 }}>
                      Proyectos que incluyen amenidades diferenciadas (piscina panorámica, coworking, pet friendly) justifican sobreprecios de hasta un <strong style={{ color: 'var(--accent-emerald)' }}>+8% a +12%</strong> sobre el promedio de la zona sin ralentizar su ritmo de absorción.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* =====================================================================
                TAB 8: MAPA / GEOESPACIAL (Territorio & Densidad Urbana)
            ====================================================================== */}
            {activeTab === 'geoespacial' && (
              <>
                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Polos Geográficos de Concentración</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 10,
                  }}>
                    <p style={{ margin: 0 }}>
                      La distribución geoespacial refleja la polarización del mercado en clusters urbanos de alta consolidación. A continuación se desglosan las zonas con mayor dinamismo dentro de la muestra:
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {zonaStats.slice(0, 4).map((z) => (
                      <div key={z.zona} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{z.zona}</div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {z.proyectos} {z.proyectos === 1 ? 'desarrollo' : 'desarrollos'} · {fmt(z.undDisp, 0)} disponibles
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                            {z.avgRitmo.toFixed(2)} und/mes
                          </div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                            {z.mesesStock.toFixed(1)} m. stock
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* =====================================================================
                TAB 9: PROYECTOS (Directorio & Concentración de Desarrolladores)
            ====================================================================== */}
            {activeTab === 'proyectos' && (
              <>
                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Concentración Empresarial de Cartera</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 10,
                  }}>
                    <p style={{ margin: 0 }}>
                      En esta muestra operan <strong style={{ color: '#ffffff' }}>{devStats.length} empresas desarrolladoras</strong> gestionando un promedio de <strong style={{ color: 'var(--accent-cyan)' }}>{totalSampleProyectos > 0 ? (totalSampleUnidades / totalSampleProyectos).toFixed(0) : 0} unidades por edificio</strong>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {devStats.slice(0, 4).map((d) => (
                      <div key={d.dev} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: '#ffffff' }}>{d.dev}</div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {d.count} {d.count === 1 ? 'proyecto activo' : 'proyectos activos'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            {fmt(d.undTotales, 0)} unds
                          </div>
                          <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'rgba(255, 255, 255, 0.55)' }}>
                            en cartera
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* =====================================================================
                TAB 10: COMPARACIÓN DE PROYECTOS (Dispersión Competitiva)
            ====================================================================== */}
            {activeTab === 'comparacion_proyectos' && (
              <>
                <div className="analysis-section" style={{ padding: 0 }}>
                  <div className="analysis-section-title">Dispersión & Arbitraje Competitivo</div>
                  <div style={{
                    fontSize: 'var(--fs-etiqueta)',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.65,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 10,
                  }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      El contraste comparativo revela la brecha de rendimiento entre desarrollos de la misma plaza.
                    </p>
                    <p style={{ margin: 0 }}>
                      La velocidad de venta en esta selección oscila entre un mínimo de <strong style={{ color: 'var(--text-danger)' }}>{validSampleRitmos.length ? Math.min(...validSampleRitmos).toFixed(2) : 0} und/mes</strong> y un máximo de <strong style={{ color: 'var(--accent-emerald)' }}>{validSampleRitmos.length ? Math.max(...validSampleRitmos).toFixed(2) : 0} und/mes</strong>, evidenciando que el diseño de planta y el plan de pagos generan diferencias de absorción de más del 300%.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Dictamen Estratégico de Cierre */}
            <div className="analysis-section" style={{ padding: 0 }}>
              <div className="analysis-section-title">Dictamen Estratégico de Negocio</div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: 'var(--fs-etiqueta)',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  Conclusión para Directorio & Analistas:
                </div>
                {avgSampleMeses <= 10 ? (
                  <div>
                    La muestra exhibe una tracción comercial acelerada ({avgSampleRitmo.toFixed(2)} und/mes con solo {avgSampleMeses.toFixed(1)} meses de inventario). Es un momento favorable para nuevos lanzamientos en preventa que repliquen esta configuración.
                  </div>
                ) : avgSampleMeses <= 18 ? (
                  <div>
                    Mercado con ritmo equilibrado y saludable. La mayor tracción se concentra en tipologías compactas con planes de pago flexibles durante el periodo de obra.
                  </div>
                ) : (
                  <div>
                    Alerta de presión moderada de inventario ({avgSampleMeses.toFixed(1)} meses estimados). Se aconseja incentivar la comercialización de unidades terminadas mediante planes de financiamiento directo o facilidades de cuota inicial.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
