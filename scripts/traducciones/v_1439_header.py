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
    ('Mi cuenta', 'Mi cuenta', 'My account', 'Minha conta', 'Il mio account', 'Mon compte', 'Mein Konto', '我的账户'),
    # Este término incluye el <span> del ícono entero, no solo el texto
    # visible -- QWeb lo extrae así porque el ícono y "Ingresar" quedan
    # como hermanos dentro del mismo <a>, sin envolver "Ingresar" en su
    # propio tag (mismo patrón que otros spans+texto sueltos del sitio).
    ('<span aria-hidden="true" style="font-size:17px;">👤</span> Ingresar',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> Ingresar',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> Log in',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> Entrar',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> Accedi',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> Se connecter',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> Anmelden',
     '<span aria-hidden="true" style="font-size:17px;">👤</span> 登录'),
    ('Contacto', 'Contacto', 'Contact', 'Contato', 'Contatti', 'Contact', 'Kontakt', '联系我们'),
]

bulk_translate(VIEW_ID, ROWS)
