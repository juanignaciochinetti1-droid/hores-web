"""
Migra categorías y productos reales desde hores-web/hores.db hacia el
módulo mi_sitio_web de Odoo, vía XML-RPC.

Las credenciales se leen del archivo .env en la raíz del proyecto (nunca
hardcodeadas acá, para poder versionar este script sin exponer secretos).

Uso: python scripts/migrar_catalogo_hores.py
"""
import json
import os
import sqlite3
import xmlrpc.client
from pathlib import Path


def load_env(path):
    """Parser mínimo de .env (KEY=VALUE por línea) sin dependencias externas."""
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

HORES_DB = r"C:\Users\Juan Chinetti\Desktop\hores-web\hores.db"
ODOO_URL = ENV.get('ODOO_URL', 'http://localhost:8069')
ODOO_DB = ENV.get('ODOO_DB')
ODOO_LOGIN = ENV.get('ODOO_LOGIN')
ODOO_API_KEY = ENV.get('ODOO_API_KEY')

if not all([ODOO_DB, ODOO_LOGIN, ODOO_API_KEY]):
    raise SystemExit(
        "Faltan credenciales: definí ODOO_DB, ODOO_LOGIN y ODOO_API_KEY en el "
        "archivo .env de la raíz del proyecto."
    )


def b64_body(data_uri):
    """Extrae solo el contenido base64 de un data URI (o lo devuelve tal cual)."""
    if not data_uri:
        return False
    if data_uri.startswith("data:"):
        return data_uri.split(",", 1)[1]
    return data_uri


def main():
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    uid = common.authenticate(ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {})
    models = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")

    def call(model, method, *args):
        return models.execute_kw(ODOO_DB, uid, ODOO_API_KEY, model, method, list(args))

    conn = sqlite3.connect(HORES_DB)
    conn.text_factory = str
    cur = conn.cursor()

    # 1) Categorías
    cur.execute("SELECT name, slug, sort_order FROM categories ORDER BY sort_order")
    cat_map = {}
    for name, slug, sort_order in cur.fetchall():
        cat_id = call('mi_sitio_web.categoria', 'create', {
            'name': name, 'slug': slug, 'sequence': sort_order,
        })
        cat_map[name] = cat_id
        print(f"Categoría creada: {name} -> id {cat_id}")

    # 2) Productos
    cur.execute("""
        SELECT code, name, category, short_desc, full_desc, image,
               specs, features, variants, sort_order, active
        FROM products ORDER BY sort_order
    """)
    rows = cur.fetchall()
    for code, name, category, short_desc, full_desc, image, specs_json, \
            features_json, variants_json, sort_order, active in rows:
        vals = {
            'name': name,
            'code': code,
            'summary': short_desc,
            'description': full_desc,
            'is_published': bool(active),
            'sequence': sort_order or 10,
        }
        if category in cat_map:
            vals['category_id'] = cat_map[category]
        img = b64_body(image)
        if img:
            vals['image'] = img

        specs = json.loads(specs_json or '[]')
        vals['spec_ids'] = [
            (0, 0, {'label': s['label'], 'value': s['value'], 'sequence': i * 10})
            for i, s in enumerate(specs)
        ]

        features = json.loads(features_json or '[]')
        vals['feature_ids'] = [
            (0, 0, {'name': f, 'sequence': i * 10})
            for i, f in enumerate(features)
        ]

        variants = json.loads(variants_json or '[]')
        variante_lines = []
        for i, v in enumerate(variants):
            line = {
                'code': v.get('code'),
                'weight': v.get('weight'),
                'dimensions': v.get('dimensions'),
                'sequence': i * 10,
            }
            v_img = b64_body(v.get('image'))
            if v_img:
                line['image'] = v_img
            variante_lines.append((0, 0, line))
        vals['variante_ids'] = variante_lines

        prod_id = call('mi_sitio_web.producto', 'create', vals)
        print(f"Producto creado: {name} ({code}) -> id {prod_id} "
              f"[{len(specs)} specs, {len(features)} features, {len(variants)} variantes]")

    conn.close()
    print("\nMigración completa.")


if __name__ == '__main__':
    main()
