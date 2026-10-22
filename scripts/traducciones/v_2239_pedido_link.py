# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 2239  # pedido_gestionar_link (inherit_id="website_sale.confirmation")

ROWS = [
    ("¿Necesita cancelar este pedido o pedir un cambio? Puede hacerlo sin crear una cuenta.",
     "¿Necesita cancelar este pedido o pedir un cambio? Puede hacerlo sin crear una cuenta.",
     "Need to cancel this order or request a change? You can do it without creating an account.",
     "Precisa cancelar este pedido ou solicitar uma alteração? Pode fazê-lo sem criar uma conta.",
     "Devi annullare questo ordine o richiedere una modifica? Puoi farlo senza creare un account.",
     "Besoin d'annuler cette commande ou de demander une modification ? Vous pouvez le faire sans créer de compte.",
     "Möchten Sie diese Bestellung stornieren oder eine Änderung beantragen? Das können Sie ohne Konto tun.",
     "需要取消此订单或申请变更？您无需创建账户即可完成。"),
    ("Gestionar mi pedido", "Gestionar mi pedido", "Manage my order", "Gerenciar meu pedido",
     "Gestisci il mio ordine", "Gérer ma commande", "Meine Bestellung verwalten", "管理我的订单"),
]

bulk_translate(VIEW_ID, ROWS)
