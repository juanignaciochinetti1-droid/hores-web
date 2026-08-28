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
    ├── ecommerce_theme_templates.xml  # paleta del sitio en /shop, carrito,
    │                          # checkout (nativos de website_sale) — ver
    │                          # DOCS/07-pedidos.md
    └── pedido_gestion_templates.xml  # cancelar / pedir cambios en un
                               # pedido ya hecho, sin login — ver
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
| `/categoria/<slug>` | Productos de una categoría | 404 si el slug no existe; redirige derecho a `/producto/<id>` si la categoría tiene un solo producto publicado — ver más abajo |
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

**Gestionar un pedido ya hecho** (sin login, por link con token — ver
[pedidos](07-pedidos.md#cancelar-o-pedir-un-cambio-en-un-pedido-ya-hecho)):
`GET /mi-sitio/pedido/<id>/gestionar`,
`POST /mi-sitio/pedido/<id>/cancelar`,
`POST /mi-sitio/pedido/<id>/cambio`.

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

**Segunda barra de placeholder, aparte** (encontrada el 26/08/2026, con un
screenshot del checkout): además del `#footer` de arriba, Odoo tiene una
región *distinta* — `.o_footer_copyright`, fuera de `#footer` — con una
segunda línea de placeholder ("Derechos reservados © Nombre de la
empresa", de `website.footer_copyright_company_name`). Como
`site_footer` ya trae su propia línea de copyright real, esta segunda
barra se **oculta** (`display:none` vía `position="attributes"`) en vez
de completarla con datos reales — mostrar el mismo copyright dos veces
con estilos distintos hubiera quedado peor, no mejor.

**Gotcha de Odoo confirmado de nuevo acá**: agregar un archivo XML *nuevo*
al `data` del manifest y correr `button_immediate_upgrade` **no alcanza**
— la vista no se crea hasta reiniciar el contenedor primero (mismo
comportamiento ya documentado para dependencias nuevas del manifest, ver
[idiomas](06-idiomas.md) y [pedidos](07-pedidos.md)). Se verificó
directo: la vista no existía en la base hasta reiniciar y recién ahí
correr el upgrade.

## Header genérico duplicado (mismo bug que el footer, del otro lado)

Encontrado el 28/08/2026: **todas** nuestras páginas (Home, Compras,
Categoría, Producto, Calidad, Compromiso, Historia, 404) mostraban, por
encima de nuestro propio `site_header`, una barra de Odoo con datos de
fábrica — "Your Logo", nav genérico ("Tienda"/"Contáctanos"), teléfono de
ejemplo (`+1 555-555-5556`), selector de idioma y "Inicia sesión". Mismo
mecanismo que el bug del footer (ver más arriba): `website.layout` arma
esa barra (`<header id="top">`, definida en `web.frontend_layout`) *por
fuera* de `#wrap`, así que se sumaba a la nuestra en vez de reemplazarla.

A diferencia del footer, acá **no hizo falta un `<template
inherit_id="website.layout">` propio** — Odoo ya expone una variable que
esa misma vista chequea (`<header t-if="not no_header" id="top">`, igual
que `no_footer`), así que alcanza con `<t t-set="no_header"
t-value="True"/>` al principio de cada `t-call="website.layout"` nuestro.
Se agregó en las 7 plantillas de arriba (en Historia, junto al
`no_footer` que ya tenía por su footer propio).

**Ojo si se agrega una página nueva**: a diferencia de `site_footer` (que
sale solo en todas las páginas por el override de `#footer`), el header
**no** se resuelve solo — cada plantilla nueva que llame a
`site_header` tiene que poner `no_header` a mano, si no le va a aparecer
la barra genérica de Odoo arriba de la nuestra otra vez.

**Actualización (28/08/2026)**: en `/shop`, `/shop/cart` y el checkout de
`website_sale` este header **se saca directamente** (a pedido explícito,
"sacar eso del sector del carrito" — venía de un screenshot del
carrito), en vez de recolorearlo o completar los datos de la empresa que
usa (`res.company` sigue teniendo "YourCompany", teléfono y logo de
ejemplo — no se tocó esa ficha porque afecta otras partes del backend,
como facturas, y no estaba confirmado). Como esas páginas no llaman a
`site_header` (son nativas, no nuestras), sacar el header nativo las deja
sin ningún nav arriba — la navegación en esas pantallas queda en el
footer, que ya es real y está siempre visible. A diferencia de nuestras
páginas (que ponen `no_header` a mano, una por una), acá se resuelve en
un solo lugar: `views/footer_override_templates.xml` agrega un `<t
t-set="no_header" t-value="True"/>` condicionado a
`request.httprequest.path.startswith('/shop')`, así que cubre toda la
familia de rutas de compras sin tocar cada plantilla nativa de
`website_sale` una por una. `contacto_gracias_template` (la página de
agradecimiento del formulario de contacto) no se tocó — nunca llamó a
`site_header`, así que no hay nada duplicado ahí, solo un header genérico
solo; no era
parte de lo reportado.

**Botón "Volver al sitio" (mismo día, a pedido explícito)**: al sacar el
header nativo, esas páginas se quedaron sin ninguna forma de volver al
sitio principal salvo bajar hasta el footer. Se agregó un botón chico
("← Volver al sitio" → `/mi-sitio`) justo donde iba el header, con el
mismo condicional (`request.httprequest.path.startswith('/shop')`) — vive
como hermano de `<header id="top">` en el mismo xpath, así que se
muestra sin importar si el header en sí termina renderizando.

Gotcha encontrado al implementarlo: el `<div>` del botón, sin un `width`
explícito, quedaba angosto (se achicaba al ancho de su contenido, ~200px)
en vez de estirarse — `#wrapwrap` es `display:flex; flex-flow:column
nowrap`, y ahí el `align-items:stretch` por defecto no se estaba
aplicando como se esperaba, así que el `max-width:1200px; margin:0 auto`
terminaba centrando una caja angosta en vez de una de 1200px (el botón se
veía centrado en toda la pantalla en vez de pegado a la izquierda). Se
solucionó agregando `width:100%` explícito junto al `max-width` — no
alcanza con confiar en que un hijo de un contenedor flex en columna se
estire solo.

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

## Página de categoría (`/categoria/<slug>`) simplificada

A pedido explícito (28/08/2026, con un screenshot): se sacó la fila de
miniaturas de variantes (imagen chica por cada tamaño, con lightbox al
hacer click) que aparecía debajo de la descripción de cada producto en
esta página — "es una vista innecesaria". Cada producto en la lista ya
tiene un link "Ver ficha técnica completa →" a `/producto/<id>`, que
muestra las variantes reales (con su nombre/medida, no solo una imagen
suelta) — la fila de miniaturas duplicaba esa información sin agregar
contexto.

Se sacó junto con toda su infraestructura (quedaba código muerto si no):
el CSS `.lightbox-overlay`/`.variant-thumb`, el `<div id="lightbox">` y
el script de la tecla Escape — nada de eso se usa en ningún otro lado del
archivo. `/compras` (el catálogo completo) no tenía este mismo bloque, así
que no hizo falta tocarlo ahí.

**Segunda vuelta, mismo día**: con un screenshot de la página entera (no
solo la fila de miniaturas), pidieron sacar la sección completa por estar
"de más". Antes de hacerlo se revisaron las 4 categorías reales: 3 tienen
un solo producto publicado (como Pan Dulce, la del screenshot — ahí la
página de categoría no agrega nada sobre ir directo a la ficha), pero
**Rosca/Bizcochuelo tiene 2** — sacar la página entera para todas hubiera
roto la única forma de ver esos dos agrupados aparte del catálogo
completo. Se confirmó el alcance con el usuario antes de tocar nada.

Solución (`controllers/main.py`, ruta `/categoria/<slug>`): si la
categoría tiene **un solo** producto publicado, la ruta redirige derecho
a `/producto/<id>` (con `_redirect()`, preserva el idioma activo) en vez
de renderizar `categoria_template`. Con más de uno, se comporta igual que
antes. Esto resuelve TODOS los links hacia `/categoria/<slug>` de una —
las chips de categoría en `/compras`, cualquier link externo o guardado —
sin tener que tocarlos uno por uno.

Efecto secundario que hubo que corregir: el breadcrumb "← [Categoría]" en
`producto_detalle_template` apuntaba a `/categoria/<slug>` de la propia
categoría del producto — para una categoría de un solo producto, eso
redirige de vuelta al mismo producto (loop). Se agregó la condición
`len(producto.category_id.producto_ids.filtered('is_published')) > 1`:
con un solo producto en la categoría, el breadcrumb cae en "← Catálogo"
(a `/compras`) en vez de al loop.

**Gotcha de Odoo, distinto a los anteriores**: este cambio SÍ tocó un
archivo `.py` (el controlador), no solo XML — a diferencia de las vistas,
el código Python de los controladores se carga una sola vez al arrancar
el proceso de Odoo. `button_immediate_upgrade` (que alcanza para XML) NO
recarga controladores; hizo falta `docker compose restart odoo` para que
tomara el cambio.

## Migración de datos

El catálogo real (4 categorías, 5 productos con specs/features/variantes e
imágenes) se migró una sola vez desde `hores-web/hores.db` (un prototipo
previo en React/Node, en `Desktop/hores-web/`, proyecto separado) con
`scripts/migrar_catalogo_hores.py`. El script lee las credenciales de
`.env` — no las tiene hardcodeadas. Es re-ejecutable si hace falta volver a
importar (aunque hoy duplicaría los registros si se corre dos veces; no
tiene lógica de upsert).
