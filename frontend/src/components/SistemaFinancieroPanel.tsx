import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { SISTEMA_FINANCIERO_DATA } from '../data/citrinoDataStudioData'

interface Props {
  initialChapter?: '3.1' | '3.2'
}

export default function SistemaFinancieroPanel({ initialChapter = '3.1' }: Props) {
  const [activeChapter, setActiveChapter] = useState<'3.1' | '3.2'>(initialChapter)

  // Sub-pills auditados en Looker Studio para Mora (3.2)
  const [moraHipotecariaPill, setMoraHipotecariaPill] = useState<'monto' | 'ratio'>('monto')
  const [moraConstruccionPill, setMoraConstruccionPill] = useState<'porcentajes' | 'monto'>('porcentajes')

  const { carteraHipotecaria, moraHipotecaria, moraConstruccion } = SISTEMA_FINANCIERO_DATA

  // Chart Option: Cartera Hipotecaria vs VIS (2015 - 2026)
  const getCarteraChart = () => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#94a3b8' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: carteraHipotecaria.map((c) => c.periodo),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      name: 'Millones $US',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        name: 'Cartera Hipotecaria Total',
        type: 'line',
        smooth: true,
        data: carteraHipotecaria.map((c) => c.totalUsd),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
      {
        name: 'Vivienda Social (VIS Regualada)',
        type: 'line',
        smooth: true,
        data: carteraHipotecaria.map((c) => c.visUsd),
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3, type: 'dashed' },
      },
    ],
  })

  // Chart Option: Mora Hipotecaria Monto USD (Reprogramada vs No Reprogramada)
  const getMoraHipotecariaMontoChart = () => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: '#94a3b8' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: moraHipotecaria.serie.map((s) => s.periodo),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      name: 'Millones $US en Mora',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        name: 'Mora Reprogramada',
        type: 'bar',
        stack: 'total',
        data: moraHipotecaria.serie.map((s) => s.reprogramadaUsd),
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: 'Mora Vencida No Reprogramada',
        type: 'bar',
        stack: 'total',
        data: moraHipotecaria.serie.map((s) => s.noReprogramadaUsd),
        itemStyle: { color: '#ef4444' },
      },
    ],
  })

  // Chart Option: Mora Construcción Porcentajes vs Monto
  const getMoraConstruccionChart = () => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: moraConstruccion.serie.map((s) => s.periodo),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      name: moraConstruccionPill === 'porcentajes' ? 'Tasa de Mora (%)' : 'Millones $US',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        name: moraConstruccionPill === 'porcentajes' ? 'Ratio de Mora Constructora' : 'Monto en Mora ($US M)',
        type: 'line',
        smooth: true,
        data: moraConstruccion.serie.map((s) => (moraConstruccionPill === 'porcentajes' ? s.ratioPct : s.montoUsd)),
        itemStyle: { color: '#ff6b00' },
        lineStyle: { width: 3 },
      },
    ],
  })

  return (
    <div className="citrino-panel-wrap">
      {/* Header */}
      <div className="citrino-panel-header">
        <div className="citrino-title-area">
          <div className="citrino-badge-row">
            <span className="citrino-badge">Módulo 06</span>
            <span className="citrino-sample-badge">Finanzas Bancarias ASFI / ASOBAN</span>
          </div>
          <h1 className="citrino-panel-title">Sistema Financiero y Liquidez Hipotecaria</h1>
          <p className="citrino-panel-subtitle">
            Cartera de crédito inmobiliario, Vivienda Social (VIS), ratios de morosidad y estrés crediticio en la construcción.
          </p>
        </div>
      </div>

      {/* Selector de Capítulo */}
      <div className="citrino-nav-pills">
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '3.1' ? 'active' : ''}`}
          onClick={() => setActiveChapter('3.1')}
        >
          3.1 Financiamiento al Sector Inmobiliario
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '3.2' ? 'active' : ''}`}
          onClick={() => setActiveChapter('3.2')}
        >
          3.2 Evolución y Análisis de la Mora
        </button>
      </div>

      {/* ── 3.1 FINANCIAMIENTO SECTOR INMOBILIARIO ── */}
      {activeChapter === '3.1' && (
        <div>
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card blue">
              <span className="citrino-kpi-label">Cartera Hipotecaria Total</span>
              <span className="citrino-kpi-val">$7.820 M USD</span>
              <span className="citrino-kpi-sub">Estancamiento relativo 2024-2026</span>
            </div>
            <div className="citrino-kpi-card green">
              <span className="citrino-kpi-label">Cartera VIS Regulada</span>
              <span className="citrino-kpi-val">$5.320 M USD</span>
              <span className="citrino-kpi-sub">68% del saldo hipotecario nacional</span>
            </div>
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Crédito a la Construcción</span>
              <span className="citrino-kpi-val">$2.140 M USD</span>
              <span className="citrino-kpi-sub">54% concentrado en Santa Cruz</span>
            </div>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Evolución de la Cartera Hipotecaria Total vs Cartera VIS (2015 - 2026)</h3>
              <span className="citrino-card-hint">Expresado en Millones de $US</span>
            </div>
            <ReactECharts option={getCarteraChart()} style={{ height: 350 }} />
          </div>
        </div>
      )}

      {/* ── 3.2 ANÁLISIS DE LA MORA ── */}
      {activeChapter === '3.2' && (
        <div>
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card amber">
              <span className="citrino-kpi-label">Mora Hipotecaria Total</span>
              <span className="citrino-kpi-val">$132 M USD</span>
              <span className="citrino-kpi-sub">Ratio del 3.2% de la cartera</span>
            </div>
            <div className="citrino-kpi-card red">
              <span className="citrino-kpi-label">Mora Reprogramada Hipotecaria</span>
              <span className="citrino-kpi-val">$75.2 M USD</span>
              <span className="citrino-kpi-sub">57% de la morosidad total</span>
            </div>
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Mora Sector Construcción</span>
              <span className="citrino-kpi-val">$47 M USD</span>
              <span className="citrino-kpi-sub">Casi 90% es cartera reprogramada</span>
            </div>
          </div>

          <div className="citrino-charts-grid">
            {/* 02-A Mora Hipotecaria con Sub-pill Monto USD */}
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <div>
                  <h3 className="citrino-card-title">02-A Mora Hipotecaria: Desglose por Tipo</h3>
                  <span className="citrino-card-hint">Mora Reprogramada vs Mora Vencida Pura</span>
                </div>
                <div className="citrino-subpills-row" style={{ margin: 0 }}>
                  <button
                    className={`citrino-subpill-btn ${moraHipotecariaPill === 'monto' ? 'active' : ''}`}
                    onClick={() => setMoraHipotecariaPill('monto')}
                  >
                    💵 Monto en USD
                  </button>
                </div>
              </div>
              <ReactECharts option={getMoraHipotecariaMontoChart()} style={{ height: 320 }} />
            </div>

            {/* 02-B Mora de la Construcción con Sub-pills Porcentajes y Monto en USD */}
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <div>
                  <h3 className="citrino-card-title">02-B Mora de la Construcción</h3>
                  <span className="citrino-card-hint">Evolución de estrés crediticio promotor</span>
                </div>
                <div className="citrino-subpills-row" style={{ margin: 0 }}>
                  <button
                    className={`citrino-subpill-btn ${moraConstruccionPill === 'porcentajes' ? 'active' : ''}`}
                    onClick={() => setMoraConstruccionPill('porcentajes')}
                  >
                    % Porcentajes
                  </button>
                  <button
                    className={`citrino-subpill-btn ${moraConstruccionPill === 'monto' ? 'active' : ''}`}
                    onClick={() => setMoraConstruccionPill('monto')}
                  >
                    💵 Monto USD
                  </button>
                </div>
              </div>
              <ReactECharts option={getMoraConstruccionChart()} style={{ height: 320 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
