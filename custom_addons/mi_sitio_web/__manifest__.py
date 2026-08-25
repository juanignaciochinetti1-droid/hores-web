{
    'name': 'Mi Sitio Web',
    'version': '19.0.1.0.0',
    'summary': 'Módulo personalizado para el proyecto de página web',
    'description': """
        Módulo base para extender/personalizar el sitio web con Odoo.
        Incluye catálogo de productos propio y formulario de contacto
        conectado al CRM.
    """,
    'author': 'Juan Chinetti',
    'category': 'Website',
    'depends': ['website', 'crm'],
    'data': [
        'security/ir.model.access.csv',
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
