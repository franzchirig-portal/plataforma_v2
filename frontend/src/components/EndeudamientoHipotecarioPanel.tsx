import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { ENDEUDAMIENTO_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import { fetchEndeudamientoLive, matchCiudad } from '../lib/supabase'
import TopTabBar from './TopTabBar'

interface Props {
  initialChapter?: '4.1' | '4.2' | '4.3'
  ciudad?: string
}

function cleanLabel(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .replace(/^[a-z0-9]{1,2}[.)]\s*/i, '')
    .trim()
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildFreqList<K extends string>(
  rows: any[],
  field: string,
  keyName: K,
  maxItems = 12
): Array<Record<K, string> & { pct: number }> {
  const counts = new Map<string, number>()
  let total = 0
  for (const r of rows) {
    const label = cleanLabel(r?.[field])
    if (!label || label.toLowerCase() === 'null') continue
    counts.set(label, (counts.get(label) ?? 0) + 1)
    total += 1
  }
  if (total === 0) return []
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)
    .map(([label, c]) => ({
      [keyName]: label,
      pct: Math.round((c / total) * 1000) / 10,
    } as Record<K, string> & { pct: number }))
}

export default function EndeudamientoHipotecarioPanel({ initialChapter = '4.1', ciudad = 'SCZ' }: Props) {
  const ct = useChartTheme()
  const [activeChapter] = useState<'4.1' | '4.2' | '4.3'>(initialChapter)
  const [liveData, setLiveData] = useState<Awaited<ReturnType<typeof fetchEndeudamientoLive>> | null>(null)
  const cityLabel =
    ciudad === 'LPZ' ? 'La Paz' : ciudad === 'CBB' ? 'Cochabamba' : ciudad === 'SCZ' ? 'Santa Cruz' : 'Bolivia'

  useEffect(() => {
    let cancelled = false
    fetchEndeudamientoLive().then((res) => {
      if (!cancelled && res.hasLiveRows) {
        setLiveData(res)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Sub-tabs y sub-pills para 4.1 Perfil del Consumidor
  const [perfilSubTab, setPerfilSubTab] = useState<'zona' | 'hogar' | 'laboral' | 'ingresos'>('zona')
  const [zonaSubPill, setZonaSubPill] = useState<'zona' | 'financiacion'>('zona')
  const [hogarSubPill, setHogarSubPill] = useState<'valor' | 'tipo' | 'familias'>('valor')

  // Sub-tabs y sub-pills para 4.2 Estado de Cartera
  const [carteraSubTab, setCarteraSubTab] = useState<'bancos' | 'prestamo' | 'prestatario' | 'endeudamiento'>('prestamo')
  const [prestamoSubPill, setPrestamoSubPill] = useState<'deuda' | 'aporte' | 'nse' | 'ingreso' | 'bancos'>('deuda')

  // Sub-tabs y sub-pills para 4.3 Perspectivas
  const [perspectivasSubTab, setPerspectivasSubTab] = useState<'pasado' | 'futuro'>('pasado')
  const [futuroSubPill, setFuturoSubPill] = useState<'expectativa' | 'precios'>('expectativa')

  const {
    noCityRows,
    zonasCredito,
    tiposFinanciacion,
    caracteristicasHogar,
    situacionLaboral,
    evolutivoIngresosReduccion,
    bancosFinanciadores,
    estadoPrestamo,
    estadoPrestatarioReprogramacion,
    dificultadPago,
    probabilidadDefault,
    percepcionPasadoPrecios,
    percepcionFuturoExpectativa,
    percepcionFuturoPrecios12Meses,
  } = useMemo(() => {
    if (!liveData || !liveData.hasLiveRows) return { ...ENDEUDAMIENTO_DATA, noCityRows: false }

    const encByCity =
      ciudad && ciudad !== 'ALL'
        ? liveData.encuestados.filter((e: any) => matchCiudad(e.ciudad, ciudad))
        : liveData.encuestados
    const hasCityRows = encByCity.length > 0
    const activeEncuestados = hasCityRows ? encByCity : liveData.encuestados
    const allowedEncIds = new Set(activeEncuestados.map((e: any) => e.encuestado_id))

    const activePerfil = liveData.perfilConsumidor.filter((r: any) => allowedEncIds.has(r.encuestado_id))
    const activeHipotecario = liveData.hipotecario.filter((r: any) => allowedEncIds.has(r.encuestado_id))
    const activePercepcion = (liveData.percepcionMercado ?? []).filter((r: any) => allowedEncIds.has(r.encuestado_id))

    const zonasLive = buildFreqList(activePerfil, 'zona_vivienda_q13', 'zona', 20)
    const finLive = buildFreqList(activeHipotecario, 'tipo_financiamiento_q14', 'tipo', 8)
    const valorCompraLive = buildFreqList(activeHipotecario, 'monto_compra_usd_q19', 'rango', 10)
    const tipoVivLive = buildFreqList(activePerfil, 'tipo_vivienda_simplificado_q10_1', 'tipo', 5)
    const dormsLive = buildFreqList(activePerfil, 'dormitorios_rango_q11', 'dorms', 6)
    const tamanoFamLive = buildFreqList(activePerfil, 'tamano_familia_q1_1', 'tamano', 5)
    const bancosLive = buildFreqList(activeHipotecario, 'institucion_financiera_q15', 'banco', 14)
    const nivelDeudaLive = buildFreqList(activeHipotecario, 'nivel_deuda_nd', 'rango', 6)
    const aporteLive = buildFreqList(activeHipotecario, 'pct_aporte_propio_q17', 'rango', 8)
    const nseLive = buildFreqList(activeEncuestados, 'nse', 'estrato', 6)
    const ingresoFamLive = buildFreqList(activePerfil, 'ingresos_hogar_bs_q4', 'rango', 10)

    // Mapa encuestado_id -> año de encuesta (2022..2026)
    const encYearMap = new Map<any, string>()
    for (const e of activeEncuestados) {
      if (e.encuestado_id != null && e.anio_encuesta != null) {
        encYearMap.set(e.encuestado_id, String(e.anio_encuesta))
      }
    }

    // 4.1 Situación laboral (origen_ingresos_q5 y emocion_ambiente_laboral_q6)
    const perf2026 = activePerfil.filter((r: any) => encYearMap.get(r.encuestado_id) === '2026')
    const baseLaboralRows = perf2026.length > 0 ? perf2026 : activePerfil
    const fuenteLive = buildFreqList(baseLaboralRows, 'origen_ingresos_q5', 'fuente', 6).map((f) => ({
      fuente: f.fuente,
      y2023: f.pct,
      y2024: f.pct,
      y2025: f.pct,
      y2026: f.pct,
    }))
    const climaLive = buildFreqList(baseLaboralRows, 'emocion_ambiente_laboral_q6', 'emocion', 8).map((c) => ({
      emocion: c.emocion,
      y2023: c.pct,
      y2024: c.pct,
      y2025: c.pct,
      y2026: c.pct,
    }))

    // 4.1 Evolutivo ingresos (reduccion_ingresos_12m_q8 cruzado por año 2024, 2025, 2026)
    const redRawByLabel = new Map<string, { orderKey: string; y2024: number; y2025: number; y2026: number }>()
    const redTotals = { '2024': 0, '2025': 0, '2026': 0 }
    for (const r of activePerfil) {
      const raw = String(r.reduccion_ingresos_12m_q8 ?? '').trim()
      const ano = encYearMap.get(r.encuestado_id)
      if (!raw || raw.toLowerCase() === 'null' || (ano !== '2024' && ano !== '2025' && ano !== '2026')) continue
      const clean = cleanLabel(raw)
      const item = redRawByLabel.get(clean) ?? { orderKey: raw.toLowerCase(), y2024: 0, y2025: 0, y2026: 0 }
      if (ano === '2024') {
        item.y2024 += 1
        redTotals['2024'] += 1
      } else if (ano === '2025') {
        item.y2025 += 1
        redTotals['2025'] += 1
      } else if (ano === '2026') {
        item.y2026 += 1
        redTotals['2026'] += 1
      }
      redRawByLabel.set(clean, item)
    }
    const evolutivoIngresosLive = Array.from(redRawByLabel.entries())
      .sort((a, b) => a[1].orderKey.localeCompare(b[1].orderKey))
      .map(([rango, counts]) => ({
        rango,
        y2024: redTotals['2024'] > 0 ? Math.round((counts.y2024 / redTotals['2024']) * 1000) / 10 : 0,
        y2025: redTotals['2025'] > 0 ? Math.round((counts.y2025 / redTotals['2025']) * 1000) / 10 : 0,
        y2026: redTotals['2026'] > 0 ? Math.round((counts.y2026 / redTotals['2026']) * 1000) / 10 : 0,
      }))

    // 4.2 Estado del prestatario: ¿Difirió o reprogramó en los últimos 12 meses? (difirio_12m_q24 por año)
    const difByYear = new Map<string, { no: number; si: number; total: number }>()
    for (const h of activeHipotecario) {
      const ano = encYearMap.get(h.encuestado_id)
      const val = String(h.difirio_12m_q24 ?? '').trim().toLowerCase()
      if (!ano || !val || val === 'null') continue
      const curr = difByYear.get(ano) ?? { no: 0, si: 0, total: 0 }
      if (val.startsWith('no')) {
        curr.no += 1
        curr.total += 1
      } else if (val.startsWith('si') || val.startsWith('sí')) {
        curr.si += 1
        curr.total += 1
      }
      difByYear.set(ano, curr)
    }
    const reprogramacionLive = Array.from(difByYear.entries())
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ano, v]) => ({
        ano,
        no: Math.round((v.no / v.total) * 1000) / 10,
        si: Math.round((v.si / v.total) * 1000) / 10,
      }))

    // 4.2 Evolutivo del endeudamiento (dificultad_pago_simplificado_q25_1 y probabilidad_default_q26)
    const dificultadLive = buildFreqList(activeHipotecario, 'dificultad_pago_simplificado_q25_1', 'nivel', 6)
    const defaultLive = buildFreqList(activeHipotecario, 'probabilidad_default_q26', 'nivel', 6)

    // 4.3 Perspectivas del comprador (enc_credito_percepcion_mercado: 796 filas)
    const percRows = activePercepcion
    let percPasadoLive: typeof ENDEUDAMIENTO_DATA.percepcionPasadoPrecios = []
    let percFuturoExpLive: typeof ENDEUDAMIENTO_DATA.percepcionFuturoExpectativa = []
    let percFuturoPreciosLive: typeof ENDEUDAMIENTO_DATA.percepcionFuturoPrecios12Meses = []

    if (percRows.length > 0) {
      percFuturoExpLive = buildFreqList(percRows, 'expectativa_2026_2027_q38', 'concepto', 6)

      const buildYearTrend = (col: string) => {
        const byAno = new Map<string, { b: number; i: number; s: number; total: number }>()
        for (const r of percRows) {
          const ano = encYearMap.get(r.encuestado_id)
          const v = String(r[col] ?? '').toLowerCase()
          if (!ano || !v || v === 'null') continue
          const c = byAno.get(ano) ?? { b: 0, i: 0, s: 0, total: 0 }
          if (v.includes('baj')) {
            c.b += 1
            c.total += 1
          } else if (v.includes('igual') || v.includes('mant')) {
            c.i += 1
            c.total += 1
          } else if (v.includes('sub')) {
            c.s += 1
            c.total += 1
          }
          byAno.set(ano, c)
        }
        return Array.from(byAno.entries())
          .filter(([, v]) => v.total > 0)
          .sort((a, b) => a[0].localeCompare(b[0]))
      }

      percPasadoLive = buildYearTrend('precio_12m_pasado_q32').map(([ano, v]) => ({
        ano,
        bajo: Math.round((v.b / v.total) * 1000) / 10,
        igual: Math.round((v.i / v.total) * 1000) / 10,
        subio: Math.round((v.s / v.total) * 1000) / 10,
      }))

      percFuturoPreciosLive = buildYearTrend('precio_12m_futuro_q35').map(([ano, v]) => ({
        ano,
        bajara: Math.round((v.b / v.total) * 1000) / 10,
        igual: Math.round((v.i / v.total) * 1000) / 10,
        subira: Math.round((v.s / v.total) * 1000) / 10,
      }))
    }

    return {
      ...ENDEUDAMIENTO_DATA,
      noCityRows: Boolean(ciudad && ciudad !== 'ALL' && !hasCityRows),
      zonasCredito: zonasLive.length > 0 ? zonasLive : ENDEUDAMIENTO_DATA.zonasCredito,
      tiposFinanciacion: finLive.length > 0 ? finLive : ENDEUDAMIENTO_DATA.tiposFinanciacion,
      caracteristicasHogar: {
        valorCompra: valorCompraLive.length > 0 ? valorCompraLive : ENDEUDAMIENTO_DATA.caracteristicasHogar.valorCompra,
        tipoVivienda: tipoVivLive.length > 0 ? tipoVivLive : ENDEUDAMIENTO_DATA.caracteristicasHogar.tipoVivienda,
        dormitorios: dormsLive.length > 0 ? dormsLive : ENDEUDAMIENTO_DATA.caracteristicasHogar.dormitorios,
        tamanoFamilia: tamanoFamLive.length > 0 ? tamanoFamLive : ENDEUDAMIENTO_DATA.caracteristicasHogar.tamanoFamilia,
      },
      situacionLaboral: {
        fuenteIngresos: fuenteLive.length > 0 ? fuenteLive : ENDEUDAMIENTO_DATA.situacionLaboral.fuenteIngresos,
        climaLaboral: climaLive.length > 0 ? climaLive : ENDEUDAMIENTO_DATA.situacionLaboral.climaLaboral,
      },
      evolutivoIngresosReduccion:
        evolutivoIngresosLive.length > 0 ? evolutivoIngresosLive : ENDEUDAMIENTO_DATA.evolutivoIngresosReduccion,
      bancosFinanciadores: bancosLive.length > 0 ? bancosLive : ENDEUDAMIENTO_DATA.bancosFinanciadores,
      estadoPrestamo: {
        nivelDeuda: nivelDeudaLive.length > 0 ? nivelDeudaLive : ENDEUDAMIENTO_DATA.estadoPrestamo.nivelDeuda,
        aportePropio: aporteLive.length > 0 ? aporteLive : ENDEUDAMIENTO_DATA.estadoPrestamo.aportePropio,
        nse: nseLive.length > 0 ? nseLive : ENDEUDAMIENTO_DATA.estadoPrestamo.nse,
        ingresoFamiliar: ingresoFamLive.length > 0 ? ingresoFamLive : ENDEUDAMIENTO_DATA.estadoPrestamo.ingresoFamiliar,
      },
      estadoPrestatarioReprogramacion:
        reprogramacionLive.length > 0 ? reprogramacionLive : ENDEUDAMIENTO_DATA.estadoPrestatarioReprogramacion,
      dificultadPago: dificultadLive.length > 0 ? dificultadLive : ENDEUDAMIENTO_DATA.dificultadPago,
      probabilidadDefault: defaultLive.length > 0 ? defaultLive : ENDEUDAMIENTO_DATA.probabilidadDefault,
      percepcionPasadoPrecios:
        percPasadoLive.length > 0 ? percPasadoLive : ENDEUDAMIENTO_DATA.percepcionPasadoPrecios,
      percepcionFuturoExpectativa:
        percFuturoExpLive.length > 0 ? percFuturoExpLive : ENDEUDAMIENTO_DATA.percepcionFuturoExpectativa,
      percepcionFuturoPrecios12Meses:
        percFuturoPreciosLive.length > 0 ? percFuturoPreciosLive : ENDEUDAMIENTO_DATA.percepcionFuturoPrecios12Meses,
    }
  }, [liveData, ciudad])

  // Charts
  const getBarH = (categories: string[], values: number[], color = '#38bdf8') => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: '{b}: <b>{c}%</b>' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    yAxis: {
      type: 'category',
      data: [...categories].reverse(),
      axisLabel: { color: ct.text },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
    },
    series: [
      {
        type: 'bar',
        data: [...values].reverse(),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
      },
    ],
  })

  const getPie = (data: { name: string; value: number }[], colors?: string[]) => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: ct.muted } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        data,
        itemStyle: { borderRadius: 4, borderColor: '#070b12', borderWidth: 2 },
        color: colors || ['#38bdf8', '#ff6b00', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#64748b'],
      },
    ],
  })

  return (
    <div className="citrino-panel-wrap">
      {/* Pestañas superiores del capítulo activo */}
      {activeChapter === '4.1' && (
        <TopTabBar
          tabs={[
            { label: 'Zona de Otorgación de Créditos', active: perfilSubTab === 'zona', onClick: () => setPerfilSubTab('zona') },
            { label: 'Características de Hogar', active: perfilSubTab === 'hogar', onClick: () => setPerfilSubTab('hogar') },
            { label: 'Situación Laboral', active: perfilSubTab === 'laboral', onClick: () => setPerfilSubTab('laboral') },
            { label: 'Evolutivo Ingresos', active: perfilSubTab === 'ingresos', onClick: () => setPerfilSubTab('ingresos') },
          ]}
        />
      )}
      {activeChapter === '4.2' && (
        <TopTabBar
          tabs={[
            { label: 'Bancos Financiadores', active: carteraSubTab === 'bancos', onClick: () => setCarteraSubTab('bancos') },
            { label: 'Estado de Préstamo', active: carteraSubTab === 'prestamo', onClick: () => setCarteraSubTab('prestamo') },
            { label: 'Estado del Prestatario', active: carteraSubTab === 'prestatario', onClick: () => setCarteraSubTab('prestatario') },
            { label: 'Evolutivo del Endeudamiento', active: carteraSubTab === 'endeudamiento', onClick: () => setCarteraSubTab('endeudamiento') },
          ]}
        />
      )}
      {activeChapter === '4.3' && (
        <TopTabBar
          tabs={[
            { label: 'Percepción del Pasado', active: perspectivasSubTab === 'pasado', onClick: () => setPerspectivasSubTab('pasado') },
            { label: 'Percepción del Futuro', active: perspectivasSubTab === 'futuro', onClick: () => setPerspectivasSubTab('futuro') },
          ]}
        />
      )}

      {noCityRows && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--fs-cuerpo)',
          }}
        >
          <b>Nota de cobertura ({cityLabel}):</b> En <code>citrino_db</code> las encuestas de endeudamiento hipotecario (`enc_credito_encuestados`) solo tienen registros para <b>Santa Cruz</b> (0 encuestas cargadas para {cityLabel}). Se muestra el estudio disponible de Santa Cruz.
        </div>
      )}

      {/* ── 4.1 PERFIL DEL CONSUMIDOR (n=796) ── */}
      {activeChapter === '4.1' && (
        <div>
          {/* 01-A Zona y Financiación */}
          {perfilSubTab === 'zona' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${zonaSubPill === 'zona' ? 'active' : ''}`}
                  onClick={() => setZonaSubPill('zona')}
                >
                  📍 Zona de Créditos (Territorial)
                </button>
                <button
                  className={`citrino-subpill-btn ${zonaSubPill === 'financiacion' ? 'active' : ''}`}
                  onClick={() => setZonaSubPill('financiacion')}
                >
                  🏦 Tipo de Financiación (VIS vs Regular)
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {zonaSubPill === 'zona'
                      ? 'Distribución Territorial de Créditos Otorgados (Santa Cruz)'
                      : '¿Qué tipo de financiamiento tiene actualmente para su vivienda?'}
                  </h3>
                </div>
                {zonaSubPill === 'zona' ? (
                  <ReactECharts
                    option={getBarH(zonasCredito.slice(0, 14).map((z) => z.zona), zonasCredito.slice(0, 14).map((z) => z.pct), '#38bdf8')}
                    style={{ height: 380 }}
                  />
                ) : (
                  <ReactECharts
                    option={getPie(tiposFinanciacion.map((t) => ({ name: t.tipo, value: t.pct })), ['#10b981', '#38bdf8', '#ff6b00', '#a855f7', '#64748b'])}
                    style={{ height: 320 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 01-B Características de Hogar (Valor, Tipo, Familias) */}
          {perfilSubTab === 'hogar' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${hogarSubPill === 'valor' ? 'active' : ''}`}
                  onClick={() => setHogarSubPill('valor')}
                >
                  💵 Valor de la Vivienda
                </button>
                <button
                  className={`citrino-subpill-btn ${hogarSubPill === 'tipo' ? 'active' : ''}`}
                  onClick={() => setHogarSubPill('tipo')}
                >
                  🏠 Tipo y Dormitorios
                </button>
                <button
                  className={`citrino-subpill-btn ${hogarSubPill === 'familias' ? 'active' : ''}`}
                  onClick={() => setHogarSubPill('familias')}
                >
                  👨‍👩‍👧‍👦 Familias y Viviendas
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {hogarSubPill === 'valor'
                      ? '¿De cuántos dólares más o menos fue el monto de compra de su vivienda?'
                      : hogarSubPill === 'tipo'
                      ? 'Distribución por Tipo de Vivienda y Cantidad de Dormitorios'
                      : 'Tamaño de Familias por Tipologías de Viviendas'}
                  </h3>
                </div>

                {hogarSubPill === 'valor' && (
                  <ReactECharts
                    option={getBarH(caracteristicasHogar.valorCompra.map((v) => v.rango), caracteristicasHogar.valorCompra.map((v) => v.pct), '#ff6b00')}
                    style={{ height: 320 }}
                  />
                )}

                {hogarSubPill === 'tipo' && (
                  <div className="citrino-charts-grid" style={{ marginBottom: 0 }}>
                    <div style={{ flex: 1 }}>
                      <ReactECharts
                        option={getBarH(caracteristicasHogar.tipoVivienda.map((t) => t.tipo), caracteristicasHogar.tipoVivienda.map((t) => t.pct), '#ff6b00')}
                        style={{ height: 260 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <ReactECharts
                        option={getBarH(caracteristicasHogar.dormitorios.map((d) => d.dorms), caracteristicasHogar.dormitorios.map((d) => d.pct), '#10b981')}
                        style={{ height: 260 }}
                      />
                    </div>
                  </div>
                )}

                {hogarSubPill === 'familias' && (
                  <ReactECharts
                    option={getPie(caracteristicasHogar.tamanoFamilia.map((f) => ({ name: f.tamano, value: f.pct })))}
                    style={{ height: 280 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 01-C Situación Laboral (n=690) */}
          {perfilSubTab === 'laboral' && (
            <div className="citrino-charts-grid">
              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">La mayor parte de sus ingresos familiares provienen de: (2026)</h3>
                </div>
                <ReactECharts
                  option={getBarH(situacionLaboral.fuenteIngresos.map((f) => f.fuente), situacionLaboral.fuenteIngresos.map((f) => f.y2026), '#10b981')}
                  style={{ height: 260 }}
                />
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">¿Qué emoción describe mejor su ambiente laboral? (2026)</h3>
                </div>
                <ReactECharts
                  option={getBarH(situacionLaboral.climaLaboral.map((c) => c.emocion), situacionLaboral.climaLaboral.map((c) => c.y2026), '#38bdf8')}
                  style={{ height: 260 }}
                />
              </div>
            </div>
          )}

          {/* 01-D Evolutivo Ingresos (n=490) */}
          {perfilSubTab === 'ingresos' && (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">¿En qué porcentaje se han reducido sus ingresos familiares en los últimos 12 meses?</h3>
                <span className="citrino-card-hint">Muestra: n = 490 familias deudoras (2024 - 2026)</span>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Rango de Reducción</th>
                      <th className="num">2024</th>
                      <th className="num">2025</th>
                      <th className="num">2026 (Actual)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evolutivoIngresosReduccion.map((r) => (
                      <tr key={r.rango}>
                        <td><b>{r.rango}</b></td>
                        <td className="num">{r.y2024}%</td>
                        <td className="num">{r.y2025}%</td>
                        <td className="num" style={{ color: r.rango.includes('0%') ? 'var(--text-success)' : 'var(--citrino-orange)' }}>
                          <b>{r.y2026}%</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4.2 ESTADO DE CARTERA HIPOTECARIA (n=796) ── */}
      {activeChapter === '4.2' && (
        <div>
          {/* 02-A Bancos Financiadores */}
          {carteraSubTab === 'bancos' && (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Participación de Mercado por Banco Acreedor (n = 796)</h3>
              </div>
              <ReactECharts
                option={getBarH(bancosFinanciadores.map((b) => b.banco), bancosFinanciadores.map((b) => b.pct), '#ff6b00')}
                style={{ height: 380 }}
              />
            </div>
          )}

          {/* 02-B Estado del Préstamo (5 Sub-pills auditadas) */}
          {carteraSubTab === 'prestamo' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${prestamoSubPill === 'deuda' ? 'active' : ''}`}
                  onClick={() => setPrestamoSubPill('deuda')}
                >
                  ⚖️ Nivel de Deuda
                </button>
                <button
                  className={`citrino-subpill-btn ${prestamoSubPill === 'aporte' ? 'active' : ''}`}
                  onClick={() => setPrestamoSubPill('aporte')}
                >
                  💰 Aporte Propio
                </button>
                <button
                  className={`citrino-subpill-btn ${prestamoSubPill === 'nse' ? 'active' : ''}`}
                  onClick={() => setPrestamoSubPill('nse')}
                >
                  👥 Nivel Socioeconómico (NSE)
                </button>
                <button
                  className={`citrino-subpill-btn ${prestamoSubPill === 'ingreso' ? 'active' : ''}`}
                  onClick={() => setPrestamoSubPill('ingreso')}
                >
                  💵 Ingreso Familiar
                </button>
                <button
                  className={`citrino-subpill-btn ${prestamoSubPill === 'bancos' ? 'active' : ''}`}
                  onClick={() => setPrestamoSubPill('bancos')}
                >
                  🏦 Bancos
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {prestamoSubPill === 'deuda'
                      ? 'Nivel de Deuda como Porcentaje de los Ingresos Familiares'
                      : prestamoSubPill === 'aporte'
                      ? '¿Qué porcentaje de aporte propio (cuota inicial) pagó por su vivienda?'
                      : prestamoSubPill === 'nse'
                      ? 'Distribución de Deudores por Nivel Socioeconómico (NSE)'
                      : prestamoSubPill === 'ingreso'
                      ? '¿De cuántos Bolivianos son sus ingresos mensuales familiares?'
                      : 'Concentración de la Cartera Hipotecaria en Bancos'}
                  </h3>
                </div>

                {prestamoSubPill === 'deuda' && (
                  <ReactECharts
                    option={getPie(estadoPrestamo.nivelDeuda.map((d) => ({ name: d.rango, value: d.pct })), ['#10b981', '#38bdf8', '#f59e0b', '#ef4444'])}
                    style={{ height: 300 }}
                  />
                )}

                {prestamoSubPill === 'aporte' && (
                  <ReactECharts
                    option={getBarH(estadoPrestamo.aportePropio.map((a) => a.rango), estadoPrestamo.aportePropio.map((a) => a.pct), '#38bdf8')}
                    style={{ height: 280 }}
                  />
                )}

                {prestamoSubPill === 'nse' && (
                  <ReactECharts
                    option={getPie(estadoPrestamo.nse.map((n) => ({ name: n.estrato, value: n.pct })), ['#38bdf8', '#ff6b00', '#10b981', '#a855f7'])}
                    style={{ height: 300 }}
                  />
                )}

                {prestamoSubPill === 'ingreso' && (
                  <ReactECharts
                    option={getBarH(estadoPrestamo.ingresoFamiliar.map((i) => i.rango), estadoPrestamo.ingresoFamiliar.map((i) => i.pct), '#10b981')}
                    style={{ height: 320 }}
                  />
                )}

                {prestamoSubPill === 'bancos' && (
                  <ReactECharts
                    option={getBarH(bancosFinanciadores.slice(0, 6).map((b) => b.banco), bancosFinanciadores.slice(0, 6).map((b) => b.pct), '#ff6b00')}
                    style={{ height: 260 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 02-C Estado del Prestatario (Reprogramación) */}
          {carteraSubTab === 'prestatario' && (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">¿Usted difirió o reprogramó su crédito bancario en los últimos 12 meses? (2023 - 2026)</h3>
                <span className="citrino-card-hint">Muestra: n = 690 prestatarios</span>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th className="num">No Reprogramó (%)</th>
                      <th className="num">Sí Reprogramó (%)</th>
                      <th>Lectura de Estrés Crediticio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadoPrestatarioReprogramacion.map((r) => (
                      <tr key={r.ano}>
                        <td><b>{r.ano}</b></td>
                        <td className="num" style={{ color: 'var(--text-success)' }}>{r.no}%</td>
                        <td className="num" style={{ color: 'var(--color-rojo-500)' }}><b>{r.si}%</b></td>
                        <td>{r.ano === '2023' ? 'Pico después de la pandemia' : r.ano === '2026' ? 'Leve repunte de reprogramaciones' : 'Baja morosidad declarada'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 02-D Evolutivo Endeudamiento (Puntualidad y Default) */}
          {carteraSubTab === 'endeudamiento' && (
            <div className="citrino-charts-grid">
              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">¿Qué tan difícil le ha sido pagar a tiempo su crédito?</h3>
                </div>
                <ReactECharts
                  option={getBarH(dificultadPago.map((d) => d.nivel), dificultadPago.map((d) => d.pct), '#ff6b00')}
                  style={{ height: 260 }}
                />
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">¿Qué tan probable es que deje de pagar su crédito?</h3>
                </div>
                <ReactECharts
                  option={getBarH(probabilidadDefault.map((p) => p.nivel), probabilidadDefault.map((p) => p.pct), '#38bdf8')}
                  style={{ height: 260 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4.3 PERSPECTIVAS DEL COMPRADOR (n=796) ── */}
      {activeChapter === '4.3' && (
        <div>
          {/* 03-A Percepción Pasado */}
          {perspectivasSubTab === 'pasado' && (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">En los últimos 12 meses ¿Cree usted que el precio de las viviendas ha bajado, se mantuvo igual o subió?</h3>
                <span className="citrino-card-hint">Serie comparativa 2022 a 2026 (n = 796)</span>
              </div>
              <div className="citrino-table-wrap">
                <table className="citrino-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th className="num">Bajó (%)</th>
                      <th className="num">Se Mantuvo Igual (%)</th>
                      <th className="num">Subió (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {percepcionPasadoPrecios.map((p) => (
                      <tr key={p.ano}>
                        <td><b>{p.ano}</b></td>
                        <td className="num" style={{ color: 'var(--color-rojo-500)' }}>{p.bajo}%</td>
                        <td className="num" style={{ color: 'var(--citrino-sky)' }}>{p.igual}%</td>
                        <td className="num" style={{ color: 'var(--text-success)' }}><b>{p.subio}%</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 03-B Percepción Futuro (con Expectativa y Precios a Futuro) */}
          {perspectivasSubTab === 'futuro' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${futuroSubPill === 'expectativa' ? 'active' : ''}`}
                  onClick={() => setFuturoSubPill('expectativa')}
                >
                  🧭 Expectativa General (2026 - 2027)
                </button>
                <button
                  className={`citrino-subpill-btn ${futuroSubPill === 'precios' ? 'active' : ''}`}
                  onClick={() => setFuturoSubPill('precios')}
                >
                  📈 Precios a Futuro (Próximos 12 Meses)
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {futuroSubPill === 'expectativa'
                      ? '¿Qué expectativa tiene de este año y el próximo?'
                      : 'Pensando en los próximos 12 meses ¿Cree que el precio de las viviendas bajará, se mantendrá igual o subirá?'}
                  </h3>
                </div>

                {futuroSubPill === 'expectativa' ? (
                  <ReactECharts
                    option={getBarH(percepcionFuturoExpectativa.map((e) => e.concepto), percepcionFuturoExpectativa.map((e) => e.pct), '#10b981')}
                    style={{ height: 320 }}
                  />
                ) : (
                  <div className="citrino-table-wrap">
                    <table className="citrino-table">
                      <thead>
                        <tr>
                          <th>Año de Proyección</th>
                          <th className="num">Bajará (%)</th>
                          <th className="num">Se Mantendrá Igual (%)</th>
                          <th className="num">Subirá (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {percepcionFuturoPrecios12Meses.map((p) => (
                          <tr key={p.ano}>
                            <td><b>{p.ano}</b></td>
                            <td className="num" style={{ color: 'var(--color-rojo-500)' }}>{p.bajara}%</td>
                            <td className="num" style={{ color: 'var(--citrino-sky)' }}>{p.igual}%</td>
                            <td className="num" style={{ color: 'var(--text-success)' }}><b>{p.subira}%</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
