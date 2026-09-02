# -*- coding: utf-8 -*-
from odoo import api, models

# Alias viejos de tzdata para Argentina (existían como zonas propias en
# versiones antiguas de la base de husos horarios de IANA; hoy son solo
# symlinks de compatibilidad hacia America/Argentina/<Ciudad>, en el
# archivo "backward" de tzdata). Encontrado el 02/09/2026: al menos dos
# clientes reales (uno de Córdoba, sin relación entre sí) terminaron con
# tz='America/Cordoba' en su ficha -- probablemente porque el navegador/SO
# de cada uno usa una base de datos de husos horarios vieja que todavía
# entiende esos alias. Postgres NO los reconoce (no incluye el archivo
# "backward" de tzdata), así que cualquier query que agrupe por huso
# horario del partner (los dashboards de CRM y Ventas lo hacen) revienta
# con "InvalidParameterValue: time zone ... not recognized" para TODO el
# reporte, no solo para ese registro -- lo reportó un vendedor viendo su
# pipeline (ver WhatsApp del 02/09/2026, error en crm.lead vía
# read_progress_bar).

# Ya se había corregido un registro a mano una vez (ver DOCS o el
# historial de este archivo) y volvió a aparecer con OTRO cliente -- por
# eso el fix pasa a ser automático acá, en vez de ir parcheando de a un
# registro cada vez que alguien se queja.
_TZ_ALIASES_ARGENTINA = {
    'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
    'America/Catamarca': 'America/Argentina/Catamarca',
    'America/Cordoba': 'America/Argentina/Cordoba',
    'America/Jujuy': 'America/Argentina/Jujuy',
    'America/Mendoza': 'America/Argentina/Mendoza',
    'America/Rosario': 'America/Argentina/Cordoba',
}


class ResPartner(models.Model):
    _inherit = 'res.partner'

    def _sanitize_tz_values(self, vals):
        tz = vals.get('tz')
        if tz in _TZ_ALIASES_ARGENTINA:
            vals = dict(vals, tz=_TZ_ALIASES_ARGENTINA[tz])
        return vals

    def write(self, vals):
        return super().write(self._sanitize_tz_values(vals))

    @api.model_create_multi
    def create(self, vals_list):
        vals_list = [self._sanitize_tz_values(vals) for vals in vals_list]
        return super().create(vals_list)
