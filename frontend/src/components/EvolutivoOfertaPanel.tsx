import { useState, useEffect, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import './TopTabs.css'
import {
  EVOLUTIVO_OFERTA_SNAPSHOTS,
  RITMO_VENTAS_HISTORICO_MENSUAL,
  ETAPAS_COMERCIALES_EVOLUTIVO,
  type CensoEvolutivoSnapshot,
} from '../data/citrinoDataStudioData'
import {
  fetchIndicadores,
  fetchAllAvgTipologias,
  fetchAllCondicionesFinancieras,
  fetchIndicadorIdsForTipologia,
  getLatestPerProject,
  type IndicadorFull,
  type AvgTipologia,
  type CondicionFinanciera,
} from '../lib/supabase'
import { useChartTheme } from '../lib/chartTheme'

type TopTab = 'cuantificacion' | 'precio_ritmo' | 'proyectos'

interface Props {
  ciudad?: string
  zonaFilter?: string
  subzonaFilter?: string
  tipoInmuebleFilter?: string
  etapaFilter?: string | string[]
  periodoFilter?: string
  tipologiaFilter?: string
}

function formatFormaPago(raw: string | null | undefined): string {
  if (!raw) return 'Según proyecto'
  const clean = raw.replace(/_/g, ' ').trim()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function formatStageLabel(raw: string | null | undefined): string {
  const s = (raw || '').toLowerCase().trim()
  if (!s || s.includes('preventa') || s.includes('pozo') || s.includes('lanzamiento')) return 'Preventa'
  if (s.includes('bruta') || s.includes('gruesa') || s.includes('estructura')) return 'Obra bruta'
  if (s.includes('fina') || s.includes('acabad')) return 'Obra fina'
  if (s.includes('terminad') || s.includes('entrega')) return 'Entrega inmediata'
  if (s.includes('vendid') || s.includes('agotad')) return 'Vendida'
  if (s.includes('paraliz') || s.includes('clandestin')) return 'Paralizada'
  return raw!.charAt(0).toUpperCase() + raw!.slice(1)
}

export default function EvolutivoOfertaPanel({
  ciudad = 'SCZ',
  zonaFilter = 'ALL',
  subzonaFilter = 'ALL',
  tipoInmuebleFilter = 'ALL',
  etapaFilter = 'ALL',
  periodoFilter = 'ALL',
  tipologiaFilter = 'ALL',
}: Props) {
  const ct = useChartTheme()
  const [activeTab, setActiveTab] = useState<TopTab>('cuantificacion')
  const [subPillCuant, setSubPillCuant] = useState<'cuantificacion' | 'estadistica'>('estadistica')
  const [subPillStock, setSubPillStock] = useState<'stock_und' | 'stock_usd'>('stock_und')
  const [subPillRitmo, setSubPillRitmo] = useState<'grafico' | 'tabla'>('grafico')
  const [searchProj, setSearchProj] = useState('')

  const [allIndicadores, setAllIndicadores] = useState<IndicadorFull[]>([])
  const [allAvgTipos, setAllAvgTipos] = useState<AvgTipologia[]>([])
  const [allCondiciones, setAllCondiciones] = useState<CondicionFinanciera[]>([])
  const [matchingTipologiaIds, setMatchingTipologiaIds] = useState<Set<string> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchIndicadores(ciudad === 'ALL' ? undefined : ciudad),
      fetchAllAvgTipologias(),
      fetchAllCondicionesFinancieras(),
    ])
      .then(([inds, avgTipos, conds]) => {
        if (cancelled) return
        setAllIndicadores(inds)
        setAllAvgTipos(avgTipos)
        setAllCondiciones(conds)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error cargando EvolutivoOfertaPanel desde Supabase:', err)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ciudad])

  useEffect(() => {
    if (!tipologiaFilter || tipologiaFilter === 'ALL') {
      setMatchingTipologiaIds(null)
    } else {
      fetchIndicadorIdsForTipologia(tipologiaFilter).then(setMatchingTipologiaIds)
    }
  }, [tipologiaFilter])

  // Filtrado universal por zona, subzona, tipo de inmueble, etapa y tipología
  const filteredIndicadores = useMemo(() => {
    return allIndicadores.filter((p) => {
      if (zonaFilter && zonaFilter !== 'ALL' && (p.ZONAS || 'Sin Zona').trim() !== zonaFilter.trim()) {
        return false
      }
      if (subzonaFilter && subzonaFilter !== 'ALL' && (p.SUBZONAS || 'Sin Subzona').trim() !== subzonaFilter.trim()) {
        return false
      }
      if (
        tipoInmuebleFilter &&
        tipoInmuebleFilter !== 'ALL' &&
        (p.tipo_inmueble || '').toLowerCase().trim() !== tipoInmuebleFilter.toLowerCase().trim()
      ) {
        return false
      }
      if (matchingTipologiaIds && !matchingTipologiaIds.has(p.indicador_censo_id)) {
        return false
      }
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
  }, [allIndicadores, zonaFilter, subzonaFilter, tipoInmuebleFilter, matchingTipologiaIds, etapaFilter])

  // Mapa de precios por m² (oficial y paralelo) por indicador_censo_id
  const avgTiposByInd = useMemo(() => {
    const map = new Map<string, { susM2: number[]; usdM2: number[]; m2: number[] }>()
    for (const t of allAvgTipos) {
      if (!t.indicador_censo_id) continue
      let entry = map.get(t.indicador_censo_id)
      if (!entry) {
        entry = { susM2: [], usdM2: [], m2: [] }
        map.set(t.indicador_censo_id, entry)
      }
      if (t.avg_sus_m2 && t.avg_sus_m2 > 0) entry.susM2.push(t.avg_sus_m2)
      if (t.avg_usd_m2 && t.avg_usd_m2 > 0) entry.usdM2.push(t.avg_usd_m2)
      if (t.avg_construccion_m2 && t.avg_construccion_m2 > 0) entry.m2.push(t.avg_construccion_m2)
    }
    return map
  }, [allAvgTipos])

  // Cortes anuales calculados desde Supabase (oferta_indicadores_censo + oferta_avg_tipologias)
  const snapshots: CensoEvolutivoSnapshot[] = useMemo(() => {
    if (filteredIndicadores.length === 0) return EVOLUTIVO_OFERTA_SNAPSHOTS

    const years = [
      ...new Set(
        filteredIndicadores
          .map((i) => (i.fecha_snapshot || '').slice(0, 4))
          .filter((y) => y.length === 4)
      ),
    ].sort()

    if (years.length === 0) return EVOLUTIVO_OFERTA_SNAPSHOTS

    return years.map((ano) => {
      const inYear = filteredIndicadores.filter((i) => (i.fecha_snapshot || '').startsWith(ano))
      const latestInYear = getLatestPerProject(inYear)
      const proyectosCensados = latestInYear.length
      const undTotales = latestInYear.reduce((s, x) => s + (x.und_totales ?? 0), 0)
      const undVendidas = latestInYear.reduce((s, x) => s + (x.und_vendidas ?? 0), 0)
      const undPorVender = latestInYear.reduce((s, x) => s + (x.und_por_vender ?? 0), 0)
      const undPromedio = proyectosCensados > 0 ? Math.round((undTotales / proyectosCensados) * 10) / 10 : 0

      const rawStockUsd = latestInYear.reduce((s, x) => {
        const tot = x.stock_total ?? 0
        return s + (tot > 0 ? tot : (x.stock_vendido ?? 0) + (x.stock_x_vender ?? 0))
      }, 0)
      const stockTotalUsd = Math.round((rawStockUsd / 1_000_000) * 10) / 10
      const stockPromedioUsd =
        proyectosCensados > 0 ? Math.round((stockTotalUsd / proyectosCensados) * 100) / 100 : 0

      const pctVendido = undTotales > 0 ? Math.round((undVendidas / undTotales) * 100) : 0
      const pctPorVender = undTotales > 0 ? Math.max(0, 100 - pctVendido) : 0

      const ritmoTotal = latestInYear.reduce((s, x) => s + (x.ritmo_venta ?? 0), 0)
      const validMeses = latestInYear
        .map((x) => x.meses_stock)
        .filter((m): m is number => m != null && m > 0 && m < 120)
      const mesesStockPromedio =
        ritmoTotal > 0
          ? Math.round((undPorVender / ritmoTotal) * 10) / 10
          : validMeses.length > 0
          ? Math.round((validMeses.reduce((a, b) => a + b, 0) / validMeses.length) * 10) / 10
          : 0

      const oficialList: number[] = []
      const paraleloList: number[] = []
      let totalM2 = 0
      for (const item of latestInYear) {
        const tInfo = avgTiposByInd.get(item.indicador_censo_id)
        if (tInfo) {
          oficialList.push(...tInfo.susM2)
          paraleloList.push(...tInfo.usdM2)
          if (tInfo.m2.length > 0) {
            const avgArea = tInfo.m2.reduce((a, b) => a + b, 0) / tInfo.m2.length
            totalM2 += avgArea * (item.und_totales ?? 0)
          }
        }
      }
      const precioM2Oficial =
        oficialList.length > 0
          ? Math.round(oficialList.reduce((a, b) => a + b, 0) / oficialList.length)
          : 1200
      const precioM2Paralelo =
        paraleloList.length > 0
          ? Math.round(paraleloList.reduce((a, b) => a + b, 0) / paraleloList.length)
          : precioM2Oficial

      return {
        ano,
        proyectosCensados,
        undTotales,
        undPromedio,
        stockTotalUsd,
        stockPromedioUsd,
        m2Totales: Math.round(totalM2 / 1000),
        pctVendido,
        pctPorVender,
        mesesStockPromedio,
        precioM2Oficial,
        precioM2Paralelo,
      }
    })
  }, [filteredIndicadores, avgTiposByInd])

  // Corte activo (según selector de periodo o el último corte por proyecto)
  const currentProjects = useMemo(() => {
    if (periodoFilter && periodoFilter !== 'ALL') {
      return filteredIndicadores.filter((p) => p.fecha_snapshot === periodoFilter)
    }
    return getLatestPerProject(filteredIndicadores)
  }, [filteredIndicadores, periodoFilter])

  // Distribución por etapa comercial desde Supabase
  const etapasComerciales = useMemo(() => {
    if (currentProjects.length === 0) return ETAPAS_COMERCIALES_EVOLUTIVO
    const groups = new Map<string, { proyectos: number; unds: number }>()
    for (const p of currentProjects) {
      const label = formatStageLabel(p.etapa)
      const curr = groups.get(label) || { proyectos: 0, unds: 0 }
      curr.proyectos += 1
      curr.unds += p.und_totales ?? 0
      groups.set(label, curr)
    }
    const totalProy = currentProjects.length
    return Array.from(groups.entries())
      .map(([etapa, val]) => ({
        etapa,
        proyectos: val.proyectos,
        unds: val.unds,
        pct: totalProy > 0 ? Math.round((val.proyectos / totalProy) * 100) : 0,
      }))
      .sort((a, b) => b.proyectos - a.proyectos)
  }, [currentProjects])

  // Serie histórica de ritmo de venta por corte censal desde Supabase
  const ritmoSerie = useMemo(() => {
    if (filteredIndicadores.length === 0) return RITMO_VENTAS_HISTORICO_MENSUAL
    const byDate = new Map<string, IndicadorFull[]>()
    for (const ind of filteredIndicadores) {
      if (!ind.fecha_snapshot) continue
      const list = byDate.get(ind.fecha_snapshot) || []
      list.push(ind)
      byDate.set(ind.fecha_snapshot, list)
    }
    const dates = Array.from(byDate.keys()).sort()
    const points = dates
      .map((d) => {
        const items = byDate.get(d)!
        // Porcentaje mensual de unidades absorbidas sobre el total de unidades de cada proyecto activo
        const valid = items
          .map((x) => {
            if (x.ritmo_venta == null || x.ritmo_venta <= 0) return null
            if (x.und_totales && x.und_totales > 0) {
              return (x.ritmo_venta / x.und_totales) * 100
            }
            return x.ritmo_venta
          })
          .filter((v): v is number => v != null && v > 0 && v <= 25)
        if (valid.length === 0) return null
        const avg = Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
        return { periodo: d, valor: avg }
      })
      .filter((p): p is { periodo: string; valor: number } => p !== null)

    return points.length > 0 ? points : RITMO_VENTAS_HISTORICO_MENSUAL
  }, [filteredIndicadores])

  // Proyectos con condiciones comerciales reales desde oferta_proyectos + oferta_condiciones_financieras
  const proyectosCondiciones = useMemo(() => {
    const condByInd = new Map<string, CondicionFinanciera>()
    for (const c of allCondiciones) {
      if (c.indicador_censo_id && !condByInd.has(c.indicador_censo_id)) {
        condByInd.set(c.indicador_censo_id, c)
      }
    }

    const rows = currentProjects.map((p) => {
      const cond = condByInd.get(p.indicador_censo_id)
      const cuotaIni =
        cond?.aporte_inicial != null ? `${cond.aporte_inicial}%` : 'Según plan'
      const financiamiento = cond?.modalidad_pago
        ? cond.modalidad_pago
        : cond?.forma_de_pago
        ? formatFormaPago(cond.forma_de_pago)
        : cond?.banco
        ? `Crédito (${cond.banco})`
        : 'Directo / Bancario'
      const etapaLabel = formatStageLabel(p.etapa)
      const velocidad =
        p.ritmo_venta != null ? `${Number(p.ritmo_venta).toFixed(1)} unidades/mes` : '—'

      return {
        id: p.proyecto_id,
        nombre: p.proyecto || 'Proyecto',
        zona: p.ZONAS || p.ciudad || 'Sin zona',
        cuotaIni,
        financiamiento,
        etapa: etapaLabel,
        velocidad,
        ritmoNum: p.ritmo_venta ?? 0,
      }
    })

    return rows
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchProj.toLowerCase()) ||
          p.zona.toLowerCase().includes(searchProj.toLowerCase()) ||
          p.financiamiento.toLowerCase().includes(searchProj.toLowerCase())
      )
      .sort((a, b) => b.ritmoNum - a.ritmoNum)
  }, [currentProjects, allCondiciones, searchProj])

  const latest = snapshots[snapshots.length - 1] || EVOLUTIVO_OFERTA_SNAPSHOTS[EVOLUTIVO_OFERTA_SNAPSHOTS.length - 1]
  const peakSnapshot = useMemo(() => {
    return snapshots.reduce((best, cur) => (cur.proyectosCensados > best.proyectosCensados ? cur : best), latest)
  }, [snapshots, latest])

  // Estadísticas dinámicas de ritmo de venta
  const ritmoStats = useMemo(() => {
    if (ritmoSerie.length === 0) {
      return { actual: 3.4, actualPeriodo: '2026', min: 1.1, minPeriodo: '2025', max: 3.4, maxPeriodo: '2026', avg: 2.2 }
    }
    const last = ritmoSerie[ritmoSerie.length - 1]
    let minPt = ritmoSerie[0]
    let maxPt = ritmoSerie[0]
    let sum = 0
    for (const pt of ritmoSerie) {
      if (pt.valor < minPt.valor) minPt = pt
      if (pt.valor > maxPt.valor) maxPt = pt
      sum += pt.valor
    }
    const avg = Math.round((sum / ritmoSerie.length) * 10) / 10
    return {
      actual: last.valor,
      actualPeriodo: last.periodo,
      min: minPt.valor,
      minPeriodo: minPt.periodo,
      max: maxPt.valor,
      maxPeriodo: maxPt.periodo,
      avg,
    }
  }, [ritmoSerie])

  const maxRitmoAxis = Math.max(4.5, Math.ceil(ritmoStats.max + 0.5))

  // Chart Option: Cuantificación Agregada (Unidades Totales vs Stock USD)
  const getCuantificacionChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: snapshots.map((s) => s.ano),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: ct.muted },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Unidades',
        axisLabel: { color: ct.muted },
        splitLine: { lineStyle: { color: ct.grid } },
      },
      {
        type: 'value',
        name: 'Millones $US',
        axisLabel: { color: '#38bdf8' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Unidades totales',
        type: 'bar',
        data: snapshots.map((s) => s.undTotales),
        itemStyle: { color: '#ff6b00', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Stock total ($US M)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: snapshots.map((s) => s.stockTotalUsd),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
    ],
  })

  // Chart Option: Ritmo de Venta Histórico
  const getRitmoChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].name}<br/><b>Ritmo de venta: ${params[0].value}% mensual</b>`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ritmoSerie.map((p) => p.periodo),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: ct.muted, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: '% mensual',
      min: 0,
      max: maxRitmoAxis,
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Ritmo de venta',
        type: 'line',
        smooth: true,
        data: ritmoSerie.map((p) => p.valor),
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3, color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ],
          },
        },
        markPoint: {
          data: [
            { type: 'min', name: `Mínimo (${ritmoStats.min}%)`, itemStyle: { color: '#ef4444' } },
            { type: 'max', name: `Máximo (${ritmoStats.max}%)`, itemStyle: { color: '#10b981' } },
          ],
        },
      },
    ],
  })

  // Chart Option: Brecha Cambiaria Oficial vs Paralelo
  const getBrechaChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: snapshots.map((s) => s.ano),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: '$US / m²',
      scale: true,
      axisLabel: { color: ct.muted, formatter: '${value}' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Precio por m² oficial (6.96)',
        type: 'line',
        data: snapshots.map((s) => s.precioM2Oficial),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
      {
        name: 'Precio por m² paralelo',
        type: 'line',
        data: snapshots.map((s) => s.precioM2Paralelo),
        itemStyle: { color: '#ff6b00' },
        lineStyle: { width: 3, type: 'dashed' },
      },
    ],
  })

  // Chart Option: Etapas Comerciales Pie
  const getEtapasPieChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} proyectos ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: ct.muted } },
    series: [
      {
        name: 'Etapas',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        data: etapasComerciales.map((e) => ({
          name: e.etapa,
          value: e.proyectos,
        })),
        itemStyle: {
          borderRadius: 4,
          borderColor: '#070b12',
          borderWidth: 2,
        },
        color: ['#38bdf8', '#ff6b00', '#10b981', '#a855f7', '#f59e0b', '#ef4444'],
      },
    ],
  })

  const firstYear = snapshots[0]?.ano || '2016'
  const lastYear = latest.ano || '2026'

  return (
    <div className="citrino-panel-wrap">
      {/* Pestañas superiores */}
      <div className="top-tabs">
        <button
          className={`top-tab ${activeTab === 'cuantificacion' ? 'active' : ''}`}
          onClick={() => setActiveTab('cuantificacion')}
        >
          Cuantificación Evolutiva de la Oferta
        </button>
        <button
          className={`top-tab ${activeTab === 'precio_ritmo' ? 'active' : ''}`}
          onClick={() => setActiveTab('precio_ritmo')}
        >
          Evolutivo Precio & Ritmo de Venta
        </button>
        <button
          className={`top-tab ${activeTab === 'proyectos' ? 'active' : ''}`}
          onClick={() => setActiveTab('proyectos')}
        >
          Evolutivo por Proyectos
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', marginBottom: 12 }}>
          Cargando datos históricos desde Supabase…
        </div>
      )}

      {/* ── PESTAÑA 1: CUANTIFICACIÓN EVOLUTIVA DE LA OFERTA ── */}
      {activeTab === 'cuantificacion' && (
        <div>
          <div className="citrino-subpills-row">
            <span className="citrino-subpill-label">Ver:</span>
            <button
              className={`citrino-subpill-btn ${subPillCuant === 'estadistica' ? 'active' : ''}`}
              onClick={() => setSubPillCuant('estadistica')}
            >
              📊 Promedios y proporciones
            </button>
            <button
              className={`citrino-subpill-btn ${subPillCuant === 'cuantificacion' ? 'active' : ''}`}
              onClick={() => setSubPillCuant('cuantificacion')}
            >
              📈 Totales
            </button>
          </div>

          {/* KPIs */}
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card">
              <span className="citrino-kpi-label">Proyectos censados ({lastYear})</span>
              <span className="citrino-kpi-val">{latest.proyectosCensados}</span>
              <span className="citrino-kpi-sub">
                Máximo histórico: {peakSnapshot.proyectosCensados} en {peakSnapshot.ano}
              </span>
            </div>
            <div className="citrino-kpi-card blue">
              <span className="citrino-kpi-label">Unidades promedio por proyecto</span>
              <span className="citrino-kpi-val">{latest.undPromedio} unidades</span>
              <span className="citrino-kpi-sub">
                Total censado: {latest.undTotales.toLocaleString()} unidades
              </span>
            </div>
            <div className="citrino-kpi-card green">
              <span className="citrino-kpi-label">Stock promedio por proyecto (USD)</span>
              <span className="citrino-kpi-val">${latest.stockPromedioUsd} M</span>
              <span className="citrino-kpi-sub">Stock total censado: ${latest.stockTotalUsd} M</span>
            </div>
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Vendido vs por vender</span>
              <span className="citrino-kpi-val">
                {latest.pctVendido}% / {latest.pctPorVender}%
              </span>
              <span className="citrino-kpi-sub">
                Meses para vender el stock: {latest.mesesStockPromedio} meses
              </span>
            </div>
          </div>

          {subPillCuant === 'estadistica' ? (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">
                  Resumen histórico de la oferta ({firstYear} - {lastYear})
                </h3>
                <span className="citrino-card-hint">Cifras por año de censo en Supabase</span>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th className="num">Proyectos</th>
                      <th className="num">Unidades totales</th>
                      <th className="num">Unidades promedio</th>
                      <th className="num">Stock total ($US M)</th>
                      <th className="num">Stock promedio ($US M)</th>
                      <th className="num">% vendido</th>
                      <th className="num">% por vender</th>
                      <th className="num">Meses para vender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((s) => (
                      <tr key={s.ano}>
                        <td>
                          <b>{s.ano}</b>
                        </td>
                        <td className="num">{s.proyectosCensados}</td>
                        <td className="num">{s.undTotales.toLocaleString()}</td>
                        <td className="num">{s.undPromedio}</td>
                        <td className="num">${s.stockTotalUsd} M</td>
                        <td className="num">${s.stockPromedioUsd} M</td>
                        <td className="num" style={{ color: 'var(--text-success)' }}>
                          {s.pctVendido}%
                        </td>
                        <td className="num" style={{ color: 'var(--citrino-orange)' }}>
                          {s.pctPorVender}%
                        </td>
                        <td className="num">{s.mesesStockPromedio} m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">
                  Evolución de unidades totales y volumen de capital ($US millones)
                </h3>
              </div>
              <ReactECharts option={getCuantificacionChart()} style={{ height: 360 }} />
            </div>
          )}

          {/* Stock en unidades y en capital */}
          <div className="citrino-subpills-row" style={{ marginTop: 18 }}>
            <span className="citrino-subpill-label">Stock por vender:</span>
            <button
              className={`citrino-subpill-btn ${subPillStock === 'stock_und' ? 'active' : ''}`}
              onClick={() => setSubPillStock('stock_und')}
            >
              📦 Unidades por vender
            </button>
            <button
              className={`citrino-subpill-btn ${subPillStock === 'stock_usd' ? 'active' : ''}`}
              onClick={() => setSubPillStock('stock_usd')}
            >
              💰 Capital por vender ($US M)
            </button>
          </div>
          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">
                {subPillStock === 'stock_und'
                  ? 'Unidades por vender, por año'
                  : 'Capital por vender, por año ($US millones)'}
              </h3>
              <span className="citrino-card-hint">
                Serie {firstYear} - {lastYear}
              </span>
            </div>
            <div className="citrino-table-wrap">
              <table className="citrino-table">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th className="num">Unidades por vender</th>
                    <th className="num">Capital por vender ($US M)</th>
                    <th className="num">% por vender</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.ano}>
                      <td>{s.ano}</td>
                      <td className="num">
                        <b>{Math.round(s.undTotales * (s.pctPorVender / 100)).toLocaleString()} unidades</b>
                      </td>
                      <td className="num">${Math.round(s.stockTotalUsd * (s.pctPorVender / 100))} M</td>
                      <td className="num">{s.pctPorVender}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribución por etapa comercial */}
          <div className="citrino-charts-grid">
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">
                  Distribución de proyectos por etapa comercial ({lastYear})
                </h3>
              </div>
              <ReactECharts option={getEtapasPieChart()} style={{ height: 320 }} />
            </div>

            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Detalle de etapas comerciales</h3>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Etapa</th>
                      <th className="num">Participación</th>
                      <th className="num">Proyectos</th>
                      <th className="num">Unidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etapasComerciales.map((e) => (
                      <tr key={e.etapa}>
                        <td>
                          <b>{e.etapa}</b>
                        </td>
                        <td className="num">{e.pct}%</td>
                        <td className="num">{e.proyectos}</td>
                        <td className="num">{e.unds.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PESTAÑA 2: EVOLUTIVO PRECIO & RITMO DE VENTA ── */}
      {activeTab === 'precio_ritmo' && (
        <div>
          <div className="citrino-subpills-row">
            <span className="citrino-subpill-label">Ver:</span>
            <button
              className={`citrino-subpill-btn ${subPillRitmo === 'grafico' ? 'active' : ''}`}
              onClick={() => setSubPillRitmo('grafico')}
            >
              📈 Gráfico
            </button>
            <button
              className={`citrino-subpill-btn ${subPillRitmo === 'tabla' ? 'active' : ''}`}
              onClick={() => setSubPillRitmo('tabla')}
            >
              📋 Tabla
            </button>
          </div>

          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card green">
              <span className="citrino-kpi-label">Ritmo de venta actual</span>
              <span className="citrino-kpi-val">{ritmoStats.actual}% / mes</span>
              <span className="citrino-kpi-sub">Corte {ritmoStats.actualPeriodo}</span>
            </div>
            <div className="citrino-kpi-card red">
              <span className="citrino-kpi-label">Mínimo histórico</span>
              <span className="citrino-kpi-val">{ritmoStats.min}% / mes</span>
              <span className="citrino-kpi-sub">Corte {ritmoStats.minPeriodo}</span>
            </div>
            <div className="citrino-kpi-card blue">
              <span className="citrino-kpi-label">Ritmo promedio histórico</span>
              <span className="citrino-kpi-val">{ritmoStats.avg}% / mes</span>
              <span className="citrino-kpi-sub">Promedio de todos los cortes censales</span>
            </div>
          </div>

          {subPillRitmo === 'grafico' ? (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Ritmo de venta mensual (%)</h3>
                <span className="citrino-card-hint">Evolución histórica por corte censal en Supabase</span>
              </div>
              <ReactECharts option={getRitmoChart()} style={{ height: 360 }} />
            </div>
          ) : (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Ritmo de venta por corte</h3>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th className="num">Ritmo de venta (%)</th>
                      <th>Nivel relativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ritmoSerie.map((r) => (
                      <tr key={r.periodo}>
                        <td>{r.periodo}</td>
                        <td className="num">
                          <b>{r.valor}%</b>
                        </td>
                        <td>
                          <div className="citrino-progress-bar">
                            <div
                              className="citrino-progress-fill green"
                              style={{ width: `${Math.min(100, (r.valor / maxRitmoAxis) * 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Brecha cambiaria precio por m² */}
          <div className="citrino-card-box" style={{ marginTop: 18 }}>
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">
                Precio por m² en dólar oficial vs dólar paralelo ($US/m²)
              </h3>
              <span className="citrino-card-hint">
                Diferencia entre el precio por m² oficial y el calculado al tipo de cambio paralelo
              </span>
            </div>
            <ReactECharts option={getBrechaChart()} style={{ height: 380 }} />
          </div>
        </div>
      )}

      {/* ── PESTAÑA 3: EVOLUTIVO POR PROYECTOS ── */}
      {activeTab === 'proyectos' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <div>
              <h3 className="citrino-card-title">
                Condiciones comerciales por proyecto ({proyectosCondiciones.length} proyectos)
              </h3>
              <span className="citrino-card-hint">
                Datos en vivo de proyectos y condiciones financieras en Supabase
              </span>
            </div>
            <input
              type="text"
              placeholder="Buscar proyecto, zona o financiamiento..."
              value={searchProj}
              onChange={(e) => setSearchProj(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: '6px 12px',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-cuerpo)',
              }}
            />
          </div>
          <div className="citrino-table-wrap">
            <table className="citrino-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Zona</th>
                  <th className="num">Cuota inicial</th>
                  <th>Financiamiento ofrecido</th>
                  <th>Etapa actual</th>
                  <th className="num">Ritmo de venta</th>
                </tr>
              </thead>
              <tbody>
                {proyectosCondiciones.slice(0, 150).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.nombre}</b>
                    </td>
                    <td>{p.zona}</td>
                    <td className="num">{p.cuotaIni}</td>
                    <td>{p.financiamiento}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.etapa}</td>
                    <td className="num" style={{ color: 'var(--text-success)' }}>
                      {p.velocidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
