import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import './EvolutivoOfertaPanel.css'
import {
  EVOLUTIVO_OFERTA_SNAPSHOTS,
  RITMO_VENTAS_HISTORICO_MENSUAL,
  ETAPAS_COMERCIALES_EVOLUTIVO,
} from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'

type TopTab = 'cuantificacion' | 'precio_ritmo' | 'proyectos'

export default function EvolutivoOfertaPanel() {
  const ct = useChartTheme()
  const [activeTab, setActiveTab] = useState<TopTab>('cuantificacion')
  // Pills internos
  const [subPillCuant, setSubPillCuant] = useState<'cuantificacion' | 'estadistica'>('estadistica')
  const [subPillStock, setSubPillStock] = useState<'stock_und' | 'stock_usd'>('stock_und')
  const [subPillRitmo, setSubPillRitmo] = useState<'grafico' | 'tabla'>('grafico')
  const [searchProj, setSearchProj] = useState('')

  // Último snapshot censal (2026)
  const latest = EVOLUTIVO_OFERTA_SNAPSHOTS[EVOLUTIVO_OFERTA_SNAPSHOTS.length - 1]

  // Chart Option: Cuantificación Agregada (Barras triples de Unds, Stock USD, m²)
  const getCuantificacionChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => s.ano),
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
        name: 'Unidades Totales',
        type: 'bar',
        data: EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => s.undTotales),
        itemStyle: { color: '#ff6b00', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Stock Total ($US M)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => s.stockTotalUsd),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
    ],
  })

  // Chart Option: Ritmo de Venta Mensual Histórico feb-2021 a sep-2026
  const getRitmoChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => `${params[0].name}<br/><b>Ritmo de Venta: ${params[0].value}% mensual</b>`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: RITMO_VENTAS_HISTORICO_MENSUAL.map((p) => p.periodo),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: ct.muted, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: '% Mensual',
      min: 0,
      max: 4.5,
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Ritmo de Venta',
        type: 'line',
        smooth: true,
        data: RITMO_VENTAS_HISTORICO_MENSUAL.map((p) => p.valor),
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3, color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ],
          },
        },
        markPoint: {
          data: [
            { type: 'min', name: 'Valle Nov-2025 (1.1%)', itemStyle: { color: '#ef4444' } },
            { type: 'max', name: 'Pico 2026 (3.4%)', itemStyle: { color: '#10b981' } },
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
      data: EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => s.ano),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: '$US / m²',
      min: 600,
      max: 1500,
      axisLabel: { color: ct.muted, formatter: '${value}' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Precio m² oficial (6.96)',
        type: 'line',
        data: EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => s.precioM2Oficial),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 3 },
      },
      {
        name: 'Precio m² paralelo (9.90+)',
        type: 'line',
        data: EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => s.precioM2Paralelo),
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
        data: ETAPAS_COMERCIALES_EVOLUTIVO.map((e) => ({
          name: e.etapa,
          value: e.proyectos,
        })),
        itemStyle: {
          borderRadius: 4,
          borderColor: '#070b12',
          borderWidth: 2,
        },
        color: ['#38bdf8', '#ff6b00', '#10b981'],
      },
    ],
  })

  const proyectosMuestra = [
    { nombre: 'Torre Macororó 14', zona: 'Norte 2do-5to', cuotaIni: '20%', financiamiento: 'Directo 5 años', dctoContado: '8%', velocidad: '3.8 und/mes' },
    { nombre: 'Condominio Smart Urubó', zona: 'Urubó', cuotaIni: '15%', financiamiento: 'Bancario VIS', dctoContado: '10%', velocidad: '2.5 und/mes' },
    { nombre: 'Sirari Design Suites', zona: 'Equipetrol', cuotaIni: '30%', financiamiento: 'Contraentrega', dctoContado: '12%', velocidad: '4.2 und/mes' },
    { nombre: 'Residencial Plaza Norte', zona: 'Norte 5to-8vo', cuotaIni: '20%', financiamiento: 'Bancario Regular', dctoContado: '7%', velocidad: '2.1 und/mes' },
    { nombre: 'Altos de Equipetrol', zona: 'Equipetrol', cuotaIni: '25%', financiamiento: 'Directo 3 años', dctoContado: '9%', velocidad: '3.1 und/mes' },
    { nombre: 'Condominio Bella Vista', zona: 'Sur Santos Dumont', cuotaIni: '10%', financiamiento: 'Bancario VIS', dctoContado: '5%', velocidad: '1.9 und/mes' },
  ].filter((p) => p.nombre.toLowerCase().includes(searchProj.toLowerCase()) || p.zona.toLowerCase().includes(searchProj.toLowerCase()))

  return (
    <div className="citrino-panel-wrap">
      {/* Nav Pills principales (3 pestañas) */}
      <div className="evo-tabs">
        <button
          className={`evo-tab ${activeTab === 'cuantificacion' ? 'active' : ''}`}
          onClick={() => setActiveTab('cuantificacion')}
        >
          Cuantificación Evolutiva de la Oferta
        </button>
        <button
          className={`evo-tab ${activeTab === 'precio_ritmo' ? 'active' : ''}`}
          onClick={() => setActiveTab('precio_ritmo')}
        >
          Evolutivo Precio & Ritmo de Venta
        </button>
        <button
          className={`evo-tab ${activeTab === 'proyectos' ? 'active' : ''}`}
          onClick={() => setActiveTab('proyectos')}
        >
          Evolutivo por Proyectos
        </button>
      </div>

      {/* ── PESTAÑA 1: CUANTIFICACIÓN EVOLUTIVA DE LA OFERTA ── */}
      {activeTab === 'cuantificacion' && (
        <div>
          {/* Sub-pills (auditado de Looker Studio: Cuantificación vs Estadística) */}
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
              <span className="citrino-kpi-label">Proyectos Censados Activos</span>
              <span className="citrino-kpi-val">{latest.proyectosCensados}</span>
              <span className="citrino-kpi-sub">Pico censal: 193 en 2022</span>
            </div>
            <div className="citrino-kpi-card blue">
              <span className="citrino-kpi-label">Unidades Promedio / Proyecto</span>
              <span className="citrino-kpi-val">{latest.undPromedio} unds</span>
              <span className="citrino-kpi-sub">Total censado: {latest.undTotales.toLocaleString()} unds</span>
            </div>
            <div className="citrino-kpi-card green">
              <span className="citrino-kpi-label">Stock promedio por proyecto (USD)</span>
              <span className="citrino-kpi-val">${latest.stockPromedioUsd} M</span>
              <span className="citrino-kpi-sub">Stock total censado: ${latest.stockTotalUsd} M</span>
            </div>
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Vendido vs por vender</span>
              <span className="citrino-kpi-val">{latest.pctVendido}% / {latest.pctPorVender}%</span>
              <span className="citrino-kpi-sub">Meses para vender el stock: {latest.mesesStockPromedio} meses</span>
            </div>
          </div>

          {subPillCuant === 'estadistica' ? (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Resumen anual de la oferta (2016 - 2026)</h3>
                <span className="citrino-card-hint">Cifras de cada año</span>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th className="num">Proyectos</th>
                      <th className="num">Unidades totales</th>
                      <th className="num">Unidades promedio</th>
                      <th className="num">Stock Total ($US M)</th>
                      <th className="num">Stock promedio ($US M)</th>
                      <th className="num">% Vendido</th>
                      <th className="num">% Por Vender</th>
                      <th className="num">Meses para vender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => (
                      <tr key={s.ano}>
                        <td><b>{s.ano}</b></td>
                        <td className="num">{s.proyectosCensados}</td>
                        <td className="num">{s.undTotales.toLocaleString()}</td>
                        <td className="num">{s.undPromedio}</td>
                        <td className="num">${s.stockTotalUsd} M</td>
                        <td className="num">${s.stockPromedioUsd} M</td>
                        <td className="num" style={{ color: 'var(--text-success)' }}>{s.pctVendido}%</td>
                        <td className="num" style={{ color: 'var(--citrino-orange)' }}>{s.pctPorVender}%</td>
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
                <h3 className="citrino-card-title">Evolución de Unidades Totales vs Volumen de Capital ($US Millones)</h3>
              </div>
              <ReactECharts option={getCuantificacionChart()} style={{ height: 360 }} />
            </div>
          )}

          {/* Stock en unidades y en capital (antes en 02-D) */}
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
              <span className="citrino-card-hint">Serie 2016-2026</span>
            </div>
            <div className="citrino-table-wrap">
              <table className="citrino-table">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th className="num">Unidades por vender</th>
                    <th className="num">Capital por vender ($US M)</th>
                    <th className="num">% Por Vender</th>
                  </tr>
                </thead>
                <tbody>
                  {EVOLUTIVO_OFERTA_SNAPSHOTS.map((s) => (
                    <tr key={s.ano}>
                      <td>{s.ano}</td>
                      <td className="num"><b>{Math.round(s.undTotales * (s.pctPorVender / 100)).toLocaleString()} unds</b></td>
                      <td className="num">${Math.round(s.stockTotalUsd * (s.pctPorVender / 100))} M</td>
                      <td className="num">{s.pctPorVender}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribución por etapa comercial (antes en 02-B) */}
          <div className="citrino-charts-grid">
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Distribución de Proyectos por Etapa Comercial (2026)</h3>
              </div>
              <ReactECharts option={getEtapasPieChart()} style={{ height: 320 }} />
            </div>

            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Detalle de Etapas</h3>
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
                    {ETAPAS_COMERCIALES_EVOLUTIVO.map((e) => (
                      <tr key={e.etapa}>
                        <td><b>{e.etapa}</b></td>
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
          {/* Sub-pills (auditado de Looker Studio: Gráfico vs Tabla) */}
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
              <span className="citrino-kpi-val">3.4% / mes</span>
              <span className="citrino-kpi-sub">Corte Septiembre 2026</span>
            </div>
            <div className="citrino-kpi-card red">
              <span className="citrino-kpi-label">Mínimo Histórico</span>
              <span className="citrino-kpi-val">1.1% / mes</span>
              <span className="citrino-kpi-sub">Valle Noviembre 2025</span>
            </div>
            <div className="citrino-kpi-card blue">
              <span className="citrino-kpi-label">Ritmo Promedio Histórico</span>
              <span className="citrino-kpi-val">2.2% / mes</span>
              <span className="citrino-kpi-sub">Periodo Feb-2021 a Sep-2026</span>
            </div>
          </div>

          {subPillRitmo === 'grafico' ? (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Ritmo de venta mensual (%)</h3>
                <span className="citrino-card-hint">Dato mensual, de feb-2021 a sep-2026</span>
              </div>
              <ReactECharts option={getRitmoChart()} style={{ height: 360 }} />
            </div>
          ) : (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Ritmo de venta por mes</h3>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th className="num">Ritmo de Venta (%)</th>
                      <th>Nivel relativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RITMO_VENTAS_HISTORICO_MENSUAL.map((r) => (
                      <tr key={r.periodo}>
                        <td>{r.periodo}</td>
                        <td className="num"><b>{r.valor}%</b></td>
                        <td>
                          <div className="citrino-progress-bar">
                            <div className="citrino-progress-fill green" style={{ width: `${(r.valor / 4.5) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Brecha cambiaria precio por m² (antes en 02-D) */}
          <div className="citrino-card-box" style={{ marginTop: 18 }}>
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">
                Precio por m² al tipo de cambio oficial (6.96) vs paralelo (9.90+)
              </h3>
              <span className="citrino-card-hint">Diferencia entre el precio en dólar oficial y en paralelo</span>
            </div>
            <ReactECharts option={getBrechaChart()} style={{ height: 380 }} />
          </div>
        </div>
      )}

      {/* ── PESTAÑA 3: EVOLUTIVO POR PROYECTOS ── */}
      {activeTab === 'proyectos' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <h3 className="citrino-card-title">Condiciones comerciales por proyecto</h3>
            <input
              type="text"
              placeholder="Buscar proyecto o zona..."
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
                  <th className="num">Cuota Inicial</th>
                  <th>Financiamiento Ofrecido</th>
                  <th className="num">Descuento al contado</th>
                  <th className="num">Ritmo de venta</th>
                </tr>
              </thead>
              <tbody>
                {proyectosMuestra.map((p) => (
                  <tr key={p.nombre}>
                    <td><b>{p.nombre}</b></td>
                    <td>{p.zona}</td>
                    <td className="num">{p.cuotaIni}</td>
                    <td>{p.financiamiento}</td>
                    <td className="num" style={{ color: 'var(--text-success)' }}>{p.dctoContado}</td>
                    <td className="num">{p.velocidad}</td>
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
