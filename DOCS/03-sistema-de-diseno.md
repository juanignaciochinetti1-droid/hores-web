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

Botones "con pinta de botón" (cualquier `<a>` con `border-radius` en su
estilo inline) levantan y se aclaran al hover automáticamente vía selector
de atributo (`a[style*="border-radius"]:hover`) — no hace falta agregarles
una clase para eso.

## Íconos

Emoji Unicode directo en el HTML/Python (`🎯`, `📦`, `✓`, etc.), sin
librería de íconos SVG. Consistente en todo el sitio.
