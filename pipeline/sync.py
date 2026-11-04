"""
pipeline/sync.py
=================
Orquestador principal del pipeline ETL (Modelo Diamante).
Coordina el flujo completo: Extract (Sheets) → Transform (Diamond) → Load (Supabase).
"""

import os
import sys
import time
from loguru import logger
from dotenv import load_dotenv

from .config import SHEETS_CONFIG, DIAMOND_TABLES
from .sheets_client import SheetsClient
from .supabase_client import SupabaseLoader
from .transform import DiamondTransformer

def _setup_logging():
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:HH:mm:ss}</green> | <level>{level:<8}</level> | {message}",
        level="INFO",
        colorize=True,
    )

VALID_CITIES = ("SCZ", "LPZ", "CBB")
VALID_TABS = ("datos_margenes", "tipologia_precios", "amenidades")
VALID_MODES = ("incremental", "full")

# Pestaña del Sheet de la que se deriva cada tabla destino. La transformación de
# "tipologia_precios" y "amenidades" descarta las filas cuyo proyecto no salió de
# "datos_margenes" en la misma corrida, por eso esa pestaña siempre se extrae.
TABLE_SOURCE_TAB = {
    "proyectos": "datos_margenes",
    "indicadores_censo": "datos_margenes",
    "condiciones_financieras": "datos_margenes",
    "tipologias": "tipologia_precios",
    "avg_tipologias": "tipologia_precios",
    "amenidades": "amenidades",
}


def read_sync_params(env=None):
    """
    Lee SYNC_CITY, SYNC_TAB y SYNC_MODE (los pasa el workflow de GitHub Actions).
    Devuelve (ciudades, pestaña_o_None, modo). Un valor inválido lanza ValueError:
    es preferible fallar a sincronizar algo distinto de lo pedido.

    - SYNC_CITY: ALL (por defecto) o SCZ / LPZ / CBB.
    - SYNC_TAB: ALL (por defecto) o una pestaña; solo se cargan las tablas que
      derivan de ella (ver TABLE_SOURCE_TAB).
    - SYNC_MODE: "incremental" (por defecto) o "full". El volcado a Supabase es un
      upsert idempotente, así que ambos modos escriben lo mismo; el modo solo se
      registra en el log.
    """
    env = os.environ if env is None else env

    city = (env.get("SYNC_CITY") or "ALL").strip().upper()
    if city == "ALL":
        cities = list(VALID_CITIES)
    elif city in VALID_CITIES:
        cities = [city]
    else:
        raise ValueError(f"SYNC_CITY inválido: {city!r} (válidos: ALL, {', '.join(VALID_CITIES)})")

    tab = (env.get("SYNC_TAB") or "ALL").strip().lower()
    if tab == "all":
        tab = None
    elif tab not in VALID_TABS:
        raise ValueError(f"SYNC_TAB inválido: {tab!r} (válidos: ALL, {', '.join(VALID_TABS)})")

    mode = (env.get("SYNC_MODE") or "incremental").strip().lower()
    if mode not in VALID_MODES:
        raise ValueError(f"SYNC_MODE inválido: {mode!r} (válidos: {', '.join(VALID_MODES)})")

    return cities, tab, mode


def main():
    _setup_logging()
    logger.info("=" * 60)
    logger.info(f"🚀 Intelligence Pipeline (Diamond) — Sync")
    logger.info("=" * 60)

    load_dotenv()

    try:
        sync_cities, sync_tab, sync_mode = read_sync_params()
    except ValueError as e:
        logger.error(str(e))
        sys.exit(1)
    logger.info(
        f"Parámetros: ciudades={','.join(sync_cities)} | "
        f"pestaña={sync_tab or 'ALL'} | modo={sync_mode}"
    )

    # 1. Connect
    try:
        sheets = SheetsClient.from_env()
        loader = SupabaseLoader.from_env()
        transformer = DiamondTransformer()
    except Exception as e:
        logger.error(f"Error inicializando clientes: {e}")
        sys.exit(1)
        
    # 2. Extract
    scz_data = {}
    lpz_data = {}
    cbb_data = {}
    
    cities = {"SCZ": scz_data, "LPZ": lpz_data, "CBB": cbb_data}
    
    # Pestañas a extraer: todas, o la pedida más "datos_margenes" (dependencia).
    tabs_to_fetch = (
        set(VALID_TABS) if sync_tab is None else {"datos_margenes", sync_tab}
    )

    for city, data_dict in cities.items():
        if city not in sync_cities:
            logger.info(f"[{city}] Omitida (SYNC_CITY={','.join(sync_cities)})")
            continue
        conf = SHEETS_CONFIG.get(city)
        if not conf:
            continue

        spreadsheet_id = conf["spreadsheet_id"]
        for tab_key, tab_name in conf["tabs"].items():
            if tab_key not in tabs_to_fetch:
                continue
            logger.info(f"[{city}] Extracting '{tab_name}'...")
            try:
                rows = sheets.fetch_tab(spreadsheet_id, tab_name)
                data_dict[tab_key] = rows
                logger.success(f"[{city}] '{tab_name}': {len(rows)} filas obtenidas")
            except Exception as e:
                logger.error(f"[{city}] Error obteniendo '{tab_name}': {e}")
                data_dict[tab_key] = []
                # Forzar salida si falla la extracción para evitar falsos positivos
                sys.exit(1)
                
    # 3. Transform
    logger.info("Transformando datos al Modelo Diamante...")
    diamond_data = transformer.transform_all(scz_data, lpz_data, cbb_data)
    
    # 4. Load
    logger.info("Cargando a Supabase...")
    
    # Orden de inserción para respetar Foreign Keys
    tables_to_load = [
        ("proyectos", "proyecto_id"),
        ("indicadores_censo", "indicador_censo_id"),
        ("tipologias", "tipologia_id"),
        ("avg_tipologias", "indicador_censo_id,avg_tipologia"),
        ("condiciones_financieras", "condicion_financiera_id"),
        ("amenidades", "amenidad_id"),
    ]
    
    for tab_key, pk_col in tables_to_load:
        if sync_tab is not None and TABLE_SOURCE_TAB[tab_key] != sync_tab:
            continue
        records = diamond_data.get(DIAMOND_TABLES[tab_key], [])
        if not records:
            continue
        try:
            loader.upsert_batch(
                table=DIAMOND_TABLES[tab_key],
                records=records,
                on_conflict=pk_col
            )
        except Exception as e:
            logger.error(f"Error cargando {DIAMOND_TABLES[tab_key]}: {e}")
            sys.exit(1)

    logger.success("✅ Sync completado exitosamente.")

if __name__ == "__main__":
    main()
