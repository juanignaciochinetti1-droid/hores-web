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
  tabla propia). Esto aplica también al formulario de pedidos, más abajo.

## Formulario de "Solicitar pedido" (`POST /mi-sitio/pedido`)

Mismo patrón que el formulario de contacto (honeypot, CSRF, validación
server-side, PRG), aplicado a la creación de un presupuesto real en Ventas
— ver [pedidos](07-pedidos.md) para el detalle de qué registra en Odoo.

| Validación | Detalle |
|---|---|
| `producto_id` | Tiene que ser un ID numérico de un producto existente y publicado — si no, `404` (mismo criterio que `/producto/<id>`), no un error de formulario |
| `variante_id` (opcional) | Si viene, tiene que ser un ID numérico de una variante que **pertenezca al producto** enviado — una variante de otro producto se rechaza igual que si no existiera |
| Variante obligatoria condicional | Si el producto tiene variantes cargadas, **no** se puede dejar sin elegir una — pedir "un tamaño cualquiera" no tiene sentido para fabricación |
| `cantidad` | Entero, > 0 y ≤ 100.000 (`CANTIDAD_MAX`, límite defensivo contra valores absurdos, no una regla de negocio real) |
| `nombre`, `email` | Igual que el formulario de contacto: obligatorios, formato de email validado, `nombre` ≤ 200 |
| `empresa`, `telefono` | Opcionales, con longitud máxima (200 y 40 caracteres) |
| `mensaje` (notas) | Opcional, ≤ 5000 caracteres |
| Anti-bot (honeypot) | Mismo campo oculto `sitio_web`, mismo comportamiento: finge éxito sin crear nada |
| CSRF | Token estándar de Odoo, igual que el contacto |

Si cualquier validación falla, redirige a `/producto/<id>?pedido_error=1`
— la ficha del producto lee ese parámetro y abre el popup de "Solicitar
pedido" ya abierto, con el banner de error arriba del formulario (no hace
falta un anchor: el popup es `position:fixed`, se ve entre a la altura de
scroll que esté). Probado contra el servidor real: envío válido con
variante (crea `sale.order` + `res.partner`), sin variante en un producto
que la requiere (rechaza), honeypot lleno (finge éxito, no crea nada),
`producto_id` inexistente (404).

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
