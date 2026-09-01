"""
Helper para traducir el contenido de una vista (ir.ui.view.arch_db) a los
idiomas activos del sitio, vía XML-RPC.

CLAVE DEL FIX (02/09/2026, ver DOCS/06-idiomas.md, gotcha #1d):
`update_field_translations` sin `source_lang` explícito asume que las
claves del diccionario que se le pasa están en INGLÉS (`source_lang`
default = 'en_US', ver la docstring del método en odoo/orm/models.py).
Como el contenido real de este sitio está en español, hay que pasar
`source_lang='es_AR'` SIEMPRE -- así se puede usar el texto real en
español como clave, para cualquier idioma, en cualquier orden, sin la
cadena frágil de 3 pasos (es_AR identidad, en_US con clave ES, resto
con clave EN) que se usó por error durante buena parte del proyecto.

Uso como librería (no tiene entry point de línea de comandos, se
importa desde un script puntual armado para la vista que se esté
traduciendo en el momento):

    import sys
    sys.path.insert(0, 'scripts')
    from traducir_vista import bulk_translate, dump_terms, call

    dump_terms(1318)  # ver el estado actual antes de traducir
    bulk_translate(1318, [
        ("Hola", "Hola", "Hello", "Olá", "Ciao", "Bonjour", "Hallo", "你好"),
        # (clave_es, es, en, pt, it, fr, de, zh) -- clave_es tiene que ser
        # el texto EXACTO que devuelve get_field_translations como
        # `source` en es_AR (puede incluir markup HTML si el término está
        # envuelto, ej. un <span>...</span> entero).
    ])

Antes de instalar un idioma nuevo, leer el gotcha #3 en
DOCS/06-idiomas.md -- el asistente estándar de Odoo para instalar
idiomas rompe TODAS las traducciones ya existentes en el sitio (no
solo las del idioma que se instala), y hay que re-traducir todo.
"""
import os
import xmlrpc.client
from pathlib import Path


def load_env(path):
    env = {}
    if path.exists():
        for line in path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            env[key.strip()] = value.strip()
    return env


ENV = {**load_env(Path(__file__).resolve().parent.parent / '.env'), **os.environ}
ODOO_URL = ENV.get('ODOO_URL', 'http://localhost:8069')
ODOO_DB = ENV.get('ODOO_DB')
ODOO_LOGIN = ENV.get('ODOO_LOGIN')
ODOO_API_KEY = ENV.get('ODOO_API_KEY')

if not all([ODOO_DB, ODOO_LOGIN, ODOO_API_KEY]):
    raise SystemExit(
        "Faltan credenciales: definí ODOO_DB, ODOO_LOGIN y ODOO_API_KEY en el "
        "archivo .env de la raíz del proyecto."
    )

_common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
_uid = _common.authenticate(ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {})
_models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

# Idiomas activos del sitio (ver DOCS/06-idiomas.md) -- actualizar acá si
# se suma o saca alguno.
LANGS = ['es_AR', 'en_US', 'pt_BR', 'it_IT', 'fr_FR', 'de_DE', 'zh_CN']


def call(model, method, args=None, kwargs=None):
    return _models.execute_kw(ODOO_DB, _uid, ODOO_API_KEY, model, method, args or [], kwargs or {})


def bulk_translate(view_id, rows):
    """rows: lista de tuplas (clave_es, es, en, pt, it, fr, de, zh) -- una
    por cada término a traducir, en el mismo orden que LANGS (clave_es +
    7 idiomas = 8 elementos por tupla). `clave_es` es el texto EXACTO tal
    como lo devuelve get_field_translations como `source` en es_AR."""
    for i, lang in enumerate(LANGS, start=1):
        mapping = {row[0]: row[i] for row in rows}
        r = call('ir.ui.view', 'update_field_translations',
                 [[view_id], 'arch_db', {lang: mapping}, 'es_AR'])
        if not r:
            print('  !! FALLO', lang, 'en view', view_id)
    print('view', view_id, 'ok', len(rows), 'terminos x', len(LANGS), 'idiomas')


def dump_terms(view_id):
    """Devuelve {source_es: {lang: value}} -- el estado actual de todos
    los términos traducibles de una vista, para revisar antes de
    traducir (qué ya está, qué falta, cuál es el texto exacto a usar
    como clave)."""
    res = call('ir.ui.view', 'get_field_translations', [[view_id], 'arch_db'])
    by_term = {}
    for t in res[0]:
        by_term.setdefault(t['source'], {})[t['lang']] = t['value']
    return by_term


def view_id_by_key(key):
    """Busca el id de una vista por su external id/key completo, ej.
    'mi_sitio_web.home_template'."""
    ids = call('ir.ui.view', 'search', [[('key', '=', key)]])
    return ids[0] if ids else None
