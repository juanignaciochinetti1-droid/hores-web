import { useState, useEffect, useRef } from "react";
import { Bell, Mail, FileText, ShoppingCart, CheckCheck, Package, Clock, Truck, CircleCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationItem {
  id: number;
  type: "contact" | "curriculum" | "order" | "my_order";
  name: string;
  email: string;
  status?: string;
  created_at: string;
}

interface NotificationsResponse {
  count: number;
  items: NotificationItem[];
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr + "Z").getTime()) / 1000);
  if (diff < 60) return "ahora mismo";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

const STATUS_LABELS: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pendiente:   { label: "Pendiente",    icon: Clock,         color: "oklch(0.65 0.15 50)" },
  en_proceso:  { label: "En proceso",   icon: Package,       color: "oklch(0.6 0.18 270)" },
  listo:       { label: "Listo",        icon: Truck,         color: "var(--brand-orange)" },
  entregado:   { label: "Entregado",    icon: CircleCheck,   color: "oklch(0.6 0.18 150)" },
};

const TYPE_CONFIG = {
  contact:    { icon: Mail,          label: "Mensaje de contacto",   color: "var(--brand-orange)" },
  curriculum: { icon: FileText,      label: "Candidatura recibida",  color: "oklch(0.6 0.18 270)" },
  order:      { icon: ShoppingCart,  label: "Nuevo pedido",          color: "oklch(0.6 0.18 150)" },
  my_order:   { icon: Package,       label: "Mi pedido",             color: "var(--brand-orange)" },
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [data, setData] = useState<NotificationsResponse>({ count: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("hores_token") : null;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [user, token]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    if (!token) return;
    setMarking(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setData({ count: 0, items: [] });
    } catch {}
    setMarking(false);
    setOpen(false);
  };

  const isClientRole = user?.role === "cliente";

  const headerTitle =
    user?.role === "admin" ? "Notificaciones" :
    user?.role === "empleado" ? "Pedidos pendientes" :
    "Mis compras";

  const badgeCount = isClientRole ? data.items.length : data.count;
  const showMarkRead = !isClientRole && data.count > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded transition-all duration-200"
        style={{ color: open ? "var(--brand-orange)" : "var(--navbar-text)" }}
        title={headerTitle}
      >
        <Bell size={18} />
        {badgeCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none px-0.5"
            style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-lg shadow-2xl overflow-hidden z-[300]"
          style={{ backgroundColor: "var(--section-card)", border: "1px solid var(--section-border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--section-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
              {headerTitle}
            </span>
            {badgeCount > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245,124,0,0.12)", color: "var(--brand-orange)" }}>
                {badgeCount} {isClientRole ? "pedido" + (badgeCount !== 1 ? "s" : "") : "nueva" + (badgeCount !== 1 ? "s" : "")}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="max-h-72 overflow-y-auto">
            {data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Bell size={28} style={{ color: "var(--section-muted)", opacity: 0.4 }} />
                <p className="text-sm" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                  {isClientRole ? "No tenés compras registradas" : "Sin notificaciones nuevas"}
                </p>
              </div>
            ) : (
              data.items.map((item) => {
                const cfg = TYPE_CONFIG[item.type];
                const Icon = cfg.icon;
                const statusCfg = item.status ? STATUS_LABELS[item.status] : null;
                const StatusIcon = statusCfg?.icon;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-start gap-3 px-4 py-3 border-b"
                    style={{ borderColor: "var(--section-border)" }}
                  >
                    <div
                      className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)` }}
                    >
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--section-heading)", fontFamily: "var(--font-body)" }}>
                        {item.name || "—"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                        {cfg.label}
                      </p>
                      {statusCfg && StatusIcon && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <StatusIcon size={11} style={{ color: statusCfg.color }} />
                          <span className="text-[11px]" style={{ color: statusCfg.color, fontFamily: "var(--font-body)" }}>
                            {statusCfg.label}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] whitespace-nowrap mt-0.5 flex-shrink-0" style={{ color: "var(--section-muted)", fontFamily: "var(--font-body)" }}>
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {showMarkRead && (
            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--section-border)" }}>
              <button
                onClick={markAllRead}
                disabled={marking}
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: "rgba(245,124,0,0.1)",
                  color: "var(--brand-orange)",
                  border: "1px solid rgba(245,124,0,0.25)",
                  fontFamily: "var(--font-body)",
                  opacity: marking ? 0.6 : 1,
                }}
              >
                <CheckCheck size={13} />
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
