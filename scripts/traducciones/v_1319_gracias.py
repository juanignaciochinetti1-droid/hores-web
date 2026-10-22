# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1319  # contacto_gracias_template

ROWS = [
    ("¡Gracias por escribirnos!", "¡Gracias por escribirnos!", "Thank you for writing to us!",
     "Obrigado por nos escrever!", "Grazie per averci scritto!", "Merci de nous avoir écrit !",
     "Danke, dass Sie uns geschrieben haben!", "感谢您的来信！"),
    ("Recibimos su consulta y le vamos a responder a la brevedad.",
     "Recibimos su consulta y le vamos a responder a la brevedad.",
     "We received your inquiry and will respond shortly.",
     "Recebemos sua mensagem e responderemos em breve.",
     "Abbiamo ricevuto la tua richiesta e ti risponderemo a breve.",
     "Nous avons reçu votre message et nous vous répondrons dans les plus brefs délais.",
     "Wir haben Ihre Anfrage erhalten und werden Ihnen in Kürze antworten.",
     "我们已收到您的咨询，会尽快回复您。"),
    ("Volver al sitio", "Volver al sitio", "Back to site", "Voltar ao site", "Torna al sito",
     "Retour au site", "Zurück zur Website", "返回网站"),
]

bulk_translate(VIEW_ID, ROWS)
