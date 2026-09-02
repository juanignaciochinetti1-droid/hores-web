# -*- coding: utf-8 -*-
"""Helper compartido para reconstruir/agregar traducciones.

CLAVE DEL FIX (02/09/2026): `update_field_translations` sin
`source_lang` explícito asume que las claves del diccionario están en
INGLÉS (`source_lang` default = 'en_US', ver la docstring del método
en odoo/orm/models.py). Como el contenido real del sitio está en
español, hay que pasar `source_lang='es_AR'` SIEMPRE -- así se puede
usar el texto real en español como clave, para cualquier idioma, sin
la cadena frágil de 3 pasos (es_AR identidad, en_US con clave ES,
resto con clave EN) que se venía usando antes por error.

Se ejecuta con cwd = raíz del repo (`.env` se busca ahí relativo).
Los scripts `v_*.py` de esta misma carpeta lo importan sin necesidad
de sys.path.insert -- Python agrega automáticamente el directorio del
script que se está corriendo a sys.path.

Ver DOCS/06-idiomas.md, especialmente el gotcha de que
`button_immediate_upgrade` (la única forma de aplicar cambios de
vistas/XML) resetea `arch_db` igual que instalar un idioma nuevo --
después de CUALQUIER upgrade del módulo hay que volver a correr
`python scripts/traducciones/reaplicar_todo.py` desde la raíz del
repo.
"""
import os, xmlrpc.client
from pathlib import Path

def load_env(path):
    env = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, _, v = line.partition('=')
        env[k.strip()] = v.strip()
    return env

ENV = load_env(Path('.env'))
URL = ENV['ODOO_URL']; DB = ENV['ODOO_DB']; LOGIN = ENV['ODOO_LOGIN']; KEY = ENV['ODOO_API_KEY']
common = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/common')
uid = common.authenticate(DB, LOGIN, KEY, {})
models = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/object')


def call(model, method, args=None, kwargs=None):
    return models.execute_kw(DB, uid, KEY, model, method, args or [], kwargs or {})


LANGS = ['es_AR', 'en_US', 'pt_BR', 'it_IT', 'fr_FR', 'de_DE', 'zh_CN']


def bulk_translate(view_id, rows):
    """rows: lista de tuplas (clave_es, es, en, pt, it, fr, de, zh).
    `clave_es` es el texto EXACTO tal como lo devuelve
    get_field_translations como `source` en es_AR (puede incluir markup
    HTML si el término está envuelto, ej. un <span>...</span> entero)."""
    for i, lang in enumerate(LANGS, start=1):
        mapping = {row[0]: row[i] for row in rows}
        r = call('ir.ui.view', 'update_field_translations',
                 [[view_id], 'arch_db', {lang: mapping}, 'es_AR'])
        if not r:
            print('  !! FALLO', lang, 'en view', view_id)
    print('view', view_id, 'ok', len(rows), 'terminos x', len(LANGS), 'idiomas')


def dump_terms(view_id):
    """Devuelve {source_es: {lang: value}} para inspeccionar el estado
    actual de una vista antes de traducirla."""
    res = call('ir.ui.view', 'get_field_translations', [[view_id], 'arch_db'])
    by_term = {}
    for t in res[0]:
        by_term.setdefault(t['source'], {})[t['lang']] = t['value']
    return by_term
