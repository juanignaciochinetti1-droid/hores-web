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
`sale_product_id` cargado, aparece un bloque con selector de tamaño (si
corresponde), cantidad y el botón. El click llama directo a
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
reconstrucción del layout: el header/nav de `/shop` sigue siendo el de
Odoo, no el nuestro — si más adelante se quiere ese nivel de detalle, es
un paso siguiente natural y más grande.

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

## Multi-idioma

Los nombres de los 30 productos de venta se cargaron en los 3 idiomas
(reusando el nombre ya traducido de `mi_sitio_web.producto`, no se
tradujeron a mano de nuevo) con el mismo cuidado del orden `es_AR`
primero — ver [idiomas](06-idiomas.md). El resto de las pantallas de
`website_sale` (carrito, checkout) usan las traducciones que ya trae
Odoo de fábrica para esos textos, no hace falta traducir nada ahí.

## Qué falta / decisiones pendientes

- **Precios reales** — ver arriba, es lo primero que hay que cargar.
- **Moneda de la empresa en USD en vez de ARS** — ver arriba, bloqueado
  por apuntes contables existentes, hay que resolverlo en el backend.
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
- **Disponibilidad sigue siendo manual** — no hay Inventario (`stock`)
  instalado; si el catálogo crece, evaluar activarlo para que la
  disponibilidad (y el bloqueo de "Agregar al carrito") salga de stock
  real en vez de un campo cargado a mano.
