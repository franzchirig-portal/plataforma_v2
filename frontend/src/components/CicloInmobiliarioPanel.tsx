import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { CICLO_INMOBILIARIO_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'

export default function CicloInmobiliarioPanel() {
  const ct = useChartTheme()
  const [activeSubTab, setActiveSubTab] = useState<'reloj' | 'alquileres'>('reloj')
  const { tasaEquilibrio, faseActual, fases, serieHistoricaOcupacion } = CICLO_INMOBILIARIO_DATA

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
          fontSize: 24,
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
      {/* Header */}
      <div className="citrino-panel-header">
        <div className="citrino-title-area">
          <div className="citrino-badge-row">
            <span className="citrino-badge">Módulo 07</span>
            <span className="citrino-sample-badge">Modelo Econométrico Glenn Mueller 2002 - 2026</span>
          </div>
          <h1 className="citrino-panel-title">Ciclo Inmobiliario Físico Residencial</h1>
          <p className="citrino-panel-subtitle">
            Reloj del ciclo inmobiliario cruceño, tasa de ocupación de largo plazo y variación de precios de alquiler residencial.
          </p>
        </div>
      </div>

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

      {/* Nav Pills */}
      <div className="citrino-nav-pills">
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'reloj' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('reloj')}
        >
          ⏰ Reloj del Ciclo y Ocupación
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'alquileres' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('alquileres')}
        >
          🏠 Variación de Alquileres a Largo Plazo
        </button>
      </div>

      {activeSubTab === 'reloj' && (
        <div className="citrino-charts-grid">
          {/* Reloj Gauge */}
          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Reloj del Ciclo Físico de Santa Cruz</h3>
            </div>
            <ReactECharts option={getClockGaugeChart()} style={{ height: 260 }} />
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
            <h3 className="citrino-card-title">Variación Anual de Precios Reales de Alquiler Residencial (2002 - 2026)</h3>
            <span className="citrino-card-hint">Tasa de variación interanual deflactada</span>
          </div>
          <ReactECharts option={getAlquileresChart()} style={{ height: 350 }} />
        </div>
      )}

      {/* Tabla explicativa de las 4 fases */}
      <div className="citrino-card-box">
        <div className="citrino-card-header">
          <h3 className="citrino-card-title">Las 4 Fases Históricas del Ciclo Inmobiliario Cruceño</h3>
        </div>
        <div className="citrino-table-wrap">
          <table className="citrino-table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>Periodo</th>
                <th>Rango de Ocupación</th>
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
