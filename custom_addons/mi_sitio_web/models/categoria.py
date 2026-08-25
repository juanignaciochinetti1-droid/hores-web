from odoo import fields, models


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
