# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 2445  # postulacion_gracias_template

ROWS = [
    ("Postulación enviada — Cartotécnica Hores", "Postulación enviada — Cartotécnica Hores",
     "Application received — Cartotécnica Hores", "Candidatura recebida — Cartotécnica Hores",
     "Candidatura inviata — Cartotécnica Hores", "Candidature envoyée — Cartotécnica Hores",
     "Bewerbung gesendet — Cartotécnica Hores", "申请已提交 — Cartotécnica Hores"),
    ("¡Recibimos tu postulación!", "¡Recibimos tu postulación!", "We received your application!",
     "Recebemos sua candidatura!", "Abbiamo ricevuto la tua candidatura!", "Nous avons bien reçu votre candidature !",
     "Wir haben Ihre Bewerbung erhalten!", "我们已收到您的申请！"),
    ("Gracias por tu interés en sumarte a Cartotécnica Hores. Guardamos tu currículum y te contactamos si surge una búsqueda que coincida con tu perfil.",
     "Gracias por tu interés en sumarte a Cartotécnica Hores. Guardamos tu currículum y te contactamos si surge una búsqueda que coincida con tu perfil.",
     "Thanks for your interest in joining Cartotécnica Hores. We saved your résumé and will reach out if an opening matches your profile.",
     "Obrigado pelo interesse em se juntar à Cartotécnica Hores. Guardamos seu currículo e entraremos em contato se surgir uma vaga compatível com seu perfil.",
     "Grazie per il tuo interesse a entrare in Cartotécnica Hores. Abbiamo salvato il tuo curriculum e ti contatteremo se emergerà una posizione in linea con il tuo profilo.",
     "Merci de votre intérêt à rejoindre Cartotécnica Hores. Nous avons enregistré votre CV et vous contacterons si un poste correspondant à votre profil se présente.",
     "Vielen Dank für Ihr Interesse an Cartotécnica Hores. Wir haben Ihren Lebenslauf gespeichert und melden uns, sobald eine passende Stelle frei wird.",
     "感谢您对加入 Cartotécnica Hores 的关注。我们已保存您的简历，一旦有合适的职位空缺即与您联系。"),
    ("Volver al inicio", "Volver al inicio", "Back to home", "Voltar ao início", "Torna alla home",
     "Retour à l'accueil", "Zurück zur Startseite", "返回首页"),
]

bulk_translate(VIEW_ID, ROWS)
