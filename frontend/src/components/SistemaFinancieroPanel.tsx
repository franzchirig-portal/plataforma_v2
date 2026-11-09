import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { SISTEMA_FINANCIERO_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import { fetchSistemaFinancieroLive } from '../lib/supabase'
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
  const [liveData, setLiveData] = useState<Awaited<ReturnType<typeof fetchSistemaFinancieroLive>> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSistemaFinancieroLive().then((res) => {
      if (!cancelled && res.hasLiveRows) {
        setLiveData(res)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { carteraHipotecaria, creditoConstruccionSerie, moraHipotecaria, moraConstruccion } = useMemo(() => {
    if (!liveData || !liveData.hasLiveRows) {
      return {
        ...SISTEMA_FINANCIERO_DATA,
        creditoConstruccionSerie: [] as { periodo: string; boliviaUsd: number; sczUsd: number }[],
      }
    }

    const toMillonesUsd = (val: unknown) => {
      const n = Number(val ?? 0)
      if (!n || isNaN(n)) return 0
      return n > 50_000 ? Math.round((n / 1_000_000) * 10) / 10 : Math.round(n * 10) / 10
    }

    // 1. Cartera Hipotecaria (ind_consolidado_hipotecaria_vivienda, 422 filas)
    const hipPorAno = new Map<string, { bolivia: number; scz: number }>()
    const sortedHip = [...liveData.consolidadoHipotecaria].sort((a: any, b: any) =>
      String(a.fecha ?? '').localeCompare(String(b.fecha ?? ''))
    )
    for (const r of sortedHip) {
      const ano = String(r.fecha ?? '').slice(0, 4)
      if (!/^\d{4}$/.test(ano) || Number(ano) < 2012) continue
      const mmUsd = toMillonesUsd(r.cartera_mm_usd ?? r.cartera_bs)
      if (mmUsd <= 0) continue
      const ciudad = String(r.ciudad ?? '').toLowerCase().trim()
      const prev = hipPorAno.get(ano) ?? { bolivia: 0, scz: 0 }
      if (ciudad === 'bolivia') prev.bolivia = mmUsd
      else if (ciudad === 'santa cruz') prev.scz = mmUsd
      hipPorAno.set(ano, prev)
    }

    const carteraLive = Array.from(hipPorAno.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, v]) => v.bolivia > 0)
      .map(([periodo, v]) => ({
        periodo,
        totalUsd: Math.round(v.bolivia),
        visUsd: Math.round(v.scz > 0 ? v.scz : v.bolivia * 0.65),
        tasaPromedio: 6.2,
      }))

    // 2. Crédito al Sector Construcción (ind_consolidado_credito_construccion, 160 filas)
    const constPorAno = new Map<string, { bolivia: number; scz: number }>()
    const sortedConst = [...liveData.consolidadoConstruccion].sort((a: any, b: any) =>
      String(a.fecha ?? '').localeCompare(String(b.fecha ?? ''))
    )
    for (const r of sortedConst) {
      const ano = String(r.fecha ?? '').slice(0, 4)
      if (!/^\d{4}$/.test(ano) || Number(ano) < 2012) continue
      const mmUsd = toMillonesUsd(r.credito_mm_usd)
      if (mmUsd <= 0) continue
      const ciudad = String(r.ciudad ?? '').toLowerCase().trim()
      const prev = constPorAno.get(ano) ?? { bolivia: 0, scz: 0 }
      if (ciudad === 'bolivia') prev.bolivia = mmUsd
      else if (ciudad === 'santa cruz') prev.scz = mmUsd
      constPorAno.set(ano, prev)
    }

    const creditoConstruccionLive = Array.from(constPorAno.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, v]) => v.bolivia > 0 || v.scz > 0)
      .map(([periodo, v]) => ({
        periodo,
        boliviaUsd: Math.round(v.bolivia),
        sczUsd: Math.round(v.scz),
      }))

    // 3. Mora Hipotecaria Bancos (ind_mora_hipotecaria_bancos, 1.722 filas)
    const moraFechaMap = new Map<string, { declUsd: number; reprogUsd: number; totalUsd: number; carteraUsd: number }>()
    for (const r of liveData.moraHipotecariaBancos) {
      const fecha = String(r.fecha ?? '').slice(0, 7)
      if (!/^\d{4}-\d{2}$/.test(fecha)) continue
      const prev = moraFechaMap.get(fecha) ?? { declUsd: 0, reprogUsd: 0, totalUsd: 0, carteraUsd: 0 }
      prev.declUsd += Number(r.mora_declarada_usd ?? 0)
      prev.reprogUsd += Number(r.mora_reprogramada_usd ?? 0)
      prev.totalUsd += Number(r.mora_total_usd ?? 0)
      prev.carteraUsd += Number(r.total_cartera_usd ?? 0)
      moraFechaMap.set(fecha, prev)
    }

    // Tomar el último corte disponible de cada año desde 2018
    const moraPorAno = new Map<string, { periodo: string; totalMoraUsd: number; reprogramadaUsd: number; noReprogramadaUsd: number; ratioPct: number }>()
    for (const [fecha, v] of Array.from(moraFechaMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const ano = fecha.slice(0, 4)
      if (Number(ano) < 2018 || v.totalUsd <= 0) continue
      const reprog = Math.round((v.reprogUsd / 1_000_000) * 10) / 10
      const noReprog = Math.round((v.declUsd / 1_000_000) * 10) / 10
      const tot = Math.round(((v.reprogUsd + v.declUsd) / 1_000_000) * 10) / 10
      const ratio = v.carteraUsd > 0 ? Math.round(((v.reprogUsd + v.declUsd) / v.carteraUsd) * 1000) / 10 : 3.0
      moraPorAno.set(ano, {
        periodo: fecha,
        totalMoraUsd: tot,
        reprogramadaUsd: reprog,
        noReprogramadaUsd: noReprog,
        ratioPct: ratio,
      })
    }

    const moraHipSerieLive = Array.from(moraPorAno.values())
    const latestMoraHip = moraHipSerieLive[moraHipSerieLive.length - 1]

    // 4. Mora Construcción (ind_cartera_construccion, 196 filas)
    const moraConstAno = new Map<string, { periodo: string; montoUsd: number; ratioPct: number; reprogUsd: number }>()
    const sortedCartConst = [...liveData.carteraConstruccion].sort((a: any, b: any) =>
      String(a.fecha ?? '').localeCompare(String(b.fecha ?? ''))
    )
    // Agrupar por fecha sumando ciudades (o tomando bolivia si existe)
    const constFechaMap = new Map<string, { moraUsd: number; reprogUsd: number; carteraUsd: number; hasBolivia: boolean }>()
    for (const r of sortedCartConst) {
      const fecha = String(r.fecha ?? '').slice(0, 7)
      if (!/^\d{4}-\d{2}$/.test(fecha)) continue
      const ciudad = String(r.ciudad ?? '').toLowerCase().trim()
      const moraUsd = Number(r.mora_total_usd ?? 0)
      const reprogUsd = Number(r.mora_reprogramada_usd ?? 0)
      const carteraUsd = Number(r.total_cartera_usd ?? 0)
      if (ciudad === 'bolivia') {
        constFechaMap.set(fecha, { moraUsd, reprogUsd, carteraUsd, hasBolivia: true })
      } else {
        const prev = constFechaMap.get(fecha) ?? { moraUsd: 0, reprogUsd: 0, carteraUsd: 0, hasBolivia: false }
        if (!prev.hasBolivia) {
          prev.moraUsd += moraUsd
          prev.reprogUsd += reprogUsd
          prev.carteraUsd += carteraUsd
          constFechaMap.set(fecha, prev)
        }
      }
    }

    for (const [fecha, v] of Array.from(constFechaMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const ano = fecha.slice(0, 4)
      if (Number(ano) < 2018 || v.moraUsd <= 0) continue
      const monto = Math.round((v.moraUsd / 1_000_000) * 10) / 10
      const ratio = v.carteraUsd > 0 ? Math.round((v.moraUsd / v.carteraUsd) * 1000) / 10 : 3.2
      moraConstAno.set(ano, {
        periodo: fecha,
        montoUsd: monto,
        ratioPct: ratio,
        reprogUsd: Math.round((v.reprogUsd / 1_000_000) * 10) / 10,
      })
    }

    const moraConstSerieLive = Array.from(moraConstAno.values())
    const latestMoraConst = moraConstSerieLive[moraConstSerieLive.length - 1]

    return {
      carteraHipotecaria: carteraLive.length > 0 ? carteraLive : SISTEMA_FINANCIERO_DATA.carteraHipotecaria,
      creditoConstruccionSerie: creditoConstruccionLive,
      moraHipotecaria:
        moraHipSerieLive.length > 0 && latestMoraHip
          ? {
              totalMoraUsd: latestMoraHip.totalMoraUsd,
              ratioMoraPct: latestMoraHip.ratioPct,
              reprogramadaUsd: latestMoraHip.reprogramadaUsd,
              noReprogramadaUsd: latestMoraHip.noReprogramadaUsd,
              serie: moraHipSerieLive,
            }
          : SISTEMA_FINANCIERO_DATA.moraHipotecaria,
      moraConstruccion:
        moraConstSerieLive.length > 0 && latestMoraConst
          ? {
              totalMoraUsd: latestMoraConst.montoUsd,
              ratioMoraPct: latestMoraConst.ratioPct,
              pctReprogramada:
                latestMoraConst.montoUsd > 0
                  ? Math.round((latestMoraConst.reprogUsd / latestMoraConst.montoUsd) * 1000) / 10
                  : 89.4,
              serie: moraConstSerieLive,
            }
          : SISTEMA_FINANCIERO_DATA.moraConstruccion,
    }
  }, [liveData])

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

  // Chart Option: Crédito al Sector Construcción (Bolivia vs Santa Cruz)
  const getCreditoConstruccionChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: creditoConstruccionSerie.map((c) => c.periodo),
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
        name: 'Crédito construcción Bolivia',
        type: 'line',
        smooth: true,
        data: creditoConstruccionSerie.map((c) => c.boliviaUsd),
        itemStyle: { color: '#a855f7' },
        lineStyle: { width: 3 },
      },
      {
        name: 'Crédito construcción Santa Cruz',
        type: 'bar',
        data: creditoConstruccionSerie.map((c) => c.sczUsd),
        itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
      },
    ],
  })

  const latestCartera = carteraHipotecaria[carteraHipotecaria.length - 1]
  const latestConstruccion = creditoConstruccionSerie[creditoConstruccionSerie.length - 1]
  const pctSczConstruccion =
    latestConstruccion && latestConstruccion.boliviaUsd > 0
      ? Math.round((latestConstruccion.sczUsd / latestConstruccion.boliviaUsd) * 100)
      : 54
  const pctReprogHip =
    moraHipotecaria.totalMoraUsd > 0
      ? Math.round((moraHipotecaria.reprogramadaUsd / moraHipotecaria.totalMoraUsd) * 100)
      : 57

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
              <span className="citrino-kpi-val">
                ${(latestCartera?.totalUsd ?? 7820).toLocaleString('es-BO')} M USD
              </span>
              <span className="citrino-kpi-sub">Estancamiento relativo 2024-2026</span>
            </div>
            <div className="citrino-kpi-card green">
              <span className="citrino-kpi-label">Cartera Hipotecaria Principal</span>
              <span className="citrino-kpi-val">
                ${(latestCartera?.visUsd ?? 5320).toLocaleString('es-BO')} M USD
              </span>
              <span className="citrino-kpi-sub">Saldo hipotecario de referencia</span>
            </div>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Cartera hipotecaria total vs referencia (2012 - 2026)</h3>
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
              <span className="citrino-kpi-val">
                ${(latestConstruccion?.boliviaUsd ?? 2140).toLocaleString('es-BO')} M USD
              </span>
              <span className="citrino-kpi-sub">Saldo actual de préstamos a constructoras</span>
            </div>
            <div className="citrino-kpi-card amber">
              <span className="citrino-kpi-label">Concentración en Santa Cruz</span>
              <span className="citrino-kpi-val">{pctSczConstruccion}%</span>
              <span className="citrino-kpi-sub">Del crédito a la construcción</span>
            </div>
          </div>

          <div className="citrino-card-box">
            <div className="citrino-card-header">
              <h3 className="citrino-card-title">Evolución del crédito a la construcción</h3>
              <span className="citrino-card-hint">Expresado en millones de $US</span>
            </div>
            {creditoConstruccionSerie.length > 0 ? (
              <ReactECharts option={getCreditoConstruccionChart()} style={{ height: 350 }} />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-cuerpo)', margin: '8px 0 0' }}>
                Cargando serie histórica de crédito a la construcción...
              </p>
            )}
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
              <span className="citrino-kpi-val">${moraHipotecaria.totalMoraUsd} M USD</span>
              <span className="citrino-kpi-sub">Tasa del {moraHipotecaria.ratioMoraPct}% de la cartera</span>
            </div>
            <div className="citrino-kpi-card red">
              <span className="citrino-kpi-label">Mora Reprogramada Hipotecaria</span>
              <span className="citrino-kpi-val">${moraHipotecaria.reprogramadaUsd} M USD</span>
              <span className="citrino-kpi-sub">{pctReprogHip}% de la mora total</span>
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
              <span className="citrino-kpi-val">${moraConstruccion.totalMoraUsd} M USD</span>
              <span className="citrino-kpi-sub">{moraConstruccion.pctReprogramada}% es cartera reprogramada</span>
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
