import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import './CitrinoInstitutionalPanels.css'
import { DEMANDA_DATA } from '../data/citrinoDataStudioData'

interface Props {
  initialChapter?: '2.1' | '2.2' | '2.3'
}

export default function AnalisisDemandaPanel({ initialChapter = '2.1' }: Props) {
  const [activeChapter, setActiveChapter] = useState<'2.1' | '2.2' | '2.3'>(initialChapter)

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

  const { general, inversion, viviendaPropia } = DEMANDA_DATA

  // Charts
  const getPieSimple = (data: { name: string; value: number }[], colors?: string[]) => ({
    aria: { enabled: true },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#94a3b8' } },
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
      axisLabel: { color: '#94a3b8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: [...categories].reverse(),
      axisLabel: { color: '#cbd5e1' },
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

  return (
    <div className="citrino-panel-wrap">
      {/* Header */}
      <div className="citrino-panel-header">
        <div className="citrino-title-area">
          <div className="citrino-badge-row">
            <span className="citrino-badge">Módulo 05</span>
            <span className="citrino-sample-badge">Estudio de Mercado Censal de Demanda</span>
          </div>
          <h1 className="citrino-panel-title">Análisis de la Demanda Inmobiliaria</h1>
          <p className="citrino-panel-subtitle">
            Capacidad económica, motivadores de inversión y preferencias de vivienda en Santa Cruz.
          </p>
        </div>
      </div>

      {/* Selector de Capítulo de Demanda */}
      <div className="citrino-nav-pills">
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '2.1' ? 'active' : ''}`}
          onClick={() => setActiveChapter('2.1')}
        >
          2.1 Composición Económica y Voluntad
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '2.2' ? 'active' : ''}`}
          onClick={() => setActiveChapter('2.2')}
        >
          2.2 Compra como Inversión (n=459)
        </button>
        <button
          className={`citrino-nav-pill-btn ${activeChapter === '2.3' ? 'active' : ''}`}
          onClick={() => setActiveChapter('2.3')}
        >
          2.3 Compra Vivienda Propia (n=441)
        </button>
      </div>

      {/* ── 2.1 COMPOSICIÓN ECONÓMICA ── */}
      {activeChapter === '2.1' && (
        <div>
          <div className="citrino-kpis-grid">
            <div className="citrino-kpi-card green">
              <span className="citrino-kpi-label">Intención Vivienda Propia</span>
              <span className="citrino-kpi-val">55%</span>
              <span className="citrino-kpi-sub">Sube de 42% en 2025</span>
            </div>
            <div className="citrino-kpi-card blue">
              <span className="citrino-kpi-label">Intención Inversión</span>
              <span className="citrino-kpi-val">45%</span>
              <span className="citrino-kpi-sub">Baja de 58% en 2025</span>
            </div>
            <div className="citrino-kpi-card amber">
              <span className="citrino-kpi-label">Estrato Ingreso Mediano</span>
              <span className="citrino-kpi-val">3k - 7k Bs/mes</span>
              <span className="citrino-kpi-sub">41% de hogares consultados</span>
            </div>
            <div className="citrino-kpi-card purple">
              <span className="citrino-kpi-label">Cuota Inicial Disponible</span>
              <span className="citrino-kpi-val">&lt; 25.000 Bs</span>
              <span className="citrino-kpi-sub">40.6% barrera de entrada</span>
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
      )}

      {/* ── 2.2 COMPRA COMO INVERSIÓN (n=459) ── */}
      {activeChapter === '2.2' && (
        <div>
          {/* Sub-tabs nivel 2 */}
          <div className="citrino-subpills-row" style={{ marginBottom: 16 }}>
            <span className="citrino-subpill-label">Dimensión:</span>
            <button
              className={`citrino-subpill-btn ${invSubTab === 'motivadores' ? 'active' : ''}`}
              onClick={() => setInvSubTab('motivadores')}
            >
              02-A Motivadores de Inversión
            </button>
            <button
              className={`citrino-subpill-btn ${invSubTab === 'tipologia' ? 'active' : ''}`}
              onClick={() => setInvSubTab('tipologia')}
            >
              02-B Tipología y Precio
            </button>
            <button
              className={`citrino-subpill-btn ${invSubTab === 'zonas' ? 'active' : ''}`}
              onClick={() => setInvSubTab('zonas')}
            >
              02-C Preferencias de Zonas
            </button>
            <button
              className={`citrino-subpill-btn ${invSubTab === 'amenidades' ? 'active' : ''}`}
              onClick={() => setInvSubTab('amenidades')}
            >
              02-D Valores Agregados
            </button>
          </div>

          {/* 02-A Motivadores */}
          {invSubTab === 'motivadores' && (
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">Motivadores Clave para Comprar como Inversión (n = 459)</h3>
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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
                <button
                  className={`citrino-subpill-btn ${invPillTipologia === 'decision' ? 'active' : ''}`}
                  onClick={() => setInvPillTipologia('decision')}
                >
                  🎯 Decisión de Compra (1er y 2do Factor)
                </button>
                <button
                  className={`citrino-subpill-btn ${invPillTipologia === 'valor' ? 'active' : ''}`}
                  onClick={() => setInvPillTipologia('valor')}
                >
                  💵 Valor del Inmueble (Ticket Objetivo)
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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
            <div className="citrino-card-box">
              <div className="citrino-card-header">
                <h3 className="citrino-card-title">02-D Filosofía de Áreas Comunes vs Costo de Expensas en Inversión</h3>
              </div>
              <ReactECharts
                option={getPieSimple(inversion.preferenciaAmenidades.map((a) => ({ name: a.concepto, value: a.pct })))}
                style={{ height: 300 }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── 2.3 COMPRA VIVIENDA PROPIA (n=441) ── */}
      {activeChapter === '2.3' && (
        <div>
          <div className="citrino-subpills-row" style={{ marginBottom: 16 }}>
            <span className="citrino-subpill-label">Dimensión:</span>
            <button
              className={`citrino-subpill-btn ${vivSubTab === 'tipologia' ? 'active' : ''}`}
              onClick={() => setVivSubTab('tipologia')}
            >
              03-A Tipología y Precio
            </button>
            <button
              className={`citrino-subpill-btn ${vivSubTab === 'zonas' ? 'active' : ''}`}
              onClick={() => setVivSubTab('zonas')}
            >
              03-B Preferencias de Zonas
            </button>
            <button
              className={`citrino-subpill-btn ${vivSubTab === 'amenidades' ? 'active' : ''}`}
              onClick={() => setVivSubTab('amenidades')}
            >
              03-C Valores Agregados
            </button>
            <button
              className={`citrino-subpill-btn ${vivSubTab === 'casa' ? 'active' : ''}`}
              onClick={() => setVivSubTab('casa')}
            >
              03-D Preferencia Casa
            </button>
            <button
              className={`citrino-subpill-btn ${vivSubTab === 'depto' ? 'active' : ''}`}
              onClick={() => setVivSubTab('depto')}
            >
              03-E Preferencia Depto
            </button>
          </div>

          {/* 03-A Tipología y Precio (con Aspectos, Valor, Decisión) */}
          {vivSubTab === 'tipologia' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                  <h3 className="citrino-card-title">Áreas Comunes Prioritarias para la Familia</h3>
                </div>
                <ReactECharts
                  option={getBarSimple(viviendaPropia.amenidades.map((a) => a.amenidad), viviendaPropia.amenidades.map((a) => a.pct), '#10b981')}
                  style={{ height: 280 }}
                />
              </div>
            </div>
          )}

          {/* 03-D Preferencia Casa (¿Por qué Casa?, Aspectos, Detalles) */}
          {vivSubTab === 'casa' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                  📐 Aspectos Espaciales
                </button>
                <button
                  className={`citrino-subpill-btn ${vivPillCasa === 'detalles' ? 'active' : ''}`}
                  onClick={() => setVivPillCasa('detalles')}
                >
                  🧱 Detalles Constructivos
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {vivPillCasa === 'por_que'
                      ? 'Razones Clave de la Preferencia por Casa Independiente'
                      : vivPillCasa === 'aspectos'
                      ? 'Aspectos Espaciales: Patio Propio, Muros Independientes y Garaje 2+'
                      : 'Detalles Constructivos: Terreno propio, barda perimetral y sin expensas'}
                  </h3>
                </div>
                <ReactECharts
                  option={getBarSimple(viviendaPropia.porQueCasa.map((c) => c.motivo), viviendaPropia.porQueCasa.map((c) => c.pct), '#ff6b00')}
                  style={{ height: 280 }}
                />
              </div>
            </div>
          )}

          {/* 03-E Preferencia Depto (¿Por qué Depto?, Aspectos, Detalles) */}
          {vivSubTab === 'depto' && (
            <div>
              <div className="citrino-subpills-row">
                <span className="citrino-subpill-label">Sub-pestaña auditada:</span>
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
                  📐 Aspectos Espaciales
                </button>
                <button
                  className={`citrino-subpill-btn ${vivPillDepto === 'detalles' ? 'active' : ''}`}
                  onClick={() => setVivPillDepto('detalles')}
                >
                  🔑 Detalles de Equipamiento
                </button>
              </div>

              <div className="citrino-card-box">
                <div className="citrino-card-header">
                  <h3 className="citrino-card-title">
                    {vivPillDepto === 'por_que'
                      ? 'Razones Clave de la Preferencia por Departamento'
                      : vivPillDepto === 'aspectos'
                      ? 'Aspectos Espaciales: Altura de Piso, Iluminación y Vistas Panorámicas'
                      : 'Detalles de Equipamiento: Balcón churrasquera, parqueo techado y baulera'}
                  </h3>
                </div>
                <ReactECharts
                  option={getBarSimple(viviendaPropia.porQueDepto.map((d) => d.motivo), viviendaPropia.porQueDepto.map((d) => d.pct), '#38bdf8')}
                  style={{ height: 280 }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
