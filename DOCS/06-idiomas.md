# Idiomas del sitio

El sitio es multi-idioma: **español (default), inglés y portugués (Brasil)**.
Se armó con la infraestructura nativa de Odoo (`res.lang` + idiomas del
`website`), no con una solución propia.

## Qué idiomas están activos y por qué

Se evaluó "todos los idiomas posibles" y se decidió arrancar con 3 idiomas
reales y traducidos a mano, en vez de activar decenas de idiomas con
traducción automática o sin traducir — ver la conversación donde se decidió
esto (25/08/2026). Activar un idioma en el selector sin tener su contenido
traducido deja páginas rotas a medias (interfaz en un idioma, contenido en
otro), así que cada idioma nuevo que se agregue tiene que traer su
traducción completa antes de sumarse al switcher.

| Idioma | Código Odoo | Prefijo de URL | Default |
|---|---|---|---|
| Español (Argentina) | `es_AR` | (sin prefijo) | Sí |
| Inglés (US) | `en_US` | `/en/...` | No |
| Portugués (Brasil) | `pt_BR` | `/pt/...` | No |

Configurado en el registro `website` (id 1, "My Website" — hay un segundo
website de prueba en la instancia, id 2, que no es el nuestro) vía
`language_ids` (los 3) y `default_lang_id` (es_AR). El prefijo de URL lo
resuelve Odoo solo (`/mi-sitio`, `/en/mi-sitio`, `/pt/mi-sitio`) porque
todas las rutas del controlador ya usaban `website=True`.

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
