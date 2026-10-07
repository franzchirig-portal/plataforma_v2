import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { MARKETPLACE_DATA } from '../data/citrinoDataStudioData'

type SubTab = 'stock' | 'zonificacion' | 'evolutivo'

export default function MarketplaceParticularesPanel() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('stock')
  const { kpis, tipologias, zonas, serieMensual } = MARKETPLACE_DATA

  // Chart Option: Zonificación Barras Horizontales
  const getZonificacionChart = () => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: [...zonas].reverse().map((z) => z.zona),
      axisLabel: { color: '#cbd5e1' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
    },
    series: [
      {
        name: 'Participación',
        type: 'bar',
        data: [...zonas].reverse().map((z) => z.pct),
        itemStyle: { color: '#38bdf8', borderRadius: [0, 4, 4, 0] },
      },
    ],
  })

  // Chart Option: Evolutivo Mensual (Unidades vs $US M)
  const getEvolutivoChart = () => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#94a3b8' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: serieMensual.map((p) => p.periodo),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Unidades',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      {
        type: 'value',
        name: 'Millones $US',
        axisLabel: { color: '#ff6b00' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Unidades en Reventa',
        type: 'bar',
        data: serieMensual.map((p) => p.valor),
        itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Volumen ($US M)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: serieMensual.map((p) => p.secundario),
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
            <span className="citrino-badge">Módulo 03</span>
            <span className="citrino-sample-badge">Relevamiento Mercado Secundario & Portales</span>
          </div>
          <h1 className="citrino-panel-title">Oferta de Particulares (Marketplace)</h1>
          <p className="citrino-panel-subtitle">
            Monitoreo y cuantificación del mercado secundario de reventa inmobiliaria entre particulares compitiendo con la oferta nueva.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="citrino-kpis-grid">
        <div className="citrino-kpi-card">
          <span className="citrino-kpi-label">Stock Total Particulares</span>
          <span className="citrino-kpi-val">${kpis.stockTotalUsd} M USD</span>
          <span className="citrino-kpi-sub">Total: {kpis.unidadesTotales.toLocaleString()} Unidades</span>
        </div>
        <div className="citrino-kpi-card blue">
          <span className="citrino-kpi-label">Departamentos Reventa</span>
          <span className="citrino-kpi-val">${kpis.deptosUsd} M USD</span>
          <span className="citrino-kpi-sub">{kpis.deptosUnds.toLocaleString()} departamentos</span>
        </div>
        <div className="citrino-kpi-card green">
          <span className="citrino-kpi-label">Casas Particulares</span>
          <span className="citrino-kpi-val">${kpis.casasUsd} M USD</span>
          <span className="citrino-kpi-sub">{kpis.casasUnds.toLocaleString()} casas</span>
        </div>
        <div className="citrino-kpi-card purple">
          <span className="citrino-kpi-label">Zona Principal de Oferta</span>
          <span className="citrino-kpi-val">Equipetrol (21%)</span>
          <span className="citrino-kpi-sub">$128M USD concentrado</span>
        </div>
      </div>

      {/* Nav Pills */}
      <div className="citrino-nav-pills">
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stock')}
        >
          03-A Stock y Tipología
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'zonificacion' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('zonificacion')}
        >
          03-B Zonificación Territorial
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'evolutivo' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('evolutivo')}
        >
          03-C Evolutivo Marketplace
        </button>
      </div>

      {/* ── 03-A STOCK Y TIPOLOGÍA ── */}
      {activeSubTab === 'stock' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <h3 className="citrino-card-title">Matriz de Tipologías en Reventa: Superficies y Precios / m²</h3>
            <span className="citrino-card-hint">Muestra representativa de clasificados activos</span>
          </div>
          <div className="citrino-table-wrap">
            <table className="citrino-table">
              <thead>
                <tr>
                  <th>Tipología</th>
                  <th className="num">Unidades</th>
                  <th className="num">Sup. Mínima</th>
                  <th className="num">Sup. Máxima</th>
                  <th className="num">Sup. Promedio</th>
                  <th className="num">Precio/m² Mín.</th>
                  <th className="num">Precio/m² Máx.</th>
                  <th className="num">Precio/m² Promedio</th>
                </tr>
              </thead>
              <tbody>
                {tipologias.map((t) => (
                  <tr key={t.tipo}>
                    <td><b>{t.tipo}</b></td>
                    <td className="num">{t.unds}</td>
                    <td className="num">{t.supMin} m²</td>
                    <td className="num">{t.supMax} m²</td>
                    <td className="num"><b>{t.supAvg} m²</b></td>
                    <td className="num">${t.precioM2Min}</td>
                    <td className="num">${t.precioM2Max}</td>
                    <td className="num" style={{ color: '#38bdf8' }}><b>${t.precioM2Avg}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 03-B ZONIFICACIÓN ── */}
      {activeSubTab === 'zonificacion' && (
        <div className="citrino-charts-grid">
          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Concentración Territorial de la Reventa (%)</h3>
            </div>
            <ReactECharts option={getZonificacionChart()} style={{ height: 340 }} />
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Distribución por Zona Urbana</h3>
            </div>
            <div className="citrino-table-wrap">
              <table className="citrino-table">
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th className="num">% Oferta</th>
                    <th className="num">Unidades</th>
                    <th className="num">Volumen ($US M)</th>
                  </tr>
                </thead>
                <tbody>
                  {zonas.map((z) => (
                    <tr key={z.zona}>
                      <td><b>{z.zona}</b></td>
                      <td className="num" style={{ color: '#38bdf8' }}>{z.pct}%</td>
                      <td className="num">{z.unds}</td>
                      <td className="num">${z.volumenUsd} M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 03-C EVOLUTIVO MENSUAL ── */}
      {activeSubTab === 'evolutivo' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <h3 className="citrino-card-title">Evolución Histórica de la Reventa (Oct-2022 a Mar-2026)</h3>
            <span className="citrino-card-hint">Crecimiento del stock ofertado por particulares</span>
          </div>
          <ReactECharts option={getEvolutivoChart()} style={{ height: 360 }} />
        </div>
      )}
    </div>
  )
}
