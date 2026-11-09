-- =====================================================================
-- 002_rls_public_read.sql
-- Habilita lectura pública (anon) en las 33 tablas de Citrino:
--   - 6 tablas oferta_* (Capítulos 1.1 y 1.2: Oferta Nueva)
--   - 3 tablas anu_*    (Capítulo 1.3: Oferta de Particulares)
--   - 11 tablas ind_*   (Capítulos 1.4, 3.1, 3.2 y 5.1: Indicadores y ASFI)
--   - 13 tablas enc_*   (Capítulos 2.1-2.3 y 4.1-4.3: Encuestas de Demanda y Crédito)
-- Ejecutar en Supabase → SQL Editor.
-- =====================================================================

-- ── CAPÍTULOS 1.1 Y 1.2: OFERTA NUEVA (6 TABLAS) ─────────────────────

-- 1. oferta_proyectos
ALTER TABLE public.oferta_proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read proyectos" ON public.oferta_proyectos;
CREATE POLICY "Public read proyectos" ON public.oferta_proyectos
  FOR SELECT USING (true);

-- 2. oferta_indicadores_censo
ALTER TABLE public.oferta_indicadores_censo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read indicadores" ON public.oferta_indicadores_censo;
CREATE POLICY "Public read indicadores" ON public.oferta_indicadores_censo
  FOR SELECT USING (true);

-- 3. oferta_tipologias
ALTER TABLE public.oferta_tipologias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tipologias" ON public.oferta_tipologias;
CREATE POLICY "Public read tipologias" ON public.oferta_tipologias
  FOR SELECT USING (true);

-- 4. oferta_avg_tipologias
ALTER TABLE public.oferta_avg_tipologias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read avg_tipologias" ON public.oferta_avg_tipologias;
CREATE POLICY "Public read avg_tipologias" ON public.oferta_avg_tipologias
  FOR SELECT USING (true);

-- 5. oferta_condiciones_financieras
ALTER TABLE public.oferta_condiciones_financieras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read condiciones" ON public.oferta_condiciones_financieras;
CREATE POLICY "Public read condiciones" ON public.oferta_condiciones_financieras
  FOR SELECT USING (true);

-- 6. oferta_amenidades
ALTER TABLE public.oferta_amenidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read amenidades" ON public.oferta_amenidades;
CREATE POLICY "Public read amenidades" ON public.oferta_amenidades
  FOR SELECT USING (true);

-- ── CAPÍTULO 1.3: OFERTA DE PARTICULARES (3 TABLAS) ──────────────────

ALTER TABLE public.anu_anuncios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read anu_anuncios" ON public.anu_anuncios;
CREATE POLICY "Public read anu_anuncios" ON public.anu_anuncios
  FOR SELECT USING (true);

ALTER TABLE public.anu_anuncio_rentabilidad ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read anu_anuncio_rentabilidad" ON public.anu_anuncio_rentabilidad;
CREATE POLICY "Public read anu_anuncio_rentabilidad" ON public.anu_anuncio_rentabilidad
  FOR SELECT USING (true);

ALTER TABLE public.anu_tc_diario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read anu_tc_diario" ON public.anu_tc_diario;
CREATE POLICY "Public read anu_tc_diario" ON public.anu_tc_diario
  FOR SELECT USING (true);

-- ── CAPÍTULO 1.4: BIENES ADJUDICADOS Y REMATES (2 TABLAS) ────────────

ALTER TABLE public.ind_bienes_adjudicados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_bienes_adjudicados" ON public.ind_bienes_adjudicados;
CREATE POLICY "Public read ind_bienes_adjudicados" ON public.ind_bienes_adjudicados
  FOR SELECT USING (true);

ALTER TABLE public.ind_remates_judiciales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_remates_judiciales" ON public.ind_remates_judiciales;
CREATE POLICY "Public read ind_remates_judiciales" ON public.ind_remates_judiciales
  FOR SELECT USING (true);

-- ── CAPÍTULOS 2.1, 2.2, 2.3: ANÁLISIS DE LA DEMANDA (9 TABLAS) ───────

ALTER TABLE public.enc_encuestados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_encuestados" ON public.enc_encuestados;
CREATE POLICY "Public read enc_encuestados" ON public.enc_encuestados
  FOR SELECT USING (true);

ALTER TABLE public.enc_perfil_intencion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_perfil_intencion" ON public.enc_perfil_intencion;
CREATE POLICY "Public read enc_perfil_intencion" ON public.enc_perfil_intencion
  FOR SELECT USING (true);

ALTER TABLE public.enc_inversion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_inversion" ON public.enc_inversion;
CREATE POLICY "Public read enc_inversion" ON public.enc_inversion
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda" ON public.enc_vivienda;
CREATE POLICY "Public read enc_vivienda" ON public.enc_vivienda
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_zonas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_zonas" ON public.enc_vivienda_zonas;
CREATE POLICY "Public read enc_vivienda_zonas" ON public.enc_vivienda_zonas
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_amenidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_amenidades" ON public.enc_vivienda_amenidades;
CREATE POLICY "Public read enc_vivienda_amenidades" ON public.enc_vivienda_amenidades
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_depto_aspectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_depto_aspectos" ON public.enc_vivienda_depto_aspectos;
CREATE POLICY "Public read enc_vivienda_depto_aspectos" ON public.enc_vivienda_depto_aspectos
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_detalle_casa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_detalle_casa" ON public.enc_vivienda_detalle_casa;
CREATE POLICY "Public read enc_vivienda_detalle_casa" ON public.enc_vivienda_detalle_casa
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_detalle_depto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_detalle_depto" ON public.enc_vivienda_detalle_depto;
CREATE POLICY "Public read enc_vivienda_detalle_depto" ON public.enc_vivienda_detalle_depto
  FOR SELECT USING (true);

-- ── CAPÍTULOS 3.1 Y 3.2: SISTEMA FINANCIERO Y MORA (5 TABLAS) ────────

ALTER TABLE public.ind_consolidado_carteras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_consolidado_carteras" ON public.ind_consolidado_carteras;
CREATE POLICY "Public read ind_consolidado_carteras" ON public.ind_consolidado_carteras
  FOR SELECT USING (true);

ALTER TABLE public.ind_consolidado_hipotecaria_vivienda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_consolidado_hipotecaria_vivienda" ON public.ind_consolidado_hipotecaria_vivienda;
CREATE POLICY "Public read ind_consolidado_hipotecaria_vivienda" ON public.ind_consolidado_hipotecaria_vivienda
  FOR SELECT USING (true);

ALTER TABLE public.ind_consolidado_credito_construccion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_consolidado_credito_construccion" ON public.ind_consolidado_credito_construccion;
CREATE POLICY "Public read ind_consolidado_credito_construccion" ON public.ind_consolidado_credito_construccion
  FOR SELECT USING (true);

ALTER TABLE public.ind_cartera_construccion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_cartera_construccion" ON public.ind_cartera_construccion;
CREATE POLICY "Public read ind_cartera_construccion" ON public.ind_cartera_construccion
  FOR SELECT USING (true);

ALTER TABLE public.ind_mora_hipotecaria_bancos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_mora_hipotecaria_bancos" ON public.ind_mora_hipotecaria_bancos;
CREATE POLICY "Public read ind_mora_hipotecaria_bancos" ON public.ind_mora_hipotecaria_bancos
  FOR SELECT USING (true);

-- ── CAPÍTULOS 4.1, 4.2, 4.3: ENDEUDAMIENTO HIPOTECARIO (4 TABLAS) ────

ALTER TABLE public.enc_credito_encuestados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_credito_encuestados" ON public.enc_credito_encuestados;
CREATE POLICY "Public read enc_credito_encuestados" ON public.enc_credito_encuestados
  FOR SELECT USING (true);

ALTER TABLE public.enc_credito_perfil_consumidor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_credito_perfil_consumidor" ON public.enc_credito_perfil_consumidor;
CREATE POLICY "Public read enc_credito_perfil_consumidor" ON public.enc_credito_perfil_consumidor
  FOR SELECT USING (true);

ALTER TABLE public.enc_credito_hipotecario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_credito_hipotecario" ON public.enc_credito_hipotecario;
CREATE POLICY "Public read enc_credito_hipotecario" ON public.enc_credito_hipotecario
  FOR SELECT USING (true);

ALTER TABLE public.enc_credito_creditos_adicionales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_credito_creditos_adicionales" ON public.enc_credito_creditos_adicionales;
CREATE POLICY "Public read enc_credito_creditos_adicionales" ON public.enc_credito_creditos_adicionales
  FOR SELECT USING (true);

ALTER TABLE public.enc_credito_percepcion_mercado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_credito_percepcion_mercado" ON public.enc_credito_percepcion_mercado;
CREATE POLICY "Public read enc_credito_percepcion_mercado" ON public.enc_credito_percepcion_mercado
  FOR SELECT USING (true);

-- ── TABLAS COMPLEMENTARIAS DE ENCUESTAS (INVERSIÓN Y VIVIENDA — 7 TABLAS) ──

ALTER TABLE public.enc_inversion_aspectos_decision ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_inversion_aspectos_decision" ON public.enc_inversion_aspectos_decision;
CREATE POLICY "Public read enc_inversion_aspectos_decision" ON public.enc_inversion_aspectos_decision
  FOR SELECT USING (true);

ALTER TABLE public.enc_inversion_zonas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_inversion_zonas" ON public.enc_inversion_zonas;
CREATE POLICY "Public read enc_inversion_zonas" ON public.enc_inversion_zonas
  FOR SELECT USING (true);

ALTER TABLE public.enc_inversion_factores_zona ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_inversion_factores_zona" ON public.enc_inversion_factores_zona;
CREATE POLICY "Public read enc_inversion_factores_zona" ON public.enc_inversion_factores_zona
  FOR SELECT USING (true);

ALTER TABLE public.enc_inversion_amenidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_inversion_amenidades" ON public.enc_inversion_amenidades;
CREATE POLICY "Public read enc_inversion_amenidades" ON public.enc_inversion_amenidades
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_aspectos_decision ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_aspectos_decision" ON public.enc_vivienda_aspectos_decision;
CREATE POLICY "Public read enc_vivienda_aspectos_decision" ON public.enc_vivienda_aspectos_decision
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_factores_zona ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_factores_zona" ON public.enc_vivienda_factores_zona;
CREATE POLICY "Public read enc_vivienda_factores_zona" ON public.enc_vivienda_factores_zona
  FOR SELECT USING (true);

ALTER TABLE public.enc_vivienda_casa_aspectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enc_vivienda_casa_aspectos" ON public.enc_vivienda_casa_aspectos;
CREATE POLICY "Public read enc_vivienda_casa_aspectos" ON public.enc_vivienda_casa_aspectos
  FOR SELECT USING (true);

-- ── CAPÍTULO 5.1 E INDICADORES MACRO: CICLO INMOBILIARIO (4 TABLAS) ──

ALTER TABLE public.ind_alquileres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_alquileres" ON public.ind_alquileres;
CREATE POLICY "Public read ind_alquileres" ON public.ind_alquileres
  FOR SELECT USING (true);

ALTER TABLE public.ind_oferta_inmuebles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_oferta_inmuebles" ON public.ind_oferta_inmuebles;
CREATE POLICY "Public read ind_oferta_inmuebles" ON public.ind_oferta_inmuebles
  FOR SELECT USING (true);

ALTER TABLE public.ind_ipc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_ipc" ON public.ind_ipc;
CREATE POLICY "Public read ind_ipc" ON public.ind_ipc
  FOR SELECT USING (true);

ALTER TABLE public.ind_precios_latam ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ind_precios_latam" ON public.ind_precios_latam;
CREATE POLICY "Public read ind_precios_latam" ON public.ind_precios_latam
  FOR SELECT USING (true);

-- Verificar que las políticas están activas en las 41 tablas:
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
