# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1439  # site_header

# (clave_es, es, en, pt, it, fr, de, zh)
ROWS = [
    ('Empresa', 'Empresa', 'Company', 'Empresa', 'Azienda', 'Entreprise', 'Unternehmen', '公司'),
    ('Productos', 'Productos', 'Products', 'Produtos', 'Prodotti', 'Produits', 'Produkte', '产品'),
    ('Calidad', 'Calidad', 'Quality', 'Qualidade', 'Qualità', 'Qualité', 'Qualität', '品质'),
    ('Empleo', 'Empleo', 'Jobs', 'Vagas', 'Lavora con noi', 'Emplois', 'Karriere', '招聘'),
    ('Más', 'Más', 'More', 'Mais', 'Altro', 'Plus', 'Mehr', '更多'),
    ('Historia', 'Historia', 'History', 'História', 'Storia', 'Histoire', 'Geschichte', '历史'),
    ('Compromiso', 'Compromiso', 'Commitment', 'Compromisso', 'Impegno', 'Engagement', 'Engagement', '承诺'),
    ('FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ', '常见问题'),
    ('Carrito', 'Carrito', 'Cart', 'Carrinho', 'Carrello', 'Panier', 'Warenkorb', '购物车'),
    # Botón "Ingresar" (usuario no logueado) -- QWeb junta el <span> del
    # ícono y el <span>Ingresar</span> vecino en un solo término (los dos
    # son inline y ninguno tiene contenido "propio" que fuerce que se
    # separen), así que la clave tiene que incluir el ícono también. El
    # <span> del usuario logueado (con el nombre real vía t-esc) no hace
    # falta traducirlo -- un nombre propio es igual en todos los idiomas.
    ('<span aria-hidden="true">👤</span>\n          <span>Ingresar</span>',
     '<span aria-hidden="true">👤</span>\n          <span>Ingresar</span>',
     '<span aria-hidden="true">👤</span>\n          <span>Log in</span>',
     '<span aria-hidden="true">👤</span>\n          <span>Entrar</span>',
     '<span aria-hidden="true">👤</span>\n          <span>Accedi</span>',
     '<span aria-hidden="true">👤</span>\n          <span>Se connecter</span>',
     '<span aria-hidden="true">👤</span>\n          <span>Anmelden</span>',
     '<span aria-hidden="true">👤</span>\n          <span>登录</span>'),
    ('Contacto', 'Contacto', 'Contact', 'Contato', 'Contatti', 'Contact', 'Kontakt', '联系我们'),
]

bulk_translate(VIEW_ID, ROWS)
