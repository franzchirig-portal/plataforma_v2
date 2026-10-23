import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { ENDEUDAMIENTO_DATA } from '../data/citrinoDataStudioData'
import { useChartTheme } from '../lib/chartTheme'

interface Props {
  initialChapter?: '4.1' | '4.2' | '4.3'
}

export default function EndeudamientoHipotecarioPanel({ initialChapter = '4.1' }: Props) {
  const ct = useChartTheme()
  const [activeChapter, setActiveChapter] = useState<'4.1' | '4.2' | '4.3'>(initialChapter)

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
  } = ENDEUDAMIENTO_DATA

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
      {/* Header */}
      <div className="citrino-panel-header">
        <div className="citrino-title-area">
          <div className="citrino-badge-row">
            <span className="citrino-badge">Módulo 08</span>
            <span className="citrino-sample-badge">Encuesta Especializada n = 796 Deudores Hipotecarios</span>
          </div>
          <h1 className="citrino-panel-title">Endeudamiento Hipotecario y Sentimiento del Comprador</h1>
          <p className="citrino-panel-subtitle">
            Perfil del prestatario, origen territorial, estrés financiero, reprogramaciones bancarias y expectativas futuras de precios.
          </p>
        </div>
      </div>

      {/* Selector de Capítulo */}
      <div className="citrino-nav-pills">
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '4.1' ? 'active' : ''}`}
          onClick={() => setActiveChapter('4.1')}
        >
          4.1 Perfil del Consumidor (n=796)
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '4.2' ? 'active' : ''}`}
          onClick={() => setActiveChapter('4.2')}
        >
          4.2 Estado de la Cartera Hipotecaria
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '4.3' ? 'active' : ''}`}
          onClick={() => setActiveChapter('4.3')}
        >
          4.3 Perspectivas del Comprador
        </button>
      </div>

      {/* ── 4.1 PERFIL DEL CONSUMIDOR (n=796) ── */}
      {activeChapter === '4.1' && (
        <div>
          {/* Sub-tabs nivel 2 */}
          <div className="citrino-subpills-row" style={{ marginBottom: 14 }}>
            <span className="citrino-subpill-label">Dimensión:</span>
            <button
              className={`citrino-subpill-btn ${perfilSubTab === 'zona' ? 'active' : ''}`}
              onClick={() => setPerfilSubTab('zona')}
            >
              01-A Zona y Tipo Otorgación
            </button>
            <button
              className={`citrino-subpill-btn ${perfilSubTab === 'hogar' ? 'active' : ''}`}
              onClick={() => setPerfilSubTab('hogar')}
            >
              01-B Características de Hogar
            </button>
            <button
              className={`citrino-subpill-btn ${perfilSubTab === 'laboral' ? 'active' : ''}`}
              onClick={() => setPerfilSubTab('laboral')}
            >
              01-C Situación Laboral (n=690)
            </button>
            <button
              className={`citrino-subpill-btn ${perfilSubTab === 'ingresos' ? 'active' : ''}`}
              onClick={() => setPerfilSubTab('ingresos')}
            >
              01-D Evolutivo Ingresos (n=490)
            </button>
          </div>

          {/* 01-A Zona y Financiación */}
          {perfilSubTab === 'zona' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                        option={getPie(caracteristicasHogar.tipoVivienda.map((t) => ({ name: t.tipo, value: t.pct })), ['#ff6b00', '#38bdf8'])}
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
          <div className="citrino-subpills-row" style={{ marginBottom: 14 }}>
            <span className="citrino-subpill-label">Dimensión:</span>
            <button
              className={`citrino-subpill-btn ${carteraSubTab === 'bancos' ? 'active' : ''}`}
              onClick={() => setCarteraSubTab('bancos')}
            >
              02-A Bancos Financiadores
            </button>
            <button
              className={`citrino-subpill-btn ${carteraSubTab === 'prestamo' ? 'active' : ''}`}
              onClick={() => setCarteraSubTab('prestamo')}
            >
              02-B Estado del Préstamo (5 Sub-pestañas)
            </button>
            <button
              className={`citrino-subpill-btn ${carteraSubTab === 'prestatario' ? 'active' : ''}`}
              onClick={() => setCarteraSubTab('prestatario')}
            >
              02-C Estado del Prestatario (Reprogramación)
            </button>
            <button
              className={`citrino-subpill-btn ${carteraSubTab === 'endeudamiento' ? 'active' : ''}`}
              onClick={() => setCarteraSubTab('endeudamiento')}
            >
              02-D Evolutivo del Endeudamiento (Default)
            </button>
          </div>

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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                        <td className="num" style={{ color: '#ef4444' }}><b>{r.si}%</b></td>
                        <td>{r.ano === '2023' ? 'Pico pos-pandemia' : r.ano === '2026' ? 'Reactivación leve de reprogramaciones' : 'Baja morosidad declarada'}</td>
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
                  <h3 className="citrino-card-title">¿Qué tan probable es que deje de pagar su crédito? (Default)</h3>
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
          <div className="citrino-subpills-row" style={{ marginBottom: 14 }}>
            <span className="citrino-subpill-label">Dimensión:</span>
            <button
              className={`citrino-subpill-btn ${perspectivasSubTab === 'pasado' ? 'active' : ''}`}
              onClick={() => setPerspectivasSubTab('pasado')}
            >
              03-A Percepción del Pasado (12 Meses Atrás)
            </button>
            <button
              className={`citrino-subpill-btn ${perspectivasSubTab === 'futuro' ? 'active' : ''}`}
              onClick={() => setPerspectivasSubTab('futuro')}
            >
              03-B Percepción del Futuro
            </button>
          </div>

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
                        <td className="num" style={{ color: '#ef4444' }}>{p.bajo}%</td>
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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                            <td className="num" style={{ color: '#ef4444' }}>{p.bajara}%</td>
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
