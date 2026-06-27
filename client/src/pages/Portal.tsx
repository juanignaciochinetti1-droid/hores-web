import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Package,
  ArrowLeft,
  User,
  LogOut,
  Clock,
  Truck,
  CheckCircle2,
  FileText,
  Download,
  Eye,
  ShoppingBag,
  History,
  ReceiptText,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Order {
  id: string;
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

const ORDERS: Order[] = [
  {
    id: "HOR-2025-041",
    product: "Troquel Especial Formato A",
    specs: "350×250 mm · Cuchilla 3pt · Entrega urgente",
    dateOrdered: "01/02/2025",
    dateEstimated: "12/02/2025",
    status: "preparando",
    quantity: 8,
    unitPrice: 12000,
    total: 96000,
    invoiceId: "FAC-A-00041",
  },
  {
    id: "HOR-2025-034",
    product: "Troquel Recto con Hendido",
    specs: "600×400 mm · Cuchilla 2pt · Hendido 4pt",
    dateOrdered: "28/01/2025",
    dateEstimated: "05/02/2025",
    status: "en-camino",
    quantity: 5,
    unitPrice: 18500,
    total: 92500,
    invoiceId: "FAC-A-00034",
  },
  {
    id: "HOR-2025-031",
    product: "Troquel Curvo Premium",
    specs: "450×300 mm · Acero inoxidable · Diseño personalizado",
    dateOrdered: "20/01/2025",
    dateEstimated: "30/01/2025",
    status: "listo",
    quantity: 2,
    unitPrice: 32000,
    total: 64000,
    invoiceId: "FAC-A-00031",
  },
  {
    id: "HOR-2025-028",
    product: "Set Troquelado Completo",
    specs: "800×600 mm · Kit 3 piezas · Alta precisión",
    dateOrdered: "15/01/2025",
    dateEstimated: "29/01/2025",
    status: "listo",
    quantity: 1,
    unitPrice: 78000,
    total: 78000,
    invoiceId: "FAC-A-00028",
  },
];

const STEPS = [
  { key: "preparando", label: "Preparando", icon: Clock },
  { key: "en-camino", label: "En camino", icon: Truck },
  { key: "listo", label: "Entregado", icon: CheckCircle2 },
] as const;

interface StatusBadge { label: string; color: string; bg: string; }
const STATUS_BADGES: Record<Order["status"], StatusBadge> = {
  preparando: { label: "Preparando", color: "oklch(0.78 0.14 75)", bg: "oklch(0.78 0.14 75 / 0.12)" },
  "en-camino": { label: "En camino", color: "oklch(0.60 0.18 225)", bg: "oklch(0.60 0.18 225 / 0.12)" },
  listo: { label: "Entregado", color: "oklch(0.55 0.16 152)", bg: "oklch(0.55 0.16 152 / 0.12)" },
};

function TrackingBar({ status }: { status: Order["status"] }) {
  const stepIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= stepIndex;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ minWidth: 60 }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: done ? "var(--brand-orange)" : "var(--section-card-inner)",
                  border: `2px solid ${done ? "var(--brand-orange)" : "var(--section-border)"}`,
                }}
              >
                <Icon size={15} color={done ? "oklch(0.12 0.005 285)" : "var(--section-muted)"} />
              </div>
              <span
                className="text-xs text-center leading-tight"
                style={{
                  color: done ? "var(--brand-orange)" : "var(--section-muted)",
                  fontFamily: "var(--font-body)",
                  fontWeight: done ? 600 : 400,
                  maxWidth: 58,
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

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });
  const subtotal = Math.round(order.total / 1.21);
  const iva = order.total - subtotal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "oklch(0 0 0 / 70%)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b flex items-start justify-between"
          style={{ borderColor: "var(--section-border)" }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-7 h-7 flex items-center justify-center rounded"
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                <Package size={14} color="oklch(0.12 0.005 285)" strokeWidth={2.5} />
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
              >
                HORES Cartotécnica
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              Buenos Aires, Argentina
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <div
                className="text-lg font-bold"
                style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
              >
                {order.invoiceId}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                Fecha: {order.dateOrdered}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded transition-colors"
              style={{ color: "var(--section-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border-subtle)" }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}
            >
              Facturado a
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
              Cliente registrado
            </div>
          </div>

          {/* Items */}
          <div>
            <div
              className="grid grid-cols-12 text-xs font-semibold uppercase tracking-wider pb-2 mb-2 border-b"
              style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)", borderColor: "var(--section-border)" }}
            >
              <span className="col-span-6">Descripción</span>
              <span className="col-span-2 text-center">Cant.</span>
              <span className="col-span-2 text-right">P. Unit.</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="grid grid-cols-12 text-sm py-2">
              <div className="col-span-6">
                <div className="font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                  {order.product}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                  {order.specs}
                </div>
              </div>
              <span className="col-span-2 text-center text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-body)" }}>
                {order.quantity}
              </span>
              <span className="col-span-2 text-right text-sm" style={{ color: "var(--section-body)", fontFamily: "var(--font-mono)" }}>
                {fmt(order.unitPrice)}
              </span>
              <span className="col-span-2 text-right text-sm font-medium" style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}>
                {fmt(order.total)}
              </span>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--section-border)" }}>
            <div className="flex justify-between text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              <span>Subtotal (neto)</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
              <span>IVA 21%</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{fmt(iva)}</span>
            </div>
            <div
              className="flex justify-between text-base font-bold pt-2 border-t"
              style={{ borderColor: "var(--section-border)" }}
            >
              <span style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>TOTAL</span>
              <span style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
            style={{
              backgroundColor: "var(--brand-orange)",
              color: "oklch(0.12 0.005 285)",
              fontFamily: "var(--font-body)",
            }}
          >
            <Download size={14} />
            Descargar PDF
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm rounded-lg border transition-colors duration-150"
            style={{
              borderColor: "var(--section-border)",
              color: "var(--section-muted)",
              fontFamily: "var(--font-body)",
              backgroundColor: "transparent",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Portal() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [logged, setLogged] = useState(false);
  const [clientName, setClientName] = useState("");
  const [tab, setTab] = useState<"activos" | "historial" | "facturas">("activos");
  const [loginForm, setLoginForm] = useState({ email: "", code: "" });
  const [loginError, setLoginError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  const activeOrders = ORDERS.filter((o) => o.status !== "listo");

  useEffect(() => {
    if (selectedInvoice) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => { document.documentElement.style.overflow = ""; };
  }, [selectedInvoice]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.code) {
      setLoginError("Completá todos los campos para continuar.");
      return;
    }
    setClientName(loginForm.email.split("@")[0]);
    setLogged(true);
  };

  const handleLogout = () => {
    setLogged(false);
    setLoginForm({ email: "", code: "" });
    setClientName("");
    setTab("activos");
  };

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--section-card-inner)",
    border: "1px solid var(--section-border)",
    color: "var(--section-heading)",
    fontFamily: "var(--font-body)",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    marginBottom: "6px",
    color: "var(--section-muted)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.03em",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--section-bg)" }}>
      {/* Portal header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "var(--navbar-solid-bg)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--section-border)",
        }}
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
                Volver al sitio
              </button>
              <div className="h-4 w-px" style={{ backgroundColor: "var(--section-border)" }} />
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 flex items-center justify-center rounded"
                  style={{ backgroundColor: "var(--brand-orange)" }}
                >
                  <Package size={14} color="oklch(0.12 0.005 285)" strokeWidth={2.5} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                >
                  Portal del Cliente
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded transition-colors duration-150"
                  style={{ color: "var(--section-muted)" }}
                  title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
              {logged && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors duration-150"
                  style={{
                    color: "var(--section-muted)",
                    border: "1px solid var(--section-border)",
                    fontFamily: "var(--font-body)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-heading)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                >
                  <LogOut size={13} />
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {!logged ? (
        /* ── LOGIN ── */
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-16">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{
                  backgroundColor: "oklch(0.62 0.19 42 / 0.12)",
                  border: "1px solid oklch(0.62 0.19 42 / 0.25)",
                }}
              >
                <User size={28} style={{ color: "var(--brand-orange)" }} />
              </div>
              <h1
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
              >
                Acceso al Portal
              </h1>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}
              >
                Ingresá con tu email y código de cliente para gestionar tus pedidos y facturas
              </p>
            </div>

            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
            >
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label style={labelStyle}>Email de cliente</label>
                  <input
                    type="email"
                    placeholder="empresa@ejemplo.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Código de acceso</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.code}
                    onChange={(e) => setLoginForm((p) => ({ ...p, code: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand-orange)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--section-border)"; }}
                  />
                </div>
                {loginError && (
                  <p className="text-xs" style={{ color: "oklch(0.65 0.18 25)", fontFamily: "var(--font-body)" }}>
                    {loginError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95"
                  style={{
                    backgroundColor: "var(--brand-orange)",
                    color: "oklch(0.12 0.005 285)",
                    fontFamily: "var(--font-body)",
                    marginTop: "8px",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange)"; }}
                >
                  Ingresar al portal
                </button>
              </form>

              <div
                className="mt-5 pt-4 border-t text-center"
                style={{ borderColor: "var(--section-border-subtle)" }}
              >
                <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                  ¿No tenés código de acceso?{" "}
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      color: "var(--brand-orange)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "inherit",
                    }}
                  >
                    Contactanos
                  </button>
                </p>
              </div>
            </div>

            <div
              className="mt-4 p-3 rounded-lg text-center"
              style={{
                backgroundColor: "oklch(0.62 0.19 42 / 0.07)",
                border: "1px solid oklch(0.62 0.19 42 / 0.18)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-mono)" }}>
                Modo demo · ingresá cualquier email y código
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── DASHBOARD ── */
        <div className="container py-10">
          {/* Welcome */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--section-heading)" }}
            >
              Hola,{" "}
              <span style={{ color: "var(--brand-orange)" }}>{clientName}</span>
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)", fontWeight: 300 }}
            >
              Hacé seguimiento de tus pedidos, revisá el historial y descargá tus facturas.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Pedidos activos", value: activeOrders.length, color: "var(--brand-orange)" },
              { label: "En preparación", value: ORDERS.filter((o) => o.status === "preparando").length, color: "oklch(0.78 0.14 75)" },
              { label: "En camino", value: ORDERS.filter((o) => o.status === "en-camino").length, color: "oklch(0.60 0.18 225)" },
              { label: "Entregados", value: ORDERS.filter((o) => o.status === "listo").length, color: "oklch(0.55 0.16 152)" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ color: stat.color, fontFamily: "var(--font-mono)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 mb-6 p-1 rounded-lg w-fit overflow-x-auto"
            style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
          >
            {([
              { key: "activos", label: "Pedidos activos", icon: ShoppingBag },
              { key: "historial", label: "Historial", icon: History },
              { key: "facturas", label: "Facturas", icon: ReceiptText },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all duration-150 whitespace-nowrap"
                style={{
                  backgroundColor: tab === key ? "var(--section-card)" : "transparent",
                  color: tab === key ? "var(--section-heading)" : "var(--section-muted)",
                  fontFamily: "var(--font-body)",
                  boxShadow: tab === key ? "0 1px 3px oklch(0 0 0 / 12%)" : "none",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Activos ── */}
          {tab === "activos" && (
            <div className="space-y-4">
              {activeOrders.length === 0 ? (
                <div
                  className="rounded-xl p-16 text-center"
                  style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
                >
                  <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: "var(--section-muted)" }} />
                  <p style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                    No tenés pedidos activos en este momento
                  </p>
                </div>
              ) : (
                activeOrders.map((order) => {
                  const badge = STATUS_BADGES[order.status];
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl p-6"
                      style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                            >
                              {order.id}
                            </span>
                            <span
                              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: "var(--font-body)" }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div
                            className="text-base font-semibold"
                            style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}
                          >
                            {order.product}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                          >
                            {order.specs}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className="text-xl font-bold"
                            style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                          >
                            {fmt(order.total)}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                          >
                            {order.quantity} unidad{order.quantity !== 1 ? "es" : ""}
                          </div>
                        </div>
                      </div>

                      <TrackingBar status={order.status} />

                      <div
                        className="flex flex-wrap gap-4 mt-5 pt-4 border-t text-xs"
                        style={{ borderColor: "var(--section-border-subtle)", color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                      >
                        <span>Pedido: {order.dateOrdered}</span>
                        <span>
                          Entrega estimada:{" "}
                          <strong style={{ color: "var(--section-body)" }}>{order.dateEstimated}</strong>
                        </span>
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="flex items-center gap-1 ml-auto transition-colors duration-150"
                          style={{ color: "var(--section-muted)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)"; }}
                        >
                          <FileText size={12} />
                          Ver factura
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Tab: Historial ── */}
          {tab === "historial" && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--section-border)" }}
            >
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ backgroundColor: "var(--section-card)", borderColor: "var(--section-border)" }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}
                >
                  Todos los pedidos
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "oklch(0.62 0.19 42 / 0.12)",
                    color: "var(--brand-orange)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {ORDERS.length} pedidos
                </span>
              </div>
              <div style={{ backgroundColor: "var(--section-card)" }}>
                {ORDERS.map((order, i) => {
                  const badge = STATUS_BADGES[order.status];
                  return (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4"
                      style={{
                        borderTop: i > 0 ? "1px solid var(--section-border-subtle)" : "none",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "var(--section-card-inner)", border: "1px solid var(--section-border)" }}
                        >
                          <Package size={16} style={{ color: "var(--brand-orange)" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "var(--brand-orange)", fontFamily: "var(--font-mono)" }}
                            >
                              {order.id}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: "var(--font-body)" }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}
                          >
                            {order.product}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                          >
                            {order.dateOrdered} · {order.quantity} u.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div
                          className="text-base font-bold"
                          style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                        >
                          {fmt(order.total)}
                        </div>
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150"
                          style={{
                            border: "1px solid var(--section-border)",
                            color: "var(--section-muted)",
                            fontFamily: "var(--font-body)",
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)";
                          }}
                        >
                          <Eye size={12} />
                          Ver factura
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tab: Facturas ── */}
          {tab === "facturas" && (
            <div className="space-y-3">
              {ORDERS.map((order) => (
                <div
                  key={order.invoiceId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl px-6 py-4"
                  style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: "oklch(0.62 0.19 42 / 0.1)",
                        border: "1px solid oklch(0.62 0.19 42 / 0.22)",
                      }}
                    >
                      <FileText size={18} style={{ color: "var(--brand-orange)" }} />
                    </div>
                    <div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                      >
                        {order.invoiceId}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}
                      >
                        {order.product} · {order.dateOrdered}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div
                      className="text-base font-bold"
                      style={{ color: "var(--section-heading)", fontFamily: "var(--font-mono)" }}
                    >
                      {fmt(order.total)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150"
                        style={{
                          border: "1px solid var(--section-border)",
                          color: "var(--section-muted)",
                          fontFamily: "var(--font-body)",
                          backgroundColor: "transparent",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-orange)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-orange)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--section-border)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--section-muted)";
                        }}
                      >
                        <Eye size={12} />
                        Ver
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150 active:scale-95"
                        style={{
                          backgroundColor: "var(--brand-orange)",
                          color: "oklch(0.12 0.005 285)",
                          fontFamily: "var(--font-body)",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-orange-light)"; }}
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
          )}
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}
