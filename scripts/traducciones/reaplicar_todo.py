# -*- coding: utf-8 -*-
"""Re-aplica las traducciones a los 7 idiomas de las 12 vistas propias de
mi_sitio_web. Correr esto SIEMPRE después de:

  - `button_immediate_upgrade` sobre el módulo (única forma de aplicar
    cambios de vistas/XML) -- resetea `arch_db` de estas vistas al
    contenido en español, igual que instalar un idioma nuevo. Es la
    causa real de los "se rompió la traducción" que aparecieron varias
    veces en este proyecto (ver DOCS/06-idiomas.md, Gotcha #3).
  - instalar un idioma nuevo vía `base.language.install`.
  - cualquier situación en la que `/en/...`, `/it/...`, etc. muestren
    texto en español donde debería estar traducido.

Uso (desde la raíz del repo, con el contenedor odoo levantado):

    python scripts/traducciones/reaplicar_todo.py

Verificar después con curl, por ejemplo:

    curl -s http://localhost:8069/it/mi-sitio | grep -o '<title>[^<]*</title>'

Si se agrega contenido nuevo a una de estas vistas, sumar sus términos
al script `v_<id>_<nombre>.py` correspondiente (o crear uno nuevo para
una vista nueva y agregarlo a SCRIPTS más abajo) -- no hace falta
retraducir todo, `bulk_translate` es idempotente por término.
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

SCRIPTS = [
    'v_1318_home.py',
    'v_1318_home_extra.py',
    'v_1439_header.py',
    'v_1440_footer.py',
    'v_1442_categoria.py',
    'v_1443_producto.py',
    'v_1444_calidad.py',
    'v_1445_historia.py',
    'v_1446_compromiso.py',
    'v_1450_404.py',
    'v_2238_pedido.py',
    'v_2245_consultar.py',
    'v_2445_postulacion.py',
]

failed = []
for name in SCRIPTS:
    print(f'=== {name} ===')
    r = subprocess.run([sys.executable, str(HERE / name)])
    if r.returncode != 0:
        failed.append(name)

if failed:
    print('\n!! Fallaron:', ', '.join(failed))
    sys.exit(1)
print('\nListo -- las 12 vistas reescritas en los 7 idiomas.')
