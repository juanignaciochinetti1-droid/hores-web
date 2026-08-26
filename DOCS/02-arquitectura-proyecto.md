# Arquitectura del proyecto

## Estructura de carpetas del módulo

```
custom_addons/mi_sitio_web/
├── __manifest__.py          # depende de: website, crm, sale
├── controllers/
│   └── main.py               # todas las rutas HTTP del sitio
├── data/
│   └── pedido_producto_data.xml  # producto "puente" para sale.order.line
├── models/
│   ├── categoria.py          # mi_sitio_web.categoria
│   └── producto.py           # mi_sitio_web.producto (+ spec/feature/variante)
├── security/
│   └── ir.model.access.csv   # permisos: usuarios internos r/w, público solo r
├── static/src/img/           # imágenes que usa el sitio (copiadas de disenos/)
└── views/
    ├── website_templates.xml  # Home + páginas de "gracias" (contacto y pedido)
    ├── catalogo_templates.xml # head_assets, header/footer compartidos,
    │                          # Compras, Categoría, Producto, Calidad,
    │                          # Compromiso, Historia
    ├── producto_views.xml     # vistas de backend (admin) del catálogo
    ├── seo_templates.xml      # Open Graph, extiende website.layout
    └── error_templates.xml    # página 404 propia, extiende http_routing.404
```

## Modelos de datos

- **`mi_sitio_web.categoria`** — `name`, `slug` (único, usado en la URL
  `/categoria/<slug>`), `sequence`.
- **`mi_sitio_web.producto`** — `name`, `code` (único), `category_id`
  (obligatorio), `summary`, `description`, `image`, `is_custom`
  (personalizable), `is_published`, `disponibilidad`
  (`disponible`/`a_pedido`/`sin_stock`, manual — ver
  [pedidos](07-pedidos.md)), `sequence`, más un campo calculado
  `whatsapp_url` (arma el link de WhatsApp con el nombre del producto
  URL-encodeado).
  - `spec_ids` → `mi_sitio_web.producto.spec` (ficha técnica: label/value)
  - `feature_ids` → `mi_sitio_web.producto.feature` (lista de
    características)
  - `variante_ids` → `mi_sitio_web.producto.variante` (tamaños, cada uno
    con su propia imagen)

Las restricciones de unicidad (`code`, `slug`) usan `models.Constraint`
(no `_sql_constraints`, que quedó deprecado y dejó de aplicarse de verdad
en esta versión de Odoo — ver el historial de la sesión donde se detectó y
corrigió).

## Rutas del sitio

| Ruta | Página | Notas |
|---|---|---|
| `/mi-sitio` | Home | Hero con slideshow de fotos, secciones ancla (#empresa, #productos, #calidad, #sustentabilidad, #faq, #contacto) |
| `/compras` | Catálogo completo | Buscador instantáneo + filtro por categoría (links, no filtro en la misma página) |
| `/categoria/<slug>` | Productos de una categoría | 404 si el slug no existe |
| `/producto/<id>` | Ficha de producto | 404 si no existe o no está publicado |
| `/calidad` | Calidad y certificaciones | Contenido estático |
| `/compromiso` | Compromiso ambiental | Contenido estático |
| `/historia` | Historia de la empresa | Única página con datos "hardcodeados" como constantes en el controlador (ver doc de pendientes) y toggle de tema |
| `/mi-sitio/contacto` (POST) | — | Crea un `crm.lead`; valida server-side; redirige (patrón Post/Redirect/Get) |
| `/mi-sitio/gracias` | Página de agradecimiento | Destino del redirect anterior |
| `/mi-sitio/pedido` (POST) | — | Crea un `sale.order` (presupuesto) real; valida server-side; PRG — ver [pedidos](07-pedidos.md) |
| `/mi-sitio/pedido/gracias` | Página de agradecimiento del pedido | Destino del redirect anterior |

Todas las rutas admiten prefijo de idioma (`/en/...`, `/pt/...`) porque
usan `website=True` — ver [idiomas](06-idiomas.md).

## Plantillas compartidas (`catalogo_templates.xml`)

- **`head_assets`** — se llama una vez en cada página (`<t
  t-call="mi_sitio_web.head_assets"/>`). Trae las fuentes de Google, el CSS
  utilitario compartido (ver sistema de diseño) y el script global de
  scroll-reveal.
- **`site_header`** — header con barra de utilidad (dirección/teléfono/
  email) + nav (Empresa/Historia/Productos/Calidad/Compromiso/FAQ/
  Contacto). Se usa en todas las páginas **excepto** que se decida lo
  contrario explícitamente (ver nota abajo).
- **`site_footer`** — footer + botón flotante de WhatsApp.

> **Nota sobre Historia:** en algún momento se probó darle a `/historia` un
> header propio distinto; se revirtió a pedido — **todas las páginas usan
> el mismo `site_header`/`site_footer`**, sin excepciones. Si se vuelve a
> tocar el header, confirmar primero si el pedido es sobre el header en sí
> o sobre otra sección visualmente cercana (ya pasó una vez que un pedido
> sobre el fondo de una sección se interpretó mal como el header).

## Página 404 propia

`error_templates.xml` reemplaza la 404 genérica de Odoo por una con la
identidad del sitio. **Ojo si se vuelve a tocar**: Odoo tiene *dos*
plantillas de 404 distintas —

- `website.page_404` → solo se renderiza si quien mira la página está
  **logueado como diseñador del sitio**.
- `http_routing.404` → lo que ve **cualquier visitante público**, o sea el
  99.9% de los casos reales.

La primera vez se sobreescribió `website.page_404` por error de lectura de
la documentación de Odoo y no cambiaba nada para un visitante real — el
override correcto (y el que está hoy) apunta a `http_routing.404`.
Verificado con `curl` sin sesión contra una URL cualquiera, no solo contra
nuestras propias rutas.

## Migración de datos

El catálogo real (4 categorías, 5 productos con specs/features/variantes e
imágenes) se migró una sola vez desde `hores-web/hores.db` (un prototipo
previo en React/Node, en `Desktop/hores-web/`, proyecto separado) con
`scripts/migrar_catalogo_hores.py`. El script lee las credenciales de
`.env` — no las tiene hardcodeadas. Es re-ejecutable si hace falta volver a
importar (aunque hoy duplicaría los registros si se corre dos veces; no
tiene lógica de upsert).
