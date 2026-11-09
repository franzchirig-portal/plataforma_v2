import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import './TopTabs.css'
import { MARKETPLACE_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import { fetchMarketplaceLive } from '../lib/supabase'

type SubTab = 'stock' | 'zonificacion' | 'evolutivo'

export default function MarketplaceParticularesPanel() {
  const ct = useChartTheme()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('stock')
  const [liveAnuncios, setLiveAnuncios] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    fetchMarketplaceLive().then((res) => {
      if (!cancelled && res.hasLiveRows && res.anuncios.length > 0) {
        setLiveAnuncios(res.anuncios)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { kpis, tipologias, zonas, serieMensual } = useMemo(() => {
    if (liveAnuncios.length === 0) return MARKETPLACE_DATA

    let totalUsd = 0
    let deptosUsd = 0
    let deptosUnds = 0
    let casasUsd = 0
    let casasUnds = 0
    const zonaMap = new Map<string, { unds: number; usd: number }>()
    const tipoMap = new Map<string, { unds: number; sups: number[]; m2s: number[] }>()
    const mesMap = new Map<string, { unds: number; usd: number }>()

    const formatZonaName = (raw: string) =>
      raw
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase())

    for (const r of liveAnuncios) {
      const precio = Number(r.precio_usd ?? r.precio_sus ?? r.precio ?? 0)
      const tipoRaw = String(r.tipo_inmueble ?? r.tipo ?? '').toLowerCase()
      const isCasa = tipoRaw.includes('casa')
      const dorms = r.dormitorios != null ? Number(r.dormitorios) : null
      const sup = Number(r.superficie_construida ?? r.construccion_m2 ?? r.superficie_terreno ?? 0)
      const usdM2 = Number(r.usd_m2 ?? (sup > 0 && precio > 0 ? precio / sup : 0))
      const rawZona = String(r.zona ?? r.macrozona ?? '').trim()
      const fechaMes = String(r.fecha ?? r.created_at ?? '').slice(0, 7)

      if (precio > 0 && precio < 10_000_000) {
        totalUsd += precio
        if (isCasa) {
          casasUnds += 1
          casasUsd += precio
        } else {
          deptosUnds += 1
          deptosUsd += precio
        }
      } else {
        if (isCasa) casasUnds += 1
        else deptosUnds += 1
      }

      if (rawZona && rawZona.toLowerCase() !== 'null') {
        const zKey = formatZonaName(rawZona)
        const prevZ = zonaMap.get(zKey) ?? { unds: 0, usd: 0 }
        prevZ.unds += 1
        if (precio > 0 && precio < 10_000_000) prevZ.usd += precio
        zonaMap.set(zKey, prevZ)
      }

      const dormLabel =
        dorms == null || isNaN(dorms) || dorms <= 0
          ? 'Estudio / Monoambiente'
          : dorms >= 4
            ? '4D o más'
            : `${dorms}D`
      const tipoKey = `${isCasa ? 'Casa' : 'Departamento'} ${dormLabel}`
      const prevT = tipoMap.get(tipoKey) ?? { unds: 0, sups: [], m2s: [] }
      prevT.unds += 1
      if (sup >= 20 && sup <= 1500) prevT.sups.push(sup)
      if (usdM2 >= 150 && usdM2 <= 4500) prevT.m2s.push(usdM2)
      tipoMap.set(tipoKey, prevT)

      if (/^\d{4}-\d{2}$/.test(fechaMes)) {
        const prevM = mesMap.get(fechaMes) ?? { unds: 0, usd: 0 }
        prevM.unds += 1
        if (precio > 0 && precio < 10_000_000) prevM.usd += precio
        mesMap.set(fechaMes, prevM)
      }
    }

    const totalUnds = liveAnuncios.length
    const totalZonificadas = Array.from(zonaMap.values()).reduce((s, v) => s + v.unds, 0) || totalUnds
    const zonasLive = Array.from(zonaMap.entries())
      .map(([zona, v]) => ({
        zona,
        pct: totalZonificadas > 0 ? Math.round((v.unds / totalZonificadas) * 1000) / 10 : 0,
        unds: v.unds,
        volumenUsd: Math.round((v.usd / 1_000_000) * 10) / 10,
      }))
      .sort((a, b) => b.unds - a.unds)
      .slice(0, 12)

    const tipologiasLive = Array.from(tipoMap.entries())
      .filter(([, v]) => v.unds >= 5 && v.sups.length > 0 && v.m2s.length > 0)
      .map(([tipo, v]) => {
        const supsSorted = [...v.sups].sort((a, b) => a - b)
        const m2sSorted = [...v.m2s].sort((a, b) => a - b)
        const p05 = (arr: number[]) => arr[Math.floor(arr.length * 0.05)] ?? arr[0]
        const p95 = (arr: number[]) => arr[Math.floor(arr.length * 0.95)] ?? arr[arr.length - 1]
        const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length
        return {
          tipo,
          unds: v.unds,
          supMin: Math.round(p05(supsSorted)),
          supMax: Math.round(p95(supsSorted)),
          supAvg: Math.round(avg(supsSorted) * 10) / 10,
          precioM2Min: Math.round(p05(m2sSorted)),
          precioM2Max: Math.round(p95(m2sSorted)),
          precioM2Avg: Math.round(avg(m2sSorted)),
        }
      })
      .sort((a, b) => b.unds - a.unds)

    const serieMensualLive = Array.from(mesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, v]) => ({
        periodo,
        valor: v.unds,
        secundario: Math.round((v.usd / 1_000_000) * 10) / 10,
      }))

    return {
      kpis: {
        stockTotalUsd: Math.round(totalUsd / 1_000_000) || MARKETPLACE_DATA.kpis.stockTotalUsd,
        unidadesTotales: totalUnds || MARKETPLACE_DATA.kpis.unidadesTotales,
        deptosUsd: Math.round(deptosUsd / 1_000_000) || MARKETPLACE_DATA.kpis.deptosUsd,
        deptosUnds: deptosUnds || MARKETPLACE_DATA.kpis.deptosUnds,
        casasUsd: Math.round(casasUsd / 1_000_000) || MARKETPLACE_DATA.kpis.casasUsd,
        casasUnds: casasUnds || MARKETPLACE_DATA.kpis.casasUnds,
      },
      tipologias: tipologiasLive.length > 0 ? tipologiasLive : MARKETPLACE_DATA.tipologias,
      zonas: zonasLive.length > 0 ? zonasLive : MARKETPLACE_DATA.zonas,
      serieMensual: serieMensualLive.length > 1 ? serieMensualLive : MARKETPLACE_DATA.serieMensual,
    }
  }, [liveAnuncios])

  // Chart Option: Zonificación Barras Horizontales
  const getZonificacionChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    yAxis: {
      type: 'category',
      data: [...zonas].reverse().map((z) => z.zona),
      axisLabel: { color: ct.text },
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
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: serieMensual.map((p) => p.periodo),
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
      {/* Pestañas superiores */}
      <div className="top-tabs">
        <button
          className={`top-tab ${activeSubTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stock')}
        >
          Cuantificación de la Oferta informal
        </button>
        <button
          className={`top-tab ${activeSubTab === 'zonificacion' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('zonificacion')}
        >
          Zonificación de la Reventa
        </button>
        <button
          className={`top-tab ${activeSubTab === 'evolutivo' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('evolutivo')}
        >
          Evolutivo de Marketplace
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="citrino-kpis-grid">
        <div className="citrino-kpi-card">
          <span className="citrino-kpi-label">Stock total de particulares</span>
          <span className="citrino-kpi-val">${kpis.stockTotalUsd} M USD</span>
          <span className="citrino-kpi-sub">Total: {kpis.unidadesTotales.toLocaleString()} Unidades</span>
        </div>
        <div className="citrino-kpi-card blue">
          <span className="citrino-kpi-label">Departamentos en reventa</span>
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
          <span className="citrino-kpi-val">
            {zonas[0] ? `${zonas[0].zona} (${zonas[0].pct}%)` : 'Equipetrol (21%)'}
          </span>
          <span className="citrino-kpi-sub">
            {zonas[0] ? `$${zonas[0].volumenUsd}M USD concentrado` : '$128M USD concentrado'}
          </span>
        </div>
      </div>

      {/* ── 03-A STOCK Y TIPOLOGÍA ── */}
      {activeSubTab === 'stock' && (
        <div className="citrino-card-box">
          <div className="citrino-card-header">
            <h3 className="citrino-card-title">Tipologías en reventa: superficie y precio por m²</h3>
            <span className="citrino-card-hint">Muestra de anuncios activos</span>
          </div>
          <div className="citrino-table-wrap">
            <table className="citrino-table">
              <thead>
                <tr>
                  <th>Tipología</th>
                  <th className="num">Unidades</th>
                  <th className="num">Superficie mínima</th>
                  <th className="num">Superficie máxima</th>
                  <th className="num">Superficie promedio</th>
                  <th className="num">Precio por m² mínimo</th>
                  <th className="num">Precio por m² máximo</th>
                  <th className="num">Precio por m² promedio</th>
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
                    <td className="num" style={{ color: 'var(--citrino-sky)' }}><b>${t.precioM2Avg}</b></td>
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
              <h3 className="citrino-card-title">Dónde se concentra la reventa (%)</h3>
            </div>
            <ReactECharts option={getZonificacionChart()} style={{ height: 340 }} />
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Reventa por zona</h3>
            </div>
            <div className="citrino-table-wrap">
              <table className="citrino-table">
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th className="num">% de la oferta</th>
                    <th className="num">Unidades</th>
                    <th className="num">Volumen ($US M)</th>
                  </tr>
                </thead>
                <tbody>
                  {zonas.map((z) => (
                    <tr key={z.zona}>
                      <td><b>{z.zona}</b></td>
                      <td className="num" style={{ color: 'var(--citrino-sky)' }}>{z.pct}%</td>
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
            <span className="citrino-card-hint">Unidades que ofrecen los particulares, mes a mes</span>
          </div>
          <ReactECharts option={getEvolutivoChart()} style={{ height: 360 }} />
        </div>
      )}
    </div>
  )
}
