# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 2245  # consultar_pedido_template

ROWS = [
    ("Consultar mi pedido — Cartotécnica Hores", "Consultar mi pedido — Cartotécnica Hores",
     "Look up my order — Cartotécnica Hores", "Consultar meu pedido — Cartotécnica Hores",
     "Consulta il tuo ordine — Cartotécnica Hores", "Suivre ma commande — Cartotécnica Hores",
     "Bestellung nachverfolgen — Cartotécnica Hores", "查询我的订单 — Cartotécnica Hores"),
    ("Consultar mi pedido", "Consultar mi pedido", "Look up my order", "Consultar meu pedido",
     "Verifica il tuo ordine", "Suivre ma commande", "Bestellung nachverfolgen", "查询我的订单"),
    ("Ingresá el documento, el email o el teléfono que usaste al hacer el pedido.",
     "Ingresá el documento, el email o el teléfono que usaste al hacer el pedido.",
     "Enter the ID document, email, or phone number you used when placing the order.",
     "Digite o documento, o email ou o telefone que você usou ao fazer o pedido.",
     "Inserisci il documento, l'email o il telefono che hai usato per effettuare l'ordine.",
     "Indiquez le document, l'email ou le téléphone que vous avez utilisé lors de la commande.",
     "Geben Sie das Dokument, die E-Mail oder die Telefonnummer ein, die Sie bei der Bestellung verwendet haben.",
     "请输入您下单时使用的证件号码、邮箱或电话号码。"),
    ("No encontramos ningún pedido con ese dato. Revisá que esté bien escrito.",
     "No encontramos ningún pedido con ese dato. Revisá que esté bien escrito.",
     "We couldn't find any order with that information. Check that it's written correctly.",
     "Não encontramos nenhum pedido com esse dado. Confira se está escrito corretamente.",
     "Non abbiamo trovato nessun ordine con questo dato. Controlla che sia scritto correttamente.",
     "Nous n'avons trouvé aucune commande avec cette information. Vérifiez qu'elle est correctement saisie.",
     "Wir konnten keine Bestellung mit dieser Angabe finden. Bitte überprüfen Sie die Eingabe.",
     "未找到匹配的订单，请检查填写是否正确。"),
    ("Documento, email o teléfono", "Documento, email o teléfono", "ID document, email, or phone",
     "Documento, email ou telefone", "Documento, email o telefono", "Document, email ou téléphone",
     "Dokument, E-Mail oder Telefon", "证件号码、邮箱或电话"),
    ("El que usaste al hacer el pedido", "El que usaste al hacer el pedido", "The one you used when placing the order",
     "O mesmo que você usou ao fazer o pedido", "Quello che hai usato per effettuare l'ordine",
     "Celui que vous avez utilisé lors de la commande", "Dasjenige, das Sie bei der Bestellung verwendet haben",
     "您下单时使用的证件号码"),
    ("Buscar mis pedidos", "Buscar mis pedidos", "Look up my orders", "Consultar meus pedidos",
     "Verifica i miei ordini", "Suivre mes commandes", "Bestellungen nachverfolgen", "查询我的订单"),
    ("Tus pedidos", "Tus pedidos", "Your orders", "Seus pedidos", "I tuoi ordini", "Vos commandes",
     "Ihre Bestellungen", "您的订单"),
]

bulk_translate(VIEW_ID, ROWS)
