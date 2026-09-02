# Idiomas del sitio

El sitio es multi-idioma: **español (default), inglés, portugués (Brasil),
italiano, francés, alemán y chino simplificado**. Se armó con la
infraestructura nativa de Odoo (`res.lang` + idiomas del `website`), no
con una solución propia.

## Qué idiomas están activos y por qué

Se evaluó "todos los idiomas posibles" y se decidió arrancar con 3 idiomas
reales y traducidos a mano, en vez de activar decenas de idiomas con
traducción automática o sin traducir — ver la conversación donde se decidió
esto (25/08/2026). Activar un idioma en el selector sin tener su contenido
traducido deja páginas rotas a medias (interfaz en un idioma, contenido en
otro), así que cada idioma nuevo que se agregue tiene que traer su
traducción completa antes de sumarse al switcher. El 02/09/2026, a pedido
explícito, se sumaron 4 idiomas más (italiano, francés, alemán, chino
simplificado) — ver el gotcha nuevo más abajo sobre cómo instalarlos sin
romper todo lo que ya estaba traducido.

| Idioma | Código Odoo | Prefijo de URL | Default |
|---|---|---|---|
| Español (Argentina) | `es_AR` | (sin prefijo) | Sí |
| Inglés (US) | `en_US` | `/en/...` | No |
| Portugués (Brasil) | `pt_BR` | `/pt/...` | No |
| Italiano | `it_IT` | `/it/...` | No |
| Francés | `fr_FR` | `/fr/...` | No |
| Alemán | `de_DE` | `/de/...` | No |
| Chino (simplificado) | `zh_CN` | `/zh_CN/...` | No |

Configurado en el registro `website` (id 1, "My Website" — hay un segundo
website de prueba en la instancia, id 2, que no es el nuestro) vía
`language_ids` (los 7) y `default_lang_id` (es_AR). El prefijo de URL lo
resuelve Odoo solo (`/mi-sitio`, `/en/mi-sitio`, `/pt/mi-sitio`, etc.)
porque todas las rutas del controlador ya usaban `website=True`. Nota:
`zh_CN` usa `/zh_CN/` como prefijo (no `/zh/`) — así lo nombra Odoo, no
es algo que se haya configurado a mano.

## Selector de idioma

El sitio usa un header 100% custom (`site_header`, sin los snippets
default de Odoo), así que el selector de idioma que Odoo agrega solo a los
headers estándar **no aparece solo** — hay que llamarlo a mano. Se reusa el
componente nativo en vez de reconstruirlo:

```xml
<t t-call="portal.language_selector">
  <t t-set="_div_classes" t-value="'hc-lang-selector'"/>
  <t t-set="_btn_class" t-value="'hc-lang-btn'"/>
  <t t-set="_dropdown_menu_class" t-value="'hc-lang-menu'"/>
</t>
```

en `catalogo_templates.xml`, dentro de `site_header`. Los estilos
`.hc-lang-*` (en `head_assets`) le dan la estética del sitio en vez de las
clases default de Bootstrap. Importante: los `t-set` de las clases van como
**atributo** (`t-value="'...'"`), no como contenido de texto del `<t>` —
si se escriben como texto (`<t t-set="_btn_class">hc-lang-btn</t>`) Odoo lo
trata como un término traducible más (aunque sea un nombre de clase CSS) y
ensucia la lista de términos a traducir sin ningún beneficio.

`portal.language_selector` arma los links solo (`url_localized`), incluye
`hreflang`/dropdown accesible y ya funciona en todas las páginas porque
`site_header` es compartido.

## Cómo está traducido el contenido

Hay **tres mecanismos distintos** según de dónde sale el texto:

### 1. Campos del modelo (catálogo)

`categoria.name`, `producto.name/summary/description`,
`producto.spec.label/value` y `producto.feature.name` tienen
`translate=True`. Cada uno guarda un valor por idioma; Odoo elige el
correcto solo según el idioma activo del request. El `slug` de categoría
**no** se tradujo a propósito — tiene que ser el mismo en las 3 URLs.

### 2. Texto fijo de las plantillas QWeb (todo lo demás)

El texto "fijo" de cada página (títulos, botones, FAQ, nav, footer, etc.)
se tradujo con el mecanismo de términos de Odoo
(`ir.ui.view.update_field_translations('arch_db', {...})`), **sin tocar el
XML de las vistas**: se le pasa un diccionario `{idioma: {texto_original:
texto_traducido}}` por cada vista y Odoo arma la versión de esa página en
ese idioma. Es el mismo mecanismo que usa el editor "Traducir" del sitio
en el backend, aplicado por script en vez de a mano.

### 3. Historia (`/historia`): constantes de Python

A diferencia del resto, el contenido de Historia (stats, timeline, misión/
visión, valores, distribución por línea, clientes, países, objetivos) no
vive en vistas ni en el modelo — son constantes armadas en
`controllers/main.py` (`HISTORIA_STATS`, etc., ver también
[pendientes](04-pendientes-y-datos-de-ejemplo.md), son datos de ejemplo).
Por eso tienen su **propio mecanismo de idioma**: `_HISTORIA_ES`,
`_HISTORIA_EN`, `_HISTORIA_PT` son tres diccionarios paralelos, agrupados
en `HISTORIA_POR_IDIOMA`, y `_historia_data(request.env.lang)` elige el
que corresponde (con fallback a español si el idioma no tiene entrada). Si
se agrega un idioma nuevo al sitio, o se reemplazan los datos de ejemplo
por los reales, hay que actualizar **los tres diccionarios**, no solo uno.

## ⚠️ Gotcha importante: el idioma "fuente" de Odoo no es el idioma real del sitio

Esto rompió el sitio dos veces durante el desarrollo (25/08/2026) y vale la
pena entenderlo antes de tocar traducciones de nuevo:

Para un campo `translate=True` (sea un campo de modelo como `producto.name`
o el `arch_db` de una vista), Odoo guarda un diccionario `{idioma: valor}`
en la base. Cuando un registro se crea **sin pasar ningún contexto de
idioma** (que es lo normal: una migración, la carga de datos del módulo,
etc.), Odoo guarda ese valor bajo la clave `en_US` — sin importar en qué
idioma esté escrito el texto de verdad. `en_US` actúa como el "idioma
fuente" interno de Odoo por convención, no como "el valor en inglés".

Acá todo el contenido original está en **español**, así que quedó guardado
bajo la clave `en_US` (no bajo `es_AR`, que nunca se había escrito
explícitamente). Mientras `es_AR` no tenga su propia entrada, Odoo hace
fallback a `en_US` para resolverlo — que es lo que hacía que el sitio en
español "funcionara" incluso antes de activar más idiomas.

El problema: al escribir la traducción real al inglés bajo `en_US` (lo
lógico, es literalmente el código del idioma), **se pisa esa misma clave
que hacía de fuente/fallback en español** → el sitio en español (default,
sin prefijo de URL) empieza a mostrar el texto en inglés.

**La solución aplicada**: antes de escribir `en_US`/`pt_BR`, escribir
`es_AR` explícitamente con el texto original en español (para los modelos,
un `write()` normal con `context={'lang': 'es_AR'}`; para las vistas, un
`update_field_translations` con mapeo identidad `{texto: texto}` bajo la
clave `es_AR`, **antes** de la llamada que escribe `en_US`/`pt_BR` — el
orden importa, porque una vez que `es_AR` tiene su propia entrada ya no
depende del fallback a `en_US`). Los scripts usados para esto no quedaron
en el repo (se generaron y corrieron desde el scratchpad de la sesión),
pero si hace falta re-traducir algo, replicar este orden:

1. Escribir/confirmar `es_AR` primero (texto original, aunque sea
   idéntico al que ya está).
2. Recién después escribir `en_US` y `pt_BR`.

Si en el futuro se traduce un campo o vista nuevos, seguir este mismo
orden — o el sitio en español puede quedar mostrando otro idioma sin que
sea evidente hasta que alguien lo visita sin el prefijo `/en`/`/pt`.

### Gotcha #1b: la "clave" para `pt_BR` cambia después de escribir `en_US`

Encontrado el 28/08/2026, traduciendo contenido real (ver
[pendientes](04-pendientes-y-datos-de-ejemplo.md)). Al llamar
`update_field_translations` tres veces seguidas con el **mismo texto en
español** como clave (`{es_AR: {ES: ES}}`, después `{en_US: {ES: EN}}`,
después `{pt_BR: {ES: PT}}`), la tercera llamada **no encuentra nada
para reemplazar** y no hace nada (sin error, sin aviso) — el texto en
portugués queda con el valor viejo.

Motivo: `en_US` actúa como idioma "fuente" (ver gotcha de arriba). Una
vez que la 2ª llamada le escribe un valor nuevo a `en_US`, ese pasa a
ser el texto contra el que Odoo compara las claves de las llamadas
siguientes — la clave en español ya no matchea nada.

**Orden correcto**: escribir `es_AR` (clave = texto original en
español), después `en_US` (misma clave, español → inglés), y para
`pt_BR` usar como clave el texto en **inglés** recién escrito, no el
español:

```python
update_field_translations(view_ids, 'arch_db', {'es_AR': {ES: ES}})
update_field_translations(view_ids, 'arch_db', {'en_US': {ES: EN}})
update_field_translations(view_ids, 'arch_db', {'pt_BR': {EN: PT}})  # clave = EN, no ES
```

Se puede confirmar si una traducción quedó bien pegada con
`ir.ui.view.get_field_translations(view_id, 'arch_db')` — devuelve una
lista con `{lang, source, value}` por término; si `value` está vacío o
es el texto viejo, no se escribió.

**Ver también [gotcha #1c en bolsa de trabajo](08-bolsa-de-trabajo.md#gotcha-de-traducción-una-plantilla-nueva-puede-perder-el-español-al-traducirla)**:
seguir exactamente esta receta (saltear `es_AR`) hizo que una plantilla
nueva mostrara **inglés en la versión en español** — no se encontró
la condición exacta que lo dispara. **Corrección confirmada**:
escribir `es_AR` como identidad (`{texto: texto}`) para cada término
**antes** de tocar `en_US`, en vez de saltearlo — probado dos veces
en la misma sesión, sin que se rompiera nada. Usar esta versión más
segura de la receta (los 3 pasos, no 2) de acá en adelante, y de
todos modos probar la versión sin prefijo de idioma después de
traducir, no solo `/en` y `/pt`.

## ⚠️ Gotcha #1d (la causa real de #1b y #1c): falta `source_lang='es_AR'`

Encontrado el 02/09/2026, agregando italiano/francés/alemán/chino. Todo
el patrón de arriba (escribir `es_AR` identidad, después `en_US`,
después cada idioma con la clave en inglés) era en realidad un
**parche alrededor de un bug propio, no la forma correcta de usar el
método**.

`update_field_translations` tiene un parámetro `source_lang` que le
dice a Odoo en qué idioma están las CLAVES del diccionario que se le
pasa — y ese parámetro **no tiene nada que ver con `es_AR` por
default: asume `en_US` si no se lo pasa explícito** (está en la
docstring del método, `odoo/orm/models.py`,
`_update_field_translations`). Como el contenido real del sitio está
en español, todas las llamadas de este proyecto (¡desde antes de esta
sesión!) venían mintiéndole a Odoo sobre en qué idioma estaban las
claves — y por eso hacía falta la cadena rara de 3 pasos: la primera
llamada (a `en_US`, con clave en español) solo "funcionaba" porque,
para un término recién creado sin ninguna traducción todavía, la
comparación caía por casualidad en el texto español de base; una vez
que esa llamada pegaba, listo, malas cadenas de comodín en los pasos
siguientes.

**La solución real** — pasar `source_lang='es_AR'` siempre — hace
que la clave del diccionario sea el texto real en español, para
cualquier idioma, en cualquier orden, sin la cadena de 3 pasos:

```python
# Antes (frágil, dependía de qué se hubiera escrito antes):
update_field_translations(view_id, 'arch_db', {'es_AR': {ES: ES}})
update_field_translations(view_id, 'arch_db', {'en_US': {ES: EN}})
update_field_translations(view_id, 'arch_db', {'pt_BR': {EN: PT}})  # clave = EN, no ES

# Ahora (confiable, mismo texto en español como clave siempre):
update_field_translations(view_id, 'arch_db', {'en_US': {ES: EN}}, 'es_AR')
update_field_translations(view_id, 'arch_db', {'pt_BR': {ES: PT}}, 'es_AR')
update_field_translations(view_id, 'arch_db', {'it_IT': {ES: IT}}, 'es_AR')
# ... cualquier idioma, en cualquier orden, siempre con la clave en español
```

Esto explica retroactivamente los gotchas #1b y #1c de más arriba —
quedan documentados igual, por si alguien se cruza con el mismo
síntoma, pero **la corrección de fondo es esta, no la cadena de 3
pasos**. `scripts/traducir_vista.py` (`bulk_translate`, `dump_terms`)
ya pasa `source_lang` siempre — usarlo en vez de armar las llamadas a
mano.

## ⚠️ Gotcha #3: instalar un idioma nuevo rompe TODAS las traducciones existentes

Encontrado el 02/09/2026, instalando italiano/francés/alemán/chino
para sumarlos al sitio. Instalar idiomas nuevos vía el asistente
estándar de Odoo (`base.language.install`, `lang_install()` → llama a
`ir.module.module._update_translations(...)` para TODOS los módulos
instalados) tiene un efecto secundario grave y no documentado en este
proyecto: **pisa el contenido de `en_US` y `pt_BR` de TODAS las vistas
del sitio con el texto en español**, no solo de los idiomas que se
están instalando.

Confirmado mirando la columna `arch_db` directo en Postgres
(`docker compose exec db psql -U odoo -d odoo.bd -c "SELECT
jsonb_pretty(arch_db) FROM ir_ui_view WHERE id = <algún view_id>"`):
antes de instalar los idiomas nuevos, esa columna tenía distinto texto
por idioma; después, `en_US` y `pt_BR` tenían el mismo texto español
que `es_AR`. Todo el sitio (títulos, textos, todo) quedó mostrando
español en las versiones `/en` y `/pt` hasta que se detectó y se
volvió a traducir todo a mano.

**No hay forma de deshacer esto** — esas traducciones vivían solo en
la base de datos (no en Git, que solo tiene el contenido en español),
así que no hay un "volver atrás" automático; hay que re-traducir.

**Si se vuelve a instalar un idioma nuevo en este proyecto**:
1. Antes de instalar, avisar que esto va a pasar (no es opcional, es
   el comportamiento del wizard de Odoo).
2. Después de instalar, verificar `en_US` y `pt_BR` en un par de
   páginas ya traducidas ANTES de asumir que solo falta agregar el
   idioma nuevo — probablemente haya que re-traducir todo el sitio
   otra vez, no solo sumar el idioma que se acaba de instalar.
3. Usar `source_lang='es_AR'` (gotcha de arriba) para que la
   re-traducción sea confiable.

## Estado de la traducción a los 4 idiomas nuevos (02/09/2026)

A pedido explícito, se sumaron italiano/francés/alemán/chino
simplificado — hecho paso a paso, verificando cada página antes de
seguir con la próxima (mismo criterio que la corrección de `en_US`/
`pt_BR` de arriba, que se necesitó de vuelta por el gotcha #3).

**Completo y verificado en los 7 idiomas**, todas las vistas propias
del módulo:
- Header (`site_header`) y footer (`site_footer`)
- Home (`home_template`) — hero, empresa, productos, calidad,
  sustentabilidad, FAQ, trabajá con nosotros, contacto
- `/historia` — el contenido real (Python, `HISTORIA_POR_IDIOMA` en
  `controllers/main.py`) y la plantilla en sí (`historia_template`)
- `/calidad`, `/compromiso`
- `/compras`, `/categoria/<slug>`, `/producto/<id>`
- Checkout adyacentes: `pedido_gestionar_template`,
  `consultar_pedido_template`, `postulacion_gracias_template`,
  `pagina_no_encontrada`

El checkout nativo de `website_sale` en sí (carrito, direcciones,
pago) no se tocó a propósito — son strings de Odoo, ya vienen
traducidas de fábrica para estos 4 idiomas al instalarlos (son
idiomas oficiales con traducción de la comunidad), no hace falta
re-traducirlas a mano.

**Si se agrega contenido nuevo de acá en más**: usar
`scripts/traducir_vista.py` (`dump_terms(view_id)` para ver el estado
actual de una vista, `bulk_translate(view_id, rows)` para escribir,
siempre con `source_lang='es_AR'` como ya hace el helper) para sumar
los 7 idiomas desde el principio, en vez de dejarlo para después.

## ⚠️ Gotcha #2: `request.redirect()` no preserva el idioma

Encontrado y corregido el 26/08/2026, al agregar el formulario de
"Solicitar pedido" ([pedidos](07-pedidos.md)).

Odoo reescribe automáticamente los `href`/`action` **de la página
renderizada** para que apunten a la versión con el prefijo de idioma
correcto (por eso un link `href="/historia"` en el código sale como
`href="/en/historia"` cuando la página se sirve en inglés, sin que haya
que hacer nada especial). Pero esa reescritura automática es parte del
post-procesado del HTML — **no** se aplica al header `Location` de una
redirección HTTP armada a mano con `request.redirect('/algo')`. Ese string
sale exactamente como se escribió, sin importar en qué idioma esté
navegando el visitante.

Efecto real: un visitante llenando el popup de pedido en `/en/producto/7`
(o el formulario de contacto en `/pt/mi-sitio`) enviaba el formulario
correctamente a la URL en inglés/portugués (el `action=` del form sí se
reescribe solo, es parte del HTML), pero la redirección de vuelta —tanto
la de éxito como la de error de validación— lo mandaba a la versión en
**español** de la página siguiente, cortando el idioma justo en la
confirmación final.

**Solución**: un helper `_redirect(path)` en `controllers/main.py` que
envuelve `request.redirect()` pasando el path por
`request.env['ir.http']._url_for(path)` primero — ese es el mismo método
que Odoo usa internamente para la reescritura automática de links, así que
antepone el prefijo correcto (o ninguno, si el idioma activo es el
default) antes de redirigir. **Todo redirect a una URL relativa que el
visitante vaya a ver tiene que pasar por este helper, no por
`request.redirect()` directo** — si se agrega una ruta nueva con su propio
redirect, usar `_redirect()` o va a reproducirse este mismo bug.

## Qué falta / gaps conocidos

- El mensaje que arma `producto.whatsapp_url` ("Hola, quiero consultar
  por...") queda siempre en español, sin importar el idioma de la página.
  No se localizó todavía — es texto generado en Python (no QWeb ni campo
  de modelo), y el negocio opera en español de todas formas, así que se
  postergó a propósito.
- Si se agrega una página o sección nueva al sitio, su texto nuevo queda
  **solo en español** hasta que se traduzca a mano con el mecanismo que
  corresponda (punto 1, 2 o 3 arriba según de dónde salga el texto) — no
  hay traducción automática ni un aviso si falta.
- Los datos de Historia siguen siendo de ejemplo en los 3 idiomas (ver
  [pendientes](04-pendientes-y-datos-de-ejemplo.md)); cuando se reemplacen
  por reales hay que traducirlos a los 3 diccionarios, no solo al español.
