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
    ('Trabajá con nosotros', 'Trabajá con nosotros', 'Work with us', 'Trabalhe conosco',
     'Lavora con noi', 'Travaillez avec nous', 'Arbeite mit uns', '加入我们'),
    ('Contacto', 'Contacto', 'Contact', 'Contato', 'Contatti', 'Contact', 'Kontakt', '联系我们'),
    ('<span>© 2026 Cartotécnica Hores — Moldes de papel para panificación</span><span>Pan dulce · Budín · Rosca · Bizcochuelo · Pan de Pascua</span>',
     '<span>© 2026 Cartotécnica Hores — Moldes de papel para panificación</span><span>Pan dulce · Budín · Rosca · Bizcochuelo · Pan de Pascua</span>',
     '<span>© 2026 Cartotécnica Hores — Paper molds for baking</span><span>Panettone · Pound cake · Ring cake · Sponge cake · Christmas bread</span>',
     '<span>© 2026 Cartotécnica Hores — Moldes de papel para panificação</span><span>Panetone · Bolo inglês · Rosca · Pão de ló · Pão de Natal</span>',
     '<span>© 2026 Cartotécnica Hores — Stampi di carta per la panificazione</span><span>Panettone · Plumcake · Ciambella · Pan di Spagna · Pane di Pasqua</span>',
     '<span>© 2026 Cartotécnica Hores — Moules en papier pour la boulangerie</span><span>Panettone · Cake · Couronne · Génoise · Pain de Pâques</span>',
     '<span>© 2026 Cartotécnica Hores — Papierformen für die Bäckerei</span><span>Panettone · Kastenform · Kranzkuchen · Biskuit · Osterbrot</span>',
     '<span>© 2026 Cartotécnica Hores — 烘焙用纸模</span><span>圣诞面包 · 磅蛋糕 · 环形蛋糕 · 海绵蛋糕 · 复活节面包</span>'),
    ('Escribinos por WhatsApp', 'Escribinos por WhatsApp', 'Write to us on WhatsApp', 'Escreva-nos pelo WhatsApp',
     'Scrivici su WhatsApp', 'Écrivez-nous sur WhatsApp', 'Schreib uns auf WhatsApp', '通过WhatsApp联系我们'),
    ('Volver arriba', 'Volver arriba', 'Back to top', 'Voltar ao topo', 'Torna su', 'Retour en haut', 'Nach oben', '返回顶部'),
]

bulk_translate(VIEW_ID, ROWS)
