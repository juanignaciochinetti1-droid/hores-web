# Pendientes y datos de ejemplo

Importante: esto es lo primero que hay que revisar antes de considerar el
sitio "terminado" o de compartir la URL con un cliente/público real.

## Datos de `/historia` — NO son reales, son de ejemplo

Viven como constantes en `custom_addons/mi_sitio_web/controllers/main.py`
(arriba del todo, antes de la clase del controlador), a propósito, para que
reemplazarlos sea editar una lista y nada más. Desde que el sitio es
multi-idioma, cada dato existe **tres veces** — una por idioma, dentro de
`_HISTORIA_ES` / `_HISTORIA_EN` / `_HISTORIA_PT` (ver
[idiomas](06-idiomas.md)) — así que al reemplazar por datos reales hay que
tocar los 3 diccionarios, no solo el de español:

| Clave (dentro de cada diccionario `_HISTORIA_*`) | Estado |
|---|---|
| `stats` | +40 años (consistente con el resto del sitio), pero +500 moldes/año, +150 clientes y 6 países son ejemplo |
| `timeline` | 7 hitos con años de ejemplo (ajustados para no contradecir el "+40 años" del resto del sitio, pero inventados) |
| `clientes` | **A propósito anonimizados** — no se pusieron marcas reales (Arcor, Unilever, etc. aparecían en el prototipo original y se descartaron por riesgo de publicidad engañosa si no son clientes reales verificados) |
| `paises` | Lista de ejemplo de países de exportación |
| `sectores` | Reemplaza un desglose por industria (farmacéutica/cosmética) que no correspondía al negocio real — ahora son las 4 categorías reales del catálogo, pero los porcentajes son estimados |

**Antes de publicar:** confirmar con el cliente cuáles de estos datos son
reales, y actualizar los 3 diccionarios correspondientes (español, inglés
y portugués).

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

## Credenciales / seguridad

- `.env` (raíz del proyecto) tiene la API key de Odoo y no está versionado.
  `scripts/migrar_catalogo_hores.py` la lee de ahí — **nunca hardcodear
  credenciales en el código**, ya pasó una vez y se corrigió antes del
  primer commit.
- `odoo/` (el framework clonado) tampoco se versiona en este repo — tiene
  su propio `.git`.
