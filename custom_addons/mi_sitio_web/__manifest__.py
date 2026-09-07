{
    'name': 'Mi Sitio Web',
    'version': '19.0.1.0.0',
    'summary': 'Módulo personalizado para el proyecto de página web',
    'description': """
        Módulo base para extender/personalizar el sitio web con Odoo.
        Incluye catálogo de productos propio, formulario de contacto
        conectado al CRM y carrito de pedidos conectado a eCommerce.
    """,
    'author': 'Juan Chinetti',
    'category': 'Website',
    # 'sale': base de Ventas. 'website_sale': eCommerce (carrito/checkout)
    # — ver DOCS/07-pedidos.md. 'payment_custom': trae el proveedor de pago
    # "Transferencia bancaria", para poder cerrar el checkout sin contratar
    # un medio de pago online todavía. 'hr_recruitment': app de Selección
    # de Personal — se usa el modelo de postulantes (hr.applicant) para la
    # bolsa de trabajo del sitio (ver postulacion_templates.xml), pero NO
    # se instala 'website_hr_recruitment' (se auto-instala solo con
    # hr_recruitment + website_mail, así que se desinstala aparte): trae su
    # propio /jobs con el header genérico de Odoo sin estilar, pensado para
    # publicar búsquedas activas con kanban propio -- más de lo que se pidió
    # (una sola sección para recibir CVs). Se prefirió una página propia,
    # con el diseño del sitio, en vez de esa (mismo criterio que /shop
    # redirige a la sección de productos de la página principal en vez de
    # usarse tal cual).
    # 'l10n_ar': ya venía instalado (la compañía es de Argentina), pero no
    # estaba declarado como dependencia acá -- se agrega por prolijidad
    # (el controlador de esta app referencia código específico de l10n_ar,
    # como el afip.responsibility.type "Consumidor Final"). OJO: agregarlo
    # NO cambia el orden en que Odoo combina los controladores del
    # checkout (se probó, confirmado imprimiendo type(self).__mro__ en
    # runtime) -- ver el comentario largo junto a
    # WebsiteSaleHores._validate_address_values en controllers/main.py
    # para la explicación completa y la forma correcta de anular campos
    # obligatorios que agregan l10n_ar/l10n_latam_base.
    'depends': ['website', 'crm', 'sale', 'website_sale', 'payment_custom', 'hr_recruitment', 'l10n_ar'],
    'data': [
        'security/ir.model.access.csv',
        'data/hr_job_data.xml',
        'views/producto_views.xml',
        'views/website_templates.xml',
        'views/catalogo_templates.xml',
        'views/seo_templates.xml',
        'views/error_templates.xml',
        'views/footer_override_templates.xml',
        'views/ecommerce_theme_templates.xml',
        'views/pedido_gestion_templates.xml',
        'views/postulacion_templates.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
