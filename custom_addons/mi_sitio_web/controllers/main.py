import hmac
import html
import re

from markupsafe import Markup

from odoo import http
from odoo.http import request

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
NOMBRE_MAX_LEN = 200
MENSAJE_MAX_LEN = 5000

# Estados de sale.order desde los que un cliente puede cancelar/pedir un
# cambio por su cuenta, sin pasar por Ventas primero — ver
# _pedido_gestionable() más abajo.
PEDIDO_ESTADOS_GESTIONABLES = ('draft', 'sent', 'sale')

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
    # Actualizado el 28/08/2026 con datos reales tomados de hores.com.ar/wp
    # (Empresa, Clientes) — 'stats.moldes por año' y 'stats.clientes' NO
    # tienen fuente real (el sitio real no publica esos dos números) y
    # quedan igual que antes. 'años de experiencia' usa el "31 años de
    # operaciones" que el sitio real muestra hoy mismo, en vez de
    # recalcularlo a mano — evita asumir desde qué año exacto cuentan
    # ellos (¿1992, la primera máquina? ¿1999, la constitución de la
    # SRL?). 'países' pasa de 6 a 8 para que coincida con la lista real
    # de 'paises' más abajo (que ya estaba bien, pero el contador no).
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': 'años de experiencia'},
        {'icon': '📦', 'value': '+500', 'label': 'moldes por año'},
        {'icon': '🤝', 'value': '+150', 'label': 'clientes'},
        {'icon': '🌎', 'value': '8', 'label': 'países'},
    ],
    'timeline': [
        {'year': '1992', 'title': 'Primera máquina automática', 'text': 'Gabriel Markarian y Oscar Urbano construyen la primera máquina automática para moldes de pan dulce.'},
        {'year': '1999', 'title': 'Constitución de la SRL', 'text': 'Se constituye formalmente como Cartotécnica Hores SRL.'},
        {'year': '2002', 'title': 'Budín sin Fleje', 'text': 'Se lanza la línea de Budín sin Fleje, con registro de diseño industrial n.° 68.399.'},
        {'year': '2003–2005', 'title': 'Diversificación de líneas', 'text': 'Se suman las líneas de pan dulce, rosca, bizcochuelo, budín y pan de Pascua.'},
        {'year': '2006–2009', 'title': 'Ampliación de planta', 'text': 'La planta en Bell Ville, Córdoba, crece hasta los 5.000 m².'},
        {'year': '2011–2012', 'title': 'Certificación ISO 22000:2005', 'text': 'Se certifica el sistema de gestión de inocuidad, con Bureau Veritas.'},
        {'year': '2015', 'title': 'Nuevo predio', 'text': 'Se adquiere un predio de 4,50 hectáreas para la futura planta.'},
        {'year': '2020', 'title': 'Nueva planta', 'text': 'El 9 de marzo, mudanza a la nueva planta de 12.000 m².'},
        {'year': 'Hoy', 'title': 'Actualidad', 'text': 'Presencia consolidada en el mercado argentino y en el resto de la región, con más de 25 años de trayectoria formal.'},
    ],
    # Texto real, tomado palabra por palabra de hores.com.ar/wp/empresa/.
    'mision_vision': [
        {'icon': '🎯', 'title': 'Misión', 'text': 'Producir y proveer moldes de papel inocuos para la industria de la alimentación, atendiendo las necesidades de los clientes y brindando condiciones para el desarrollo personal.'},
        {'icon': '👁️', 'title': 'Visión', 'text': 'Posicionarse como una de las principales empresas a nivel mundial en producción de moldes de papel para alimentación.'},
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
    # Updated 08/28/2026 with real data from hores.com.ar/wp — see the
    # es_AR block above for the sourcing notes (same numbers/years,
    # translated).
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': 'years of experience'},
        {'icon': '📦', 'value': '+500', 'label': 'molds per year'},
        {'icon': '🤝', 'value': '+150', 'label': 'clients'},
        {'icon': '🌎', 'value': '8', 'label': 'countries'},
    ],
    'timeline': [
        {'year': '1992', 'title': 'First automatic machine', 'text': 'Gabriel Markarian and Oscar Urbano build the first automatic machine for panettone molds.'},
        {'year': '1999', 'title': 'Company incorporated', 'text': 'Formally incorporated as Cartotécnica Hores SRL.'},
        {'year': '2002', 'title': 'Strapless pound cake mold', 'text': 'Launch of the strapless pound cake line, with industrial design registration No. 68.399.'},
        {'year': '2003–2005', 'title': 'Product line diversification', 'text': 'The panettone, ring cake, sponge cake, pound cake and Christmas bread lines are added.'},
        {'year': '2006–2009', 'title': 'Plant expansion', 'text': 'The plant in Bell Ville, Córdoba, grows to 5,000 m².'},
        {'year': '2011–2012', 'title': 'ISO 22000:2005 certification', 'text': 'Our food-safety management system is certified, with Bureau Veritas.'},
        {'year': '2015', 'title': 'New site acquired', 'text': 'A 4.50-hectare site is acquired for the future plant.'},
        {'year': '2020', 'title': 'New plant', 'text': 'On March 9, the company moves into the new 12,000 m² plant.'},
        {'year': 'Today', 'title': 'Today', 'text': 'A consolidated presence in the Argentine market and across the region, with more than 25 years of formal history.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Mission', 'text': 'To produce and provide safe paper molds for the food industry, meeting the needs of our clients and providing the conditions for personal growth.'},
        {'icon': '👁️', 'title': 'Vision', 'text': 'To become one of the leading companies worldwide in the production of paper molds for the food industry.'},
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
    # Atualizado em 28/08/2026 com dados reais de hores.com.ar/wp — ver
    # as notas de fonte no bloco es_AR acima (mesmos números/anos,
    # traduzidos).
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': 'anos de experiência'},
        {'icon': '📦', 'value': '+500', 'label': 'moldes por ano'},
        {'icon': '🤝', 'value': '+150', 'label': 'clientes'},
        {'icon': '🌎', 'value': '8', 'label': 'países'},
    ],
    'timeline': [
        {'year': '1992', 'title': 'Primeira máquina automática', 'text': 'Gabriel Markarian e Oscar Urbano constroem a primeira máquina automática para moldes de panetone.'},
        {'year': '1999', 'title': 'Constituição da empresa', 'text': 'Constituição formal como Cartotécnica Hores SRL.'},
        {'year': '2002', 'title': 'Bolo inglês sem fita', 'text': 'Lançamento da linha de bolo inglês sem fita, com registro de desenho industrial n.° 68.399.'},
        {'year': '2003–2005', 'title': 'Diversificação de linhas', 'text': 'Incorporação das linhas de panetone, rosca, pão de ló, bolo inglês e pão de Natal.'},
        {'year': '2006–2009', 'title': 'Ampliação da fábrica', 'text': 'A fábrica em Bell Ville, Córdoba, cresce até os 5.000 m².'},
        {'year': '2011–2012', 'title': 'Certificação ISO 22000:2005', 'text': 'Certificação do sistema de gestão de inocuidade, com a Bureau Veritas.'},
        {'year': '2015', 'title': 'Novo terreno', 'text': 'Aquisição de um terreno de 4,50 hectares para a futura fábrica.'},
        {'year': '2020', 'title': 'Nova fábrica', 'text': 'Em 9 de março, mudança para a nova fábrica de 12.000 m².'},
        {'year': 'Hoje', 'title': 'Atualidade', 'text': 'Presença consolidada no mercado argentino e no resto da região, com mais de 25 anos de trajetória formal.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Missão', 'text': 'Produzir e fornecer moldes de papel inócuos para a indústria de alimentação, atendendo às necessidades dos clientes e proporcionando condições para o desenvolvimento pessoal.'},
        {'icon': '👁️', 'title': 'Visão', 'text': 'Posicionar-se como uma das principais empresas do mundo na produção de moldes de papel para alimentação.'},
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


def _redirect(path):
    """Redirige preservando el idioma activo (/en/..., /pt/...).

    request.redirect() con una ruta relativa como '/mi-sitio/gracias' NO
    antepone el prefijo de idioma por si solo -- siempre devuelve al
    visitante a la version en espanol de esa URL, sin importar en que
    idioma estaba navegando (bug real: un visitante llenando el formulario
    de pedido en /en/producto/7 quedaba en la version en espanol de la
    pagina despues de enviarlo, con o sin error). ir.http._url_for()
    antepone el prefijo correcto segun el idioma activo del request antes
    de redirigir. Usar esto en vez de request.redirect() directo para
    cualquier destino relativo que el visitante vaya a ver."""
    return request.redirect(request.env['ir.http']._url_for(path))


def _pedido_por_token(order_id, token):
    """Busca un sale.order por id y valida el token de acceso, sin pasar
    por ningún login -- el mismo patrón que usa el portal nativo de Odoo
    para links de "ver mi cotización" en emails, pero implementado acá
    directo (no heredamos CustomerPortal). `access_token` se genera solo,
    la primera vez que se pide (sale.order lo trae de portal.mixin).

    Devuelve el pedido si el token es válido, o un recordset vacío si no
    -- nunca tira 404 acá adentro, para no filtrar por el código de error
    si existe o no un pedido con ese id (deja que el caller decida)."""
    order = request.env['sale.order'].sudo().browse(order_id)
    if not order.exists() or not token:
        return request.env['sale.order']
    token_real = order._portal_ensure_token()
    if not hmac.compare_digest(str(token_real), str(token)):
        return request.env['sale.order']
    return order


def _pedido_gestionable(order):
    """Un pedido se puede cancelar / pedir cambios desde el sitio solo si
    todavía no se facturó de verdad (una factura confirmada ya generada
    significa que Administración ya lo procesó -- a partir de ahí el
    cambio se coordina a mano, no solo)."""
    if order.state not in PEDIDO_ESTADOS_GESTIONABLES:
        return False
    return not any(m.state == 'posted' for m in order.invoice_ids)


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
        # Con un solo producto publicado, la página de categoría es un
        # paso intermedio sin nada propio que mostrar (misma foto/nombre
        # que ya se ve en la ficha) — a pedido explícito (28/08/2026,
        # "esta sección quitala porque está de más") se salta directo a
        # la ficha del producto. Con más de uno (hoy, Rosca/Bizcochuelo)
        # la página de categoría sigue mostrándose normal, porque ahí sí
        # agrupa algo que /producto/<id> no puede mostrar solo.
        if len(productos) == 1:
            return _redirect('/producto/%d' % productos.id)
        return request.render('mi_sitio_web.categoria_template', {
            'categoria': categoria,
            'productos': productos,
        })

    @http.route('/producto/<int:producto_id>', type='http', auth='public', website=True, sitemap=True)
    def producto_detalle(self, producto_id, **kwargs):
        producto = request.env['mi_sitio_web.producto'].sudo().browse(producto_id)
        if not producto.exists() or not producto.is_published:
            raise request.not_found()
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
            return _redirect('/mi-sitio/gracias')

        # Validación server-side: el atributo required/type=email del HTML
        # no protege contra un POST directo (curl, bot) con campos vacíos,
        # mal formados o absurdamente largos.
        if (not nombre or not email or not mensaje
                or not EMAIL_RE.match(email)
                or len(nombre) > NOMBRE_MAX_LEN
                or len(mensaje) > MENSAJE_MAX_LEN):
            return _redirect('/mi-sitio?contacto_error=1#contacto')

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
        return _redirect('/mi-sitio/gracias')

    @http.route('/mi-sitio/gracias', type='http', auth='public', website=True)
    def contacto_gracias(self, **kwargs):
        return request.render('mi_sitio_web.contacto_gracias_template', {})

    @http.route('/mi-sitio/carrito/lineas', type='http', auth='public', website=True, sitemap=False)
    def carrito_lineas(self, **kwargs):
        # El numerito del carrito en el header muestra la cantidad de
        # PEDIDOS (líneas), no la suma de unidades — pedir 20 moldes en una
        # sola línea tiene que marcar "1", no "20". `request.cart` ya lo
        # expone website_sale automáticamente en cualquier request. Se
        # descartan las líneas "de presentación" (secciones/notas/combos,
        # display_type != False) porque no son un producto pedido de verdad.
        cart = request.cart
        cantidad = len(cart.order_line.filtered(lambda l: not l.display_type)) if cart else 0
        return request.make_json_response({'cantidad': cantidad})

    # -----------------------------------------------------------------
    # Cancelar / pedir un cambio en un pedido ya hecho — sin login, con
    # el link que se muestra en /shop/confirmation (ver
    # views/pedido_gestion_templates.xml). A pedido explícito
    # (28/08/2026): "cancelar" lo hace el sitio directo; "editar" solo
    # manda el pedido de cambio a Ventas (queda en el chatter del pedido
    # + una actividad para el vendedor) — el cambio en sí lo aplica una
    # persona a mano, coherente con que todo el proceso hoy es manual
    # (sin pago online, sin stock automatizado). Ver DOCS/07-pedidos.md.
    # -----------------------------------------------------------------

    @http.route('/mi-sitio/pedido/<int:order_id>/gestionar', type='http', auth='public', website=True, sitemap=False)
    def pedido_gestionar(self, order_id, token=None, ok=None, **kwargs):
        order = _pedido_por_token(order_id, token)
        if not order:
            raise request.not_found()
        return request.render('mi_sitio_web.pedido_gestionar_template', {
            'order': order,
            'token': token,
            'gestionable': _pedido_gestionable(order),
            'ok': ok,
        })

    @http.route('/mi-sitio/pedido/<int:order_id>/cancelar', type='http', auth='public',
                website=True, methods=['POST'], sitemap=False)
    def pedido_cancelar(self, order_id, token=None, **kwargs):
        order = _pedido_por_token(order_id, token)
        if not order:
            raise request.not_found()
        if _pedido_gestionable(order):
            order.action_cancel()
        return _redirect('/mi-sitio/pedido/%d/gestionar?token=%s&ok=cancelado' % (order_id, token or ''))

    @http.route('/mi-sitio/pedido/<int:order_id>/cambio', type='http', auth='public',
                website=True, methods=['POST'], sitemap=False)
    def pedido_solicitar_cambio(self, order_id, token=None, mensaje='', **kwargs):
        order = _pedido_por_token(order_id, token)
        if not order:
            raise request.not_found()
        mensaje = (mensaje or '').strip()[:MENSAJE_MAX_LEN]
        if mensaje and _pedido_gestionable(order):
            # message_post trata un str común como texto sin confiar (lo
            # escapa entero, "<b>" incluido) -- correcto para no abrir un
            # XSS con lo que escriba el cliente, pero también nos come el
            # HTML propio si no se marca aparte. Se escapa el mensaje del
            # cliente a mano primero, y recién ahí se envuelve todo en
            # Markup() para que las etiquetas nuestras (que sí son de
            # confianza, las escribimos acá) se rendericen de verdad.
            cuerpo = 'Pedido de cambio del cliente, vía sitio web:<br/>' + html.escape(mensaje).replace('\n', '<br/>')
            order.message_post(body=Markup(cuerpo))
            order.activity_schedule(
                'mail.mail_activity_data_todo',
                summary='Cliente pidió un cambio en este pedido (sitio web)',
                user_id=order.user_id.id or request.env.user.id,
            )
        return _redirect('/mi-sitio/pedido/%d/gestionar?token=%s&ok=cambio' % (order_id, token or ''))
