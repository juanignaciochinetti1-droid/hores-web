import re

from odoo import http
from odoo.http import request

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
NOMBRE_MAX_LEN = 200
MENSAJE_MAX_LEN = 5000
EMPRESA_MAX_LEN = 200
TELEFONO_MAX_LEN = 40
CANTIDAD_MAX = 100000

# ---------------------------------------------------------------------------
# Contenido de ejemplo para /historia — NO son datos reales confirmados de
# HORES Cartotécnica. Reemplazar por la información verificada de la empresa
# antes de que la página se considere definitiva (ver DOCS/04-pendientes...).
#
# Traducido a los 3 idiomas activos del sitio (es_AR/en_US/pt_BR): a
# diferencia del resto del contenido (que vive en vistas QWeb o en campos
# translate=True del modelo), esta página arma su contenido desde
# constantes Python en el controlador, así que necesita su propio
# mecanismo de idioma — ver _historia_data() más abajo, que elige el
# diccionario según request.env.lang. Si se agrega un idioma nuevo al
# sitio, hay que sumar acá su propia entrada o va a caer al fallback en
# español.
# ---------------------------------------------------------------------------

_HISTORIA_ES = {
    'stats': [
        {'icon': '📅', 'value': '+40', 'label': 'años de experiencia'},
        {'icon': '📦', 'value': '+500', 'label': 'moldes por año'},
        {'icon': '🤝', 'value': '+150', 'label': 'clientes'},
        {'icon': '🌎', 'value': '6', 'label': 'países'},
    ],
    'timeline': [
        {'year': '1985', 'title': 'Fundación', 'text': 'Inicio de la planta en Bell Ville, Córdoba, fabricando los primeros moldes de papel.'},
        {'year': '1993', 'title': 'Primeras exportaciones', 'text': 'Comienza la comercialización hacia países vecinos de la región.'},
        {'year': '2001', 'title': 'Ampliación de planta', 'text': 'Incorporación de una nueva línea de producción para sostener la demanda.'},
        {'year': '2009', 'title': 'Gestión de calidad', 'text': 'Primeros pasos hacia un sistema de gestión de inocuidad alimentaria certificado.'},
        {'year': '2016', 'title': 'Nuevas líneas de producto', 'text': 'Ampliación del catálogo con nuevos formatos y tamaños de molde.'},
        {'year': '2021', 'title': 'Certificación ISO 22000:2018', 'text': 'Se certifica el sistema de gestión de inocuidad de los alimentos.'},
        {'year': '2025', 'title': 'Actualidad', 'text': 'Presencia consolidada en el mercado regional, con más de 40 años de trayectoria.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Misión', 'text': 'Fabricar moldes de papel de calidad para la industria alimentaria, acompañando a cada cliente con soluciones a medida.'},
        {'icon': '👁️', 'title': 'Visión', 'text': 'Ser una referencia regional en moldes de papel para panificación, innovando de forma sustentable.'},
    ],
    'valores': [
        {'icon': '🎯', 'title': 'Precisión', 'text': 'Medidas exactas y consistentes en cada lote de producción.'},
        {'icon': '🤝', 'title': 'Compromiso', 'text': 'Con la calidad del producto y con cada cliente.'},
        {'icon': '⚡', 'title': 'Agilidad', 'text': 'Procesos ágiles para responder a tiempo a cada pedido.'},
        {'icon': '💬', 'title': 'Cercanía', 'text': 'Trato directo y personalizado con cada cliente.'},
        {'icon': '📈', 'title': 'Mejora continua', 'text': 'Revisamos y optimizamos procesos de forma constante.'},
        {'icon': '✓', 'title': 'Calidad', 'text': 'Gestión de inocuidad certificada ISO 22000:2018.'},
    ],
    # Distribución de ejemplo por línea de producto (categorías reales del
    # catálogo) — reemplaza el desglose por industria del prototipo
    # original, que mencionaba sectores que HORES no fabrica.
    'sectores': [
        {'label': 'Pan Dulce', 'pct': 35},
        {'label': 'Budín', 'pct': 25},
        {'label': 'Rosca / Bizcochuelo', 'pct': 25},
        {'label': 'Pan de Pascua', 'pct': 15},
    ],
    'sectores_bullets': [
        'Moldes aptos para contacto directo con alimentos',
        'Producción bajo gestión de inocuidad certificada ISO 22000:2018',
        'Formatos estándar y a medida según especificación del cliente',
        'Impresión personalizada disponible',
        'Logística coordinada según destino y volumen',
    ],
    # Clientes anonimizados a propósito: sin verificar relaciones
    # comerciales reales, no se publican nombres de marcas reconocidas.
    'clientes': [
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
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': 'Argentina', 'etiqueta': 'mercado principal'},
        {'codigo': 'bo', 'nombre': 'Bolivia', 'etiqueta': 'exportación'},
        {'codigo': 'cl', 'nombre': 'Chile', 'etiqueta': 'exportación'},
        {'codigo': 'co', 'nombre': 'Colombia', 'etiqueta': 'exportación'},
        {'codigo': 'ec', 'nombre': 'Ecuador', 'etiqueta': 'exportación'},
        {'codigo': 'uy', 'nombre': 'Uruguay', 'etiqueta': 'exportación'},
        {'codigo': 'mx', 'nombre': 'México', 'etiqueta': 'exportación'},
        {'codigo': 'py', 'nombre': 'Paraguay', 'etiqueta': 'exportación'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': 'Expansión regional', 'text': 'Ampliar la presencia comercial en nuevos mercados de la región.'},
        {'icon': '🏭', 'title': 'Nueva planta', 'text': 'Evaluar la incorporación de capacidad productiva adicional.'},
        {'icon': '⚙️', 'title': 'Industria 4.0', 'text': 'Incorporar tecnología para optimizar procesos productivos.'},
        {'icon': '🌱', 'title': 'Certificación ISO 14001', 'text': 'Avanzar en la gestión ambiental de nuestros procesos.'},
    ],
}

_HISTORIA_EN = {
    'stats': [
        {'icon': '📅', 'value': '+40', 'label': 'years of experience'},
        {'icon': '📦', 'value': '+500', 'label': 'molds per year'},
        {'icon': '🤝', 'value': '+150', 'label': 'clients'},
        {'icon': '🌎', 'value': '6', 'label': 'countries'},
    ],
    'timeline': [
        {'year': '1985', 'title': 'Foundation', 'text': 'The plant began operating in Bell Ville, Córdoba, manufacturing the first paper molds.'},
        {'year': '1993', 'title': 'First exports', 'text': 'We began selling to neighboring countries in the region.'},
        {'year': '2001', 'title': 'Plant expansion', 'text': 'A new production line was added to keep up with demand.'},
        {'year': '2009', 'title': 'Quality management', 'text': 'First steps toward a certified food-safety management system.'},
        {'year': '2016', 'title': 'New product lines', 'text': 'The catalog expanded with new mold formats and sizes.'},
        {'year': '2021', 'title': 'ISO 22000:2018 Certification', 'text': 'Our food-safety management system was certified.'},
        {'year': '2025', 'title': 'Today', 'text': 'A consolidated presence in the regional market, with more than 40 years of history.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Mission', 'text': 'To manufacture quality paper molds for the food industry, supporting each client with tailored solutions.'},
        {'icon': '👁️', 'title': 'Vision', 'text': 'To be a regional benchmark in paper molds for baking, innovating sustainably.'},
    ],
    'valores': [
        {'icon': '🎯', 'title': 'Precision', 'text': 'Exact, consistent measurements in every production batch.'},
        {'icon': '🤝', 'title': 'Commitment', 'text': 'To product quality and to each client.'},
        {'icon': '⚡', 'title': 'Agility', 'text': 'Agile processes to respond to every order on time.'},
        {'icon': '💬', 'title': 'Closeness', 'text': 'Direct, personalized dealings with each client.'},
        {'icon': '📈', 'title': 'Continuous improvement', 'text': 'We constantly review and optimize our processes.'},
        {'icon': '✓', 'title': 'Quality', 'text': 'ISO 22000:2018 certified food-safety management.'},
    ],
    'sectores': [
        {'label': 'Panettone', 'pct': 35},
        {'label': 'Pound Cake', 'pct': 25},
        {'label': 'Ring Cake / Sponge Cake', 'pct': 25},
        {'label': 'Christmas Bread', 'pct': 15},
    ],
    'sectores_bullets': [
        'Molds suitable for direct food contact',
        'Production under ISO 22000:2018 certified food-safety management',
        'Standard and custom formats according to client specification',
        'Custom printing available',
        'Logistics coordinated by destination and volume',
    ],
    'clientes': [
        {'iniciales': 'A1', 'nombre': 'Regional Bakery', 'sector': 'Food'},
        {'iniciales': 'B2', 'nombre': 'Central Industrial Group', 'sector': 'Food'},
        {'iniciales': 'C3', 'nombre': 'Wholesale Distributor SA', 'sector': 'Distribution'},
        {'iniciales': 'D4', 'nombre': 'Southern Bakery Chain', 'sector': 'Food'},
        {'iniciales': 'E5', 'nombre': 'Northern Pastry Factory', 'sector': 'Food'},
        {'iniciales': 'F6', 'nombre': 'Regional Supermarkets', 'sector': 'Retail'},
        {'iniciales': 'G7', 'nombre': 'Bakers Cooperative', 'sector': 'Food'},
        {'iniciales': 'H8', 'nombre': 'Litoral Packaging Co.', 'sector': 'Food'},
        {'iniciales': 'I9', 'nombre': 'Andean Distributor', 'sector': 'Distribution'},
        {'iniciales': 'J1', 'nombre': 'Premium Baked Goods', 'sector': 'Food'},
        {'iniciales': 'K2', 'nombre': 'Gourmet Retail', 'sector': 'Retail'},
        {'iniciales': 'L3', 'nombre': 'Eastern Desserts Factory', 'sector': 'Food'},
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': 'Argentina', 'etiqueta': 'primary market'},
        {'codigo': 'bo', 'nombre': 'Bolivia', 'etiqueta': 'export'},
        {'codigo': 'cl', 'nombre': 'Chile', 'etiqueta': 'export'},
        {'codigo': 'co', 'nombre': 'Colombia', 'etiqueta': 'export'},
        {'codigo': 'ec', 'nombre': 'Ecuador', 'etiqueta': 'export'},
        {'codigo': 'uy', 'nombre': 'Uruguay', 'etiqueta': 'export'},
        {'codigo': 'mx', 'nombre': 'Mexico', 'etiqueta': 'export'},
        {'codigo': 'py', 'nombre': 'Paraguay', 'etiqueta': 'export'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': 'Regional expansion', 'text': 'Expand commercial presence in new markets across the region.'},
        {'icon': '🏭', 'title': 'New plant', 'text': 'Evaluate adding additional production capacity.'},
        {'icon': '⚙️', 'title': 'Industry 4.0', 'text': 'Adopt technology to optimize production processes.'},
        {'icon': '🌱', 'title': 'ISO 14001 Certification', 'text': 'Advance the environmental management of our processes.'},
    ],
}

_HISTORIA_PT = {
    'stats': [
        {'icon': '📅', 'value': '+40', 'label': 'anos de experiência'},
        {'icon': '📦', 'value': '+500', 'label': 'moldes por ano'},
        {'icon': '🤝', 'value': '+150', 'label': 'clientes'},
        {'icon': '🌎', 'value': '6', 'label': 'países'},
    ],
    'timeline': [
        {'year': '1985', 'title': 'Fundação', 'text': 'Início da fábrica em Bell Ville, Córdoba, fabricando os primeiros moldes de papel.'},
        {'year': '1993', 'title': 'Primeiras exportações', 'text': 'Início da comercialização para países vizinhos da região.'},
        {'year': '2001', 'title': 'Ampliação da fábrica', 'text': 'Incorporação de uma nova linha de produção para sustentar a demanda.'},
        {'year': '2009', 'title': 'Gestão de qualidade', 'text': 'Primeiros passos rumo a um sistema de gestão de inocuidade alimentar certificado.'},
        {'year': '2016', 'title': 'Novas linhas de produto', 'text': 'Ampliação do catálogo com novos formatos e tamanhos de molde.'},
        {'year': '2021', 'title': 'Certificação ISO 22000:2018', 'text': 'Certificação do sistema de gestão de inocuidade dos alimentos.'},
        {'year': '2025', 'title': 'Atualidade', 'text': 'Presença consolidada no mercado regional, com mais de 40 anos de trajetória.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Missão', 'text': 'Fabricar moldes de papel de qualidade para a indústria alimentícia, acompanhando cada cliente com soluções sob medida.'},
        {'icon': '👁️', 'title': 'Visão', 'text': 'Ser uma referência regional em moldes de papel para panificação, inovando de forma sustentável.'},
    ],
    'valores': [
        {'icon': '🎯', 'title': 'Precisão', 'text': 'Medidas exatas e consistentes em cada lote de produção.'},
        {'icon': '🤝', 'title': 'Compromisso', 'text': 'Com a qualidade do produto e com cada cliente.'},
        {'icon': '⚡', 'title': 'Agilidade', 'text': 'Processos ágeis para responder a tempo a cada pedido.'},
        {'icon': '💬', 'title': 'Proximidade', 'text': 'Atendimento direto e personalizado com cada cliente.'},
        {'icon': '📈', 'title': 'Melhoria contínua', 'text': 'Revisamos e otimizamos processos de forma constante.'},
        {'icon': '✓', 'title': 'Qualidade', 'text': 'Gestão de inocuidade certificada ISO 22000:2018.'},
    ],
    'sectores': [
        {'label': 'Panetone', 'pct': 35},
        {'label': 'Bolo Inglês', 'pct': 25},
        {'label': 'Rosca / Pão de Ló', 'pct': 25},
        {'label': 'Pão de Natal', 'pct': 15},
    ],
    'sectores_bullets': [
        'Moldes próprios para contato direto com alimentos',
        'Produção sob gestão de inocuidade certificada ISO 22000:2018',
        'Formatos padrão e sob medida conforme especificação do cliente',
        'Impressão personalizada disponível',
        'Logística coordenada conforme destino e volume',
    ],
    'clientes': [
        {'iniciales': 'A1', 'nombre': 'Padaria Regional', 'sector': 'Alimentício'},
        {'iniciales': 'B2', 'nombre': 'Grupo Industrial do Centro', 'sector': 'Alimentício'},
        {'iniciales': 'C3', 'nombre': 'Distribuidora Atacadista SA', 'sector': 'Distribuição'},
        {'iniciales': 'D4', 'nombre': 'Rede de Padarias do Sul', 'sector': 'Alimentício'},
        {'iniciales': 'E5', 'nombre': 'Fábrica de Confeitaria Norte', 'sector': 'Alimentício'},
        {'iniciales': 'F6', 'nombre': 'Supermercados Regionais', 'sector': 'Varejo'},
        {'iniciales': 'G7', 'nombre': 'Cooperativa de Panificação', 'sector': 'Alimentício'},
        {'iniciales': 'H8', 'nombre': 'Envasadora do Litoral', 'sector': 'Alimentício'},
        {'iniciales': 'I9', 'nombre': 'Distribuidora Andina', 'sector': 'Distribuição'},
        {'iniciales': 'J1', 'nombre': 'Panificados Premium', 'sector': 'Alimentício'},
        {'iniciales': 'K2', 'nombre': 'Retail Gourmet', 'sector': 'Varejo'},
        {'iniciales': 'L3', 'nombre': 'Fábrica de Sobremesas do Leste', 'sector': 'Alimentício'},
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': 'Argentina', 'etiqueta': 'mercado principal'},
        {'codigo': 'bo', 'nombre': 'Bolívia', 'etiqueta': 'exportação'},
        {'codigo': 'cl', 'nombre': 'Chile', 'etiqueta': 'exportação'},
        {'codigo': 'co', 'nombre': 'Colômbia', 'etiqueta': 'exportação'},
        {'codigo': 'ec', 'nombre': 'Equador', 'etiqueta': 'exportação'},
        {'codigo': 'uy', 'nombre': 'Uruguai', 'etiqueta': 'exportação'},
        {'codigo': 'mx', 'nombre': 'México', 'etiqueta': 'exportação'},
        {'codigo': 'py', 'nombre': 'Paraguai', 'etiqueta': 'exportação'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': 'Expansão regional', 'text': 'Ampliar a presença comercial em novos mercados da região.'},
        {'icon': '🏭', 'title': 'Nova fábrica', 'text': 'Avaliar a incorporação de capacidade produtiva adicional.'},
        {'icon': '⚙️', 'title': 'Indústria 4.0', 'text': 'Incorporar tecnologia para otimizar processos produtivos.'},
        {'icon': '🌱', 'title': 'Certificação ISO 14001', 'text': 'Avançar na gestão ambiental de nossos processos.'},
    ],
}

HISTORIA_POR_IDIOMA = {'es_AR': _HISTORIA_ES, 'en_US': _HISTORIA_EN, 'pt_BR': _HISTORIA_PT}


def _historia_data(lang):
    """Elige el set de contenido de Historia segun el idioma activo del
    request. Si el idioma no tiene entrada propia (se sumo un idioma nuevo
    al sitio pero no a este diccionario), cae en espanol antes que romper
    la pagina."""
    return HISTORIA_POR_IDIOMA.get(lang, _HISTORIA_ES)


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
            raise request.not_found()
        productos = categoria.producto_ids.filtered('is_published')
        return request.render('mi_sitio_web.categoria_template', {
            'categoria': categoria,
            'productos': productos,
        })

    @http.route('/producto/<int:producto_id>', type='http', auth='public', website=True, sitemap=True)
    def producto_detalle(self, producto_id, pedido_error=None, **kwargs):
        producto = request.env['mi_sitio_web.producto'].sudo().browse(producto_id)
        if not producto.exists() or not producto.is_published:
            raise request.not_found()
        return request.render('mi_sitio_web.producto_detalle_template', {
            'producto': producto,
            'pedido_error': bool(pedido_error),
        })

    @http.route('/calidad', type='http', auth='public', website=True, sitemap=True)
    def calidad(self, **kwargs):
        return request.render('mi_sitio_web.calidad_template', {})

    @http.route('/compromiso', type='http', auth='public', website=True, sitemap=True)
    def compromiso(self, **kwargs):
        return request.render('mi_sitio_web.compromiso_template', {})

    @http.route('/historia', type='http', auth='public', website=True, sitemap=True)
    def historia(self, **kwargs):
        data = _historia_data(request.env.lang)
        return request.render('mi_sitio_web.historia_template', {
            'stats': data['stats'],
            'timeline': data['timeline'],
            'mision_vision': data['mision_vision'],
            'valores': data['valores'],
            'sectores': data['sectores'],
            'sectores_bullets': data['sectores_bullets'],
            'clientes': data['clientes'],
            'paises': data['paises'],
            'objetivos': data['objetivos'],
        })

    @http.route('/mi-sitio/contacto', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def contacto(self, **post):
        nombre = (post.get('nombre') or '').strip()
        empresa = (post.get('empresa') or '').strip()
        email = (post.get('email') or '').strip()
        mensaje = (post.get('mensaje') or '').strip()

        # Honeypot anti-bot: campo oculto por CSS que un usuario real nunca
        # completa, pero que los bots de spam suelen rellenar igual que
        # cualquier otro input. Si viene con algo, fingimos éxito (no le
        # damos pistas al bot) sin crear el Lead.
        if (post.get('sitio_web') or '').strip():
            return request.redirect('/mi-sitio/gracias')

        # Validación server-side: el atributo required/type=email del HTML
        # no protege contra un POST directo (curl, bot) con campos vacíos,
        # mal formados o absurdamente largos.
        if (not nombre or not email or not mensaje
                or not EMAIL_RE.match(email)
                or len(nombre) > NOMBRE_MAX_LEN
                or len(mensaje) > MENSAJE_MAX_LEN):
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

    @http.route('/mi-sitio/pedido', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def pedido(self, **post):
        # "Solicitar pedido": a diferencia del contacto general, esto crea
        # un presupuesto real en Ventas (sale.order), no un Lead de CRM —
        # ver DOCS/07-pedidos.md. No hay carrito ni pago online: cada envío
        # es un pedido de UN producto (con su variante opcional).
        nombre = (post.get('nombre') or '').strip()
        empresa = (post.get('empresa') or '').strip()
        email = (post.get('email') or '').strip()
        telefono = (post.get('telefono') or '').strip()
        mensaje = (post.get('mensaje') or '').strip()

        # Honeypot anti-bot, mismo patrón que el formulario de contacto.
        if (post.get('sitio_web') or '').strip():
            return request.redirect('/mi-sitio/pedido/gracias')

        producto_id_raw = (post.get('producto_id') or '').strip()
        if not producto_id_raw.isdigit():
            raise request.not_found()
        producto = request.env['mi_sitio_web.producto'].sudo().browse(int(producto_id_raw))
        if not producto.exists() or not producto.is_published:
            raise request.not_found()

        # Variante opcional (solo válida si el producto la tiene y le
        # pertenece) — si el producto tiene variantes, elegir una es
        # obligatorio: no tiene sentido un pedido de un tamaño ambiguo.
        variante = request.env['mi_sitio_web.producto.variante'].sudo()
        variante_id_raw = (post.get('variante_id') or '').strip()
        if variante_id_raw:
            if not variante_id_raw.isdigit():
                return request.redirect('/producto/%d?pedido_error=1' % producto.id)
            variante = variante.browse(int(variante_id_raw))
            if not variante.exists() or variante.producto_id.id != producto.id:
                return request.redirect('/producto/%d?pedido_error=1' % producto.id)

        try:
            cantidad = int(post.get('cantidad') or 0)
        except ValueError:
            cantidad = 0

        # Validación server-side, igual que en /mi-sitio/contacto: el HTML
        # (required, type=number/email) no protege contra un POST directo.
        if (not nombre or not email or not EMAIL_RE.match(email)
                or len(nombre) > NOMBRE_MAX_LEN
                or len(empresa) > EMPRESA_MAX_LEN
                or len(telefono) > TELEFONO_MAX_LEN
                or len(mensaje) > MENSAJE_MAX_LEN
                or cantidad <= 0 or cantidad > CANTIDAD_MAX
                or (producto.variante_ids and not variante)):
            return request.redirect('/producto/%d?pedido_error=1' % producto.id)

        partner = request.env['res.partner'].sudo().search([('email', '=', email)], limit=1)
        if not partner:
            partner = request.env['res.partner'].sudo().create({
                'name': nombre,
                'email': email,
                'phone': telefono or False,
            })

        detalle = producto.name
        if variante:
            detalle += ' — %s' % ' / '.join(filter(None, [variante.code, variante.dimensions, variante.weight]))

        notas = []
        if empresa:
            notas.append('Empresa: %s' % empresa)
        if telefono:
            notas.append('Teléfono: %s' % telefono)
        if mensaje:
            notas.append('Mensaje: %s' % mensaje)

        producto_generico = request.env.ref('mi_sitio_web.product_pedido_generico')
        medium = request.env.ref('utm.utm_medium_website', raise_if_not_found=False)

        request.env['sale.order'].sudo().create({
            'partner_id': partner.id,
            'client_order_ref': producto.code or False,
            'medium_id': medium.id if medium else False,
            'note': '\n'.join(notas) if notas else False,
            'order_line': [(0, 0, {
                'product_id': producto_generico.id,
                'name': detalle,
                'product_uom_qty': cantidad,
            })],
        })

        # Patrón Post/Redirect/Get, igual que en /mi-sitio/contacto.
        return request.redirect('/mi-sitio/pedido/gracias')

    @http.route('/mi-sitio/pedido/gracias', type='http', auth='public', website=True)
    def pedido_gracias(self, **kwargs):
        return request.render('mi_sitio_web.pedido_gracias_template', {})
