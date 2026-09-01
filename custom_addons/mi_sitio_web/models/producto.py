from urllib.parse import quote

from odoo import api, fields, models

WHATSAPP_PHONE = '543537427085'


class MiSitioWebProducto(models.Model):
    _name = 'mi_sitio_web.producto'
    _description = 'Producto del catálogo del sitio web'
    _order = 'sequence, id'
    # '_sql_constraints' quedó deprecado en esta versión de Odoo (y, peor,
    # dejó de aplicarse en la base: verificado creando un duplicado, no lo
    # rechazó). El reemplazo es un atributo models.Constraint por restricción.
    _code_unique = models.Constraint(
        'unique(code)',
        'Ya existe un producto con ese código.',
    )

    # translate=True en name/summary/description: cada idioma activo del
    # sitio guarda su propio texto (code no se traduce, es un identificador).
    name = fields.Char(string='Nombre', required=True, translate=True)
    code = fields.Char(string='Código')
    category_id = fields.Many2one('mi_sitio_web.categoria', string='Categoría', required=True)
    summary = fields.Char(string='Resumen breve', translate=True)
    description = fields.Text(string='Descripción completa', translate=True)
    image = fields.Image(string='Imagen', max_width=1024, max_height=1024)
    is_custom = fields.Boolean(string='Personalizable')
    is_published = fields.Boolean(string='Publicado en el sitio', default=True)
    sequence = fields.Integer(string='Orden', default=10)

    # Estado de disponibilidad manual: lo carga el equipo a mano en el
    # backend (no hay integración con Inventario/stock real). El sitio lo
    # usa para el badge de cada producto, y para bloquear "Agregar al
    # carrito" cuando está en 'sin_stock' — ver DOCS/07-pedidos.md.
    disponibilidad = fields.Selection(
        [
            ('disponible', 'Disponible'),
            ('a_pedido', 'A pedido'),
            ('sin_stock', 'Sin stock'),
        ],
        string='Disponibilidad', required=True, default='disponible',
    )

    # Producto real de Odoo (product.product) que representa a este
    # producto del catálogo en el carrito/checkout de eCommerce. Solo se
    # usa cuando el producto NO tiene variante_ids — si las tiene, cada
    # variante de tamaño tiene su propio sale_product_id (ver más abajo),
    # porque cada tamaño puede tener un precio distinto. Se arma con un
    # script de sincronización, no a mano — ver DOCS/07-pedidos.md.
    sale_product_id = fields.Many2one('product.product', string='Producto de venta (Odoo)')

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
                texto = "Hola, quiero consultar por un producto de Cartotécnica Hores"
            rec.whatsapp_url = f"https://wa.me/{WHATSAPP_PHONE}?text={quote(texto)}"


class MiSitioWebProductoSpec(models.Model):
    _name = 'mi_sitio_web.producto.spec'
    _description = 'Especificación técnica de producto'
    _order = 'sequence, id'

    producto_id = fields.Many2one('mi_sitio_web.producto', required=True, ondelete='cascade')
    label = fields.Char(string='Campo', required=True, translate=True)
    value = fields.Char(string='Valor', required=True, translate=True)
    sequence = fields.Integer(default=10)


class MiSitioWebProductoFeature(models.Model):
    _name = 'mi_sitio_web.producto.feature'
    _description = 'Característica destacada de producto'
    _order = 'sequence, id'

    producto_id = fields.Many2one('mi_sitio_web.producto', required=True, ondelete='cascade')
    name = fields.Char(string='Característica', required=True, translate=True)
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

    # Ver mi_sitio_web.producto.sale_product_id — acá es por tamaño, no por
    # producto, porque cada variante puede tener su propio precio de venta.
    sale_product_id = fields.Many2one('product.product', string='Producto de venta (Odoo)')
