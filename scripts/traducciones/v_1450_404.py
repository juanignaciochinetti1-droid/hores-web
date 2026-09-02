# -*- coding: utf-8 -*-
from translate_helpers import bulk_translate

VIEW_ID = 1450  # pagina_no_encontrada

ROWS = [
    ("Página no encontrada — Cartotécnica Hores", "Página no encontrada — Cartotécnica Hores",
     "Page not found — Cartotécnica Hores", "Página não encontrada — Cartotécnica Hores",
     "Pagina non trovata — Cartotécnica Hores", "Page introuvable — Cartotécnica Hores",
     "Seite nicht gefunden — Cartotécnica Hores", "页面未找到 — Cartotécnica Hores"),
    ("No encontramos esta página", "No encontramos esta página", "We couldn't find this page",
     "Não encontramos esta página", "Non abbiamo trovato questa pagina", "Nous n'avons pas trouvé cette page",
     "Diese Seite wurde nicht gefunden", "未找到此页面"),
    ("El link puede estar roto o la página se movió. Volvé al inicio o mirá el catálogo completo de moldes.",
     "El link puede estar roto o la página se movió. Volvé al inicio o mirá el catálogo completo de moldes.",
     "The link may be broken or the page may have moved. Go back home or browse the full mold catalog.",
     "O link pode estar quebrado ou a página foi movida. Volte ao início ou veja o catálogo completo de moldes.",
     "Il link potrebbe essere interrotto o la pagina potrebbe essere stata spostata. Torna alla home o consulta il catalogo completo degli stampi.",
     "Le lien est peut-être rompu ou la page a été déplacée. Retournez à l'accueil ou consultez le catalogue complet des moules.",
     "Der Link ist möglicherweise defekt oder die Seite wurde verschoben. Kehren Sie zur Startseite zurück oder durchstöbern Sie den vollständigen Formenkatalog.",
     "链接可能已失效，或页面已被移动。请返回首页或浏览完整的模具目录。"),
    ("Volver al inicio", "Volver al inicio", "Back to home", "Voltar ao início", "Torna alla home",
     "Retour à l'accueil", "Zurück zur Startseite", "返回首页"),
    ("Ver catálogo", "Ver catálogo", "View catalog", "Ver catálogo", "Vedi catalogo", "Voir le catalogue",
     "Katalog ansehen", "查看目录"),
]

bulk_translate(VIEW_ID, ROWS)
