import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { BIENES_ADJUDICADOS_DATA } from '../data/citrinoDataStudioData'

type SubTab = 'remates' | 'adjudicados'

export default function BienesAdjudicadosPanel() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('adjudicados')
  // Sub-pill auditado de Data Studio: Mensual vs Anual
  const [subPillAdjudicados, setSubPillAdjudicados] = useState<'mensual' | 'anual'>('mensual')

  const { rematesMensuales, adjudicadosAsfiAnual, adjudicadosAsfiMensual } = BIENES_ADJUDICADOS_DATA

  // Chart Option: Remates Judiciales (Volumen $US M y Tasa de Descuento %)
  const getRematesChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#94a3b8' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: rematesMensuales.map((r) => r.periodo),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Volumen ($US M)',
        axisLabel: { color: '#ef4444' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
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
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      name: 'Millones de Bs.',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
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
      axisLabel: { color: '#94a3b8', rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'Millones de Bs.',
      min: 400,
      max: 1400,
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
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
      {/* Header */}
      <div className="citrino-panel-header">
        <div className="citrino-title-area">
          <div className="citrino-badge-row">
            <span className="citrino-badge">Módulo 04</span>
            <span className="citrino-sample-badge">Regulación ASFI & Edictos Judiciales</span>
          </div>
          <h1 className="citrino-panel-title">Bienes Adjudicados y Remates Judiciales</h1>
          <p className="citrino-panel-subtitle">
            Seguimiento de activos inmobiliarios recuperados por el sistema financiero y volumen de remates judiciales en Santa Cruz.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="citrino-kpis-grid">
        <div className="citrino-kpi-card amber">
          <span className="citrino-kpi-label">Saldo Adjudicados ASFI (2026)</span>
          <span className="citrino-kpi-val">1.288 M Bs</span>
          <span className="citrino-kpi-sub">Similar a crisis de 2003 (1.344 M Bs)</span>
        </div>
        <div className="citrino-kpi-card blue">
          <span className="citrino-kpi-label">Volumen en Remate Judicial</span>
          <span className="citrino-kpi-val">$79 M USD</span>
          <span className="citrino-kpi-sub">Pico registrado: $87M en jun-2025</span>
        </div>
        <div className="citrino-kpi-card purple">
          <span className="citrino-kpi-label">Descuento Judicial Promedio</span>
          <span className="citrino-kpi-val">10.8%</span>
          <span className="citrino-kpi-sub">Sobre avalúo pericial regulado</span>
        </div>
      </div>

      {/* Nav Pills */}
      <div className="citrino-nav-pills">
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'adjudicados' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('adjudicados')}
        >
          04-B Bienes Adjudicados por Bancos
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeSubTab === 'remates' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('remates')}
        >
          04-A Remates Judiciales
        </button>
      </div>

      {/* ── 04-B BIENES ADJUDICADOS ASFI ── */}
      {activeSubTab === 'adjudicados' && (
        <div>
          {/* Sub-pill (auditado de Looker Studio: Mensual vs Anual) */}
          <div className="citrino-subpills-row">
            <span className="citrino-subpill-label">Periodicidad:</span>
            <button
              className={`citrino-subpill-btn ${subPillAdjudicados === 'mensual' ? 'active' : ''}`}
              onClick={() => setSubPillAdjudicados('mensual')}
            >
              📅 Pestaña Mensual (Dic-2022 a Mar-2026)
            </button>
            <button
              className={`citrino-subpill-btn ${subPillAdjudicados === 'anual' ? 'active' : ''}`}
              onClick={() => setSubPillAdjudicados('anual')}
            >
              🏛️ Pestaña Anual Histórica ASFI (2003 - 2026)
            </button>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">
                {subPillAdjudicados === 'mensual'
                  ? 'Serie Mensual Continua: Inmuebles Adjudicados ASFI (Dic-2022 a Mar-2026)'
                  : 'Ciclo Histórico de Bienes Adjudicados en el Sistema Bancario (2003 - 2026)'}
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
            <h3 className="citrino-card-title">04-A Volumen de Remates Judiciales y Tasa de Descuento sobre Avalúo</h3>
            <span className="citrino-card-hint">Presión de liquidación forzosa en estrados judiciales</span>
          </div>
          <ReactECharts option={getRematesChart()} style={{ height: 360 }} />
        </div>
      )}
    </div>
  )
}
