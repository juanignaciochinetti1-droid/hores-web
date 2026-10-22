# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1440  # site_footer

ROWS = [
    ('Moldes de papel para panificación. Bell Ville, Córdoba.',
     'Moldes de papel para panificación. Bell Ville, Córdoba.',
     'Paper molds for baking. Bell Ville, Córdoba.',
     'Moldes de papel para panificação. Bell Ville, Córdoba.',
     'Stampi di carta per la panificazione. Bell Ville, Córdoba.',
     'Moules en papier pour la boulangerie. Bell Ville, Córdoba.',
     'Papierformen für die Bäckerei. Bell Ville, Córdoba.',
     '烘焙用纸模。位于科尔多瓦贝尔维尔。'),
    ('Navegación', 'Navegación', 'Navigation', 'Navegação', 'Navigazione', 'Navigation', 'Navigation', '导航'),
    ('Empresa', 'Empresa', 'Company', 'Empresa', 'Azienda', 'Entreprise', 'Unternehmen', '公司'),
    ('Historia', 'Historia', 'History', 'História', 'Storia', 'Histoire', 'Geschichte', '历史'),
    ('Productos', 'Productos', 'Products', 'Produtos', 'Prodotti', 'Produits', 'Produkte', '产品'),
    ('Calidad', 'Calidad', 'Quality', 'Qualidade', 'Qualità', 'Qualité', 'Qualität', '品质'),
    ('Compromiso', 'Compromiso', 'Commitment', 'Compromisso', 'Impegno', 'Engagement', 'Engagement', '承诺'),
    ('FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ', '常见问题'),
    ('Consultar mi pedido', 'Consultar mi pedido', 'Look up my order', 'Consultar meu pedido',
     'Verifica il tuo ordine', 'Suivre ma commande', 'Bestellung nachverfolgen', '查询我的订单'),
    ('Trabaje con nosotros', 'Trabaje con nosotros', 'Work with us', 'Trabalhe conosco',
     'Lavora con noi', 'Travaillez avec nous', 'Arbeite mit uns', '加入我们'),
    ('Contacto', 'Contacto', 'Contact', 'Contato', 'Contatti', 'Contact', 'Kontakt', '联系我们'),
    # Las 2 filas de abajo reemplazan una fila vieja con una clave
    # combinada ("<span>copyright</span><span>tagline</span>" en un solo
    # termino) que dejo de matchear nada el dia que se agrego el link de
    # "Politica de Privacidad" DENTRO del segundo <span> -- la insercion
    # de un <a> ahi partio ese <span> en terminos nuevos y distintos
    # (el <a> por un lado, el texto suelto que le sigue por otro), asi
    # que la clave vieja quedo huerfana (corria sin error pero no
    # escribia nada, nunca matcheaba un termino real). Encontrado y
    # corregido en la auditoria del 22/10/2026 -- ver DOCS/06-idiomas.md.
    # "Pedido a medida" (nav, mismo caso que en site_header) se agrego
    # despues de que este script se escribio y nunca se tradujo.
    ('Pedido a medida', 'Pedido a medida', 'Custom order', 'Pedido personalizado',
     'Ordine personalizzato', 'Commande personnalisée', 'Individuelle Bestellung', '定制订单'),
    ('<span>© 2026 Cartotecnica Hores — Moldes de papel para panificación</span>',
     '<span>© 2026 Cartotecnica Hores — Moldes de papel para panificación</span>',
     '<span>© 2026 Cartotecnica Hores — Paper molds for baking</span>',
     '<span>© 2026 Cartotecnica Hores — Moldes de papel para panificação</span>',
     '<span>© 2026 Cartotecnica Hores — Stampi di carta per la panificazione</span>',
     '<span>© 2026 Cartotecnica Hores — Moules en papier pour la boulangerie</span>',
     '<span>© 2026 Cartotecnica Hores — Papierformen für die Bäckerei</span>',
     '<span>© 2026 Cartotecnica Hores — 烘焙用纸模</span>'),
    ('Política de Privacidad', 'Política de Privacidad', 'Privacy Policy', 'Política de Privacidade',
     'Informativa sulla Privacy', 'Politique de confidentialité', 'Datenschutzrichtlinie', '隐私政策'),
    ('· Pan dulce · Budín · Rosca · Bizcochuelo · Pan de Pascua',
     '· Pan dulce · Budín · Rosca · Bizcochuelo · Pan de Pascua',
     '· Panettone · Pound Cake · Ring Cake · Sponge Cake · Christmas Bread',
     '· Panetone · Bolo Inglês · Rosca · Pão de Ló · Pão de Natal',
     '· Panettone · Plumcake · Ciambella · Pan di Spagna · Pane di Natale',
     '· Panettone · Cake · Couronne · Gâteau Éponge · Pain de Noël',
     '· Panettone · Rührkuchen · Kranzkuchen · Biskuitkuchen · Weihnachtsbrot',
     '· 潘妮托尼 · 磅蛋糕 · 环形蛋糕 · 海绵蛋糕 · 圣诞面包'),
    ('Escríbanos por WhatsApp', 'Escríbanos por WhatsApp', 'Write to us on WhatsApp', 'Escreva-nos pelo WhatsApp',
     'Scrivici su WhatsApp', 'Écrivez-nous sur WhatsApp', 'Schreib uns auf WhatsApp', '通过WhatsApp联系我们'),
    ('Volver arriba', 'Volver arriba', 'Back to top', 'Voltar ao topo', 'Torna su', 'Retour en haut', 'Nach oben', '返回顶部'),
]

bulk_translate(VIEW_ID, ROWS)
