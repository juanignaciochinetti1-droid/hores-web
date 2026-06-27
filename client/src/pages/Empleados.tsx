import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, ArrowLeft, Briefcase, Clock, Truck, CheckCircle2,
  FileText, Download, Eye, ShoppingBag, History, ReceiptText,
  BarChart3, X, Check, Sun, Moon, Inbox, TrendingUp, TrendingDown,
  ArrowRight, Users, MessageSquare, Trash2, CheckCheck,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/* ── Types ── */

interface Order {
  id: string;
  client: string;
  product: string;
  specs: string;
  dateOrdered: string;
  dateEstimated: string;
  status: "preparando" | "en-camino" | "listo";
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceId: string;
}

interface Solicitud {
  id: string;
  client: string;
  empresa: string;
  product: string;
  specs: string;
  quantity: number;
  estimatedValue: number;
  dateSubmitted: string;
  isCustom: boolean;
  customDescription?: string;
  status: "pendiente" | "aprobada" | "rechazada";
}

type Tab = "solicitudes" | "activos" | "historial" | "facturas" | "informe" | "opiniones";

interface PendingReview {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  quote: string;
  created_at: string;
}


/* ── Helpers ── */

const STATUS_BADGES: Record<Order["status"], { label: string; color: string; bg: string }> = {
  preparando: { label: "Preparando", color: "#c49a08", bg: "rgba(196,154,8,0.12)"   },
  "en-camino": { label: "En camino", color: "#1a8fc8", bg: "rgba(26,143,200,0.12)" },
  listo:       { label: "Entregado",  color: "#259c57", bg: "rgba(37,156,87,0.12)"  },
};

const STATUS_NEXT: Partial<Record<Order["status"], Order["status"]>> = {
  preparando: "en-camino",
  "en-camino": "listo",
};

const STATUS_NEXT_LABEL: Partial<Record<Order["status"], string>> = {
  preparando: "Marcar en camino",
  "en-camino": "Marcar entregado",
};

const STEPS = [
  { key: "preparando", label: "Preparando", icon: Clock },
  { key: "en-camino",  label: "En camino",  icon: Truck },
  { key: "listo",      label: "Entregado",  icon: CheckCircle2 },
] as const;

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });

const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

const parseFmtDate = (s: string): Date => {
  if (!s || !s.includes("/")) return new Date(0);
  const [d, m, y] = s.split("/");
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const invoiceId = (orderId: string | number, date: Date) =>
  `FAC-${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}-${String(orderId).padStart(4, "0")}`;

/* ── Sub-components ── */

function TrackingBar({ status }: { status: Order["status"] }) {
  const stepIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= stepIndex;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ minWidth: 56 }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: done ? "var(--brand-orange)" : "var(--section-card-inner)",
                  border: `2px solid ${done ? "var(--brand-orange)" : "var(--section-border)"}`,
                }}
              >
                <Icon size={13} color={done ? "#ffffff" : "var(--section-muted)"} />
              </div>
              <span
                className="text-xs text-center leading-tight"
                style={{
                  color: done ? "var(--brand-orange)" : "var(--section-muted)",
                  fontFamily: "var(--font-body)",
                  fontWeight: done ? 600 : 400,
                  maxWidth: 54,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-1 mb-5"
                style={{ backgroundColor: i < stepIndex ? "var(--brand-orange)" : "var(--section-border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InvoiceModal({ order, onClose, onDownload }: { order: Order; onClose: () => void; onDownload: () => void }) {
  const subtotal = Math.round(order.total / 1.21);
  const iva = order.total - subtotal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-start justify-between" style={{ borderColor: "var(--section-border)" }}>
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 flex items-center justify-center rounded" style={{ backgroundColor: "var(--brand-orange)" }}>
                <Package size={14} color="#ffffff" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                HORES Cartotécnica
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>Buenos Aires, Argentina</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>
                {order.invoiceId}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                Fecha: {order.dateOrdered}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded" style={{ color: "var(--section-muted)" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border-subtle)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
              Facturado a
            </div>
            <div className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{order.client}</div>
          </div>

          <div>
            <div className="grid grid-cols-12 text-xs font-semibold uppercase tracking-wider pb-2 mb-2 border-b"
              style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)", borderColor: "var(--section-border)" }}>
              <span className="col-span-6">Descripción</span>
              <span className="col-span-2 text-center">Cant.</span>
              <span className="col-span-2 text-right">P. Unit.</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="grid grid-cols-12 text-sm py-2">
              <div className="col-span-6">
                <div className="font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{order.product}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{order.specs}</div>
              </div>
              <span className="col-span-2 text-center" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>{order.quantity}</span>
              <span className="col-span-2 text-right" style={{ color: "var(--section-body)", fontFamily: "var(--font-mono)" }}>{fmt(order.unitPrice)}</span>
              <span className="col-span-2 text-right font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>{fmt(order.total)}</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--section-border)" }}>
            <div className="flex justify-between text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              <span>Subtotal (neto)</span><span style={{ fontFamily: "var(--font-mono)" }}>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              <span>IVA 21%</span><span style={{ fontFamily: "var(--font-mono)" }}>{fmt(iva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: "var(--section-border)" }}>
              <span style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>TOTAL</span>
              <span style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onDownload}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 active:scale-95"
            style={{ backgroundColor: "var(--brand-orange)", color: "#ffffff", fontFamily: "var(--font-body)" }}
          >
            <Download size={14} />
            Descargar PDF
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm rounded-lg border"
            style={{ borderColor: "var(--section-border)", color: "var(--section-muted)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function Empleados() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("solicitudes");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  const fetchOrders = () => {
    const token = localStorage.getItem("hores_token");
    if (!token) { setOrdersLoading(false); return; }
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        const newSolicitudes: Solicitud[] = [];
        const newPedidos: Order[] = [];
        const serverToClient: Record<string, Order["status"]> = {
          en_proceso: "preparando",
          listo: "en-camino",
          entregado: "listo",
        };
        for (const o of data) {
          if (o.status === "pendiente" || o.status === "rechazado") {
            newSolicitudes.push({
              id: String(o.id),
              client: o.name,
              empresa: o.company || o.name,
              product: o.product || "Sin especificar",
              specs: [o.variant, o.dimensions, o.material].filter(Boolean).join(" · "),
              quantity: o.quantity || 1,
              estimatedValue: 0,
              dateSubmitted: o.created_at ? fmtDate(new Date(o.created_at)) : "—",
              isCustom: !!o.notes,
              customDescription: o.notes || undefined,
              status: o.status === "rechazado" ? "rechazada" : "pendiente",
            });
          } else {
            const createdAt = o.created_at ? new Date(o.created_at) : new Date();
            const estimated = new Date(createdAt);
            estimated.setDate(estimated.getDate() + 10);
            newPedidos.push({
              id: String(o.id),
              client: o.company || o.name,
              product: o.product || "Sin especificar",
              specs: [o.variant, o.dimensions].filter(Boolean).join(" · ") || "—",
              dateOrdered: fmtDate(createdAt),
              dateEstimated: fmtDate(estimated),
              status: serverToClient[o.status] ?? "preparando",
              quantity: o.quantity || 1,
              unitPrice: 0,
              total: 0,
              invoiceId: invoiceId(o.id, createdAt),
            });
          }
        }
        setSolicitudes(newSolicitudes);
        setPedidos(newPedidos);
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  };

  const fetchPendingReviews = () => {
    if (user?.role !== "admin") return;
    fetch("/api/reviews/pending", { headers: { Authorization: `Bearer ${localStorage.getItem("hores_token")}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setPendingReviews(d); })
      .catch(() => {});
  };

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "empleado")) fetchOrders();
  }, [user]);

  useEffect(() => { fetchPendingReviews(); }, [user]);

  const approveReview = async (id: number) => {
    await fetch(`/api/reviews/${id}/approve`, { method: "PATCH", headers: { Authorization: `Bearer ${localStorage.getItem("hores_token")}` } });
    fetchPendingReviews();
  };

  const deleteReview = async (id: number) => {
    await fetch(`/api/reviews/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("hores_token")}` } });
    fetchPendingReviews();
  };

  useEffect(() => {
    if (selectedInvoice) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => { document.documentElement.style.overflow = ""; };
  }, [selectedInvoice]);

  if (authLoading) return null;
  if (!user || (user.role !== "admin" && user.role !== "empleado")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--section-bg)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
          Acceso restringido
        </p>
        <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
          Necesitás iniciar sesión como empleado o administrador.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "var(--brand-orange)", color: "#fff", fontFamily: "var(--font-body)" }}
        >
          Ir al login
        </button>
      </div>
    );
  }

  const pendingCount = solicitudes.filter((s) => s.status === "pendiente").length;
  const activeOrders = pedidos.filter((o) => o.status !== "listo");

  const approveSolicitud = (id: string) => {
    const sol = solicitudes.find((s) => s.id === id);
    if (!sol || sol.status !== "pendiente") return;
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, status: "aprobada" } : s)));
    const numericId = Number(id);
    if (!isNaN(numericId)) {
      fetch(`/api/orders/${numericId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hores_token")}` },
        body: JSON.stringify({ status: "en_proceso" }),
      }).catch(() => {});
    }
    const today = new Date();
    const estimated = new Date(today);
    estimated.setDate(today.getDate() + 10);
    const newOrder: Order = {
      id: id,
      client: sol.empresa,
      product: sol.product,
      specs: sol.specs,
      dateOrdered: fmtDate(today),
      dateEstimated: fmtDate(estimated),
      status: "preparando",
      quantity: sol.quantity,
      unitPrice: Math.round(sol.estimatedValue / (sol.quantity || 1)),
      total: sol.estimatedValue,
      invoiceId: invoiceId(id, today),
    };
    setPedidos((prev) => [newOrder, ...prev]);
  };

  const rejectSolicitud = (id: string) => {
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, status: "rechazada" } : s)));
    const numericId = Number(id);
    if (!isNaN(numericId)) {
      fetch(`/api/orders/${numericId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hores_token")}` },
        body: JSON.stringify({ status: "rechazado" }),
      }).catch(() => {});
    }
  };

  const downloadPDF = (order: Order) => {
    const subtotal = Math.round(order.total / 1.21);
    const iva = order.total - subtotal;
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Factura ${order.invoiceId || order.id}</title>
<style>
  body{font-family:sans-serif;padding:40px;max-width:620px;margin:0 auto;color:#1C1C1E}
  .header{display:flex;justify-content:space-between;margin-bottom:28px}
  .brand{font-size:15px;font-weight:700;color:#F57C00}
  .muted{font-size:12px;color:#6D6D6D;margin-top:3px}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6D6D6D;border-bottom:1px solid #E0E0E0;padding:4px 0;text-align:left}
  th:last-child,td:last-child{text-align:right}
  td{font-size:13px;padding:10px 0;border-bottom:1px solid #F0F0F0}
  .totals{text-align:right;font-size:13px;color:#6D6D6D;line-height:2}
  .grand{font-size:16px;font-weight:700;color:#F57C00}
  @media print{@page{margin:20mm}}
</style></head><body>
<div class="header">
  <div><div class="brand">HORES Cartotécnica</div><div class="muted">Buenos Aires, Argentina</div></div>
  <div style="text-align:right"><div style="font-size:18px;font-weight:700">${order.invoiceId || "—"}</div><div class="muted">Fecha: ${order.dateOrdered}</div></div>
</div>
<div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#6D6D6D;margin-bottom:3px">Facturado a</div>
<div style="font-size:14px;font-weight:600;margin-bottom:24px">${order.client}</div>
<table>
  <thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr></thead>
  <tbody><tr>
    <td><strong>${order.product}</strong><br><span style="font-size:11px;color:#6D6D6D">${order.specs}</span></td>
    <td>${order.quantity}</td>
    <td>${fmt(order.unitPrice)}</td>
    <td>${fmt(order.total)}</td>
  </tr></tbody>
</table>
<div class="totals">
  <div>Subtotal (neto): ${fmt(subtotal)}</div>
  <div>IVA 21%: ${fmt(iva)}</div>
  <div class="grand" style="margin-top:8px">TOTAL: ${fmt(order.total)}</div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  const advanceStatus = (orderId: string) => {
    const order = pedidos.find((o) => o.id === orderId);
    if (!order) return;
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    const statusMap: Record<Order["status"], string> = { preparando: "listo", "en-camino": "entregado", listo: "entregado" };
    const dbStatus = statusMap[order.status];
    const numericId = Number(orderId);
    if (!isNaN(numericId)) {
      fetch(`/api/orders/${numericId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hores_token")}` },
        body: JSON.stringify({ status: dbStatus }),
      }).catch(() => {});
    }
    setPedidos((prev) => prev.map((o) => o.id === orderId ? { ...o, status: next } : o));
  };

  /* ── Informe helpers (computed from live state) ── */
  const totalIngresos = pedidos.reduce((s, o) => s + o.total, 0);
  const ingresosConfirmados = pedidos.filter((o) => o.status === "listo").reduce((s, o) => s + o.total, 0);
  const clientRevenue = pedidos.reduce((acc, o) => {
    acc[o.client] = (acc[o.client] || 0) + o.total;
    return acc;
  }, {} as Record<string, number>);
  const topClients = Object.entries(clientRevenue).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxClientRev = topClients[0]?.[1] || 1;

  /* ── Week chart (computed from real orders) ── */
  const _now = new Date();
  const _monday = new Date(_now);
  _monday.setDate(_now.getDate() - ((_now.getDay() + 6) % 7));
  _monday.setHours(0, 0, 0, 0);
  const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const weekData = WEEK_LABELS.map((day, i) => {
    const date = new Date(_monday);
    date.setDate(_monday.getDate() + i);
    const dateStr = fmtDate(date);
    return { day, orders: pedidos.filter((o) => o.dateOrdered === dateStr).length };
  });
  const maxWeek = Math.max(1, ...weekData.map((d) => d.orders));

  /* ── Month-over-month trends ── */
  const _thisMonthStart = new Date(_now.getFullYear(), _now.getMonth(), 1);
  const _lastMonthStart = new Date(_now.getFullYear(), _now.getMonth() - 1, 1);
  const _thisMthOrders = pedidos.filter((o) => parseFmtDate(o.dateOrdered) >= _thisMonthStart);
  const _lastMthOrders = pedidos.filter((o) => {
    const d = parseFmtDate(o.dateOrdered);
    return d >= _lastMonthStart && d < _thisMonthStart;
  });
  const _pctTrend = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? "+100%" : "—") : `${cur >= prev ? "+" : ""}${Math.round(((cur - prev) / prev) * 100)}%`;
  const _diffTrend = (cur: number, prev: number) =>
    `${cur >= prev ? "+" : ""}${cur - prev}`;
  const trendIngresos = _pctTrend(
    _thisMthOrders.reduce((s, o) => s + o.total, 0),
    _lastMthOrders.reduce((s, o) => s + o.total, 0),
  );
  const trendIngresosConf = _pctTrend(
    _thisMthOrders.filter((o) => o.status === "listo").reduce((s, o) => s + o.total, 0),
    _lastMthOrders.filter((o) => o.status === "listo").reduce((s, o) => s + o.total, 0),
  );
  const trendActivos = _diffTrend(
    _thisMthOrders.filter((o) => o.status !== "listo").length,
    _lastMthOrders.filter((o) => o.status !== "listo").length,
  );
  const trendSolicitudes = _diffTrend(
    solicitudes.filter((s) => parseFmtDate(s.dateSubmitted) >= _thisMonthStart).length,
    solicitudes.filter((s) => { const d = parseFmtDate(s.dateSubmitted); return d >= _lastMonthStart && d < _thisMonthStart; }).length,
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: "var(--navbar-solid-bg)", backdropFilter: "blur(12px)", borderColor: "var(--section-border)" }}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 text-sm transition-colors duration-150"
                style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
              >
                <ArrowLeft size={15} />
                Volver
              </button>
              <div className="h-4 w-px" style={{ backgroundColor: "var(--section-border)" }} />
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center rounded" style={{ backgroundColor: "var(--brand-orange)" }}>
                  <Briefcase size={13} color="#ffffff" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>
                  Panel de Empleados
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(210,112,10,0.15)",
                    color: "var(--brand-orange)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                  }}
                >
                  Staff
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {toggleTheme && (
                <button onClick={toggleTheme} className="p-2 rounded" style={{ color: "var(--section-muted)" }}>
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── DASHBOARD ── */}
        <div className="container py-10">
          {ordersLoading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand-orange)", borderTopColor: "transparent" }} />
            </div>
          )}
          {!ordersLoading && <>
          {/* Welcome */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}>
                Panel de gestión
              </h1>
              <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                Administrá pedidos, aprobá solicitudes y revisá el rendimiento mensual.
              </p>
            </div>
            {pendingCount > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: "rgba(196,154,8,0.10)", border: "1px solid rgba(196,154,8,0.25)", color: "#c49a08", fontFamily: "var(--font-body)" }}
              >
                <Inbox size={15} />
                {pendingCount} solicitud{pendingCount !== 1 ? "es" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Solicitudes pendientes", value: pendingCount, color: "#c49a08" },
              { label: "Pedidos activos", value: activeOrders.length, color: "var(--brand-orange)" },
              { label: "En camino", value: pedidos.filter((o) => o.status === "en-camino").length, color: "#1a8fc8" },
              { label: "Entregados (mes)", value: pedidos.filter((o) => o.status === "listo").length, color: "#259c57" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                <div className="text-3xl font-bold mb-1" style={{ color: stat.color, fontFamily: "var(--font-mono)" }}>
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 mb-6 p-1 rounded-lg overflow-x-auto w-fit max-w-full"
            style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
          >
            {([
              { key: "solicitudes" as Tab, label: "Solicitudes",    icon: Inbox,         badge: pendingCount },
              { key: "activos" as Tab,     label: "Pedidos activos", icon: ShoppingBag,   badge: undefined },
              { key: "historial" as Tab,   label: "Historial",       icon: History,       badge: undefined },
              { key: "facturas" as Tab,    label: "Facturas",        icon: ReceiptText,   badge: undefined },
              { key: "informe" as Tab,     label: "Informe mensual", icon: BarChart3,     badge: undefined },
              ...(user?.role === "admin" ? [{ key: "opiniones" as Tab, label: "Opiniones", icon: MessageSquare, badge: pendingReviews.length || undefined }] : []),
            ]).map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all duration-150 whitespace-nowrap relative"
                style={{
                  backgroundColor: tab === key ? "var(--section-card)" : "transparent",
                  color: tab === key ? "var(--section-heading)" : "var(--section-muted)",
                  fontFamily: "var(--font-body)",
                  boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <Icon size={14} />
                {label}
                {badge != null && badge > 0 && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ backgroundColor: "#c49a08", color: "#1C1C1E", fontSize: "10px" }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Solicitudes ── */}
          {tab === "solicitudes" && (
            <div className="space-y-4">
              {solicitudes.length === 0 && (
                <div className="rounded-xl p-16 text-center" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                  <Inbox size={40} className="mx-auto mb-3" style={{ color: "var(--section-muted)" }} />
                  <p style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>No hay solicitudes</p>
                </div>
              )}
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: "var(--section-card)",
                    border: `1px solid ${sol.status === "pendiente" ? "rgba(196,154,8,0.35)" : "var(--section-border)"}`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                          {sol.id}
                        </span>
                        {sol.isCustom && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(192,64,184,0.12)", color: "#c040b8", fontFamily: "var(--font-body)" }}
                          >
                            Pedido personalizado
                          </span>
                        )}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor:
                              sol.status === "pendiente" ? "rgba(196,154,8,0.12)" :
                              sol.status === "aprobada"  ? "rgba(37,156,87,0.12)" :
                              "rgba(210,90,10,0.12)",
                            color:
                              sol.status === "pendiente" ? "#c49a08" :
                              sol.status === "aprobada"  ? "#259c57" :
                              "#d25a0a",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {sol.status === "pendiente" ? "Pendiente" : sol.status === "aprobada" ? "Aprobada" : "Rechazada"}
                        </span>
                      </div>
                      <div className="text-base font-semibold mb-0.5" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                        {sol.product}
                      </div>
                      <div className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                        {sol.specs}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>
                        {fmt(sol.estimatedValue)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                        {sol.quantity} u. estimadas
                      </div>
                    </div>
                  </div>

                  {/* Client info */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg mb-4"
                    style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border-subtle)" }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(210,112,10,0.12)" }}>
                      <Users size={14} style={{ color: "var(--brand-orange)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{sol.client}</div>
                      <div className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{sol.empresa} · Recibida: {sol.dateSubmitted}</div>
                    </div>
                  </div>

                  {/* Custom description */}
                  {sol.isCustom && sol.customDescription && (
                    <div
                      className="p-3 rounded-lg mb-4"
                      style={{ backgroundColor: "rgba(192,64,184,0.06)", border: "1px solid rgba(192,64,184,0.18)" }}
                    >
                      <div className="text-xs font-semibold mb-1" style={{ color: "#c040b8", fontFamily: "var(--font-mono)" }}>
                        Descripción del pedido personalizado
                      </div>
                      <p className="text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                        {sol.customDescription}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {sol.status === "pendiente" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveSolicitud(sol.id)}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                        style={{ backgroundColor: "#259c57", color: "#ffffff", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1d7a43"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#259c57"; }}
                      >
                        <Check size={15} />
                        Aprobar solicitud
                      </button>
                      <button
                        onClick={() => rejectSolicitud(sol.id)}
                        className="px-5 py-2.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-150"
                        style={{ backgroundColor: "rgba(210,90,10,0.10)", color: "#d25a0a", border: "1px solid rgba(210,90,10,0.30)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(210,90,10,0.18)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(210,90,10,0.10)"; }}
                      >
                        <X size={15} />
                        Rechazar
                      </button>
                    </div>
                  )}
                  {sol.status !== "pendiente" && (
                    <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                      {sol.status === "aprobada" ? "✓ Aprobada — pedido generado automáticamente." : "✗ Solicitud rechazada."}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Pedidos activos ── */}
          {tab === "activos" && (
            <div className="space-y-4">
              {activeOrders.length === 0 ? (
                <div className="rounded-xl p-16 text-center" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                  <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: "var(--section-muted)" }} />
                  <p style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>No hay pedidos activos</p>
                </div>
              ) : (
                activeOrders.map((order) => {
                  const badge = STATUS_BADGES[order.status];
                  const nextLabel = STATUS_NEXT_LABEL[order.status];
                  return (
                    <div key={order.id} className="rounded-xl p-6" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>{order.id}</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: "var(--font-body)" }}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-base font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{order.product}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{order.specs}</div>
                          <div className="text-xs mt-1 font-medium" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-body)" }}>
                            Cliente: {order.client}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>{fmt(order.total)}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{order.quantity} u.</div>
                        </div>
                      </div>

                      <TrackingBar status={order.status} />

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--section-border-subtle)" }}>
                        <div className="flex flex-wrap gap-4 text-xs flex-1" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                          <span>Pedido: {order.dateOrdered}</span>
                          <span>Entrega: <strong style={{ color: "var(--section-body)" }}>{order.dateEstimated}</strong></span>
                        </div>
                        {nextLabel && (
                          <button
                            onClick={() => advanceStatus(order.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95"
                            style={{ backgroundColor: "var(--brand-orange)", color: "#ffffff", fontFamily: "var(--font-body)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-dark)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
                          >
                            {nextLabel}
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Tab: Historial ── */}
          {tab === "historial" && (pedidos.length === 0 ? (
            <div className="rounded-xl p-16 text-center" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
              <History size={40} className="mx-auto mb-3" style={{ color: "var(--section-muted)" }} />
              <p style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>No hay pedidos en el historial</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--section-border)" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: "var(--section-card)", borderColor: "var(--section-border)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                  Todos los pedidos
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(210,112,10,0.12)", color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                  {pedidos.length} pedidos
                </span>
              </div>
              <div style={{ backgroundColor: "var(--section-card)" }}>
                {pedidos.map((order, i) => {
                  const badge = STATUS_BADGES[order.status];
                  return (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4"
                      style={{ borderTop: i > 0 ? "1px solid var(--section-border-subtle)" : "none" }}>
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}>
                          <Package size={16} style={{ color: "var(--brand-orange)" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>{order.id}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: "var(--font-body)" }}>{badge.label}</span>
                          </div>
                          <div className="text-sm font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{order.product}</div>
                          <div className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                            {order.client} · {order.dateOrdered} · {order.quantity} u.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-base font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>{fmt(order.total)}</div>
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150"
                          style={{ border: "1px solid var(--section-border)", color: "var(--section-muted)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                        >
                          <Eye size={12} />
                          Factura
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Tab: Facturas ── */}
          {tab === "facturas" && (pedidos.length === 0 ? (
            <div className="rounded-xl p-16 text-center" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
              <ReceiptText size={40} className="mx-auto mb-3" style={{ color: "var(--section-muted)" }} />
              <p style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>No hay facturas generadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl px-6 py-4"
                  style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(210,112,10,0.10)", border: "1px solid rgba(210,112,10,0.22)" }}>
                      <FileText size={18} style={{ color: "var(--brand-orange)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>{order.invoiceId}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                        {order.client} · {order.product} · {order.dateOrdered}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-base font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>{fmt(order.total)}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150"
                        style={{ border: "1px solid var(--section-border)", color: "var(--section-muted)", fontFamily: "var(--font-body)", backgroundColor: "transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                      >
                        <Eye size={12} />
                        Ver
                      </button>
                      <button
                        onClick={() => downloadPDF(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150 active:scale-95"
                        style={{ backgroundColor: "var(--brand-orange)", color: "#ffffff", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-dark)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
                      >
                        <Download size={12} />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* ── Tab: Informe mensual ── */}
          {tab === "informe" && (
            <div className="space-y-6">
              {/* KPIs */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-6" style={{ backgroundColor: "var(--brand-orange)" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                    {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Ingresos totales",
                      value: fmt(totalIngresos),
                      sub: "Todos los pedidos",
                      trend: trendIngresos,
                      up: !trendIngresos.startsWith("-"),
                    },
                    {
                      label: "Ingresos confirmados",
                      value: fmt(ingresosConfirmados),
                      sub: "Pedidos entregados",
                      trend: trendIngresosConf,
                      up: !trendIngresosConf.startsWith("-"),
                    },
                    {
                      label: "Pedidos en proceso",
                      value: String(activeOrders.length),
                      sub: "Preparando + en camino",
                      trend: trendActivos,
                      up: !trendActivos.startsWith("-"),
                    },
                    {
                      label: "Solicitudes recibidas",
                      value: String(solicitudes.length),
                      sub: `${solicitudes.filter(s => s.status === "aprobada").length} aprobadas`,
                      trend: trendSolicitudes,
                      up: !trendSolicitudes.startsWith("-"),
                    },
                  ].map((kpi, i) => (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                      <div className="text-2xl font-bold mb-1" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>
                        {kpi.value}
                      </div>
                      <div className="text-xs mb-2" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{kpi.label}</div>
                      <div className="flex items-center gap-1">
                        {kpi.up
                          ? <TrendingUp size={11} style={{ color: "#259c57", flexShrink: 0 }} />
                          : <TrendingDown size={11} style={{ color: "var(--section-muted)", flexShrink: 0 }} />
                        }
                        <span className="text-xs" style={{ color: kpi.up ? "#259c57" : "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                          {kpi.trend}
                        </span>
                        <span className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                          {" "}vs mes ant.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Weekly chart */}
                <div className="rounded-xl p-6" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                  <h4 className="text-sm font-semibold mb-5" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                    Pedidos esta semana
                  </h4>
                  <div className="flex items-end gap-2" style={{ height: 96 }}>
                    {weekData.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                        {d.orders > 0 && (
                          <span className="text-xs font-bold" style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>
                            {d.orders}
                          </span>
                        )}
                        <div
                          style={{
                            height: d.orders > 0 ? `${Math.round((d.orders / maxWeek) * 64)}px` : "3px",
                            backgroundColor: d.orders > 0 ? "var(--brand-orange)" : "var(--section-border)",
                            borderRadius: "3px 3px 0 0",
                            width: "100%",
                            transition: "height 0.3s ease",
                            opacity: d.orders === 0 ? 0.4 : 1,
                          }}
                        />
                        <span className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estado de pedidos */}
                <div className="rounded-xl p-6" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                  <h4 className="text-sm font-semibold mb-5" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                    Estado de pedidos
                  </h4>
                  <div className="space-y-4">
                    {(["preparando", "en-camino", "listo"] as Order["status"][]).map((s) => {
                      const count = pedidos.filter((o) => o.status === s).length;
                      const pct = pedidos.length > 0 ? Math.round((count / pedidos.length) * 100) : 0;
                      const badge = STATUS_BADGES[s];
                      return (
                        <div key={s}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm" style={{ color: badge.color, fontFamily: "var(--font-body)" }}>{badge.label}</span>
                            <span className="text-xs font-semibold" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                              {count} pedido{count !== 1 ? "s" : ""} · {pct}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--section-card-inner)" }}>
                            <div
                              style={{ width: `${pct}%`, height: "100%", backgroundColor: badge.color, borderRadius: "9999px", transition: "width 0.5s ease" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top clientes */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--section-border)" }}>
                <div className="px-6 py-4 border-b" style={{ backgroundColor: "var(--section-card)", borderColor: "var(--section-border)" }}>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                    Clientes por facturación
                  </h4>
                </div>
                <div style={{ backgroundColor: "var(--section-card)" }}>
                  {topClients.map(([client, revenue], i) => (
                    <div key={client} className="flex items-center gap-4 px-6 py-4"
                      style={{ borderTop: i > 0 ? "1px solid var(--section-border-subtle)" : "none" }}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: i === 0 ? "var(--brand-orange)" : "var(--section-card-inner)", color: i === 0 ? "#ffffff" : "var(--section-muted)", fontFamily: "var(--font-mono)" }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>{client}</div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--section-card-inner)" }}>
                          <div
                            style={{ width: `${Math.round((revenue / maxClientRev) * 100)}%`, height: "100%", backgroundColor: i === 0 ? "var(--brand-orange)" : "var(--section-muted)", borderRadius: "9999px" }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-bold flex-shrink-0" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>
                        {fmt(revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Opiniones ── */}
          {tab === "opiniones" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-display)" }}>
                    Opiniones pendientes de aprobación
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                    Aprobá las que querés mostrar en la web, eliminá las que no.
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: pendingReviews.length > 0 ? "rgba(196,154,8,0.15)" : "var(--section-card-inner)", color: pendingReviews.length > 0 ? "#c49a08" : "var(--section-muted)", fontFamily: "var(--font-mono)" }}
                >
                  {pendingReviews.length} pendiente{pendingReviews.length !== 1 ? "s" : ""}
                </span>
              </div>

              {pendingReviews.length === 0 ? (
                <div className="rounded-xl p-16 text-center" style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}>
                  <CheckCheck size={36} className="mx-auto mb-3" style={{ color: "var(--section-muted)" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>Todo al día</p>
                  <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>No hay opiniones esperando revisión.</p>
                </div>
              ) : (
                pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                            {review.name}
                          </span>
                          {(review.role || review.company) && (
                            <span className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                              {[review.role, review.company].filter(Boolean).join(" · ")}
                            </span>
                          )}
                          <span className="text-xs ml-auto" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                            {new Date(review.created_at).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)", fontWeight: 300 }}>
                          "{review.quote}"
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--section-border)" }}>
                      <button
                        onClick={() => approveReview(review.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95"
                        style={{ backgroundColor: "rgba(37,156,87,0.15)", color: "#259c57", border: "1px solid rgba(37,156,87,0.30)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(37,156,87,0.25)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(37,156,87,0.15)"; }}
                      >
                        <Check size={13} /> Aprobar y publicar
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95"
                        style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.25)", fontFamily: "var(--font-body)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(220,38,38,0.18)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(220,38,38,0.1)"; }}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>}
        </div>

      {selectedInvoice && <InvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} onDownload={() => downloadPDF(selectedInvoice)} />}
    </div>
  );
}
