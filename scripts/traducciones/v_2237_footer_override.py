# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 2237  # footer_override -- boton "Volver al sitio" en /shop, carrito y checkout

ROWS = [
    ("<span aria-hidden=\"true\">←</span> Volver al sitio",
     "<span aria-hidden=\"true\">←</span> Volver al sitio",
     "<span aria-hidden=\"true\">←</span> Back to site",
     "<span aria-hidden=\"true\">←</span> Voltar ao site",
     "<span aria-hidden=\"true\">←</span> Torna al sito",
     "<span aria-hidden=\"true\">←</span> Retour au site",
     "<span aria-hidden=\"true\">←</span> Zurück zur Website",
     "<span aria-hidden=\"true\">←</span> 返回网站"),
]

bulk_translate(VIEW_ID, ROWS)
