import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://ixistkrftmebvefnqqkq.supabase.co'
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4aXN0a3JmdG1lYnZlZm5xcWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjY4NzUsImV4cCI6MjA5Mjk0Mjg3NX0.I_yF_7X-MgjXftSmI-yb62fpl6JysLP4zwaHckEg5fw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────
export interface Proyecto {
  proyecto_id: string
  proyecto: string
  ciudad: string
  ZONAS: string | null
  SUBZONAS: string | null
  tipo_inmueble: string | null
  calidad: string | null
  pisos: number | null
  desarrollador: string | null
  constructor?: string | null
  comercializador?: string | null
  lanzamiento: string | null
  entrega: string | null
  latitud: number | null
  longitud: number | null
  uv: string | null
}

export interface IndicadorCenso {
  indicador_censo_id: string
  proyecto_id: string
  fecha_snapshot: string
  etapa: string | null
  und_totales: number | null
  und_vendidas: number | null
  und_por_vender: number | null
  pct_vendido: number | null
  pct_por_vender?: number | null
  stock_vendido?: number | null
  stock_x_vender?: number | null
  ritmo_venta: number | null
  meses_stock: number | null
  stock_total: number | null
  parqueo_sus?: number | null
  baulera_sus?: number | null
}

export interface AvgTipologia {
  indicador_censo_id: string
  avg_tipologia: string
  und_totales: number | null
  und_vendidas: number | null
  und_por_vender: number | null
  ritmo_venta: number | null
  meses_stock: number | null
  avg_precio: number | null
  avg_construccion_m2: number | null
  avg_sus_m2: number | null
}

export interface CondicionFinanciera {
  condicion_financiera_id: string
  indicador_censo_id: string
  modalidad_pago: string | null
  forma_de_pago: string | null
  aporte_inicial: number | null
  cuota_mensual: number | null
  meses: number | null
  incremento: number | null
  gravamen: number | null
  banco: string | null
}

export interface TipologiaDetalle {
  tipologia_id: string
  indicador_censo_id: string
  tipologia: string
  dormitorios: number | null
  banos: number | null
  construccion_m2_original: number | null
  sus_m2: number | null
  precio: number | null
  bs_m2: number | null
  usd_m2: number | null
  estado: string | null
  tipo_operación?: string | null
  tc_oficial: number | null
  tc: number | null
}

export type IndicadorFull = IndicadorCenso & {
  proyecto: string
  ciudad: string
  latitud: number | null
  longitud: number | null
  ZONAS: string | null
  SUBZONAS: string | null
  tipo_inmueble: string | null
  calidad: string | null
  pisos: number | null
  desarrollador: string | null
  constructor?: string | null
  comercializador?: string | null
  lanzamiento: string | null
  entrega: string | null
  parqueo_sus: number | null
  baulera_sus: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────
export function matchCiudad(itemCity: string | null | undefined, filterCity?: string): boolean {
  if (!filterCity || filterCity === 'ALL') return true
  if (!itemCity) return false
  const c = itemCity.trim().toLowerCase()
  const f = filterCity.trim().toLowerCase()
  if (f === 'scz' || f.includes('santa cruz')) {
    return c === 'scz' || c.includes('santa cruz')
  }
  if (f === 'lpz' || f.includes('la paz')) {
    return c === 'lpz' || c.includes('la paz')
  }
  if (f === 'cbb' || f.includes('cochabamba')) {
    return c === 'cbb' || c.includes('cochabamba')
  }
  return c === f
}

// ─── Core: Fetch everything (Full 100% Pagination), join in JS ───────────
let _proyCache: Proyecto[] | null = null
let _proyTime = 0

async function fetchAllFromTable<T>(
  table: string,
  orderBy?: string,
  ascending: boolean = true
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  const pageSize = 1000
  while (true) {
    let q = supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1)
    if (orderBy) {
      q = q.order(orderBy, { ascending })
    }
    const { data, error } = await q
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

async function getAllProyectos(): Promise<Proyecto[]> {
  if (_proyCache && Date.now() - _proyTime < 60_000) return _proyCache
  _proyCache = await fetchAllFromTable<Proyecto>('oferta_proyectos', 'proyecto', true)
  _proyTime = Date.now()
  return _proyCache
}

let _indCache: IndicadorCenso[] | null = null
let _indTime = 0

async function getAllIndicadores(): Promise<IndicadorCenso[]> {
  if (_indCache && Date.now() - _indTime < 60_000) return _indCache
  _indCache = await fetchAllFromTable<IndicadorCenso>('oferta_indicadores_censo', 'fecha_snapshot', false)
  _indTime = Date.now()
  return _indCache
}

// ─── Public API ───────────────────────────────────────────────────────────
export async function fetchProyectos(ciudad?: string): Promise<Proyecto[]> {
  const all = await getAllProyectos()
  if (!ciudad || ciudad === 'ALL') return all
  return all.filter((p) => matchCiudad(p.ciudad, ciudad))
}

export async function fetchIndicadores(ciudad?: string): Promise<IndicadorFull[]> {
  const [proyectos, indicadores] = await Promise.all([getAllProyectos(), getAllIndicadores()])
  const proyMap = new Map<string, Proyecto>(proyectos.map((p) => [p.proyecto_id, p]))

  const joined = indicadores.map((i) => {
    const p = proyMap.get(i.proyecto_id)
    return {
      ...i,
      proyecto:        p?.proyecto ?? '',
      ciudad:          p?.ciudad ?? '',
      latitud:         p?.latitud ?? null,
      longitud:        p?.longitud ?? null,
      ZONAS:           p?.ZONAS ?? null,
      SUBZONAS:        p?.SUBZONAS ?? null,
      tipo_inmueble:   p?.tipo_inmueble ?? null,
      calidad:         p?.calidad ?? null,
      pisos:           p?.pisos ?? null,
      desarrollador:   p?.desarrollador ?? null,
      constructor:     p?.constructor ?? null,
      comercializador: p?.comercializador ?? null,
      lanzamiento:     p?.lanzamiento ?? null,
      entrega:         p?.entrega ?? null,
      parqueo_sus:     i.parqueo_sus ?? null,
      baulera_sus:     i.baulera_sus ?? null,
    }
  })

  if (!ciudad || ciudad === 'ALL') return joined
  return joined.filter((i) => matchCiudad(i.ciudad, ciudad))
}

export async function fetchAmenidadesForProject(proyectoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('oferta_amenidades')
    .select('areas_comunes')
    .eq('proyecto_id', proyectoId)
  if (error) {
    console.warn('Error fetching amenidades:', error)
    return []
  }
  const set = new Set<string>()
  ;(data ?? []).forEach((r: any) => {
    if (r.areas_comunes) set.add(r.areas_comunes.trim())
  })
  return Array.from(set)
}

export async function fetchCondicionForIndicador(indicadorId: string): Promise<CondicionFinanciera | null> {
  const { data, error } = await supabase
    .from('oferta_condiciones_financieras')
    .select('*')
    .eq('indicador_censo_id', indicadorId)
    .limit(1)
  if (error) {
    console.warn('Error fetching condiciones financieras:', error)
    return null
  }
  return data?.[0] ?? null
}

export async function fetchDetalleTipologias(indicadorId: string): Promise<TipologiaDetalle[]> {
  const { data, error } = await supabase
    .from('oferta_tipologias')
    .select('*')
    .eq('indicador_censo_id', indicadorId)
    .order('precio', { ascending: true })
  if (error) {
    console.warn('Error fetching detalle tipologias:', error)
    return []
  }
  return (data ?? []).map((r: any) => ({
    ...r,
    construccion_m2_original: r.construccion_m2_original ?? r.construccion_m2 ?? null,
  }))
}

export async function fetchAvgTipologias(indicadorId: string): Promise<AvgTipologia[]> {
  const { data, error } = await supabase
    .from('oferta_avg_tipologias')
    .select('*')
    .eq('indicador_censo_id', indicadorId)
    .order('avg_tipologia')
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    ...r,
    avg_construccion_m2: r.avg_construccion_m2 ?? r['avg_construcción_m2_original'] ?? r.construccion_m2_original ?? null,
  }))
}

export function getLatestPerProject(indicadores: IndicadorFull[]): IndicadorFull[] {
  const map = new Map<string, IndicadorFull>()
  indicadores.forEach((i) => {
    const ex = map.get(i.proyecto_id)
    if (!ex || i.fecha_snapshot > ex.fecha_snapshot) map.set(i.proyecto_id, i)
  })
  return Array.from(map.values())
}

let _tiposCache: AvgTipologia[] | null = null
let _tiposTime = 0

export async function fetchAllAvgTipologias(): Promise<AvgTipologia[]> {
  if (_tiposCache && Date.now() - _tiposTime < 60_000) return _tiposCache
  const raw = await fetchAllFromTable<any>('oferta_avg_tipologias', 'avg_tipologia', true)
  const mapped = raw.map((r: any) => ({
    ...r,
    avg_construccion_m2: r.avg_construccion_m2 ?? r['avg_construcción_m2_original'] ?? r.construccion_m2_original ?? null,
  }))
  _tiposCache = mapped
  _tiposTime = Date.now()
  return _tiposCache
}

export async function fetchTipologiasForProject(
  proyectoId: string,
  indicadorCensoId?: string
): Promise<AvgTipologia[]> {
  if (indicadorCensoId) {
    const tipos = await fetchAvgTipologias(indicadorCensoId)
    if (tipos && tipos.length > 0) return tipos
  }
  // Fallback: check other snapshots of this project
  const allInds = await getAllIndicadores()
  const projInds = allInds.filter((i) => i.proyecto_id === proyectoId)
  for (const ind of projInds) {
    if (ind.indicador_censo_id === indicadorCensoId) continue
    const tipos = await fetchAvgTipologias(ind.indicador_censo_id)
    if (tipos && tipos.length > 0) return tipos
  }
  return []
}

export interface TipologiaBenchmark {
  tipo: string
  count: number
  avgPrecio: number
  avgSusM2: number
  avgArea: number
  avgRitmo: number
  totalUnidades: number
  totalVendidas: number
}

export function computeTipologiaBenchmarks(tipos: AvgTipologia[]): Record<string, TipologiaBenchmark> {
  const groups: Record<string, AvgTipologia[]> = {}
  for (const t of tipos) {
    const key = t.avg_tipologia || 'Otro'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  const result: Record<string, TipologiaBenchmark> = {}
  for (const [k, arr] of Object.entries(groups)) {
    const validPrecios = arr.map((x) => x.avg_precio).filter((x): x is number => x != null && x > 0)
    const validM2 = arr.map((x) => x.avg_sus_m2).filter((x): x is number => x != null && x > 0)
    const validArea = arr.map((x) => x.avg_construccion_m2).filter((x): x is number => x != null && x > 0)
    const validRitmo = arr.map((x) => x.ritmo_venta).filter((x): x is number => x != null && x > 0)

    result[k] = {
      tipo: k,
      count: arr.length,
      avgPrecio: validPrecios.length ? validPrecios.reduce((a, b) => a + b, 0) / validPrecios.length : 0,
      avgSusM2: validM2.length ? validM2.reduce((a, b) => a + b, 0) / validM2.length : 0,
      avgArea: validArea.length ? validArea.reduce((a, b) => a + b, 0) / validArea.length : 0,
      avgRitmo: validRitmo.length ? validRitmo.reduce((a, b) => a + b, 0) / validRitmo.length : 0,
      totalUnidades: arr.reduce((a, b) => a + (b.und_totales ?? 0), 0),
      totalVendidas: arr.reduce((a, b) => a + (b.und_vendidas ?? 0), 0),
    }
  }
  return result
}

export async function fetchProjectHistory(proyectoId: string): Promise<IndicadorFull[]> {
  const all = await fetchIndicadores()
  return all
    .filter((i) => i.proyecto_id === proyectoId)
    .sort((a, b) => a.fecha_snapshot.localeCompare(b.fecha_snapshot))
}

export interface ZonaMetrics {
  zona: string
  totalStockUnd: number
  totalStockUSD: number
  ritmoVentaMensual: number
  mesesStock: number
  totalProyectos: number
  totalVendidas: number
  totalInicial: number
  pctVendido: number
}

export function computeZonaMetrics(indicadores: IndicadorFull[]): ZonaMetrics[] {
  const groups = new Map<string, IndicadorFull[]>()
  indicadores.forEach((i) => {
    const z = (i.ZONAS || 'Sin Zona').trim()
    if (!groups.has(z)) groups.set(z, [])
    groups.get(z)!.push(i)
  })

  const results: ZonaMetrics[] = []
  groups.forEach((items, zona) => {
    const stockUnd = items.reduce((s, x) => s + (x.und_por_vender ?? 0), 0)
    const stockUSD = items.reduce((s, x) => s + (x.stock_total ?? 0), 0)
    const ritmo = items.reduce((s, x) => s + (x.ritmo_venta ?? 0), 0)
    const totalInicial = items.reduce((s, x) => s + (x.und_totales ?? 0), 0)
    const totalVendidas = items.reduce((s, x) => s + (x.und_vendidas ?? 0), 0)
    const meses = ritmo > 0 ? stockUnd / ritmo : 0
    const pct = totalInicial > 0 ? Math.round((totalVendidas / totalInicial) * 100) : 0

    results.push({
      zona,
      totalStockUnd: stockUnd,
      totalStockUSD: stockUSD,
      ritmoVentaMensual: Math.round(ritmo * 100) / 100,
      mesesStock: Math.round(meses * 10) / 10,
      totalProyectos: items.length,
      totalVendidas,
      totalInicial,
      pctVendido: pct,
    })
  })

  return results
}

export async function fetchKPIs(ciudad?: string) {
  const indicadores = await fetchIndicadores(ciudad)
  const latest = getLatestPerProject(indicadores)

  const totalUnidades = latest.reduce((s, r) => s + (r.und_totales ?? 0), 0)
  const totalVendidas = latest.reduce((s, r) => s + (r.und_vendidas ?? 0), 0)
  const totalDisp     = latest.reduce((s, r) => s + (r.und_por_vender ?? 0), 0)
  const ritmos = latest.filter((r) => r.ritmo_venta != null && r.ritmo_venta > 0).map((r) => r.ritmo_venta!)
  const avgRitmo = ritmos.length ? ritmos.reduce((s, v) => s + v, 0) / ritmos.length : 0
  const stockTotal = latest.reduce((s, r) => s + (r.stock_total ?? 0), 0)

  return {
    totalProyectos: latest.length,
    totalUnidades,
    totalVendidas,
    totalDisp,
    avgRitmo: Math.round(avgRitmo * 100) / 100,
    pctVendido: totalUnidades > 0 ? Math.round((totalVendidas / totalUnidades) * 100) : 0,
    stockTotal,
  }
}

// ─── Filter Data Fetchers ─────────────────────────────────────────────────────

/** Returns distinct fecha_snapshot values sorted descending */
export async function fetchPeriodos(ciudad?: string): Promise<string[]> {
  const all = await getAllIndicadores()
  let items = all
  if (ciudad && ciudad !== 'ALL') {
    const proyectos = await getAllProyectos()
    const ids = new Set(proyectos.filter((p) => matchCiudad(p.ciudad, ciudad)).map((p) => p.proyecto_id))
    items = all.filter((i) => ids.has(i.proyecto_id))
  }
  const unique = [...new Set(items.map((i) => i.fecha_snapshot).filter(Boolean))]
  return unique.sort((a, b) => b.localeCompare(a))
}

/** Returns distinct ZONAS values for a given city */
export async function fetchZonas(ciudad?: string): Promise<string[]> {
  const all = await getAllProyectos()
  const filtered = ciudad && ciudad !== 'ALL' ? all.filter((p) => matchCiudad(p.ciudad, ciudad)) : all
  const unique = [...new Set(filtered.map((p) => p.ZONAS).filter((z): z is string => !!z && z.trim() !== ''))]
  return unique.sort()
}

/** Returns distinct SUBZONAS values, optionally filtered by zona */
export async function fetchSubzonas(ciudad?: string, zona?: string): Promise<string[]> {
  const all = await getAllProyectos()
  let filtered = ciudad && ciudad !== 'ALL' ? all.filter((p) => matchCiudad(p.ciudad, ciudad)) : all
  if (zona && zona !== 'ALL') filtered = filtered.filter((p) => p.ZONAS === zona)
  const unique = [...new Set(filtered.map((p) => p.SUBZONAS).filter((s): s is string => !!s && s.trim() !== ''))]
  return unique.sort()
}

/** Returns distinct tipo_inmueble values */
export async function fetchTiposInmueble(ciudad?: string): Promise<string[]> {
  const all = await getAllProyectos()
  const filtered = ciudad && ciudad !== 'ALL' ? all.filter((p) => matchCiudad(p.ciudad, ciudad)) : all
  const unique = [...new Set(filtered.map((p) => p.tipo_inmueble).filter((t): t is string => !!t && t.trim() !== ''))]
  return unique.sort()
}

/** Returns distinct etapa values from oferta_indicadores_censo */
export async function fetchEtapas(ciudad?: string): Promise<string[]> {
  const all = await getAllIndicadores()
  let items = all
  if (ciudad && ciudad !== 'ALL') {
    const proyectos = await getAllProyectos()
    const ids = new Set(proyectos.filter((p) => matchCiudad(p.ciudad, ciudad)).map((p) => p.proyecto_id))
    items = all.filter((i) => ids.has(i.proyecto_id))
  }
  const unique = [...new Set(items.map((i) => i.etapa).filter((e): e is string => !!e && e.trim() !== ''))]
  return unique.sort()
}

/** Returns distinct tipologia values from oferta_tipologias */
export async function fetchTipologias(): Promise<string[]> {
  const { data, error } = await supabase
    .from('oferta_tipologias')
    .select('tipologia')
    .not('tipologia', 'is', null)
  if (error) {
    console.warn('fetchTipologias error:', error.message)
    return []
  }
  const unique = [...new Set((data ?? []).map((r: { tipologia: string }) => r.tipologia).filter((t) => t?.trim() !== ''))]
  return unique.sort()
}

/** Returns set of indicador_censo_id that have a given tipologia */
export async function fetchIndicadorIdsForTipologia(tipologia: string): Promise<Set<string>> {
  if (!tipologia || tipologia === 'ALL') return new Set()
  try {
    const [res1, res2] = await Promise.all([
      supabase.from('oferta_tipologias').select('indicador_censo_id').eq('tipologia', tipologia),
      supabase.from('oferta_avg_tipologias').select('indicador_censo_id').eq('avg_tipologia', tipologia),
    ])
    const ids = new Set<string>()
    res1.data?.forEach((r: any) => { if (r.indicador_censo_id) ids.add(r.indicador_censo_id) })
    res2.data?.forEach((r: any) => { if (r.indicador_censo_id) ids.add(r.indicador_censo_id) })
    return ids
  } catch (err) {
    console.warn('fetchIndicadorIdsForTipologia error:', err)
    return new Set()
  }
}

