import { useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  fetchIndicadores,
  getLatestPerProject,
  fetchAmenidadesForProject,
  fetchCondicionForIndicador,
  fetchTipologiasForProject,
  fetchDetalleTipologias,
} from '../lib/supabase'
import type {
  IndicadorFull,
  AvgTipologia,
  CondicionFinanciera,
  TipologiaDetalle,
} from '../lib/supabase'
import './ComparacionProyectosPanel.css'

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

// ─── Sober SVG Icons (Strictly Zero Emojis) ─────────────────────────────────
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconLocation = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconSwap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />
  </svg>
)

const IconTrophy = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ─── Sección desplegable (colapsada por defecto, se abre al hacer click) ────
interface CollapsibleSectionProps {
  id: string
  title: string
  subtitle: string
  headerRight?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}

function CollapsibleSection({ id, title, subtitle, headerRight, open, onToggle, children }: CollapsibleSectionProps) {
  const contentId = `cmp-section-${id}`
  return (
    <div className="cmp-panel-card">
      <button
        type="button"
        className={`cmp-collapse-toggle${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}>
        <div>
          <div className="cmp-card-title">{title}</div>
          <div className="cmp-card-subtitle">{subtitle}</div>
        </div>
        <div className="cmp-collapse-head-side">
          {headerRight}
          <span className="cmp-collapse-chevron">
            <IconChevron />
          </span>
        </div>
      </button>
      {open && <div id={contentId} className="cmp-collapse-body">{children}</div>}
    </div>
  )
}

function fmt(n: number | null | undefined, dec = 1): string {
  if (n == null) return '—'
  return n.toLocaleString('es-BO', { maximumFractionDigits: dec })
}

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$US ' + Math.round(n).toLocaleString('es-BO')
}

function fmtLanzamiento(raw: string | null | undefined): string {
  if (!raw) return 'No indicada'
  const trimmed = raw.trim()
  if (!trimmed) return 'No indicada'
  if (/^\d{4}-\d{2}(-\d{2})?/.test(trimmed)) {
    const parts = trimmed.split('-')
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parts[2] ? parseInt(parts[2], 10) : 1
    const dt = new Date(y, m, d)
    if (!isNaN(dt.getTime())) {
      const monthName = dt.toLocaleDateString('es-BO', { month: 'short' })
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`
    }
  }
  return trimmed
}

interface ProjectDataBundle {
  proj: IndicadorFull
  amenidades: string[]
  condicion: CondicionFinanciera | null
  tipologias: AvgTipologia[]
  detalles: TipologiaDetalle[]
}

export default function ComparacionProyectosPanel({
  ciudad,
  zonaFilter,
  subzonaFilter,
  tipoInmuebleFilter,
  periodoFilter,
  selectedIndicador,
  onSelectIndicador,
}: Props) {
  const [proyectos, setProyectos] = useState<IndicadorFull[]>([])
  const [loading, setLoading] = useState(true)

  // Slots: Project IDs to compare (Slot A and Slot B by default, optional Slot C)
  const [slotAId, setSlotAId] = useState<string>('')
  const [slotBId, setSlotBId] = useState<string>('')
  const [slotCId, setSlotCId] = useState<string>('')
  const [showSlotC, setShowSlotC] = useState<boolean>(false)

  // Bundles containing enriched details per project
  const [bundles, setBundles] = useState<Record<string, ProjectDataBundle>>({})

  // Secciones desplegables: colapsadas por defecto. El estado vive aquí (no en
  // CollapsibleSection) para que no se reinicie al recargar el listado por filtros.
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    tipologias: false,
    matriz: false,
    amenidades: false,
  })
  const toggleSeccion = (key: keyof typeof seccionesAbiertas) =>
    setSeccionesAbiertas((prev) => ({ ...prev, [key]: !prev[key] }))

  // Load project list
  useEffect(() => {
    setLoading(true)
    fetchIndicadores(ciudad === 'ALL' ? undefined : ciudad)
      .then((inds) => {
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
          latest = latest.filter(
            (p) => (p.tipo_inmueble || '').toLowerCase().trim() === tipoInmuebleFilter.toLowerCase().trim()
          )
        }

        latest.sort((a, b) => a.proyecto.localeCompare(b.proyecto))
        setProyectos(latest)

        // Initialize default slots if not set or if current not in list
        if (latest.length > 0) {
          const firstId = selectedIndicador ? selectedIndicador.proyecto_id : latest[0].proyecto_id
          const secondId = latest.find((p) => p.proyecto_id !== firstId)?.proyecto_id || latest[0].proyecto_id
          setSlotAId((prev) => (prev && latest.some((x) => x.proyecto_id === prev) ? prev : firstId))
          setSlotBId((prev) => (prev && latest.some((x) => x.proyecto_id === prev) ? prev : secondId))
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading projects in Comparador:', err)
        setLoading(false)
      })
  }, [ciudad, zonaFilter, subzonaFilter, tipoInmuebleFilter, periodoFilter])

  // Active compared project IDs
  const activeIds = useMemo(() => {
    const ids = [slotAId, slotBId]
    if (showSlotC && slotCId) ids.push(slotCId)
    return ids.filter(Boolean)
  }, [slotAId, slotBId, slotCId, showSlotC])

  // Fetch enriched details for the active projects
  useEffect(() => {
    activeIds.forEach((pId) => {
      if (bundles[pId]) return // already cached

      const proj = proyectos.find((p) => p.proyecto_id === pId)
      if (!proj) return

      Promise.all([
        fetchAmenidadesForProject(proj.proyecto_id),
        fetchCondicionForIndicador(proj.indicador_censo_id),
        fetchTipologiasForProject(proj.proyecto_id, proj.indicador_censo_id),
        fetchDetalleTipologias(proj.indicador_censo_id),
      ])
        .then(([amenidades, condicion, tipologias, detalles]) => {
          setBundles((prev) => ({
            ...prev,
            [pId]: {
              proj,
              amenidades,
              condicion,
              tipologias,
              detalles,
            },
          }))
        })
        .catch((e) => console.warn('Error fetching project bundle for', pId, e))
    })
  }, [activeIds, proyectos, bundles])

  // Helper to swap Slot A and Slot B
  const handleSwap = () => {
    const temp = slotAId
    setSlotAId(slotBId)
    setSlotBId(temp)
  }

  // Active project items
  const projA = proyectos.find((p) => p.proyecto_id === slotAId)
  const projB = proyectos.find((p) => p.proyecto_id === slotBId)
  const projC = showSlotC ? proyectos.find((p) => p.proyecto_id === slotCId) : undefined

  const bundleA = slotAId ? bundles[slotAId] : undefined
  const bundleB = slotBId ? bundles[slotBId] : undefined
  const bundleC = slotCId && showSlotC ? bundles[slotCId] : undefined

  const activeProjects = [projA, projB, projC].filter((p): p is IndicadorFull => !!p)
  const activeBundles = [bundleA, bundleB, bundleC].filter((b): b is ProjectDataBundle => !!b)

  // Consolidated master list of amenities present in ANY of the compared projects
  const allComparedAmenities = useMemo(() => {
    const set = new Set<string>()
    activeBundles.forEach((b) => {
      b.amenidades.forEach((a) => set.add(a.trim()))
    })
    return Array.from(set).sort()
  }, [activeBundles])

  // Consolidated master list of typologies across projects
  const allComparedTypologies = useMemo(() => {
    const set = new Set<string>()
    activeBundles.forEach((b) => {
      b.tipologias.forEach((t) => {
        if (t.avg_tipologia) set.add(t.avg_tipologia.trim())
      })
    })
    return Array.from(set).sort((a, b) => {
      const score = (name: string) => {
        if (name.toLowerCase().includes('mono')) return 1
        if (name.includes('1')) return 2
        if (name.includes('2')) return 3
        if (name.includes('3')) return 4
        return 5
      }
      return score(a) - score(b)
    })
  }, [activeBundles])

  return (
    <div className="cmp-container">
      {/* ── Header ── */}
      <div className="cmp-header">
        <div className="cmp-header-left">
          <div className="cmp-title">
            <span>Comparación Head-to-Head</span>
            <span className="cmp-tag-badge">Benchmark</span>
          </div>
          <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>
            Contraste analítico de precios, absorción, condiciones y amenidades
          </span>
        </div>

        <div className="cmp-header-actions">
          {!showSlotC ? (
            <button className="cmp-btn" onClick={() => setShowSlotC(true)}>
              + Comparar 3er Proyecto
            </button>
          ) : (
            <button className="cmp-btn" onClick={() => setShowSlotC(false)}>
              Reducir a 2 Proyectos
            </button>
          )}

          <button
            className="cmp-btn cmp-btn-primary"
            onClick={() => {
              if (proyectos.length >= 2) {
                setSlotAId(proyectos[0].proyecto_id)
                setSlotBId(proyectos[1].proyecto_id)
                setShowSlotC(false)
              }
            }}>
            Reiniciar Selección
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="cmp-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="loading-shimmer" style={{ width: 220, height: 18, margin: '0 auto 10px' }} />
            <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>
              Cargando catálogo de proyectos para comparación…
            </div>
          </div>
        ) : (
          <>
            {/* ── SELECTORS BAR (Head-to-Head Dropdowns) ── */}
            <div className="cmp-selectors-bar">
              {/* Slot A */}
              <div className="cmp-slot-box">
                <div className="cmp-slot-label-row">
                  <span className="cmp-slot-label slot-a">Proyecto 1 (Slot A)</span>
                  {projA?.etapa && (
                    <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-success)', fontWeight: 700 }}>
                      {projA.etapa}
                    </span>
                  )}
                </div>
                <select
                  className="cmp-select"
                  value={slotAId}
                  onChange={(e) => {
                    setSlotAId(e.target.value)
                    const p = proyectos.find((x) => x.proyecto_id === e.target.value)
                    if (p) onSelectIndicador(p)
                  }}>
                  {proyectos.map((p) => (
                    <option key={p.proyecto_id} value={p.proyecto_id}>
                      {p.proyecto} ({p.ZONAS || p.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Center VS and Swap */}
              <div className="cmp-vs-badge-wrap">
                <div className="cmp-vs-circle">VS</div>
                <button className="cmp-swap-btn" onClick={handleSwap} title="Invertir proyectos">
                  <IconSwap /> Swap
                </button>
              </div>

              {/* Slot B */}
              <div className="cmp-slot-box">
                <div className="cmp-slot-label-row">
                  <span className="cmp-slot-label slot-b">Proyecto 2 (Slot B)</span>
                  {projB?.etapa && (
                    <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--color-azul-500)', fontWeight: 700 }}>
                      {projB.etapa}
                    </span>
                  )}
                </div>
                <select
                  className="cmp-select"
                  value={slotBId}
                  onChange={(e) => setSlotBId(e.target.value)}>
                  {proyectos.map((p) => (
                    <option key={p.proyecto_id} value={p.proyecto_id}>
                      {p.proyecto} ({p.ZONAS || p.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Slot C */}
              {showSlotC && (
                <div className="cmp-slot-box" style={{ gridColumn: 'span 3', marginTop: 8 }}>
                  <div className="cmp-slot-label-row">
                    <span className="cmp-slot-label slot-c">Proyecto 3 (Slot C - Opcional)</span>
                    {projC?.etapa && (
                      <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-warning)', fontWeight: 700 }}>
                        {projC.etapa}
                      </span>
                    )}
                  </div>
                  <select
                    className="cmp-select"
                    value={slotCId}
                    onChange={(e) => setSlotCId(e.target.value)}>
                    <option value="">-- Seleccionar 3er proyecto --</option>
                    {proyectos.map((p) => (
                      <option key={p.proyecto_id} value={p.proyecto_id}>
                        {p.proyecto} ({p.ZONAS || p.ciudad})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ── HERO COMPARISON CARDS ── */}
            <div className="cmp-heroes-grid">
              {activeProjects.map((p, idx) => {
                const b = bundles[p.proyecto_id]
                const isCasa =
                  (p.tipo_inmueble || '').toLowerCase().includes('casa') ||
                  (p.tipo_inmueble || '').toLowerCase().includes('vivienda') ||
                  (p.tipo_inmueble || '').toLowerCase().includes('horizontal')

                const ritmoVal =
                  p.ritmo_venta ?? (b?.tipologias.reduce((s, t) => s + (t.ritmo_venta ?? 0), 0) || null)

                // Tamaño promedio m²
                const validTiposM2 = (b?.tipologias || [])
                  .map((t) => t.avg_construccion_m2)
                  .filter((m): m is number => m != null && m > 0)
                const validDetallesM2 = (b?.detalles || [])
                  .map((d) => d.construccion_m2_original)
                  .filter((m): m is number => m != null && m > 0)
                const tiposWithArea = (b?.tipologias || []).filter((t) => (t.avg_construccion_m2 ?? 0) > 0)
                const sumUnds = tiposWithArea.reduce((s, t) => s + (t.und_totales ?? 0), 0)
                const weightedM2 = sumUnds > 0
                  ? Math.round(tiposWithArea.reduce((s, t) => s + (t.avg_construccion_m2! * (t.und_totales ?? 0)), 0) / sumUnds)
                  : (validTiposM2.length > 0
                      ? Math.round(validTiposM2.reduce((s, v) => s + v, 0) / validTiposM2.length)
                      : null)
                const tamanoPromedioM2 = weightedM2 ?? (validDetallesM2.length > 0
                  ? Math.round(validDetallesM2.reduce((s, v) => s + v, 0) / validDetallesM2.length)
                  : null)

                // $/m² lista con fallback a promedio de tipologías
                const precioM2Lista = p.sus_m2 ?? (
                  b?.tipologias && b.tipologias.some((t) => (t.avg_sus_m2 ?? 0) > 0)
                    ? Math.round(
                        b.tipologias.filter((t) => (t.avg_sus_m2 ?? 0) > 0).reduce((s, t) => s + t.avg_sus_m2!, 0) /
                        b.tipologias.filter((t) => (t.avg_sus_m2 ?? 0) > 0).length
                      )
                    : null
                )

                // Competitive advantages vs other active projects
                const isWinnerRitmo =
                  ritmoVal != null &&
                  ritmoVal > 0 &&
                  ritmoVal === Math.max(...activeProjects.map((x) => x.ritmo_venta ?? 0))

                const isWinnerM2 =
                  (precioM2Lista ?? 0) > 0 &&
                  (precioM2Lista ?? 0) ===
                    Math.min(
                      ...activeProjects.filter((x) => (x.sus_m2 ?? 0) > 0).map((x) => x.sus_m2 ?? 99999)
                    )

                const heroClass = idx === 0 ? 'hero-a' : idx === 1 ? 'hero-b' : 'hero-c'

                return (
                  <div key={p.proyecto_id} className={`cmp-hero-card ${heroClass}`}>
                    <div className="cmp-hero-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: idx === 0 ? 'var(--text-success)' : idx === 1 ? 'var(--color-azul-500)' : 'var(--text-warning)' }}>
                            {isCasa ? <IconHouse /> : <IconBuilding />}
                          </span>
                          <h3 className="cmp-hero-name">{p.proyecto}</h3>
                        </div>
                        <div className="cmp-hero-loc">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <IconLocation />
                            <span>
                              {p.ZONAS || 'Zona no indicada'}
                              {p.SUBZONAS ? ` • ${p.SUBZONAS}` : ''} • {p.ciudad}
                            </span>
                          </span>
                          <span style={{ opacity: 0.4 }}>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Fecha de Lanzamiento">
                            <IconCalendar />
                            <span>Lanzamiento: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmtLanzamiento(p.lanzamiento)}</strong></span>
                          </span>
                        </div>
                      </div>

                      <div className="cmp-hero-badges">
                        <span
                          style={{
                            fontSize: 'var(--fs-etiqueta)',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                          }}>
                          {p.etapa || 'En desarrollo'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Advantages Pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {isWinnerRitmo && (
                        <span className="cmp-winner-tag">
                          <IconTrophy /> Mayor Tracción (+ Ritmo)
                        </span>
                      )}
                      {isWinnerM2 && (
                        <span className="cmp-subwinner-tag">
                          Mejor $/m² de Entrada
                        </span>
                      )}
                      {tamanoPromedioM2 && (
                        <span className="cmp-subwinner-tag">
                          {fmt(tamanoPromedioM2, 0)} m² Prom.
                        </span>
                      )}
                      {b && b.amenidades.length > 5 && (
                        <span className="cmp-subwinner-tag">
                          {b.amenidades.length} Amenidades Equipadas
                        </span>
                      )}
                    </div>

                    {/* Key Metrics Mini Grid */}
                    <div className="cmp-hero-kpis-row">
                      <div className="cmp-hero-kpi-item">
                        <div className="cmp-hero-kpi-label">Ritmo Venta</div>
                        <div className="cmp-hero-kpi-val" style={{ color: (ritmoVal ?? 0) > 0 ? 'var(--text-success)' : 'inherit' }}>
                          {ritmoVal != null && ritmoVal > 0 ? `${fmt(ritmoVal, 1)} u/m` : '—'}
                        </div>
                      </div>

                      <div className="cmp-hero-kpi-item">
                        <div className="cmp-hero-kpi-label">Tamaño Promedio M²</div>
                        <div className="cmp-hero-kpi-val">
                          {tamanoPromedioM2 ? `${fmt(tamanoPromedioM2, 0)} m²` : '—'}
                        </div>
                      </div>

                      <div className="cmp-hero-kpi-item">
                        <div className="cmp-hero-kpi-label">$/m² Lista</div>
                        <div className="cmp-hero-kpi-val">
                          {precioM2Lista ? `$${fmt(precioM2Lista, 0)}` : '—'}
                        </div>
                      </div>

                      <div className="cmp-hero-kpi-item">
                        <div className="cmp-hero-kpi-label">% Vendido</div>
                        <div className="cmp-hero-kpi-val" style={{ color: (p.pct_vendido ?? 0) >= 50 ? 'var(--text-success)' : 'var(--text-warning)' }}>
                          {p.pct_vendido ?? 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── COMPARATIVA DE MODELOS / TIPOLOGÍAS ── */}
            <CollapsibleSection
              id="tipologias"
              title="Comparativa por Tipología (Modelos de Unidades)"
              subtitle="Contraste directo de superficie construida, precios de ticket y valores por m²"
              open={seccionesAbiertas.tipologias}
              onToggle={() => toggleSeccion('tipologias')}>
              {allComparedTypologies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 'var(--fs-etiqueta)' }}>
                  Sin tipologías desagregadas para este snapshot de proyectos.
                </div>
              ) : (
                <div className="cmp-table-wrap">
                  <table className="cmp-table">
                    <thead>
                      <tr>
                        <th>Tipología</th>
                        {activeProjects.map((p, idx) => (
                          <th
                            key={p.proyecto_id}
                            style={{
                              textAlign: 'center',
                              color: idx === 0 ? 'var(--text-success)' : idx === 1 ? 'var(--color-azul-500)' : 'var(--text-warning)',
                            }}>
                            {p.proyecto}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allComparedTypologies.map((tipo) => (
                        <tr key={tipo}>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tipo}</td>
                          {activeProjects.map((p) => {
                            const b = bundles[p.proyecto_id]
                            const t = b?.tipologias.find(
                              (x) => x.avg_tipologia.toLowerCase().trim() === tipo.toLowerCase().trim()
                            )

                            if (!t) {
                              return (
                                <td key={p.proyecto_id} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                  — No disponible —
                                </td>
                              )
                            }

                            return (
                              <td key={p.proyecto_id} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--fs-cuerpo)', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {fmtUSD(t.avg_precio)}
                                </div>
                                <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-secondary)', marginTop: 2 }}>
                                  {t.avg_construccion_m2 ? `${fmt(t.avg_construccion_m2, 0)} m²` : '—'} • ${fmt(t.avg_sus_m2, 0)}/m²
                                </div>
                                <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {t.ritmo_venta != null ? `${fmt(t.ritmo_venta, 1)} u/m` : '0 u/m'} • {t.meses_stock != null ? `${fmt(t.meses_stock, 1)}m stock` : '—'}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CollapsibleSection>

            {/* ── TABLA COMPARATIVA HEAD-TO-HEAD COMPLETA ── */}
            <CollapsibleSection
              id="matriz"
              title="Matriz Analítica Comparativa (Head-to-Head)"
              subtitle="Todos los atributos censales, comerciales, financieros y de producto"
              open={seccionesAbiertas.matriz}
              onToggle={() => toggleSeccion('matriz')}>
              <div className="cmp-table-wrap">
                <table className="cmp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Atributo de Mercado</th>
                      {activeProjects.map((p, idx) => (
                        <th
                          key={p.proyecto_id}
                          style={{
                            textAlign: 'left',
                            color: idx === 0 ? 'var(--text-success)' : idx === 1 ? 'var(--color-azul-500)' : 'var(--text-warning)',
                            fontSize: 'var(--fs-cuerpo)',
                          }}>
                          {p.proyecto}
                          <div style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none' }}>
                            {p.ZONAS} • {p.ciudad}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* SECTION: IDENTIDAD Y LOCALIZACIÓN */}
                    <tr className="cmp-table-section-row">
                      <td colSpan={activeProjects.length + 1}>Identidad y Ubicación</td>
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Etapa Constructiva</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {p.etapa || 'Sin etapa'}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Zona Geográfica</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>{p.ZONAS || '—'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Sub-zona</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>{p.SUBZONAS || '—'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Desarrollador / Empresa</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id} style={{ color: 'var(--text-secondary)' }}>
                          {p.desarrollador || 'No indicado'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Calidad Constructiva</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id} style={{ fontWeight: 700 }}>
                          {(p.calidad || 'STANDARD').toUpperCase()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Pisos / Altura</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          {p.pisos ? `${p.pisos} Pisos` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Fecha de Lanzamiento</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id} style={{ fontWeight: 600 }}>
                          {fmtLanzamiento(p.lanzamiento)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Tamaño Promedio Estimado (m²)</td>
                      {activeProjects.map((p) => {
                        const b = bundles[p.proyecto_id]
                        const validTiposM2 = (b?.tipologias || [])
                          .map((t) => t.avg_construccion_m2)
                          .filter((m): m is number => m != null && m > 0)
                        const validDetallesM2 = (b?.detalles || [])
                          .map((d) => d.construccion_m2_original)
                          .filter((m): m is number => m != null && m > 0)
                        const tiposWithArea = (b?.tipologias || []).filter((t) => (t.avg_construccion_m2 ?? 0) > 0)
                        const sumUnds = tiposWithArea.reduce((s, t) => s + (t.und_totales ?? 0), 0)
                        const weightedM2 = sumUnds > 0
                          ? Math.round(tiposWithArea.reduce((s, t) => s + (t.avg_construccion_m2! * (t.und_totales ?? 0)), 0) / sumUnds)
                          : (validTiposM2.length > 0
                              ? Math.round(validTiposM2.reduce((s, v) => s + v, 0) / validTiposM2.length)
                              : null)
                        const avgArea = weightedM2 ?? (validDetallesM2.length > 0
                          ? Math.round(validDetallesM2.reduce((s, v) => s + v, 0) / validDetallesM2.length)
                          : null)

                        return (
                          <td key={p.proyecto_id} style={{ fontWeight: 700 }}>
                            {avgArea ? `${fmt(avgArea, 0)} m²` : '—'}
                          </td>
                        )
                      })}
                    </tr>

                    {/* SECTION: DESEMPEÑO COMERCIAL Y ABSORCIÓN */}
                    <tr className="cmp-table-section-row">
                      <td colSpan={activeProjects.length + 1}>Desempeño Comercial y Absorción</td>
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Ritmo de Venta Mensual</td>
                      {activeProjects.map((p) => {
                        const b = bundles[p.proyecto_id]
                        const ritmo = p.ritmo_venta ?? (b?.tipologias.reduce((s, t) => s + (t.ritmo_venta ?? 0), 0) || null)
                        const isWin = ritmo != null && ritmo === Math.max(...activeProjects.map((x) => x.ritmo_venta ?? 0))
                        return (
                          <td key={p.proyecto_id}>
                            <strong style={{ color: (ritmo ?? 0) > 0 ? 'var(--text-success)' : 'var(--text-primary)' }}>
                              {ritmo != null && ritmo > 0 ? `${fmt(ritmo, 1)} und/mes` : '—'}
                            </strong>
                            {isWin && activeProjects.length > 1 && (
                              <span className="cmp-winner-tag" style={{ marginLeft: 6 }}>
                                Mayor Tracción
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Meses de Stock Proyectados</td>
                      {activeProjects.map((p) => {
                        const isWin =
                          (p.meses_stock ?? 0) > 0 &&
                          (p.meses_stock ?? 0) ===
                            Math.min(
                              ...activeProjects.filter((x) => (x.meses_stock ?? 0) > 0).map((x) => x.meses_stock ?? 999)
                            )
                        return (
                          <td key={p.proyecto_id}>
                            <strong
                              style={{
                                color:
                                  (p.meses_stock ?? 0) > 18
                                    ? 'var(--text-danger)'
                                    : (p.meses_stock ?? 0) > 12
                                    ? 'var(--text-warning)'
                                    : 'var(--text-success)',
                              }}>
                              {p.meses_stock != null ? `${fmt(p.meses_stock, 1)} meses` : '—'}
                            </strong>
                            {isWin && activeProjects.length > 1 && (
                              <span className="cmp-winner-tag" style={{ marginLeft: 6 }}>
                                Menor Exposición
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Unidades Totales Censadas</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id} style={{ fontWeight: 700 }}>
                          {p.und_totales ?? '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Unidades Vendidas / Stock Restante</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          <span style={{ color: 'var(--text-success)', fontWeight: 600 }}>{p.und_vendidas ?? 0} vendidas</span>
                          <span style={{ color: 'var(--text-muted)' }}> / {p.und_por_vender ?? '—'} stock</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">% Vendido (Colocación)</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ minWidth: 32 }}>{p.pct_vendido ?? 0}%</strong>
                            <div style={{ flex: 1, maxWidth: 120, height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, p.pct_vendido ?? 0)}%`,
                                  height: '100%',
                                  background: (p.pct_vendido ?? 0) >= 50 ? 'var(--text-success)' : 'var(--color-azul-500)',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* SECTION: PRICING Y CONDICIONES COMERCIALES */}
                    <tr className="cmp-table-section-row">
                      <td colSpan={activeProjects.length + 1}>Pricing, Plazos y Condiciones Financieras</td>
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Precio Promedio Lista ($US/m²)</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          <strong>{p.sus_m2 ? `$${fmt(p.sus_m2, 0)}` : '—'}</strong>
                          <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', marginLeft: 3 }}>USD/m²</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Precio Real Estimado ($US/m²)</td>
                      {activeProjects.map((p) => {
                        const b = bundles[p.proyecto_id]
                        const tc = b?.detalles[0]?.tc_oficial ?? b?.detalles[0]?.tc ?? p.tc ?? 7.0
                        const avgReal =
                          b?.detalles.length && b.detalles.some((d) => d.usd_m2 != null)
                            ? Math.round(b.detalles.reduce((s, x) => s + (x.usd_m2 || 0), 0) / b.detalles.length)
                            : p.sus_m2 && tc
                            ? Math.round(p.sus_m2 * (6.96 / tc))
                            : null

                        return (
                          <td key={p.proyecto_id}>
                            <strong style={{ color: 'var(--text-success)' }}>
                              {avgReal ? `$${fmt(avgReal, 0)}` : '—'}
                            </strong>
                            <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)', marginLeft: 3 }}>USD/m²</span>
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Tipo de Cambio Proyecto (Bs/$US)</td>
                      {activeProjects.map((p) => {
                        const b = bundles[p.proyecto_id]
                        const tc = b?.detalles[0]?.tc_oficial ?? b?.detalles[0]?.tc ?? p.tc
                        return (
                          <td key={p.proyecto_id}>
                            {tc ? `${tc} Bs/$US` : 'Oficial (6.96)'}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Modalidad de Pago a Plazos</td>
                      {activeProjects.map((p) => {
                        const b = bundles[p.proyecto_id]
                        const c = b?.condicion
                        const texto = c?.modalidad_pago
                          ? c.modalidad_pago
                          : c?.aporte_inicial
                          ? `${c.aporte_inicial}% (inicial) - ${100 - c.aporte_inicial}% (contraentrega)`
                          : '50% (inicial) - 50% (contraentrega)'
                        return (
                          <td key={p.proyecto_id} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {texto}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Precio de Parqueo ($US)</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          {p.parqueo_sus ? fmtUSD(p.parqueo_sus) : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Precio de Baulera ($US)</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id}>
                          {p.baulera_sus ? fmtUSD(p.baulera_sus) : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="cmp-metric-name">Valor Total de Inventario ($US)</td>
                      {activeProjects.map((p) => (
                        <td key={p.proyecto_id} style={{ fontWeight: 800 }}>
                          {p.stock_total ? fmtUSD(p.stock_total) : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>

            {/* ── ÁREAS COMUNES Y EQUIPAMIENTO (CROSS CHECKLIST) ── */}
            <CollapsibleSection
              id="amenidades"
              title="Comparativa de Áreas Comunes y Amenidades"
              subtitle="Equipamiento social, recreativo y de bienestar disponible en cada desarrollo"
              headerRight={
                <span style={{ fontSize: 'var(--fs-etiqueta)', color: 'var(--text-muted)' }}>
                  Total {allComparedAmenities.length} amenidades detectadas
                </span>
              }
              open={seccionesAbiertas.amenidades}
              onToggle={() => toggleSeccion('amenidades')}>
              {allComparedAmenities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 'var(--fs-etiqueta)' }}>
                  No se registraron amenidades en la base de datos para los proyectos seleccionados.
                </div>
              ) : (
                <div className="cmp-amenities-grid">
                  {allComparedAmenities.map((amenity) => {
                    const hasA = bundleA?.amenidades.includes(amenity) ?? false
                    const hasB = bundleB?.amenidades.includes(amenity) ?? false
                    const hasC = bundleC?.amenidades.includes(amenity) ?? false

                    return (
                      <div key={amenity} className="cmp-amenity-card">
                        <div className="cmp-amenity-name">{amenity}</div>
                        <div className="cmp-amenity-status-pills">
                          <span className={`cmp-amenity-pill ${hasA ? 'has' : 'lacks'}`} title={projA?.proyecto}>
                            {projA?.proyecto ? projA.proyecto.slice(0, 8) : 'A'}: {hasA ? <IconCheck /> : <IconX />}
                          </span>
                          <span className={`cmp-amenity-pill ${hasB ? 'has' : 'lacks'}`} title={projB?.proyecto}>
                            {projB?.proyecto ? projB.proyecto.slice(0, 8) : 'B'}: {hasB ? <IconCheck /> : <IconX />}
                          </span>
                          {showSlotC && projC && (
                            <span className={`cmp-amenity-pill ${hasC ? 'has' : 'lacks'}`} title={projC.proyecto}>
                              {projC.proyecto.slice(0, 8)}: {hasC ? <IconCheck /> : <IconX />}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  )
}
