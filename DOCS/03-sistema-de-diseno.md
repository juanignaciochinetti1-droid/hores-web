# Sistema de diseño

Todo el diseño viene originalmente de los mockups en `disenos/hores/*.dc.html`
(hechos con Claude Design). El sitio en Odoo replica ese lenguaje visual con
HTML/CSS propio — no hay copia literal de esos archivos, se portó a QWeb.

## Paleta de color

### Sitio general (Home, Compras, Categoría, Producto, Calidad, Compromiso)

Colores hardcodeados en cada template (no hay variables CSS a nivel sitio):

| Uso | Color |
|---|---|
| Fondo general | `#f6f4ef` (crema) |
| Texto principal | `#241d17` |
| Texto secundario | `#5a4f44` / `#8a7a67` |
| Acento de marca (naranja) | `#c26a1e` |
| Bordes | `#e8e3d9` |
| Tarjetas | `#ffffff` |
| Secciones oscuras (hero Home, franjas de compromiso) | `#241d17`, `#20301f` (verde oscuro en Compromiso) |
| WhatsApp | `#25d366` |

### Historia (única página con sistema de tokens + tema claro/oscuro)

Definidos como CSS custom properties en `.historia-page`:

```css
.historia-page {
  --h-bg:#f6f4ef; --h-card:#ffffff; --h-border:#e8e3d9;
  --h-text:#241d17; --h-text2:#5a4f44; --h-accent:#c26a1e;
}
.historia-page[data-theme="dark"] {
  --h-bg:#1a1510; --h-card:#241d17; --h-border:rgba(255,255,255,.09);
  --h-text:#f5f1ea; --h-text2:#b9ac9a; --h-accent:#e08a34;
}
```

Si se decide llevar el toggle de tema a todo el sitio, este es el punto de
partida — pero es un trabajo grande (convertir cada color hardcodeado del
resto de las páginas a variables), no una tarea chica. Se evaluó y se
decidió no hacerlo todavía (ver pendientes).

## Tipografía

Cargadas una vez en `head_assets` vía Google Fonts:

| Familia | Uso | Pesos cargados |
|---|---|---|
| **Source Serif 4** | Títulos (H1/H2/H3), números destacados | 400/500/600/700 |
| **Archivo** | Cuerpo de texto, UI, botones, nav | 400/500/600/700 |
| **Bricolage Grotesque** | Footer | 400/600/700 |

Patrón típico de encabezado de sección (repetido en todas las páginas de
contenido):

```html
<div style="font-size:12.5px; font-weight:600; letter-spacing:.12em;
            text-transform:uppercase; color:#c26a1e; margin-bottom:10px;">
  Eyebrow
</div>
<h2 style="font-family:'Source Serif 4',serif; font-weight:700;
           font-size:28-32px; margin:0 0 16-26px; color:#241d17;">
  Título de la sección
</h2>
```

## Contenedor y espaciado

- Ancho máximo de contenido: `max-width:1200px; margin:0 auto;`
  (`840px` para bloques de texto centrados tipo hero/FAQ).
- Padding horizontal estándar: `28px`.
- Radios: `14px` tarjetas grandes, `8-12px` botones/tarjetas chicas, `50%`
  círculos (íconos, punto del timeline).
- Sin `box-shadow` nativo salvo donde se agregó explícitamente (ver clase
  `.hc-card` abajo) — el diseño original es plano, con sombra solo como
  mejora posterior.

## Clases utilitarias compartidas (definidas en `head_assets`)

Estas son las únicas clases CSS reusables del proyecto — todo lo demás es
estilo inline. Viven en el `<style>` de `head_assets`
(`catalogo_templates.xml`), con selector `#wrap.oe_structure .clase` para
tener suficiente especificidad sobre el CSS base de Odoo.

| Clase | Qué hace | Dónde se usa |
|---|---|---|
| `.reveal` | Fade-in + translateY al entrar en viewport (via `IntersectionObserver` global) | Secciones de Home, Calidad, Compromiso, Compras |
| `.hc-card` | Sombra sutil + lift al hover | Tarjetas de Calidad, Compromiso, variantes de producto, Historia (`.h-card`) |
| `.hc-product-card` + `.hc-product-thumb` + `.hc-product-name` | Zoom de imagen y color de nombre al hover | Tarjetas de producto en Home/Compras/Categoría |
| `.hc-badge-custom` | Badge "Personalizable" (esquina superior derecha de la foto) | Tarjetas de producto con `is_custom=True` |
| `.hc-empty-state` | Caja con borde punteado para estados vacíos | Categoría sin productos publicados |
| `.hc-hero-grid` | Patrón de grilla sutil superpuesto sobre fondos oscuros | Hero de Compromiso |
| `.hc-back-to-top` | Botón circular flotante "volver arriba", aparece después de 400px de scroll | Todas las páginas (posición inline por instancia: izquierda en las que tienen WhatsApp a la derecha, derecha en Historia que tiene el toggle de tema a la izquierda) |
| `.hc-lang-selector` / `.hc-lang-btn` / `.hc-lang-menu` | Selector de idioma del header (reusa `portal.language_selector` de Odoo, restyleado) | `site_header`, en todas las páginas — ver [idiomas](06-idiomas.md) |

Botones "con pinta de botón" (cualquier `<a>` con `border-radius` en su
estilo inline) levantan y se aclaran al hover automáticamente vía selector
de atributo (`a[style*="border-radius"]:hover`) — no hace falta agregarles
una clase para eso.

## Responsive

El sitio se construyó originalmente **sin ningún breakpoint** fuera de
Historia — las grillas (`grid-template-columns:repeat(3,1fr)`, etc.) eran
fijas y se veían apretadas en celular. Se agregó una capa de responsive
global en `head_assets`, con dos quiebres:

- **≤900px**: grillas de 3-4 columnas pasan a 2; grillas de 2 columnas con
  proporciones (`.9fr 1.1fr`, `1.05fr .95fr`, etc.) pasan a 1 columna
  (apiladas).
- **≤560px**: todo colapsa a 1 columna.

Como son estilos **inline** (no clases), el CSS global los pisa apuntando
por contenido del atributo `style` (`[style*="grid-template-columns:..."]`)
con `!important` — mismo truco que ya se usaba para el hover de botones.
Si se agrega una grilla nueva con una proporción de columnas que no está en
esa lista, no se va a volver responsive sola — hay que sumar su selector en
`head_assets` (buscar el comentario "Responsive:" en el `<style>`).

**Pendiente de un pase más fino:** esto resuelve que nada quede roto/
apretado, pero no es un rediseño mobile-first — el header (`site_header`)
no tiene menú hamburguesa, solo hace `flex-wrap` de los links cuando no
entran. Funciona, pero no es lo más prolijo. Si se quiere pulir más, ese es
el siguiente paso.

## Animaciones puntuales

- **Contadores animados** (`/historia`, franja de stats): cada número
  (`+40`, `+500`, etc.) cuenta desde 0 hasta el valor real la primera vez
  que entra en pantalla (`IntersectionObserver` + `requestAnimationFrame`,
  ~1.2s). El valor real vive en `data-target` sobre el mismo elemento que
  ya lo muestra por `t-esc` — si JS no corre, se ve el número final fijo,
  no queda en 0.

## Íconos

Emoji Unicode directo en el HTML/Python (`🎯`, `📦`, `✓`, etc.), sin
librería de íconos SVG. Consistente en todo el sitio.

## Ojo con XML al escribir JS inline

Los `<script>` van dentro de archivos **XML** (vistas QWeb), no HTML — a
diferencia de un `.html` suelto, acá `&&`, `<`, `>` sueltos dentro de un
`<script>` rompen el parseo del archivo entero (hay que escribirlos como
`&amp;&amp;`, `&lt;`, `&gt;`). Ya pasó una vez (contador animado con
`if (a && b)` y `if (x < 1)` sin escapar) — el módulo no cargaba hasta
corregirlo. Antes de dar un cambio con JS por terminado, correr un upgrade
real del módulo (no alcanza con "se ve bien en el editor").
