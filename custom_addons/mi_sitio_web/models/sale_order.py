# -*- coding: utf-8 -*-
from odoo import fields, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # Marca los pedidos que WebsiteSaleHores._crear_oportunidad_desde_carrito
    # cancela automáticamente cuando detecta un cliente nuevo (ver
    # controllers/main.py, shop_payment) -- esos pedidos nunca llegaron a
    # confirmarse de verdad, son solo el carrito que disparó la oportunidad
    # en CRM. Sin esta marca, _es_cliente_nuevo no podía distinguir "este
    # cliente canceló un pedido REAL después de confirmarlo" (sí es un
    # cliente conocido) de "este es el propio pedido que este método acaba
    # de cancelar" (no es un cliente conocido todavía) -- las dos cosas
    # terminan en el mismo estado (state='cancel'), así que hacía falta
    # una marca aparte para diferenciarlas.
    mi_sitio_lead_cancelado = fields.Boolean(
        string='Cancelado automáticamente (nuevo lead del sitio web)',
        default=False,
        copy=False,
        help='Se marca solo cuando el sitio web cancela este pedido '
             'automáticamente al crear una oportunidad de CRM para un '
             'cliente nuevo -- no cuenta como "ya tuvo un pedido antes" '
             'para la clasificación de cliente nuevo/existente.',
    )

    def action_confirm(self):
        """Si alguien de Ventas reabre a mano uno de estos pedidos
        auto-cancelados (en vez de armar uno nuevo desde la oportunidad
        de CRM) y lo confirma de verdad, deja de ser "el carrito que
        disparó una oportunidad" para pasar a ser un pedido real -- la
        marca tiene que sacarse acá, si no, la próxima compra de ese
        mismo cliente se sigue clasificando como "nuevo" para siempre
        (encontrado en revisión de código, 07/09/2026)."""
        con_marca = self.filtered('mi_sitio_lead_cancelado')
        res = super().action_confirm()
        if con_marca:
            con_marca.write({'mi_sitio_lead_cancelado': False})
        return res
