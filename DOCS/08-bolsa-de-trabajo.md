# Bolsa de trabajo

Sección "Trabajá con nosotros" en `/mi-sitio` (01/09/2026, a pedido
explícito: "una sección donde la gente pueda cargar su currículum para
buscar trabajo en la fábrica"). Primera versión como página propia
(`/trabaja-con-nosotros`); un pedido explícito aparte, en el momento
("que esta nueva sección esté en la página principal y no esté
apartado"), la movió a ser una sección más de la home, mismo patrón
que `#contacto` — esa URL vieja ahora redirige a
`/mi-sitio#trabaja-con-nosotros`, por si quedó algún link guardado.

## Qué se instaló

`hr_recruitment` (app de Selección de Personal) — se usa su modelo real
de postulantes (`hr.applicant`) en vez de guardar los CVs en un modelo
propio, mismo criterio que Pedidos/Facturación (ver
[arquitectura](02-arquitectura-proyecto.md)).

**Ojo con `website_hr_recruitment`**: se instala solo, automáticamente,
en cuanto `hr_recruitment` y `website_mail` están instalados (declara
`auto_install: ['hr_recruitment', 'website_mail']` en su manifest — no
es una dependencia normal, Odoo lo activa apenas detecta esa
combinación, sin que nada lo pida). Trae su propia página pública
`/jobs` con el header genérico de Odoo sin estilar (mismo bug que tenía
`/shop` antes de arreglarse — ver [pedidos](07-pedidos.md)), pensada
para publicar búsquedas activas con su propio kanban — más de lo que
se pidió acá (una sola sección para recibir CVs, no un portal de
búsquedas). Se desinstaló aparte
(`ir.module.module.button_immediate_uninstall` sobre
`website_hr_recruitment`, dejando `hr_recruitment` instalado) y en su
lugar se armó `/trabaja-con-nosotros` a mano, con el diseño del sitio.

**Si se reinstala el proyecto desde cero** (base de datos nueva), hay
que repetir ese paso manual: instalar el módulo activa
`website_hr_recruitment` de nuevo solo, y hay que desinstalarlo aparte
una vez más. No hay forma de evitarlo desde el manifest (el
auto-install no se puede "bloquear" declarando algo distinto ahí) —
se evaluó un `post_init_hook` para automatizarlo, pero desinstalar un
módulo desde dentro de un hook que corre en medio de la propia carga
del registro de Odoo es una operación riesgosa (reentra en el mismo
mecanismo de carga que lo está ejecutando); se prefirió documentar el
paso manual antes que ese riesgo.

## Cómo funciona

- El formulario (nombre, email, teléfono, área de interés, comentario,
  CV) vive en `views/website_templates.xml`, dentro de
  `home_template`, como la sección `#trabaja-con-nosotros` — no en
  `postulacion_templates.xml` (esa vista hoy solo tiene la plantilla de
  "gracias").
- `POST /mi-sitio/postulacion` — valida y crea el `hr.applicant`;
  ante cualquier error redirige de vuelta a
  `/mi-sitio?postulacion_error=<código>#trabaja-con-nosotros` (mismo
  patrón que `/mi-sitio/contacto` con `contacto_error`).
- `GET /mi-sitio/postulacion/gracias` — página de confirmación aparte
  (no una sección de la home: after someone submits, tiene sentido que
  sea su propia pantalla, no un scroll de vuelta al formulario).
- `GET /trabaja-con-nosotros` — solo queda como redirect a
  `/mi-sitio#trabaja-con-nosotros`, por compatibilidad con la versión
  anterior.

Todo en `controllers/main.py` (`consultar_pedido()` no, ojo, es
`postulacion()`) y `views/website_templates.xml` /
`views/postulacion_templates.xml`.

**Validaciones del lado servidor** (mismo criterio que
`/mi-sitio/contacto` — el `required`/`accept` del HTML no protege
contra un POST directo):
- Nombre y email obligatorios, con el mismo regex de email que el
  resto del sitio.
- CV obligatorio, con el archivo llegando por
  `request.httprequest.files` (werkzeug), NO por `**post` — ahí solo
  caen los campos de texto de un form `multipart/form-data`.
- Extensión limitada a `.pdf`, `.doc`, `.docx` (constante
  `CV_EXTENSIONES_PERMITIDAS`).
- Tamaño máximo 5 MB (constante `CV_MAX_BYTES`) — se valida sobre el
  contenido ya leído, no sobre un header que el cliente podría mentir.
- Honeypot anti-bot, mismo patrón que `/mi-sitio/contacto` (campo
  `sitio_web` oculto por CSS; si viene completo, se finge éxito sin
  crear nada).

**Puesto genérico**: todas las postulaciones que llegan por acá se
asocian al `hr.job` "Postulación espontánea (sitio web)"
(`data/hr_job_data.xml`, `noupdate="1"`) en vez de quedar sin puesto
asignado — así se agrupan solas en la app de Selección de Personal, en
vez de mezclarse con los puestos de ejemplo que trae `hr` de fábrica
(Chief Technical Officer, Consultant, Developer, HR Manager, Marketing
Manager, Trainee — **no se borraron**, son datos que el módulo base
`hr` trae siempre instalado, no exclusivos de un modo demo; quedan ahí
si en algún momento se decide usarlos o sacarlos a mano).

Área de interés y comentario no tienen campo propio en `hr.applicant`
(no existe algo como `description`) — se postean como mensaje en el
chatter del postulante (`message_post`, con el mismo cuidado de
escapar el texto del visitante a mano antes de envolverlo en
`Markup()` que usa `pedido_solicitar_cambio` en
[pedidos](07-pedidos.md), para no abrir un XSS con lo que alguien
escriba ahí).

## Gotcha de traducción: una plantilla nueva puede "perder" el español al traducirla

Encontrado el 01/09/2026 traduciendo esta misma página. El patrón que
ya funcionaba en el resto del sitio (escribir `en_US`, después `pt_BR`
con la clave en inglés — ver
[gotcha #1b](06-idiomas.md#gotcha-1b-la-clave-para-pt_br-cambia-después-de-escribir-en_us),
**sin** escribir `es_AR` porque "ya está en español") rompió acá: al
escribir la traducción a `en_US` de varios textos (el `<h1>`, el botón
de enviar, los mensajes de error), la versión **en español** del sitio
pasó a mostrar el texto en **inglés** en esos mismos lugares —
confirmado leyendo `arch_db` con `context={'lang': 'es_AR'}` explícito
por XML-RPC: devolvía el texto en inglés, no el original.

No en toda la plantilla: los `<span>` de las etiquetas de campo
("Nombre*", "Teléfono", etc.) ni se llegaron a tocar (la unidad
traducible ahí es el `<span style="...">` completo, no el texto solo
— ver el punto siguiente), así que esos se quedaron en español
correctamente, sin querer, en los 3 idiomas.

Tampoco pasó en las plantillas de **herencia** (`inherit_id=...`)
traducidas antes en esta misma sesión (el botón "Realizar otro
pedido", la tarjeta de dirección) ni en otra plantilla nueva de
página completa que sí funcionó bien (`consultar_pedido_template`,
ver [pedidos](07-pedidos.md)) — con el mismo patrón exacto de script.
No se llegó a encontrar la condición precisa que lo dispara (podría
ser algo particular del contenido de esta plantilla en particular, no
necesariamente "toda plantilla nueva es insegura") — así que **no se
puede confiar a ciegas en que un texto nuevo se traduce bien "porque
ya está en español"**.

**Cómo se corrigió**: escribir `es_AR` explícitamente en cada término
tocado, usando como clave el texto que `get_field_translations` esté
devolviendo como `source` en ESE momento (si ya se rompió, va a ser el
inglés que se acaba de escribir, no el español original) — no asumir
cuál es la clave correcta, **leer el estado real primero**:

```python
call('ir.ui.view', 'get_field_translations', [[view_id], 'arch_db'])
# revisar 'source' de cada término antes de escribir nada más
```

**Recomendación para la próxima plantilla de página completa nueva**:
después de traducir a `en_US`/`pt_BR`, probar explícitamente la
versión **sin prefijo de idioma** (la española) de cada texto tocado,
no darla por buena solo porque `/en` y `/pt` se ven bien — es
justamente el caso que se rompió acá y no se hubiera notado sin ese
paso. Ídem con `<title>`, el `alt` de imágenes y el meta-description:
son fáciles de saltear por no ser visibles a simple vista en el
navegador, pero son términos traducibles como cualquier otro.

**Confirmado más tarde, la misma sesión** (al mover este mismo
formulario a `home_template`, ver más abajo): escribir `es_AR` como
identidad (`{texto: texto}`) **antes** de tocar `en_US`, para cada
término, en vez de saltearlo, evita el problema de raíz — probado en
los 3 idiomas después, sin que se rompiera nada. Queda como la forma
segura de traducir contenido nuevo de acá en adelante, aunque no se
haya llegado a entender la causa exacta del bug original.

## Qué falta / decisiones pendientes

- No hay notificación por email al equipo cuando llega una
  postulación nueva — hoy solo aparece en la app de Selección de
  Personal. Se podría sumar una regla de automatización de Odoo
  (`base.automation`) si hace falta avisar por mail.
- Sin captcha además del honeypot — mismo nivel de protección que
  `/mi-sitio/contacto`, suficiente mientras el volumen sea bajo.
- Los 6 puestos de ejemplo que trae `hr` (Chief Technical Officer,
  etc.) siguen visibles en el backend — decidir si se archivan.
