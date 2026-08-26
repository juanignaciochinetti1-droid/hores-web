{
    'name': 'Mi Sitio Web',
    'version': '19.0.1.0.0',
    'summary': 'Módulo personalizado para el proyecto de página web',
    'description': """
        Módulo base para extender/personalizar el sitio web con Odoo.
        Incluye catálogo de productos propio, formulario de contacto
        conectado al CRM y solicitud de pedidos conectada a Ventas.
    """,
    'author': 'Juan Chinetti',
    'category': 'Website',
    # 'sale': permite crear presupuestos (sale.order) reales desde el
    # formulario de "Solicitar pedido" del sitio — ver DOCS/07-pedidos.md.
    'depends': ['website', 'crm', 'sale'],
    'data': [
        'security/ir.model.access.csv',
        'data/pedido_producto_data.xml',
        'views/producto_views.xml',
        'views/website_templates.xml',
        'views/catalogo_templates.xml',
        'views/seo_templates.xml',
        'views/error_templates.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
