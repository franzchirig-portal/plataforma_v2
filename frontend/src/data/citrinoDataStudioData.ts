/**
 * citrinoDataStudioData.ts
 * Repositorio de datos empíricos auditados de Citrino Looker Studio
 * Cubre desde el Módulo 02 hasta el Módulo 08 con todas las sub-pestañas auditadas.
 */

export interface TimeSeriesPoint {
  periodo: string
  valor: number
  secundario?: number
  terciario?: number
  variacion?: number
  etiqueta?: string
}

export interface CensoEvolutivoSnapshot {
  ano: string
  proyectosCensados: number
  undTotales: number
  undPromedio: number
  stockTotalUsd: number // Millones USD
  stockPromedioUsd: number // Millones USD
  m2Totales: number // Miles m2
  pctVendido: number
  pctPorVender: number
  mesesStockPromedio: number
  precioM2Oficial: number
  precioM2Paralelo: number
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 02: EVOLUTIVO DE LA OFERTA NUEVA
// ─────────────────────────────────────────────────────────────────────────────
export const EVOLUTIVO_OFERTA_SNAPSHOTS: CensoEvolutivoSnapshot[] = [
  { ano: '2016', proyectosCensados: 122, undTotales: 6800, undPromedio: 55.7, stockTotalUsd: 410, stockPromedioUsd: 3.36, m2Totales: 610, pctVendido: 72, pctPorVender: 28, mesesStockPromedio: 14.2, precioM2Oficial: 1120, precioM2Paralelo: 1120 },
  { ano: '2018', proyectosCensados: 145, undTotales: 8900, undPromedio: 61.3, stockTotalUsd: 540, stockPromedioUsd: 3.72, m2Totales: 790, pctVendido: 69, pctPorVender: 31, mesesStockPromedio: 15.1, precioM2Oficial: 1180, precioM2Paralelo: 1180 },
  { ano: '2020', proyectosCensados: 158, undTotales: 9800, undPromedio: 62.0, stockTotalUsd: 590, stockPromedioUsd: 3.73, m2Totales: 860, pctVendido: 65, pctPorVender: 35, mesesStockPromedio: 16.0, precioM2Oficial: 1150, precioM2Paralelo: 1150 },
  { ano: '2022', proyectosCensados: 193, undTotales: 15200, undPromedio: 78.7, stockTotalUsd: 980, stockPromedioUsd: 5.07, m2Totales: 1350, pctVendido: 64, pctPorVender: 36, mesesStockPromedio: 13.8, precioM2Oficial: 1210, precioM2Paralelo: 1210 },
  { ano: '2024', proyectosCensados: 164, undTotales: 12400, undPromedio: 75.6, stockTotalUsd: 820, stockPromedioUsd: 5.00, m2Totales: 1120, pctVendido: 67, pctPorVender: 33, mesesStockPromedio: 11.2, precioM2Oficial: 1260, precioM2Paralelo: 1040 },
  { ano: '2026', proyectosCensados: 117, undTotales: 9240, undPromedio: 78.9, stockTotalUsd: 683, stockPromedioUsd: 5.84, m2Totales: 890, pctVendido: 68, pctPorVender: 32, mesesStockPromedio: 9.4, precioM2Oficial: 1310, precioM2Paralelo: 925 },
]

export const RITMO_VENTAS_HISTORICO_MENSUAL: TimeSeriesPoint[] = [
  { periodo: 'Feb-2021', valor: 1.8 },
  { periodo: 'Jun-2021', valor: 2.1 },
  { periodo: 'Dic-2021', valor: 2.5 },
  { periodo: 'Jun-2022', valor: 3.1 },
  { periodo: 'Dic-2022', valor: 2.8 },
  { periodo: 'Jun-2023', valor: 2.4 },
  { periodo: 'Dic-2023', valor: 2.0 },
  { periodo: 'Jun-2024', valor: 1.8 },
  { periodo: 'Dic-2024', valor: 1.5 },
  { periodo: 'Jun-2025', valor: 1.3 },
  { periodo: 'Nov-2025', valor: 1.1 },
  { periodo: 'Feb-2026', valor: 2.1 },
  { periodo: 'May-2026', valor: 2.8 },
  { periodo: 'Sep-2026', valor: 3.4 },
]

export const ETAPAS_COMERCIALES_EVOLUTIVO = [
  { etapa: 'Preventa', pct: 35, proyectos: 41, unds: 3230 },
  { etapa: 'En Construcción', pct: 48, proyectos: 56, unds: 4435 },
  { etapa: 'Entrega Inmediata', pct: 17, proyectos: 20, unds: 1575 },
]

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 03: OFERTA DE PARTICULARES (MARKETPLACE / REVENTA)
// ─────────────────────────────────────────────────────────────────────────────
export const MARKETPLACE_DATA = {
  kpis: {
    stockTotalUsd: 550, // Millones
    unidadesTotales: 4208,
    deptosUsd: 364,
    deptosUnds: 3151,
    casasUsd: 187,
    casasUnds: 1057,
  },
  tipologias: [
    { tipo: 'Monoambiente', supMin: 32, supMax: 45, supAvg: 38, precioM2Min: 950, precioM2Max: 1350, precioM2Avg: 1120, unds: 720 },
    { tipo: '1 Dormitorio', supMin: 45, supMax: 65, supAvg: 54, precioM2Min: 920, precioM2Max: 1300, precioM2Avg: 1080, unds: 1340 },
    { tipo: '2 Dormitorios', supMin: 68, supMax: 98, supAvg: 81, precioM2Min: 880, precioM2Max: 1250, precioM2Avg: 1040, unds: 1210 },
    { tipo: '3 Dormitorios', supMin: 110, supMax: 165, supAvg: 136, precioM2Min: 850, precioM2Max: 1200, precioM2Avg: 990, unds: 680 },
    { tipo: '4+ Dormitorios', supMin: 180, supMax: 340, supAvg: 235, precioM2Min: 800, precioM2Max: 1150, precioM2Avg: 940, unds: 258 },
  ],
  zonas: [
    { zona: 'Equipetrol / Sirari', pct: 21.0, unds: 884, volumenUsd: 128 },
    { zona: 'Norte 5to a 8vo', pct: 13.5, unds: 568, volumenUsd: 78 },
    { zona: 'Norte 2do a 5to', pct: 10.8, unds: 454, volumenUsd: 64 },
    { zona: 'Este (Villa 1ro Mayo / Pampa)', pct: 9.3, unds: 391, volumenUsd: 46 },
    { zona: 'Oeste (Roca y Coronado)', pct: 8.2, unds: 345, volumenUsd: 42 },
    { zona: 'Norte Suburbano (Warnes/Satélite)', pct: 8.0, unds: 337, volumenUsd: 38 },
    { zona: 'Urubó / Colinas', pct: 4.6, unds: 194, volumenUsd: 48 },
    { zona: 'Centro Tradicional', pct: 4.6, unds: 194, volumenUsd: 29 },
    { zona: 'Sur (Santos Dumont / Plan 3000)', pct: 20.0, unds: 841, volumenUsd: 77 },
  ],
  serieMensual: [
    { periodo: 'Oct-2022', valor: 3100, secundario: 420 },
    { periodo: 'Ene-2023', valor: 3350, secundario: 445 },
    { periodo: 'Jul-2023', valor: 3600, secundario: 480 },
    { periodo: 'Ene-2024', valor: 3890, secundario: 515 },
    { periodo: 'Jul-2024', valor: 4050, secundario: 532 },
    { periodo: 'Ene-2025', valor: 4180, secundario: 545 },
    { periodo: 'Mar-2026', valor: 4208, secundario: 550 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 04: BIENES ADJUDICADOS Y REMATES JUDICIALES
// ─────────────────────────────────────────────────────────────────────────────
export const BIENES_ADJUDICADOS_DATA = {
  rematesMensuales: [
    { periodo: 'Oct-2023', volumenUsd: 48, tasaDescuento: 6.2 },
    { periodo: 'Dic-2023', volumenUsd: 55, tasaDescuento: 7.1 },
    { periodo: 'Mar-2024', volumenUsd: 62, tasaDescuento: 8.4 },
    { periodo: 'Jun-2024', volumenUsd: 68, tasaDescuento: 9.0 },
    { periodo: 'Sep-2024', volumenUsd: 74, tasaDescuento: 9.8 },
    { periodo: 'Dic-2024', volumenUsd: 79, tasaDescuento: 10.5 },
    { periodo: 'Mar-2025', volumenUsd: 84, tasaDescuento: 11.2 },
    { periodo: 'Jun-2025', volumenUsd: 87, tasaDescuento: 12.0 },
    { periodo: 'Dic-2025', volumenUsd: 82, tasaDescuento: 11.4 },
    { periodo: 'May-2026', volumenUsd: 79, tasaDescuento: 10.8 },
  ],
  adjudicadosAsfiAnual: [
    { periodo: '2003', valorBs: 1344, nota: 'Crisis sistémica financiera' },
    { periodo: '2006', valorBs: 890, nota: 'Recuperación económica' },
    { periodo: '2010', valorBs: 450, nota: 'Inicio ciclo expansivo' },
    { periodo: '2014', valorBs: 180, nota: 'Piso histórico adjudicados' },
    { periodo: '2018', valorBs: 290, nota: 'Ajuste inicial cartera' },
    { periodo: '2020', valorBs: 480, nota: 'Diferimientos COVID' },
    { periodo: '2023', valorBs: 860, nota: 'Aceleración judicial' },
    { periodo: '2025', valorBs: 1240, nota: 'Pico ciclo actual' },
    { periodo: '2026', valorBs: 1288, nota: 'Nivel similar a crisis 2003' },
  ],
  adjudicadosAsfiMensual: [
    { periodo: 'Dic-2022', valorBs: 500, varMensual: 2.1 },
    { periodo: 'Mar-2023', valorBs: 580, varMensual: 3.5 },
    { periodo: 'Jun-2023', valorBs: 690, varMensual: 4.8 },
    { periodo: 'Sep-2023', valorBs: 780, varMensual: 4.1 },
    { periodo: 'Dic-2023', valorBs: 860, varMensual: 3.2 },
    { periodo: 'Mar-2024', valorBs: 940, varMensual: 2.9 },
    { periodo: 'Jun-2024', valorBs: 1020, varMensual: 2.7 },
    { periodo: 'Sep-2024', valorBs: 1110, varMensual: 3.0 },
    { periodo: 'Dic-2024', valorBs: 1180, varMensual: 2.1 },
    { periodo: 'Mar-2025', valorBs: 1220, varMensual: 1.1 },
    { periodo: 'Jun-2025', valorBs: 1250, varMensual: 0.8 },
    { periodo: 'Sep-2025', valorBs: 1265, varMensual: 0.4 },
    { periodo: 'Dic-2025', valorBs: 1275, varMensual: 0.3 },
    { periodo: 'Mar-2026', valorBs: 1284, varMensual: 0.2 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 05: ANÁLISIS DE LA DEMANDA
// ─────────────────────────────────────────────────────────────────────────────
export const DEMANDA_DATA = {
  general: {
    muestra: 300,
    ingresos: [
      { rango: 'Menos de 3.000 Bs', pct: 12 },
      { rango: '3.001 a 5.000 Bs', pct: 22 },
      { rango: '5.001 a 7.000 Bs', pct: 19 },
      { rango: '7.001 a 10.000 Bs', pct: 16 },
      { rango: '10.001 a 15.000 Bs', pct: 14 },
      { rango: '15.001 a 20.000 Bs', pct: 10 },
      { rango: 'Más de 20.000 Bs', pct: 7 },
    ],
    cuotaMensual: [
      { rango: 'Menos de 500 Bs', pct: 8 },
      { rango: '501 a 1.000 Bs', pct: 20 },
      { rango: '1.001 a 2.000 Bs', pct: 23 },
      { rango: '2.001 a 3.500 Bs', pct: 21 },
      { rango: '3.501 a 5.000 Bs', pct: 15 },
      { rango: 'Más de 5.000 Bs', pct: 13 },
    ],
    aportePropio: [
      { rango: 'Menos de 25.000 Bs', pct: 40.6 },
      { rango: '25.001 a 50.000 Bs', pct: 24.2 },
      { rango: '50.001 a 100.000 Bs', pct: 18.4 },
      { rango: 'Más de 100.000 Bs', pct: 16.8 },
    ],
    voluntadComparativa: [
      { ano: '2025', viviendaPropia: 42, inversion: 58 },
      { ano: '2026', viviendaPropia: 55, inversion: 45 },
    ],
  },

  inversion: {
    muestra: 459,
    motivadores: [
      { motivo: 'Renta por Alquiler (Cashflow mensual)', pct: 52 },
      { motivo: 'Preservación de Valor en Bolivianos (Inflación)', pct: 35 },
      { motivo: 'Oportunidad de Arbitraje / Descuento USD', pct: 13 },
    ],
    decision1: [
      { factor: 'Ubicación y Conectividad', pct: 68 },
      { factor: 'Precio y Facilidad de Pago', pct: 19 },
      { factor: 'Diseño y Tipología Comercial', pct: 8 },
      { factor: 'Reputación de la Constructora', pct: 5 },
    ],
    decision2: [
      { factor: 'Precio y Descuento Contado', pct: 44 },
      { factor: 'Diseño y Equipamiento Incluido', pct: 22 },
      { factor: 'Ubicación Secundada', pct: 18 },
      { factor: 'Reputación Desarrollador', pct: 16 },
    ],
    valorInmueble: [
      { rango: 'Menos de $50.000 USD', pct: 36 },
      { rango: '$51.000 a $80.000 USD', pct: 30 },
      { rango: '$81.000 a $100.000 USD', pct: 15 },
      { rango: '$101.000 a $150.000 USD', pct: 9 },
      { rango: 'Más de $150.000 USD', pct: 10 },
    ],
    zonas: [
      { zona: 'Equipetrol / Sirari', pct: 28.0 },
      { zona: 'Norte 2do al 5to Anillo', pct: 18.0 },
      { zona: 'Norte 5to al 8vo Anillo', pct: 14.0 },
      { zona: 'Urubó Residencial', pct: 11.0 },
      { zona: 'Centro Histórico / Universidad', pct: 8.0 },
      { zona: 'Noroeste 2do al 4to', pct: 6.0 },
      { zona: 'Otras Zonas', pct: 15.0 },
    ],
    factoresZona: [
      { factor: 'Rápida plusvalía proyectada', pct: 13.8 },
      { factor: 'Transporte y accesos fluidos', pct: 11.0 },
      { factor: 'Tranquilidad y seguridad vecinal', pct: 11.2 },
      { factor: 'Prestigio social de la zona', pct: 8.6 },
      { factor: 'Zona no inundable / buen drenaje', pct: 7.8 },
      { factor: 'Cercanía a clínicas y colegios', pct: 7.2 },
      { factor: 'Alta rotación de alquileres', pct: 40.4 },
    ],
    preferenciaAmenidades: [
      { concepto: 'Exige Full Amenidades (Acepta mayor expensa)', pct: 44 },
      { concepto: 'Amenidades Moderadas (Foco reventa/renta ágil)', pct: 42 },
      { concepto: 'Mínimas Amenidades (Prioriza bajas expensas)', pct: 14 },
    ],
  },

  viviendaPropia: {
    muestra: 441,
    tipologia: [
      { tipo: 'Casa en barrio abierto', pct: 54.0 },
      { tipo: 'Casa en condominio cerrado', pct: 25.0 },
      { tipo: 'Departamento residencial', pct: 20.5 },
      { tipo: 'Terreno para autoconstrucción', pct: 0.5 },
    ],
    presupuesto: [
      { rango: 'Menos de $40.000 USD', pct: 24 },
      { rango: '$41.000 a $60.000 USD', pct: 31 },
      { rango: '$61.000 a $80.000 USD', pct: 22 },
      { rango: '$81.000 a $120.000 USD', pct: 15 },
      { rango: 'Más de $120.000 USD', pct: 8 },
    ],
    decision: [
      { factor: 'Precio accesible y cuota pagable', pct: 51 },
      { factor: 'Ubicación cercana a familia/trabajo', pct: 27 },
      { factor: 'Calidad de materiales constructivos', pct: 14 },
      { factor: 'Entorno vecinal seguro', pct: 8 },
    ],
    zonas: [
      { zona: 'Norte 5to al 10mo Anillo', pct: 24.0 },
      { zona: 'Norte 2do al 5to Anillo', pct: 16.0 },
      { zona: 'Villa 1ro de Mayo', pct: 12.0 },
      { zona: 'Zona Sur (Santos Dumont)', pct: 11.0 },
      { zona: 'Doble Vía La Guardia', pct: 9.0 },
      { zona: 'Pampa de la Isla', pct: 8.0 },
      { zona: 'Otras Macrozonas', pct: 20.0 },
    ],
    factoresZona: [
      { factor: 'Seguridad ciudadana en el barrio', pct: 22.4 },
      { factor: 'Cercanía a colegios y trabajo', pct: 19.8 },
      { factor: 'Servicios básicos garantizados (Agua/Gas)', pct: 16.5 },
      { factor: 'Líneas de micro accesibles', pct: 14.1 },
      { factor: 'Calles pavimentadas y drenaje pluvial', pct: 12.8 },
      { factor: 'Parques y áreas verdes familiares', pct: 14.4 },
    ],
    amenidades: [
      { amenidad: 'Piscina para niños y adultos', pct: 26.5 },
      { amenidad: 'Churrasquera techada', pct: 23.5 },
      { amenidad: 'Parque infantil con juegos', pct: 18.2 },
      { amenidad: 'Gimnasio equipado', pct: 13.7 },
      { amenidad: 'Salón de eventos / lounge', pct: 9.8 },
      { amenidad: 'Cancha polifuncional deportiva', pct: 8.3 },
    ],
    porQueCasa: [
      { motivo: 'Libertad para remodelar y ampliar en el tiempo', pct: 26.0 },
      { motivo: 'Jardín y patio propio privado', pct: 22.5 },
      { motivo: 'Espacio familiar independiente y mascotas', pct: 20.5 },
      { motivo: 'No pagar expensas mensuales de administración', pct: 16.0 },
      { motivo: 'Privacidad acústica sin vecinos arriba/abajo', pct: 15.0 },
    ],
    porQueDepto: [
      { motivo: 'Seguridad 24/7 y control de ingreso con cámaras', pct: 38.0 },
      { motivo: 'Menor costo y tiempo en mantenimiento diario', pct: 17.5 },
      { motivo: 'Ubicación más céntrica al mismo presupuesto', pct: 15.0 },
      { motivo: 'Amenidades premium ya construidas en el edificio', pct: 14.0 },
      { motivo: 'Vistas panorámicas y mejor iluminación', pct: 15.5 },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 06: SISTEMA FINANCIERO Y LIQUIDEZ HIPOTECARIA
// ─────────────────────────────────────────────────────────────────────────────
export const SISTEMA_FINANCIERO_DATA = {
  carteraHipotecaria: [
    { periodo: '2015', totalUsd: 4200, visUsd: 1450, tasaPromedio: 6.8 },
    { periodo: '2017', totalUsd: 5500, visUsd: 2600, tasaPromedio: 6.2 },
    { periodo: '2019', totalUsd: 6700, visUsd: 3900, tasaPromedio: 5.9 },
    { periodo: '2021', totalUsd: 7300, visUsd: 4700, tasaPromedio: 5.8 },
    { periodo: '2023', totalUsd: 7780, visUsd: 5300, tasaPromedio: 5.7 },
    { periodo: '2024', totalUsd: 7810, visUsd: 5310, tasaPromedio: 6.1 },
    { periodo: '2025', totalUsd: 7815, visUsd: 5315, tasaPromedio: 6.4 },
    { periodo: '2026', totalUsd: 7820, visUsd: 5320, tasaPromedio: 6.8 },
  ],
  moraHipotecaria: {
    totalMoraUsd: 132, // Millones USD
    ratioMoraPct: 3.2,
    reprogramadaUsd: 75.2,
    noReprogramadaUsd: 56.8,
    serie: [
      { periodo: 'Mar-2021', totalMoraUsd: 48, reprogramadaUsd: 18, noReprogramadaUsd: 30, ratioPct: 1.5 },
      { periodo: 'Mar-2022', totalMoraUsd: 59, reprogramadaUsd: 26, noReprogramadaUsd: 33, ratioPct: 1.8 },
      { periodo: 'Mar-2023', totalMoraUsd: 78, reprogramadaUsd: 41, noReprogramadaUsd: 37, ratioPct: 2.1 },
      { periodo: 'Mar-2024', totalMoraUsd: 104, reprogramadaUsd: 58, noReprogramadaUsd: 46, ratioPct: 2.7 },
      { periodo: 'Mar-2025', totalMoraUsd: 122, reprogramadaUsd: 69, noReprogramadaUsd: 53, ratioPct: 3.0 },
      { periodo: 'Mar-2026', totalMoraUsd: 132, reprogramadaUsd: 75, noReprogramadaUsd: 57, ratioPct: 3.2 },
    ],
  },
  moraConstruccion: {
    totalMoraUsd: 47, // Millones USD
    ratioMoraPct: 3.2,
    pctReprogramada: 89.4,
    serie: [
      { periodo: '2021', montoUsd: 22, ratioPct: 1.3 },
      { periodo: '2022', montoUsd: 35, ratioPct: 1.9 },
      { periodo: 'Jun-2023', montoUsd: 60, ratioPct: 3.8 },
      { periodo: '2024', montoUsd: 52, ratioPct: 3.4 },
      { periodo: '2025', montoUsd: 49, ratioPct: 3.3 },
      { periodo: '2026', montoUsd: 47, ratioPct: 3.2 },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 07: CICLO INMOBILIARIO RESIDENCIAL (2002 - 2026)
// ─────────────────────────────────────────────────────────────────────────────
export const CICLO_INMOBILIARIO_DATA = {
  tasaEquilibrio: 95.8,
  faseActual: {
    nombre: 'Recesión / Ajuste Cíclico',
    numero: 4,
    ocupacionActual: 93.0,
    diagnostico: 'Tasa de ocupación por debajo de la media de equilibrio (95.8%). Oferta superando absorción y presión en precios de venta y alquiler.',
  },
  fases: [
    { fase: 'Fase I: Recuperación', periodo: '2003 - 2007', ocupacionRango: '93.5% → 95.5%', caracteristica: 'Crecimiento de absorción, stock vacante en descenso.' },
    { fase: 'Fase II: Expansión (Boom)', periodo: '2008 - 2015', ocupacionRango: '95.5% → 98.8%', caracteristica: 'Pico histórico de ocupación, auge de lanzamientos y subida de precios.' },
    { fase: 'Fase III: Sobreoferta', periodo: '2016 - 2017', ocupacionRango: '98.8% → 95.5%', caracteristica: 'Construcción masiva supera la demanda real; inicio de desaceleración.' },
    { fase: 'Fase IV: Recesión / Ajuste', periodo: '2018 - 2026', ocupacionRango: '95.5% → 93.0%', caracteristica: 'Ocupación bajo equilibrio; ajuste de precios y brecha cambiaria.' },
  ],
  serieHistoricaOcupacion: [
    { ano: '2002', ocupacion: 92.5, alquilerVar: -4.2 },
    { ano: '2004', ocupacion: 93.8, alquilerVar: -1.0 },
    { ano: '2006', ocupacion: 95.0, alquilerVar: 2.5 },
    { ano: '2008', ocupacion: 96.4, alquilerVar: 6.8 },
    { ano: '2010', ocupacion: 97.5, alquilerVar: 8.4 },
    { ano: '2012', ocupacion: 98.4, alquilerVar: 9.2 },
    { ano: '2014', ocupacion: 98.8, alquilerVar: 7.1 },
    { ano: '2016', ocupacion: 96.8, alquilerVar: 1.5 },
    { ano: '2018', ocupacion: 95.2, alquilerVar: -2.3 },
    { ano: '2020', ocupacion: 93.6, alquilerVar: -6.5 },
    { ano: '2022', ocupacion: 94.4, alquilerVar: -1.8 },
    { ano: '2024', ocupacion: 93.4, alquilerVar: -3.5 },
    { ano: '2026', ocupacion: 93.0, alquilerVar: -4.1 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 08: ENDEUDAMIENTO HIPOTECARIO Y SENTIMIENTO DEL COMPRADOR (n = 796)
// ─────────────────────────────────────────────────────────────────────────────
export const ENDEUDAMIENTO_DATA = {
  muestra: 796,
  muestraLaboral: 690,
  muestraIngresos: 490,

  zonasCredito: [
    { zona: 'Norte 5to a 10mo Anillo', pct: 16.2 },
    { zona: 'Norte Suburbano (Warnes/Satélite)', pct: 13.2 },
    { zona: 'Villa 1ro de Mayo', pct: 11.8 },
    { zona: 'Zona Sur (Santos Dumont)', pct: 10.0 },
    { zona: 'Norte 2do al 5to Anillo', pct: 8.0 },
    { zona: 'Noroeste 2do al 4to Anillo', pct: 5.3 },
    { zona: 'Centro Tradicional', pct: 4.0 },
    { zona: 'Urubó Residencial', pct: 4.0 },
    { zona: 'Equipetrol / Sirari', pct: 3.8 },
    { zona: 'Periferia Centro Sur Oeste', pct: 3.6 },
    { zona: 'Pampa de la Isla', pct: 3.2 },
    { zona: 'Doble Vía La Guardia Km 7 al 13', pct: 2.6 },
    { zona: 'Las Palmas', pct: 2.4 },
    { zona: 'Plan 3000', pct: 2.2 },
    { zona: 'Las Américas', pct: 2.2 },
    { zona: 'Urbarí', pct: 2.0 },
    { zona: 'Oeste', pct: 2.0 },
    { zona: 'Doble Vía La Guardia 4to al 7mo', pct: 2.0 },
    { zona: 'Av. Santos Dumont 7mo al 10mo', pct: 1.8 },
    { zona: 'Av. Santos Dumont 4to al 7mo', pct: 1.6 },
    { zona: 'Este', pct: 1.0 },
    { zona: 'Palmar Sur', pct: 1.0 },
    { zona: 'Doble Vía Km 9 al 15', pct: 0.8 },
    { zona: 'Otras Localizaciones', pct: 0.9 },
  ],

  tiposFinanciacion: [
    { tipo: 'Vivienda de Interés Social (VIS)', pct: 55.2 },
    { tipo: 'Vivienda Regular / Hipotecario Abierto', pct: 31.0 },
    { tipo: 'Préstamo Particular / Familiar', pct: 8.8 },
    { tipo: 'Crédito Directo Desarrollador', pct: 4.2 },
    { tipo: 'Crédito de Consumo / Personal', pct: 0.8 },
  ],

  caracteristicasHogar: {
    valorCompra: [
      { rango: 'Menos de 35 mil USD', pct: 16.8 },
      { rango: 'De 36 a 50 mil USD', pct: 21.2 },
      { rango: 'De 51 a 65 mil USD', pct: 17.1 },
      { rango: 'De 66 a 80 mil USD', pct: 15.9 },
      { rango: 'De 81 a 95 mil USD', pct: 11.0 },
      { rango: 'De 96 a 110 mil USD', pct: 11.6 },
      { rango: 'De 111 a 125 mil USD', pct: 2.8 },
      { rango: 'De 126 a 150 mil USD', pct: 2.5 },
      { rango: 'Más de 150 mil USD', pct: 2.0 },
    ],
    tipoVivienda: [
      { tipo: 'Casa', pct: 75.4 },
      { tipo: 'Departamento', pct: 24.6 },
    ],
    dormitorios: [
      { dorms: 'Monoambiente', pct: 5.5 },
      { dorms: '1 Dormitorio', pct: 26.0 },
      { dorms: '2 Dormitorios', pct: 49.0 },
      { dorms: '3 Dormitorios', pct: 18.7 },
      { dorms: '4 o más Dormitorios', pct: 0.8 },
    ],
    tamanoFamilia: [
      { tamano: 'Pequeña (Menos de 2 personas)', pct: 14.4 },
      { tamano: 'Mediana (3 a 5 personas)', pct: 75.4 },
      { tamano: 'Grande (Más de 5 personas)', pct: 10.2 },
    ],
  },

  situacionLaboral: {
    fuenteIngresos: [
      { fuente: 'Empleo en Empresa Privada', y2023: 58, y2024: 48, y2025: 62, y2026: 62 },
      { fuente: 'Profesional Independiente', y2023: 16, y2024: 31, y2025: 19, y2026: 20 },
      { fuente: 'Negocio Propio / Comercio', y2023: 14, y2024: 16, y2025: 14, y2026: 13 },
      { fuente: 'Empleo en Empresa Estatal', y2023: 17, y2024: 16, y2025: 13, y2026: 13 },
    ],
    climaLaboral: [
      { emocion: 'Optimismo', y2023: 47, y2024: 54, y2025: 47, y2026: 53 },
      { emocion: 'Esperanza', y2023: 37, y2024: 28, y2025: 43, y2026: 30 },
      { emocion: 'Alivio', y2023: 7, y2024: 4, y2025: 3, y2026: 6 },
      { emocion: 'Depresión', y2023: 8, y2024: 6, y2025: 5, y2026: 6 },
      { emocion: 'Pánico', y2023: 4, y2024: 3, y2025: 4, y2026: 3 },
      { emocion: 'Desesperación', y2023: 3, y2024: 2, y2025: 3, y2026: 2 },
    ],
  },

  evolutivoIngresosReduccion: [
    { rango: '0% (Sin reducción)', y2024: 28, y2025: 38, y2026: 37 },
    { rango: '1% a 10% de reducción', y2024: 28, y2025: 16, y2026: 23 },
    { rango: '11% a 20% de reducción', y2024: 12, y2025: 22, y2026: 26 },
    { rango: '21% a 30% de reducción', y2024: 25, y2025: 12, y2026: 11 },
    { rango: 'Más de 30% de reducción', y2024: 8, y2025: 12, y2026: 8 },
  ],

  bancosFinanciadores: [
    { banco: 'Banco Mercantil Santa Cruz', pct: 26.4 },
    { banco: 'Banco de Crédito BCP', pct: 12.5 },
    { banco: 'Banco Ganadero', pct: 11.2 },
    { banco: 'Banco Nacional de Bolivia BNB', pct: 11.0 },
    { banco: 'Banco Unión', pct: 11.0 },
    { banco: 'Banco Económico', pct: 5.1 },
    { banco: 'Banco Bisa', pct: 2.4 },
    { banco: 'Banco Sol', pct: 1.5 },
    { banco: 'Banco Fie', pct: 1.1 },
    { banco: 'Banco Fassil (Residual)', pct: 1.1 },
    { banco: 'Banco Fortaleza', pct: 0.9 },
    { banco: 'Banco Prodem', pct: 0.9 },
    { banco: 'Mutual La Primera', pct: 0.8 },
    { banco: 'Otros y Cooperativas', pct: 14.1 },
  ],

  estadoPrestamo: {
    nivelDeuda: [
      { rango: 'Menos de 33% del ingreso', pct: 60.0 },
      { rango: 'Entre 34% y 40%', pct: 14.0 },
      { rango: 'Entre 41% y 50%', pct: 9.0 },
      { rango: 'Mayor a 50% (Estrés financiero)', pct: 13.0 },
    ],
    aportePropio: [
      { rango: '0% de aporte propio (100% financiado)', pct: 20.0 },
      { rango: 'Menos del 5%', pct: 10.0 },
      { rango: 'Entre 5% y 10%', pct: 24.0 },
      { rango: 'Entre 10% y 15%', pct: 12.0 },
      { rango: 'Entre 15% y 20%', pct: 24.0 },
      { rango: 'Más del 20%', pct: 20.0 },
    ],
    nse: [
      { estrato: 'ABC1 (Alto y Medio Alto)', pct: 18.0 },
      { estrato: 'C2 (Medio Típico)', pct: 39.0 },
      { estrato: 'C3 (Medio Emergente)', pct: 36.0 },
      { estrato: 'D1 (Bajo Superior)', pct: 10.0 },
    ],
    ingresoFamiliar: [
      { rango: 'Hasta 7.000 Bs', pct: 8.5 },
      { rango: '7.001 a 9.000 Bs', pct: 11.2 },
      { rango: '9.001 a 10.000 Bs', pct: 8.9 },
      { rango: '10.001 a 12.000 Bs', pct: 14.5 },
      { rango: '12.001 a 15.000 Bs', pct: 16.2 },
      { rango: '15.001 a 20.000 Bs', pct: 13.7 },
      { rango: 'Más de 20.000 Bs', pct: 8.8 },
      { rango: 'Otros / Reservado', pct: 18.2 },
    ],
  },

  estadoPrestatarioReprogramacion: [
    { ano: '2023', no: 64, si: 36 },
    { ano: '2024', no: 79, si: 21 },
    { ano: '2025', no: 86, si: 14 },
    { ano: '2026', no: 82, si: 18 },
  ],

  dificultadPago: [
    { nivel: 'Pago puntual sin dificultades', pct: 48.0 },
    { nivel: 'Retraso menor a 30 días', pct: 16.0 },
    { nivel: 'Retraso mayor a 30 días', pct: 18.0 },
    { nivel: 'En imposibilidad actual de pago', pct: 2.0 },
    { nivel: 'Otros / Apoyo familiar', pct: 16.0 },
  ],

  probabilidadDefault: [
    { nivel: 'Seguro que NO', pct: 24.0 },
    { nivel: 'Creo que NO', pct: 35.0 },
    { nivel: 'Tal vez / Incierto', pct: 23.0 },
    { nivel: 'Creo que SI', pct: 3.0 },
    { nivel: 'Seguro que SI', pct: 2.0 },
    { nivel: 'No sabe / Prefiere no responder', pct: 13.0 },
  ],

  percepcionPasadoPrecios: [
    { ano: '2022', bajo: 47, igual: 44, subio: 9 },
    { ano: '2023', bajo: 23, igual: 53, subio: 24 },
    { ano: '2024', bajo: 18, igual: 55, subio: 28 },
    { ano: '2025', bajo: 23, igual: 41, subio: 36 },
    { ano: '2026', bajo: 9, igual: 55, subio: 37 },
  ],

  percepcionFuturoExpectativa: [
    { concepto: 'Ya pasó lo peor, vienen años mejores', pct: 28.0 },
    { concepto: 'Estoy buscando oportunidades en otros lugares', pct: 21.0 },
    { concepto: 'Van a ser 2 años muy buenos', pct: 20.0 },
    { concepto: 'Siento que se me abrirán muchas oportunidades', pct: 15.0 },
    { concepto: 'Espero un clima de pánico generalizado', pct: 7.0 },
    { concepto: 'Serán años perdidos económicamente', pct: 6.0 },
    { concepto: 'Otras respuestas', pct: 3.0 },
  ],

  percepcionFuturoPrecios12Meses: [
    { ano: '2022', bajara: 27, igual: 54, subira: 19 },
    { ano: '2023', bajara: 26, igual: 48, subira: 26 },
    { ano: '2024', bajara: 22, igual: 52, subira: 26 },
    { ano: '2025', bajara: 18, igual: 41, subira: 41 },
    { ano: '2026', bajara: 8, igual: 55, subira: 37 },
  ],
}
