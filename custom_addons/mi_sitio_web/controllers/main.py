from odoo import http
from odoo.http import request


class MiSitioWeb(http.Controller):

    @http.route('/mi-sitio', type='http', auth='public', website=True, sitemap=True)
    def home(self, **kwargs):
        productos = request.env['mi_sitio_web.producto'].sudo().search([
            ('is_published', '=', True),
        ], order='sequence')
        return request.render('mi_sitio_web.home_template', {
            'productos': productos,
        })

    @http.route('/compras', type='http', auth='public', website=True, sitemap=True)
    def compras(self, **kwargs):
        categorias = request.env['mi_sitio_web.categoria'].sudo().search([], order='sequence')
        productos = request.env['mi_sitio_web.producto'].sudo().search([
            ('is_published', '=', True),
        ], order='sequence')
        return request.render('mi_sitio_web.compras_template', {
            'categorias': categorias,
            'productos': productos,
        })

    @http.route('/categoria/<string:slug>', type='http', auth='public', website=True, sitemap=True)
    def categoria(self, slug, **kwargs):
        categoria = request.env['mi_sitio_web.categoria'].sudo().search([('slug', '=', slug)], limit=1)
        if not categoria:
            return request.not_found()
        productos = categoria.producto_ids.filtered('is_published')
        return request.render('mi_sitio_web.categoria_template', {
            'categoria': categoria,
            'productos': productos,
        })

    @http.route('/producto/<int:producto_id>', type='http', auth='public', website=True, sitemap=True)
    def producto_detalle(self, producto_id, **kwargs):
        producto = request.env['mi_sitio_web.producto'].sudo().browse(producto_id)
        if not producto.exists() or not producto.is_published:
            return request.not_found()
        return request.render('mi_sitio_web.producto_detalle_template', {
            'producto': producto,
        })

    @http.route('/calidad', type='http', auth='public', website=True, sitemap=True)
    def calidad(self, **kwargs):
        return request.render('mi_sitio_web.calidad_template', {})

    @http.route('/compromiso', type='http', auth='public', website=True, sitemap=True)
    def compromiso(self, **kwargs):
        return request.render('mi_sitio_web.compromiso_template', {})

    @http.route('/historia', type='http', auth='public', website=True, sitemap=True)
    def historia(self, **kwargs):
        return request.render('mi_sitio_web.historia_template', {})

    @http.route('/mi-sitio/contacto', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def contacto(self, **post):
        nombre = (post.get('nombre') or '').strip()
        empresa = (post.get('empresa') or '').strip()
        email = (post.get('email') or '').strip()
        mensaje = (post.get('mensaje') or '').strip()

        # Validación server-side: el atributo required del HTML no protege
        # contra un POST directo (curl, bot) con campos vacíos.
        if not nombre or not email or not mensaje:
            return request.redirect('/mi-sitio?contacto_error=1#contacto')

        medium = request.env.ref('utm.utm_medium_website', raise_if_not_found=False)

        request.env['crm.lead'].sudo().create({
            'name': 'Consulta web: %s' % nombre,
            'contact_name': nombre,
            'partner_name': empresa,
            'email_from': email,
            'description': mensaje,
            'medium_id': medium.id if medium else False,
        })

        # Patrón Post/Redirect/Get: si el visitante refresca la página de
        # agradecimiento, el navegador repite el GET en vez de reenviar el
        # formulario y duplicar el Lead.
        return request.redirect('/mi-sitio/gracias')

    @http.route('/mi-sitio/gracias', type='http', auth='public', website=True)
    def contacto_gracias(self, **kwargs):
        return request.render('mi_sitio_web.contacto_gracias_template', {})
