{
    'name': 'Mi Sitio Web',
    'version': '19.0.1.0.0',
    'summary': 'Módulo personalizado para el proyecto de página web',
    'description': """
        Módulo base para extender/personalizar el sitio web con Odoo.
        Incluye catálogo de productos propio, formulario de contacto
        conectado al CRM y carrito de compras conectado a eCommerce.
    """,
    'author': 'Juan Chinetti',
    'category': 'Website',
    # 'sale': base de Ventas. 'website_sale': eCommerce (carrito/checkout)
    # — ver DOCS/07-pedidos.md. 'payment_custom': trae el proveedor de pago
    # "Transferencia bancaria", para poder cerrar el checkout sin contratar
    # un medio de pago online todavía.
    'depends': ['website', 'crm', 'sale', 'website_sale', 'payment_custom'],
    'data': [
        'security/ir.model.access.csv',
        'views/producto_views.xml',
        'views/website_templates.xml',
        'views/catalogo_templates.xml',
        'views/seo_templates.xml',
        'views/error_templates.xml',
        'views/footer_override_templates.xml',
        'views/ecommerce_theme_templates.xml',
        'views/pedido_gestion_templates.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
