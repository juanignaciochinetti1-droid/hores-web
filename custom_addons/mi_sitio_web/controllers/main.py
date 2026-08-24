from odoo import http
from odoo.http import request

# ---------------------------------------------------------------------------
# Contenido de ejemplo para /historia — NO son datos reales confirmados de
# HORES Cartotécnica. Reemplazar por la información verificada de la empresa
# antes de que la página se considere definitiva. Se dejan acá arriba, como
# constantes simples, para que actualizarlos sea un cambio de una línea.
# ---------------------------------------------------------------------------
HISTORIA_STATS = [
    {'icon': '📅', 'value': '+40', 'label': 'años de experiencia'},
    {'icon': '📦', 'value': '+500', 'label': 'moldes por año'},
    {'icon': '🤝', 'value': '+150', 'label': 'clientes'},
    {'icon': '🌎', 'value': '6', 'label': 'países'},
]

HISTORIA_TIMELINE = [
    {'year': '1985', 'title': 'Fundación', 'text': 'Inicio de la planta en Bell Ville, Córdoba, fabricando los primeros moldes de papel.'},
    {'year': '1993', 'title': 'Primeras exportaciones', 'text': 'Comienza la comercialización hacia países vecinos de la región.'},
    {'year': '2001', 'title': 'Ampliación de planta', 'text': 'Incorporación de una nueva línea de producción para sostener la demanda.'},
    {'year': '2009', 'title': 'Gestión de calidad', 'text': 'Primeros pasos hacia un sistema de gestión de inocuidad alimentaria certificado.'},
    {'year': '2016', 'title': 'Nuevas líneas de producto', 'text': 'Ampliación del catálogo con nuevos formatos y tamaños de molde.'},
    {'year': '2021', 'title': 'Certificación ISO 22000:2018', 'text': 'Se certifica el sistema de gestión de inocuidad de los alimentos.'},
    {'year': '2025', 'title': 'Actualidad', 'text': 'Presencia consolidada en el mercado regional, con más de 40 años de trayectoria.'},
]

HISTORIA_MISION_VISION = [
    {'icon': '🎯', 'title': 'Misión', 'text': 'Fabricar moldes de papel de calidad para la industria alimentaria, acompañando a cada cliente con soluciones a medida.'},
    {'icon': '👁️', 'title': 'Visión', 'text': 'Ser una referencia regional en moldes de papel para panificación, innovando de forma sustentable.'},
]

HISTORIA_VALORES = [
    {'icon': '🎯', 'title': 'Precisión', 'text': 'Medidas exactas y consistentes en cada lote de producción.'},
    {'icon': '🤝', 'title': 'Compromiso', 'text': 'Con la calidad del producto y con cada cliente.'},
    {'icon': '⚡', 'title': 'Agilidad', 'text': 'Procesos ágiles para responder a tiempo a cada pedido.'},
    {'icon': '💬', 'title': 'Cercanía', 'text': 'Trato directo y personalizado con cada cliente.'},
    {'icon': '📈', 'title': 'Mejora continua', 'text': 'Revisamos y optimizamos procesos de forma constante.'},
    {'icon': '✓', 'title': 'Calidad', 'text': 'Gestión de inocuidad certificada ISO 22000:2018.'},
]

# Distribución de ejemplo por línea de producto (categorías reales del
# catálogo) — reemplaza el desglose por industria del prototipo original,
# que mencionaba sectores (farmacéutico, cosmética) que HORES no fabrica.
HISTORIA_SECTORES = [
    {'label': 'Pan Dulce', 'pct': 35},
    {'label': 'Budín', 'pct': 25},
    {'label': 'Rosca / Bizcochuelo', 'pct': 25},
    {'label': 'Pan de Pascua', 'pct': 15},
]
HISTORIA_SECTORES_BULLETS = [
    'Moldes aptos para contacto directo con alimentos',
    'Producción bajo gestión de inocuidad certificada ISO 22000:2018',
    'Formatos estándar y a medida según especificación del cliente',
    'Impresión personalizada disponible',
    'Logística coordinada según destino y volumen',
]

# Clientes anonimizados a propósito: sin verificar relaciones comerciales
# reales, no se publican nombres de marcas reconocidas como clientes.
HISTORIA_CLIENTES = [
    {'iniciales': 'A1', 'nombre': 'Panificadora Regional', 'sector': 'Alimenticio'},
    {'iniciales': 'B2', 'nombre': 'Grupo Industrial del Centro', 'sector': 'Alimenticio'},
    {'iniciales': 'C3', 'nombre': 'Distribuidora Mayorista SA', 'sector': 'Distribución'},
    {'iniciales': 'D4', 'nombre': 'Cadena de Panaderías del Sur', 'sector': 'Alimenticio'},
    {'iniciales': 'E5', 'nombre': 'Fábrica de Repostería Norte', 'sector': 'Alimenticio'},
    {'iniciales': 'F6', 'nombre': 'Supermercados Regionales', 'sector': 'Retail'},
    {'iniciales': 'G7', 'nombre': 'Cooperativa Panadera', 'sector': 'Alimenticio'},
    {'iniciales': 'H8', 'nombre': 'Envasadora del Litoral', 'sector': 'Alimenticio'},
    {'iniciales': 'I9', 'nombre': 'Distribuidora Andina', 'sector': 'Distribución'},
    {'iniciales': 'J1', 'nombre': 'Panificados Premium', 'sector': 'Alimenticio'},
    {'iniciales': 'K2', 'nombre': 'Retail Gourmet', 'sector': 'Retail'},
    {'iniciales': 'L3', 'nombre': 'Fábrica de Postres del Este', 'sector': 'Alimenticio'},
]

HISTORIA_PAISES = [
    {'codigo': 'ar', 'nombre': 'Argentina', 'etiqueta': 'mercado principal'},
    {'codigo': 'bo', 'nombre': 'Bolivia', 'etiqueta': 'exportación'},
    {'codigo': 'cl', 'nombre': 'Chile', 'etiqueta': 'exportación'},
    {'codigo': 'co', 'nombre': 'Colombia', 'etiqueta': 'exportación'},
    {'codigo': 'ec', 'nombre': 'Ecuador', 'etiqueta': 'exportación'},
    {'codigo': 'uy', 'nombre': 'Uruguay', 'etiqueta': 'exportación'},
    {'codigo': 'mx', 'nombre': 'México', 'etiqueta': 'exportación'},
    {'codigo': 'py', 'nombre': 'Paraguay', 'etiqueta': 'exportación'},
]

HISTORIA_OBJETIVOS = [
    {'icon': '🚀', 'title': 'Expansión regional', 'text': 'Ampliar la presencia comercial en nuevos mercados de la región.'},
    {'icon': '🏭', 'title': 'Nueva planta', 'text': 'Evaluar la incorporación de capacidad productiva adicional.'},
    {'icon': '⚙️', 'title': 'Industria 4.0', 'text': 'Incorporar tecnología para optimizar procesos productivos.'},
    {'icon': '🌱', 'title': 'Certificación ISO 14001', 'text': 'Avanzar en la gestión ambiental de nuestros procesos.'},
]


class MiSitioWeb(http.Controller):

    @http.route('/mi-sitio', type='http', auth='public', website=True, sitemap=True)
    def home(self, contacto_error=None, **kwargs):
        productos = request.env['mi_sitio_web.producto'].sudo().search([
            ('is_published', '=', True),
        ], order='sequence')

        # Slideshow del hero: la foto de la fábrica + una foto por producto
        # publicado. Cada foto queda quieta 5s y desliza a la siguiente.
        # Se duplica la primera foto al final de la tira para que el loop
        # sea invisible: nunca "vuelve" al inicio, sigue siempre para el
        # mismo lado.
        hold_seconds = 5
        transition_seconds = 0.8
        step_seconds = hold_seconds + transition_seconds
        slides_count = len(productos) + 1  # +1 por la foto de la fábrica
        track_images_count = slides_count + 1  # + la foto duplicada al final
        total_seconds = slides_count * step_seconds

        hero_slides = [{
            'start_pct': round(i * step_seconds / total_seconds * 100, 4),
            'hold_end_pct': round((i * step_seconds + hold_seconds) / total_seconds * 100, 4),
            'shift_pct': round(i / track_images_count * 100, 4),
        } for i in range(slides_count)]

        return request.render('mi_sitio_web.home_template', {
            'productos': productos,
            'contacto_error': bool(contacto_error),
            'hero_slides': hero_slides,
            'hero_total_seconds': total_seconds,
            'hero_img_width_pct': round(100.0 / track_images_count, 4),
            'hero_track_width_pct': track_images_count * 100,
            'hero_shift_pct': round(slides_count / track_images_count * 100, 4),
        })

    @http.route('/compras', type='http', auth='public', website=True, sitemap=True)
    def compras(self, **kwargs):
        categorias = request.env['mi_sitio_web.categoria'].sudo().search([], order='sequence')
        productos = request.env['mi_sitio_web.producto'].sudo().search([
            ('is_published', '=', True),
        ], order='sequence')
        return request.render('mi_sitio_web.compras_template', {
            'categorias': categorias,
            'productos': productos,
        })

    @http.route('/categoria/<string:slug>', type='http', auth='public', website=True, sitemap=True)
    def categoria(self, slug, **kwargs):
        categoria = request.env['mi_sitio_web.categoria'].sudo().search([('slug', '=', slug)], limit=1)
        if not categoria:
            return request.not_found()
        productos = categoria.producto_ids.filtered('is_published')
        return request.render('mi_sitio_web.categoria_template', {
            'categoria': categoria,
            'productos': productos,
        })

    @http.route('/producto/<int:producto_id>', type='http', auth='public', website=True, sitemap=True)
    def producto_detalle(self, producto_id, **kwargs):
        producto = request.env['mi_sitio_web.producto'].sudo().browse(producto_id)
        if not producto.exists() or not producto.is_published:
            return request.not_found()
        return request.render('mi_sitio_web.producto_detalle_template', {
            'producto': producto,
        })

    @http.route('/calidad', type='http', auth='public', website=True, sitemap=True)
    def calidad(self, **kwargs):
        return request.render('mi_sitio_web.calidad_template', {})

    @http.route('/compromiso', type='http', auth='public', website=True, sitemap=True)
    def compromiso(self, **kwargs):
        return request.render('mi_sitio_web.compromiso_template', {})

    @http.route('/historia', type='http', auth='public', website=True, sitemap=True)
    def historia(self, **kwargs):
        return request.render('mi_sitio_web.historia_template', {
            'stats': HISTORIA_STATS,
            'timeline': HISTORIA_TIMELINE,
            'mision_vision': HISTORIA_MISION_VISION,
            'valores': HISTORIA_VALORES,
            'sectores': HISTORIA_SECTORES,
            'sectores_bullets': HISTORIA_SECTORES_BULLETS,
            'clientes': HISTORIA_CLIENTES,
            'paises': HISTORIA_PAISES,
            'objetivos': HISTORIA_OBJETIVOS,
        })

    @http.route('/mi-sitio/contacto', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def contacto(self, **post):
        nombre = (post.get('nombre') or '').strip()
        empresa = (post.get('empresa') or '').strip()
        email = (post.get('email') or '').strip()
        mensaje = (post.get('mensaje') or '').strip()

        # Validación server-side: el atributo required del HTML no protege
        # contra un POST directo (curl, bot) con campos vacíos.
        if not nombre or not email or not mensaje:
            return request.redirect('/mi-sitio?contacto_error=1#contacto')

        medium = request.env.ref('utm.utm_medium_website', raise_if_not_found=False)

        request.env['crm.lead'].sudo().create({
            'name': 'Consulta web: %s' % nombre,
            'contact_name': nombre,
            'partner_name': empresa,
            'email_from': email,
            'description': mensaje,
            'medium_id': medium.id if medium else False,
        })

        # Patrón Post/Redirect/Get: si el visitante refresca la página de
        # agradecimiento, el navegador repite el GET en vez de reenviar el
        # formulario y duplicar el Lead.
        return request.redirect('/mi-sitio/gracias')

    @http.route('/mi-sitio/gracias', type='http', auth='public', website=True)
    def contacto_gracias(self, **kwargs):
        return request.render('mi_sitio_web.contacto_gracias_template', {})
