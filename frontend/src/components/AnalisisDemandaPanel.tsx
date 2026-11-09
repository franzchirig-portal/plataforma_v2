import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { DEMANDA_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'
import { fetchDemandaLive, matchCiudad } from '../lib/supabase'
import TopTabBar from './TopTabBar'

interface Props {
  initialChapter?: '2.1' | '2.2' | '2.3'
  ciudad?: string
}

function cleanSurveyLabel(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .replace(/^[a-z0-9]{1,2}[.)]\s*/i, '')
    .trim()
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildPctList<K extends string>(
  rows: any[],
  field: string,
  keyName: K,
  maxItems = 8
): Array<Record<K, string> & { pct: number }> {
  const counts = new Map<string, number>()
  let total = 0
  for (const r of rows) {
    const label = cleanSurveyLabel(r?.[field])
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

export default function AnalisisDemandaPanel({ initialChapter = '2.1', ciudad = 'SCZ' }: Props) {
  const ct = useChartTheme()
  const [activeChapter] = useState<'2.1' | '2.2' | '2.3'>(initialChapter)
  const [compTab, setCompTab] = useState<'composicion' | 'voluntad'>('composicion')
  const [liveData, setLiveData] = useState<Awaited<ReturnType<typeof fetchDemandaLive>> | null>(null)
  const cityLabel =
    ciudad === 'LPZ' ? 'La Paz' : ciudad === 'CBB' ? 'Cochabamba' : ciudad === 'SCZ' ? 'Santa Cruz' : 'Bolivia'

  useEffect(() => {
    let cancelled = false
    fetchDemandaLive().then((res) => {
      if (!cancelled && res.hasLiveRows) {
        setLiveData(res)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Sub-pills internos auditados para Compra Inversión (2.2)
  const [invSubTab, setInvSubTab] = useState<'motivadores' | 'tipologia' | 'zonas' | 'amenidades'>('motivadores')
  const [invPillTipologia, setInvPillTipologia] = useState<'decision' | 'valor'>('decision')
  const [invPillZonas, setInvPillZonas] = useState<'zona' | 'factores'>('zona')

  // Sub-pills internos auditados para Compra Vivienda Propia (2.3)
  const [vivSubTab, setVivSubTab] = useState<'tipologia' | 'zonas' | 'amenidades' | 'casa' | 'depto'>('tipologia')
  const [vivPillTipologia, setVivPillTipologia] = useState<'aspectos' | 'valor' | 'decision'>('decision')
  const [vivPillZonas, setVivPillZonas] = useState<'zona' | 'factores'>('zona')
  const [vivPillAmenidades, setVivPillAmenidades] = useState<'preferencia' | 'factores'>('preferencia')
  const [vivPillCasa, setVivPillCasa] = useState<'por_que' | 'aspectos' | 'detalles'>('por_que')
  const [vivPillDepto, setVivPillDepto] = useState<'por_que' | 'aspectos' | 'detalles'>('por_que')

  const { general, inversion, viviendaPropia, noCityRows } = useMemo(() => {
    if (!liveData || !liveData.hasLiveRows) {
      return {
        noCityRows: false,
        general: DEMANDA_DATA.general,
        inversion: {
          ...DEMANDA_DATA.inversion,
          amenidadesList: [] as { amenidad: string; pct: number }[],
        },
        viviendaPropia: {
          ...DEMANDA_DATA.viviendaPropia,
          factoresAmenidades: DEMANDA_DATA.inversion.preferenciaAmenidades.map((p) => ({
            factor: p.concepto,
            pct: p.pct,
          })),
          casaDormitorios: DEMANDA_DATA.viviendaPropia.porQueCasa,
          casaTerreno: DEMANDA_DATA.viviendaPropia.porQueCasa,
          deptoDormitorios: DEMANDA_DATA.viviendaPropia.porQueDepto,
          deptoSuperficie: DEMANDA_DATA.viviendaPropia.porQueDepto,
        },
      }
    }

    const encByCity =
      ciudad && ciudad !== 'ALL'
        ? liveData.encuestados.filter((e: any) => matchCiudad(e.ciudad, ciudad))
        : liveData.encuestados
    const hasCityRows = encByCity.length > 0
    const activeEncuestados = hasCityRows ? encByCity : liveData.encuestados
    const allowedEncIds = new Set(activeEncuestados.map((e: any) => e.encuestado_id))

    const perfilRows = liveData.perfilIntencion.filter((r: any) => allowedEncIds.has(r.encuestado_id))
    const invRows = liveData.inversion.filter((r: any) => allowedEncIds.has(r.encuestado_id))
    const allowedInvIds = new Set(invRows.map((r: any) => r.inversion_id))
    const vivRows = liveData.vivienda.filter((r: any) => allowedEncIds.has(r.encuestado_id))
    const allowedVivIds = new Set(vivRows.map((r: any) => r.vivienda_id))

    // 2.1 Voluntad comparativa por año (enc_encuestados.anio_encuesta + enc_perfil_intencion.mudarse_o_inversion_q12)
    const encYearMap = new Map<any, string>()
    for (const e of activeEncuestados) {
      if (e.encuestado_id != null && e.anio_encuesta != null) {
        encYearMap.set(e.encuestado_id, String(e.anio_encuesta))
      }
    }
    const volByYear = new Map<string, { mudarse: number; inversion: number; total: number }>()
    for (const p of perfilRows) {
      const ano = encYearMap.get(p.encuestado_id) ?? '2026'
      const rawVal = String(p.mudarse_o_inversion_q12 ?? '').toLowerCase()
      if (!rawVal) continue
      const entry = volByYear.get(ano) ?? { mudarse: 0, inversion: 0, total: 0 }
      if (rawVal.includes('mudar') || rawVal.includes('vivienda') || rawVal.includes('propia')) {
        entry.mudarse += 1
        entry.total += 1
      } else if (rawVal.includes('inver')) {
        entry.inversion += 1
        entry.total += 1
      }
      volByYear.set(ano, entry)
    }
    const voluntadLive = Array.from(volByYear.entries())
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ano, v]) => ({
        ano,
        viviendaPropia: Math.round((v.mudarse / v.total) * 1000) / 10,
        inversion: Math.round((v.inversion / v.total) * 1000) / 10,
      }))

    const ingresosLive = buildPctList(perfilRows, 'ingresos_rango_q7', 'rango', 8)
    const cuotaLive = buildPctList(perfilRows, 'cuota_rango_q8', 'rango', 8)
    const aporteLive = buildPctList(perfilRows, 'ahorro_rango_q9', 'rango', 6)

    // 2.2 Compra como inversión
    const motivadoresLive = buildPctList(invRows, 'motivador_inversion_q13', 'motivo', 6)
    const invDecAll = (liveData.inversionAspectosDecision ?? []).filter(
      (r: any) => !r.inversion_id || allowedInvIds.has(r.inversion_id)
    )
    const invDec1Rows = invDecAll.filter((r: any) => Number(r.orden) === 1)
    const invDec2Rows = invDecAll.filter((r: any) => Number(r.orden) === 2)
    const decision1FromTable = buildPctList(invDec1Rows, 'aspecto_q17_q18', 'factor', 6)
    const decision2FromTable = buildPctList(invDec2Rows, 'aspecto_q17_q18', 'factor', 6)
    const decision1Live =
      decision1FromTable.length > 0
        ? decision1FromTable
        : buildPctList(invRows, 'opcion_invertir_q14', 'factor', 6)
    const decision2Live =
      decision2FromTable.length > 0
        ? decision2FromTable
        : buildPctList(invRows, 'que_haria_con_inversion_q19', 'factor', 6)

    const valorInvLive = buildPctList(invRows, 'valor_rango_q23', 'rango', 6)
    const zonasInvFromTable = buildPctList(
      (liveData.inversionZonas ?? []).filter((r: any) => !r.inversion_id || allowedInvIds.has(r.inversion_id)),
      'zona_q20_q21',
      'zona',
      8
    )
    const factoresInvFromTable = buildPctList(
      (liveData.inversionFactoresZona ?? []).filter((r: any) => !r.inversion_id || allowedInvIds.has(r.inversion_id)),
      'factor_zona_q22',
      'factor',
      7
    )
    const factoresInvLive =
      factoresInvFromTable.length > 0
        ? factoresInvFromTable
        : buildPctList(invRows, 'alternativa_inversion_q24', 'factor', 7)
    const prefAmenidadesInvLive = buildPctList(invRows, 'factor_importante_areas_q16', 'concepto', 5)
    const amenidadesInvListLive = buildPctList(
      (liveData.inversionAmenidades ?? []).filter((r: any) => !r.inversion_id || allowedInvIds.has(r.inversion_id)),
      'amenidad_q15',
      'amenidad',
      8
    )

    // 2.3 Compra vivienda propia
    const tipologiaVivLive = buildPctList(vivRows, 'opcion_comprar_vivienda_q25', 'tipo', 6)
    const presupuestoVivLive = buildPctList(vivRows, 'valor_rango_q33', 'rango', 6)
    const decisionVivFromTable = buildPctList(
      (liveData.viviendaAspectosDecision ?? []).filter((r: any) => !r.vivienda_id || allowedVivIds.has(r.vivienda_id)),
      'aspecto_q28_q29',
      'factor',
      6
    )
    const decisionVivLive =
      decisionVivFromTable.length > 0
        ? decisionVivFromTable
        : buildPctList(vivRows, 'tiempo_mudarse_q34', 'factor', 6)
    const zonasVivLive = buildPctList(
      liveData.viviendaZonas.filter((r: any) => !r.vivienda_id || allowedVivIds.has(r.vivienda_id)),
      'zona_q30_q31',
      'zona',
      8
    )
    const factoresVivFromTable = buildPctList(
      (liveData.viviendaFactoresZona ?? []).filter((r: any) => !r.vivienda_id || allowedVivIds.has(r.vivienda_id)),
      'factor_zona_q32',
      'factor',
      7
    )
    const factoresAmenidadesVivLive = buildPctList(vivRows, 'factor_importante_areas_q27', 'factor', 5)
    const amenidadesVivLive = buildPctList(
      liveData.viviendaAmenidades.filter((r: any) => !r.vivienda_id || allowedVivIds.has(r.vivienda_id)),
      'amenidad_q26',
      'amenidad',
      8
    )

    // 2.3 Casa y Depto
    const detCasaRows = (liveData.viviendaDetalleCasa ?? []).filter(
      (r: any) => !r.vivienda_id || allowedVivIds.has(r.vivienda_id)
    )
    const detDeptoRows = (liveData.viviendaDetalleDepto ?? []).filter(
      (r: any) => !r.vivienda_id || allowedVivIds.has(r.vivienda_id)
    )
    const porQueCasaFromTable = buildPctList(liveData.viviendaCasaAspectos ?? [], 'aspecto_q36', 'motivo', 6)
    const casaDormsLive = buildPctList(detCasaRows, 'dormitorios_q37', 'motivo', 6)
    const casaTerrenoLive = buildPctList(detCasaRows, 'm2_terreno_rango_q39', 'motivo', 7)
    const casaConstruidosLive = buildPctList(detCasaRows, 'm2_construidos_rango_q40', 'motivo', 8)

    const aspectosDeptoLive = buildPctList(liveData.viviendaDeptoAspectos, 'aspecto_q42', 'motivo', 6)
    const deptoDormsRaw = buildPctList(detDeptoRows, 'dormitorios_q43', 'motivo', 6).map((d) => ({
      motivo: /^\d+$/.test(d.motivo) ? `${d.motivo} dormitorios` : d.motivo,
      pct: d.pct,
    }))
    const deptoSupLive = buildPctList(detDeptoRows, 'm2_construidos_rango_q45', 'motivo', 7)

    return {
      noCityRows: Boolean(ciudad && ciudad !== 'ALL' && !hasCityRows),
      general: {
        ...DEMANDA_DATA.general,
        muestra: activeEncuestados.length || DEMANDA_DATA.general.muestra,
        voluntadComparativa: voluntadLive.length > 0 ? voluntadLive : DEMANDA_DATA.general.voluntadComparativa,
        ingresos: ingresosLive.length > 0 ? ingresosLive : DEMANDA_DATA.general.ingresos,
        cuotaMensual: cuotaLive.length > 0 ? cuotaLive : DEMANDA_DATA.general.cuotaMensual,
        aportePropio: aporteLive.length > 0 ? aporteLive : DEMANDA_DATA.general.aportePropio,
      },
      inversion: {
        ...DEMANDA_DATA.inversion,
        muestra: invRows.length || DEMANDA_DATA.inversion.muestra,
        motivadores: motivadoresLive.length > 0 ? motivadoresLive : DEMANDA_DATA.inversion.motivadores,
        decision1: decision1Live.length > 0 ? decision1Live : DEMANDA_DATA.inversion.decision1,
        decision2: decision2Live.length > 0 ? decision2Live : DEMANDA_DATA.inversion.decision2,
        valorInmueble: valorInvLive.length > 0 ? valorInvLive : DEMANDA_DATA.inversion.valorInmueble,
        zonas:
          zonasInvFromTable.length > 0
            ? zonasInvFromTable
            : zonasVivLive.length > 0
            ? zonasVivLive
            : DEMANDA_DATA.inversion.zonas,
        factoresZona: factoresInvLive.length > 0 ? factoresInvLive : DEMANDA_DATA.inversion.factoresZona,
        preferenciaAmenidades:
          prefAmenidadesInvLive.length > 0 ? prefAmenidadesInvLive : DEMANDA_DATA.inversion.preferenciaAmenidades,
        amenidadesList: amenidadesInvListLive,
      },
      viviendaPropia: {
        ...DEMANDA_DATA.viviendaPropia,
        muestra: vivRows.length || DEMANDA_DATA.viviendaPropia.muestra,
        tipologia: tipologiaVivLive.length > 0 ? tipologiaVivLive : DEMANDA_DATA.viviendaPropia.tipologia,
        presupuesto: presupuestoVivLive.length > 0 ? presupuestoVivLive : DEMANDA_DATA.viviendaPropia.presupuesto,
        decision: decisionVivLive.length > 0 ? decisionVivLive : DEMANDA_DATA.viviendaPropia.decision,
        zonas: zonasVivLive.length > 0 ? zonasVivLive : DEMANDA_DATA.viviendaPropia.zonas,
        factoresZona:
          factoresVivFromTable.length > 0
            ? factoresVivFromTable
            : factoresAmenidadesVivLive.length > 0
            ? factoresAmenidadesVivLive
            : DEMANDA_DATA.viviendaPropia.factoresZona,
        amenidades: amenidadesVivLive.length > 0 ? amenidadesVivLive : DEMANDA_DATA.viviendaPropia.amenidades,
        factoresAmenidades:
          factoresAmenidadesVivLive.length > 0
            ? factoresAmenidadesVivLive
            : DEMANDA_DATA.inversion.preferenciaAmenidades.map((p) => ({ factor: p.concepto, pct: p.pct })),
        porQueCasa:
          porQueCasaFromTable.length > 0
            ? porQueCasaFromTable
            : casaConstruidosLive.length > 0
            ? casaConstruidosLive
            : DEMANDA_DATA.viviendaPropia.porQueCasa,
        casaDormitorios: casaDormsLive.length > 0 ? casaDormsLive : DEMANDA_DATA.viviendaPropia.porQueCasa,
        casaTerreno: casaTerrenoLive.length > 0 ? casaTerrenoLive : DEMANDA_DATA.viviendaPropia.porQueCasa,
        porQueDepto: aspectosDeptoLive.length > 0 ? aspectosDeptoLive : DEMANDA_DATA.viviendaPropia.porQueDepto,
        deptoDormitorios: deptoDormsRaw.length > 0 ? deptoDormsRaw : DEMANDA_DATA.viviendaPropia.porQueDepto,
        deptoSuperficie: deptoSupLive.length > 0 ? deptoSupLive : DEMANDA_DATA.viviendaPropia.porQueDepto,
      },
    }
  }, [liveData, ciudad])

  // Charts
  const getPieSimple = (data: { name: string; value: number }[], colors?: string[]) => ({
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
        color: colors || ['#38bdf8', '#ff6b00', '#10b981', '#a855f7', '#f59e0b', '#ec4899'],
      },
    ],
  })

  const getBarSimple = (categories: string[], values: number[], color = '#38bdf8') => ({
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

  // Chart Option: Intención de compra 2025 vs 2026 (vivienda propia vs inversión)
  const getVoluntadChart = () => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: ct.muted }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: general.voluntadComparativa.map((v) => v.ano),
      axisLabel: { color: ct.muted },
    },
    yAxis: {
      type: 'value',
      name: '% de encuestados',
      axisLabel: { color: ct.muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: ct.grid } },
    },
    series: [
      {
        name: 'Vivienda propia',
        type: 'bar',
        data: general.voluntadComparativa.map((v) => v.viviendaPropia),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Inversión',
        type: 'bar',
        data: general.voluntadComparativa.map((v) => v.inversion),
        itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] },
      },
    ],
  })

  return (
    <div className="citrino-panel-wrap">
      {/* Pestañas superiores del capítulo activo */}
      {activeChapter === '2.1' && (
        <TopTabBar
          tabs={[
            { label: 'Composición Económica', active: compTab === 'composicion', onClick: () => setCompTab('composicion') },
            { label: 'Voluntad de Compra', active: compTab === 'voluntad', onClick: () => setCompTab('voluntad') },
          ]}
        />
      )}
      {activeChapter === '2.2' && (
        <TopTabBar
          tabs={[
            { label: 'Motivadores', active: invSubTab === 'motivadores', onClick: () => setInvSubTab('motivadores') },
            { label: 'Tipología y Precio', active: invSubTab === 'tipologia', onClick: () => setInvSubTab('tipologia') },
            { label: 'Preferencias de Zonas', active: invSubTab === 'zonas', onClick: () => setInvSubTab('zonas') },
            { label: 'Valores Agregados', active: invSubTab === 'amenidades', onClick: () => setInvSubTab('amenidades') },
          ]}
        />
      )}
      {activeChapter === '2.3' && (
        <TopTabBar
          tabs={[
            { label: 'Tipologías y Precio', active: vivSubTab === 'tipologia', onClick: () => setVivSubTab('tipologia') },
            { label: 'Preferencias de Zona', active: vivSubTab === 'zonas', onClick: () => setVivSubTab('zonas') },
            { label: 'Valores Agregados', active: vivSubTab === 'amenidades', onClick: () => setVivSubTab('amenidades') },
            { label: 'Preferencia casa', active: vivSubTab === 'casa', onClick: () => setVivSubTab('casa') },
            { label: 'Preferencia Departamento', active: vivSubTab === 'depto', onClick: () => setVivSubTab('depto') },
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
          <b>Nota de cobertura ({cityLabel}):</b> En <code>citrino_db</code> las encuestas de demanda (`enc_encuestados`) solo tienen registros para <b>Santa Cruz</b> (0 encuestas cargadas para {cityLabel}). Se muestra el estudio disponible de Santa Cruz.
        </div>
      )}

      {/* ── 2.1 COMPOSICIÓN ECONÓMICA ── */}
      {activeChapter === '2.1' && compTab === 'voluntad' && (() => {
        const latestVol = general.voluntadComparativa[general.voluntadComparativa.length - 1] ?? { ano: '2026', viviendaPropia: 55, inversion: 45 }
        const prevVol = general.voluntadComparativa[general.voluntadComparativa.length - 2] ?? { ano: '2025', viviendaPropia: 42, inversion: 58 }
        return (
          <div>
            <div className="citrino-kpis-grid">
              <div className="citrino-kpi-card green">
                <span className="citrino-kpi-label">Intención Vivienda Propia</span>
                <span className="citrino-kpi-val">{latestVol.viviendaPropia}%</span>
                <span className="citrino-kpi-sub">
                  {latestVol.viviendaPropia >= prevVol.viviendaPropia ? 'Sube' : 'Baja'} de {prevVol.viviendaPropia}% en {prevVol.ano}
                </span>
              </div>
              <div className="citrino-kpi-card blue">
                <span className="citrino-kpi-label">Intención Inversión</span>
                <span className="citrino-kpi-val">{latestVol.inversion}%</span>
                <span className="citrino-kpi-sub">
                  {latestVol.inversion >= prevVol.inversion ? 'Sube' : 'Baja'} de {prevVol.inversion}% en {prevVol.ano}
                </span>
              </div>
            </div>

            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Intención de compra: vivienda propia vs inversión (2025 - 2026)</h3>
                <span className="citrino-card-hint">Muestra: n = {general.muestra} encuestados</span>
              </div>
              <ReactECharts option={getVoluntadChart()} style={{ height: 320 }} />
            </div>
          </div>
        )
      })()}

      {activeChapter === '2.1' && compTab === 'composicion' && (() => {
        const topIngreso = general.ingresos[0] ?? { rango: '3k - 7k Bs/mes', pct: 41 }
        const topAporte = general.aportePropio[0] ?? { rango: '< 25.000 Bs', pct: 40.6 }
        return (
          <div>
            <div className="citrino-kpis-grid">
              <div className="citrino-kpi-card amber">
                <span className="citrino-kpi-label">Estrato Ingreso Principal</span>
                <span className="citrino-kpi-val">{topIngreso.rango}</span>
                <span className="citrino-kpi-sub">{topIngreso.pct}% de hogares consultados (n = {general.muestra})</span>
              </div>
              <div className="citrino-kpi-card purple">
                <span className="citrino-kpi-label">Cuota Inicial Disponible</span>
                <span className="citrino-kpi-val">{topAporte.rango}</span>
                <span className="citrino-kpi-sub">{topAporte.pct}% de los compradores potenciales</span>
              </div>
            </div>

            <div className="citrino-charts-grid">
              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">Estratificación de Ingresos Familiares Mensuales</h3>
                </div>
                <ReactECharts
                  option={getBarSimple(general.ingresos.map((i) => i.rango), general.ingresos.map((i) => i.pct), '#10b981')}
                  style={{ height: 280 }}
                />
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">Capacidad Máxima de Cuota Mensual Destinada a Vivienda</h3>
                </div>
                <ReactECharts
                  option={getBarSimple(general.cuotaMensual.map((c) => c.rango), general.cuotaMensual.map((c) => c.pct), '#38bdf8')}
                  style={{ height: 280 }}
                />
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── 2.2 COMPRA COMO INVERSIÓN ── */}
      {activeChapter === '2.2' && (
        <div>
          {/* 02-A Motivadores */}
          {invSubTab === 'motivadores' && (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Motivadores Clave para Comprar como Inversión (n = {inversion.muestra})</h3>
              </div>
              <ReactECharts
                option={getPieSimple(inversion.motivadores.map((m) => ({ name: m.motivo, value: m.pct })), ['#10b981', '#ff6b00', '#38bdf8'])}
                style={{ height: 320 }}
              />
            </div>
          )}

          {/* 02-B Tipología y Precio (con Decisión y Valor) */}
          {invSubTab === 'tipologia' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${invPillTipologia === 'decision' ? 'active' : ''}`}
                  onClick={() => setInvPillTipologia('decision')}
                >
                  🎯 Factores que deciden la compra
                </button>
                <button
                  className={`citrino-subpill-btn ${invPillTipologia === 'valor' ? 'active' : ''}`}
                  onClick={() => setInvPillTipologia('valor')}
                >
                  💵 Valor del inmueble (precio objetivo)
                </button>
              </div>

              {invPillTipologia === 'decision' ? (
                <div className="citrino-charts-grid">
                  <div className="citrino-card-box">
                    <div className="citrino-card-header">
                      <h3 className="citrino-card-title">1er Aspecto Decisivo de Inversión</h3>
                    </div>
                    <ReactECharts
                      option={getBarSimple(inversion.decision1.map((d) => d.factor), inversion.decision1.map((d) => d.pct), '#ff6b00')}
                      style={{ height: 260 }}
                    />
                  </div>
                  <div className="citrino-card-box">
                    <div className="citrino-card-header">
                      <h3 className="citrino-card-title">2do Aspecto Decisivo de Inversión</h3>
                    </div>
                    <ReactECharts
                      option={getBarSimple(inversion.decision2.map((d) => d.factor), inversion.decision2.map((d) => d.pct), '#38bdf8')}
                      style={{ height: 260 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Presupuesto / Rango de Compra de Inversión</h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(inversion.valorInmueble.map((v) => v.rango), inversion.valorInmueble.map((v) => v.pct), '#10b981')}
                    style={{ height: 280 }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 02-C Preferencias de Zonas (con Zona y Factores) */}
          {invSubTab === 'zonas' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${invPillZonas === 'zona' ? 'active' : ''}`}
                  onClick={() => setInvPillZonas('zona')}
                >
                  📍 Preferencia de Zona Geográfica
                </button>
                <button
                  className={`citrino-subpill-btn ${invPillZonas === 'factores' ? 'active' : ''}`}
                  onClick={() => setInvPillZonas('factores')}
                >
                  🔍 Factores de Elección de Zona
                </button>
              </div>

              {invPillZonas === 'zona' ? (
                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Zonas Preferidas para Invertir en Bienes Raíces</h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(inversion.zonas.map((z) => z.zona), inversion.zonas.map((z) => z.pct), '#38bdf8')}
                    style={{ height: 300 }}
                  />
                </div>
              ) : (
                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Ranking de Factores para Elegir la Zona de Inversión</h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(inversion.factoresZona.map((f) => f.factor), inversion.factoresZona.map((f) => f.pct), '#ff6b00')}
                    style={{ height: 300 }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 02-D Valores Agregados (con Preferencia) */}
          {invSubTab === 'amenidades' && (
            <div>
              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">Áreas comunes vs costo de expensas (inversión)</h3>
                </div>
                <ReactECharts
                  option={getPieSimple(inversion.preferenciaAmenidades.map((a) => ({ name: a.concepto, value: a.pct })))}
                  style={{ height: 300 }}
                />
              </div>
              {inversion.amenidadesList && inversion.amenidadesList.length > 0 && (
                <div className="citrino-card-box" style={{ marginTop: 16 }}>
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Amenidades más valoradas por el inversionista</h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(inversion.amenidadesList.map((a) => a.amenidad), inversion.amenidadesList.map((a) => a.pct), '#10b981')}
                    style={{ height: 280 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 2.3 COMPRA VIVIENDA PROPIA ── */}
      {activeChapter === '2.3' && (
        <div>
          {/* 03-A Tipología y Precio (con Aspectos, Valor, Decisión) */}
          {vivSubTab === 'tipologia' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${vivPillTipologia === 'decision' ? 'active' : ''}`}
                  onClick={() => setVivPillTipologia('decision')}
                >
                  🎯 Decisión de Compra
                </button>
                <button
                  className={`citrino-subpill-btn ${vivPillTipologia === 'valor' ? 'active' : ''}`}
                  onClick={() => setVivPillTipologia('valor')}
                >
                  💵 Presupuesto de Valor
                </button>
                <button
                  className={`citrino-subpill-btn ${vivPillTipologia === 'aspectos' ? 'active' : ''}`}
                  onClick={() => setVivPillTipologia('aspectos')}
                >
                  📐 Tipología Espacial
                </button>
              </div>

              {vivPillTipologia === 'decision' && (
                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Factor Principal en la Decisión de Compra Familiar</h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(viviendaPropia.decision.map((d) => d.factor), viviendaPropia.decision.map((d) => d.pct), '#ff6b00')}
                    style={{ height: 260 }}
                  />
                </div>
              )}

              {vivPillTipologia === 'valor' && (
                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Presupuesto Máximo para Compra de Vivienda Familiar</h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(viviendaPropia.presupuesto.map((p) => p.rango), viviendaPropia.presupuesto.map((p) => p.pct), '#10b981')}
                    style={{ height: 280 }}
                  />
                </div>
              )}

              {vivPillTipologia === 'aspectos' && (
                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">Preferencia de Tipología Inmobiliaria Familiar</h3>
                  </div>
                  <ReactECharts
                    option={getPieSimple(viviendaPropia.tipologia.map((t) => ({ name: t.tipo, value: t.pct })))}
                    style={{ height: 280 }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 03-B Zonas (con Zona y Factores) */}
          {vivSubTab === 'zonas' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${vivPillZonas === 'zona' ? 'active' : ''}`}
                  onClick={() => setVivPillZonas('zona')}
                >
                  📍 Zonas Preferidas
                </button>
                <button
                  className={`citrino-subpill-btn ${vivPillZonas === 'factores' ? 'active' : ''}`}
                  onClick={() => setVivPillZonas('factores')}
                >
                  🔍 Factores de Elección
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {vivPillZonas === 'zona' ? 'Zonas donde Busca Comprar para Vivir' : 'Factores Críticos para Elegir el Barrio Familiar'}
                  </h3>
                </div>
                {vivPillZonas === 'zona' ? (
                  <ReactECharts
                    option={getBarSimple(viviendaPropia.zonas.map((z) => z.zona), viviendaPropia.zonas.map((z) => z.pct), '#38bdf8')}
                    style={{ height: 300 }}
                  />
                ) : (
                  <ReactECharts
                    option={getBarSimple(viviendaPropia.factoresZona.map((f) => f.factor), viviendaPropia.factoresZona.map((f) => f.pct), '#ff6b00')}
                    style={{ height: 300 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 03-C Valores Agregados (con Preferencia y Factores) */}
          {vivSubTab === 'amenidades' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Ver:</span>
                <button
                  className={`citrino-subpill-btn ${vivPillAmenidades === 'preferencia' ? 'active' : ''}`}
                  onClick={() => setVivPillAmenidades('preferencia')}
                >
                  🏊‍♂️ Amenidades Preferidas
                </button>
                <button
                  className={`citrino-subpill-btn ${vivPillAmenidades === 'factores' ? 'active' : ''}`}
                  onClick={() => setVivPillAmenidades('factores')}
                >
                  🌿 Factores y Expensas
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {vivPillAmenidades === 'preferencia'
                      ? 'Áreas Comunes Prioritarias para la Familia'
                      : 'Preferencia de Áreas Comunes vs Costo de Expensas'}
                  </h3>
                </div>
                {vivPillAmenidades === 'preferencia' ? (
                  <ReactECharts
                    option={getBarSimple(viviendaPropia.amenidades.map((a) => a.amenidad), viviendaPropia.amenidades.map((a) => a.pct), '#10b981')}
                    style={{ height: 280 }}
                  />
                ) : (
                  <ReactECharts
                    option={getPieSimple(viviendaPropia.factoresAmenidades.map((f) => ({ name: f.factor, value: f.pct })))}
                    style={{ height: 280 }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 03-D Preferencia Casa (¿Por qué Casa?, Aspectos, Detalles) */}
          {vivSubTab === 'casa' && (() => {
            const casaActiveList =
              vivPillCasa === 'por_que'
                ? viviendaPropia.porQueCasa
                : vivPillCasa === 'aspectos'
                ? viviendaPropia.casaDormitorios
                : viviendaPropia.casaTerreno
            return (
              <div>
                <div className="citrino-subpills-row">
                  <span className="citrino-subpill-label">Ver:</span>
                  <button
                    className={`citrino-subpill-btn ${vivPillCasa === 'por_que' ? 'active' : ''}`}
                    onClick={() => setVivPillCasa('por_que')}
                  >
                    🏡 ¿Por qué Casa?
                  </button>
                  <button
                    className={`citrino-subpill-btn ${vivPillCasa === 'aspectos' ? 'active' : ''}`}
                    onClick={() => setVivPillCasa('aspectos')}
                  >
                    📐 Dormitorios Preferidos
                  </button>
                  <button
                    className={`citrino-subpill-btn ${vivPillCasa === 'detalles' ? 'active' : ''}`}
                    onClick={() => setVivPillCasa('detalles')}
                  >
                    🧱 Superficie de Terreno (m²)
                  </button>
                </div>

                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">
                      {vivPillCasa === 'por_que'
                        ? 'Razones Clave de la Preferencia por Casa Independiente'
                        : vivPillCasa === 'aspectos'
                        ? 'Distribución de Dormitorios Preferida en Casa'
                        : 'Superficie de Terreno Buscada para Casa (m²)'}
                    </h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(casaActiveList.map((c) => c.motivo), casaActiveList.map((c) => c.pct), '#ff6b00')}
                    style={{ height: 280 }}
                  />
                </div>
              </div>
            )
          })()}

          {/* 03-E Preferencia Depto (¿Por qué Depto?, Aspectos, Detalles) */}
          {vivSubTab === 'depto' && (() => {
            const deptoActiveList =
              vivPillDepto === 'por_que'
                ? viviendaPropia.porQueDepto
                : vivPillDepto === 'aspectos'
                ? viviendaPropia.deptoDormitorios
                : viviendaPropia.deptoSuperficie
            return (
              <div>
                <div className="citrino-subpills-row">
                  <span className="citrino-subpill-label">Ver:</span>
                  <button
                    className={`citrino-subpill-btn ${vivPillDepto === 'por_que' ? 'active' : ''}`}
                    onClick={() => setVivPillDepto('por_que')}
                  >
                    🏢 ¿Por qué Departamento?
                  </button>
                  <button
                    className={`citrino-subpill-btn ${vivPillDepto === 'aspectos' ? 'active' : ''}`}
                    onClick={() => setVivPillDepto('aspectos')}
                  >
                    📐 Dormitorios Preferidos
                  </button>
                  <button
                    className={`citrino-subpill-btn ${vivPillDepto === 'detalles' ? 'active' : ''}`}
                    onClick={() => setVivPillDepto('detalles')}
                  >
                    🔑 Superficie Construida (m²)
                  </button>
                </div>

                <div className="citrino-card-box">
                  <div className="citrino-card-header">
                    <h3 className="citrino-card-title">
                      {vivPillDepto === 'por_que'
                        ? 'Razones Clave de la Preferencia por Departamento'
                        : vivPillDepto === 'aspectos'
                        ? 'Distribución de Dormitorios Preferida en Departamento'
                        : 'Superficie Construida Buscada en Departamento (m²)'}
                    </h3>
                  </div>
                  <ReactECharts
                    option={getBarSimple(deptoActiveList.map((d) => d.motivo), deptoActiveList.map((d) => d.pct), '#38bdf8')}
                    style={{ height: 280 }}
                  />
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
