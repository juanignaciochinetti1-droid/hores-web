# Pendientes y datos de ejemplo

Importante: esto es lo primero que hay que revisar antes de considerar el
sitio "terminado" o de compartir la URL con un cliente/público real.

## Datos de `/historia` — parte real (28/08/2026), parte todavía de ejemplo

Viven como constantes en `custom_addons/mi_sitio_web/controllers/main.py`
(arriba del todo, antes de la clase del controlador), a propósito, para que
reemplazarlos sea editar una lista y nada más. Desde que el sitio es
multi-idioma, cada dato existe **tres veces** — una por idioma, dentro de
`_HISTORIA_ES` / `_HISTORIA_EN` / `_HISTORIA_PT` (ver
[idiomas](06-idiomas.md)) — así que al reemplazar por datos reales hay que
tocar los 3 diccionarios, no solo el de español.

**28/08/2026, a pedido explícito** ("sacá toda la información posible de
hores.com.ar/wp e implementala"): se reemplazaron varias claves por datos
reales, tomados directo del sitio actual de HORES
(`hores.com.ar/wp/empresa`, `/clientes`, `/calidad`, `/contacto` y las 6
fichas de producto bajo `/wp/es/moldes-para-*`):

| Clave | Estado actual | Fuente |
|---|---|---|
| `timeline` | **Real** — 8 hitos con fecha (1992 primera máquina → 2020 nueva planta) + un cierre "Hoy" sin fecha inventada | `hores.com.ar/wp/empresa/` |
| `mision_vision` | **Real** — texto institucional citado tal cual | `hores.com.ar/wp/empresa/` |
| `stats.paises` (el número, "8") | **Real** — antes decía "6", pero no coincidía con la lista `paises` de abajo (que sí estaba bien) | `hores.com.ar/wp/clientes/` |
| `stats.años de experiencia` (ahora "+31") | **Real, tomado tal cual** — es el número que el sitio de HORES muestra hoy ("31 años de operaciones"); no se recalculó a mano para no asumir desde qué año exacto cuentan (¿1992, la primera máquina? ¿1999, la SRL?) | `hores.com.ar/wp/empresa/` |
| `paises` (la lista) | Ya estaba bien — coincide con la lista real de 8 países/territorios | (sin cambios) |
| `stats.moldes por año` (+500) y `stats.clientes` (+150) | **Siguen siendo de ejemplo** — el sitio real de HORES no publica estos dos números en ningún lado | — |
| `clientes` | **Siguen anonimizados a propósito** — el sitio real tampoco publica nombres de clientes, así que no hay con qué reemplazarlos sin inventar | — |
| `valores` (Precisión/Compromiso/Agilidad/...) | Sin cambios — el sitio real solo menciona "Seriedad y Eficiencia" como pilares, no un desglose de 6 valores | — |
| `objetivos` (Expansión regional, Nueva planta, etc.) | Sin cambios — no hay fuente real para objetivos a futuro | — |
| `sectores` (% por línea de producto) | Sin cambios — son estimados, no hay porcentajes reales publicados | — |

También se corrigieron, con el mismo criterio (dato real o sin tocar):
- El texto fijo del hero de Historia y de una card en Home/Calidad decían
  "+40 años" / "Más de 40 años" — quedó en 31 y "Más de 30 años" (número
  redondo, seguro por debajo del real) respectivamente. **Ojo**: este
  texto fijo vive en QWeb, no en las constantes de Python — tiene su
  propio mecanismo de traducción (`ir.ui.view.update_field_translations`,
  ver el gotcha #1b en [idiomas](06-idiomas.md)), no alcanza con editar
  el diccionario de Historia.
- `/calidad` sumó una sección nueva "Política de inocuidad" con los 4
  objetivos reales de la política institucional de HORES (texto citado,
  no una paráfrasis nuestra).
- Los emails `calidad@hores.com.ar` que usaba `/calidad` (3 links
  `mailto:`) **no eran reales** — no aparecen en ningún lado del sitio de
  HORES. Se cambiaron a `administracion@hores.com.ar` (confirmado real).
  El sitio real también publica un segundo email,
  `hores@hores.com.ar` — no se usó en ningún lado todavía porque no está
  claro para qué debería servir separado del de administración; queda
  como dato disponible si hace falta.
- Las fichas técnicas de los 5 productos sumaron specs reales que no
  estaban cargadas (resistencia térmica -40°C/+220°C, vida útil de 5
  años, aprobación para contacto alimentario; más "Habilitación INAL"
  específica en el molde de Rosca) y se completaron las características
  del molde de Rosca y de Bizcochuelo, que habían quedado vacías en la
  migración original.
- Bug de datos encontrado en el camino: las variantes de Pan de Pascua,
  Rosca y Bizcochuelo tenían el campo "peso" con la dimensión duplicada
  en vez de un peso real (ej. variante "180x50mm" con peso "180x50") —
  se limpió, ya que el sitio real tampoco da un peso en gramos para esas
  3 líneas (solo dimensiones).
- **No se creó** la línea "Budín Funditas" que el sitio real sí tiene
  como categoría aparte — no hay foto propia para ese producto y crear
  un producto nuevo (con su propia variante, precio, `sale_product_id`,
  etc.) es una decisión de catálogo más grande que enriquecer texto
  existente. Queda pendiente si se decide sumarlo.

**28/08/2026, segunda vuelta — `/compromiso`**: se sumó contenido real
tomado directo de `POLITICA_DE_INOCUIDAD_rev_06.pdf` (documento oficial
de Cartotécnica Hores SRL, revisión 06, 24/06/2024, aprobado por
Dirección — la misma política cuyos 4 objetivos ya se habían cargado en
`/calidad`), sección "Proveedores y medio ambiente":

- Certificaciones reales de los proveedores de papel — esquemas
  **FSC** (manejo forestal) y autorizaciones **ISEGA** (contacto directo
  con alimentos) — sumadas a la sección "Bosques responsables" y a una
  de las tarjetas de "Nuestros compromisos".
- Sección nueva **"Residuos y agua"**: separación de residuos
  (coordinación con recicladoras externas para papel, plásticos y
  lubricantes) y tratamiento de las aguas residuales del lavado de las
  impresoras flexográficas — ninguno de los dos hechos estaba en el
  sitio antes. Traducido a los 3 idiomas.

**Sigue pendiente confirmar con Dirección**: los valores (¿son reales los
6 que están, o solo "Seriedad y Eficiencia" como dice el sitio actual?),
los objetivos a futuro, los porcentajes por línea de producto, y si hay
números reales de moldes/año y clientes para reemplazar el "+500"/"+150".

## Orden del nombre de la empresa: "Cartotécnica Hores", no "Hores Cartotécnica"

Corregido el 01/09/2026, a pedido explícito. El nombre legal real es
**Cartotécnica Hores SRL** (así consta en el propio timeline de
`/historia`, "Se constituye formalmente como Cartotécnica Hores SRL",
1999) — pero el sitio venía usando el orden invertido, "HORES
Cartotécnica", en absolutamente todos lados: títulos de página,
meta-description, alt de imágenes, copyright del footer, mensaje de
WhatsApp de respaldo. Se corrigió en los 27 lugares donde aparecía
(9 archivos), en los 3 idiomas — cada título/alt/meta que tenía el
nombre de la empresa quedó sin traducción por un rato hasta que se
retradujo (ver el gotcha en [idiomas](06-idiomas.md)).

**De acá en más, cualquier texto nuevo que mencione a la empresa va
"Cartotécnica Hores", no al revés** — es fácil escribirlo mal de
memoria porque el logo (imagen, no texto) muestra "Hores" grande con
"Cartotécnica" chico abajo, lo que visualmente sugiere el orden
equivocado a quien no conoce el nombre legal.

## Otras cosas pendientes / decisiones tomadas a propósito

- **Fichas técnicas en PDF**: hoy los botones de "Certificaciones" en
  `/calidad` abren un `mailto:` en vez de descargar un PDF real, porque no
  existen esos archivos todavía.
- **Analytics** (Google Analytics / Meta Pixel): no instalado — necesita un
  ID de cuenta real del cliente.
- **Toggle claro/oscuro**: solo existe en `/historia`. Llevarlo a todo el
  sitio es un trabajo de rediseño (convertir todos los colores hardcodeados
  a variables CSS), evaluado y pospuesto a propósito.
- **Pedidos/Facturas/Login de cliente**: decisión tomada de usar las apps
  nativas de Odoo (Ventas, Facturación, Portal) en vez de reconstruirlas —
  ver [arquitectura](02-arquitectura-proyecto.md).
- **Reviews/testimonios y postulaciones de CV**: existían en el prototipo
  original (`hores-web`) pero no se migraron a este sitio.
- **Mensaje de WhatsApp** (`producto.whatsapp_url`): queda siempre en
  español sin importar el idioma de la página — ver
  [idiomas](06-idiomas.md#qué-falta--gaps-conocidos).
- **eCommerce (carrito/checkout)**: conectado y funcionando, pero **todos
  los 30 productos migrados están en $0** — falta cargar precios
  reales. La compañía real ("Cartotécnica Hores") sí tiene la moneda
  bien configurada (ARS), pero ninguna de sus listas de precios está en
  pesos (solo USD/EUR, datos genéricos de Odoo) y buena parte del
  catálogo tiene un impuesto de venta duplicado (15% + 21% a la vez,
  otro resabio de datos de ejemplo) — **decisiones de negocio
  pendientes, no tocado a propósito** (09/09/2026). Sin pago online
  (transferencia manual a propósito) ni portal de cliente. Ver
  [pedidos](07-pedidos.md#qué-falta--decisiones-pendientes) para el
  detalle completo.
- **Ficha de la empresa en Odoo (`res.company`)**: ya tiene el nombre
  real ("Cartotécnica Hores") y país Argentina — pero conviene revisar
  el resto de los datos de contacto/fiscales antes de dar por
  "terminado" el backend, en la misma pasada donde se resuelva lo de
  impuestos/moneda de arriba.

## Credenciales / seguridad

- `.env` (raíz del proyecto) tiene la API key de Odoo y no está versionado.
  `scripts/migrar_catalogo_hores.py` la lee de ahí — **nunca hardcodear
  credenciales en el código**, ya pasó una vez y se corrigió antes del
  primer commit.
- `odoo/` (el framework clonado) tampoco se versiona en este repo — tiene
  su propio `.git`.
