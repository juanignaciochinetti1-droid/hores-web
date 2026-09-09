# Pedidos: eCommerce (carrito + checkout)

## Historia de esta decisión

Este archivo pasó por dos versiones — vale la pena dejarlo escrito porque
si se vuelve a evaluar el alcance, es bueno saber qué ya se probó:

1. **Primera versión (26/08/2026, mañana)**: "Solicitar pedido" — un
   formulario chico (después popup) por producto, sin carrito, que creaba
   un presupuesto (`sale.order`) para que el equipo lo confirme a mano. Se
   eligió por sobre eCommerce completo porque el sitio tenía un estilo
   consultivo (WhatsApp, sin precios públicos).
2. **Versión actual (26/08/2026, tarde)**: pedido explícito de conectar el
   módulo eCommerce real de Odoo (`website_sale`). Se sacó el popup y el
   formulario propio, y se reemplazaron por carrito + checkout nativos.

El módulo `sale` se mantiene como dependencia (Ventas es la base de
eCommerce), pero **ya no se programa nada de pedidos a mano** — todo el
flujo de compra es el nativo de Odoo.

## Qué se instaló

- **`website_sale`** (eCommerce) — trae el carrito, `/shop`, checkout,
  direcciones, métodos de envío.
- **`payment_custom`** — trae el proveedor de pago **"Wire Transfer"
  (Transferencia bancaria)**, activado a mano para la empresa
  ("YourCompany", id 1 — la única que usa nuestro website) porque **no hay
  pago online todavía** (decisión explícita, ver más abajo). Sin esto, el
  checkout no tiene ningún método de pago para elegir y no se puede
  completar.
- `delivery`, `website_payment`, `website_mail`, `portal_rating`, `digest`
  — dependencias de `website_sale`, no se configuraron a mano (quedan con
  sus valores por defecto).

## Cómo está migrado el catálogo

`website_sale` vende `product.product` (productos reales de Odoo), no
`mi_sitio_web.producto` (nuestro modelo propio). En vez de migrar todo el
catálogo (specs, features, imágenes, textos, traducciones) a los modelos
nativos, se agregó un campo **puente**:

- `mi_sitio_web.producto.sale_product_id` → `product.product` (se usa
  solo si el producto **no** tiene variantes).
- `mi_sitio_web.producto.variante.sale_product_id` → `product.product`
  (se usa cuando el producto **sí** tiene variantes — cada tamaño es un
  producto de venta aparte, porque cada tamaño puede tener su propio
  precio).

Las fichas técnicas (specs, features, descripción, imágenes) siguen
viviendo en `mi_sitio_web.producto`/`.variante` — eso no cambió. El
producto de venta real solo existe para el carrito/checkout: nombre (los
3 idiomas) y una imagen, nada más.

**Los 30 `product.product` ya se crearon** (uno por variante de tamaño;
ningún producto del catálogo actual está sin variantes) — se hizo una vez
con un script de migración que no quedó en el repo (se corrió desde el
scratchpad de la sesión). Si se agrega un producto o una variante nueva al
catálogo, hay que crear su `product.product` a mano (o reconstruir el
script) y cargarlo en `sale_product_id` — si no, "Agregar al carrito" no
aparece para ese producto/variante (ver más abajo).

### Precios

**Todos los `product.product` migrados quedaron en `list_price = 0.0` a
propósito.** El sitio nunca tuvo precios públicos — no había ningún dato
de referencia para poner un precio real, y dejarlo en blanco habría hecho
que Odoo probablemente muestre 0 igual. Antes de que el carrito sea
utilizable de verdad, alguien tiene que cargar el precio de cada uno de
los 30 productos en el backend (Ventas/Sitio Web → Productos). Mientras
tanto, el carrito funciona técnicamente pero todo sale "gratis".

### ⚠️ La empresa está en dólares (USD), no en pesos argentinos

Encontrado al migrar (26/08/2026): la compañía del sitio ("YourCompany",
id 1) tiene configurada la moneda **USD**, no ARS, a pesar de tener el
país en Argentina. **No se pudo corregir por API** — Odoo lo bloquea con
"No puede cambiar la moneda de la empresa porque ya tiene apuntes
contables" (esta base ya tenía movimientos contables de algún tipo antes
de este proyecto). Cargar precios en pesos con la moneda mal configurada
va a mostrar todo como si fueran dólares. **Hay que resolver esto en el
backend de Odoo (Contabilidad → Configuración, o evaluar si hace falta
partir de una compañía nueva) antes de cargar precios reales** — no es
algo para forzar por script sin saber qué apuntes contables tiene esta
base.

### Se despublicaron 26 productos de demo

Esta instancia de Odoo ya traía datos de ejemplo de eCommerce (muebles de
oficina: escritorios, sillas, armarios — el demo estándar de Odoo) que
aparecían mezclados con los moldes en `/shop`, sin relación con el
negocio real. Se les puso `website_published = False` a los 26 (no se
borraron, por si sirven de referencia en el backend) — ver también que se
borraron algunos carritos (`sale.order` en estado `draft`) de un partner
demo ("Gemini Furniture") al limpiar carritos de prueba propios: si
aparece algo raro relacionado a ese partner, es de los datos de ejemplo
de Odoo, no de un cliente real.

## Cómo funciona "Agregar al carrito"

En `/producto/<id>`, si el producto (o alguna de sus variantes) tiene
`sale_product_id` cargado, arriba aparece un botón "Agregar al carrito" al
lado del de "Consultar por WhatsApp" (mismo ancho, misma fila — a pedido
explícito, 26/08/2026). El formulario en sí (selector de tamaño si
corresponde, cantidad, y un botón "Confirmar") arranca **oculto** — el
click en "Agregar al carrito" solo lo despliega (`#add-to-cart-toggle`,
JS al final de `producto_detalle_template` en `catalogo_templates.xml`);
recién el submit del form (botón "Confirmar") agrega de verdad. Si el
producto está `sin_stock`, ese botón no se muestra — queda solo el de
WhatsApp, a ancho completo, y el aviso de "Sin stock" reemplaza al
formulario.

El submit del formulario ("Confirmar") llama directo a
`/shop/cart/add` — la ruta nativa de `website_sale`, que es **jsonrpc**
(no un POST de formulario común, ver `odoo/odoo/http.py` — el tipo
`jsonrpc` exige un body `{"jsonrpc":"2.0","method":"call","params":{...}}`
con `Content-Type: application/json`). El JS de la página (vanilla,
`fetch`, sin depender del JS propio de `website_sale`) arma ese request a
mano y actualiza el contador del carrito en el header
(`.hc-cart-badge`, en `site_header`) sin recargar la página.

El header muestra un ícono de carrito (🛒) con un badge — `request.cart`
lo expone `website_sale` automáticamente en cualquier request una vez
instalado, no hace falta pasarlo desde el controlador.

**El badge cuenta pedidos (líneas del carrito), no unidades** — pedir 20
moldes en una sola línea marca "1", no "20" (a pedido explícito,
26/08/2026: el badge original usaba `cart_quantity`, que es la suma de
`product_uom_qty` de todas las líneas, y confundía). La cuenta real es
`len(order_line.filtered(lambda l: not l.display_type))` — se descartan
líneas "de presentación" (secciones/notas/combos) que no son un producto
pedido de verdad:

- El render inicial del header (`site_header`, variable `carrito_lineas`)
  la calcula directo con esa expresión.
- Después de un "Agregar al carrito" exitoso, el JS no puede sacar este
  número de la respuesta de `/shop/cart/add` (esa ruta nativa solo
  devuelve `cart_quantity`, la suma) — por eso pide aparte
  `GET /mi-sitio/carrito/lineas` (ruta propia, `controllers/main.py`), que
  devuelve `{"cantidad": N}` con la misma cuenta, y actualiza el badge con
  eso.

Si `disponibilidad == 'sin_stock'`, no se muestra el bloque de compra —
aparece un aviso para escribir por WhatsApp en su lugar (ver
[disponibilidad](#disponibilidad) más abajo).

## Checkout y pago

El carrito (`/shop/cart`), la dirección (`/shop/address`) y el checkout
(`/shop/checkout`) son plantillas **nativas de `website_sale`** (header,
buscador y estructura general son los de Odoo, no `site_header`) — no se
reescribieron, porque tocar el layout de esas pantallas es un trabajo
grande aparte y arriesga romper el carrito/buscador propios de
`website_sale`, que dependen de esa estructura exacta.

Lo que sí se aplicó (26/08/2026, a pedido explícito: "la paleta de
colores") es la **identidad visual del sitio por encima de esas
plantillas** — `views/ecommerce_theme_templates.xml`, un `<template
inherit_id="website.layout">` que inyecta en el `<head>` las fuentes de
Google (Source Serif 4 / Archivo, las mismas que `head_assets`, porque
estas páginas no pasan por ese template) y un bloque de CSS que:

- Redefine las variables de Bootstrap 5 (`--bs-primary`, `--bs-body-bg`,
  `--bs-link-color`, etc.) — la mayoría de los componentes nativos las
  consumen en cascada.
- Refuerza con reglas directas sobre `.oe_website_sale` (el contenedor
  que arma `website_sale` en estas páginas) para los casos donde el color
  viene compilado en el CSS y no alcanza con la variable: fondo crema,
  botones primarios en naranja (`#c26a1e`), links, precios
  (`.oe_currency_value`), bordes de tarjetas.
- Suma bordes redondeados + sombra sutil a los paneles (mismo trato que
  `.hc-card` en el resto del sitio: `#shop_cart`, el panel de "Resumen de
  la orden"), separadores entre líneas de pedido, acento naranja arriba
  del panel de totales (`.o_total_card`, 3px, mismo look que el borde
  superior del footer), color de acento en los pasos del checkout
  ("Orden / Dirección / Pago", `.o_wizard`), y estilo a los inputs
  (selector de cantidad `+`/`-`, código de descuento, foco naranja en los
  campos). Ver `views/ecommerce_theme_templates.xml` — cada regla nueva
  quedó comentada con la clase real de `website_sale` a la que apunta.
- Achica el ancho del contenedor de `/shop` y del carrito/checkout al
  mismo tope que el resto del sitio (`max-width:1200px`, ver
  [sistema de diseño](03-sistema-de-diseno.md)) y, en el paso "Orden" del
  checkout puntualmente, fija un ancho cómodo de lectura para la tarjeta
  del pedido (`.oe_cart`, hasta 680px) y la de totales
  (`.o_wsale_shorter_cart_summary`, hasta 380px), centradas como conjunto
  con `.row:has(> .oe_cart)`. Se probó primero solo subir el tope del
  contenedor (a 1600px) para achicar el espacio vacío de los costados en
  monitores anchos, pero esas dos tarjetas no tienen ancho propio en el
  grid nativo de `website_sale` — crecen con el contenedor, así que el
  único efecto real fue estirar de más la tarjeta del pedido sin resolver
  el espacio vacío. Fijar su ancho evita eso.

Esto aplica sobre `website.layout`, o sea **todas** las páginas del
sitio — en las nuestras no cambia nada visible (ya fijamos estos mismos
colores a mano con estilos inline, que ganan por especificidad sobre
estas reglas). Es paleta de colores y tipografía, **no** una
reconstrucción del layout: la estructura de `/shop` (grid de productos,
carrito, checkout) sigue siendo la de Odoo, no la nuestra.

> **Actualización (28/08/2026)**: el header nativo de arriba (nav
> genérico con "Your Logo", datos de ejemplo) se sacó directamente de
> `/shop` y el carrito/checkout — no se recoloreó ni se reconstruyó con
> el nuestro. Ver
> [arquitectura](02-arquitectura-proyecto.md#header-genérico-duplicado-mismo-bug-que-el-footer-del-otro-lado)
> para el detalle y el motivo (la ficha de la empresa en Odoo tiene datos
> de ejemplo sin confirmar, no se tocó). La navegación en esas pantallas
> queda en el footer.

**Bug real: franjas blancas a los costados en pantallas anchas, aunque el
fondo "crema" estaba bien puesto** (encontrado el 26/08/2026). Se probó
primero pintar el fondo directo sobre la etiqueta `html` (asumiendo que
Odoo fuerza el `body` a transparente para poder mostrar una imagen de
fondo configurable) — la etiqueta `html` efectivamente quedaba bien
pintada, **pero el problema seguía viéndose igual**. Diagnóstico real
(confirmado renderizando la página con Chrome headless y leyendo el color
de píxel exacto en los costados: daba `rgb(255,255,255)`, blanco puro, no
el crema `rgb(246,244,239)` esperado — la caché del navegador quedó
descartada como causa desde el principio de esta vuelta):

- El Bootstrap 5 que compila **esta versión de Odoo** define sus
  variables CSS **sin el prefijo `bs-`** (`--body-bg`, `--primary`,
  `--link-color`...), a diferencia de lo que documenta públicamente
  Bootstrap 5 (`--bs-body-bg`, etc.). Se confirmó abriendo el bundle
  compilado real (`web.assets_frontend.min.css`) y viendo el nombre de
  variable que consume la regla `body{background-color: var(--body-bg)}`.
- El CSS de este módulo redefinía `--bs-body-bg` — una variable que
  **no existe** en este build, así que no hacía nada — y `--body-bg`
  seguía valiendo `#FFFFFF` (el blanco de fábrica de Odoo).
- El `<body>` tiene su propio fondo **opaco**, pintado por encima de
  `<html>` — aunque `<html>` estuviera bien pintado de crema, `<body>`
  blanco lo tapaba por completo. Por eso el primer intento (solo
  `html`) no cambiaba nada visible.

Arreglo definitivo en `ecommerce_theme_templates.xml`: se agregaron las
variables con el nombre real (sin prefijo) junto a las `--bs-*` (por si
algún otro bundle sí las usa), y se pinta `html, body` directo con
`!important` en vez de depender de que la variable se resuelva bien en
cualquier contexto. Verificado con captura real (no solo mirando el HTML
servido) y lectura de píxel exacta en los costados: `rgb(246,244,239)`
en todo el ancho, sin franja blanca.

> Además de la paleta, se corrigió acá mismo un bug que hacía que estas
> páginas (y en realidad todo el sitio) mostraran el footer de placeholder
> que trae Odoo por defecto, con datos inventados de una empresa que no
> existe — ver
> [arquitectura](02-arquitectura-proyecto.md#footer-único-en-todo-el-sitio).

## Repaso del checkout con screenshots reales (31/08/2026)

El usuario mandó 3 screenshots de un pedido real completo (dirección,
confirmar orden, gracias) pidiendo mejoras. De ahí salieron estos
cambios:

### Tarjeta de dirección con texto crudo ("ancor, juan chinetti")

Se repetía en las 3 pantallas: el widget nativo `contact` (usado para
mostrar Empresa + Nombre) arma una línea combinando lo que haya de
calle/ciudad/país con el nombre — como esos campos ya no existen en
este checkout (ver más abajo, "Sin dirección de entrega"), lo único
que quedaba era esa combinación cruda, todo junto y sin formato.

Hay **dos plantillas nativas distintas** mostrando lo mismo, no una
sola — importante para no arreglar una y dar por hecho que ya está:
- `website_sale.address_on_checkout` — la tarjeta "Entrega y
  facturación" de "Confirmar orden" y de la página de gracias.
- `website_sale.address_card` (clon propio de `portal.address_card`,
  "para que los cambios del checkout no afecten al portal", según el
  comentario del código nativo) — la tarjeta con lápiz de "Dirección
  de entrega" del primer paso.

Las dos se reemplazan por el mismo formato propio: Empresa (si el
cliente la cargó — el campo sigue siendo opcional) en negrita arriba,
Nombre abajo, en vez del widget nativo. Verificado con un pedido real
de prueba (Empresa + Nombre distintos) en las dos pantallas.

**Nota de proceso**: el primer intento de este arreglo solo tocó
`address_on_checkout` y se dio por terminado sin probar la pantalla de
"Dirección" — quedó sin corregir hasta que se volvió a revisar con
datos reales. Ojo con esto la próxima vez que aparezca el mismo texto
en más de un lugar: probar cada pantalla por separado, no asumir que
arreglar una plantilla alcanza para todas.

### "Envío estándar" → método de envío renombrado

Era el `delivery.carrier` "Standard delivery" que trae Odoo de fábrica,
nunca personalizado — con el envío coordinado por WhatsApp después del
pedido (no hay dirección real para calcular un costo de envío de
verdad), ese nombre podía confundir. Se renombró a "Coordinamos la
entrega por WhatsApp" (y su traducción en los 3 idiomas), tanto el
`delivery.carrier` como el `product.template` de servicio que tiene
detrás (por si el nombre llega a aparecer en una línea de pedido o
factura más adelante).

### Buscador de pedido sin cuenta (nuevo: `/mi-sitio/consultar-pedido`)

La página de gracias ofrece "Registrate" (crear cuenta con login) y
"Gestionar mi pedido" (link con token, sin cuenta) — quedó sin resolver
si conviene sacar el primero, no se tocó. En cambio se sumó un tercer
camino para quien ya no tiene ese link a mano (lo perdió, borró el
mail): un formulario de búsqueda.

**Primera versión (31/08/2026)**: pedía **número de pedido + documento
(DNI/CUIT/etc.) juntos**, mismo patrón que un rastreo de paquetería —
el documento solo no alcanza para buscar porque no es un dato secreto
(a diferencia del token del link), cualquiera que lo supiera podría
consultar el pedido de otra persona.

**Rehecho (09/09/2026, a pedido explícito)**: exigir las dos cosas
dejaba afuera a cualquiera que no se acordara del número de pedido, y
sobre todo, al documento (`vat`) es **opcional** en este checkout (ver
"Sin dirección de entrega" y `WebsiteSaleHores._validate_address_values`
más abajo) — mucha gente simplemente nunca lo cargó. Ahora el
formulario pide **un solo dato, cualquiera de los que se piden en el
checkout** (documento, email o teléfono — el campo se llama `dato` a
propósito, no fuerza un tipo) y trae **todos** los pedidos de esa
persona, no uno solo — antes redirigía siempre a un pedido puntual, y
ahora, si hay más de un resultado, se lista para elegir.

Implementación:

- `controllers/main.py`, `_pedidos_por_dato(env, dato)`: normaliza el
  dato de tres formas a la vez (documento — solo alfanumérico
  mayúsculas, mismo criterio que `_normalizar_identificacion`; email —
  minúsculas; teléfono — solo dígitos, `_normalizar_telefono`) y busca,
  entre los `sale.order` que no sean el "pedido fantasma" de un cliente
  nuevo (`mi_sitio_lead_cancelado = True`, ver más abajo), cuáles
  coinciden **exacto** con alguno de los tres campos del partner de ese
  pedido. Nunca por `ilike`/substring — mismo cuidado con comodines de
  SQL que ya causó el bug de abajo.
- El teléfono compara por **sufijo/prefijo**, no igualdad estricta:
  Odoo suele guardar el teléfono con el código de país agregado
  (`'3537650821'` cargado → `'+54 3537650821'` guardado), y el cliente
  lo escribe tal cual lo tipeó, sin el `+54`. Se exige un piso de largo
  (`DATO_MIN_LEN = 6`) en ambos lados para que un dato corto no matchee
  por ser sufijo de casi cualquier número real.
- `consultar_pedido()`: si el resultado es un solo pedido, redirige
  directo a `/mi-sitio/pedido/<id>/gestionar?token=...` (mismo
  comportamiento que la versión vieja); si son varios, renderiza
  `consultar_pedido_template` con la lista (nombre + fecha, cada uno
  linkeando a su propia página de gestión); si no hay ninguno, muestra
  el mensaje de error de siempre.
- El campo de documento/email/teléfono ya existían en el checkout — no
  hizo falta agregar nada ahí, solo reescribir esta pantalla de
  consulta.

Link en el footer del sitio ("Consultar mi pedido"), visible en todas
las páginas. Traducido a los 3 idiomas (`scripts/traducciones/
v_2245_consultar.py`).

**Bug de seguridad real (versión original, 31/08/2026), encontrado y
corregido en el momento**: la primera versión buscaba el pedido con
`('name', '=ilike', numero)`. `=ilike` en Odoo NO escapa los comodines
de SQL (`%`, `_`) que vengan en el texto del cliente — un "número de
pedido" de `%` o `S%` matcheaba **cualquier pedido de la base**, no uno
puntual, anulando el motivo entero de pedir número + documento juntos.
Se corrigió cambiando a mayúsculas + `'='` exacto — este bug ya no
puede repetirse en la versión actual, `_pedidos_por_dato()` no arma
ningún `ilike`, compara todo en Python contra el valor ya normalizado.

**Bug encontrado al reescribir esto (09/09/2026)**: `res.partner` ya
**no tiene un campo `mobile` separado** en esta versión de Odoo (existía
en versiones viejas) — el primer intento de comparar también contra
`partner.mobile` tiraba `AttributeError` (500) en cualquier búsqueda.
Sacado; solo se compara contra `phone`.

## /shop redirige a /compras — se saca la grilla nativa (28/08/2026, a pedido explícito)

`/shop` es la grilla de productos que arma `website_sale` — visualmente
distinta de nuestro catálogo propio (`/compras`), y con los mismos
productos pero sin nuestro diseño ni marca. A pedido explícito ("no
sirve y no lo quieren", con screenshot de la grilla y del botón "Seguir
comprando" que lleva ahí), `/shop` pasa a redirigir directo a
`/compras`.

Se pisa el método `shop()` de `website_sale.WebsiteSale` en
`WebsiteSaleHores` (mismo patrón que el resto de los overrides de este
archivo — herencia de clase de Python, no una ruta nueva), con las
**4 variantes de ruta** que declara el original (`/shop`, `/shop/page/
<n>`, `/shop/category/<categoría>`, `/shop/category/<categoría>/page/
<n>`) — taparlas todas evita que se siga llegando a la grilla nativa por
alguna de esas variantes.

**El carrito y el checkout no se tocan** — son rutas aparte
(`/shop/cart`, `/shop/checkout`, `/shop/payment`, etc.), y "Agregar al
carrito" nunca visita `/shop` en sí (llama directo a `/shop/cart/add`
por JS). El botón nativo "Seguir comprando" (en la tarjeta de totales
del carrito/checkout) sigue apuntando a `href="/shop"` en el HTML — no
hizo falta tocar esa plantilla nativa: como esa URL ahora redirige sola
a `/compras`, el resultado es el mismo.

Verificado: `/shop`, `/shop/page/2` y las versiones `/en/shop`, `/pt/shop`
redirigen preservando el idioma; `/shop/cart` sigue funcionando igual
(agregado, visto y confirmado un pedido de prueba sin problemas).

## "Seguir comprando" → "Realizar otro pedido" (31/08/2026, a pedido explícito, con screenshot)

Mismo botón del punto anterior (el de la tarjeta de totales del
carrito, cuando el carrito recién se arma y todavía no hay ningún paso
anterior del checkout al que volver) — ahora también el texto, no solo
adónde lleva. Es texto fijo en la plantilla nativa
`website_sale.navigation_buttons`, no un campo de
`website.checkout.step` (esos son "Pago"→"Pedido" y el resto de los
breadcrumbs, ver más abajo) — se pisa con un `<xpath position="replace">`
en `ecommerce_theme_templates.xml`, mismo patrón que el resto de este
archivo.

**Bug propio, encontrado y corregido en el momento**: `navigation_buttons`
tiene **dos** `<t t-else="">` distintos — uno para el botón principal de
avanzar de paso (ícono `fa-angle-right`, href dinámico según el paso
siguiente) y otro para este link de volver (ícono `fa-angle-left`, href
fijo `/shop`). Un primer xpath armado por posición (`//t[@t-else='']/a`,
"el primer `t-else` que tenga un `<a>` adentro") agarró el botón
equivocado — el principal, no el de volver — y lo reemplazó por este
link. Se notó enseguida probando la página real: aparecían **dos**
"botones de volver" seguidos (uno con el texto nuevo, otro con el viejo
"Seguir comprando" sin traducir) y el botón de avanzar de paso había
desaparecido. Se corrigió apuntando el xpath por algo específico de
ese `<a>` en particular — su atributo `t-att-href="'/shop'"`, que es
único en toda la plantilla — en vez de por posición. Verificado después
de la corrección: el botón principal de avanzar (probado en
`/shop/checkout`, que redirige a `/shop/address`) y el link "Volver"
del paso siguiente siguen intactos; solo cambió el texto de este botón
puntual.

Traducido a los 3 idiomas (`ir.ui.view.update_field_translations`,
mismo mecanismo y mismo gotcha de orden que el resto del sitio — ver
[idiomas](06-idiomas.md#gotcha-1b-la-clave-para-pt_br-cambia-después-de-escribir-en_us)):
"Realizar otro pedido" / "Order again" / "Fazer outro pedido".

## "Responsabilidad de ARCA" sacado del checkout (28/08/2026, con un bug real encontrado en el camino)

Mismo pedido que la dirección de entrega, campo aparte: "Responsabilidad
de ARCA" (`l10n_ar_afip_responsibility_type_id`) también sale del
formulario de dirección del checkout.

**A diferencia de calle/ciudad/país, acá NO alcanzó con sacar el campo y
aflojar la validación** — se probó así primero (mismo patrón que la
dirección) y rompió la creación del cliente con un error real de
Postgres: `null value in column "partner_id" of relation "sale_order"
violates not-null constraint`. Encontrado revisando el log del
contenedor (no alcanzaba con el mensaje genérico "422 - Algo salió mal"
que mostraba el navegador).

**Causa raíz, en el código de Odoo (no nuestro)**: `l10n_ar/controllers/
portal.py`, `L10nARPortalAccount._validate_address_values` — cuando este
campo llega vacío, ese método de todos modos intenta
`request.env['l10n_ar.afip.responsibility.type'].browse(address_values.get('l10n_ar_afip_responsibility_type_id'))`,
y como esa clave ni siquiera existe en `address_values` si nunca se
mandó, `.get(...)` devuelve `None` — `browse(None)` rompe la transacción
a medio camino en vez de fallar en forma prolija. Es un bug real de la
localización argentina de Odoo (probado también con la ORM directa, sin
nuestro módulo de por medio, para confirmar que no era algo nuestro), no
algo que dependiera de cómo se sacaron el resto de los campos.

**Arreglo**: en vez de pelear ese bug (o parchear el método de Odoo, más
frágil todavía — se probó primero sacar la obligatoriedad con
`_get_mandatory_billing_address_fields`/`_validate_address_values` en
`WebsiteSaleHores`, pero tampoco alcanzaba solo, ver el commit), se
reemplaza el `<select>` visible por un `<input type="hidden">` con
"Consumidor Final" (código AFIP `5`, buscado por código en vez de
hardcodear el id, en `ecommerce_theme_templates.xml`) ya cargado. El
cliente no ve ni elige nada, y el código de Odoo siempre recibe un valor
real — nunca llega al camino roto. "Consumidor Final" es el valor
genérico correcto para un cliente sin categoría fiscal declarada (mismo
código que ya usa el checkout para casos similares, ver "Tipo de
Identificación").

Verificado con un pedido real de punta a punta: el cliente se crea con
`l10n_ar_afip_responsibility_type_id = Consumidor Final` sin que se le
haya pedido nada, y el pedido se confirma igual que siempre.

## "Pago" → "Pedido", y el botón de volver más visible (28/08/2026)

Dos pedidos en el mismo mensaje, ambos sobre el wizard del checkout
(Orden / Dirección / Pedido):

- **El paso "Pago" pasa a llamarse "Pedido"** — es el nombre del paso
  (breadcrumb de arriba), un campo (`website.checkout.step.name`) del
  mismo registro donde ya se había cambiado el texto del botón a
  "Realizar pedido" (ver más abajo, "Sin precios ni pago online"). Ojo
  con la traducción: en inglés y portugués el primer paso (el carrito) ya
  se llama "Order"/"Pedido" — ponerle lo mismo al último paso hubiera
  dejado el breadcrumb repetido ("Order > Address > Order"). Quedó
  "Pedido" (es) / "Confirm" (en) / "Confirmar" (pt) — mismo criterio
  (distinguir el paso final del primero), sin repetir palabra.
- **El link para volver a corregir algo del paso anterior** ("Volver al
  carrito", "Regresar a la dirección") **ya existía nativo** en cada
  paso del wizard — no hubo que agregar la función. El problema real era
  que estaba escondido: un texto gris chico debajo del botón principal,
  fácil de no ver. Se le subió el peso visual a botón secundario de
  verdad (blanco, con borde, mismo estilo que "Volver al sitio") en
  `ecommerce_theme_templates.xml`. Se engancha por el ícono
  (`a:has(> i.fa-angle-left)`) en vez de por una clase o contenedor
  propio, porque el mismo link se repite sin el mismo wrapper en la
  versión de mobile (cajón de resumen) — así cubre las dos versiones con
  una sola regla.

## Sin dirección de entrega en el checkout (a pedido explícito, 28/08/2026)

El formulario de "Dirección" del checkout ya no pide calle, departamento,
ciudad, código postal ni país — quedan solo los datos de contacto
(nombre, mail, teléfono, empresa) y los de facturación argentina (tipo
de identificación, CUIT/DNI, responsabilidad ARCA). La dirección de
entrega se termina de coordinar a mano (WhatsApp/mail) después del
pedido, no en el checkout — mismo criterio que ya se usa para todo lo
demás del proceso.

**Se sacaron del todo, no se ocultaron con CSS** (a diferencia de los
precios/cupón más abajo) — pedido explícito puntual del usuario. Dos
partes:

1. **Plantilla**: `views/ecommerce_theme_templates.xml` hereda
   `portal.address_form_fields` (la plantilla que arma esos campos —
   **compartida** con `/my/address`, el portal de cuenta de cliente, que
   hoy no se usa en este proyecto; si algún día se activa un portal de
   cliente, revisar si esto también le sacó la dirección a esa pantalla)
   y saca los `<div>` de calle/depto/ciudad/CP/país/provincia con
   `position="replace"` sin contenido — la forma estándar de QWeb para
   eliminar un nodo en vez de reemplazarlo por otro.
2. **Validación del servidor**: no alcanza con sacar los campos de la
   vista — el controlador base de Odoo (`portal.CustomerPortal.
   _get_mandatory_address_fields`, en `odoo/addons/portal/controllers/
   portal.py`) los exige por default (`{'street', 'city', 'country_id'}`,
   más `state_id`/`zip` según el país) sin importar si el formulario los
   muestra o no — si solo se ocultan, el envío del formulario falla
   igual. `controllers/main.py` agrega `WebsiteSaleHores`, que hereda
   `website_sale.controllers.main.WebsiteSale` por herencia normal de
   Python (no hace falta declarar rutas nuevas, ver el comentario en el
   código) y pisa ese método para devolver un set vacío.

Verificado con un pedido real de punta a punta sin ningún dato de
dirección: el partner se crea con `street`/`city`/`zip`/`country_id` en
`False`, sin error, y el pedido se confirma igual que siempre.

## Sin precios ni pago online en el carrito (a pedido explícito, 26/08/2026)

El carrito y las 3 pantallas del checkout (Orden / Dirección / Pago) ya no
muestran ningún precio, ni el campo de código de descuento — coherente con
que los 30 productos migrados todavía están en `list_price = 0` (ver
arriba) y con que el pedido se termina de coordinar por fuera (WhatsApp /
mail), no con un cobro online real.

- **Ocultos por CSS** en `ecommerce_theme_templates.xml` (no se tocó
  ningún template de `website_sale` — si el día de mañana se cargan
  precios reales y se quiere volver a mostrarlos, es borrar estas reglas,
  nada más):
  - `[name="website_sale_cart_line_price"]` — precio de cada línea en
    `/shop/cart`.
  - `[name="website_sale_cart_summary_line_price"]` — mismo precio, en el
    mini-resumen que aparece en los pasos de Dirección/Pago.
  - `.o_cart_total` — la tarjeta completa de Entrega/Subtotal/Impuestos/
    Total. El formulario de código de descuento (`.coupon_form`) vive
    *adentro* de este mismo contenedor como una fila más de la tabla, así
    que se esconde solo con la misma regla.
  - `#amount_total_summary` — el total que aparece en la barra resumen de
    mobile (pegada abajo) en los pasos de Dirección/Pago.
- **Texto del botón**: "Finalizar compra" (paso Orden → Dirección) ahora
  dice **"Realizar pedido"**. A diferencia de todo lo anterior, este texto
  **no es texto fijo de un template** — sale de un campo de datos
  (`website.checkout.step.main_button_label`, un registro por paso y por
  sitio) referenciado con `t-field`, así que no hay xpath que lo cambie:
  se actualizó por RPC el registro del paso `/shop/checkout` del sitio
  real (`website_id=1`, id interno 6 — **no** el genérico `website_id=False`
  ni el del sitio de prueba `website_id=2`), en los 3 idiomas ("Realizar
  pedido" / "Place order" / "Fazer pedido"). El resto de los botones del
  wizard ("Confirmar" en Dirección→Pago y en Pago) no se tocó — no fue
  parte del pedido.

Verificado con Chrome headless + captura real en los 3 pasos del wizard
(no solo el HTML servido), en los 3 idiomas.

Como no hay pago online, el único método disponible en el checkout es
**"Transferencia bancaria"** (Wire Transfer) — el cliente confirma el
pedido, el pedido queda como presupuesto/orden pendiente en Ventas, y el
pago se coordina fuera de Odoo (como se venía haciendo). Si en algún
momento se quiere pago online real, hay que dar de alta un proveedor de
pago de verdad (Mercado Pago es lo más común en Argentina) con cuenta y
credenciales propias — no es algo que se pueda simular.

## Disponibilidad

`mi_sitio_web.producto.disponibilidad` (`Selection`: `disponible` /
`a_pedido` / `sin_stock`, manual, cargado a mano en el backend — sin
integración con Inventario real) sigue existiendo igual que antes:

- **Badge** en la ficha de producto, en las tarjetas de `/compras` y en
  las filas de `/categoria/<slug>` — "Disponible" no se muestra (es el
  estado esperado), pero "A pedido" y "Sin stock" sí.
- **`sin_stock` ahora sí bloquea la compra** (cambió respecto de la
  versión anterior con el popup, donde no bloqueaba): no tiene sentido
  dejar agregar al carrito algo que no hay. En su lugar se muestra un
  aviso invitando a escribir por WhatsApp.
- **`a_pedido`** no bloquea — se agrega una aclaración arriba del
  formulario de que puede demorar en producción.

## Filtro "Rango de precio" oculto en /shop

Mismo motivo que ocultar los precios del carrito (ver arriba): con todos
los productos en $0, el filtro de rango de precio de la barra lateral de
`/shop` quedaba con mínimo y máximo iguales ($0,00–$0,00) — Odoo lo
detecta solo y lo atenúa (`opacity-75 pe-none`, de fábrica, sin poder
clickearlo), pero seguía ocupando lugar con pinta de roto. Se agregó
`display:none` sobre `#o_wsale_price_range_option` en
`ecommerce_theme_templates.xml` (a pedido explícito, 28/08/2026, con
screenshot) — el id se repite dos veces en el HTML real (barra lateral
de escritorio + cajón de filtros de mobile), un solo selector tapa las
dos.

## Cancelar o pedir un cambio en un pedido ya hecho

Agregado el 28/08/2026, a pedido explícito. Decisión de alcance tomada
con el usuario antes de programar (dos preguntas, ver historial de la
sesión): lo hace **el cliente, desde el sitio, sin login** (no hay portal
de cliente activado — ver "Qué falta" más abajo); y "editar" **no cambia
el pedido solo** — el cliente escribe qué necesita, queda anotado para
Ventas, y una persona lo aplica a mano. Coherente con que hoy todo el
proceso ya es manual (sin pago online, sin stock automatizado).

### Cómo se accede, sin login

`sale.order` ya trae un campo `access_token` (viene de `portal.mixin`,
es el mismo mecanismo que usa el portal nativo de Odoo para los links
"ver mi cotización" en emails). En vez de heredar todo `CustomerPortal`,
se implementó un chequeo propio y liviano en
`controllers/main.py` (`_pedido_por_token(order_id, token)`): busca el
pedido por id, compara el token con `hmac.compare_digest` (evita timing
attacks) contra `order._portal_ensure_token()` (genera el token la
primera vez que se pide, si no existe todavía), y devuelve un recordset
vacío si no matchea — el controlador tira 404 en ese caso, sin filtrar
si el id de pedido existe o no.

El link (`/mi-sitio/pedido/<id>/gestionar?token=...`) se muestra en la
página nativa de confirmación de compra (`/shop/confirmation`), inyectado
vía `<template inherit_id="website_sale.confirmation">` en
`views/pedido_gestion_templates.xml`. Se enganchó en
`oe_structure_website_sale_confirmation_2` — un `<div>` vacío que la
propia plantilla de Odoo deja como punto de inserción para bloques de
website builder al final de esa página (su comentario en el arch dice
literalmente "hooked using XPath on the oe_structure element ID"), así
que no hizo falta un xpath más frágil apuntando a otra parte del layout.

### Qué puede hacer el cliente en `/mi-sitio/pedido/<id>/gestionar`

- **Cancelar pedido** (`POST .../cancelar`) — llama
  `order.action_cancel()` directo, sin intermediarios.
- **Pedir un cambio** (`POST .../cambio`) — un textarea libre; el texto
  queda en el chatter del pedido (`order.message_post(...)`) **y** se le
  crea una actividad "to-do" al vendedor asignado
  (`order.activity_schedule(...)`), para que no dependa de que alguien
  abra el chatter para enterarse.
- Ninguna de las dos acciones queda disponible si `_pedido_gestionable()`
  da `False`: el pedido ya está cancelado/hecho, **o ya tiene una factura
  confirmada** (`account.move` en estado `posted`) — a partir de ahí el
  cambio se coordina a mano por WhatsApp/email, no solo, porque
  Administración ya lo procesó.

**Ojo con el body de `message_post`**: un `str` común se trata como texto
sin confiar y se escapa **entero** (las etiquetas HTML propias
incluidas, no solo lo que escribe el cliente) — si no, cualquier
`<script>` que alguien escriba en el textarea se ejecutaría en el
chatter de Ventas. Se escapa a mano el mensaje del cliente
(`html.escape`), se arma el HTML final por composición de strings (no
con el operador `%%` de `Markup`, que re-escaparía lo ya escapado), y
recién ahí se envuelve todo junto en `markupsafe.Markup(...)` **una sola
vez**, al final.

### Verificado con un pedido real de punta a punta

Cancelar (confirmado `state` en `cancel` en la base), pedir un cambio
(confirmado el mensaje en el chatter y la actividad creada, incluyendo
un intento con `<script>alert(1)</script>` en el mensaje para confirmar
que queda escapado y no se ejecuta), token inválido (404), y las 3
plantillas del set (`pedido_gestionar_template`, el link en
`/shop/confirmation`) traducidas a los 3 idiomas.

## Cliente nuevo → oportunidad en CRM, cliente conocido → pedido directo

A pedido explícito de Leandro (02/09/2026, vía WhatsApp): el sitio
separa el flujo de compra en dos caminos según si quien está comprando
ya hizo algún pedido antes o no (`WebsiteSaleHores._es_cliente_nuevo()`,
`controllers/main.py`).

- **Cliente con algún pedido anterior real** (mismo `partner_id` o
  mismo email, en un pedido que no esté en `draft`/`sent` ni sea el
  "pedido fantasma" de abajo) sigue el camino de siempre: llega derecho
  a `/shop/payment`, el pedido queda como cotización/orden pendiente en
  Ventas (ver "Sin precios ni pago online" arriba).
- **Cliente nuevo** (primera vez, ninguna coincidencia): al llegar a
  `/shop/payment` NO ve el paso de pago. En su lugar
  (`_crear_oportunidad_desde_carrito`) se le crea una **oportunidad en
  CRM** (`crm.lead`) con el detalle de lo que eligió (productos +
  cantidades en la descripción, `partner_id` linkeado al cliente real
  del checkout — no solo datos de contacto sueltos), se avisa al equipo
  comercial, y se lo manda a la página de agradecimiento sin dejarlo
  pagar. El pedido en sí (`sale.order`, todavía sin confirmar en ese
  punto) se cancela — no tiene que quedar un "pedido por facturar"
  fantasma dando vueltas en Ventas por algo que en realidad tiene que
  pasar por Preventas primero. Se marca con
  `mi_sitio_lead_cancelado = True` (campo propio, `models/sale_order.py`)
  para poder distinguir después este cancelado-por-el-sitio de uno que
  el cliente canceló de verdad después de confirmarlo — sin esa marca,
  ese mismo pedido volvía a contar como "ya es cliente" la segunda vez
  que la misma persona pedía algo (bug real, encontrado el 04/09/2026:
  "no te pide los datos").

### Quién queda como vendedor asignado — tres vueltas hasta llegar bien

Mismo problema de fondo, encontrado tres veces en tres lugares
distintos porque una ruta pública (`auth='public'`) nunca tiene un
usuario real logueado — `env.user`, incluso bajo `.sudo()` (que cambia
los **permisos**, no la identidad de "usuario actual" para calcular
valores por defecto), resuelve al **"Usuario Público"** de Odoo, una
cuenta técnica que nadie mira:

1. **Quién recibe el AVISO** (la actividad "A hacer" de "hay un cliente
   nuevo") — arreglado primero, con `_elegir_responsable_actividad()`
   (compartida entre este flujo y `pedido_solicitar_cambio`): prioridad
   al líder del equipo, después cualquier miembro, después el admin, y
   recién como último recurso `env.user`.
2. **Quién queda como vendedor asignado de la oportunidad en sí**
   (`crm.lead.user_id`) — encontrado el 09/09/2026 probando el flujo de
   verdad sin sesión iniciada: arreglar (1) arregla quién se entera,
   pero `crm.lead.user_id` tiene su propio default
   (`lambda: self.env.user`) que se aplica igual si no se pasa nada en
   el `create()` — la oportunidad quedaba asignada al Usuario Público,
   invisible en el "Mi flujo" de cualquier vendedor real (ese filtro
   busca por vendedor asignado, no por quién recibió el aviso).
3. **`crm.team` no es de lectura pública** — el primer arreglo del punto
   2 buscaba el equipo con `request.env.ref('sales_team.
   team_sales_department', ...)` sin `.sudo()`, y más abajo se leen
   `team.user_id`/`team.member_ids` para elegir el responsable del
   punto 1 — un visitante público real (sesión 100% anónima, sin
   ninguna cookie previa) se encontraba con un **403** justo al llegar
   a `/shop/payment` como cliente nuevo. No se había visto antes porque
   hasta este punto nunca se había probado el flujo con una sesión
   realmente anónima. Arreglado agregando `.sudo()` a esa referencia.

**Decisión final (09/09/2026, a pedido explícito)**: la oportunidad
queda **sin vendedor asignado** (`user_id: False` explícito en el
`create()` — no simplemente omitido, omitirlo cae de nuevo en el
default y reproduce el bug del punto 2). El sitio no tiene que decidir
quién de Ventas se hace cargo — eso lo elige Ventas desde Odoo mismo
(se la asignan a sí mismos cuando la ven en el pool del equipo). El
aviso (punto 1) sigue yendo a una persona real de todos modos, para que
no se pierda.

## Ver la factura del pedido (`/mi-sitio/pedido/<id>/factura/<id>`)

Agregado a pedido explícito (09/09/2026): el cliente puede ver/descargar
el PDF de una factura ya emitida por Ventas para su pedido, desde la
misma página de autogestión sin login (`pedido_gestionar_template`,
sección "Facturas") — no hay portal de cliente activado, así que no
usa el mecanismo nativo de Odoo (`/my/invoices`).

- `pedido_gestionar()` pasa `order.invoice_ids.filtered(lambda m:
  m.state == 'posted')` a la plantilla — **solo** facturas ya
  confirmadas, nunca un borrador (todavía puede cambiar de monto/fecha,
  no es algo definitivo para mostrarle al cliente).
- `pedido_factura_pdf(order_id, move_id, token)`: mismo mecanismo de
  token que el resto de la autogestión (`_pedido_por_token`), **más**
  una verificación extra — confirma que la factura puntual (`move_id`)
  pertenece a ESE pedido y sigue `posted`. Sin esto, alguien con un link
  válido de su propio pedido podría cambiar el número de factura en la
  URL y bajarse la de cualquier otro cliente. Genera el PDF con
  `ir.actions.report._render_qweb_pdf('account.account_invoices',
  factura.ids)` y lo devuelve inline (`Content-Disposition: inline`).
- Traducido a los 3 idiomas (`scripts/traducciones/v_2238_pedido.py`).

## Multi-idioma

Los nombres de los 30 productos de venta se cargaron en los 3 idiomas
(reusando el nombre ya traducido de `mi_sitio_web.producto`, no se
tradujeron a mano de nuevo) con el mismo cuidado del orden `es_AR`
primero — ver [idiomas](06-idiomas.md). El resto de las pantallas de
`website_sale` (carrito, checkout) usan las traducciones que ya trae
Odoo de fábrica para esos textos, no hace falta traducir nada ahí.

## Qué falta / decisiones pendientes

- **Precios reales** — los 30 productos migrados siguen en `list_price
  = 0.0` (ver arriba). Aparte, el 09/09/2026 se cargaron ~47 moldes más
  (del conteo de pallets del cliente) como **datos de ejemplo** para
  poder probar CRM/Ventas/Facturación con un catálogo más parecido al
  real — todos con un precio de prueba parejo ($100), no precios reales
  — y se activó "Controlar inventario" (`is_storable`) en los 30 + 47.
  Sigue pendiente cargar precios de verdad en todos.
- **Impuesto de venta duplicado** (encontrado el 09/09/2026 revisando
  Ventas/Facturación, no algo de esta sesión): 60 de 68 moldes —
  incluidos los que ya existían antes, no solo los nuevos — tienen DOS
  impuestos de venta puestos a la vez (`taxes_id`): un "15%" que
  además es el impuesto por defecto configurado en la compañía
  ("Cartotécnica Hores"), y un "VAT 21%" que en realidad pertenece a
  otra compañía de demo distinta ("(AR) Responsable Inscripto",
  datos de ejemplo de la localización argentina de Odoo). Cualquier
  factura real hoy cobraría ~36% de impuesto. **A pedido explícito del
  usuario, no se tocó todavía** — depende de qué régimen fiscal
  corresponde de verdad a Hores, decisión de negocio, no algo para
  adivinar por script.
- **Sin lista de precios en pesos** (mismo relevamiento, 09/09/2026): la
  moneda de la compañía está bien configurada (ARS), pero **ninguna**
  lista de precios de Cartotécnica Hores está en pesos — las únicas que
  tiene son "Default"/"Christmas"/"Benelux" en USD y "EUR" en euros, y
  esas mismas son las que ofrece el sitio a los visitantes. Todo pedido
  y factura, de siempre, se cotiza en dólares/euros en vez de pesos.
  Mismo origen que el punto anterior (datos genéricos de Odoo nunca
  adaptados del todo a Argentina) — **a pedido explícito, queda para la
  misma conversación donde se defina el régimen fiscal**.
- **Checkout con paleta del sitio, pero layout nativo** — colores y
  tipografía ya combinan (ver "Checkout y pago" arriba), pero el
  header/nav y la estructura de esas pantallas siguen siendo las de Odoo,
  no `site_header`. Reconstruir eso es un paso más grande, no pedido
  todavía.
- **Sin pago online** — a propósito, checkout cierra con transferencia
  bancaria manual.
- **`/compras` y `/categoria/<slug>` no tienen "Agregar al carrito"** en
  las tarjetas — el carrito solo se puede armar desde la ficha de cada
  producto (`/producto/<id>`). Se podría sumar un "agregar rápido" desde
  el listado más adelante si hace falta.
- **Disponibilidad (`mi_sitio_web.producto.disponibilidad`) sigue
  siendo manual, sin relación con el stock real** — `stock` sí está
  instalado y en uso (`is_storable` + `stock.quant`, ver el punto de
  precios arriba), pero nada conecta ese stock con el badge
  "Disponible"/"A pedido"/"Sin stock" del sitio ni con el bloqueo de
  "Agregar al carrito" — eso sigue siendo un campo cargado a mano. Se
  podría conectar de verdad más adelante si hace falta.
