# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1443  # producto_detalle_template
SPAN12 = '<span style="display:block; font-size:12.5px; font-weight:600; color:#5a4f44; margin-bottom:5px;">{}</span>'

ROWS = [
    ("— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores",
     "— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores", "— Cartotécnica Hores"),
    ("← Catálogo", "← Catálogo", "← Catalog", "← Catálogo", "← Catalogo", "← Catalogue", "← Katalog", "← 目录"),
    ("Disponible", "Disponible", "Available", "Disponível", "Disponibile", "Disponible", "Verfügbar", "现货"),
    ("A pedido", "A pedido", "Made to order", "Sob encomenda", "Su richiesta", "Sur commande",
     "Auf Bestellung", "定制生产"),
    ("Sin stock", "Sin stock", "Out of stock", "Sem estoque", "Non disponibile", "Rupture de stock",
     "Nicht vorrätig", "缺货"),
    ("Consultar por WhatsApp", "Consultar por WhatsApp", "Ask on WhatsApp", "Consultar pelo WhatsApp",
     "Contattaci su WhatsApp", "Contacter sur WhatsApp", "Über WhatsApp anfragen", "通过WhatsApp咨询"),
    ("Agregar al carrito", "Agregar al carrito", "Add to cart", "Adicionar ao carrinho", "Aggiungi al carrello",
     "Ajouter au panier", "In den Warenkorb", "加入购物车"),
    ("Sin stock por el momento. Escribinos por WhatsApp y te avisamos apenas esté disponible.",
     "Sin stock por el momento. Escribinos por WhatsApp y te avisamos apenas esté disponible.",
     "Out of stock for now. Write to us on WhatsApp and we'll let you know as soon as it's available.",
     "Sem estoque no momento. Escreva para nós pelo WhatsApp e avisaremos assim que estiver disponível.",
     "Al momento non disponibile. Scrivici su WhatsApp e ti avviseremo non appena sarà disponibile.",
     "Actuellement en rupture de stock. Écrivez-nous sur WhatsApp et nous vous préviendrons dès que disponible.",
     "Derzeit nicht vorrätig. Schreiben Sie uns auf WhatsApp, wir informieren Sie, sobald es wieder verfügbar ist.",
     "目前缺货。请通过WhatsApp联系我们，一旦有货我们会通知您。"),
    ("Este molde se fabrica a pedido — puede demorar unos días en producción.",
     "Este molde se fabrica a pedido — puede demorar unos días en producción.",
     "This mold is made to order — production may take a few days.",
     "Este molde é fabricado sob encomenda — pode levar alguns dias de produção.",
     "Questo stampo viene prodotto su richiesta — la produzione può richiedere alcuni giorni.",
     "Ce moule est fabriqué sur commande — la production peut prendre quelques jours.",
     "Diese Form wird auf Bestellung gefertigt — die Produktion kann einige Tage dauern.",
     "该模具为定制生产 — 生产周期可能需要几天时间。"),
    (SPAN12.format("Tamaño*"), SPAN12.format("Tamaño*"), SPAN12.format("Size*"), SPAN12.format("Tamanho*"),
     SPAN12.format("Dimensione*"), SPAN12.format("Taille*"), SPAN12.format("Größe*"), SPAN12.format("尺寸*")),
    ('<option value="">Elegí un tamaño</option>', '<option value="">Elegí un tamaño</option>',
     '<option value="">Choose a size</option>', '<option value="">Escolha um tamanho</option>',
     '<option value="">Scegli una dimensione</option>', '<option value="">Choisissez une taille</option>',
     '<option value="">Größe auswählen</option>', '<option value="">选择尺寸</option>'),
    (SPAN12.format("Cantidad"), SPAN12.format("Cantidad"), SPAN12.format("Quantity"), SPAN12.format("Quantidade"),
     SPAN12.format("Quantità"), SPAN12.format("Quantité"), SPAN12.format("Menge"), SPAN12.format("数量")),
    ("Confirmar", "Confirmar", "Confirm", "Confirmar", "Conferma", "Confirmer", "Bestätigen", "确认"),
    ("Cancelar", "Cancelar", "Cancel", "Cancelar", "Annulla", "Annuler", "Abbrechen", "取消"),
    ("Características", "Características", "Features", "Características", "Caratteristiche",
     "Caractéristiques", "Merkmale", "特点"),
    ("Especificaciones técnicas", "Especificaciones técnicas", "Technical specifications", "Especificações técnicas",
     "Specifiche tecniche", "Spécifications techniques", "Technische Spezifikationen", "技术规格"),
    ("Variantes disponibles", "Variantes disponibles", "Available variants", "Variantes disponíveis",
     "Varianti disponibili", "Variantes disponibles", "Verfügbare Varianten", "可选规格"),
]

bulk_translate(VIEW_ID, ROWS)
