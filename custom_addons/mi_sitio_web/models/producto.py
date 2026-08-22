from urllib.parse import quote

from odoo import api, fields, models

WHATSAPP_PHONE = '543537427085'


class MiSitioWebProducto(models.Model):
    _name = 'mi_sitio_web.producto'
    _description = 'Producto del catálogo del sitio web'
    _order = 'sequence, id'
    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Ya existe un producto con ese código.'),
    ]

    name = fields.Char(string='Nombre', required=True)
    code = fields.Char(string='Código')
    category_id = fields.Many2one('mi_sitio_web.categoria', string='Categoría', required=True)
    summary = fields.Char(string='Resumen breve')
    description = fields.Text(string='Descripción completa')
    image = fields.Image(string='Imagen', max_width=1024, max_height=1024)
    is_custom = fields.Boolean(string='Personalizable')
    is_published = fields.Boolean(string='Publicado en el sitio', default=True)
    sequence = fields.Integer(string='Orden', default=10)

    spec_ids = fields.One2many('mi_sitio_web.producto.spec', 'producto_id', string='Especificaciones')
    feature_ids = fields.One2many('mi_sitio_web.producto.feature', 'producto_id', string='Características')
    variante_ids = fields.One2many('mi_sitio_web.producto.variante', 'producto_id', string='Variantes')

    whatsapp_url = fields.Char(string='Link de WhatsApp', compute='_compute_whatsapp_url')

    @api.depends('name', 'code')
    def _compute_whatsapp_url(self):
        for rec in self:
            if rec.name:
                texto = f"Hola, quiero consultar por {rec.name}" + (f" ({rec.code})" if rec.code else "")
            else:
                texto = "Hola, quiero consultar por un producto de HORES Cartotécnica"
            rec.whatsapp_url = f"https://wa.me/{WHATSAPP_PHONE}?text={quote(texto)}"


class MiSitioWebProductoSpec(models.Model):
    _name = 'mi_sitio_web.producto.spec'
    _description = 'Especificación técnica de producto'
    _order = 'sequence, id'

    producto_id = fields.Many2one('mi_sitio_web.producto', required=True, ondelete='cascade')
    label = fields.Char(string='Campo', required=True)
    value = fields.Char(string='Valor', required=True)
    sequence = fields.Integer(default=10)


class MiSitioWebProductoFeature(models.Model):
    _name = 'mi_sitio_web.producto.feature'
    _description = 'Característica destacada de producto'
    _order = 'sequence, id'

    producto_id = fields.Many2one('mi_sitio_web.producto', required=True, ondelete='cascade')
    name = fields.Char(string='Característica', required=True)
    sequence = fields.Integer(default=10)


class MiSitioWebProductoVariante(models.Model):
    _name = 'mi_sitio_web.producto.variante'
    _description = 'Variante de tamaño de producto'
    _order = 'sequence, id'

    producto_id = fields.Many2one('mi_sitio_web.producto', required=True, ondelete='cascade')
    code = fields.Char(string='Código')
    weight = fields.Char(string='Peso / Capacidad')
    dimensions = fields.Char(string='Dimensiones')
    image = fields.Image(string='Imagen', max_width=800, max_height=800)
    sequence = fields.Integer(default=10)
