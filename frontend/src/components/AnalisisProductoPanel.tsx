import { useEffect, useState } from 'react'
import {
  fetchIndicadores,
  fetchTipologiasForProject,
  fetchAllAvgTipologias,
  computeTipologiaBenchmarks,
  getLatestPerProject,
  fetchAmenidadesForProject,
  fetchCondicionForIndicador,
  fetchDetalleTipologias,
} from '../lib/supabase'
import type {
  IndicadorFull,
  AvgTipologia,
  TipologiaBenchmark,
  CondicionFinanciera,
  TipologiaDetalle,
} from '../lib/supabase'

interface Props {
  ciudad: string
  zonaFilter?: string
  subzonaFilter?: string
  tipoInmuebleFilter?: string
  etapaFilter?: string | string[]
  periodoFilter?: string
  tipologiaFilter?: string
  moneda?: 'USD' | 'BS'
  selectedIndicador: IndicadorFull | null
  onSelectIndicador: (ind: IndicadorFull | null) => void
  theme?: 'dark' | 'light'
}

function fmt(n: number | null | undefined, dec = 1): string {
  if (n == null) return '—'
  return n.toLocaleString('es-BO', { maximumFractionDigits: dec })
}

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$US ' + Math.round(n).toLocaleString('es-BO')
}

const IconBuilding = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-success)' }}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
)

const IconHouse = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-success)' }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconLocation = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4, opacity: 0.7 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

function getBedIcon(tipo: string): string {
  const t = tipo.toLowerCase()
  if (t.includes('mono') || t.includes('estudio')) return 'M'
  if (t.includes('1')) return '1D'
  if (t.includes('2')) return '2D'
  if (t.includes('3') || t.includes('más') || t.includes('mas')) return '3D+'
  if (t.includes('penthouse') || t.includes('ph')) return 'PH'
  return 'MOD'
}

export default function AnalisisProductoPanel({
  ciudad,
  zonaFilter,
  subzonaFilter,
  tipoInmuebleFilter,
  etapaFilter,
  periodoFilter,
  tipologiaFilter,
  selectedIndicador,
  onSelectIndicador,
  theme = 'light',
}: Props) {
  const [proyectos, setProyectos] = useState<IndicadorFull[]>([])
  const [tipologias, setTipologias] = useState<AvgTipologia[]>([])
  const [amenidades, setAmenidades] = useState<string[]>([])
  const [condicion, setCondicion] = useState<CondicionFinanciera | null>(null)
  const [detalleTipos, setDetalleTipos] = useState<TipologiaDetalle[]>([])
  const [marketBenchmarks, setMarketBenchmarks] = useState<Record<string, TipologiaBenchmark>>({})
  const [loading, setLoading] = useState(true)
  const [loadingTipos, setLoadingTipos] = useState(false)


  // Load projects for current city and market benchmarks
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchIndicadores(ciudad === 'ALL' ? undefined : ciudad),
      fetchAllAvgTipologias(),
    ])
      .then(([inds, allTipos]) => {
        let snapshotInds = inds
        if (periodoFilter && periodoFilter !== 'ALL') {
          snapshotInds = snapshotInds.filter((p) => p.fecha_snapshot === periodoFilter)
        }
        let latest = getLatestPerProject(snapshotInds)

        if (zonaFilter && zonaFilter !== 'ALL') {
          latest = latest.filter((p) => (p.ZONAS || 'Sin Zona').trim() === zonaFilter.trim())
        }
        if (subzonaFilter && subzonaFilter !== 'ALL') {
          latest = latest.filter((p) => (p.SUBZONAS || 'Sin Subzona').trim() === subzonaFilter.trim())
        }
        if (tipoInmuebleFilter && tipoInmuebleFilter !== 'ALL') {
          latest = latest.filter((p) => (p.tipo_inmueble || '').toLowerCase().trim() === tipoInmuebleFilter.toLowerCase().trim())
        }
        if (etapaFilter) {
          if (Array.isArray(etapaFilter)) {
            if (etapaFilter.length > 0 && !etapaFilter.includes('ALL')) {
              latest = latest.filter((p) => etapaFilter.includes(p.etapa || ''))
            }
          } else if (etapaFilter !== 'ALL') {
            latest = latest.filter((p) => p.etapa === etapaFilter)
          }
        }

        // Tipologia filter
        let filteredTipos = allTipos
        if (tipologiaFilter && tipologiaFilter !== 'ALL') {
          const normTipo = tipologiaFilter.toLowerCase().trim()
          filteredTipos = allTipos.filter((t) => {
            const k = (t.avg_tipologia || '').toLowerCase().trim()
            return k === normTipo || k.includes(normTipo)
          })
          const matchingIndIds = new Set(filteredTipos.map((t) => t.indicador_censo_id))
          latest = latest.filter((p) => matchingIndIds.has(p.indicador_censo_id))
        }

        latest.sort((a, b) => a.proyecto.localeCompare(b.proyecto))
        setProyectos(latest)
        setMarketBenchmarks(computeTipologiaBenchmarks(filteredTipos))

        // Select first project if none active
        if (!selectedIndicador && latest.length > 0) {
          onSelectIndicador(latest[0])
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('AnalisisProductoPanel load error:', err)
        setLoading(false)
      })
  }, [ciudad, zonaFilter, subzonaFilter, tipoInmuebleFilter, etapaFilter, periodoFilter, tipologiaFilter])

  // When selectedIndicador changes, fetch full project intelligence: tipologias, amenidades, condiciones, detalles
  useEffect(() => {
    if (!selectedIndicador) {
      setTipologias([])
      setAmenidades([])
      setCondicion(null)
      setDetalleTipos([])
      return
    }
    const current = selectedIndicador
    setLoadingTipos(true)
    Promise.all([
      fetchTipologiasForProject(current.proyecto_id, current.indicador_censo_id),
      fetchAmenidadesForProject(current.proyecto_id),
      fetchCondicionForIndicador(current.indicador_censo_id),
      fetchDetalleTipologias(current.indicador_censo_id),
    ])
      .then(([tipos, amens, cond, detTipos]) => {
        setTipologias(tipos)
        setAmenidades(amens)
        setCondicion(cond)
        setDetalleTipos(detTipos)
        setLoadingTipos(false)
      })
      .catch((err) => {
        console.error('Error fetching project intelligence:', err)
        setLoadingTipos(false)
      })
  }, [selectedIndicador])


  // Active Project Data
  const proj = selectedIndicador
  const projNombre = proj?.proyecto || 'Proyecto'
  const projZona = proj?.ZONAS || 'Zona no especificada'
  const projSubzona = proj?.SUBZONAS ? ` • ${proj.SUBZONAS}` : ''
  const projEtapa = proj?.etapa || 'Sin etapa'
  const projCalidad = proj?.calidad ? proj.calidad.toUpperCase() : 'STANDARD'
  const projPisos = proj?.pisos ? `${proj.pisos} Pisos` : '— Pisos'
  const projUndTotales = proj?.und_totales ?? '—'
  const projUndVendidas = proj?.und_vendidas ?? 0
  const projUndPorVender = proj?.und_por_vender ?? (typeof proj?.und_totales === 'number' ? Math.max(0, proj.und_totales - projUndVendidas) : '—')
  const projPctVendido = proj?.pct_vendido ?? (proj?.und_totales && proj.und_totales > 0 ? Math.round((projUndVendidas / proj.und_totales) * 100) : null)
  const tipologiasRitmoSum = tipologias.reduce((s, t) => s + (t.ritmo_venta ?? 0), 0)
  const projRitmo = (proj?.ritmo_venta != null && proj.ritmo_venta > 0)
    ? proj.ritmo_venta
    : (tipologiasRitmoSum > 0 ? tipologiasRitmoSum : (proj?.ritmo_venta != null ? proj.ritmo_venta : null))
  const projMesesStock = proj?.meses_stock != null
    ? proj.meses_stock
    : (typeof projUndPorVender === 'number' && projRitmo != null && projRitmo > 0
      ? projUndPorVender / projRitmo
      : (projUndPorVender === 0 ? 0 : null))

  // Tipo de Cambio & Condiciones
  const tcVal = detalleTipos[0]?.tc_oficial ?? detalleTipos[0]?.tc ?? (proj?.tc && proj.tc > 0 ? proj.tc : 7.0)
  const condicionesVentaText = condicion?.modalidad_pago
    ? condicion.modalidad_pago
    : condicion?.aporte_inicial
    ? `${condicion.aporte_inicial}% (inicial) - ${100 - condicion.aporte_inicial}% (contraentrega)`
    : '50% (inicial) - 50% (contraentrega)'

  // Parqueo y Precios
  const parqueoVal = proj?.parqueo_sus ? fmtUSD(proj.parqueo_sus) : '—'
  const avgM2List = proj?.sus_m2 ?? (tipologias.length > 0 ? Math.round(tipologias.reduce((a, b) => a + (b.avg_sus_m2 || 0), 0) / tipologias.length) : null)
  const avgM2Real = detalleTipos.length > 0 && detalleTipos.some((d) => d.usd_m2 != null)
    ? Math.round(detalleTipos.reduce((a, b) => a + (b.usd_m2 || 0), 0) / detalleTipos.length)
    : (avgM2List && tcVal ? Math.round(avgM2List * (6.96 / tcVal)) : null)

  const diffPctRealVsLista = avgM2List && avgM2Real && avgM2List > 0
    ? Math.round(((avgM2Real - avgM2List) / avgM2List) * 100)
    : null

  // Tipo de inmueble: casas vs departamentos
  const isCasa = (proj?.tipo_inmueble || '').toLowerCase().includes('casa') ||
                 (proj?.tipo_inmueble || '').toLowerCase().includes('vivienda') ||
                 (proj?.tipo_inmueble || '').toLowerCase().includes('horizontal')




  return (
    <div className="panel panel-center" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header con Selector de Proyecto, Último Relevamiento y Subtabs ─── */}
      <div className="panel-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '8px 14px',
      }}>
        {/* Left: Selector de Proyecto y Último Relevamiento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260, maxWidth: 420 }}>
            <span style={{
              fontSize: 'var(--fs-etiqueta)',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Proyecto:
            </span>
            <select
              value={selectedIndicador?.indicador_censo_id ?? ''}
              onChange={(e) => {
                const found = proyectos.find((p) => p.indicador_censo_id === e.target.value)
                if (found) onSelectIndicador(found)
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: 'var(--fs-cuerpo)',
                fontWeight: 700,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}>
              {proyectos.map((p) => (
                <option key={p.indicador_censo_id} value={p.indicador_censo_id}>
                  {p.proyecto} {p.ZONAS ? `(${p.ZONAS})` : `(${p.ciudad})`}
                </option>
              ))}
            </select>
          </div>

          {proj && (
            <span style={{
              fontSize: 'var(--fs-etiqueta)',
              fontWeight: 600,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 10px',
              borderRadius: 4,
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              Último Relevamiento: <strong style={{ color: 'var(--text-primary)' }}>{proj.fecha_snapshot}</strong>
            </span>
          )}
        </div>

      </div>

      {/* ── Cuerpo Principal del Panel ─── */}
      <div className="panel-body" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading || loadingTipos ? (
          <div className="empty-state" style={{ padding: '50px 0' }}>
            <div className="loading-shimmer" style={{ width: 220, height: 18, marginBottom: 10 }} />
            <div className="loading-shimmer" style={{ width: 340, height: 14 }} />
            <div style={{ marginTop: 14, fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>
              Cargando inteligencia de producto, amenidades y modelos…
            </div>
          </div>
        ) : !proj ? (
          <div className="empty-state" style={{ padding: '50px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--fs-subtitulo)', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Selecciona un proyecto para ver su análisis a detalle
            </div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════
                DOSSIER EJECUTIVO Y MODELOS (CREATIVO & INSTITUCIONAL)
               ═══════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── CARD 1: HERO IDENTIDAD DEL PROYECTO ── */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative subtle ambient backdrop */}
                  <div style={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 180,
                    height: 180,
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}>
                    {/* Project Title & Location */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {isCasa ? <IconHouse /> : <IconBuilding />}
                        </div>
                        <h2 style={{
                          margin: 0,
                          fontSize: 'var(--fs-titulo)',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          letterSpacing: -0.5,
                          textTransform: 'uppercase',
                        }}>
                          {projNombre}
                        </h2>
                        {/* Etapa Badge */}
                        <span style={{
                          fontSize: 'var(--fs-etiqueta)',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 12,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--text-success)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-success)' }} />
                          {projEtapa}
                        </span>
                      </div>

                      <div style={{
                        marginTop: 4,
                        fontSize: 'var(--fs-cuerpo)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <IconLocation />
                          <strong>{projZona}</strong>{projSubzona}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>Ciudad: {proj.ciudad}</span>
                        {proj.desarrollador && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: 'var(--text-muted)' }}>Desarrollador: <strong>{proj.desarrollador}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Micro-Metrics Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                      {/* Calidad */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontWeight: 600 }}>CALIDAD</div>
                        <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {projCalidad}
                        </div>
                      </div>

                      {/* Pisos */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontWeight: 600 }}>PISOS</div>
                        <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {projPisos}
                        </div>
                      </div>

                      {/* Unidades Totales */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontWeight: 600 }}>UND. TOTALES</div>
                        <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {projUndTotales}
                        </div>
                      </div>

                      {/* Ritmo de Venta */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontWeight: 600 }}>RITMO DE VENTA</div>
                        <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: (projRitmo ?? 0) > 0 ? 'var(--text-success)' : 'var(--text-primary)' }}>
                          {projRitmo != null ? (
                            <>
                              {fmt(projRitmo, 1)}
                              <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 3 }}>und/mes</span>
                            </>
                          ) : '—'}
                        </div>
                      </div>

                      {/* Meses de Stock */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontWeight: 600 }}>MESES DE STOCK</div>
                        <div style={{
                          fontSize: 'var(--fs-cuerpo)',
                          fontWeight: 800,
                          color: projMesesStock != null
                            ? (projMesesStock > 18 ? 'var(--text-danger)' : projMesesStock > 12 ? 'var(--text-warning)' : 'var(--text-success)')
                            : 'var(--text-primary)',
                        }}>
                          {projMesesStock != null ? (
                            <>
                              {fmt(projMesesStock, 1)}
                              <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 3 }}>meses</span>
                            </>
                          ) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: CONDICIONES COMERCIALES, FINANCIERAS Y PRECIOS ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 12,
                }}>
                  {/* Bloque Precios $/m² */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Valuación por Metro Cuadrado
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)' }}>Precio Lista Promedio</div>
                        <div style={{ fontSize: 'var(--fs-titulo)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                          {avgM2List ? `$${fmt(avgM2List, 0)}` : '—'} <span style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 500, color: 'var(--text-muted)' }}>USD/m²</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)' }}>Precio Real Estimado</div>
                        <div style={{ fontSize: 'var(--fs-titulo)', fontWeight: 800, color: 'var(--text-success)', letterSpacing: -0.5 }}>
                          {avgM2Real ? `$${fmt(avgM2Real, 0)}` : '—'} <span style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 500, color: 'var(--text-muted)' }}>USD/m²</span>
                        </div>
                      </div>
                    </div>

                    {diffPctRealVsLista != null && (
                      <div style={{
                        fontSize: 'var(--fs-etiqueta)',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-surface)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px dashed var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span>Ajuste cambiario real:</span>
                        <strong style={{ color: 'var(--text-success)' }}>{diffPctRealVsLista}% vs Lista</strong>
                      </div>
                    )}
                  </div>

                  {/* Bloque Condiciones y Tipo de Cambio */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Condiciones Comerciales
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)' }}>Condiciones de Venta:</span>
                      <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {condicionesVentaText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)' }}>Tipo de Cambio (Proyecto):</span>
                      <span style={{
                        fontSize: 'var(--fs-etiqueta)',
                        fontWeight: 800,
                        color: 'var(--text-warning)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}>
                        TC {tcVal} Bs/$US
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)' }}>Precio Parqueo:</span>
                      <span style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {parqueoVal}
                      </span>
                    </div>
                  </div>

                  {/* Bloque Salud Comercial del Proyecto */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 'var(--fs-etiqueta)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Inventario y Absorción
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avance Comercial:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {projUndVendidas} vendidas / {projUndTotales} totales
                      </span>
                    </div>

                    <div className="progress-bar-wrap" style={{ height: 6 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, projPctVendido ?? 0)}%`,
                          background: (projPctVendido ?? 0) >= 50 ? 'var(--text-success)' : '#3b82f6',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', marginTop: 2 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Stock por Vender:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{projUndPorVender} Unidades</strong>
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: ÁREAS COMUNES DEL PROYECTO ── */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Áreas Comunes y Equipamiento del Proyecto
                    </span>
                    <span style={{
                      fontSize: 'var(--fs-etiqueta)',
                      fontWeight: 700,
                      color: 'var(--text-success)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}>
                      {amenidades.length} Equipadas
                    </span>
                  </div>

                  {/* Solo muestra las áreas comunes que tiene ese proyecto */}
                  {amenidades.length === 0 ? (
                    <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                      No se registraron áreas comunes específicas para este proyecto.
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 8,
                    }}>
                      {amenidades.map((amenidad, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 12px',
                            background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--fs-etiqueta)',
                          }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--text-success)',
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {amenidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── CARD 4: SECCIÓN DE MODELOS Y ABSORCIÓN (TODAS LAS TIPOLOGÍAS CON SUS KPIs VALIOSOS) ── */}
                <div style={{ marginTop: 4 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.2 }}>
                        Modelos Censados y Absorción Comercial en {projNombre}
                      </div>
                      <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>
                        {tipologias.length} tipologías registradas con ritmo de absorción, meses de stock y benchmarks de plaza
                      </div>
                    </div>

                  </div>

                  {tipologias.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Sin modelos desglosados para este proyecto
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                      gap: 12,
                    }}>
                      {tipologias.map((t) => {
                        const bench = marketBenchmarks[t.avg_tipologia]
                        const pctVend = t.und_totales && t.und_vendidas != null
                          ? Math.round((t.und_vendidas / t.und_totales) * 100)
                          : null

                        // Enriched info from detalle tipologias
                        const det = detalleTipos.find(
                          (d) => (d.tipologia || '').toLowerCase().includes(t.avg_tipologia.toLowerCase()) ||
                                 t.avg_tipologia.toLowerCase().includes((d.tipologia || '').toLowerCase())
                        )
                        const banosCount = det?.banos ?? (t.avg_tipologia.toLowerCase().includes('mono') ? 1 : t.avg_tipologia.toLowerCase().includes('1') ? 1 : 2)
                        const realM2Price = det?.usd_m2 ?? (t.avg_sus_m2 ? Math.round(t.avg_sus_m2 * (6.96 / tcVal)) : null)

                        return (
                          <div
                            key={t.avg_tipologia}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                              boxShadow: 'none',
                              position: 'relative',
                            }}>
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-subtle)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: 'var(--fs-etiqueta)',
                                  color: 'var(--text-primary)',
                                  flexShrink: 0,
                                }}>
                                  {getBedIcon(t.avg_tipologia)}
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {t.avg_tipologia}
                                  </div>
                                  <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                                    <span>{t.avg_construccion_m2 ? `${fmt(t.avg_construccion_m2)} m² constr.` : 'Área no disp.'}</span>
                                    <span>•</span>
                                    <span>{banosCount} {banosCount === 1 ? 'Baño' : 'Baños'}</span>
                                  </div>
                                </div>
                              </div>

                              {pctVend != null && (
                                <span className={pctVend >= 50 ? 'badge-pos' : 'badge-neg'}>
                                  {pctVend >= 50 ? '▲' : '▼'} {pctVend}% vendido
                                </span>
                              )}
                            </div>

                            {/* Price Hero Section */}
                            <div style={{
                              background: 'var(--bg-surface)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px 12px',
                              border: '1px solid var(--border-default)',
                            }}>
                              <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', marginBottom: 2 }}>
                                PRECIO PROMEDIO MODELO
                              </div>
                              <div style={{ fontSize: 'var(--fs-titulo)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                                {fmtUSD(t.avg_precio)}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 'var(--fs-etiqueta)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  $/m² Lista: <strong style={{ color: 'var(--text-primary)' }}>{fmt(t.avg_sus_m2)} $US</strong>
                                </span>
                                {realM2Price && (
                                  <span style={{ color: 'var(--text-success)', fontWeight: 700 }}>
                                    Real: ${fmt(realM2Price, 0)}
                                  </span>
                                )}
                              </div>
                              {t.avg_bs_m2 && (
                                <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {fmt(t.avg_bs_m2, 0)} Bs/m²
                                </div>
                              )}
                            </div>

                            {/* Inventory & Progress */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-etiqueta)', marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Avance Comercial</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                  {t.und_vendidas ?? 0} / {t.und_totales ?? 0} und
                                </span>
                              </div>
                              <div className="progress-bar-wrap" style={{ height: 4 }}>
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${Math.min(100, pctVend ?? 0)}%`,
                                    background: (pctVend ?? 0) >= 50 ? 'var(--text-success)' : '#3b82f6',
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>
                                <span>Por vender: <strong style={{ color: 'var(--text-primary)' }}>{t.und_por_vender ?? 0}</strong></span>
                                {pctVend != null && <span>{pctVend}%</span>}
                              </div>
                            </div>

                            {/* Velocity & Stock Months (INFORMACIÓN VALIOSA PRESERVADA) */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 8,
                              paddingTop: 6,
                              borderTop: '1px solid var(--border-subtle)',
                              fontSize: 'var(--fs-etiqueta)',
                            }}>
                              <div>
                                <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>Ritmo de venta</div>
                                <div style={{ fontWeight: 700, color: (t.ritmo_venta ?? 0) > 0 ? 'var(--text-success)' : 'var(--text-muted)', marginTop: 1 }}>
                                  {t.ritmo_venta != null && t.ritmo_venta > 0 ? `${fmt(t.ritmo_venta)} und/mes` : '—'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>Meses de stock</div>
                                <div style={{
                                  fontWeight: 700,
                                  color: (t.meses_stock ?? 0) > 18 ? 'var(--text-danger)' : (t.meses_stock ?? 0) > 12 ? 'var(--text-warning)' : 'var(--text-success)',
                                  marginTop: 1,
                                }}>
                                  {t.meses_stock != null ? `${fmt(t.meses_stock)} meses` : '—'}
                                </div>
                              </div>
                            </div>

                            {/* Benchmark Comparison Tag (INFORMACIÓN VALIOSA PRESERVADA) */}
                            {bench && t.avg_sus_m2 && bench.avgSusM2 > 0 && (
                              <div style={{
                                fontSize: 'var(--fs-etiqueta)',
                                color: 'var(--text-muted)',
                                background: 'rgba(255,255,255,0.02)',
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: '1px dashed var(--border-default)',
                              }}>
                                {(() => {
                                  const diff = ((t.avg_sus_m2 - bench.avgSusM2) / bench.avgSusM2) * 100
                                  const isPositive = diff >= 0
                                  return (
                                    <span>
                                      vs Media Plaza ({fmt(bench.avgSusM2)} $/m²):{' '}
                                      <strong style={{ color: isPositive ? 'var(--text-success)' : 'var(--text-danger)' }}>
                                        {isPositive ? `▲ +${diff.toFixed(1)}%` : `▼ ${diff.toFixed(1)}%`}
                                      </strong>
                                    </span>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── CARD 5: TABLA COMPARATIVA COMPACTA DE TODOS LOS MODELOS ── */}
                {tipologias.length > 0 && (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                  }}>
                    <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Tabla Resumen de Tipologías en {projNombre}
                    </div>
                    <div className="data-table-wrap">
                      <table className="data-table" style={{ fontSize: 'var(--fs-etiqueta)' }}>
                        <thead>
                          <tr>
                            <th>Tipología</th>
                            <th>Baños</th>
                            <th style={{ textAlign: 'right' }}>Área (m²)</th>
                            <th style={{ textAlign: 'right' }}>Ticket Lista ($US)</th>
                            <th style={{ textAlign: 'right' }}>$/m² Lista</th>
                            <th style={{ textAlign: 'right' }}>$/m² Real</th>
                            <th style={{ textAlign: 'center' }}>Und. Totales</th>
                            <th style={{ textAlign: 'center' }}>Und. Vendidas</th>
                            <th style={{ textAlign: 'right' }}>Ritmo</th>
                            <th style={{ textAlign: 'right' }}>Meses Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tipologias.map((t) => {
                            const det = detalleTipos.find(
                              (d) => (d.tipologia || '').toLowerCase().includes(t.avg_tipologia.toLowerCase()) ||
                                     t.avg_tipologia.toLowerCase().includes((d.tipologia || '').toLowerCase())
                            )
                            const banosCount = det?.banos ?? (t.avg_tipologia.toLowerCase().includes('mono') ? 1 : t.avg_tipologia.toLowerCase().includes('1') ? 1 : 2)
                            const realM2 = det?.usd_m2 ?? (t.avg_sus_m2 ? Math.round(t.avg_sus_m2 * (6.96 / tcVal)) : null)
                            return (
                              <tr key={t.avg_tipologia}>
                                <td style={{ fontWeight: 700 }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: 'var(--fs-etiqueta)',
                                    fontWeight: 700,
                                    marginRight: 6,
                                    color: 'var(--text-secondary)',
                                  }}>
                                    {getBedIcon(t.avg_tipologia)}
                                  </span>
                                  {t.avg_tipologia}
                                </td>
                                <td>{banosCount} {banosCount === 1 ? 'Baño' : 'Baños'}</td>
                                <td style={{ textAlign: 'right' }}>{t.avg_construccion_m2 ? `${fmt(t.avg_construccion_m2)} m²` : '—'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtUSD(t.avg_precio)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(t.avg_sus_m2, 0)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-success)' }}>{realM2 ? `$${fmt(realM2, 0)}` : '—'}</td>
                                <td style={{ textAlign: 'center' }}>{t.und_totales ?? '—'}</td>
                                <td style={{ textAlign: 'center', color: 'var(--text-success)', fontWeight: 600 }}>{t.und_vendidas ?? 0}</td>
                                <td style={{ textAlign: 'right' }}>{t.ritmo_venta ? `${fmt(t.ritmo_venta)} u/m` : '—'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.meses_stock ? `${fmt(t.meses_stock)} m` : '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
          </>
        )}
      </div>
    </div>
  )
}
