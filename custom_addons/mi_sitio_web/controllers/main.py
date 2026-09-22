import base64
import hmac
import html
import os
import re

from markupsafe import Markup

from odoo import http
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.http import request
from odoo.tools import escape_psql

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
NOMBRE_MAX_LEN = 200
MENSAJE_MAX_LEN = 5000
# EMAIL_RE no pone límite de longitud (cualquier cantidad de caracteres
# sin @/espacio antes y después del punto matchea igual) -- sin este
# límite aparte, un "email" técnicamente válido pero absurdamente largo
# pasaba la validación entera y se guardaba tal cual (encontrado en
# revisión de validaciones, 07/09/2026). 254 es el máximo práctico de un
# email según RFC 5321 (más una cadena así de larga nunca es real).
EMAIL_MAX_LEN = 254
TELEFONO_MAX_LEN = 40

# Bolsa de trabajo (/trabaja-con-nosotros) -- ver postulacion() más abajo.
CV_EXTENSIONES_PERMITIDAS = ('.pdf', '.doc', '.docx')
CV_MAX_BYTES = 5 * 1024 * 1024  # 5 MB

# Pedido personalizado (/pedido-personalizado) -- imagen de referencia
# opcional adjunta al Lead (ej. una foto del molde a replicar o un
# boceto). Mismo criterio de validación que el CV de arriba (extensión +
# tamaño), pero optativo -- a diferencia del CV, no adjuntar nada es
# válido acá.
IMAGEN_EXTENSIONES_PERMITIDAS = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
IMAGEN_MAX_BYTES = 8 * 1024 * 1024  # 8 MB

# Estados de sale.order desde los que un cliente puede cancelar/pedir un
# cambio por su cuenta, sin pasar por Ventas primero — ver
# _pedido_gestionable() más abajo.
PEDIDO_ESTADOS_GESTIONABLES = ('draft', 'sent', 'sale')

# ---------------------------------------------------------------------------
# Contenido de ejemplo para /historia — NO son datos reales confirmados de
# Cartotécnica Hores. Reemplazar por la información verificada de la empresa
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
    # Timeline reescrito el 22/09/2026 con el texto real y completo de
    # "Sobre Nosotros" (hores.com.ar/wp), pasado a mano por el usuario --
    # reemplaza la versión resumida anterior, que dejaba afuera datos
    # reales concretos (los detectores de metales del 2002, la
    # supercalandra/micro corrugado/flexográfica de 4 colores del
    # 2006-2009, las 4 áreas de la planta nueva). El "7 de Junio de…" que
    # el sitio real da para la certificación ISO no tiene el año
    # completo (viene cortado así en la fuente) -- no se inventa acá.
    'timeline': [
        {'year': '1992', 'title': 'Primera máquina automática', 'text': 'Gabriel Markarian y Oscar Urbano construyen la primera máquina automática para moldes de papel de pan dulce — el inicio de lo que después sería Cartotécnica Hores.'},
        {'year': '1999', 'title': 'Constitución de la SRL', 'text': 'Se constituye formalmente como Cartotécnica Hores SRL, dando el primer paso para instalarse en el mercado de la industria panificadora.'},
        {'year': '2002', 'title': 'Budín sin Fleje', 'text': 'Se pone en marcha la línea de moldes de Budín sin Fleje, que reduce costos y facilita la detección de metales en la industria alimenticia. Registro de modelo industrial n.° 68.399.'},
        {'year': '2003–2005', 'title': 'Diversificación de líneas', 'text': 'Se diversifican las líneas de producción: moldes para pan dulce, para rosca y bizcochuelo, para budines y de pan de pascua. La demanda creciente lleva a construir nuevas conformadoras propias.'},
        {'year': '2006–2009', 'title': 'Ampliación de planta', 'text': 'La planta en Bell Ville, Córdoba, se amplía a 5.000 m². Se incorporan una supercalandra, papel micro corrugado y máquinas flexográficas de 4 colores para impresión.'},
        {'year': '2011–2012', 'title': 'Certificación ISO 22000:2005', 'text': 'Se certifica el sistema de gestión de inocuidad ISO 22000:2005, con Bureau Veritas.'},
        {'year': '2015', 'title': 'Nuevo predio', 'text': 'Se adquiere un predio de 4,50 hectáreas para trasladar la planta, ante la necesidad de más capacidad de producción y almacenamiento.'},
        {'year': '2018–2020', 'title': 'Nueva planta', 'text': 'El 9 de marzo de 2020 se completa la mudanza a la nueva planta de 12.000 m², organizada en las áreas de Proceso de Materia Prima, Producción, Mantenimiento y Logística.'},
        {'year': 'Hoy', 'title': 'Actualidad', 'text': 'Más de 31 años de trayectoria. La producción de Cartotécnica Hores se comercializa en distintos países, entre ellos Uruguay, Chile, Paraguay, Colombia y México.'},
    ],
    # Texto real, tomado palabra por palabra de hores.com.ar/wp/empresa/
    # (confirmado de nuevo el 22/09/2026 contra el texto que pasó el usuario).
    'mision_vision': [
        {'icon': '🎯', 'title': 'Misión', 'text': 'Producir y proveer moldes de papel inocuos para la industria de la alimentación, atendiendo las necesidades de los clientes y brindando las condiciones para el desarrollo de las personas que forman la empresa.'},
        {'icon': '👁️', 'title': 'Visión', 'text': 'Posicionarse como una de las principales empresas a nivel mundial en la producción de moldes de papel para la industria de la alimentación.'},
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
    'timeline': [
        {'year': '1992', 'title': 'First automatic machine', 'text': 'Gabriel Markarian and Oscar Urbano build the first automatic machine for panettone paper molds — the beginning of what would become Cartotécnica Hores.'},
        {'year': '1999', 'title': 'Company incorporated', 'text': 'Formally incorporated as Cartotécnica Hores SRL, taking the first step into the baking industry market.'},
        {'year': '2002', 'title': 'Strapless pound cake mold', 'text': 'Launch of the strapless pound cake mold line, which lowers costs and makes metal detection easier for food producers. Industrial design registration No. 68.399.'},
        {'year': '2003–2005', 'title': 'Product line diversification', 'text': 'Production lines diversify: panettone, ring cake and sponge cake, pound cake, and Christmas bread molds. Growing demand leads the company to build its own new mold-forming machines.'},
        {'year': '2006–2009', 'title': 'Plant expansion', 'text': 'The plant in Bell Ville, Córdoba, expands to 5,000 m². A super-calender, micro-corrugated paper, and 4-color flexographic printing machines are added.'},
        {'year': '2011–2012', 'title': 'ISO 22000:2005 certification', 'text': 'The ISO 22000:2005 food-safety management system is certified, with Bureau Veritas.'},
        {'year': '2015', 'title': 'New site acquired', 'text': 'A 4.50-hectare site is acquired to relocate the plant, driven by the need for more production and storage capacity.'},
        {'year': '2018–2020', 'title': 'New plant', 'text': 'On March 9, 2020, the move into the new 12,000 m² plant is completed, organized into Raw Material, Production, Maintenance and Logistics areas.'},
        {'year': 'Today', 'title': 'Today', 'text': 'More than 31 years in business. Cartotécnica Hores products are sold in several countries, including Uruguay, Chile, Paraguay, Colombia and Mexico.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Mission', 'text': 'To produce and provide safe paper molds for the food industry, meeting the needs of our clients and providing the conditions for the growth of the people who make up the company.'},
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
    'timeline': [
        {'year': '1992', 'title': 'Primeira máquina automática', 'text': 'Gabriel Markarian e Oscar Urbano constroem a primeira máquina automática para moldes de papel de panetone — o início do que se tornaria a Cartotécnica Hores.'},
        {'year': '1999', 'title': 'Constituição da empresa', 'text': 'Constituição formal como Cartotécnica Hores SRL, dando o primeiro passo para se instalar no mercado da indústria de panificação.'},
        {'year': '2002', 'title': 'Bolo inglês sem fita', 'text': 'Lançamento da linha de moldes de bolo inglês sem fita, que reduz custos e facilita a detecção de metais na indústria alimentícia. Registro de desenho industrial n.° 68.399.'},
        {'year': '2003–2005', 'title': 'Diversificação de linhas', 'text': 'Diversificação das linhas de produção: panetone, rosca e pão de ló, bolo inglês, e pão de Natal. A demanda crescente leva a empresa a construir suas próprias novas máquinas formadoras.'},
        {'year': '2006–2009', 'title': 'Ampliação da fábrica', 'text': 'A fábrica em Bell Ville, Córdoba, se amplia para 5.000 m². São incorporadas uma supercalandra, papel micro corrugado e máquinas flexográficas de 4 cores para impressão.'},
        {'year': '2011–2012', 'title': 'Certificação ISO 22000:2005', 'text': 'Certificação do sistema de gestão de inocuidade ISO 22000:2005, com a Bureau Veritas.'},
        {'year': '2015', 'title': 'Novo terreno', 'text': 'Aquisição de um terreno de 4,50 hectares para transferir a fábrica, diante da necessidade de mais capacidade de produção e armazenamento.'},
        {'year': '2018–2020', 'title': 'Nova fábrica', 'text': 'Em 9 de março de 2020, conclui-se a mudança para a nova fábrica de 12.000 m², organizada nas áreas de Processo de Matéria-Prima, Produção, Manutenção e Logística.'},
        {'year': 'Hoje', 'title': 'Atualidade', 'text': 'Mais de 31 anos de trajetória. A produção da Cartotécnica Hores é comercializada em diversos países, entre eles Uruguai, Chile, Paraguai, Colômbia e México.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Missão', 'text': 'Produzir e fornecer moldes de papel inócuos para a indústria de alimentação, atendendo às necessidades dos clientes e proporcionando condições para o desenvolvimento das pessoas que formam a empresa.'},
        {'icon': '👁️', 'title': 'Visão', 'text': 'Posicionar-se como uma das principais empresas do mundo na produção de moldes de papel para a indústria de alimentação.'},
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

_HISTORIA_IT = {
    # Aggiunto il 02/09/2026 insieme a francese, tedesco e cinese
    # semplificato -- vedi le note sulle fonti nel blocco es_AR più sopra
    # (stessi numeri/anni, tradotti).
    'timeline': [
        {'year': '1992', 'title': 'Prima macchina automatica', 'text': 'Gabriel Markarian e Oscar Urbano costruiscono la prima macchina automatica per stampi da panettone.'},
        {'year': '1999', 'title': 'Costituzione della società', 'text': 'Costituzione formale come Cartotécnica Hores SRL.'},
        {'year': '2002', 'title': 'Plumcake senza fascetta', 'text': 'Lancio della linea di plumcake senza fascetta, con registrazione del disegno industriale n. 68.399.'},
        {'year': '2003–2005', 'title': 'Diversificazione delle linee', 'text': 'Si aggiungono le linee di panettone, ciambella, pan di Spagna, plumcake e pane di Pasqua.'},
        {'year': '2006–2009', 'title': 'Ampliamento dello stabilimento', 'text': 'Lo stabilimento di Bell Ville, Córdoba, cresce fino a 5.000 m².'},
        {'year': '2011–2012', 'title': 'Certificazione ISO 22000:2005', 'text': 'Certificazione del sistema di gestione della sicurezza alimentare, con Bureau Veritas.'},
        {'year': '2015', 'title': 'Nuovo terreno', 'text': 'Acquisizione di un terreno di 4,50 ettari per il futuro stabilimento.'},
        {'year': '2020', 'title': 'Nuovo stabilimento', 'text': 'Il 9 marzo, trasferimento nel nuovo stabilimento di 12.000 m².'},
        {'year': 'Oggi', 'title': 'Attualità', 'text': 'Presenza consolidata nel mercato argentino e nel resto della regione, con oltre 25 anni di storia formale.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Missione', 'text': 'Produrre e fornire stampi di carta sicuri per l\'industria alimentare, soddisfacendo le esigenze dei clienti e offrendo condizioni per la crescita personale.'},
        {'icon': '👁️', 'title': 'Visione', 'text': 'Diventare una delle principali aziende al mondo nella produzione di stampi di carta per l\'alimentazione.'},
    ],
    'valores': [
        {'icon': '🎯', 'title': 'Precisione', 'text': 'Misure esatte e costanti in ogni lotto di produzione.'},
        {'icon': '🤝', 'title': 'Impegno', 'text': 'Verso la qualità del prodotto e verso ogni cliente.'},
        {'icon': '⚡', 'title': 'Agilità', 'text': 'Processi agili per rispondere puntualmente a ogni ordine.'},
        {'icon': '💬', 'title': 'Vicinanza', 'text': 'Rapporto diretto e personalizzato con ogni cliente.'},
        {'icon': '📈', 'title': 'Miglioramento continuo', 'text': 'Rivediamo e ottimizziamo costantemente i processi.'},
        {'icon': '✓', 'title': 'Qualità', 'text': 'Gestione della sicurezza alimentare certificata ISO 22000:2018.'},
    ],
    'sectores': [
        {'label': 'Panettone', 'pct': 35},
        {'label': 'Plumcake', 'pct': 25},
        {'label': 'Ciambella / Pan di Spagna', 'pct': 25},
        {'label': 'Pane di Pasqua', 'pct': 15},
    ],
    'sectores_bullets': [
        'Stampi adatti al contatto diretto con gli alimenti',
        'Produzione sotto gestione della sicurezza alimentare certificata ISO 22000:2018',
        'Formati standard e su misura secondo le specifiche del cliente',
        'Stampa personalizzata disponibile',
        'Logistica coordinata in base a destinazione e volume',
    ],
    'clientes': [
        {'iniciales': 'A1', 'nombre': 'Panificio Regionale', 'sector': 'Alimentare'},
        {'iniciales': 'B2', 'nombre': 'Gruppo Industriale del Centro', 'sector': 'Alimentare'},
        {'iniciales': 'C3', 'nombre': 'Distributore All\'ingrosso SA', 'sector': 'Distribuzione'},
        {'iniciales': 'D4', 'nombre': 'Catena di Panifici del Sud', 'sector': 'Alimentare'},
        {'iniciales': 'E5', 'nombre': 'Pasticceria del Nord', 'sector': 'Alimentare'},
        {'iniciales': 'F6', 'nombre': 'Supermercati Regionali', 'sector': 'Retail'},
        {'iniciales': 'G7', 'nombre': 'Cooperativa dei Panificatori', 'sector': 'Alimentare'},
        {'iniciales': 'H8', 'nombre': 'Confezionamento del Litorale', 'sector': 'Alimentare'},
        {'iniciales': 'I9', 'nombre': 'Distributore Andino', 'sector': 'Distribuzione'},
        {'iniciales': 'J1', 'nombre': 'Prodotti da Forno Premium', 'sector': 'Alimentare'},
        {'iniciales': 'K2', 'nombre': 'Retail Gourmet', 'sector': 'Retail'},
        {'iniciales': 'L3', 'nombre': 'Fabbrica di Dolci dell\'Est', 'sector': 'Alimentare'},
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': 'Argentina', 'etiqueta': 'mercato principale'},
        {'codigo': 'bo', 'nombre': 'Bolivia', 'etiqueta': 'esportazione'},
        {'codigo': 'cl', 'nombre': 'Cile', 'etiqueta': 'esportazione'},
        {'codigo': 'co', 'nombre': 'Colombia', 'etiqueta': 'esportazione'},
        {'codigo': 'ec', 'nombre': 'Ecuador', 'etiqueta': 'esportazione'},
        {'codigo': 'uy', 'nombre': 'Uruguay', 'etiqueta': 'esportazione'},
        {'codigo': 'mx', 'nombre': 'Messico', 'etiqueta': 'esportazione'},
        {'codigo': 'py', 'nombre': 'Paraguay', 'etiqueta': 'esportazione'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': 'Espansione regionale', 'text': 'Ampliare la presenza commerciale in nuovi mercati della regione.'},
        {'icon': '🏭', 'title': 'Nuovo stabilimento', 'text': 'Valutare l\'aggiunta di capacità produttiva.'},
        {'icon': '⚙️', 'title': 'Industria 4.0', 'text': 'Adottare tecnologia per ottimizzare i processi produttivi.'},
        {'icon': '🌱', 'title': 'Certificazione ISO 14001', 'text': 'Avanzare nella gestione ambientale dei nostri processi.'},
    ],
}

_HISTORIA_FR = {
    'timeline': [
        {'year': '1992', 'title': 'Première machine automatique', 'text': 'Gabriel Markarian et Oscar Urbano construisent la première machine automatique pour moules à panettone.'},
        {'year': '1999', 'title': 'Constitution de la société', 'text': 'Constitution formelle en tant que Cartotécnica Hores SRL.'},
        {'year': '2002', 'title': 'Cake sans sangle', 'text': 'Lancement de la gamme de cakes sans sangle, avec enregistrement de dessin industriel n° 68.399.'},
        {'year': '2003–2005', 'title': 'Diversification des gammes', 'text': 'Ajout des gammes panettone, couronne, génoise, cake et pain de Pâques.'},
        {'year': '2006–2009', 'title': 'Agrandissement de l\'usine', 'text': 'L\'usine de Bell Ville, Córdoba, atteint 5 000 m².'},
        {'year': '2011–2012', 'title': 'Certification ISO 22000:2005', 'text': 'Certification du système de gestion de la sécurité alimentaire, avec Bureau Veritas.'},
        {'year': '2015', 'title': 'Nouveau terrain', 'text': 'Acquisition d\'un terrain de 4,50 hectares pour la future usine.'},
        {'year': '2020', 'title': 'Nouvelle usine', 'text': 'Le 9 mars, déménagement dans la nouvelle usine de 12 000 m².'},
        {'year': 'Aujourd\'hui', 'title': 'Actualité', 'text': 'Présence consolidée sur le marché argentin et dans le reste de la région, avec plus de 25 ans d\'histoire formelle.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Mission', 'text': 'Produire et fournir des moules en papier sûrs pour l\'industrie alimentaire, en répondant aux besoins des clients et en offrant des conditions de développement personnel.'},
        {'icon': '👁️', 'title': 'Vision', 'text': 'Devenir l\'une des principales entreprises mondiales dans la production de moules en papier pour l\'alimentation.'},
    ],
    'valores': [
        {'icon': '🎯', 'title': 'Précision', 'text': 'Mesures exactes et constantes à chaque lot de production.'},
        {'icon': '🤝', 'title': 'Engagement', 'text': 'Envers la qualité du produit et envers chaque client.'},
        {'icon': '⚡', 'title': 'Agilité', 'text': 'Des processus agiles pour répondre à temps à chaque commande.'},
        {'icon': '💬', 'title': 'Proximité', 'text': 'Relation directe et personnalisée avec chaque client.'},
        {'icon': '📈', 'title': 'Amélioration continue', 'text': 'Nous révisons et optimisons nos processus en permanence.'},
        {'icon': '✓', 'title': 'Qualité', 'text': 'Gestion de la sécurité alimentaire certifiée ISO 22000:2018.'},
    ],
    'sectores': [
        {'label': 'Panettone', 'pct': 35},
        {'label': 'Cake', 'pct': 25},
        {'label': 'Couronne / Génoise', 'pct': 25},
        {'label': 'Pain de Pâques', 'pct': 15},
    ],
    'sectores_bullets': [
        'Moules adaptés au contact direct avec les aliments',
        'Production sous gestion de la sécurité alimentaire certifiée ISO 22000:2018',
        'Formats standards et sur mesure selon les spécifications du client',
        'Impression personnalisée disponible',
        'Logistique coordonnée selon la destination et le volume',
    ],
    'clientes': [
        {'iniciales': 'A1', 'nombre': 'Boulangerie Régionale', 'sector': 'Alimentaire'},
        {'iniciales': 'B2', 'nombre': 'Groupe Industriel du Centre', 'sector': 'Alimentaire'},
        {'iniciales': 'C3', 'nombre': 'Distributeur Grossiste SA', 'sector': 'Distribution'},
        {'iniciales': 'D4', 'nombre': 'Chaîne de Boulangeries du Sud', 'sector': 'Alimentaire'},
        {'iniciales': 'E5', 'nombre': 'Pâtisserie du Nord', 'sector': 'Alimentaire'},
        {'iniciales': 'F6', 'nombre': 'Supermarchés Régionaux', 'sector': 'Distribution de détail'},
        {'iniciales': 'G7', 'nombre': 'Coopérative de Boulangers', 'sector': 'Alimentaire'},
        {'iniciales': 'H8', 'nombre': 'Conditionnement du Littoral', 'sector': 'Alimentaire'},
        {'iniciales': 'I9', 'nombre': 'Distributeur Andin', 'sector': 'Distribution'},
        {'iniciales': 'J1', 'nombre': 'Produits de Boulangerie Premium', 'sector': 'Alimentaire'},
        {'iniciales': 'K2', 'nombre': 'Retail Gourmet', 'sector': 'Distribution de détail'},
        {'iniciales': 'L3', 'nombre': 'Fabrique de Desserts de l\'Est', 'sector': 'Alimentaire'},
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': 'Argentine', 'etiqueta': 'marché principal'},
        {'codigo': 'bo', 'nombre': 'Bolivie', 'etiqueta': 'exportation'},
        {'codigo': 'cl', 'nombre': 'Chili', 'etiqueta': 'exportation'},
        {'codigo': 'co', 'nombre': 'Colombie', 'etiqueta': 'exportation'},
        {'codigo': 'ec', 'nombre': 'Équateur', 'etiqueta': 'exportation'},
        {'codigo': 'uy', 'nombre': 'Uruguay', 'etiqueta': 'exportation'},
        {'codigo': 'mx', 'nombre': 'Mexique', 'etiqueta': 'exportation'},
        {'codigo': 'py', 'nombre': 'Paraguay', 'etiqueta': 'exportation'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': 'Expansion régionale', 'text': 'Développer la présence commerciale sur de nouveaux marchés de la région.'},
        {'icon': '🏭', 'title': 'Nouvelle usine', 'text': 'Évaluer l\'ajout de capacité de production supplémentaire.'},
        {'icon': '⚙️', 'title': 'Industrie 4.0', 'text': 'Adopter la technologie pour optimiser les processus de production.'},
        {'icon': '🌱', 'title': 'Certification ISO 14001', 'text': 'Faire progresser la gestion environnementale de nos processus.'},
    ],
}

_HISTORIA_DE = {
    'timeline': [
        {'year': '1992', 'title': 'Erste automatische Maschine', 'text': 'Gabriel Markarian und Oscar Urbano bauen die erste automatische Maschine für Panettone-Formen.'},
        {'year': '1999', 'title': 'Gründung der Gesellschaft', 'text': 'Formelle Gründung als Cartotécnica Hores SRL.'},
        {'year': '2002', 'title': 'Kastenform ohne Banderole', 'text': 'Einführung der Kastenform-Linie ohne Banderole, mit Gebrauchsmusteranmeldung Nr. 68.399.'},
        {'year': '2003–2005', 'title': 'Diversifizierung der Produktlinien', 'text': 'Die Linien Panettone, Kranzkuchen, Biskuit, Kastenform und Osterbrot kommen hinzu.'},
        {'year': '2006–2009', 'title': 'Werkserweiterung', 'text': 'Das Werk in Bell Ville, Córdoba, wächst auf 5.000 m².'},
        {'year': '2011–2012', 'title': 'ISO-22000:2005-Zertifizierung', 'text': 'Zertifizierung des Lebensmittelsicherheitsmanagementsystems durch Bureau Veritas.'},
        {'year': '2015', 'title': 'Neues Grundstück', 'text': 'Erwerb eines 4,50 Hektar großen Grundstücks für das zukünftige Werk.'},
        {'year': '2020', 'title': 'Neues Werk', 'text': 'Am 9. März Umzug in das neue 12.000 m² große Werk.'},
        {'year': 'Heute', 'title': 'Gegenwart', 'text': 'Konsolidierte Präsenz auf dem argentinischen Markt und in der restlichen Region, mit mehr als 25 Jahren formeller Geschichte.'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': 'Mission', 'text': 'Sichere Papierformen für die Lebensmittelindustrie herzustellen und bereitzustellen, die Bedürfnisse der Kunden zu erfüllen und Bedingungen für die persönliche Entwicklung zu schaffen.'},
        {'icon': '👁️', 'title': 'Vision', 'text': 'Eines der führenden Unternehmen weltweit in der Herstellung von Papierformen für die Lebensmittelindustrie zu werden.'},
    ],
    'valores': [
        {'icon': '🎯', 'title': 'Präzision', 'text': 'Exakte, gleichbleibende Maße in jeder Produktionscharge.'},
        {'icon': '🤝', 'title': 'Engagement', 'text': 'Für Produktqualität und für jeden Kunden.'},
        {'icon': '⚡', 'title': 'Agilität', 'text': 'Agile Prozesse, um jede Bestellung pünktlich zu bearbeiten.'},
        {'icon': '💬', 'title': 'Nähe', 'text': 'Direkter, persönlicher Umgang mit jedem Kunden.'},
        {'icon': '📈', 'title': 'Kontinuierliche Verbesserung', 'text': 'Wir überprüfen und optimieren unsere Prozesse ständig.'},
        {'icon': '✓', 'title': 'Qualität', 'text': 'Zertifiziertes Lebensmittelsicherheitsmanagement ISO 22000:2018.'},
    ],
    'sectores': [
        {'label': 'Panettone', 'pct': 35},
        {'label': 'Kastenform', 'pct': 25},
        {'label': 'Kranzkuchen / Biskuit', 'pct': 25},
        {'label': 'Osterbrot', 'pct': 15},
    ],
    'sectores_bullets': [
        'Formen für den direkten Lebensmittelkontakt geeignet',
        'Produktion unter zertifiziertem Lebensmittelsicherheitsmanagement ISO 22000:2018',
        'Standard- und Sonderformate nach Kundenspezifikation',
        'Individueller Druck verfügbar',
        'Logistik koordiniert nach Zielort und Menge',
    ],
    'clientes': [
        {'iniciales': 'A1', 'nombre': 'Regionale Bäckerei', 'sector': 'Lebensmittel'},
        {'iniciales': 'B2', 'nombre': 'Industriekonzern der Zentralregion', 'sector': 'Lebensmittel'},
        {'iniciales': 'C3', 'nombre': 'Großhandelsvertrieb SA', 'sector': 'Vertrieb'},
        {'iniciales': 'D4', 'nombre': 'Bäckereikette des Südens', 'sector': 'Lebensmittel'},
        {'iniciales': 'E5', 'nombre': 'Konditorei des Nordens', 'sector': 'Lebensmittel'},
        {'iniciales': 'F6', 'nombre': 'Regionale Supermärkte', 'sector': 'Einzelhandel'},
        {'iniciales': 'G7', 'nombre': 'Bäckergenossenschaft', 'sector': 'Lebensmittel'},
        {'iniciales': 'H8', 'nombre': 'Verpackung der Küstenregion', 'sector': 'Lebensmittel'},
        {'iniciales': 'I9', 'nombre': 'Anden-Vertrieb', 'sector': 'Vertrieb'},
        {'iniciales': 'J1', 'nombre': 'Premium-Backwaren', 'sector': 'Lebensmittel'},
        {'iniciales': 'K2', 'nombre': 'Retail Gourmet', 'sector': 'Einzelhandel'},
        {'iniciales': 'L3', 'nombre': 'Dessertfabrik des Ostens', 'sector': 'Lebensmittel'},
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': 'Argentinien', 'etiqueta': 'Hauptmarkt'},
        {'codigo': 'bo', 'nombre': 'Bolivien', 'etiqueta': 'Export'},
        {'codigo': 'cl', 'nombre': 'Chile', 'etiqueta': 'Export'},
        {'codigo': 'co', 'nombre': 'Kolumbien', 'etiqueta': 'Export'},
        {'codigo': 'ec', 'nombre': 'Ecuador', 'etiqueta': 'Export'},
        {'codigo': 'uy', 'nombre': 'Uruguay', 'etiqueta': 'Export'},
        {'codigo': 'mx', 'nombre': 'Mexiko', 'etiqueta': 'Export'},
        {'codigo': 'py', 'nombre': 'Paraguay', 'etiqueta': 'Export'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': 'Regionale Expansion', 'text': 'Die kommerzielle Präsenz in neuen Märkten der Region ausbauen.'},
        {'icon': '🏭', 'title': 'Neues Werk', 'text': 'Die Erweiterung der Produktionskapazität prüfen.'},
        {'icon': '⚙️', 'title': 'Industrie 4.0', 'text': 'Technologie zur Optimierung der Produktionsprozesse einführen.'},
        {'icon': '🌱', 'title': 'ISO-14001-Zertifizierung', 'text': 'Das Umweltmanagement unserer Prozesse weiterentwickeln.'},
    ],
}

_HISTORIA_ZH_CN = {
    'timeline': [
        {'year': '1992', 'title': '第一台自动化机器', 'text': 'Gabriel Markarian 和 Oscar Urbano 制造了第一台意式圣诞面包纸模自动化生产机器。'},
        {'year': '1999', 'title': '公司成立', 'text': '正式成立为 Cartotécnica Hores SRL。'},
        {'year': '2002', 'title': '无带磅蛋糕模具', 'text': '推出无带磅蛋糕系列产品，工业设计注册号 68.399。'},
        {'year': '2003–2005', 'title': '产品线多元化', 'text': '新增圣诞面包、环形蛋糕、海绵蛋糕、磅蛋糕和复活节面包系列。'},
        {'year': '2006–2009', 'title': '工厂扩建', 'text': '位于科尔多瓦贝尔维尔的工厂扩建至5,000平方米。'},
        {'year': '2011–2012', 'title': 'ISO 22000:2005 认证', 'text': '通过必维国际检验集团（Bureau Veritas）认证食品安全管理体系。'},
        {'year': '2015', 'title': '新地块', 'text': '购置4.50公顷土地用于未来新厂建设。'},
        {'year': '2020', 'title': '新工厂', 'text': '3月9日，迁入面积12,000平方米的新工厂。'},
        {'year': '至今', 'title': '现状', 'text': '在阿根廷市场及地区其他国家保持稳固地位，正式经营历史超过25年。'},
    ],
    'mision_vision': [
        {'icon': '🎯', 'title': '使命', 'text': '为食品行业生产和提供安全的纸模产品，满足客户需求，并为员工个人发展创造条件。'},
        {'icon': '👁️', 'title': '愿景', 'text': '成为全球食品用纸模生产领域的主要企业之一。'},
    ],
    'valores': [
        {'icon': '🎯', 'title': '精准', 'text': '每批生产的尺寸精确一致。'},
        {'icon': '🤝', 'title': '承诺', 'text': '致力于产品质量与每一位客户。'},
        {'icon': '⚡', 'title': '敏捷', 'text': '流程灵活高效，及时响应每一笔订单。'},
        {'icon': '💬', 'title': '亲近', 'text': '与每位客户保持直接、个性化的沟通。'},
        {'icon': '📈', 'title': '持续改进', 'text': '持续审视并优化生产流程。'},
        {'icon': '✓', 'title': '品质', 'text': 'ISO 22000:2018 认证的食品安全管理体系。'},
    ],
    'sectores': [
        {'label': '圣诞面包', 'pct': 35},
        {'label': '磅蛋糕', 'pct': 25},
        {'label': '环形蛋糕 / 海绵蛋糕', 'pct': 25},
        {'label': '复活节面包', 'pct': 15},
    ],
    'sectores_bullets': [
        '模具适合直接接触食品',
        '在 ISO 22000:2018 认证的食品安全管理体系下生产',
        '标准及按客户规格定制的规格',
        '提供个性化印刷',
        '根据目的地和数量协调物流',
    ],
    'clientes': [
        {'iniciales': 'A1', 'nombre': '地区面包坊', 'sector': '食品'},
        {'iniciales': 'B2', 'nombre': '中部工业集团', 'sector': '食品'},
        {'iniciales': 'C3', 'nombre': '批发经销商 SA', 'sector': '经销'},
        {'iniciales': 'D4', 'nombre': '南部面包连锁店', 'sector': '食品'},
        {'iniciales': 'E5', 'nombre': '北部糕点厂', 'sector': '食品'},
        {'iniciales': 'F6', 'nombre': '地区超市', 'sector': '零售'},
        {'iniciales': 'G7', 'nombre': '面包师合作社', 'sector': '食品'},
        {'iniciales': 'H8', 'nombre': '沿海包装公司', 'sector': '食品'},
        {'iniciales': 'I9', 'nombre': '安第斯经销商', 'sector': '经销'},
        {'iniciales': 'J1', 'nombre': '优质烘焙食品公司', 'sector': '食品'},
        {'iniciales': 'K2', 'nombre': '精品零售', 'sector': '零售'},
        {'iniciales': 'L3', 'nombre': '东部甜品厂', 'sector': '食品'},
    ],
    'paises': [
        {'codigo': 'ar', 'nombre': '阿根廷', 'etiqueta': '主要市场'},
        {'codigo': 'bo', 'nombre': '玻利维亚', 'etiqueta': '出口'},
        {'codigo': 'cl', 'nombre': '智利', 'etiqueta': '出口'},
        {'codigo': 'co', 'nombre': '哥伦比亚', 'etiqueta': '出口'},
        {'codigo': 'ec', 'nombre': '厄瓜多尔', 'etiqueta': '出口'},
        {'codigo': 'uy', 'nombre': '乌拉圭', 'etiqueta': '出口'},
        {'codigo': 'mx', 'nombre': '墨西哥', 'etiqueta': '出口'},
        {'codigo': 'py', 'nombre': '巴拉圭', 'etiqueta': '出口'},
    ],
    'objetivos': [
        {'icon': '🚀', 'title': '区域扩张', 'text': '拓展在本地区新市场的商业布局。'},
        {'icon': '🏭', 'title': '新工厂', 'text': '评估增加生产产能的可能性。'},
        {'icon': '⚙️', 'title': '工业4.0', 'text': '引入技术以优化生产流程。'},
        {'icon': '🌱', 'title': 'ISO 14001 认证', 'text': '推进生产流程的环境管理。'},
    ],
}

HISTORIA_POR_IDIOMA = {
    'es_AR': _HISTORIA_ES, 'en_US': _HISTORIA_EN, 'pt_BR': _HISTORIA_PT,
    'it_IT': _HISTORIA_IT, 'fr_FR': _HISTORIA_FR, 'de_DE': _HISTORIA_DE, 'zh_CN': _HISTORIA_ZH_CN,
}


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


def _normalizar_identificacion(valor):
    """Deja solo letras y números, en mayúsculas -- para comparar DNI/CUIT/
    etc. sin que importe si el cliente escribe guiones, puntos o espacios
    (ej. '20-12345678-9' vs '20123456789' vs '20.123.456.789')."""
    return re.sub(r'[^0-9A-Za-z]', '', valor or '').upper()


def _normalizar_telefono(valor):
    """Deja solo dígitos -- para comparar teléfonos sin que importe el
    formato con el que haya quedado guardado (espacios, guiones, '+54',
    '0' inicial de larga distancia, etc.). No intenta validar ni separar
    código de país/área: alcanza con que dos números iguales, escritos
    distinto, comparen igual -- el mismo criterio que ya usa
    _normalizar_identificacion() para DNI/CUIT."""
    return re.sub(r'\D', '', valor or '')


# Un dato demasiado corto (ej. '123') compara igual entre casi cualquier
# par de números reales una vez que se les sacan los separadores -- sin
# este piso, _pedidos_por_dato() podía traer pedidos de otra persona con
# un dato de pocos dígitos. Ni un DNI (7-8 dígitos) ni un teléfono
# argentino (8+ dígitos sin el 0/15) bajan de esto.
DATO_MIN_LEN = 6


def _pedidos_por_dato(env, dato):
    """Busca los sale.order de un cliente por CUALQUIER dato que haya
    cargado en el formulario de pedido -- documento (DNI/CUIT), email o
    teléfono -- a pedido explícito (09/09/2026): no todos los pedidos
    tienen documento cargado (es opcional en el checkout, ver
    WebsiteSaleHores más abajo), así que exigir siempre documento +
    número de pedido dejaba afuera a quien no lo cargó.

    Compara los TRES formatos a la vez, sin intentar adivinar de qué
    tipo es `dato` -- si normalizado coincide EXACTO (nunca por
    substring/ilike, para no repetir el bug de '%'/'_' como comodín de
    SQL que ya se encontró en este mismo archivo) con el documento, el
    email o el teléfono de un cliente, ese pedido cuenta.
    Devuelve TODOS los pedidos de esa persona, no uno solo -- distinto
    del comportamiento viejo (pedía además el número de un pedido
    puntual)."""
    dato = (dato or '').strip()
    if not dato:
        return env['sale.order']
    dato_doc = _normalizar_identificacion(dato)
    dato_mail = dato.lower()
    dato_tel = _normalizar_telefono(dato)

    def coincide(order):
        partner = order.partner_id
        if len(dato_doc) >= DATO_MIN_LEN and _normalizar_identificacion(partner.vat) == dato_doc:
            return True
        if '@' in dato_mail and (partner.email or '').strip().lower() == dato_mail:
            return True
        # Solo phone -- res.partner no tiene un campo mobile aparte en
        # esta versión de Odoo (era así en versiones viejas; acá tirá
        # AttributeError, encontrado probando esta misma ruta).
        #
        # Termina en / empieza con, no '==': Odoo suele reformatear el
        # teléfono al guardar el partner agregándole el código de país
        # ('3537650821' cargado -> '+54 3537650821' guardado) -- con
        # igualdad estricta, el cliente que carga el mismo número que
        # escribió en el checkout (sin el +54) nunca matcheaba contra lo
        # que quedó guardado (encontrado probando esta misma ruta con un
        # teléfono real). Se exige el piso de largo en AMBOS lados, no
        # solo en el dato ingresado, para que un número corto guardado
        # (ej. un interno mal cargado) no matchee por ser sufijo/prefijo
        # de casi cualquier cosa.
        tel_guardado = _normalizar_telefono(partner.phone)
        if (len(dato_tel) >= DATO_MIN_LEN and len(tel_guardado) >= DATO_MIN_LEN
                and (dato_tel == tel_guardado
                     or dato_tel.endswith(tel_guardado)
                     or tel_guardado.endswith(dato_tel))):
            return True
        return False

    # mi_sitio_lead_cancelado=True: el carrito que _crear_oportunidad_
    # desde_carrito cancela para mandar al cliente nuevo a CRM en vez de
    # a pago (ver shop_payment) -- nunca fue un pedido real, no tiene
    # que aparecer acá como si lo fuera.
    candidatos = env['sale.order'].sudo().search([('mi_sitio_lead_cancelado', '=', False)])
    return candidatos.filtered(coincide)


def _pedido_gestionable(order):
    """Un pedido se puede cancelar / pedir cambios desde el sitio solo si
    todavía no se facturó de verdad (una factura confirmada ya generada
    significa que Administración ya lo procesó -- a partir de ahí el
    cambio se coordina a mano, no solo)."""
    if order.state not in PEDIDO_ESTADOS_GESTIONABLES:
        return False
    return not any(m.state == 'posted' for m in order.invoice_ids)


def _elegir_responsable_actividad(env, team=False, preferido=False):
    """A quién asignarle una actividad ("A hacer") disparada desde una
    ruta pública del sitio -- compartido entre el aviso de cliente nuevo
    (_crear_oportunidad_desde_carrito) y el de pedido de cambio
    (pedido_solicitar_cambio). NUNCA env.user acá salvo como último
    recurso de todos: en una ruta auth='public', env.user es el "Usuario
    Público" de Odoo, una cuenta técnica que nadie mira -- encontrado el
    04/09/2026 en revisión de código, arreglado primero solo para
    cliente nuevo y recién acá compartido para que el mismo bug no se
    repita una tercera vez en otra ruta (como pasó con
    pedido_solicitar_cambio, que seguía cayendo en env.user).

    Prioridad: alguien ya elegido de antemano (ej. el vendedor asignado
    al pedido) -> el líder del equipo -> cualquier miembro del equipo ->
    el admin -> recién ahí, si todo lo anterior falta, env.user (mejor
    una actividad mal asignada que una ruta pública que revienta)."""
    if preferido:
        return preferido
    if team:
        if team.user_id:
            return team.user_id
        if team.member_ids:
            return team.member_ids[:1]
    admin = env.ref('base.user_admin', raise_if_not_found=False)
    return admin or env.user


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

    # /compras (07/09/2026, a pedido explícito: "esta de más, ya muestra los
    # productos en la página principal") -- la página de catálogo aparte se
    # saca del todo (ver categoria_template y producto_detalle_template, que
    # cubren lo mismo que hacía falta). Se deja la ruta como redirect, no se
    # borra: estaba en el sitemap (Google puede tener el link indexado) y
    # varios lugares del sitio la usaban como "volver al catálogo" -- mismo
    # criterio que /trabaja-con-nosotros más abajo.
    @http.route('/compras', type='http', auth='public', website=True, sitemap=False)
    def compras(self, **kwargs):
        return _redirect('/mi-sitio#productos')

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

    @http.route('/privacidad', type='http', auth='public', website=True, sitemap=True)
    def privacidad(self, **kwargs):
        return request.render('mi_sitio_web.privacidad_template', {})

    @http.route('/historia', type='http', auth='public', website=True, sitemap=True)
    def historia(self, **kwargs):
        data = _historia_data(request.env.lang)
        return request.render('mi_sitio_web.historia_template', {
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
                or len(email) > EMAIL_MAX_LEN
                or len(nombre) > NOMBRE_MAX_LEN
                or len(empresa) > NOMBRE_MAX_LEN
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

    # -----------------------------------------------------------------
    # Pedidos personalizados (21/09/2026, a pedido explícito: "haria
    # falta una seccion donde la gente pueda hacer pedidos
    # personalizados"). Primera vuelta: sección en la home
    # (#pedido-personalizado). Segunda vuelta, mismo día, a pedido
    # explícito de nuevo ("hacele una seccion apartada") -- página
    # propia, mismo criterio que /trabaja-con-nosotros (ver el
    # comentario largo en postulacion_templates.xml con la historia de
    # ese mismo vaivén).
    # -----------------------------------------------------------------

    @http.route('/pedido-personalizado', type='http', auth='public', website=True, sitemap=True)
    def pedido_personalizado_page(self, pedido_personalizado_error=None, **kwargs):
        return request.render('mi_sitio_web.pedido_personalizado_template', {
            'pedido_personalizado_error': pedido_personalizado_error,
        })

    @http.route('/mi-sitio/pedido-personalizado', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def pedido_personalizado(self, **post):
        nombre = (post.get('nombre') or '').strip()
        empresa = (post.get('empresa') or '').strip()
        email = (post.get('email') or '').strip()
        telefono = (post.get('telefono') or '').strip()
        detalle = (post.get('detalle') or '').strip()

        # Honeypot anti-bot: mismo patrón que /mi-sitio/contacto.
        if (post.get('sitio_web') or '').strip():
            return _redirect('/mi-sitio/gracias')

        if (not nombre or not email or not detalle
                or not EMAIL_RE.match(email)
                or len(email) > EMAIL_MAX_LEN
                or len(nombre) > NOMBRE_MAX_LEN
                or len(empresa) > NOMBRE_MAX_LEN
                or len(telefono) > TELEFONO_MAX_LEN
                or len(detalle) > MENSAJE_MAX_LEN):
            return _redirect('/pedido-personalizado?pedido_personalizado_error=campos')

        # Imagen de referencia -- opcional, a diferencia del CV de la
        # bolsa de trabajo (obligatorio). Mismo patrón de validación que
        # postulacion() más abajo: extensión primero, después tamaño
        # (leyendo un byte de más para detectar "demasiado grande" sin
        # cargar el archivo entero de más en memoria).
        imagen = request.httprequest.files.get('imagen')
        contenido_imagen = None
        if imagen and imagen.filename:
            extension = os.path.splitext(imagen.filename)[1].lower()
            if extension not in IMAGEN_EXTENSIONES_PERMITIDAS:
                return _redirect('/pedido-personalizado?pedido_personalizado_error=formato')
            contenido_imagen = imagen.read(IMAGEN_MAX_BYTES + 1)
            if len(contenido_imagen) > IMAGEN_MAX_BYTES:
                return _redirect('/pedido-personalizado?pedido_personalizado_error=tamano')

        medium = request.env.ref('utm.utm_medium_website', raise_if_not_found=False)

        # Prefijo distinto al de /mi-sitio/contacto ("Consulta web: ...")
        # para que Ventas distinga a simple vista, en la lista de
        # Oportunidades, un pedido a medida (con medidas/cantidad propias,
        # sin producto de catálogo asociado) de una consulta genérica.
        lead = request.env['crm.lead'].sudo().create({
            'name': 'Pedido personalizado: %s' % nombre,
            'contact_name': nombre,
            'partner_name': empresa,
            'email_from': email,
            'phone': telefono,
            'description': detalle,
            'medium_id': medium.id if medium else False,
        })

        if contenido_imagen:
            request.env['ir.attachment'].sudo().create({
                'name': imagen.filename,
                'datas': base64.b64encode(contenido_imagen),
                'res_model': 'crm.lead',
                'res_id': lead.id,
            })

        # Mismo patrón Post/Redirect/Get que /mi-sitio/contacto, y misma
        # página de agradecimiento -- no hace falta una propia solo para
        # cambiar el prefijo del Lead.
        return _redirect('/mi-sitio/gracias')

    # -----------------------------------------------------------------
    # Bolsa de trabajo (01/09/2026, a pedido explícito) -- "una sección
    # donde la gente pueda cargar su currículum para buscar trabajo en la
    # fábrica". Página propia otra vez desde el 10/09/2026 (a pedido
    # explícito, con screenshot: "hacele una sección aparte y sacalo de
    # la página principal") -- ver el comentario largo con la historia
    # completa en postulacion_templates.xml. Crea un hr.applicant real
    # (app de Selección de Personal), no un modelo propio -- mismo
    # criterio que pedidos/facturas.
    # -----------------------------------------------------------------

    @http.route('/trabaja-con-nosotros', type='http', auth='public', website=True, sitemap=True)
    def trabaja_con_nosotros(self, postulacion_error=None, **kwargs):
        return request.render('mi_sitio_web.trabaja_con_nosotros_template', {
            'postulacion_error': postulacion_error,
        })

    @http.route('/mi-sitio/postulacion', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def postulacion(self, **post):
        nombre = (post.get('nombre') or '').strip()
        email = (post.get('email') or '').strip()
        telefono = (post.get('telefono') or '').strip()
        puesto = (post.get('puesto') or '').strip()
        mensaje = (post.get('mensaje') or '').strip()

        # Honeypot anti-bot: mismo patrón que /mi-sitio/contacto. Fingimos
        # éxito para no darle pistas al bot, sin crear nada.
        if (post.get('sitio_web') or '').strip():
            return _redirect('/mi-sitio/postulacion/gracias')

        if (not nombre or not email or not EMAIL_RE.match(email)
                or len(email) > EMAIL_MAX_LEN
                or len(telefono) > TELEFONO_MAX_LEN
                or len(nombre) > NOMBRE_MAX_LEN
                or len(puesto) > NOMBRE_MAX_LEN
                or len(mensaje) > MENSAJE_MAX_LEN):
            return _redirect('/trabaja-con-nosotros?postulacion_error=campos')

        # El input file llega en request.httprequest.files (werkzeug), no
        # en **post -- ahí solo caen los campos de texto del form.
        cv = request.httprequest.files.get('cv')
        if not cv or not cv.filename:
            return _redirect('/trabaja-con-nosotros?postulacion_error=archivo')

        extension = os.path.splitext(cv.filename)[1].lower()
        if extension not in CV_EXTENSIONES_PERMITIDAS:
            return _redirect('/trabaja-con-nosotros?postulacion_error=formato')

        # Se lee como mucho CV_MAX_BYTES + 1 -- no CV_MAX_BYTES en sí, que
        # dejaría pasar un archivo un byte más grande sin darse cuenta --
        # así un archivo enorme nunca llega a cargarse entero en memoria
        # antes de rechazarlo por tamaño.
        contenido = cv.read(CV_MAX_BYTES + 1)
        if not contenido:
            return _redirect('/trabaja-con-nosotros?postulacion_error=archivo')
        if len(contenido) > CV_MAX_BYTES:
            return _redirect('/trabaja-con-nosotros?postulacion_error=tamano')

        job = request.env.ref('mi_sitio_web.hr_job_postulacion_espontanea', raise_if_not_found=False)
        medium = request.env.ref('utm.utm_medium_website', raise_if_not_found=False)

        applicant = request.env['hr.applicant'].sudo().create({
            'partner_name': nombre,
            'email_from': email,
            'partner_phone': telefono,
            'job_id': job.id if job else False,
            'medium_id': medium.id if medium else False,
        })

        if puesto:
            # message_post escapa un str común entero (a propósito, ver el
            # comentario en pedido_solicitar_cambio más abajo) -- se arma
            # a mano para poder mezclar la etiqueta fija (de confianza)
            # con el texto del postulante (sin confiar).
            cuerpo = 'Área de interés: ' + html.escape(puesto)
            if mensaje:
                cuerpo += '<br/><br/>' + html.escape(mensaje).replace('\n', '<br/>')
            applicant.message_post(body=Markup(cuerpo))
        elif mensaje:
            applicant.message_post(body=Markup(html.escape(mensaje).replace('\n', '<br/>')))

        request.env['ir.attachment'].sudo().create({
            'name': cv.filename,
            'datas': base64.b64encode(contenido),
            'res_model': 'hr.applicant',
            'res_id': applicant.id,
        })

        return _redirect('/mi-sitio/postulacion/gracias')

    @http.route('/mi-sitio/postulacion/gracias', type='http', auth='public', website=True, sitemap=False)
    def postulacion_gracias(self, **kwargs):
        return request.render('mi_sitio_web.postulacion_gracias_template', {})

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

    # Buscador de pedido sin cuenta (31/08/2026, a pedido explícito;
    # rehecho el 09/09/2026, también a pedido explícito) -- complementa
    # el link con token de /shop/confirmation ("Gestionar mi pedido")
    # para quien ya no lo tiene a mano.
    #
    # Primera versión: pedía número de pedido + documento juntos (como
    # un rastreo de paquetería), porque el documento solo no es un dato
    # secreto. Cambiado a pedido explícito del usuario: el documento es
    # OPCIONAL en el checkout (ver WebsiteSaleHores, más abajo, "todo
    # opcional salvo nombre/email/teléfono") -- exigirlo siempre dejaba
    # afuera a cualquiera que no lo haya cargado, y encima el cliente no
    # necesariamente se acuerda del número de pedido. Ahora alcanza con
    # UN solo dato -- el que sea de los que se piden en el checkout
    # (documento, email o teléfono) -- y trae TODOS los pedidos de esa
    # persona, no uno solo. Sigue siendo el mismo criterio de fondo que
    # antes (algo que el cliente cargó al pedir, no algo secreto de
    # verdad) -- ver _pedidos_por_dato() por cómo se compara sin repetir
    # el bug de '%'/'_' como comodín de SQL ya encontrado acá antes.
    @http.route('/mi-sitio/consultar-pedido', type='http', auth='public',
                website=True, methods=['GET', 'POST'], sitemap=False)
    def consultar_pedido(self, **post):
        error = False
        pedidos = request.env['sale.order']
        if request.httprequest.method == 'POST':
            pedidos = _pedidos_por_dato(request.env, post.get('dato'))
            if len(pedidos) == 1:
                order = pedidos
                return _redirect('/mi-sitio/pedido/%d/gestionar?token=%s'
                                  % (order.id, order._portal_ensure_token()))
            error = not pedidos
        return request.render('mi_sitio_web.consultar_pedido_template', {
            'error': error,
            'pedidos': pedidos.sorted(key=lambda o: o.date_order, reverse=True),
        })

    @http.route('/mi-sitio/pedido/<int:order_id>/gestionar', type='http', auth='public', website=True, sitemap=False)
    def pedido_gestionar(self, order_id, token=None, ok=None, **kwargs):
        order = _pedido_por_token(order_id, token)
        if not order:
            raise request.not_found()
        return request.render('mi_sitio_web.pedido_gestionar_template', {
            'order': order,
            'token': token,
            'gestionable': _pedido_gestionable(order),
            # Solo facturas ya confirmadas (state='posted') -- un borrador
            # todavía puede cambiar de monto/fecha, no es lo que el cliente
            # tiene que ver ni descargar como si fuera definitivo.
            'facturas': order.invoice_ids.filtered(lambda m: m.state == 'posted'),
            'ok': ok,
        })

    @http.route('/mi-sitio/pedido/<int:order_id>/factura/<int:move_id>', type='http', auth='public', website=True, sitemap=False)
    def pedido_factura_pdf(self, order_id, move_id, token=None, **kwargs):
        """Descarga el PDF de una factura ya confirmada de este pedido --
        mismo mecanismo de token que el resto de la autogestión (sin
        login). No alcanza con validar el token contra el pedido solo:
        hay que confirmar además que esa factura puntual pertenece a ESTE
        pedido (si no, alguien con un link válido de un pedido propio
        podría cambiar el número de factura en la URL y bajarse la de
        cualquier otro cliente) y que ya está confirmada -- un borrador no
        se expone nunca por acá, ver pedido_gestionar()."""
        order = _pedido_por_token(order_id, token)
        if not order:
            raise request.not_found()
        factura = order.invoice_ids.filtered(lambda m: m.id == move_id and m.state == 'posted')
        if not factura:
            raise request.not_found()
        pdf_content, _ = request.env['ir.actions.report'].sudo()._render_qweb_pdf(
            'account.account_invoices', factura.ids)
        return request.make_response(pdf_content, headers=[
            ('Content-Type', 'application/pdf'),
            ('Content-Disposition', 'inline; filename="%s.pdf"' % factura.name.replace('/', '-')),
        ])

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
            # Antes caía directo en request.env.user si el pedido no
            # tenía vendedor asignado -- el mismo bug de "actividad
            # asignada al Usuario Público" que se encontró y arregló
            # para cliente nuevo (ver _elegir_responsable_actividad),
            # sin que nadie hubiera notado que acá seguía igual
            # (encontrado en revisión de código, 07/09/2026).
            responsable = _elegir_responsable_actividad(
                request.env, team=order.team_id, preferido=order.user_id)
            order.activity_schedule(
                'mail.mail_activity_data_todo',
                summary='Cliente pidió un cambio en este pedido (sitio web)',
                user_id=responsable.id,
            )
        return _redirect('/mi-sitio/pedido/%d/gestionar?token=%s&ok=cambio' % (order_id, token or ''))


class WebsiteSaleHores(WebsiteSale):
    """Extiende el checkout nativo de website_sale (no una ruta propia —
    ver como se hereda un controlador de Odoo por herencia de clase
    normal de Python, sin @route nuevo, para pisar un método puntual).

    A pedido explícito (28/08/2026, con screenshot): calle, depto,
    ciudad, código postal y país salen del formulario de dirección del
    checkout — se ocultan en la plantilla (ver
    ecommerce_theme_templates.xml) y acá se saca la validación que los
    exige, para que ocultarlos no rompa el envío del formulario. La
    dirección de entrega se termina de coordinar a mano (WhatsApp/mail)
    después del pedido, no en el checkout — decisión explícita del
    usuario, no completar nada de esto "por dentro" tampoco.

    "Responsabilidad de ARCA" también se sacó del formulario (mismo
    pedido), pero a ese sí hubo que completarlo "por dentro" (con un
    <input type="hidden">, en la misma plantilla) — sacarlo del todo
    rompía la creación del cliente por un bug real de l10n_ar que no
    maneja el caso de que ese campo llegue vacío. Ver el comentario largo
    en ecommerce_theme_templates.xml, junto al xpath de ese campo."""

    def _get_mandatory_address_fields(self, country_sudo):
        return set()

    # Campos que l10n_latam_base/l10n_ar exigen en la dirección de
    # facturación (vía _get_mandatory_billing_address_fields) que este
    # checkout no pide -- reusado por _validate_address_values (lo que
    # ve el cliente al mandar el formulario) y por _check_billing_address
    # (lo que decide si el checkout deja avanzar de dirección a pago,
    # ANTES de que el cliente llegue a mandar nada). Ver el comentario
    # largo en _validate_address_values de por qué no alcanza con
    # sobrescribir _get_mandatory_billing_address_fields directamente.
    _CAMPOS_FACTURACION_OMITIDOS = frozenset({'l10n_latam_identification_type_id', 'vat'})

    def _check_billing_address(self, partner_sudo):
        """Encontrado el 02/09/2026, después de arreglar
        _validate_address_values (que corrige el error que ve el
        cliente al mandar el formulario, pero no evita que se lo mande
        de vuelta al mismo paso): _check_addresses llama a este método
        ANTES de dejarlo llegar a /shop/payment, y este NO pasa por
        _validate_address_values -- llama directo a
        _get_mandatory_billing_address_fields y exige que TODOS esos
        campos tengan algún valor en el partner ya guardado. Como
        vat/l10n_latam_identification_type_id quedan vacíos a propósito,
        sin este fix el checkout entraba en bucle infinito: cada visita
        a /shop/payment (o a /shop/checkout) rebotaba de nuevo a
        /shop/address?...billing, sin ningún error visible que lo
        explicara -- se encontró recorriendo el flujo completo con
        Chrome headless, no alcanzaba con revisar que el formulario se
        mandara bien."""
        mandatory_fields = set(super()._get_mandatory_billing_address_fields(partner_sudo.country_id))
        mandatory_fields -= self._CAMPOS_FACTURACION_OMITIDOS
        return all(partner_sudo.read(list(mandatory_fields))[0].values())

    def _validate_address_values(self, address_values, partner_sudo, address_type,
                                  use_delivery_as_billing, required_fields, **kwargs):
        """Se saca la obligatoriedad de Tipo/Número de Identificación
        (l10n_latam_identification_type_id, vat) para este checkout,
        mismo criterio que _get_mandatory_address_fields de arriba
        (todo opcional salvo nombre/email/teléfono, se coordina por
        WhatsApp/mail después del pedido). Esos dos campos los exige
        l10n_latam_base vía _get_mandatory_billing_address_fields cada
        vez que la compañía es de Latinoamérica (siempre, acá) y se
        confirma "entrega y facturación al mismo tiempo" (el caso
        normal de este checkout, un solo formulario para las dos).

        Encontrado el 02/09/2026: sobrescribir
        _get_mandatory_billing_address_fields (como ya se hace arriba
        con _get_mandatory_address_fields) NO alcanza acá -- Odoo arma
        el controlador combinando TODOS los controllers que tocan estos
        hooks (L10nARPortalAccount, L10nLatamBasePortalAccount, este) en
        una sola clase con herencia múltiple, y por algún criterio de
        Odoo que no depende de las dependencias declaradas en
        __manifest__.py (se probó agregando 'l10n_ar' ahí, no cambió
        nada -- confirmado imprimiendo type(self).__mro__ en runtime),
        L10nARPortalAccount queda ANTES que este controlador en el MRO.
        Como su código es "pedir el resultado de más abajo con super() y
        SUMARLE sus propios campos", cualquier cosa que este controlador
        devuelva ahí (incluso un set() vacío) queda pisada por esa suma
        posterior -- no hay forma de anular eso desde ese método en
        particular, sin importar qué se le reste/devuelva.

        En cambio, filtrar acá (en _validate_address_values, que es lo
        que arma la respuesta final que ve el cliente) sí funciona
        siempre, sin depender del MRO: l10n_ar solo agrega algo EXTRA a
        esta misma función cuando address_type == 'billing' (ver
        l10n_ar/controllers/portal.py) -- eso pasa en el segundo paso
        del checkout (address_type llega en 'delivery' en el primer
        formulario, 'billing' en el segundo), pero esa rama de l10n_ar
        igual no suma nada dañino: como acá l10n_latam_identification_type_id
        siempre llega vacío, `id_type = ...browse(None)` da un recordset
        vacío y esa función corta con un `return` temprano
        ("not id_type... skip the validation") antes de llegar a agregar
        nada. Verificado con Chrome headless los dos pasos completos del
        checkout (dirección + facturación) sin errores."""
        invalid_fields, missing_fields, error_messages = super()._validate_address_values(
            address_values, partner_sudo, address_type, use_delivery_as_billing,
            required_fields, **kwargs,
        )
        skip = self._CAMPOS_FACTURACION_OMITIDOS
        original_invalid, original_missing = invalid_fields, missing_fields
        invalid_fields = invalid_fields - skip
        missing_fields = missing_fields - skip
        if (
            original_missing and original_missing <= skip
            and not original_invalid
            and not invalid_fields and not missing_fields
        ):
            # Si TODO lo que faltaba/estaba mal eran justo estos dos
            # campos (nada más quedó pendiente después de sacarlos), el
            # mensaje genérico ("Algunos campos obligatorios están
            # vacíos") queda huérfano -- se limpia para no confundir con
            # un error que ya no aplica. No se compara por texto (probado
            # primero, no funcionaba: `_()` acá arma el mensaje con un
            # contexto de traducción distinto al de portal.py, así que
            # la comparación de strings nunca daba igual) -- se decide
            # solo por el estado antes/después de sacar `skip`.
            error_messages = []
        return invalid_fields, missing_fields, error_messages

    # ------------------------------------------------------------------
    # Cliente nuevo vs. cliente con pedidos anteriores (02/09/2026, a
    # pedido explícito de Leandro, vía WhatsApp): separar el flujo de
    # ventas del sitio en dos caminos. Un cliente que YA tiene algún
    # pedido anterior sigue el camino que ya existía (llega derecho a
    # sale.order, "pedido por facturar", sin pasar por CRM). Uno que
    # NUNCA hizo un pedido antes arma el carrito igual que siempre, pero
    # al llegar al paso de pago no ve el pago en sí: se le crea una
    # oportunidad en CRM con el detalle de lo que eligió, se avisa al
    # equipo comercial (actividad de Odoo + notificación — el email
    # todavía no funciona, falta configurar el servidor SMTP saliente,
    # ver conversación) y se lo manda a la página de agradecimiento en
    # vez de dejarlo pagar. El pedido en sí (todavía sin confirmar en
    # ese punto) se cancela — no queda un "pedido por facturar" fantasma
    # dando vueltas en Ventas por una compra que en realidad tiene que
    # pasar por Preventas primero.
    def _es_cliente_nuevo(self, order_sudo):
        partner = order_sudo.partner_id
        website_partner = order_sudo.website_id.partner_id
        if not partner or partner == website_partner:
            # Sin dirección cargada todavía (visitante público, sin
            # partner propio asignado al carrito) -- no hay con qué
            # buscar pedidos anteriores, se trata como nuevo.
            return True
        # No cuenta como "ya compró antes" un carrito abandonado (draft/
        # sent, nunca confirmado) ni, sobre todo, un pedido cancelado por
        # el propio sitio al detectar un cliente nuevo (ver más abajo,
        # mi_sitio_lead_cancelado). Encontrado el 04/09/2026 (bug real,
        # reportado por el usuario: "no te pide los datos"): sin excluir
        # esto último, el propio pedido que este método cancela un par de
        # líneas más abajo (para un cliente nuevo, ver
        # _crear_oportunidad_desde_carrito) quedaba contando como
        # "pedido anterior" -- la SEGUNDA vez que la misma persona (mismo
        # email, mismo navegador) pedía algo, la clasificaba como
        # cliente existente por error: saltaba directo a pago sin pasar
        # por CRM, y como el navegador ya tenía guardados nombre/email/
        # teléfono de la vez anterior (Odoo reutiliza esos datos dentro
        # de la misma sesión, comportamiento nativo), ni siquiera volvía
        # a pedirlos -- daba la sensación de que el pedido se hacía sin
        # ningún dato.
        #
        # El primer arreglo de este bug (04/09/2026) filtraba por
        # state='sale' a secas -- de paso resolvía lo de arriba, pero
        # traía un efecto secundario real encontrado en una revisión de
        # código posterior: un cliente que compró de verdad y DESPUÉS
        # canceló su propio pedido (con el botón de autogestión, ver
        # pedido_cancelar más abajo) también quedaba tratado como
        # "nuevo" en su siguiente compra -- ya no está en 'sale', pasó a
        # 'cancel' igual que el caso que se quería excluir, sin forma de
        # distinguir los dos casos solo mirando el estado actual (los dos
        # terminan en 'cancel', uno nunca fue un pedido real y el otro
        # sí). Por eso mi_sitio_lead_cancelado existe como marca aparte
        # (ver models/sale_order.py): en vez de basarse en el estado,
        # excluye puntualmente los pedidos que ESTE método canceló -- así
        # un pedido cancelado por cualquier otro motivo (el cliente lo
        # canceló él mismo después de confirmarlo, o alguien de Ventas lo
        # canceló) sigue contando como "ya es cliente".
        domain = [
            ('id', '!=', order_sudo.id),
            ('state', 'not in', ('draft', 'sent')),
            ('mi_sitio_lead_cancelado', '=', False),
        ]
        email = (partner.email or '').strip()
        if email:
            # '=ilike' para que "Juan@Gmail.com" y "juan@gmail.com" cuenten
            # como el mismo cliente (encontrado el 04/09/2026 en revisión
            # de código: con '=' a secas, una mayúscula distinta entre un
            # pedido y el siguiente lo clasificaba como cliente nuevo otra
            # vez). OJO: '=ilike' interpreta '%'/'_' del valor como
            # comodines de SQL igual que 'ilike' (no es solo case-
            # insensitive) -- mismo bug de fondo que el de
            # consultar_pedido() más abajo si no se escapan. Se usa el
            # escape_psql() de Odoo (odoo/tools/sql.py, el mismo que usa
            # el propio res.users de Odoo para este mismo caso) en vez de
            # reinventarlo a mano -- la primera versión de esto (regex
            # propia) no escapaba barras invertidas, encontrado en
            # segunda revisión de código el mismo día. El .strip() de
            # arriba es por lo mismo: un espacio de más al pegar el email
            # (autocompletado, copiar/pegar) también rompía la
            # comparación exacta de '=ilike' (encontrado en tercera
            # revisión de código) -- no corrige un email que ya haya
            # quedado guardado con espacios de antes, pero evita que este
            # mismo pedido introduzca uno nuevo.
            domain += ['|', ('partner_id', '=', partner.id), ('partner_id.email', '=ilike', escape_psql(email))]
        else:
            domain += [('partner_id', '=', partner.id)]
        return not request.env['sale.order'].sudo().search_count(domain, limit=1)

    def _crear_oportunidad_desde_carrito(self, order_sudo):
        partner = order_sudo.partner_id
        lineas = '\n'.join(
            '- %s x%s' % (line.product_id.display_name, int(line.product_uom_qty))
            for line in order_sudo.order_line
            if not line.display_type
        )
        medium = request.env.ref('utm.utm_medium_website', raise_if_not_found=False)
        # .sudo() acá es necesario, no solo prolijo: más abajo se leen
        # team.user_id y team.member_ids (dentro de
        # _elegir_responsable_actividad) para elegir el responsable, y
        # 'Sales Team' (crm.team) no es un modelo con lectura pública --
        # sin sudo(), un visitante realmente anónimo (sin ninguna sesión
        # previa) se encontraba con un 403 al llegar a /shop/payment como
        # cliente nuevo (bug real, reportado por el usuario probando en
        # incógnito, 09/09/2026). medium (arriba) no necesita lo mismo:
        # de ese solo se usa el .id más abajo, nunca se leen sus campos.
        team = (request.env.ref('sales_team.team_sales_department', raise_if_not_found=False)
                or request.env['crm.team']).sudo()
        # El responsable de la ACTIVIDAD (el aviso de "hay un cliente
        # nuevo") no es lo mismo que el vendedor asignado a la
        # oportunidad -- ver el 'user_id': False de abajo para el
        # porqué. Igual hace falta elegirlo acá antes, no solo para la
        # actividad más abajo.
        responsable = _elegir_responsable_actividad(request.env, team=team)
        lead = request.env['crm.lead'].sudo().create({
            'name': 'Pedido web (cliente nuevo): %s' % (partner.name or order_sudo.name),
            # partner_id, no solo contact_name/email_from/phone sueltos: el
            # checkout ya creó (o reusó) un res.partner real para este
            # pedido -- sin este link, la oportunidad quedaba con los
            # datos de contacto sueltos pero sin conectar con la ficha del
            # cliente, así que Ventas tenía que volver a buscarlo/crearlo a
            # mano al convertir la oportunidad en cotización, en vez de que
            # Odoo la complete sola (encontrado en revisión de código,
            # 07/09/2026).
            'partner_id': partner.id if partner != order_sudo.website_id.partner_id else False,
            'contact_name': partner.name,
            'partner_name': partner.commercial_company_name or '',
            'email_from': partner.email or '',
            'phone': partner.phone or '',
            'description': 'Productos consultados desde el sitio (pedido %s, cancelado -- '
                            'primero pasa por acá):\n%s' % (order_sudo.name, lineas),
            'medium_id': medium.id if medium else False,
            'team_id': team.id if team else False,
            # SIN vendedor asignado, a propósito -- a pedido explícito
            # del usuario (09/09/2026): el sitio no tiene que decidir
            # quién de Ventas se hace cargo, eso lo elige Ventas mismo
            # desde Odoo (se la asignan a sí mismos cuando la ven). Si
            # se deja este campo afuera del create() sin más, crm.lead
            # cae en su propio default (lambda: self.env.user) -- y
            # como esto corre bajo sudo() (que cambia los PERMISOS pero
            # no la identidad de "usuario actual" para calcular
            # defaults), en una ruta pública ese default sigue
            # resolviendo al "Usuario Público" de Odoo, el mismo bug de
            # fondo que ya se había encontrado y arreglado FIJANDO un
            # responsable acá (ver historial de este archivo) -- ahora
            # se corrige distinto, poniendo False explícito para que
            # quede realmente sin nadie (no "Usuario Público" tampoco),
            # y quien reciba el AVISO (más abajo, la actividad) sigue
            # siendo una persona real de todos modos.
            'user_id': False,
        })
        # Notificación de Odoo para todo el equipo (campanita) -- se
        # postea el mensaje CON partner_ids en vez de solo suscribirlos:
        # message_subscribe por sí solo no avisa nada retroactivo, recién
        # notifica de mensajes FUTUROS -- con partner_ids en message_post
        # los suscribe Y les llega la notificación de este mensaje en el
        # mismo paso. Además, actividad "A hacer" para el responsable del
        # equipo -- mismo mecanismo que ya usa pedido_solicitar_cambio
        # más abajo para avisar de un pedido de cambio.
        lead.message_post(
            body='Oportunidad creada automáticamente: cliente nuevo desde el sitio web.',
            partner_ids=lead.team_id.member_ids.mapped('partner_id').ids,
        )
        # Misma persona que ya quedó como vendedor asignado más arriba --
        # ver ese comentario para el porqué (nunca request.env.user acá,
        # es una ruta pública/anónima).
        lead.activity_schedule(
            'mail.mail_activity_data_todo',
            summary='Cliente nuevo desde el sitio — armar presupuesto/seguimiento',
            user_id=responsable.id,
        )
        return lead

    @http.route('/shop/payment', type='http', auth='public', website=True, sitemap=False)
    def shop_payment(self, **post):
        order_sudo = request.cart
        # Misma validación que hace shop_payment original antes de
        # mostrar nada (carrito vacío, sin dirección todavía, etc.) --
        # se llama acá primero para no crear una oportunidad ni cancelar
        # nada a partir de un carrito que en realidad todavía no llegó a
        # este paso de forma válida.
        if redirection := self._check_cart_and_addresses(order_sudo):
            return redirection
        if self._es_cliente_nuevo(order_sudo):
            self._crear_oportunidad_desde_carrito(order_sudo)
            # mi_sitio_lead_cancelado=True ANTES de cancelar (no importa
            # el orden real de escritura, pero así queda junto al resto
            # de los cambios de este mismo pedido) -- ver el comentario
            # largo en _es_cliente_nuevo de por qué hace falta esta marca
            # aparte del estado en sí.
            order_sudo.sudo().write({'mi_sitio_lead_cancelado': True})
            order_sudo.sudo().action_cancel()
            return _redirect('/mi-sitio/gracias')
        return super().shop_payment(**post)

    # /shop (la grilla de productos nativa de website_sale, distinta de
    # nuestro catálogo propio) redirige derecho a la sección de productos de
    # la página principal — a pedido explícito (28/08/2026, con screenshot:
    # "no sirve y no lo quieren"; actualizado 07/09/2026 cuando se sacó la
    # página de catálogo aparte, ver /compras más arriba). Mismas 4
    # variantes de ruta que declara el método original (con página, con
    # categoría, con categoría + página) para taparlas todas — si se deja
    # alguna sin redirigir, se sigue llegando a la grilla nativa por ese
    # camino. El carrito y el checkout (/shop/cart, /shop/checkout,
    # /shop/payment, etc.) son rutas aparte, no se tocan: "Agregar al
    # carrito" nunca visita /shop en sí, así que nada de esto rompe el flujo
    # de pedido — ver DOCS/07-pedidos.md.
    @http.route([
        '/shop',
        '/shop/page/<int:page>',
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>',
    ], type='http', auth='public', website=True, sitemap=False)
    def shop(self, *args, **kwargs):
        return _redirect('/mi-sitio#productos')
