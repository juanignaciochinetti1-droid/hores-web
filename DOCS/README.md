# Documentación del proyecto — Sitio HORES Cartotecnica sobre Odoo

Esta carpeta documenta las decisiones de diseño, el stack técnico y la
arquitectura del sitio, para que cualquiera que retome el proyecto (o vuelva
a él en unos meses) no tenga que reconstruir el contexto desde cero.

## Índice

1. [Stack y herramientas](01-stack-y-herramientas.md) — qué corre el proyecto y con qué
2. [Arquitectura del proyecto](02-arquitectura-proyecto.md) — estructura de carpetas, modelos, rutas
3. [Sistema de diseño](03-sistema-de-diseno.md) — colores, tipografía, componentes reusables
4. [Pendientes y datos de ejemplo](04-pendientes-y-datos-de-ejemplo.md) — qué es real y qué falta reemplazar
5. [Validaciones](05-validaciones.md) — qué se valida en modelos, seguridad y el formulario de contacto
6. [Idiomas](06-idiomas.md) — español/inglés/portugués, cómo está traducido cada tipo de contenido
7. [Pedidos](07-pedidos.md) — carrito y checkout (eCommerce/website_sale), catálogo puente y badges de disponibilidad
8. [Bolsa de trabajo](08-bolsa-de-trabajo.md) — /trabaja-con-nosotros, postulaciones (hr.applicant) y el gotcha de traducción encontrado ahí

## Resumen de una línea

Sitio web para HORES Cartotecnica (moldes de papel para panificación),
construido como módulo custom (`mi_sitio_web`) sobre Odoo 19, corriendo en
Docker localmente. Sin frameworks de frontend — HTML/CSS con estilos inline
+ JS vanilla puntual, siguiendo el lenguaje visual de los mockups originales
en `disenos/hores/`.

## Cómo mantener esta documentación

Cada vez que se agregue una página, un patrón visual nuevo, una librería o
una herramienta al proyecto, actualizar el archivo correspondiente acá antes
de dar la tarea por terminada. Si el cambio no encaja en ningún archivo
existente, crear uno nuevo y enlazarlo desde este índice.
