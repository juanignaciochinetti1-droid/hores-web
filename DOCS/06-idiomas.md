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

## ⚠️ Gotcha #3: instalar un idioma nuevo — Y actualizar el módulo — rompen TODAS las traducciones existentes

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

### El mismo gotcha, disparado por `button_immediate_upgrade` (02/09/2026, más tarde)

Ese mismo día, horas después de terminar y verificar la traducción a
los 7 idiomas, se hizo un cambio de XML sin relación con idiomas
(deduplicar la carga de Google Fonts en `ecommerce_theme_templates.xml`,
ver el commit de rendimiento) y se aplicó de la única forma que existe
para que Odoo tome cambios de vistas: `button_immediate_upgrade` sobre
`mi_sitio_web`. **Eso solo volvió a romper la traducción de las 13
vistas** — mismo síntoma exacto (arch_db de la mayoría de los idiomas
igual al español), confirmado comparando `write_date` por vista:
todas quedaron con el mismo timestamp, el del momento del upgrade.

Es decir: **no es un problema exclusivo de instalar idiomas** — es que
`button_immediate_upgrade` recarga el XML de los módulos desde disco
y, como ese XML en Git solo tiene el texto en español (las
traducciones a los otros 6 idiomas viven solo en la base), el upgrade
las pisa. Como este proyecto no tiene otra forma de aplicar cambios de
vistas sin pasar por un upgrade del módulo (no hay `-u` en el `CMD` del
Dockerfile, ver `DOCS/01-stack-y-herramientas.md`), **cualquier cambio
futuro a una vista XML de `mi_sitio_web` va a volver a disparar esto**.

**Protocolo para cualquier cambio de vista/XML de acá en más**:
1. Hacer el cambio en el XML y aplicarlo con `button_immediate_upgrade`
   como siempre.
2. Inmediatamente después, correr
   `python scripts/traducciones/reaplicar_todo.py` desde la raíz del
   repo (re-escribe las 13 vistas en los 7 idiomas, es idempotente —
   no importa si algunas ya estaban bien).
3. Verificar con `curl` un par de idiomas antes de dar por terminado
   el cambio (ver ejemplo de verificación en el propio
   `reaplicar_todo.py`).

Los scripts fuente de cada término traducido (uno por vista, con el
helper `translate_helpers.py` que ya pasa `source_lang='es_AR'`) están
committeados en `scripts/traducciones/` — antes vivían solo como
archivos sueltos en el scratchpad de la sesión de Claude Code, que se
borra al terminar; se movieron al repo específicamente para no
depender de eso. Si se agrega contenido nuevo a una vista, sumar sus
términos al script de esa vista (o crear uno nuevo y agregarlo a la
lista `SCRIPTS` de `reaplicar_todo.py`).

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

### Corrección del 02/09/2026 (tarde): header/footer/home habían quedado sin re-traducir

Después de terminar el trabajo de arriba y commitear, el usuario
reportó que el sitio "no traduce a ningún idioma" — se verificó con
`curl` en los 7 idiomas y, efectivamente, `/en/mi-sitio`, `/it/mi-sitio`,
etc. mostraban el título en español.

**No fue un tercer evento de corrupción.** Comparando `write_date` de
`ir_ui_view` por vista, tres vistas (`home_template`=1318,
`site_header`=1439, `site_footer`=1440) tenían `write_date` congelado
en el momento exacto del gotcha #3 (02/09 15:04–15:06), mientras que
las otras 10 vistas tenían `write_date` de la sesión posterior (cuando
se re-tradujo todo). Es decir: la instalación de idiomas rompió esas
3 vistas igual que a las demás, pero **la re-traducción posterior se
saltó justo el header, el footer y el home** — las 3 vistas que se
ven en *todas* las páginas, por eso el sitio entero parecía sin
traducir aunque el resto (`/historia`, `/calidad`, `/compras`, etc.)
sí estuviera bien.

Al recuperar los scripts originales (`v_1318_home.py`,
`v_1439_header.py`, `v_1440_footer.py` en el scratchpad) y volver a
correrlos, además apareció contenido nuevo que esos scripts no
cubrían — agregado en commits posteriores a cuando se escribieron
(los labels del formulario de contacto/postulación, las 3 tarjetas de
sustentabilidad, "+31 años", dos `alt` de imágenes y el bloque de
"Planta" en la sección de contacto). Se agregó ese faltante aparte
(`v_1318_home_extra.py`) y se verificó con `curl` en los 7 idiomas.

**Moraleja**: cuando se re-traduce después de un gotcha #3, hay que
diffear explícitamente contra `dump_terms(view_id)` **de cada vista**
en vez de confiar en una lista de "vistas ya traducidas" — sobre todo
header/footer/home, que cambian seguido y aparecen en todas las
páginas, así que un faltante ahí es el más visible de todos.

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

## Corrección de tono (02/10/2026): vos → usted, y un gap real en `reaplicar_todo.py`

A pedido explícito (ver [sistema de diseño](03-sistema-de-diseno.md#tono-y-tratamiento-usted-no-vos)),
se pasó todo el contenido en español de voseo a tratamiento de usted.
Al aplicar el cambio se repitió el Gotcha #3 de más arriba: editar el
XML y correr `button_immediate_upgrade` dejó **14 vistas con 76
combinaciones vista×idioma** todavía en voseo (la copia en inglés se
actualizó sola, las otras 6 no). Se corrigió por SQL directo sobre
`arch_db`, verificado con un segundo barrido que no quedó ninguna
coincidencia vieja.

**Gap real encontrado en el proceso**: `reaplicar_todo.py` —el script
que este mismo documento dice correr SIEMPRE después de un upgrade—
tenía **13 scripts en su lista `SCRIPTS`, pero ya había 14 archivos
`v_*.py` en la carpeta**: `v_2735_trabaja.py` (la página
`/trabaja-con-nosotros`) existía pero nunca se había sumado a la lista.
Si alguien hubiera seguido el protocolo al pie de la letra después de
cualquier upgrade previo, esa página se habría quedado sin
re-traducir en 6 idiomas sin ningún aviso. Ya se corrigió (se sumó a
`SCRIPTS`, y se actualizó el conteo "12 vistas" → "14 vistas" en los
comentarios del script).

Los 13 scripts de traducción existentes (`v_1318_home.py`, etc.) además
**contenían el texto viejo en voseo** como clave/valor de `es_AR` —
corregido en el mismo cambio (74 reemplazos en 13 archivos), para que
una futura corrida de `reaplicar_todo.py` no revierta el tratamiento de
usted de vuelta al voseo.

### Corrección del 22/10/2026: 3 vistas sin traducir a ningún idioma, ni siquiera `es_AR`

A pedido explícito ("hay partes de la página que no se traducen a otro
idioma"), se encontraron las 3 vistas que quedaban pendientes del
punto anterior — pero el problema real no era voseo, era que **no
tenían ningún término traducido en absoluto**: `get_field_translations`
devolvía las 7 claves de idioma vacías (`""`) para cada término, en
las 3 vistas, confirmado antes de tocar nada. En `/en`, `/it`, etc. se
veía el texto en español sin más (no un error, no un fallback raro —
exactamente el síntoma reportado).

Las 3 vistas:
- `pedido_gestionar_link` (view 2239, el link "Gestionar mi pedido"
  que se inyecta en `/shop/confirmation`) — nunca tuvo script.
- `contacto_gracias_template` (view 1319, "Mi Sitio - Gracias") —
  nunca tuvo script.
- `pedido_personalizado_template` (view 2736, página
  `/pedido-personalizado`) — nunca tuvo traducción a los 6 idiomas
  no-español, documentado como pendiente desde que se agregó la
  página (21/09/2026).

**Corregido**: se armaron `v_2239_pedido_link.py`, `v_1319_gracias.py`
y `v_2736_pedido_personalizado.py` (mismo patrón que el resto, con
`bulk_translate` y `source_lang='es_AR'`), se corrieron contra la base,
se sumaron los 3 a `SCRIPTS` en `reaplicar_todo.py` (ahora 17 vistas,
no 14), y se verificó con `curl` en los 7 idiomas — `/pedido-personalizado`
completo (h1, meta, labels de formulario, placeholders, botón) y
`/mi-sitio/gracias` no mostraron texto residual en español en ningún
idioma.

### Auditoría completa del 22/10/2026: "hay partes que no se traducen, con todos los idiomas cargados"

A pedido explícito ("revisa errores, bugs, choques... porque se tiene
que traducir TODA la página"), se auditaron sistemáticamente las 3
fuentes de texto del punto "Cómo está traducido el contenido" (arriba),
no solo las vistas. Se encontraron 3 problemas reales, independientes
del de la sesión anterior (las 3 vistas sin script):

**1. El catálogo de productos (datos de modelo) nunca se tradujo a
italiano/francés/alemán/chino.** `categoria.name`,
`producto.name/summary/description`, `producto.spec.label/value` y
`producto.feature.name` son campos `translate=True` — y a diferencia
de las vistas (que se corrigieron a fondo en la sesión del 02/09), esos
4 idiomas mostraban el valor de `en_US` tal cual (todo el catálogo
real, no datos de ejemplo). Confirmado leyendo cada campo con
`context={'lang': ...}` por XML-RPC: `it_IT`/`fr_FR`/`de_DE`/`zh_CN`
devolvían exactamente el mismo string que `en_US`, nunca se habían
escrito traducciones propias para esos 4. Es decir: nunca se tradujo el
catálogo a esos idiomas, se activaron en el selector sin cumplir la
regla del punto de arriba ("cada idioma nuevo... tiene que traer su
traducción completa antes de sumarse al switcher").

Corregido traduciendo a mano las 5 categorías, 7 nombres de producto, 6
resúmenes+descripciones (el producto 14 no tiene, es `False` en los 7
idiomas por igual), 49 specs (label+value) y 27 features, a los 4
idiomas, vía `write()` directo con `context={'lang': ...}` (no
`update_field_translations`, que es solo para `arch_db` de vistas —
estos son campos de modelo normales). Script usado (no committeado,
corrido una sola vez desde el scratchpad de la sesión): agrupa los 49
specs y 27 features por texto en español exacto para no repetir
traducción en records idénticos, y escribe por id para categoría/
nombre/resumen/descripción. Verificado con `curl` en `/it`, `/fr`,
`/de`, `/zh_CN` sobre `/categoria/<slug>` y `/producto/<id>` — ya no
aparece ningún texto en inglés en esos 4 idiomas.

**2. Tres vistas más sin ninguna traducción** (mismo síntoma que
`pedido_gestionar_link`/`contacto_gracias_template`/
`pedido_personalizado_template` de la sesión anterior, encontradas
ahora al listar las 30 vistas reales del módulo vía `ir.model.data` y
comparar contra las 17 que sí tenían script):
- `privacidad_template` (view 2733, página `/privacidad`) — la Política
  de Privacidad **completa**, 25 términos, sin ninguna traducción, ni
  siquiera propia en español explícito.
- `footer_override` (view 2237) — el botón "← Volver al sitio" que
  aparece en `/shop`, carrito y checkout.
- `volver_al_carrito_texto` (view 2242) — "Realizar otro pedido" en el
  carrito (`website_sale.navigation_buttons`).

Se armaron `v_2733_privacidad.py`, `v_2237_footer_override.py` y
`v_2242_volver_carrito.py` y se sumaron a `SCRIPTS` en
`reaplicar_todo.py` (ahora 20 vistas). De paso, al traducir
`privacidad_template` se encontró un residuo real de voseo que la
corrección del 02/10 no tocó porque esta vista nunca se había editado
en esa sesión: el `<h2>` "Tus derechos" (el resto de esa sección ya
decía "usted tiene derecho...") — corregido a "Sus derechos" en el XML
y traducido en el mismo script.

**3. El mensaje de WhatsApp de cada producto quedaba fijo en
español.** `producto.whatsapp_url` (`models/producto.py`) armaba el
texto del link de `wa.me` con un string Python fijo, sin mirar el
idioma activo — documentado antes como "postergado a propósito"
porque el negocio opera en español. Con el pedido explícito de
traducir TODA la página, se revirtió esa decisión: se localizó con dos
diccionarios por idioma (`_WHATSAPP_CON_PRODUCTO`/
`_WHATSAPP_SIN_PRODUCTO`) y `self.env.lang`, mismo patrón que
`_historia_data` en `controllers/main.py`. `rec.name` ya se traducía
solo (es el campo del catálogo, parte del punto 1) — solo faltaba
localizar la frase fija alrededor.

Las vistas backend-only del módulo (`view_mi_sitio_web_producto_form`/
`_list`, `view_mi_sitio_web_categoria_list` — pantallas de Ajustes que
solo usa el equipo, no visitantes del sitio) se revisaron y se dejaron
sin traducir a propósito, igual criterio que siempre.

### Segunda pasada el mismo día: 4 huecos más, encontrados comparando contra `en_US`

A pedido de una segunda revisión ("busca cualquier fallo"), se escaneó
`get_field_translations` de las 30 vistas completas buscando cualquier
término con algún idioma vacío, y se filtraron a mano los falsos
positivos (texto idéntico a propósito en los 7 idiomas: marca, emojis,
números de paso, siglas como "FAQ"/"ISO 22000", direcciones/teléfono,
y cognados reales como "Production"/"Contact" en francés, que son la
misma palabra en inglés y francés). De los que quedaron, 4 eran huecos
reales — reconocibles porque la propia clave (el valor bajo `en_US`,
que hace de "fuente") seguía en **español**, es decir nunca se habían
traducido ni siquiera al inglés:

- **"Pedido a medida"** (link de nav en `site_header` y `site_footer`)
  — se agregó cuando se reorganizó el nav (pasó de la lupa "Más" a link
  de primer nivel) después de que esos 2 scripts ya estaban escritos, y
  nunca se agregó a ninguno de los dos. Mostraba literalmente "Pedido a
  medida" en los 7 idiomas, incluido `/en`.
- **El copyright del footer, "Política de Privacidad" y la lista de
  productos del footer** (`"<span>© 2026 Cartotecnica Hores —
  ...</span>"`, `"Política de Privacidad"`,
  `"· Pan dulce · Budín · Rosca · Bizcochuelo · Pan de Pascua"`) — el
  script viejo (`v_1440_footer.py`) tenía una fila con una clave que
  combinaba el copyright y la lista de productos en un solo término
  (`"<span>...</span><span>...</span>"`), armada cuando esos dos
  bloques eran un solo `<span>` cada uno sin nada más adentro. Cuando
  más tarde se agregó el link `<a href="/privacidad">` DENTRO del
  segundo `<span>` (para enlazar la Política de Privacidad desde el
  footer), QWeb separó ese `<span>` en 2 términos nuevos (el `<a>` por
  un lado, el texto suelto que le sigue por otro) — la clave vieja del
  script dejó de matchear cualquier término real. El script seguía
  corriendo sin ningún error (ver `bulk_translate`, no valida que la
  clave exista), simplemente no escribía nada: exactamente el tipo de
  falla silenciosa más difícil de notar sin un escaneo explícito como
  este. Reemplazada esa fila vieja por 3 filas nuevas con las claves
  reales actuales.
- **"Producción" y "Reciclado"** (pasos 02 y 04 del timeline "Del
  diseño al reciclado" en `/compromiso`) — nunca se habían traducido,
  a pesar de que la palabra "Producción" sí estaba bien traducida en
  `calidad_template` e `historia_template` (son vistas distintas, cada
  una con su propio `arch_db` — traducir un término en una vista no
  traduce ese mismo texto en otra).

**Moraleja para la próxima vez que se reestructure un bloque de HTML
que ya tiene términos traducidos** (como pasó con el `<span>` del
footer): correr este mismo escaneo comparando contra `en_US` después
del cambio, no asumir que una fila de traducción vieja sigue
aplicando solo porque el script corre sin error.

### Tercera pasada el mismo día: el patrón de la flecha huérfana, repetido 6 veces más

Afinando el escaneo anterior (en vez de "algún idioma vacío", buscar
específicamente términos cuya *clave* — lo que debería ser `en_US` —
seguía en español, filtrando los falsos positivos ya conocidos:
acentos sueltos en texto en inglés como "Córdoba"/"résumé"), aparecieron
6 casos reales más, todos la misma causa de fondo que
`pedido_gestionar_link`/`site_footer` de más arriba — un cambio de
estilo posterior envolvió la flecha "→" en su propio
`<span class="hc-arrow">→</span>` (para poder animarla distinto al
texto, probablemente) y dejó huérfanas las filas que todavía tenían
"→" como texto suelto pegado a la palabra:

- `home_template`: "Ver calidad y certificaciones →", el link "Ficha
  técnica →" de cada tarjeta de producto, y el párrafo "Qué hacemos"
  (clave vieja decía "moldes **y envases** de papel", el texto actual
  dice solo "moldes de papel" — un cambio de contenido, no de estilo,
  pero el mismo síntoma de clave huérfana).
- `calidad_template`: el badge "ISO 22000:2018 — Gestión de inocuidad
  certificada" (clave vieja tenía colores hex fijos, el actual usa
  variables CSS `var(--cal-texto)`/`var(--cal-texto2)`), "Solicitar
  por email →" y "Ver catálogo →".
- `categoria_template`: "Ver ficha técnica completa →" (en cada
  tarjeta de producto de la categoría).

Las 7 vistas afectadas en total (contando la del footer de la pasada
anterior) mostraban el texto en **español en los 7 idiomas**, link
por link, hasta corregirlas. Se corrigieron las claves en
`v_1318_home.py`, `v_1444_calidad.py` y `v_1442_categoria.py` y se
volvieron a correr contra la base; verificado con `curl` en
es/en/it/zh_CN sin texto residual.

`v_1445_historia.py` tenía una fila más con el mismo síntoma
("Volver al sitio →") pero **no es un bug visible**: ese link ya no
existe en ningún lado de `historia_template` (se reemplazó en algún
momento por el botón flotante `hc-back-to-top`, que no es un término
traducible de texto) — la fila está muerta, no escribe nada porque no
hay nada que debiera escribir. Se deja así a propósito, no hace falta
limpiarla.

**Grep útil para encontrar este patrón de nuevo** (flechas sueltas que
podrían haber quedado envueltas en `hc-arrow` en algún momento):

```
grep -rn '→' scripts/traducciones/*.py | grep -v 'hc-arrow'
```

Cualquier resultado hay que verificarlo contra el XML real de esa
vista antes de asumir que es un bug — algunos links (`"Ver factura
→"`, `"Cómo llegar →"`) genuinamente siguen con la flecha como texto
suelto y están bien así.

### Cuarta pasada el mismo día: un residuo de voseo que la limpieza del 02/10 no alcanzó, y un cartel de Odoo sin traducir

Un cuarto pedido explícito de revisar ("busca cualquier fallo y
arreglalo") encontró 2 cosas más, de naturaleza distinta a los
huecos de arriba:

**1. "Powered by Odoo — The #1 Open Source eCommerce" visible en
`/shop`, carrito y checkout.** No es contenido propio del sitio — es
el cartel de autopromoción de Odoo (`web.brand_promotion`), que la
plataforma nunca traduce a ningún idioma (queda fijo en inglés
siempre) y que además rompe la estética del resto del sitio con un
link y logo ajenos al diseño. **Ojo**: su `<div
class="o_brand_promotion">` no vive estructuralmente dentro de
`website.layout` (se inserta con un `t-call` puntual desde otras
plantillas, ver `web/views/webclient_templates.xml`), así que no se
puede ocultar con un xpath sobre `website.layout` como la barra de
copyright (`o_footer_copyright`) — hay que heredar
`web.brand_promotion` directamente. Corregido en
`footer_override_templates.xml` (template nuevo
`brand_promotion_oculto`).

**2. El mensaje de "sin stock" de la ficha de producto todavía tenía
voseo** (`"...y **te** avisamos apenas esté disponible."`) a pesar de
la conversión vos→usted del 02/10/2026 — ese cambio tocó 13 scripts
de traducción (ver más arriba, "74 reemplazos") pero
`v_1443_producto.py` no estaba en esa lista, así que este término en
particular quedó afuera. Corregido a "...y **le** avisamos...".

**De paso**, se encontraron y limpiaron 3 filas muertas en
`v_1444_calidad.py` (`"¿Necesitás la documentación de calidad?"`,
`"Escribinos y te enviamos..."`, `"Solicitar documentación"`) — texto
que ya no existe en ningún lado de `calidad_template` (se reescribió
por completo a "Solicite los certificados y fichas técnicas que
necesite para su proceso." en algún cambio anterior). No eran un bug
visible, solo quedaban confusas para quien edite el script después.

**Moraleja**: el grep de voseo que se corrió una sola vez el
02/10/2026 no garantiza que quede limpio para siempre — cualquier
script de traducción que no se haya tocado en esa pasada puede seguir
teniendo texto viejo. Si se vuelve a sospechar esto, repetir:

```
grep -niE '\b(vos|tenés|querés|necesitás|podés|sabés|decís|escribís|contás|dejanos|escribinos|contanos|consultanos|contactanos|elegí|conocé|revisá|solicitá|ingresá|sumate|completá|te avisamos|te contactamos|tu pedido|tu perfil|tu caso)\b' scripts/traducciones/*.py
```

(cuidado: "vos" también aparece en francés — "vos droits", "vos
données" — no es voseo ahí, hay que mirar el contexto de cada
resultado antes de "corregirlo".)

## Qué falta / gaps conocidos

- Si se agrega una página o sección nueva al sitio, su texto nuevo queda
  **solo en español** hasta que se traduzca a mano con el mecanismo que
  corresponda (punto 1, 2 o 3 arriba según de dónde salga el texto) — no
  hay traducción automática ni un aviso si falta. Si el texto nuevo sale
  de un campo `translate=True` (catálogo), recordar que `source_lang`
  no alcanza para datos de modelo fuera de vistas — hay que escribir
  cada idioma con `write(..., context={'lang': idioma})` directo (ver
  el punto 1 de arriba), no con `update_field_translations` (esa es
  solo para `arch_db`).
- Los datos de Historia siguen siendo de ejemplo en los 3 idiomas (ver
  [pendientes](04-pendientes-y-datos-de-ejemplo.md)); cuando se reemplacen
  por reales hay que traducirlos a los 3 diccionarios, no solo al español.
