# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1441  # compras_template

ROWS = [
    ("Catálogo de moldes de papel — Cartotécnica Hores", "Catálogo de moldes de papel — Cartotécnica Hores",
     "Paper mold catalog — Cartotécnica Hores", "Catálogo de moldes de papel — Cartotécnica Hores",
     "Catalogo di stampi di carta — Cartotécnica Hores", "Catalogue de moules en papier — Cartotécnica Hores",
     "Katalog für Papierformen — Cartotécnica Hores", "纸模产品目录 — Cartotécnica Hores"),
    ("Moldes de papel para pan dulce, budín, rosca, bizcochuelo y pan de pascua. Consultá ficha técnica y especificaciones de cada línea.",
     "Moldes de papel para pan dulce, budín, rosca, bizcochuelo y pan de pascua. Consultá ficha técnica y especificaciones de cada línea.",
     "Paper molds for panettone, pound cake, ring cake, sponge cake and Christmas bread. Check the spec sheet and specifications for each line.",
     "Moldes de papel para panetone, bolo inglês, rosca, pão de ló e pão de Natal. Consulte a ficha técnica e as especificações de cada linha.",
     "Stampi di carta per panettone, plumcake, ciambella, pan di Spagna e pane di Pasqua. Consulta la scheda tecnica e le specifiche di ogni linea.",
     "Moules en papier pour panettone, cake, couronne, génoise et pain de Pâques. Consultez la fiche technique et les spécifications de chaque gamme.",
     "Papierformen für Panettone, Kastenform, Kranzkuchen, Biskuit und Osterbrot. Sehen Sie sich das Datenblatt und die Spezifikationen jeder Linie an.",
     "适用于圣诞面包、磅蛋糕、环形蛋糕、海绵蛋糕和复活节面包的纸模。查看各系列的技术规格表和详细规格。"),
    ("Catálogo", "Catálogo", "Catalog", "Catálogo", "Catalogo", "Catalogue", "Katalog", "目录"),
    ("Nuestros productos", "Nuestros productos", "Our products", "Nossos produtos", "I nostri prodotti",
     "Nos produits", "Unsere Produkte", "我们的产品"),
    ("Elegí una línea, revisá la ficha técnica y consultanos por WhatsApp para tu pedido.",
     "Elegí una línea, revisá la ficha técnica y consultanos por WhatsApp para tu pedido.",
     "Choose a line, check its spec sheet and message us on WhatsApp for your order.",
     "Escolha uma linha, veja a ficha técnica e fale conosco pelo WhatsApp para seu pedido.",
     "Scegli una linea, controlla la scheda tecnica e contattaci su WhatsApp per il tuo ordine.",
     "Choisissez une gamme, consultez la fiche technique et contactez-nous sur WhatsApp pour votre commande.",
     "Wählen Sie eine Linie, sehen Sie sich das Datenblatt an und kontaktieren Sie uns für Ihre Bestellung per WhatsApp.",
     "选择一个系列，查看技术规格表，并通过WhatsApp联系我们下单。"),
    ("Personalizable", "Personalizable", "Customizable", "Personalizável", "Personalizzabile", "Personnalisable",
     "Individualisierbar", "可定制"),
    ("A pedido", "A pedido", "Made to order", "Sob encomenda", "Su richiesta", "Sur commande",
     "Auf Bestellung", "定制生产"),
    ("Sin stock", "Sin stock", "Out of stock", "Sem estoque", "Non disponibile", "Rupture de stock",
     "Nicht vorrätig", "缺货"),
    ("Ficha técnica →", "Ficha técnica →", "Spec sheet →", "Ficha técnica →", "Scheda tecnica →",
     "Fiche technique →", "Datenblatt →", "技术规格表 →"),
    ("Consultar por WhatsApp", "Consultar por WhatsApp", "Ask on WhatsApp", "Consultar pelo WhatsApp",
     "Contattaci su WhatsApp", "Contacter sur WhatsApp", "Über WhatsApp anfragen", "通过WhatsApp咨询"),
]

bulk_translate(VIEW_ID, ROWS)
