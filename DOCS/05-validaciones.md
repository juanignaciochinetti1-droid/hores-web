# Validaciones

Catálogo de todas las validaciones del sitio: qué existe, dónde vive cada
una, y qué se corrigió en la revisión del 25/08/2026.

## A nivel modelo (Odoo ORM)

| Modelo | Campo | Validación | Cómo |
|---|---|---|---|
| `mi_sitio_web.producto` | `name` | Obligatorio | `required=True` |
| `mi_sitio_web.producto` | `category_id` | Obligatorio (todo producto debe tener categoría real) | `required=True` |
| `mi_sitio_web.producto` | `code` | Único (permite vacío en más de un registro — NULL no colisiona en Postgres) | `models.Constraint('unique(code)', ...)` |
| `mi_sitio_web.producto` | `disponibilidad` | Obligatorio, uno de `disponible`/`a_pedido`/`sin_stock` | `required=True` + `Selection` (ver [pedidos](07-pedidos.md)) |
| `mi_sitio_web.categoria` | `name` | Obligatorio | `required=True` |
| `mi_sitio_web.categoria` | `slug` | Obligatorio, único, **y con formato válido** (`^[a-z0-9]+(-[a-z0-9]+)*$` — minúsculas/números/guiones, sin espacios ni acentos) | `required=True` + `models.Constraint` + `@api.constrains` |
| `mi_sitio_web.producto.spec` | `label`, `value` | Obligatorios | `required=True` |
| `mi_sitio_web.producto.feature` | `name` | Obligatorio | `required=True` |
| `*.spec` / `*.feature` / `*.variante` | `producto_id` | Obligatorio, se borra en cascada si se borra el producto | `required=True, ondelete='cascade'` |

> **Nota sobre `_sql_constraints`**: esa forma vieja de declarar
> restricciones únicas quedó deprecada en esta versión de Odoo y **dejó de
> aplicarse de verdad** (se detectó porque permitía crear duplicados sin
> error). El reemplazo correcto es un atributo de clase
> `models.Constraint('unique(campo)', 'mensaje')`. Si se agrega una
> restricción nueva a cualquier modelo, usar ese patrón — no
> `_sql_constraints`.

## Seguridad (quién puede escribir qué)

`security/ir.model.access.csv`: usuarios internos (`base.group_user`)
tienen lectura/escritura/creación/borrado sobre los 5 modelos del catálogo.
**El público solo tiene lectura** (`perm_write/create/unlink = 0`) — nadie
puede crear ni modificar productos/categorías desde el frontend, ni
siquiera vía API, salvo que sea un usuario logueado del backend.

## Formulario de contacto (`POST /mi-sitio/contacto`)

El HTML tiene `required` y `type="email"` (validación del navegador), pero
eso **no protege nada por sí solo** — cualquiera puede mandar un POST
directo saltándose el navegador. Todo lo que importa se revalida en el
servidor:

| Validación | Detalle |
|---|---|
| Campos obligatorios no vacíos | `nombre`, `email`, `mensaje` (después de `.strip()`) |
| Formato de email | Regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` — rechaza cosas como `"esto-no-es-un-email"` |
| Longitud máxima | `nombre` ≤ 200 caracteres, `mensaje` ≤ 5000 (también como `maxlength` en el HTML, para que el usuario lo vea antes de enviar) |
| Anti-bot (honeypot) | Campo oculto `sitio_web` (invisible por CSS, `tabindex="-1"`, fuera de la pantalla). Una persona nunca lo completa; un bot que autocompleta todos los inputs sí. Si viene con contenido, el servidor responde como si hubiera funcionado (redirige a `/gracias`) pero **no crea el Lead** — así no le da pistas al bot de que fue detectado. |
| CSRF | Token estándar de Odoo (`request.csrf_token()`), obligatorio en el POST |

Si cualquier validación (menos el honeypot) falla, redirige a
`/mi-sitio?contacto_error=1#contacto`, que muestra un banner de error
visible arriba del formulario — antes de esta revisión el parámetro se
generaba pero nada lo leía (bug ya corregido, ver commits previos).

### Qué falta / decisiones pendientes

- **No hay CAPTCHA** (reCAPTCHA/hCaptcha) — el honeypot cubre bots
  simples/automatizados, pero no bloquea un ataque dirigido a mano. Si
  empieza a llegar spam real, agregar CAPTCHA es el siguiente paso (necesita
  cuenta y site-key de Google/hCaptcha).
- **No hay rate-limiting** (ej: máximo N envíos por IP por hora) — Odoo no
  trae uno genérico para controladores custom; si hace falta, se
  implementaría a mano (guardar intentos en `ir.config_parameter` o una
  tabla propia).

## Carrito y checkout (eCommerce)

No hay validaciones propias acá — "Agregar al carrito" en
`/producto/<id>` llama directo a la ruta nativa `/shop/cart/add` de
`website_sale` (ver [pedidos](07-pedidos.md)), y todo el checkout
(dirección, método de envío, pago) usa las validaciones nativas de Odoo,
sin código propio de por medio. El único control del lado nuestro es que
el botón "Agregar al carrito" no aparece si el producto está en
`disponibilidad = 'sin_stock'`, o si no tiene un `sale_product_id`
cargado — ambos chequeados en la plantilla (QWeb `t-if`), no en un
controlador.

> Antes hubo un formulario propio de "Solicitar pedido" (`POST
> /mi-sitio/pedido`) con su propia validación server-side (honeypot,
> CSRF, variante obligatoria, límites de longitud) — se sacó al conectar
> el carrito real de eCommerce (26/08/2026). Si hace falta consultar cómo
> era, está en el historial de la sesión, no en el código actual.

## Cómo probar las validaciones

Todas se probaron manualmente contra el servidor real antes de dar la
tarea por cerrada (no alcanza con leer el código):

```bash
# Slug con formato inválido -> debe rechazar (ValidationError)
# Slug válido -> debe aceptar
# Email con formato inválido en el form -> debe redirigir con banner de error
# Honeypot lleno -> debe "fingir éxito" (redirige a /gracias) SIN crear Lead
# Envío válido -> debe crear el Lead y redirigir a /gracias
```

Ver el historial de la sesión del 25/08/2026 para los comandos `curl`
exactos usados.
