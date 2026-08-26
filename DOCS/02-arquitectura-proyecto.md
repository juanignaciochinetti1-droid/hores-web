# Arquitectura del proyecto

## Estructura de carpetas del módulo

```
custom_addons/mi_sitio_web/
├── __manifest__.py          # depende de: website, crm, sale, website_sale, payment_custom
├── controllers/
│   └── main.py               # todas las rutas HTTP del sitio
├── models/
│   ├── categoria.py          # mi_sitio_web.categoria
│   └── producto.py           # mi_sitio_web.producto (+ spec/feature/variante)
├── security/
│   └── ir.model.access.csv   # permisos: usuarios internos r/w, público solo r
├── static/src/img/           # imágenes que usa el sitio (copiadas de disenos/)
└── views/
    ├── website_templates.xml  # Home + página de "gracias" del contacto
    ├── catalogo_templates.xml # head_assets, header/footer compartidos,
    │                          # Compras, Categoría, Producto (+ "Agregar
    │                          # al carrito"), Calidad, Compromiso, Historia
    ├── producto_views.xml     # vistas de backend (admin) del catálogo
    ├── seo_templates.xml      # Open Graph, extiende website.layout
    ├── error_templates.xml    # página 404 propia, extiende http_routing.404
    └── ecommerce_theme_templates.xml  # paleta del sitio en /shop, carrito,
                               # checkout (nativos de website_sale) — ver
                               # DOCS/07-pedidos.md
```

## Modelos de datos

- **`mi_sitio_web.categoria`** — `name`, `slug` (único, usado en la URL
  `/categoria/<slug>`), `sequence`.
- **`mi_sitio_web.producto`** — `name`, `code` (único), `category_id`
  (obligatorio), `summary`, `description`, `image`, `is_custom`
  (personalizable), `is_published`, `disponibilidad`
  (`disponible`/`a_pedido`/`sin_stock`, manual — ver
  [pedidos](07-pedidos.md)), `sale_product_id` (puente a un
  `product.product` real de Odoo, para el carrito — solo si el producto no
  tiene variantes), `sequence`, más un campo calculado `whatsapp_url`
  (arma el link de WhatsApp con el nombre del producto URL-encodeado).
  - `spec_ids` → `mi_sitio_web.producto.spec` (ficha técnica: label/value)
  - `feature_ids` → `mi_sitio_web.producto.feature` (lista de
    características)
  - `variante_ids` → `mi_sitio_web.producto.variante` (tamaños, cada uno
    con su propia imagen y su propio `sale_product_id` — ver
    [pedidos](07-pedidos.md))

Las restricciones de unicidad (`code`, `slug`) usan `models.Constraint`
(no `_sql_constraints`, que quedó deprecado y dejó de aplicarse de verdad
en esta versión de Odoo — ver el historial de la sesión donde se detectó y
corrigió).

## Rutas del sitio

| Ruta | Página | Notas |
|---|---|---|
| `/mi-sitio` | Home | Hero con slideshow de fotos, secciones ancla (#empresa, #productos, #calidad, #sustentabilidad, #faq, #contacto) |
| `/compras` | Catálogo completo | Buscador instantáneo + filtro por categoría (links, no filtro en la misma página) |
| `/categoria/<slug>` | Productos de una categoría | 404 si el slug no existe |
| `/producto/<id>` | Ficha de producto | 404 si no existe o no está publicado |
| `/calidad` | Calidad y certificaciones | Contenido estático |
| `/compromiso` | Compromiso ambiental | Contenido estático |
| `/historia` | Historia de la empresa | Única página con datos "hardcodeados" como constantes en el controlador (ver doc de pendientes) y toggle de tema |
| `/mi-sitio/contacto` (POST) | — | Crea un `crm.lead`; valida server-side; redirige (patrón Post/Redirect/Get) |
| `/mi-sitio/gracias` | Página de agradecimiento | Destino del redirect anterior |

Todas las rutas admiten prefijo de idioma (`/en/...`, `/pt/...`) porque
usan `website=True` — ver [idiomas](06-idiomas.md).

**Carrito y checkout no son rutas propias** — `/shop`, `/shop/cart`,
`/shop/checkout`, etc. son nativas de `website_sale`. "Agregar al
carrito" desde `/producto/<id>` llama directo a la ruta nativa
`/shop/cart/add` por JS (`fetch`), sin pasar por ningún controlador
propio. La única ruta propia relacionada es
`GET /mi-sitio/carrito/lineas` (JSON, `{"cantidad": N}`), que usa el JS
del botón para actualizar el numerito del carrito del header con la
cantidad de **pedidos**, no de unidades — ver [pedidos](07-pedidos.md).

## Plantillas compartidas (`catalogo_templates.xml`)

- **`head_assets`** — se llama una vez en cada página (`<t
  t-call="mi_sitio_web.head_assets"/>`). Trae las fuentes de Google, el CSS
  utilitario compartido (ver sistema de diseño) y el script global de
  scroll-reveal.
- **`site_header`** — header con barra de utilidad (dirección/teléfono/
  email) + nav (Empresa/Historia/Productos/Calidad/Compromiso/FAQ/
  Contacto). Se usa en todas las páginas **excepto** que se decida lo
  contrario explícitamente (ver nota abajo).
- **`site_footer`** — footer + botón flotante de WhatsApp. **No se llama a
  mano en cada página** — se inyecta una sola vez, automáticamente, en la
  región `#footer` de `website.layout` (`views/footer_override_templates.xml`),
  así que aparece en TODAS las páginas del sitio (las nuestras y las
  nativas de `/shop`) sin que cada plantilla tenga que pedirlo. Ver
  "Footer único en todo el sitio" más abajo — es importante si se agrega
  una página nueva: no hace falta (ni hay que) llamar a `site_footer` a
  mano, ya sale solo. La excepción es Historia, que tiene su propio
  `<footer>` chico y por eso pone `<t t-set="no_footer" t-value="True"/>`
  antes de `website.layout` para no duplicar.

> **Nota sobre Historia:** en algún momento se probó darle a `/historia` un
> header propio distinto; se revirtió a pedido — **todas las páginas usan
> el mismo `site_header`/`site_footer`**, sin excepciones. Si se vuelve a
> tocar el header, confirmar primero si el pedido es sobre el header en sí
> o sobre otra sección visualmente cercana (ya pasó una vez que un pedido
> sobre el fondo de una sección se interpretó mal como el header).

## Footer único en todo el sitio

Bug real encontrado el 26/08/2026 (a partir de un screenshot del checkout
mostrando un footer con datos inventados de una empresa que no existe):
**todas** las páginas del sitio —las nuestras y las nativas de
`/shop`/carrito/checkout— mostraban el footer de placeholder que trae
Odoo por defecto ("We are a team of passionate people...", "Useful Links"
a `#`), **además** de (o en vez de) el nuestro.

Causa: `website.layout` arma su propia región `<div id="footer">` con ese
contenido de fábrica, **por fuera de `#wrap`** — es decir, por fuera de
cualquier contenido que cada página nuestra pusiera en su cuerpo. Antes de
esta corrección, cada una de nuestras plantillas llamaba a `site_footer` a
mano *dentro* de `#wrap` (footer real, visible), pero la región `#footer`
de Odoo se seguía renderizando igual, por debajo — duplicado, invisible a
simple vista si nadie scrolleaba hasta el final. En las páginas nativas de
eCommerce, que no tienen nada propio dentro de `#wrap`, ese placeholder
era **lo único que se veía**.

Arreglo (`views/footer_override_templates.xml`): un `<template
inherit_id="website.layout">` con `position="replace"` sobre
`//div[@id='footer']`, que pone `mi_sitio_web.site_footer` ahí en su
lugar (respetando `no_footer`, la variable que Odoo ya usa para
suprimirlo — la usa Historia). Se sacaron los `<t t-call="mi_sitio_web.site_footer"/>`
que cada plantilla tenía metidos a mano dentro de `#wrap` — ahora sale
solo, una sola vez, en cualquier página.

Como el footer real vive ahora *fuera* de `#wrap.oe_structure`, hubo que
aflojar el CSS scoping de `head_assets` (`.hc-back-to-top`, hover de
botones, etc.) de `#wrap.oe_structure X` a `.oe_structure X` — tanto
`#wrap` como la región `#footer` de Odoo tienen la clase `oe_structure`
(es la convención de Odoo para marcar zonas editables), así que ese
cambio simple cubre las dos sin tener que duplicar reglas — ver
[sistema de diseño](03-sistema-de-diseno.md).

**Gotcha de Odoo confirmado de nuevo acá**: agregar un archivo XML *nuevo*
al `data` del manifest y correr `button_immediate_upgrade` **no alcanza**
— la vista no se crea hasta reiniciar el contenedor primero (mismo
comportamiento ya documentado para dependencias nuevas del manifest, ver
[idiomas](06-idiomas.md) y [pedidos](07-pedidos.md)). Se verificó
directo: la vista no existía en la base hasta reiniciar y recién ahí
correr el upgrade.

## Página 404 propia

`error_templates.xml` reemplaza la 404 genérica de Odoo por una con la
identidad del sitio. **Ojo si se vuelve a tocar**: Odoo tiene *dos*
plantillas de 404 distintas —

- `website.page_404` → solo se renderiza si quien mira la página está
  **logueado como diseñador del sitio**.
- `http_routing.404` → lo que ve **cualquier visitante público**, o sea el
  99.9% de los casos reales.

La primera vez se sobreescribió `website.page_404` por error de lectura de
la documentación de Odoo y no cambiaba nada para un visitante real — el
override correcto (y el que está hoy) apunta a `http_routing.404`.
Verificado con `curl` sin sesión contra una URL cualquiera, no solo contra
nuestras propias rutas.

## Migración de datos

El catálogo real (4 categorías, 5 productos con specs/features/variantes e
imágenes) se migró una sola vez desde `hores-web/hores.db` (un prototipo
previo en React/Node, en `Desktop/hores-web/`, proyecto separado) con
`scripts/migrar_catalogo_hores.py`. El script lee las credenciales de
`.env` — no las tiene hardcodeadas. Es re-ejecutable si hace falta volver a
importar (aunque hoy duplicaría los registros si se corre dos veces; no
tiene lógica de upsert).
