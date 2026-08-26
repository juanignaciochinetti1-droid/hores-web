# Pedidos ("Solicitar pedido")

## Decisión de alcance

El proyecto tenía documentada la decisión de **no reconstruir
Pedidos/Facturación a mano** y usar las apps nativas de Odoo si algún día
hacían falta (ver [arquitectura](02-arquitectura-proyecto.md)). Esta
funcionalidad respeta esa decisión: no se programó un sistema de pedidos
propio, se conecta el sitio a **Ventas** (`sale.order`), el módulo nativo
de Odoo.

Se evaluaron dos caminos y se eligió el más liviano:

| Opción | Elegida |
|---|---|
| **Solicitar pedido**: formulario por producto (cantidad, variante, notas) que crea un presupuesto (`sale.order`) para que el equipo lo confirme a mano — sin carrito ni pago online. | ✅ |
| E-commerce completo: carrito + checkout + pago online vía Website Sale, migrando todo el catálogo a `product.product` real. | ❌ (por ahora) |

Por qué: el sitio siempre tuvo un estilo consultivo (botón de WhatsApp en
cada producto, sin precios públicos, moldes con cantidades grandes y a
veces personalizados) — un carrito de e-commerce no encaja con eso. El
formulario de "Solicitar pedido" es, en los hechos, una versión del botón
de WhatsApp que **además** queda registrada como un presupuesto real en
Odoo en vez de perderse en un chat.

## Qué pasa cuando alguien solicita un pedido

1. En `/producto/<id>`, un botón "Solicitar pedido" (al lado del de
   WhatsApp) abre un **popup** (`#pedido-modal-overlay`, clase
   `.hc-modal-overlay`/`.hc-modal-panel` — ver
   [sistema de diseño](03-sistema-de-diseno.md)) con el formulario chico:
   tamaño (si el producto tiene variantes), cantidad, nombre, email,
   empresa/teléfono/notas opcionales. Se cierra con la ✕, con Escape o
   clickeando fuera del panel. **No hay un formulario largo incrustado en
   la página** — se probó esa versión primero y se cambió a popup a
   pedido explícito, para que el flujo sea "click en el molde → formulario
   chico", no una sección más para scrollear.
2. `POST /mi-sitio/pedido` (`controllers/main.py`) valida todo
   server-side (ver [validaciones](05-validaciones.md#formulario-de-solicitar-pedido-post-mi-sitiopedido)).
3. Busca un `res.partner` por email; si no existe, lo crea (`nombre`,
   `email`, `phone`).
4. Crea un `sale.order` (queda en estado `draft`, "Presupuesto" en el
   backend de Ventas — **nadie lo confirma automáticamente**, lo revisa el
   equipo):
   - `partner_id`: el contacto encontrado/creado.
   - `client_order_ref`: el código del producto (`producto.code`), para
     ubicarlo rápido en la lista de presupuestos.
   - `medium_id`: `utm.utm_medium_website` (mismo tracking que el
     formulario de contacto).
   - `note`: empresa / teléfono / mensaje del cliente, todo junto (Ventas
     no tiene un campo por separado para cada uno a nivel del pedido).
   - Una única línea (`sale.order.line`) con la cantidad pedida y una
     descripción armada en el momento: nombre del producto + variante
     (código/medidas/peso) si corresponde.
5. Redirige (patrón Post/Redirect/Get) a `/mi-sitio/pedido/gracias`.

El equipo revisa los presupuestos entrantes desde **Ventas → Presupuestos**
en el backend de Odoo, como cualquier otro presupuesto — no hay pantalla
custom para esto, es la app nativa.

## El producto "puente"

`sale.order.line` necesita un `product_id` real de Odoo
(`product.product`), pero el catálogo público (`mi_sitio_web.producto`) es
un modelo propio, sin relación con los productos reales de Odoo — migrar
todo el catálogo (imágenes, specs, variantes) a los modelos nativos solo
para esto no valía la pena.

Solución: un único producto genérico,
`mi_sitio_web.product_pedido_generico` ("Solicitud de pedido — sitio web",
tipo servicio, `data/pedido_producto_data.xml`), que se usa como línea en
**todos** los pedidos. El detalle real (qué molde, qué variante, cuánto)
no vive en ese producto — vive en el texto de la línea (`name`) y en la
cantidad (`product_uom_qty`), armados en el controlador. Si en algún
momento se decide migrar a productos reales por línea, este es el punto
donde se reemplazaría.

## Disponibilidad (filtros de "no hay stock")

`mi_sitio_web.producto.disponibilidad` (`Selection`, obligatorio, default
`disponible`): `disponible` / `a_pedido` / `sin_stock`. **Se carga a mano
en el backend** — no hay integración con el módulo de Inventario de Odoo
ni descuento automático de stock al confirmar un pedido (se evaluó y se
decidió no hacerlo: no había necesidad de manejar inventario real, solo de
comunicar disponibilidad).

Dónde se usa:

- **Badge** en la ficha de producto, en las tarjetas de `/compras` y en
  las filas de `/categoria/<slug>` — "Disponible" no se muestra como badge
  en la tarjeta (es el estado esperado/por defecto, mostrarlo siempre
  sería ruido visual), pero "A pedido" y "Sin stock" sí, para que se note
  la excepción.
- **Popup de pedido**: `sin_stock` **no bloquea** el envío — cambia el
  texto de ayuda y el botón ("Avisame cuando esté disponible" en vez de
  "Solicitar pedido"), para capturar la demanda igual. `a_pedido` solo
  agrega una aclaración de que puede demorar en producción.

> Hubo también un filtro client-side (chips "Todos / Disponible / A
> pedido / Sin stock") en `/compras` y `/categoria/<slug>` — se sacó a
> pedido explícito (26/08/2026), quedó solo el badge informativo. Si se
> quiere retomar, el patrón (atributos `data-*` en cada tarjeta + JS) está
> en el historial de la sesión, no en el código actual.

## Multi-idioma

Todo lo nuevo (badges, popup, formulario, mensajes de error, la página de
gracias) está traducido a los 3 idiomas del sitio con el mismo mecanismo
que el resto — ver [idiomas](06-idiomas.md), **incluido el gotcha del
orden `es_AR` antes que `en_US`/`pt_BR`** al escribir traducciones nuevas.

## Qué falta / decisiones pendientes

- **Precios**: el producto puente tiene `list_price = 0.0` y las líneas de
  pedido no llevan precio — el equipo lo completa a mano al preparar el
  presupuesto real en Ventas. No hay tarifario público en el sitio.
- **Sin portal de cliente**: el visitante no puede ver el estado de su
  pedido después de enviarlo (no hay login). Si se necesita, Odoo ya trae
  Portal de Cliente nativo — activarlo es la vía, no programarlo a mano
  (misma lógica que la decisión original de no reconstruir Ventas).
- **Sin pago online** ni checkout — a propósito, ver "Decisión de
  alcance" arriba.
- **Disponibilidad manual**: si el catálogo crece mucho, cargar el estado
  a mano deja de ser práctico — en ese momento vale la pena evaluar
  Inventario real (`stock`), que **no** está instalado (solo se instaló
  `sale`, no arrastra `stock` como dependencia).
