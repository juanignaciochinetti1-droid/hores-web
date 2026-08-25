# Stack y herramientas

## Backend / CMS

- **Odoo 19.0** (rama de desarrollo, clonada en `odoo/` — es un repo git
  propio, no versionado dentro de este proyecto, ver `.gitignore`).
- **Python 3.12** dentro del contenedor Docker (el host tiene 3.14, pero el
  contenedor usa 3.12-slim por mejor disponibilidad de wheels precompiladas).
- **PostgreSQL 16** (contenedor `db`, credenciales `odoo`/`odoo`, solo para
  desarrollo local).
- Módulo custom: **`custom_addons/mi_sitio_web/`** — todo el sitio vive acá.
  El resto de `odoo/` es el framework sin modificar.

## Infraestructura local

- **Docker Desktop** + `docker-compose.yml` (servicios `db` y `odoo`) — ver
  `Dockerfile` en la raíz para el build de la imagen de Odoo.
- Levantar: `docker compose up -d` (con Docker Desktop corriendo).
- Actualizar el módulo tras un cambio de código: reiniciar el contenedor
  `odoo` (para que tome cambios en `.py`) y correr
  `button_immediate_upgrade` sobre el módulo (para que tome cambios en
  vistas/modelos) — ver el historial de la sesión para el comando exacto vía
  API JSON-RPC, o hacerlo desde Ajustes → Apps → Mi Sitio Web → Actualizar
  en el backend de Odoo.
- Base de datos: `odoo.bd`. Login admin:
  `juanignaciochinetti1@gmail.com` (credenciales completas en `.env`, no
  versionado).

## Frontend

- **Sin frameworks de JS** (nada de React/Vue) y **sin frameworks de CSS**
  (nada de Tailwind/Bootstrap). Todo el HTML se genera con templates QWeb de
  Odoo, con estilos inline mayormente, más un puñado de clases utilitarias
  compartidas (ver [sistema de diseño](03-sistema-de-diseno.md)).
- **JS vanilla puntual**, sin dependencias externas, para:
  - Scroll-reveal global (`IntersectionObserver`, definido una sola vez en
    `head_assets` y reusado en todas las páginas vía `class="reveal"`).
  - Slideshow del hero de Home (`@keyframes` CSS, sin JS).
  - Buscador instantáneo en `/compras` (filtro client-side).
  - Lightbox de variantes en `/categoria/<slug>` (abrir/cerrar con click o
    tecla Escape).
  - Toggle de tema claro/oscuro en `/historia` (única página con esa
    funcionalidad; guarda preferencia en `localStorage`).
- **Google Fonts** vía `<link>` (no self-hosted): Source Serif 4, Archivo,
  Bricolage Grotesque. Cargadas una sola vez en `head_assets`.
- Iconografía: **emoji Unicode** (🎯 📦 🌎 etc.), no hay librería de íconos.
- Banderas de países (`/historia`): imágenes de **flagcdn.com** (CDN
  externo, sin librería).

## Integraciones de Odoo que usa el sitio

- **CRM** (`crm.lead`): el formulario de contacto crea un Lead.
- **Sitio Web** (`website`): el módulo depende de `website` para
  aprovechar el layout base, el sistema de rutas HTTP y el manejo de
  imágenes (`/web/image/<model>/<id>/<field>`).
- **Portal/Ventas/Facturación**: decisión tomada de *no* reconstruir estos
  con código propio — si en algún momento se necesitan pedidos/facturas
  reales, usar las apps nativas de Odoo (Ventas, Facturación, Portal de
  cliente) en vez de programarlas a mano.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Código del sitio | `custom_addons/mi_sitio_web/` |
| Diseños originales (mockups `.dc.html`, imágenes fuente) | `disenos/hores/` |
| Script de migración del catálogo real | `scripts/migrar_catalogo_hores.py` |
| Credenciales locales (API key, DB) | `.env` (no versionado) |
| Entorno Docker | `Dockerfile`, `docker-compose.yml` |
