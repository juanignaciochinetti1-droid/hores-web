import base64
import hmac
import html
import os
import re

from markupsafe import Markup

from odoo import http
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.http import request

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
NOMBRE_MAX_LEN = 200
MENSAJE_MAX_LEN = 5000

# Bolsa de trabajo (/trabaja-con-nosotros) -- ver postulacion() más abajo.
CV_EXTENSIONES_PERMITIDAS = ('.pdf', '.doc', '.docx')
CV_MAX_BYTES = 5 * 1024 * 1024  # 5 MB

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

_HISTORIA_IT = {
    # Aggiunto il 02/09/2026 insieme a francese, tedesco e cinese
    # semplificato -- vedi le note sulle fonti nel blocco es_AR più sopra
    # (stessi numeri/anni, tradotti).
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': 'anni di esperienza'},
        {'icon': '📦', 'value': '+500', 'label': 'stampi all\'anno'},
        {'icon': '🤝', 'value': '+150', 'label': 'clienti'},
        {'icon': '🌎', 'value': '8', 'label': 'paesi'},
    ],
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
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': 'ans d\'expérience'},
        {'icon': '📦', 'value': '+500', 'label': 'moules par an'},
        {'icon': '🤝', 'value': '+150', 'label': 'clients'},
        {'icon': '🌎', 'value': '8', 'label': 'pays'},
    ],
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
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': 'Jahre Erfahrung'},
        {'icon': '📦', 'value': '+500', 'label': 'Formen pro Jahr'},
        {'icon': '🤝', 'value': '+150', 'label': 'Kunden'},
        {'icon': '🌎', 'value': '8', 'label': 'Länder'},
    ],
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
    'stats': [
        {'icon': '📅', 'value': '+31', 'label': '年经验'},
        {'icon': '📦', 'value': '+500', 'label': '年产模具数'},
        {'icon': '🤝', 'value': '+150', 'label': '客户'},
        {'icon': '🌎', 'value': '8', 'label': '国家'},
    ],
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
    def home(self, contacto_error=None, postulacion_error=None, **kwargs):
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
            'postulacion_error': postulacion_error,
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

    @http.route('/privacidad', type='http', auth='public', website=True, sitemap=True)
    def privacidad(self, **kwargs):
        return request.render('mi_sitio_web.privacidad_template', {})

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
    # Bolsa de trabajo (01/09/2026, a pedido explícito) -- "una sección
    # donde la gente pueda cargar su currículum para buscar trabajo en la
    # fábrica". Vive como una sección más de /mi-sitio (#trabaja-con-nosotros
    # en website_templates.xml, mismo patrón que #contacto) -- a pedido
    # explícito (01/09/2026): "que esta nueva sección esté en la página
    # principal y no esté apartado". Antes era una página propia
    # (/trabaja-con-nosotros); esa ruta se deja como redirect por si quedó
    # algún link guardado. Crea un hr.applicant real (app de Selección de
    # Personal), no un modelo propio -- mismo criterio que pedidos/facturas.
    # Ver el comentario largo en postulacion_templates.xml.
    # -----------------------------------------------------------------

    @http.route('/trabaja-con-nosotros', type='http', auth='public', website=True, sitemap=False)
    def trabaja_con_nosotros(self, **kwargs):
        return _redirect('/mi-sitio#trabaja-con-nosotros')

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
                or len(nombre) > NOMBRE_MAX_LEN
                or len(puesto) > NOMBRE_MAX_LEN
                or len(mensaje) > MENSAJE_MAX_LEN):
            return _redirect('/mi-sitio?postulacion_error=campos#trabaja-con-nosotros')

        # El input file llega en request.httprequest.files (werkzeug), no
        # en **post -- ahí solo caen los campos de texto del form.
        cv = request.httprequest.files.get('cv')
        if not cv or not cv.filename:
            return _redirect('/mi-sitio?postulacion_error=archivo#trabaja-con-nosotros')

        extension = os.path.splitext(cv.filename)[1].lower()
        if extension not in CV_EXTENSIONES_PERMITIDAS:
            return _redirect('/mi-sitio?postulacion_error=formato#trabaja-con-nosotros')

        # Se lee como mucho CV_MAX_BYTES + 1 -- no CV_MAX_BYTES en sí, que
        # dejaría pasar un archivo un byte más grande sin darse cuenta --
        # así un archivo enorme nunca llega a cargarse entero en memoria
        # antes de rechazarlo por tamaño.
        contenido = cv.read(CV_MAX_BYTES + 1)
        if not contenido:
            return _redirect('/mi-sitio?postulacion_error=archivo#trabaja-con-nosotros')
        if len(contenido) > CV_MAX_BYTES:
            return _redirect('/mi-sitio?postulacion_error=tamano#trabaja-con-nosotros')

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

    # Buscador de pedido sin cuenta (31/08/2026, a pedido explícito) --
    # complementa el link con token de /shop/confirmation ("Gestionar mi
    # pedido") para quien ya no lo tiene a mano. El DNI/CUIT solo no
    # alcanza para buscar -- no es un dato secreto, cualquiera que lo
    # sepa podría consultar el pedido de otra persona (dirección,
    # teléfono, qué compró). Se pide junto con el número de pedido (ej.
    # "S00057", visible en la página de gracias y en el email de
    # confirmación) -- hacen falta las dos cosas, como en un rastreo de
    # paquetería. Si coinciden, redirige a la misma página de gestión de
    # siempre (con el token real), no arma una vista aparte.
    @http.route('/mi-sitio/consultar-pedido', type='http', auth='public',
                website=True, methods=['GET', 'POST'], sitemap=False)
    def consultar_pedido(self, **post):
        error = False
        if request.httprequest.method == 'POST':
            # Mayúsculas a mano + '=' exacto, no '=ilike' -- '=ilike' no
            # escapa los comodines de SQL ('%', '_') que vengan en el
            # texto del cliente, así que un "número de pedido" como '%'
            # matcheaba CUALQUIER pedido (bug real, encontrado y probado
            # contra la base) y de paso anulaba el sentido de pedir
            # las dos cosas juntas (ver el comentario de más arriba).
            numero = (post.get('numero_pedido') or '').strip().upper()
            identificacion = _normalizar_identificacion(post.get('identificacion'))
            order = request.env['sale.order'].sudo()
            if numero and identificacion:
                order = order.search([('name', '=', numero)], limit=1)
            if (order and identificacion
                    and _normalizar_identificacion(order.partner_id.vat) == identificacion):
                return _redirect('/mi-sitio/pedido/%d/gestionar?token=%s'
                                  % (order.id, order._portal_ensure_token()))
            error = True
        return request.render('mi_sitio_web.consultar_pedido_template', {'error': error})

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
        # state='sale': solo cuenta como "ya compró antes" un pedido
        # REALMENTE confirmado -- ni un carrito abandonado (draft) ni,
        # sobre todo, uno cancelado. Encontrado el 04/09/2026 (bug real,
        # reportado por el usuario: "no te pide los datos"): sin este
        # filtro, el propio pedido que este método cancela un par de
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
        domain = [('id', '!=', order_sudo.id), ('state', '=', 'sale')]
        if partner.email:
            # '=ilike' para que "Juan@Gmail.com" y "juan@gmail.com" cuenten
            # como el mismo cliente (encontrado el 04/09/2026 en revisión
            # de código: con '=' a secas, una mayúscula distinta entre un
            # pedido y el siguiente lo clasificaba como cliente nuevo otra
            # vez). OJO: '=ilike' interpreta '%'/'_' del valor como
            # comodines de SQL igual que 'ilike' (no es solo case-
            # insensitive) -- mismo bug de fondo que el de
            # consultar_pedido() más abajo si no se escapan. Se neutralizan
            # acá antes de armar el dominio.
            email_escapado = re.sub(r'([%_])', r'\\\1', partner.email)
            domain += ['|', ('partner_id', '=', partner.id), ('partner_id.email', '=ilike', email_escapado)]
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
        team = request.env.ref('sales_team.team_sales_department', raise_if_not_found=False)
        lead = request.env['crm.lead'].sudo().create({
            'name': 'Pedido web (cliente nuevo): %s' % (partner.name or order_sudo.name),
            'contact_name': partner.name,
            'partner_name': partner.commercial_company_name or '',
            'email_from': partner.email or '',
            'phone': partner.phone or '',
            'description': 'Productos consultados desde el sitio (pedido %s, cancelado -- '
                            'primero pasa por acá):\n%s' % (order_sudo.name, lineas),
            'medium_id': medium.id if medium else False,
            'team_id': team.id if team else False,
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
        # A quién asignarle la actividad: el líder del equipo, o si no
        # hay líder cargado, cualquier miembro del equipo -- NUNCA
        # request.env.user acá (encontrado en revisión de código,
        # 04/09/2026): esta ruta es pública/anónima, así que
        # request.env.user en este contexto es el "Usuario Público" de
        # Odoo, no una persona real -- si el equipo se queda sin líder
        # (config que alguien podría cambiar sin querer), la actividad
        # quedaba asignada a una cuenta que nadie mira, invisible en la
        # práctica. Como último recurso, el admin en vez del usuario
        # público. OJO: crm.team.member_ids YA es un recordset de
        # res.users (no de crm.team.member) -- .user_id encima de eso
        # revienta con AttributeError ("res.users no tiene user_id"),
        # encontrado en una segunda revisión de código antes de
        # confirmar este mismo cambio.
        responsable = lead.team_id.user_id or lead.team_id.member_ids[:1]
        lead.activity_schedule(
            'mail.mail_activity_data_todo',
            summary='Cliente nuevo desde el sitio — armar presupuesto/seguimiento',
            user_id=responsable.id if responsable else request.env.ref('base.user_admin').id,
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
            order_sudo.sudo().action_cancel()
            return _redirect('/mi-sitio/gracias')
        return super().shop_payment(**post)

    # /shop (la grilla de productos nativa de website_sale, distinta de
    # nuestro catálogo propio en /compras) redirige derecho a /compras —
    # a pedido explícito (28/08/2026, con screenshot: "no sirve y no lo
    # quieren"). Mismas 4 variantes de ruta que declara el método
    # original (con página, con categoría, con categoría + página) para
    # taparlas todas — si se deja alguna sin redirigir, se sigue llegando
    # a la grilla nativa por ese camino. El carrito y el checkout
    # (/shop/cart, /shop/checkout, /shop/payment, etc.) son rutas
    # aparte, no se tocan: "Agregar al carrito" nunca visita /shop en sí,
    # así que nada de esto rompe el flujo de compra — ver
    # DOCS/07-pedidos.md.
    @http.route([
        '/shop',
        '/shop/page/<int:page>',
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>',
    ], type='http', auth='public', website=True, sitemap=False)
    def shop(self, *args, **kwargs):
        return _redirect('/compras')
