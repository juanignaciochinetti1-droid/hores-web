# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1318  # home_template

LABEL = '<span style="display:block; font-size:13px; font-weight:600; color:#5a4f44; margin-bottom:6px;">{}</span>'

def label(es, en, pt, it, fr, de, zh):
    return (LABEL.format(es), LABEL.format(es), LABEL.format(en), LABEL.format(pt),
            LABEL.format(it), LABEL.format(fr), LABEL.format(de), LABEL.format(zh))

ROWS = [
    label('Nombre*', 'Name*', 'Nome*', 'Nome*', 'Nom*', 'Name*', '姓名*'),
    label('Email*', 'Email*', 'Email*', 'Email*', 'Email*', 'E-Mail*', '邮箱*'),
    label('Teléfono', 'Phone', 'Telefone', 'Telefono', 'Téléphone', 'Telefon', '电话'),
    label('Empresa', 'Company', 'Empresa', 'Azienda', 'Entreprise', 'Unternehmen', '公司'),
    label('Mensaje*', 'Message*', 'Mensagem*', 'Messaggio*', 'Message*', 'Nachricht*', '留言*'),
    label('Área de interés', 'Area of interest', 'Área de interesse', 'Area di interesse',
          "Domaine d'intérêt", 'Interessengebiet', '关注领域'),
    label('Currículum*', 'Résumé*', 'Currículo*', 'Curriculum*', 'CV*', 'Lebenslauf*', '简历*'),
    label('Comentario', 'Comment', 'Comentário', 'Commento', 'Commentaire', 'Kommentar', '留言'),

    ('+31 años', '+31 años', '31+ years', '+31 anos', '+31 anni', '+31 ans', '31+ Jahre', '31+ 年'),

    ('Planta Cartotécnica Hores — vista aérea',
     'Planta Cartotécnica Hores — vista aérea',
     'Cartotécnica Hores facility — aerial view',
     'Planta da Cartotécnica Hores — vista aérea',
     'Stabilimento Cartotécnica Hores — vista aerea',
     'Usine Cartotécnica Hores — vue aérienne',
     'Cartotécnica-Hores-Werk — Luftaufnahme',
     'Cartotécnica Hores 工厂 — 航拍图'),

    ('Planta de Cartotécnica Hores en Bell Ville',
     'Planta de Cartotécnica Hores en Bell Ville',
     'Cartotécnica Hores facility in Bell Ville',
     'Planta da Cartotécnica Hores em Bell Ville',
     'Stabilimento Cartotécnica Hores a Bell Ville',
     'Usine Cartotécnica Hores à Bell Ville',
     'Cartotécnica-Hores-Werk in Bell Ville',
     'Cartotécnica Hores 位于贝尔维尔的工厂'),

    ('Completá el formulario y te respondemos a la brevedad. También podés escribirnos por WhatsApp, email o acercarte a la planta.',
     'Completá el formulario y te respondemos a la brevedad. También podés escribirnos por WhatsApp, email o acercarte a la planta.',
     "Fill out the form and we'll get back to you shortly. You can also write to us on WhatsApp, email, or stop by the facility.",
     'Preencha o formulário e responderemos em breve. Você também pode nos escrever pelo WhatsApp, e-mail ou visitar a planta.',
     'Compila il modulo e ti risponderemo a breve. Puoi anche scriverci su WhatsApp, via email o venirci a trovare in stabilimento.',
     "Remplissez le formulaire et nous vous répondrons rapidement. Vous pouvez aussi nous écrire sur WhatsApp, par e-mail ou passer à l'usine.",
     'Füllen Sie das Formular aus, wir melden uns umgehend. Sie können uns auch auf WhatsApp, per E-Mail schreiben oder das Werk besuchen.',
     '填写表格，我们会尽快回复您。您也可以通过WhatsApp、邮件联系我们，或直接到工厂来访。'),

    ('<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Planta</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Planta</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Facility</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Planta</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Stabilimento</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Usine</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">Werk</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>',
     '<span style="width:38px; height:38px; border-radius:9px; background:#efe6d8; display:flex; align-items:center; justify-content:center; color:#8a7a67; font-weight:700;">◎</span>\n            <span><strong style="display:block; color:#241d17;">工厂</strong>Ruta Prov. 3, Km. 183.5, Bell Ville, Córdoba</span>'),
]

bulk_translate(VIEW_ID, ROWS)
