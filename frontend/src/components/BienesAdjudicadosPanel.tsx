import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { BIENES_ADJUDICADOS_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import { fetchBienesAdjudicadosLive, matchCiudad } from '../lib/supabase'
import TopTabBar from './TopTabBar'

type SubTab = 'remates' | 'adjudicados'

interface Props {
  ciudad?: string
  tipoInmuebleFilter?: string
}

export default function BienesAdjudicadosPanel({ ciudad = 'SCZ', tipoInmuebleFilter = 'ALL' }: Props) {
  const ct = useChartTheme()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('remates')
  // Sub-pill auditado de Data Studio: Mensual vs Anual
  const [subPillAdjudicados, setSubPillAdjudicados] = useState<'mensual' | 'anual'>('mensual')
  const [liveData, setLiveData] = useState<{ adjudicados: any[]; remates: any[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBienesAdjudicadosLive().then((res) => {
      if (!cancelled && res.hasLiveRows) {
        setLiveData({ adjudicados: res.adjudicados, remates: res.remates })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { rematesMensuales, adjudicadosAsfiAnual, adjudicadosAsfiMensual } = useMemo(() => {
    if (!liveData) return BIENES_ADJUDICADOS_DATA

    // 1. Remates judiciales (11.575 registros con departamento, fecha_snapshot, precio_usd, precio_original_usd, rebaja)
    const filteredRemates = liveData.remates.filter((r: any) => {
      if (ciudad && ciudad !== 'ALL') {
        if (!matchCiudad(r.departamento ?? r.ciudad, ciudad)) return false
      }
      if (tipoInmuebleFilter && tipoInmuebleFilter !== 'ALL') {
        const fTipo = tipoInmuebleFilter.trim().toLowerCase()
        const rTipo = String(r.tipo_inmueble ?? '').trim().toLowerCase()
        if (!rTipo.includes(fTipo) && !fTipo.includes(rTipo)) return false
      }
      return true
    })

    const rematesMap = new Map<string, { usd: number; descuentos: number[] }>()
    for (const r of filteredRemates) {
      const mes = String(r.fecha_snapshot ?? r.periodo ?? r.fecha ?? '').slice(0, 7)
      const precio = Number(r.precio_usd ?? r.volumen_usd ?? 0)
      const orig = Number(r.precio_original_usd ?? 0)
      const rebajaRaw = Number(r.rebaja ?? 0)
      if (!/^\d{4}-\d{2}$/.test(mes) || precio <= 0 || precio > 20_000_000) continue
      const prev = rematesMap.get(mes) ?? { usd: 0, descuentos: [] }
      prev.usd += precio
      if (rebajaRaw > 0 && rebajaRaw <= 100) {
        prev.descuentos.push(rebajaRaw <= 1 ? rebajaRaw * 100 : rebajaRaw)
      } else if (orig > precio && orig > 0) {
        prev.descuentos.push(((orig - precio) / orig) * 100)
      }
      rematesMap.set(mes, prev)
    }

    const rematesLive = Array.from(rematesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([periodo, v], idx, arr) => {
        const avgDesc =
          v.descuentos.length > 0
            ? Math.round((v.descuentos.reduce((s, x) => s + x, 0) / v.descuentos.length) * 10) / 10
            : BIENES_ADJUDICADOS_DATA.rematesMensuales[idx % BIENES_ADJUDICADOS_DATA.rematesMensuales.length]?.tasaDescuento ?? 10.5
        void arr
        return {
          periodo,
          volumenUsd: Math.round((v.usd / 1_000_000) * 10) / 10,
          tasaDescuento: avgDesc,
        }
      })
      .filter((r) => r.volumenUsd > 0)

    // 2. Bienes adjudicados (158 registros con fecha y monto_bs en Bs)
    const sortedAdj = [...liveData.adjudicados]
      .filter((a: any) => a.fecha && Number(a.monto_bs ?? 0) > 0)
      .sort((a: any, b: any) => String(a.fecha).localeCompare(String(b.fecha)))

    const adjPorAno = new Map<string, number>()
    for (const a of sortedAdj) {
      const ano = String(a.fecha).slice(0, 4)
      const rawBs = Number(a.monto_bs ?? 0)
      const millonesBs = rawBs > 100_000 ? Math.round(rawBs / 1_000_000) : Math.round(rawBs)
      if (/^\d{4}$/.test(ano) && millonesBs > 0) {
        adjPorAno.set(ano, millonesBs)
      }
    }

    const adjAnualLive = Array.from(adjPorAno.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, valorBs]) => ({ periodo, valorBs }))

    const adjMensualLive = sortedAdj
      .filter((a: any) => String(a.fecha) >= '2022-12-01')
      .map((a: any) => {
        const rawBs = Number(a.monto_bs ?? 0)
        const millonesBs = rawBs > 100_000 ? Math.round(rawBs / 1000_000) : Math.round(rawBs)
        return {
          periodo: String(a.fecha).slice(0, 7),
          valorBs: millonesBs,
        }
      })
      .filter((a) => a.periodo && a.valorBs > 0)

    return {
      rematesMensuales: rematesLive.length > 0 ? rematesLive : BIENES_ADJUDICADOS_DATA.rematesMensuales,
      adjudicadosAsfiAnual: adjAnualLive.length > 0 ? adjAnualLive : BIENES_ADJUDICADOS_DATA.adjudicadosAsfiAnual,
      adjudicadosAsfiMensual: adjMensualLive.length > 0 ? adjMensualLive : BIENES_ADJUDICADOS_DATA.adjudicadosAsfiMensual,
    }
  }, [liveData, ciudad, tipoInmuebleFilter])

  const latestAdjBs = adjudicadosAsfiAnual[adjudicadosAsfiAnual.length - 1]?.valorBs ?? 1288
  const latestRemateUsd = rematesMensuales[rematesMensuales.length - 1]?.volumenUsd ?? 79
  const maxRemate = rematesMensuales.reduce(
    (best, r) => (r.volumenUsd > best.volumenUsd ? r : best),
    rematesMensuales[0] ?? { periodo: '2025-06', volumenUsd: 87, tasaDescuento: 10.8 }
  )
  const latestDesc = rematesMensuales[rematesMensuales.length - 1]?.tasaDescuento ?? 10.8

  // Chart Option: Remates Judiciales (Volumen $US M y Tasa de Descuento %)
  const getRematesChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: rematesMensuales.map((r) => r.periodo),
      axisLabel: { color: ct.muted },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Volumen ($US M)',
        axisLabel: { color: '#ef4444' },
        splitLine: { lineStyle: { color: ct.grid } },
      },
      {
        type: 'value',
        name: 'Descuento (%)',
        axisLabel: { color: '#f59e0b', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Volumen en Remate ($US M)',
        type: 'bar',
        data: rematesMensuales.map((r) => r.volumenUsd),
        itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Descuento Medio s/Avalúo (%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: rematesMensuales.map((r) => r.tasaDescuento),
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 },
      },
    ],
  })

  // Chart Option: Adjudicados Anual ASFI 2003-2026
  const getAdjudicadosAnualChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].name}<br/><b>Saldo Adjudicados: ${params[0].value} Millones Bs.</b>`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: adjudicadosAsfiAnual.map((a) => a.periodo),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: 'Millones de Bs.',
      axisLabel: { color: ct.muted },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Saldo Bienes Adjudicados',
        type: 'line',
        smooth: true,
        data: adjudicadosAsfiAnual.map((a) => a.valorBs),
        itemStyle: { color: '#ff6b00' },
        lineStyle: { width: 3, color: '#ff6b00' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 107, 0, 0.4)' },
              { offset: 1, color: 'rgba(255, 107, 0, 0.0)' },
            ],
          },
        },
        markPoint: {
          data: [
            { name: 'Crisis 2003 (1.344M Bs)', coord: ['2003', 1344], itemStyle: { color: '#ef4444' } },
            { name: 'Pico 2026 (1.288M Bs)', coord: ['2026', 1288], itemStyle: { color: '#ef4444' } },
          ],
        },
      },
    ],
  })

  // Chart Option: Adjudicados Mensual dic-2022 a mar-2026
  const getAdjudicadosMensualChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: adjudicadosAsfiMensual.map((m) => m.periodo),
      axisLabel: { color: ct.muted, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'Millones de Bs.',
      min: 400,
      max: 1400,
      axisLabel: { color: ct.muted },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Bienes Adjudicados ASFI (Bs M)',
        type: 'line',
        smooth: true,
        data: adjudicadosAsfiMensual.map((m) => m.valorBs),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
    ],
  })

  return (
    <div className="citrino-panel-wrap">
      {/* Pestañas superiores */}
      <TopTabBar
        tabs={[
          { label: 'Remates Judiciales', active: activeSubTab === 'remates', onClick: () => setActiveSubTab('remates') },
          { label: 'Bienes Adjudicados', active: activeSubTab === 'adjudicados', onClick: () => setActiveSubTab('adjudicados') },
        ]}
      />

      {/* KPIs Grid */}
      <div className="citrino-kpis-grid">
        <div className="citrino-kpi-card amber">
          <span className="citrino-kpi-label">Saldo Adjudicados ASFI (2026)</span>
          <span className="citrino-kpi-val">{latestAdjBs.toLocaleString('es-BO')} M Bs</span>
          <span className="citrino-kpi-sub">Similar a crisis de 2003 (1.344 M Bs)</span>
        </div>
        <div className="citrino-kpi-card blue">
          <span className="citrino-kpi-label">Volumen en Remate Judicial</span>
          <span className="citrino-kpi-val">${latestRemateUsd} M USD</span>
          <span className="citrino-kpi-sub">Pico registrado: ${maxRemate.volumenUsd}M en {maxRemate.periodo}</span>
        </div>
        <div className="citrino-kpi-card purple">
          <span className="citrino-kpi-label">Descuento Judicial Promedio</span>
          <span className="citrino-kpi-val">{latestDesc}%</span>
          <span className="citrino-kpi-sub">Sobre avalúo pericial regulado</span>
        </div>
      </div>

      {/* ── BIENES ADJUDICADOS ASFI ── */}
      {activeSubTab === 'adjudicados' && (
        <div>
          {/* Sub-pill (auditado de Looker Studio: Mensual vs Anual) */}
          <div className="citrino-subpills-row">
            <span className="citrino-subpill-label">Periodicidad:</span>
            <button
              className={`citrino-subpill-btn ${subPillAdjudicados === 'mensual' ? 'active' : ''}`}
              onClick={() => setSubPillAdjudicados('mensual')}
            >
              📅 Mensual (dic-2022 a mar-2026)
            </button>
            <button
              className={`citrino-subpill-btn ${subPillAdjudicados === 'anual' ? 'active' : ''}`}
              onClick={() => setSubPillAdjudicados('anual')}
            >
              🏛️ Anual histórica (2003 - 2026)
            </button>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">
                {subPillAdjudicados === 'mensual'
                  ? 'Bienes adjudicados por mes (dic-2022 a mar-2026)'
                  : 'Bienes adjudicados por año en el sistema bancario (2003 - 2026)'}
              </h3>
              <span className="citrino-card-hint">Expresado en Millones de Bolivianos (Bs)</span>
            </div>

            {subPillAdjudicados === 'mensual' ? (
              <ReactECharts option={getAdjudicadosMensualChart()} style={{ height: 350 }} />
            ) : (
              <ReactECharts option={getAdjudicadosAnualChart()} style={{ height: 350 }} />
            )}
          </div>
        </div>
      )}

      {/* ── 04-A REMATES JUDICIALES ── */}
      {activeSubTab === 'remates' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <h3 className="citrino-card-title">Volumen de remates y descuento sobre avalúo</h3>
            <span className="citrino-card-hint">Presión de liquidación forzosa en estrados judiciales</span>
          </div>
          <ReactECharts option={getRematesChart()} style={{ height: 360 }} />
        </div>
      )}
    </div>
  )
}
