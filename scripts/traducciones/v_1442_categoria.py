# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1442  # categoria_template

ROWS = [
    ("— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores",
     "— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores"),
    ("Moldes de papel", "Moldes de papel", "Paper molds", "Moldes de papel", "Stampi di carta",
     "Moules en papier", "Papierformen", "纸模"),
    ("fabricados por Cartotécnica Hores. Aptos para contacto alimentario, consultá por WhatsApp.",
     "fabricados por Cartotécnica Hores. Aptos para contacto alimentario, consultá por WhatsApp.",
     "made by Cartotécnica Hores. Suitable for food contact, ask us on WhatsApp.",
     "fabricados pela Cartotécnica Hores. Próprios para contato com alimentos, consulte pelo WhatsApp.",
     "prodotti da Cartotécnica Hores. Adatti al contatto alimentare, contattaci su WhatsApp.",
     "fabriqués par Cartotécnica Hores. Adaptés au contact alimentaire, contactez-nous sur WhatsApp.",
     "hergestellt von Cartotécnica Hores. Für Lebensmittelkontakt geeignet, kontaktieren Sie uns über WhatsApp.",
     "由Cartotécnica Hores生产。适合接触食品，欢迎通过WhatsApp咨询。"),
    ("← Todo el catálogo", "← Todo el catálogo", "← Full catalog", "← Todo o catálogo", "← Tutto il catalogo",
     "← Tout le catalogue", "← Gesamter Katalog", "← 查看全部产品"),
    ("No hay productos publicados en esta categoría todavía.", "No hay productos publicados en esta categoría todavía.",
     "No products have been published in this category yet.", "Ainda não há produtos publicados nesta categoria.",
     "Non ci sono ancora prodotti pubblicati in questa categoria.", "Aucun produit n'est encore publié dans cette catégorie.",
     "In dieser Kategorie sind noch keine Produkte veröffentlicht.", "该分类下暂无已发布的产品。"),
    ("Ver todo el catálogo", "Ver todo el catálogo", "View full catalog", "Ver todo o catálogo",
     "Vedi tutto il catalogo", "Voir tout le catalogue", "Gesamten Katalog ansehen", "查看全部产品目录"),
    ("Personalizable", "Personalizable", "Customizable", "Personalizável", "Personalizzabile", "Personnalisable",
     "Individualisierbar", "可定制"),
    ("A pedido", "A pedido", "Made to order", "Sob encomenda", "Su richiesta", "Sur commande",
     "Auf Bestellung", "定制生产"),
    ("Sin stock", "Sin stock", "Out of stock", "Sem estoque", "Non disponibile", "Rupture de stock",
     "Nicht vorrätig", "缺货"),
    ("Ver ficha técnica completa →", "Ver ficha técnica completa →", "View full spec sheet →",
     "Ver ficha técnica completa →", "Vedi la scheda tecnica completa →", "Voir la fiche technique complète →",
     "Vollständiges Datenblatt ansehen →", "查看完整技术规格表 →"),
    ("Consultar por WhatsApp", "Consultar por WhatsApp", "Ask on WhatsApp", "Consultar pelo WhatsApp",
     "Contattaci su WhatsApp", "Contacter sur WhatsApp", "Über WhatsApp anfragen", "通过WhatsApp咨询"),
]

bulk_translate(VIEW_ID, ROWS)
