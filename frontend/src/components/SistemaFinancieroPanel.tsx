import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { SISTEMA_FINANCIERO_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import TopTabBar from './TopTabBar'

interface Props {
  initialChapter?: '3.1' | '3.2'
}

export default function SistemaFinancieroPanel({ initialChapter = '3.1' }: Props) {
  const ct = useChartTheme()
  const [activeChapter] = useState<'3.1' | '3.2'>(initialChapter)
  // Pestaña activa dentro del capítulo: "uno" = primera pestaña, "dos" = segunda
  const [tab, setTab] = useState<'uno' | 'dos'>('uno')

  // Sub-pills de Mora
  const [moraHipotecariaPill, setMoraHipotecariaPill] = useState<'monto' | 'ratio'>('monto')
  const [moraConstruccionPill, setMoraConstruccionPill] = useState<'porcentajes' | 'monto'>('porcentajes')

  const { carteraHipotecaria, moraHipotecaria, moraConstruccion } = SISTEMA_FINANCIERO_DATA

  // Chart Option: Cartera Hipotecaria vs Vivienda Social (2015 - 2026)
  const getCarteraChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: carteraHipotecaria.map((c) => c.periodo),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: 'Millones $US',
      axisLabel: { color: ct.muted },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Cartera hipotecaria total',
        type: 'line',
        smooth: true,
        data: carteraHipotecaria.map((c) => c.totalUsd),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
      {
        name: 'Vivienda social regulada (VIS)',
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
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: moraHipotecaria.serie.map((s) => s.periodo),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: 'Millones $US en Mora',
      axisLabel: { color: ct.muted },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Mora reprogramada',
        type: 'bar',
        stack: 'total',
        data: moraHipotecaria.serie.map((s) => s.reprogramadaUsd),
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: 'Mora vencida no reprogramada',
        type: 'bar',
        stack: 'total',
        data: moraHipotecaria.serie.map((s) => s.noReprogramadaUsd),
        itemStyle: { color: '#ef4444' },
      },
    ],
  })

  // Chart Option: Mora Construcción Porcentajes vs Monto
  const getMoraConstruccionChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: moraConstruccion.serie.map((s) => s.periodo),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: moraConstruccionPill === 'porcentajes' ? 'Tasa de mora (%)' : 'Millones $US',
      axisLabel: { color: ct.muted },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: moraConstruccionPill === 'porcentajes' ? 'Tasa de mora de constructoras' : 'Monto en mora ($US M)',
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
      {/* ── CAPÍTULO 3.1: FINANCIAMIENTO AL SECTOR INMOBILIARIO ── */}
      {activeChapter === '3.1' && (
        <TopTabBar
          tabs={[
            { label: 'Evolución del Crédito Hipotecario', active: tab === 'uno', onClick: () => setTab('uno') },
            { label: 'La Construcción y su Financiamiento', active: tab === 'dos', onClick: () => setTab('dos') },
          ]}
        />
      )}

      {activeChapter === '3.1' && tab === 'uno' && (
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
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Cartera hipotecaria total vs vivienda social (2015 - 2026)</h3>
              <span className="citrino-card-hint">Expresado en millones de $US</span>
            </div>
            <ReactECharts option={getCarteraChart()} style={{ height: 350 }} />
          </div>
        </div>
      )}

      {activeChapter === '3.1' && tab === 'dos' && (
        <div>
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Crédito a la Construcción</span>
              <span className="citrino-kpi-val">$2.140 M USD</span>
              <span className="citrino-kpi-sub">Saldo actual de préstamos a constructoras</span>
            </div>
            <div className="citrino-kpi-card amber">
              <span className="citrino-kpi-label">Concentración en Santa Cruz</span>
              <span className="citrino-kpi-val">54%</span>
              <span className="citrino-kpi-sub">Del crédito a la construcción</span>
            </div>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Evolución del crédito a la construcción</h3>
              <span className="citrino-card-hint">Serie histórica pendiente de carga</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-cuerpo)', margin: '8px 0 0' }}>
              Todavía no hay datos históricos de este indicador en la plataforma. Cuando se carguen, aparecerán aquí.
            </p>
          </div>
        </div>
      )}

      {/* ── CAPÍTULO 3.2: EVOLUCIÓN DE LA MORA ── */}
      {activeChapter === '3.2' && (
        <TopTabBar
          tabs={[
            { label: 'Mora Hipotecaria', active: tab === 'uno', onClick: () => setTab('uno') },
            { label: 'Mora de la Construcción', active: tab === 'dos', onClick: () => setTab('dos') },
          ]}
        />
      )}

      {activeChapter === '3.2' && tab === 'uno' && (
        <div>
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card amber">
              <span className="citrino-kpi-label">Mora Hipotecaria Total</span>
              <span className="citrino-kpi-val">$132 M USD</span>
              <span className="citrino-kpi-sub">Tasa del 3.2% de la cartera</span>
            </div>
            <div className="citrino-kpi-card red">
              <span className="citrino-kpi-label">Mora Reprogramada Hipotecaria</span>
              <span className="citrino-kpi-val">$75.2 M USD</span>
              <span className="citrino-kpi-sub">57% de la mora total</span>
            </div>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <div>
                <h3 className="citrino-card-title">Mora hipotecaria por tipo</h3>
                <span className="citrino-card-hint">Mora reprogramada vs mora vencida sin reprogramar</span>
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
        </div>
      )}

      {activeChapter === '3.2' && tab === 'dos' && (
        <div>
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Mora Sector Construcción</span>
              <span className="citrino-kpi-val">$47 M USD</span>
              <span className="citrino-kpi-sub">Casi 90% es cartera reprogramada</span>
            </div>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <div>
                <h3 className="citrino-card-title">Mora de la construcción</h3>
                <span className="citrino-card-hint">Cómo evoluciona el atraso de pagos de las constructoras</span>
              </div>
              <div className="citrino-subpills-row" style={{ margin: 0 }}>
                <button
                  className={`citrino-subpill-btn ${moraConstruccionPill === 'porcentajes' ? 'active' : ''}`}
                  onClick={() => setMoraConstruccionPill('porcentajes')}
                >
                  % Tasa
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
      )}
    </div>
  )
}
