import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { CICLO_INMOBILIARIO_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import { fetchCicloInmobiliarioLive, matchCiudad } from '../lib/supabase'
import TopTabBar from './TopTabBar'

interface Props {
  ciudad?: string
}

export default function CicloInmobiliarioPanel({ ciudad = 'SCZ' }: Props) {
  const ct = useChartTheme()
  const [activeSubTab, setActiveSubTab] = useState<'reloj' | 'alquileres'>('reloj')
  const [liveData, setLiveData] = useState<Awaited<ReturnType<typeof fetchCicloInmobiliarioLive>> | null>(null)
  const cityLabel =
    ciudad === 'LPZ' ? 'La Paz' : ciudad === 'CBB' ? 'Cochabamba' : ciudad === 'SCZ' ? 'Santa Cruz' : 'Bolivia'

  useEffect(() => {
    let cancelled = false
    fetchCicloInmobiliarioLive().then((res) => {
      if (!cancelled && res.hasLiveRows) {
        setLiveData(res)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { tasaEquilibrio, faseActual, fases, serieHistoricaOcupacion } = useMemo(() => {
    if (!liveData || !liveData.hasLiveRows) return CICLO_INMOBILIARIO_DATA

    // Agrupar ind_alquileres (315 filas: fecha, valor_promedio_alquiler, var_anual, ciudad) filtrado por ciudad
    const alqPorAno = new Map<string, number[]>()
    for (const r of liveData.alquileres) {
      if (ciudad && ciudad !== 'ALL' && !matchCiudad(r.ciudad, ciudad)) continue
      const ano = String(r.fecha ?? '').slice(0, 4)
      const varAnualRaw = r.var_anual
      if (!/^\d{4}$/.test(ano) || varAnualRaw == null || isNaN(Number(varAnualRaw))) continue
      const pct = Math.abs(Number(varAnualRaw)) <= 1.5 ? Number(varAnualRaw) * 100 : Number(varAnualRaw)
      const arr = alqPorAno.get(ano) ?? []
      arr.push(pct)
      alqPorAno.set(ano, arr)
    }

    const baseMap = new Map<string, { ano: string; ocupacion: number; alquilerVar: number }>()
    for (const s of CICLO_INMOBILIARIO_DATA.serieHistoricaOcupacion) {
      baseMap.set(s.ano, { ...s })
    }

    for (const [ano, arr] of alqPorAno.entries()) {
      if (arr.length === 0) continue
      const avgVar = Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10
      const existing = baseMap.get(ano)
      if (existing) {
        existing.alquilerVar = avgVar
      } else {
        baseMap.set(ano, {
          ano,
          ocupacion: Number(ano) >= 2024 ? 93.2 : 94.0,
          alquilerVar: avgVar,
        })
      }
    }

    const serieCombinada = Array.from(baseMap.values()).sort((a, b) => a.ano.localeCompare(b.ano))

    return {
      ...CICLO_INMOBILIARIO_DATA,
      serieHistoricaOcupacion:
        serieCombinada.length > 0 ? serieCombinada : CICLO_INMOBILIARIO_DATA.serieHistoricaOcupacion,
    }
  }, [liveData, ciudad])

  // Chart Option: Gauge Reloj del Ciclo Inmobiliario
  const getClockGaugeChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '70%'],
        radius: '90%',
        min: 90,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.35, '#ef4444'], // Ajuste / Recesión (< 93.5%)
              [0.58, '#f59e0b'], // Recuperación (93.5% - 95.8%)
              [0.85, '#10b981'], // Expansión (95.8% - 98.5%)
              [1, '#38bdf8'],    // Sobreoferta
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0L12,0.7z',
          length: '65%',
          width: 8,
          offsetCenter: [0, '-10%'],
          itemStyle: { color: '#ff6b00' },
        },
        axisTick: { length: 8, lineStyle: { color: 'auto', width: 1 } },
        splitLine: { length: 14, lineStyle: { color: 'auto', width: 2 } },
        axisLabel: { color: ct.muted, fontSize: 11, distance: -40, formatter: '{value}%' },
        title: { offsetCenter: [0, '25%'], fontSize: 13, color: ct.text, fontWeight: 600 },
        detail: {
          fontSize: 22,
          offsetCenter: [0, '-15%'],
          valueAnimation: true,
          formatter: '{value}%',
          color: ct.text,
          fontWeight: 700,
        },
        data: [{ value: faseActual.ocupacionActual, name: 'Ocupación 2026' }],
      },
    ],
  })

  // Chart Option: Serie Histórica 2002-2026 vs Equilibrio
  const getSerieOcupacionChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: serieHistoricaOcupacion.map((s) => s.ano),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: 'Tasa de Ocupación (%)',
      min: 90,
      max: 100,
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Ocupación Real',
        type: 'line',
        smooth: true,
        data: serieHistoricaOcupacion.map((s) => s.ocupacion),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
        markLine: {
          silent: true,
          lineStyle: { color: '#10b981', type: 'dashed', width: 2 },
          data: [{ yAxis: tasaEquilibrio, name: 'Equilibrio Histórico (95.8%)' }],
          label: { color: '#10b981', formatter: 'Equilibrio 95.8%' },
        },
      },
    ],
  })

  // Chart Option: Variación Alquileres a Largo Plazo
  const getAlquileresChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: serieHistoricaOcupacion.map((s) => s.ano),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: 'Variación Anual Alquiler (%)',
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Variación Alquiler Real',
        type: 'bar',
        data: serieHistoricaOcupacion.map((s) => ({
          value: s.alquilerVar,
          itemStyle: {
            color: s.alquilerVar >= 0 ? '#10b981' : '#ef4444',
            borderRadius: s.alquilerVar >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
          },
        })),
      },
    ],
  })

  return (
    <div className="citrino-panel-wrap">
      {/* Pestañas superiores */}
      <TopTabBar
        tabs={[
          { label: 'Tasa de Ocupación', active: activeSubTab === 'reloj', onClick: () => setActiveSubTab('reloj') },
          { label: 'Variación de Alquileres', active: activeSubTab === 'alquileres', onClick: () => setActiveSubTab('alquileres') },
        ]}
      />

      {/* KPIs Grid */}
      <div className="citrino-kpis-grid">
        <div className="citrino-kpi-card amber">
          <span className="citrino-kpi-label">Fase Actual del Ciclo</span>
          <span className="citrino-kpi-val">{faseActual.nombre}</span>
          <span className="citrino-kpi-sub">Fase 4: Ocupación bajo media</span>
        </div>
        <div className="citrino-kpi-card green">
          <span className="citrino-kpi-label">Equilibrio Histórico</span>
          <span className="citrino-kpi-val">{tasaEquilibrio}%</span>
          <span className="citrino-kpi-sub">Media de largo plazo (2002-2026)</span>
        </div>
        <div className="citrino-kpi-card blue">
          <span className="citrino-kpi-label">Ocupación Actual (2026)</span>
          <span className="citrino-kpi-val">{faseActual.ocupacionActual}%</span>
          <span className="citrino-kpi-sub">Brecha de -2.8% vs equilibrio</span>
        </div>
      </div>

      {activeSubTab === 'reloj' && (
        <div className="citrino-charts-grid">
          {/* Reloj Gauge */}
          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Reloj del Ciclo Físico de Santa Cruz</h3>
            </div>
            <ReactECharts option={getClockGaugeChart()} style={{ height: 260 }} />
            {/* Leyenda de zonas del reloj: nombre y rango, para no depender solo del color */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', justifyContent: 'center', margin: '4px 0 10px', fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)' }}>
              {[
                { color: '#ef4444', label: 'Ajuste / Recesión (< 93,5 %)' },
                { color: '#f59e0b', label: 'Recuperación (93,5 – 95,8 %)' },
                { color: '#10b981', label: 'Expansión (95,8 – 98,5 %)' },
                { color: '#38bdf8', label: 'Sobreoferta (> 98,5 %)' },
              ].map((z) => (
                <span key={z.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: z.color, flexShrink: 0 }} />
                  {z.label}
                </span>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6, fontSize: 'var(--fs-cuerpo)', color: 'var(--text-muted)' }}>
              <b>Diagnóstico:</b> {faseActual.diagnostico}
            </div>
          </div>

          {/* Serie 2002-2026 */}
          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Evolución de la Tasa de Ocupación vs Equilibrio Histórico (95.8%)</h3>
            </div>
            <ReactECharts option={getSerieOcupacionChart()} style={{ height: 320 }} />
          </div>
        </div>
      )}

      {activeSubTab === 'alquileres' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <h3 className="citrino-card-title">Variación anual del precio real de alquiler — {cityLabel} (2002 - 2026)</h3>
            <span className="citrino-card-hint">Cambio de un año a otro, descontando la inflación</span>
          </div>
          <ReactECharts option={getAlquileresChart()} style={{ height: 350 }} />
        </div>
      )}

      {/* Tabla explicativa de las 4 fases */}
      <div className="citrino-card-box">
        <div className="citrino-card-header">
          <h3 className="citrino-card-title">Las 4 fases históricas del ciclo en Santa Cruz</h3>
        </div>
        <div className="citrino-table-wrap">
          <table className="citrino-table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>Periodo</th>
                <th>Nivel de ocupación</th>
                <th>Comportamiento de Mercado</th>
              </tr>
            </thead>
            <tbody>
              {fases.map((f) => (
                <tr key={f.fase}>
                  <td><b>{f.fase}</b></td>
                  <td>{f.periodo}</td>
                  <td style={{ color: 'var(--citrino-sky)' }}>{f.ocupacionRango}</td>
                  <td>{f.caracteristica}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
