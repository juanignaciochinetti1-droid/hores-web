# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 2242  # volver_al_carrito_texto -- "Realizar otro pedido" (website_sale.navigation_buttons)

ROWS = [
    ("<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Realizar otro pedido",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Realizar otro pedido",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Place another order",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Fazer outro pedido",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Effettua un altro ordine",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Passer une autre commande",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                Weitere Bestellung aufgeben",
     "<i class=\"fa fa-angle-left me-2 fw-light\"/>\n                再下一单"),
]

bulk_translate(VIEW_ID, ROWS)
