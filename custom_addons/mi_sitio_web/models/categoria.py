import re

from odoo import api, fields, models
from odoo.exceptions import ValidationError

SLUG_RE = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')


class MiSitioWebCategoria(models.Model):
    _name = 'mi_sitio_web.categoria'
    _description = 'Categoría de producto del sitio web'
    _order = 'sequence, id'
    # '_sql_constraints' quedó deprecado en esta versión de Odoo y dejó de
    # aplicarse en la base (verificado: permitía crear un slug duplicado).
    # Reemplazado por models.Constraint, que sí se aplica.
    _slug_unique = models.Constraint(
        'unique(slug)',
        'Ya existe una categoría con ese slug (se usa en la URL).',
    )

    name = fields.Char(string='Nombre', required=True)
    slug = fields.Char(string='Slug (URL)', required=True)
    sequence = fields.Integer(string='Orden', default=10)
    producto_ids = fields.One2many('mi_sitio_web.producto', 'category_id', string='Productos')

    @api.constrains('slug')
    def _check_slug_format(self):
        # El slug se usa tal cual en la URL pública (/categoria/<slug>): si
        # tiene espacios, mayúsculas o caracteres raros, la URL queda rota
        # o fea. Solo se permite minúsculas, números y guiones medios.
        for rec in self:
            if rec.slug and not SLUG_RE.match(rec.slug):
                raise ValidationError(
                    "El slug '%s' no es válido: solo se permiten minúsculas, "
                    "números y guiones medios (ej: 'pan-dulce'), sin espacios "
                    "ni acentos. Se usa directamente en la URL del sitio." % rec.slug
                )
